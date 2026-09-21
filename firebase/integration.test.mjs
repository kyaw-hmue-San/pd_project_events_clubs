import test from 'node:test';
import assert from 'node:assert/strict';
import { integrationConfig, validSecret, validateEvent } from './integration.mjs';

test('shared-secret comparison accepts only the exact configured value', () => {
  const secret = 'a'.repeat(32);
  assert.equal(validSecret(secret, secret), true);
  assert.equal(validSecret('b'.repeat(32), secret), false);
  assert.equal(validSecret(undefined, secret), false);
});

test('webhook event validation accepts the documented contract', () => {
  const event = { id: 'partner-evt-001', type: 'notification.delivered',
    occurredAt: '2026-09-20T15:00:00Z', data: { activityId: 'abc' } };
  assert.equal(validateEvent(event), event);
});

test('webhook event validation accepts Team 10 maintenance status changes', () => {
  const event = { id: 'maintenance-event-001', type: 'maintenance.status_changed',
    occurredAt: '2026-09-21T00:00:00.000Z',
    data: { workOrderId: 'redacted-work-order-id', fromStatus: 'OPEN', toStatus: 'ASSIGNED' } };
  assert.equal(validateEvent(event), event);
});

test('webhook event validation rejects malformed and oversized payloads', () => {
  assert.throws(() => validateEvent({ id: '../bad', type: 'x', occurredAt: 'now', data: {} }), /INVALID_WEBHOOK_EVENT/);
  assert.throws(() => validateEvent({ id: 'ok', type: 'x', occurredAt: '2026-09-20T15:00:00Z', data: { value: 'x'.repeat(9000) } }), /INVALID_WEBHOOK_EVENT/);
});

test('integration URLs must be HTTPS and secrets must be strong placeholders', () => {
  assert.throws(() => integrationConfig({ PARTNER_API_URL: 'http://example.com/data' }), /HTTPS URL/);
  assert.throws(() => integrationConfig({ PARTNER_INBOUND_API_KEY: 'short' }), /at least 32/);
  const config = integrationConfig({ PARTNER_API_URL: 'https://example.com/data', PARTNER_INBOUND_API_KEY: 'a'.repeat(32) });
  assert.equal(config.partnerApiUrl, 'https://example.com/data');
  assert.throws(() => integrationConfig({ PARTNER_API_HEADER_NAME: 'bad header' }), /invalid/);
});
