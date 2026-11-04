import { partnerActivity } from './service.js';
import { fail, serialize } from '../../shared/domain.js';

export function mountIntegrationsRoutes(app, { db, integration, integrationLogViewers, publicIntegrationLogFields }, protectedOnly = false) {
  if (!protectedOnly) {
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
  } else {
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
  }
}
