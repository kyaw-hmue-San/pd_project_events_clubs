import { fail, docId, hash, own, stamp, serialize } from '../../shared/domain.js';
import { maintenanceSequences } from './webhook-auth.js';

// Only a secret-verified webhook reaches this projection. An activity ID in an
// arbitrary payload never establishes ownership or a work-order association.
export function maintenanceEvent(event, authenticated = null) {
  const data = event.data;
  if (event.type !== 'maintenance.status_changed' ||
      typeof data?.workOrderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(data.workOrderId) ||
      typeof data.toStatus !== 'string' || !/^[A-Z][A-Z0-9_ -]{0,39}$/.test(data.toStatus)) return null;
  return { workOrderId: data.workOrderId, status: data.toStatus,
    occurredAt: new Date(event.occurredAt).toISOString(), lastEventId: event.id,
    ...(authenticated ? authenticated : {}) };
}

export function latestMaintenance(previous, incoming) {
  if (Number.isInteger(incoming.sequence)) {
    const floor = previous?.sequence ?? maintenanceSequences[previous?.status] ?? 0;
    if ((previous?.sequence !== undefined && incoming.sequence <= floor) || incoming.sequence < floor) return null;
    return { ...incoming, orderingConflict: false };
  }
  if (Number.isInteger(previous?.sequence)) return null;
  if (!previous || Date.parse(incoming.occurredAt) > Date.parse(previous.occurredAt)) return { ...incoming, orderingConflict: false };
  // No partner sequence/version is supplied. Keep older events from regressing
  // the display; equal-time conflicting states are explicitly uncertain.
  if (Date.parse(incoming.occurredAt) === Date.parse(previous.occurredAt) && incoming.status !== previous.status) return { ...previous, orderingConflict: true };
  return null;
}

export async function bindMaintenanceWorkOrder(db, { activityId, workOrderId }, apply = false) {
  docId(activityId); docId(workOrderId);
  const key = hash(workOrderId);
  const activityRef = db.doc(`activities/${activityId}`);
  const bindingRef = db.doc(`maintenanceBindings/${activityId}`);
  const ownerRef = db.doc(`maintenanceWorkOrderLinks/${key}`);
  return db.runTransaction(async tx => {
    const [activity, binding, owner] = await Promise.all([tx.get(activityRef), tx.get(bindingRef), tx.get(ownerRef)]);
    if (!activity.exists) fail(404, 'NOT_FOUND');
    if (!['PUBLISHED', 'CLOSED'].includes(activity.data().status)) fail(409, 'MAINTENANCE_REQUIRES_PUBLISHED');
    if ((binding.exists && binding.data().workOrderId !== workOrderId) || (owner.exists && owner.data().activityId !== activityId)) fail(409, 'MAINTENANCE_LINK_CONFLICT');
    const unchanged = binding.exists && owner.exists;
    if (apply && !unchanged) {
      if (!binding.exists) tx.create(bindingRef, { activityId, workOrderId, workOrderKey: key, linkedAt: stamp(), source: 'TRUSTED_OPERATOR' });
      if (!owner.exists) tx.create(ownerRef, { activityId, linkedAt: stamp() });
    }
    return { dryRun: !apply, activityId, workOrderId, unchanged, applied: apply };
  });
}

export function mountMaintenanceRoutes(app, { db, integration, facilities }) {
  app.get('/api/activities/:id/maintenance/preview', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    res.set('Cache-Control', 'no-store');
    res.json(await facilities.preview(req.user.uid, docId(req.params.id), req.query.category || 'Electrical'));
  });
  app.post('/api/activities/:id/maintenance/requests', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['category', 'revision'].includes(key))) fail(400, 'INVALID_BODY');
    if (!['Electrical', 'Plumbing', 'HVAC', 'Safety'].includes(body.category) || typeof body.revision !== 'string' || !/^[a-f0-9]{64}$/.test(body.revision)) fail(400, 'INVALID_FACILITIES_REQUEST');
    const result = await facilities.submit(req.user.uid, docId(req.params.id), body);
    res.set('Cache-Control', 'no-store'); res.status(result.state === 'SENDING' ? 202 : 200).json(result);
  });
  app.get('/api/activities/:id/maintenance', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    const activityId = docId(req.params.id);
    const activity = await db.doc(`activities/${activityId}`).get();
    if (!activity.exists) fail(404, 'NOT_FOUND');
    own(req, activity.data());
    const binding = await db.doc(`maintenanceBindings/${activityId}`).get();
    let workOrder = null;
    if (binding.exists) {
      const latest = await db.doc(`maintenanceWorkOrders/${hash(binding.data().workOrderId)}`).get();
      const data = latest.data();
      workOrder = { id: binding.data().workOrderId, status: data?.orderingConflict ? null : data?.status || null,
        occurredAt: data?.occurredAt || null, receivedAt: data?.receivedAt ? serialize(data.receivedAt) : null,
        needsReview: Boolean(data?.orderingConflict) };
    }
    res.set('Cache-Control', 'no-store');
    res.json({ notes: activity.data().facilitiesNotes || null, workOrder,
      requestsEnabled: facilities.configured, activityStatus: activity.data().status,
      request: await facilities.state(req.user.uid, activityId),
      webhookConfigured: Boolean(integration.maintenanceWebhookEnabled) });
  });
}
