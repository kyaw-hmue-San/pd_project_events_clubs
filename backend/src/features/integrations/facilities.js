import { randomUUID } from 'node:crypto';
import { fail, docId, hash, stamp, serialize } from '../../shared/domain.js';
import { partnerRequest } from './service.js';
import { maintenanceSequences } from './webhook-auth.js';

export const facilityCategories = ['Electrical', 'Plumbing', 'HVAC', 'Safety'];
export const serializeFacilityPayload = payload => JSON.stringify(Object.fromEntries(['activity_id', 'title', 'description', 'schedule', 'location', 'category'].map(key => [key, payload[key]])));
export function facilitiesConfig(env = process.env) {
  const emulated = env.FIREBASE_PROJECT_ID?.startsWith('demo-') || env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST;
  const enabled = !emulated && env.TEAM10_WORK_ORDERS_ENABLED === 'true';
  const key = env.TEAM10_PARTNER_KEY || '';
  const url = env.TEAM10_WORK_ORDER_API_URL || 'https://maintenanceteam10.vercel.app/api/partner/work-orders';
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/api/partner/work-orders') throw new Error('TEAM10_WORK_ORDER_API_URL must be HTTPS with path /api/partner/work-orders and no credentials, query or fragment');
  const timeZone = env.CAMPUS_TIME_ZONE || 'Asia/Bangkok';
  new Intl.DateTimeFormat('en-GB', { timeZone });
  return { enabled: Boolean(enabled && key.trim() && !/[\r\n]/.test(key) && !/^replace_with_/i.test(key)), key, url: parsed.href, timeZone, timeoutMs: 8000 };
}

export function facilityPayload(activityId, activity, category, timeZone = 'Asia/Bangkok') {
  if (!facilityCategories.includes(category)) fail(400, 'INVALID_FACILITIES_CATEGORY');
  if (typeof activity.facilitiesNotes !== 'string' || !activity.facilitiesNotes.trim()) fail(409, 'FACILITIES_NOTES_REQUIRED');
  const format = date => new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date.toDate());
  return { activity_id: activityId, title: activity.title, description: activity.facilitiesNotes.trim(),
    schedule: `${format(activity.dateTime)}${activity.endDateTime ? ` – ${format(activity.endDateTime)}` : ''} (${timeZone})`,
    location: activity.location, category };
}

export function validateFacilityResponse(result, activityId) {
  const body = result.body;
  if (![200, 201].includes(result.status) || !body || body.success !== true || typeof body.duplicate !== 'boolean' ||
      (result.status === 201 && body.duplicate) || (result.status === 200 && !body.duplicate) || body.activityId !== activityId ||
      typeof body.workOrderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.workOrderId) || !maintenanceSequences[body.status]) fail(502, 'FACILITIES_INVALID_RESPONSE');
  return { workOrderId: body.workOrderId, activityId, status: body.status, duplicate: body.duplicate };
}

function safeRequest(snap, now) {
  if (!snap.exists) return null;
  const data = snap.data();
  return { state: data.state, payload: data.payload, revision: data.revision,
    workOrderId: data.receipt?.workOrderId || null, initialStatus: data.receipt?.status || null,
    duplicate: data.receipt?.duplicate ?? null, error: data.error || null,
    canRetry: data.state === 'RETRYABLE' || (data.state === 'SENDING' && data.leaseUntil.toMillis() <= now()),
    submittedAt: data.submittedAt ? serialize(data.submittedAt) : null };
}

export function createFacilities({ db, config = facilitiesConfig(), fetchImpl = fetch, now = Date.now }) {
  const configured = Boolean(config.enabled);
  async function owner(uid, activityId, tx) {
    const ref = db.doc(`activities/${docId(activityId)}`);
    const snap = tx ? await tx.get(ref) : await ref.get();
    if (!snap.exists) fail(404, 'NOT_FOUND');
    if (snap.data().organizerId !== uid) fail(403, 'FORBIDDEN');
    return snap;
  }
  async function state(uid, activityId) {
    await owner(uid, activityId);
    return safeRequest(await db.doc(`facilitiesRequests/${activityId}`).get(), now);
  }
  async function preview(uid, activityId, category) {
    const activity = await owner(uid, activityId);
    if (!facilityCategories.includes(category)) fail(400, 'INVALID_FACILITIES_CATEGORY');
    const [request, binding] = await db.getAll(db.doc(`facilitiesRequests/${activityId}`), db.doc(`maintenanceBindings/${activityId}`));
    if (binding.exists && request.data()?.state !== 'SENT') fail(409, 'FACILITIES_ALREADY_LINKED');
    if (!['PUBLISHED', 'CLOSED'].includes(activity.data().status)) fail(409, 'MAINTENANCE_REQUIRES_PUBLISHED');
    const payload = request.exists ? request.data().payload : facilityPayload(activityId, activity.data(), category, config.timeZone);
    return { payload, revision: hash(serializeFacilityPayload(payload)), previousAttempt: request.exists, requestsEnabled: configured };
  }
  async function submit(uid, activityId, body) {
    const ref = db.doc(`facilitiesRequests/${docId(activityId)}`);
    const bindingRef = db.doc(`maintenanceBindings/${activityId}`);
    const leaseId = randomUUID();
    const claimed = await db.runTransaction(async tx => {
      const activity = await owner(uid, activityId, tx);
      const [request, binding] = await Promise.all([tx.get(ref), tx.get(bindingRef)]);
      if (request.data()?.state === 'SENT') return null;
      if (binding.exists) fail(409, 'FACILITIES_ALREADY_LINKED');
      if (!['PUBLISHED', 'CLOSED'].includes(activity.data().status)) fail(409, 'MAINTENANCE_REQUIRES_PUBLISHED');
      if (!configured) fail(503, 'FACILITIES_NOT_CONFIGURED');
      const previous = request.data();
      if (previous?.state === 'REVIEW_REQUIRED') fail(409, 'FACILITIES_REVIEW_REQUIRED');
      if (previous?.state === 'SENDING' && previous.leaseUntil.toMillis() > now()) return null;
      const payload = previous?.payload || facilityPayload(activityId, activity.data(), body.category, config.timeZone);
      const revision = hash(serializeFacilityPayload(payload));
      if (body.revision !== revision || body.category !== payload.category) fail(409, 'FACILITIES_STALE_PREVIEW');
      const attempt = { payload, revision, idempotencyKey: previous?.idempotencyKey || randomUUID(), leaseId };
      tx.set(ref, { ...attempt, state: 'SENDING', leaseUntil: new Date(now() + 45000), attempts: (previous?.attempts || 0) + 1,
        createdAt: previous?.createdAt || stamp(), updatedAt: stamp(), error: null }, { merge: true });
      return attempt;
    });
    if (!claimed) return state(uid, activityId);
    let receipt, error = null, partnerHttpStatus = null;
    try {
      const result = await partnerRequest(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json',
        'X-Partner-Key': config.key, 'Idempotency-Key': claimed.idempotencyKey, 'ngrok-skip-browser-warning': 'true' }, body: serializeFacilityPayload(claimed.payload) }, config, fetchImpl);
      partnerHttpStatus = result.status;
      if (!result.ok) fail(502, [400, 409, 422].includes(result.status) ? 'FACILITIES_PARTNER_REJECTED' : [401, 403].includes(result.status) ? 'FACILITIES_PARTNER_AUTH' : result.status === 404 ? 'FACILITIES_PARTNER_NOT_FOUND' : result.status === 429 ? 'FACILITIES_PARTNER_BUSY' : 'FACILITIES_PARTNER_UNAVAILABLE');
      receipt = validateFacilityResponse(result, activityId);
    } catch (cause) {
      error = ['FACILITIES_INVALID_RESPONSE', 'FACILITIES_PARTNER_REJECTED', 'FACILITIES_PARTNER_AUTH', 'FACILITIES_PARTNER_NOT_FOUND', 'FACILITIES_PARTNER_BUSY', 'FACILITIES_PARTNER_UNAVAILABLE'].includes(cause.message) ? cause.message : 'FACILITIES_RESULT_UNCERTAIN';
    }
    await db.runTransaction(async tx => {
      const request = await tx.get(ref);
      if (request.data()?.leaseId !== leaseId || request.data()?.state !== 'SENDING') return;
      // Private diagnostics only: never persist partner bodies, keys or headers.
      if (error) { tx.update(ref, { state: error === 'FACILITIES_PARTNER_REJECTED' ? 'REVIEW_REQUIRED' : 'RETRYABLE', error, partnerHttpStatus, updatedAt: stamp() }); return }
      const orderKey = hash(receipt.workOrderId), reverseRef = db.doc(`maintenanceWorkOrderLinks/${orderKey}`), latestRef = db.doc(`maintenanceWorkOrders/${orderKey}`);
      const [binding, reverse, latest] = await Promise.all([tx.get(bindingRef), tx.get(reverseRef), tx.get(latestRef)]);
      if ((binding.exists && binding.data().workOrderId !== receipt.workOrderId) || (reverse.exists && reverse.data().activityId !== activityId)) {
        tx.update(ref, { state: 'REVIEW_REQUIRED', error: 'FACILITIES_LINK_CONFLICT', updatedAt: stamp() }); return;
      }
      if (!binding.exists) tx.create(bindingRef, { activityId, workOrderId: receipt.workOrderId, workOrderKey: orderKey, source: 'TEAM10_CREATION_RESPONSE', linkedAt: stamp() });
      if (!reverse.exists) tx.create(reverseRef, { activityId, linkedAt: stamp() });
      // A status webhook can arrive before the creation response. Never replace
      // that received status with the API's initial snapshot.
      if (!latest.exists) tx.create(latestRef, { workOrderId: receipt.workOrderId, status: receipt.status, sequence: maintenanceSequences[receipt.status],
        version: maintenanceSequences[receipt.status], occurredAt: new Date(now()).toISOString(), receivedAt: stamp(), orderingConflict: false,
        source: 'TEAM10_CREATION_RESPONSE', lastEventId: null });
      tx.update(ref, { state: 'SENT', receipt, submittedAt: stamp(), updatedAt: stamp(), error: null, partnerHttpStatus });
    });
    return state(uid, activityId);
  }
  return { configured, state, preview, submit };
}
