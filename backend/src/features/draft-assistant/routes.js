import { fail } from '../../shared/domain.js';
import { createDraftAssistant } from './service.js';

export function mountDraftAssistantRoutes(app, { draftAssistant = createDraftAssistant(), planningAssistant }) {
  const buckets = new Map();
  const inFlight = new Set();
  const generate = assistant => async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const now = Date.now();
    for (const [uid, bucket] of buckets) if (now - bucket.startedAt >= 60000) buckets.delete(uid);
    const bucket = buckets.get(req.user.uid) || { startedAt: now, count: 0 };
    if (inFlight.has(req.user.uid) || bucket.count >= 5 || (!buckets.has(req.user.uid) && buckets.size >= 1000)) fail(429, 'AI_RATE_LIMITED');
    bucket.count++; buckets.set(req.user.uid, bucket); inFlight.add(req.user.uid);
    try { res.set('Cache-Control', 'no-store'); res.json(await assistant(req.body)); }
    finally { inFlight.delete(req.user.uid); }
  };
  app.post('/api/me/activity-draft', generate(draftAssistant));
  app.post('/api/me/activity-plan', generate(planningAssistant));
}
