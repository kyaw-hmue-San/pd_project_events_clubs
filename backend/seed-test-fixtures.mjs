import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (projectId !== 'demo-campus-pulse-e2e' ||
    !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '') ||
    !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) {
  throw new Error('Test fixture creation is restricted to the local demo-campus-pulse-e2e Auth/Firestore emulators');
}
const app = initializeApp({ projectId }, 'test-seed');
const auth = getAuth(app);
const db = getFirestore(app);
for (const role of ['STUDENT', 'ORGANIZER', 'ADMIN']) {
  const suffix = role.toLowerCase();
  const uid = `demo-${suffix}`;
  const email = `e2e.${suffix}@lamduan.mfu.ac.th`;
  try { await auth.getUser(uid); }
  catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    await auth.createUser({ uid, email, emailVerified: true, displayName: `Demo ${suffix}` });
  }
  const profile = db.doc(`users/${uid}`);
  if (!(await profile.get()).exists) await profile.create({ name: `Demo ${suffix}`, email, role,
    universityId: `DEMO-${role}`, createdAt: FieldValue.serverTimestamp() });
}
for (const [id, title, activityType, status, days] of [
  ['sample-welcome', 'Sample: Campus Welcome', 'EVENT', 'PUBLISHED', 7],
  ['sample-garden', 'Sample: Community Garden Day', 'CLUB_ACTIVITY', 'PUBLISHED', 14],
  ['sample-film', 'Sample: International Film Night', 'EVENT', 'DRAFT', 21],
  ['sample-closed', 'Sample: Previous Campus Workshop', 'EVENT', 'CLOSED', -7]
]) {
  const ref = db.doc(`activities/${id}`);
  if (!(await ref.get()).exists) await ref.create({ title, activityType, status,
    description: 'Clearly labeled sample activity for the isolated local demonstration. Changes are persisted in the emulator.',
    dateTime: Timestamp.fromMillis(Date.now() + days * 86400000), location: 'Demo Campus Hall',
    organizerId: 'demo-organizer', registrationCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
}
await deleteApp(app);
console.log('Isolated automated-test fixtures ready; these are not real school accounts.');
