import express from 'express';
import { createHash } from 'node:crypto';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_PROJECT_ID) throw new Error('Set FIREBASE_PROJECT_ID');
initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore();
const app = express();
app.disable('x-powered-by');
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
app.get('/api/activities', async (req, res) => {
  const raw = req.query.limit ?? '20';
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) fail(400, 'INVALID_LIMIT');
  const limit = Number(raw);
  if (limit < 1 || limit > 50) fail(400, 'INVALID_LIMIT');
  let q = db.collection('activities').where('status', '==', 'PUBLISHED').orderBy('dateTime').orderBy('__name__');
  if (req.query.after) {
    const last = await db.doc(`activities/${docId(req.query.after)}`).get();
    if (!last.exists || last.data().status !== 'PUBLISHED') fail(400, 'INVALID_CURSOR');
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
  if (data.status !== 'PUBLISHED' && data.organizerId !== req.user.uid) fail(404, 'NOT_FOUND');
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
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND');
    own(req, snap.data());
    const merged = { ...snap.data(), ...update };
    if (merged.status === 'PUBLISHED') {
      validateActivity({ title: merged.title, description: merged.description, location: merged.location, activityType: merged.activityType, dateTime: merged.dateTime.toDate().toISOString(), status: merged.status });
    }
    if (merged.status === 'DRAFT' && snap.data().status !== 'DRAFT') fail(409, 'CANNOT_RETURN_TO_DRAFT');
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
app.patch('/api/registrations/:id', async (req, res) => {
  if (req.user.role !== 'STUDENT') fail(403, 'FORBIDDEN');
  if (!req.body || Object.keys(req.body).length !== 1 || req.body.status !== 'CANCELLED') fail(400, 'ONLY_CANCELLATION_ALLOWED');
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
});
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('API failure:', err.code || err.name);
  res.status(status).json({ error: { code: status >= 500 ? 'INTERNAL_ERROR' : err.message } });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Campus Events API listening on port ${port}`));
