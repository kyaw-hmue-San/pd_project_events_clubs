import { docId, fail } from '../../shared/domain.js';
import { errorEnvelope } from '../../shared/errors.js';

export function mountLibraryRoutes(app, { db, library }) {
  const buckets = new Map(), inFlight = new Set();
  const acquire = uid => {
    const now = Date.now();
    for (const [id, bucket] of buckets) if (now - bucket.startedAt >= 60000) buckets.delete(id);
    const bucket = buckets.get(uid) || { startedAt: now, count: 0 };
    if (inFlight.has(uid) || bucket.count >= 5 || (!buckets.has(uid) && buckets.size >= 1000)) fail(429, 'LIBRARY_AI_RATE_LIMITED');
    bucket.count++; buckets.set(uid, bucket); inFlight.add(uid);
    return () => inFlight.delete(uid);
  };
  const activityFor = async req => {
    if (!req.user.capabilities.student) fail(403, 'FORBIDDEN');
    const snap = await db.doc(`activities/${docId(req.params.id)}`).get();
    if (!snap.exists || !['PUBLISHED', 'CLOSED'].includes(snap.data().status)) fail(404, 'NOT_FOUND');
    const { title, description } = snap.data();
    return { title, description };
  };
  const handle = action => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { res.json(await action(req)); }
    catch (error) {
      if (['LIBRARY_NOT_CONFIGURED', 'LIBRARY_UNAVAILABLE', 'LIBRARY_INVALID_RESPONSE', 'LIBRARY_RELEVANCE_UNAVAILABLE'].includes(error.message) && [502, 503].includes(error.status)) return res.status(error.status).json(errorEnvelope(error.message));
      throw error;
    }
  };
  app.get('/api/activities/:id/library-resources', handle(async req => {
    await activityFor(req);
    return library.search(req.query);
  }));
  app.get('/api/activities/:id/library-resources/relevance', handle(async req => {
    const activity = await activityFor(req);
    if (Object.keys(req.query).length) fail(400, 'INVALID_LIBRARY_QUERY');
    return library.assess(activity, { beforeRequest: () => acquire(req.user.uid) });
  }));
  app.post('/api/activities/:id/library-resources/suggest', handle(async req => {
    const activity = await activityFor(req);
    if (Object.keys(req.query).length || !req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length) fail(400, 'INVALID_BODY');
    const release = acquire(req.user.uid);
    try { return await library.suggest(activity); }
    finally { release(); }
  }));
}
