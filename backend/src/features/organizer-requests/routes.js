import { fail, hash, docId, row, stamp } from '../../shared/domain.js';
import { paginate, statusFilter } from '../../shared/pagination.js';

const projection = snap => {
  const data = row(snap);
  const fields = ['applicantId', 'email', 'name', 'organization', 'reason', 'status', 'createdAt', 'updatedAt', 'decidedAt', 'decisionReason', 'revision', 'decisionSource', 'aiReview'];
  if (data.aiReview?.status === 'PROCESSING' && Date.parse(data.aiReview.processingUntil) <= Date.now()) data.aiReview = { ...data.aiReview, status: 'MANUAL_REVIEW', source: 'SYSTEM', summary: 'Analysis was interrupted. Admin will review this request.', reason: 'INTERRUPTED' };
  return { id: snap.id, ...Object.fromEntries(fields.filter(key => key in data).map(key => [key, data[key]])) };
};
const text = (value, min, max, code) => {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(400, code);
  return value.trim();
};

export function mountOrganizerRequestRoutes(app, { db, auth, organizerAdmission }) {
  app.get('/api/me/organizer-request', async (req, res) => {
    if (req.user.role === 'ADMIN') fail(403, 'FORBIDDEN');
    const snap = await db.doc(`organizerRequests/${hash(req.user.uid)}`).get();
    res.json({ request: snap.exists ? projection(snap) : null });
  });
  app.post('/api/me/organizer-request', async (req, res) => {
    if (['ADMIN', 'ORGANIZER'].includes(req.user.role)) fail(403, 'FORBIDDEN');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail(400, 'INVALID_BODY');
    if (Object.keys(req.body).some(key => !['organization', 'reason'].includes(key))) fail(400, 'UNKNOWN_FIELD');
    const organization = text(req.body.organization, 1, 160, 'INVALID_ORGANIZATION');
    const reason = text(req.body.reason, 10, 1000, 'INVALID_REQUEST_REASON');
    const ref = db.doc(`organizerRequests/${hash(req.user.uid)}`);
    const created = await db.runTransaction(async tx => {
      const [existing, profile] = await Promise.all([tx.get(ref), tx.get(db.doc(`users/${req.user.uid}`))]);
      if (profile.exists && ['ADMIN', 'ORGANIZER'].includes(profile.data().role)) fail(403, 'FORBIDDEN');
      if (profile.exists && profile.data().accessStatus === 'DISABLED') fail(403, 'ACCOUNT_DISABLED');
      if (existing.exists && existing.data().status === 'APPROVED') fail(409, 'REQUEST_ALREADY_REVIEWED');
      if (existing.exists && existing.data().status === 'PENDING') {
        if (existing.data().email !== req.identity.email || existing.data().organization !== organization || existing.data().reason !== reason) fail(409, 'REQUEST_ALREADY_PENDING');
        return false;
      }
      tx.set(ref, { applicantId: req.user.uid, email: req.identity.email, name: req.identity.name,
        organization, reason, status: 'PENDING', createdAt: stamp(), updatedAt: stamp(),
        decidedAt: null, decidedBy: null, decisionReason: null, decisionSource: null, aiReview: null, revision: (existing.data()?.revision || 0) + 1 });
      return (existing.data()?.revision || 0) + 1;
    });
    if (created) {
      try { await organizerAdmission.review(ref, created, req.get('Authorization').slice(7)); }
      catch { /* The durable PENDING request remains available to Admin on interruption. */ }
    }
    res.set('Cache-Control', 'no-store');
    res.status(created ? 201 : 200).json(projection(await ref.get()));
  });

  // Admin role/method authorization is mounted before these admin routes.
  app.get('/api/admin/organizer-requests', async (req, res) => {
    if (req.user.role !== 'ADMIN') fail(403, 'FORBIDDEN');
    const status = statusFilter(req.query, ['PENDING', 'APPROVED', 'REJECTED']) || 'PENDING';
    const { docs, nextCursor } = await paginate({ db, collection: 'organizerRequests',
      query: db.collection('organizerRequests').where('status', '==', status).orderBy('createdAt').orderBy('__name__'),
      input: req.query, matches: data => data.status === status });
    res.json({ data: docs.map(projection), nextCursor });
  });
  app.patch('/api/admin/organizer-requests/:id', async (req, res) => {
    if (req.user.role !== 'ADMIN') fail(403, 'FORBIDDEN');
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'INVALID_BODY');
    if (Object.keys(body).some(key => !['decision', 'revision', 'reason'].includes(key))) fail(400, 'UNKNOWN_FIELD');
    if (!['APPROVE', 'REJECT'].includes(body.decision) || !Number.isInteger(body.revision) || body.revision < 1) fail(400, 'INVALID_REVIEW');
    const decisionReason = body.decision === 'REJECT' ? text(body.reason, 1, 500, 'INVALID_DECISION_REASON') : null;
    if (body.decision === 'APPROVE' && body.reason !== undefined) fail(400, 'UNKNOWN_FIELD');
    const ref = db.doc(`organizerRequests/${docId(req.params.id)}`);
    const initial = await ref.get();
    if (!initial.exists) fail(404, 'NOT_FOUND');
    if (initial.data().applicantId === req.user.uid) fail(403, 'SELF_REVIEW_FORBIDDEN');
    let applicant;
    try { applicant = await auth.getUser(initial.data().applicantId); }
    catch (error) { if (error.code === 'auth/user-not-found') fail(409, 'APPLICANT_CHANGED'); throw error; }
    if (applicant.disabled || !applicant.emailVerified || applicant.email?.toLowerCase() !== initial.data().email ||
        !applicant.providerData.some(provider => provider.providerId === 'google.com')) fail(409, 'APPLICANT_CHANGED');
    const decisionRef = db.collection('organizerRequestDecisions').doc();
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, 'NOT_FOUND');
      const request = snap.data();
      if (request.applicantId !== applicant.uid || request.email !== applicant.email.toLowerCase()) fail(409, 'APPLICANT_CHANGED');
      if (request.revision !== body.revision) fail(409, 'STALE_REQUEST');
      const desiredStatus = body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      if (request.status !== 'PENDING') {
        if (request.status === desiredStatus && request.decisionReason === decisionReason) return;
        fail(409, 'REQUEST_ALREADY_REVIEWED');
      }
      const profileRef = db.doc(`users/${request.applicantId}`);
      const profile = await tx.get(profileRef);
      if (profile.exists && (profile.data().role === 'ADMIN' || profile.data().accessStatus === 'DISABLED')) fail(409, 'APPLICANT_CHANGED');
      if (body.decision === 'APPROVE') {
        if (profile.exists) tx.update(profileRef, { role: 'ORGANIZER', organizerApprovedBy: req.user.uid, organizerApprovedAt: stamp(), updatedAt: stamp() });
        else tx.create(profileRef, { name: request.name, email: request.email, role: 'ORGANIZER', universityId: null,
          createdAt: stamp(), updatedAt: stamp(), organizerApprovedBy: req.user.uid, organizerApprovedAt: stamp() });
      }
      tx.update(ref, { status: desiredStatus, decisionSource: 'ADMIN', ...(request.aiReview?.status === 'PROCESSING' ? { aiReview: { status: 'SUPERSEDED', summary: 'Admin reviewed this request before AI finished.' } } : {}), decidedBy: req.user.uid, decidedAt: stamp(), updatedAt: stamp(), decisionReason });
      tx.create(decisionRef, { requestId: ref.id, applicantId: request.applicantId, revision: request.revision,
        decision: body.decision, source: 'ADMIN', reason: decisionReason, reviewerId: req.user.uid, createdAt: stamp() });
    });
    res.json(projection(await ref.get()));
  });
}
