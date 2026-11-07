import { fail, docId } from '../../shared/domain.js';
import { paginate, statusFilter } from '../../shared/pagination.js';
import { safeActivity, withOrganizerNames } from '../../shared/projections.js';

export function mountAdminRoutes(app, { db }) {
  app.use('/api/admin', (req, _res, next) => {
    if (req.user.role !== 'ADMIN') return next(Object.assign(new Error('FORBIDDEN'), { status: 403 }));
    const organizerDecision = req.method === 'PATCH' && /^\/organizer-requests\/[A-Za-z0-9_-]{1,128}\/?$/.test(req.path);
    if (!['GET', 'HEAD'].includes(req.method) && !organizerDecision) return next(Object.assign(new Error('FORBIDDEN'), { status: 403 }));
    next();
  });
  app.get('/api/admin/summary', async (_req, res) => {
    const activities = db.collection('activities');
    const count = async query => (await query.count().get()).data().count;
    const [totalActivities, draft, published, closed] = await Promise.all([
      count(activities), ...['DRAFT', 'PUBLISHED', 'CLOSED'].map(status => count(activities.where('status', '==', status)))
    ]);
    res.json({ totalActivities, draft, published, closed, asOf: new Date().toISOString() });
  });
  app.get('/api/admin/activities', async (req, res) => {
    const status = statusFilter(req.query, ['DRAFT', 'PUBLISHED', 'CLOSED']);
    let query = db.collection('activities');
    if (status) query = query.where('status', '==', status);
    const { docs, nextCursor } = await paginate({ db, collection: 'activities',
      query: query.orderBy('dateTime').orderBy('__name__'), input: req.query,
      matches: data => !status || data.status === status });
    res.json({ data: await withOrganizerNames(db, docs.map(safeActivity)), nextCursor });
  });
  app.get('/api/admin/activities/:id', async (req, res) => {
    const snap = await db.collection('activities').doc(docId(req.params.id)).get();
    if (!snap.exists) fail(404, 'NOT_FOUND');
    res.json((await withOrganizerNames(db, [safeActivity(snap)]))[0]);
  });
}
