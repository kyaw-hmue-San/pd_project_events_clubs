// Trusted fixture setup for browser tests only; never accepts a real project.
import { createRequire } from 'node:module';
import { randomUUID, createHmac } from 'node:crypto';
import { bindMaintenanceWorkOrder } from '../backend/src/features/integrations/maintenance.js';
import { createIntegration } from '../backend/src/features/integrations/service.js';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const projectId = process.env.FIREBASE_PROJECT_ID;
if (projectId !== 'demo-campus-pulse-e2e' || !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) throw new Error('Maintenance browser fixtures require the isolated local demo emulators');
const [activityId, mode] = process.argv.slice(2);
if (!['link', 'update', 'resolve', 'close', 'stale'].includes(mode)) throw new Error('Choose a supported fixture mode');
const app = initializeApp({ projectId });
try {
  const db = getFirestore(app);
  const binding = await db.doc(`maintenanceBindings/${activityId}`).get();
  const workOrderId = binding.data()?.workOrderId || `test-order-${activityId}`;
  await bindMaintenanceWorkOrder(db, { activityId, workOrderId }, true);
  if (mode !== 'link') {
    const secret = 'isolated-maintenance-fixture-secret-only';
    const integration = createIntegration({ db, config: { inboundSecret: secret }, fetchImpl: () => { throw new Error('External calls forbidden') } });
    const [sequence, status] = mode === 'resolve' ? [4, 'RESOLVED'] : mode === 'close' ? [5, 'CLOSED'] : [2, 'ASSIGNED'];
    const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt: new Date().toISOString(), sequence, version: sequence, data: { workOrderId, toStatus: status, sequence, version: sequence } };
    const rawBody = Buffer.from(JSON.stringify(event));
    await integration.receive(secret, event, 'isolated-browser-setup', { rawBody, signature: 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex'), eventId: event.id, sequence: String(sequence), version: String(sequence) });
  }
  console.log('Isolated maintenance fixture prepared.');
} finally { await deleteApp(app); }
