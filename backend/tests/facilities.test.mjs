import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { facilitiesConfig, facilityPayload, validateFacilityResponse } from '../src/features/integrations/facilities.js';
import { verifyMaintenanceWebhook } from '../src/features/integrations/webhook-auth.js';
import { latestMaintenance } from '../src/features/integrations/maintenance.js';
import { localIntegrationEnvironment } from '../local-api-config.mjs';

const secret = 'isolated-signed-webhook-test-secret-123456';
function signed(sequence = 2, status = 'ASSIGNED') {
  const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt: '2026-11-06T08:00:01.921Z', sequence, version: sequence,
    data: { workOrderId: randomUUID(), fromStatus: 'OPEN', toStatus: status, sequence, version: sequence } };
  const rawBody = Buffer.from(JSON.stringify(event, null, 2));
  return { event, delivery: { rawBody, signature: 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex'), eventId: event.id, sequence: String(sequence), version: String(sequence) } };
}

test('HMAC authenticates exact raw JSON including whitespace, with matching version headers', () => {
  const { event, delivery } = signed();
  assert.deepEqual(verifyMaintenanceWebhook(event, secret, delivery, true), { sequence: 2, version: 2, authentication: 'HMAC_SHA256' });
  assert.throws(() => verifyMaintenanceWebhook(event, secret, { ...delivery, rawBody: Buffer.from(JSON.stringify(event)) }, true), /INVALID_WEBHOOK_SIGNATURE/);
});
test('malformed, short, oversized and tampered signatures fail closed without length exceptions', () => {
  const { event, delivery } = signed();
  for (const signature of ['', 'sha256=1', 'sha256=' + 'a'.repeat(64), 'sha256=' + 'b'.repeat(100)]) assert.throws(() => verifyMaintenanceWebhook(event, secret, { ...delivery, signature }, true), /INVALID_WEBHOOK_SIGNATURE/);
  assert.throws(() => verifyMaintenanceWebhook(event, secret, { ...delivery, rawBody: Buffer.alloc(8193) }, true), /INVALID_WEBHOOK_SIGNATURE/);
});
test('signed event IDs, version copies and lifecycle status mapping must agree', () => {
  const { event, delivery } = signed();
  for (const override of [{ eventId: randomUUID() }, { sequence: '3' }, { version: '1' }]) assert.throws(() => verifyMaintenanceWebhook(event, secret, { ...delivery, ...override }, true), /INVALID_WEBHOOK_METADATA/);
  const mismatch = signed(3, 'ASSIGNED');
  assert.throws(() => verifyMaintenanceWebhook(mismatch.event, secret, mismatch.delivery, true), /INVALID_WEBHOOK_METADATA/);
});
test('legacy webhooks remain compatible by default but cannot downgrade a versioned work order', () => {
  const { event } = signed(); delete event.sequence; delete event.version; delete event.data.sequence; delete event.data.version;
  assert.equal(verifyMaintenanceWebhook(event, secret), null);
  assert.throws(() => verifyMaintenanceWebhook(event, secret, {}, true), /INVALID_WEBHOOK_SIGNATURE/);
  assert.equal(latestMaintenance({ status: 'IN_PROGRESS', sequence: 3 }, { status: 'CLOSED', occurredAt: '2099-01-01T00:00:00Z' }), null);
});
test('monotonic sequence dominates timestamps and ignores equal or older sequences', () => {
  const previous = { status: 'IN_PROGRESS', sequence: 3, occurredAt: '2026-11-06T09:00:00Z' };
  assert.equal(latestMaintenance(previous, { sequence: 2, status: 'ASSIGNED', occurredAt: '2026-11-06T10:00:00Z' }), null);
  assert.equal(latestMaintenance(previous, { sequence: 3, status: 'IN_PROGRESS' }), null);
  assert.equal(latestMaintenance(previous, { sequence: 4, status: 'RESOLVED', occurredAt: '2026-11-06T08:00:00Z' }).status, 'RESOLVED');
});
test('facilities payload contains only saved request fields and an explicit campus timezone', () => {
  const activity = { title: 'Campus workshop', facilitiesNotes: '  Projector setup  ', location: 'Hall A', dateTime: Timestamp.fromDate(new Date('2027-05-15T11:30:00Z')), endDateTime: Timestamp.fromDate(new Date('2027-05-15T17:30:00Z')), organizerId: 'private', email: 'private@example.com', registrationCount: 20 };
  const payload = facilityPayload('activity-one', activity, 'Electrical');
  assert.deepEqual(Object.keys(payload).sort(), ['activity_id', 'title', 'description', 'schedule', 'location', 'category'].sort());
  assert.equal(payload.description, 'Projector setup');
  assert.match(payload.schedule, /2027-05-15 18:30.*2027-05-16 00:30.*Asia\/Bangkok/);
  assert.throws(() => facilityPayload('activity-one', activity, 'Other'), /INVALID_FACILITIES_CATEGORY/);
});
test('creation receipts accept documented initial/duplicate responses and reject mismatched correlation', () => {
  const body = { success: true, duplicate: false, workOrderId: randomUUID(), activityId: 'activity-one', status: 'OPEN' };
  assert.equal(validateFacilityResponse({ status: 201, body }, 'activity-one').status, 'OPEN');
  assert.equal(validateFacilityResponse({ status: 200, body: { ...body, duplicate: true } }, 'activity-one').duplicate, true);
  for (const patch of [{ activityId: 'foreign' }, { workOrderId: '../bad' }, { success: false }, { status: 'ADMIN' }, { duplicate: true }]) assert.throws(() => validateFacilityResponse({ status: 201, body: { ...body, ...patch } }, 'activity-one'), /FACILITIES_INVALID_RESPONSE/);
});
test('normal and emulator configurations cannot consume partner credentials or send work orders', () => {
  assert.equal(facilitiesConfig({ TEAM10_PARTNER_KEY: secret }).enabled, false);
  assert.equal(facilitiesConfig({ TEAM10_PARTNER_KEY: secret, TEAM10_WORK_ORDERS_ENABLED: 'true', FIREBASE_PROJECT_ID: 'demo-test' }).enabled, false);
  assert.throws(() => facilitiesConfig({ TEAM10_WORK_ORDER_API_URL: 'https://partner.example/redirect?key=value' }), /TEAM10_WORK_ORDER_API_URL/);
});
test('explicit facilities mode enables only creation plus signed inbound reception and reuses the confirmed partner key', () => {
  const source = { WEBHOOK_INBOUND_SECRET: secret, PARTNER_API_TOKEN: 'fixture-key', PARTNER_WEBHOOK_URL: 'https://old.example/webhooks', TEAM10_WORK_ORDERS_ENABLED: 'true' };
  const env = localIntegrationEnvironment(source, { facilitiesTest: true });
  assert.equal(env.TEAM10_PARTNER_KEY, 'fixture-key'); assert.equal(env.WEBHOOK_REQUIRE_HMAC, 'true');
  assert.equal(env.PARTNER_WEBHOOK_URL, undefined); assert.equal(env.PARTNER_API_TOKEN, undefined);
  assert.equal(facilitiesConfig(env).enabled, true);
  assert.equal(localIntegrationEnvironment(env).TEAM10_WORK_ORDERS_ENABLED, undefined);
});
