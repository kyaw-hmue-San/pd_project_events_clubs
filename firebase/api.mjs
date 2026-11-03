import express from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { createIntegration, partnerActivity, requestEvidence } from './integration.mjs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_PROJECT_ID) throw new Error('Set FIREBASE_PROJECT_ID');
const usingFirebaseEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
initializeApp(usingFirebaseEmulators
  ? { projectId: process.env.FIREBASE_PROJECT_ID }
  : { credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore();
const app = express();
const integration = createIntegration({ db });
const frontendOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
for (const origin of frontendOrigins) {
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new Error('FRONTEND_ORIGINS must contain comma-separated exact HTTP(S) origins without paths');
  }
}
const allowedFrontendOrigins = new Set(frontendOrigins);
const corsMethods = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const corsHeaders = new Set(['authorization', 'content-type', 'x-request-id']);
const integrationLogViewers = new Set((process.env.INTEGRATION_LOG_VIEWER_UIDS || '').split(',').map(uid => uid.trim()).filter(Boolean));
const publicIntegrationLogFields = new Set(['kind', 'requestId', 'eventId', 'at', 'source', 'attempt', 'httpStatus', 'outcome', 'recovered', 'durationMs']);
app.disable('x-powered-by');
app.use(requestEvidence(db));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (!origin) return next();
  if (!allowedFrontendOrigins.has(origin)) return res.status(403).json({ error: { code: 'ORIGIN_NOT_ALLOWED' } });

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', [...corsMethods].join(', '));
  res.setHeader('Access-Control-Allow-Headers', [...corsHeaders].join(', '));
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');
  res.vary('Origin');
  if (req.method === 'OPTIONS') {
    const requestedMethod = req.get('Access-Control-Request-Method');
    const requestedHeaders = (req.get('Access-Control-Request-Headers') || '').split(',').map(header => header.trim().toLowerCase()).filter(Boolean);
    if ((requestedMethod && !corsMethods.has(requestedMethod)) || requestedHeaders.some(header => !corsHeaders.has(header))) {
      return res.status(403).json({ error: { code: 'CORS_PREFLIGHT_DENIED' } });
    }
    return res.status(204).end();
  }
  next();
});
app.use(express.json({ limit: '32kb' }));
const fail = (status, code) => { throw Object.assign(new Error(code), { status }); };
const stamp = () => FieldValue.serverTimestamp();
const hash = value => createHash('sha256').update(value).digest('hex');
const docId = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) fail(400, 'INVALID_ID');
  return value;
};
const serialize = value => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
};
const row = snap => ({ id: snap.id, ...serialize(snap.data()) });
const own = (req, activity) => {
  if (req.user.role !== 'ORGANIZER' || activity.organizerId !== req.user.uid) fail(403, 'FORBIDDEN');
};
const fields = ['title', 'description', 'activityType', 'dateTime', 'location', 'status'];
function validateActivity(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'INVALID_BODY');
  if (Object.keys(body).some(k => !fields.includes(k))) fail(400, 'UNKNOWN_FIELD');
  const out = {};
  for (const key of ['title', 'description', 'location']) {
    if (!partial || key in body) {
      const max = key === 'description' ? 5000 : 200;
      if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > max) fail(400, 'INVALID_' + key.toUpperCase());
      out[key] = body[key].trim();
    }
  }
  if (!partial || 'activityType' in body) {
    if (!['EVENT', 'CLUB_ACTIVITY'].includes(body.activityType)) fail(400, 'INVALID_ACTIVITY_TYPE');
    out.activityType = body.activityType;
  }
  if (!partial || 'dateTime' in body) {
    if (typeof body.dateTime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(body.dateTime) || !Number.isFinite(Date.parse(body.dateTime))) fail(400, 'INVALID_DATE_TIME');
    out.dateTime = Timestamp.fromDate(new Date(body.dateTime));
  }
  if ('status' in body) {
    if (!['DRAFT', 'PUBLISHED', 'CLOSED'].includes(body.status)) fail(400, 'INVALID_STATUS');
    out.status = body.status;
  }
  if (partial && !Object.keys(out).length) fail(400, 'EMPTY_UPDATE');
  return out;
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// Partner webhooks use a separate shared secret, never a Firebase user token.
app.post('/webhooks/partner', async (req, res) => {
  const result = await integration.receive(req.get('X-Webhook-Secret'), req.body, req.requestId);
  res.status(result.status).json(result.body);
});
// Small provider interface for the partner group. The API key is shared privately.
app.get('/partner/activities', async (req, res) => {
  integration.authenticatePartner(req.get('X-Partner-Key'));
  const raw = req.query.limit ?? '20';
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 50) fail(400, 'INVALID_LIMIT');
  const result = await db.collection('activities').where('status', '==', 'PUBLISHED')
    .orderBy('dateTime').orderBy('__name__').limit(Number(raw)).get();
  res.json({
    data: result.docs.map(snap => partnerActivity(snap.id, snap.data())),
    requestId: req.requestId,
    generatedAt: new Date().toISOString()
  });
});
app.use('/api', async (req, _res, next) => {
  try {
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
    if (!match) fail(401, 'UNAUTHENTICATED');
    let token;
    try { token = await getAuth().verifyIdToken(match[1], true); }
    catch { fail(401, 'INVALID_TOKEN'); }
    if (!token.email_verified) fail(403, 'EMAIL_NOT_VERIFIED');
    const user = await db.doc(`users/${token.uid}`).get();
    if (!user.exists || !['STUDENT', 'ORGANIZER'].includes(user.data().role)) fail(403, 'ACCOUNT_NOT_PROVISIONED');
    req.user = { uid: token.uid, role: user.data().role };
    next();
  } catch (e) { next(e); }
});
app.get('/api/me', async (req, res) => res.json(row(await db.doc(`users/${req.user.uid}`).get())));
app.get('/api/integration/partner', async (req, res) => {
  if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
  res.json(await integration.consumePartner('api-request', req.requestId));
});
app.get('/api/integration/logs', async (req, res) => {
  if (req.user.role !== 'ORGANIZER' || !integrationLogViewers.has(req.user.uid)) fail(403, 'FORBIDDEN');
  const raw = req.query.limit ?? '20';
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 50) fail(400, 'INVALID_LIMIT');
  const result = await db.collection('integrationLogs').orderBy('at', 'desc').limit(Number(raw)).get();
  const data = result.docs.map(snap => ({
    id: snap.id,
    ...Object.fromEntries(Object.entries(snap.data())
      .filter(([key]) => publicIntegrationLogFields.has(key))
      .map(([key, value]) => [key, serialize(value)]))
  }));
  res.json({ data });
});
app.get('/api/activities', async (req, res) => {
  const raw = req.query.limit ?? '20';
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) fail(400, 'INVALID_LIMIT');
  const limit = Number(raw);
  if (limit < 1 || limit > 50) fail(400, 'INVALID_LIMIT');
  let q = db.collection('activities').where('status', 'in', ['PUBLISHED', 'CLOSED']).orderBy('dateTime').orderBy('__name__');
  if (req.query.after) {
    const last = await db.doc(`activities/${docId(req.query.after)}`).get();
    if (!last.exists || !['PUBLISHED', 'CLOSED'].includes(last.data().status)) fail(400, 'INVALID_CURSOR');
    q = q.startAfter(last);
  }
  const result = await q.limit(limit + 1).get();
  const page = result.docs.slice(0, limit);
  res.json({ data: page.map(row), nextCursor: result.docs.length > limit ? page.at(-1).id : null });
});
app.get('/api/activities/:id', async (req, res) => {
  const snap = await db.doc(`activities/${docId(req.params.id)}`).get();
  if (!snap.exists) fail(404, 'NOT_FOUND');
  const data = snap.data();
  if (!['PUBLISHED', 'CLOSED'].includes(data.status) && data.organizerId !== req.user.uid) fail(404, 'NOT_FOUND');
  res.json(row(snap));
});
app.post('/api/activities', async (req, res) => {
  if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
  const data = validateActivity(req.body);
  if (data.status && data.status !== 'DRAFT') fail(400, 'CREATE_AS_DRAFT');
  const ref = db.collection('activities').doc();
  await ref.create({ ...data, organizerId: req.user.uid, status: 'DRAFT', registrationCount: 0, createdAt: stamp(), updatedAt: stamp() });
  res.status(201).json(row(await ref.get()));
});
app.patch('/api/activities/:id', async (req, res) => {
  const update = validateActivity(req.body, true);
  const ref = db.doc(`activities/${docId(req.params.id)}`);
  const eventId = randomUUID();
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND');
    own(req, snap.data());
    const merged = { ...snap.data(), ...update };
    if (snap.data().status === 'CLOSED' && merged.status !== 'CLOSED') fail(409, 'CANNOT_REOPEN_CLOSED_ACTIVITY');
    if (merged.status === 'PUBLISHED') {
      validateActivity({ title: merged.title, description: merged.description, location: merged.location, activityType: merged.activityType, dateTime: merged.dateTime.toDate().toISOString(), status: merged.status });
    }
    if (merged.status === 'DRAFT' && snap.data().status !== 'DRAFT') fail(409, 'CANNOT_RETURN_TO_DRAFT');
    if (merged.status === 'PUBLISHED' && snap.data().status !== 'PUBLISHED') {
      integration.queuePublication(tx, ref.id, merged, eventId, req.requestId);
    }
    tx.update(ref, { ...update, updatedAt: stamp() });
  });
  res.json(row(await ref.get()));
});
app.delete('/api/activities/:id', async (req, res) => {
  const ref = db.doc(`activities/${docId(req.params.id)}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND');
    own(req, snap.data());
    if (snap.data().status !== 'DRAFT' || snap.data().registrationCount !== 0) fail(409, 'ONLY_UNUSED_DRAFT_CAN_BE_DELETED');
    tx.delete(ref);
  });
  res.status(204).end();
});
app.post('/api/activities/:id/registrations', async (req, res) => {
  if (req.user.role !== 'STUDENT') fail(403, 'FORBIDDEN');
  const activityId = docId(req.params.id);
  const aRef = db.doc(`activities/${activityId}`);
  const lockRef = db.doc(`activeRegistrations/${hash(JSON.stringify([req.user.uid, activityId]))}`);
  const rRef = db.collection('registrations').doc();
  await db.runTransaction(async tx => {
    const [activity, lock] = await Promise.all([tx.get(aRef), tx.get(lockRef)]);
    if (!activity.exists) fail(404, 'NOT_FOUND');
    if (activity.data().status !== 'PUBLISHED') fail(409, 'REGISTRATION_CLOSED');
    if (lock.exists) fail(409, 'ALREADY_REGISTERED');
    tx.create(rRef, { studentId: req.user.uid, activityId, status: 'ACTIVE', registeredAt: stamp(), cancelledAt: null });
    tx.create(lockRef, { studentId: req.user.uid, activityId, registrationId: rRef.id });
    tx.update(aRef, { registrationCount: activity.data().registrationCount + 1, updatedAt: stamp() });
  });
  res.status(201).json(row(await rRef.get()));
});
app.get('/api/me/registrations', async (req, res) => {
  if (req.user.role !== 'STUDENT') fail(403, 'FORBIDDEN');
  const results = await db.collection('registrations').where('studentId', '==', req.user.uid).where('status', '==', 'ACTIVE').orderBy('registeredAt', 'desc').limit(50).get();
  res.json({ data: results.docs.map(row) });
});
app.get('/api/activities/:id/registrations', async (req, res) => {
  const activityId = docId(req.params.id);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(db.doc(`activities/${activityId}`));
    if (!snap.exists) fail(404, 'NOT_FOUND');
    own(req, snap.data());
    return tx.get(db.collection('registrations').where('activityId', '==', activityId).limit(50));
  });
  res.json({ data: result.docs.map(row) });
});
const cancelRegistration = async (req, res) => {
  if (req.user.role !== 'STUDENT') fail(403, 'FORBIDDEN');
  const legacyRoute = req.path === `/api/registrations/${req.params.id}`;
  const hasCancellationBody = req.body && Object.keys(req.body).length === 1 && req.body.status === 'CANCELLED';
  if ((legacyRoute && !hasCancellationBody) || (!legacyRoute && req.body !== undefined && !hasCancellationBody)) {
    fail(400, 'ONLY_CANCELLATION_ALLOWED');
  }
  const ref = db.doc(`registrations/${docId(req.params.id)}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND');
    const registration = snap.data();
    if (registration.studentId !== req.user.uid) fail(403, 'FORBIDDEN');
    if (registration.status === 'CANCELLED') return;
    const aRef = db.doc(`activities/${registration.activityId}`);
    const lockRef = db.doc(`activeRegistrations/${hash(JSON.stringify([req.user.uid, registration.activityId]))}`);
    const [activity, lock] = await Promise.all([tx.get(aRef), tx.get(lockRef)]);
    if (!activity.exists || activity.data().registrationCount < 1 || !lock.exists || lock.data().registrationId !== ref.id) fail(409, 'INTEGRITY_ERROR');
    tx.update(ref, { status: 'CANCELLED', cancelledAt: stamp() });
    tx.delete(lockRef);
    tx.update(aRef, { registrationCount: activity.data().registrationCount - 1, updatedAt: stamp() });
  });
  res.json(row(await ref.get()));
};
app.patch('/api/registrations/:id', cancelRegistration);
app.patch('/api/registrations/:id/cancel', cancelRegistration);
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('API failure:', err.code || err.name);
  res.status(status).json({ error: { code: status >= 500 ? 'INTERNAL_ERROR' : err.message } });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Campus Events API listening on port ${port}`));
integration.start();
