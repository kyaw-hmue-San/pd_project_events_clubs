import { paginate, statusFilter } from '../../shared/pagination.js';
import { safeActivity, withOrganizerNames } from '../../shared/projections.js';
import { fail, stamp, hash, docId, row, own } from '../../shared/domain.js';

export function mountRegistrationsRoutes(app, { db }) {
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
    if (req.query.includeCancelled !== undefined && !['true', 'false'].includes(req.query.includeCancelled)) fail(400, 'INVALID_QUERY');
    const status = statusFilter(req.query, ['ACTIVE', 'CANCELLED']) || (req.query.includeCancelled === 'true' ? undefined : 'ACTIVE');
    let query = db.collection('registrations').where('studentId', '==', req.user.uid);
    if (status) query = query.where('status', '==', status);
    const { docs, nextCursor } = await paginate({ db, collection: 'registrations',
      query: query.orderBy('registeredAt', 'desc').orderBy('__name__', 'desc'), input: req.query, defaultLimit: 50,
      matches: data => data.studentId === req.user.uid && (!status || data.status === status) });
    const activityIds = [...new Set(docs.map(snap => snap.data().activityId))];
    const activities = activityIds.length ? await db.getAll(...activityIds.map(id => db.collection('activities').doc(id))) : [];
    const enriched = await withOrganizerNames(db, activities.filter(snap => snap.exists).map(safeActivity));
    const byId = new Map(enriched.map(activity => [activity.id, activity]));
    res.json({ data: docs.map(snap => ({ ...row(snap), activity: byId.get(snap.data().activityId) || null })), nextCursor });
  });
  app.get('/api/activities/:id/registrations', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const activityId = docId(req.params.id);
    // Authorize before querying or resolving any participant identities.
    const activity = await db.collection('activities').doc(activityId).get();
    if (!activity.exists) fail(404, 'NOT_FOUND');
    own(req, activity.data());
    const { docs, nextCursor } = await paginate({ db, collection: 'registrations',
      query: db.collection('registrations').where('activityId', '==', activityId).orderBy('registeredAt', 'desc').orderBy('__name__', 'desc'),
      input: req.query, defaultLimit: 50, matches: data => data.activityId === activityId });
    const ids = [...new Set(docs.map(snap => snap.data().studentId))];
    const users = ids.length ? await db.getAll(...ids.map(id => db.collection('users').doc(id))) : [];
    const participants = new Map(users.filter(user => user.exists).map(user => [user.id, {
      displayName: typeof user.data().name === 'string' ? user.data().name.slice(0, 200) : null,
      email: typeof user.data().email === 'string' ? user.data().email.slice(0, 254) : null
    }]));
    res.json({ data: docs.map(snap => ({ ...row(snap), participant: participants.get(snap.data().studentId) || null })), nextCursor });
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
}
