import { parseArgs } from 'node:util';
import { applicationDefault, initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { bindMaintenanceWorkOrder } from './src/features/integrations/maintenance.js';

const { values } = parseArgs({ options: { activity: { type: 'string' }, 'work-order': { type: 'string' }, apply: { type: 'boolean', default: false } }, strict: true });
if (!values.activity || !values['work-order']) throw new Error('Provide --activity and --work-order. Default is a dry run; --apply writes the trusted link.');
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Set FIREBASE_PROJECT_ID');
const authEmulated = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST), dbEmulated = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (authEmulated !== dbEmulated || (dbEmulated && !projectId.startsWith('demo-'))) throw new Error('Use both local emulators with a demo project, or neither.');
const app = initializeApp(dbEmulated ? { projectId } : { credential: applicationDefault(), projectId });
try {
  const result = await bindMaintenanceWorkOrder(getFirestore(app), { activityId: values.activity, workOrderId: values['work-order'] }, values.apply);
  console.log(JSON.stringify({ projectId, ...result }));
} catch (error) {
  console.error(/^[A-Z_]+$/.test(error.message) ? error.message : 'Maintenance link failed. Check the private server setup and supplied IDs.');
  process.exitCode = 1;
} finally { await deleteApp(app); }
