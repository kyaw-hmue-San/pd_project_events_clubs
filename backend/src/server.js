import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from './app.js';
import { createIntegration } from './features/integrations/service.js';

if (!process.env.FIREBASE_PROJECT_ID) throw new Error('Set FIREBASE_PROJECT_ID');
const emulated = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
initializeApp(emulated ? { projectId: process.env.FIREBASE_PROJECT_ID }
  : { credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore();
const integration = createIntegration({ db });
const app = createApp({ db, auth: getAuth(), integration });
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => console.log(`Campus Events API listening on port ${port}`));
const stopWorker = integration.start();
function shutdown() {
  stopWorker();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
