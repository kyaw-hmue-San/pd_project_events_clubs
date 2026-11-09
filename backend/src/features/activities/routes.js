import { paginate, statusFilter } from '../../shared/pagination.js';
import { safeActivity, ownerActivity, withOrganizerNames } from '../../shared/projections.js';
import { randomUUID } from 'node:crypto';
import { fail, stamp, hash, docId, own, validateActivity, validateActivityPolicy } from '../../shared/domain.js';

export function mountActivitiesRoutes(app, { db, integration }) {
  app.get('/api/me/activities', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const status = statusFilter(req.query, ['DRAFT', 'PUBLISHED', 'CLOSED']);
    let query = db.collection('activities').where('organizerId', '==', req.user.uid);
    if (status) query = query.where('status', '==', status);
    const { docs, nextCursor } = await paginate({ db, collection: 'activities',
      query: query.orderBy('dateTime').orderBy('__name__'), input: req.query,
      matches: data => data.organizerId === req.user.uid && (!status || data.status === status) });
    res.json({ data: await withOrganizerNames(db, docs.map(ownerActivity)), nextCursor });
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
    res.json({ data: await withOrganizerNames(db, page.map(safeActivity)), nextCursor: result.docs.length > limit ? page.at(-1).id : null });
  });
  app.get('/api/activities/:id', async (req, res) => {
    const snap = await db.doc(`activities/${docId(req.params.id)}`).get();
    if (!snap.exists) fail(404, 'NOT_FOUND');
    const data = snap.data();
    if (!['PUBLISHED', 'CLOSED'].includes(data.status) && data.organizerId !== req.user.uid) fail(404, 'NOT_FOUND');
    const activity = (await withOrganizerNames(db, [req.user.role === 'ORGANIZER' && data.organizerId === req.user.uid ? ownerActivity(snap) : safeActivity(snap)]))[0];
    if (req.user.capabilities.student) {
      const lock = await db.doc(`activeRegistrations/${hash(JSON.stringify([req.user.uid, snap.id]))}`).get();
      activity.viewerRegistrationId = lock.exists ? lock.data().registrationId : null;
    }
    res.json(activity);
  });
  app.post('/api/activities', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const data = validateActivity(req.body);
    if (data.status && data.status !== 'DRAFT') fail(400, 'CREATE_AS_DRAFT');
    const ref = db.collection('activities').doc();
    await ref.create({ ...data, organizerId: req.user.uid, status: 'DRAFT', registrationCount: 0, checkedInCount: 0, createdAt: stamp(), updatedAt: stamp() });
    res.status(201).json(ownerActivity(await ref.get()));
  });
  app.patch('/api/activities/:id', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const update = validateActivity(req.body, true);
    const ref = db.doc(`activities/${docId(req.params.id)}`);
    const eventId = randomUUID();
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, 'NOT_FOUND');
      own(req, snap.data());
      const merged = { ...snap.data(), ...update };
      validateActivityPolicy(merged);
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
    res.json(ownerActivity(await ref.get()));
  });
  app.delete('/api/activities/:id', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
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
}
