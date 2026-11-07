// Trusted operator tool. It never creates Google accounts or resets passwords.
import { parseArgs } from 'node:util';
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const { values } = parseArgs({ options: { email: { type: 'string' }, apply: { type: 'boolean', default: false } }, strict: true });
if (!values.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) throw new Error('Provide --email with the real verified Google account to appoint');
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Set FIREBASE_PROJECT_ID');
const hasAuth = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST), hasFirestore = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (hasAuth !== hasFirestore || (hasAuth && !projectId.startsWith('demo-'))) throw new Error('Emulator setup must use both local emulators and a demo project');
const app = initializeApp(hasAuth ? { projectId } : { credential: applicationDefault(), projectId });
try {
  const auth = getAuth(app), db = getFirestore(app);
  let user;
  try { user = await auth.getUserByEmail(values.email.trim().toLowerCase()); }
  catch (error) { if (error.code === 'auth/user-not-found') throw new Error('This person must complete Google sign-in once before being appointed'); throw error; }
  if (user.disabled || !user.emailVerified || !user.providerData.some(provider => provider.providerId === 'google.com')) throw new Error('The account must be enabled, verified, and linked to Google');
  const ref = db.doc(`users/${user.uid}`);
  if (!values.apply) {
    const previous = await ref.get();
    console.log(JSON.stringify({ dryRun: true, projectId, email: user.email, uid: user.uid, previousRole: previous.data()?.role || null, proposedRole: 'ADMIN' }));
  } else {
    const auditRef = db.collection('roleAssignments').doc();
    await db.runTransaction(async tx => {
      const previous = await tx.get(ref);
      if (previous.data()?.role === 'ADMIN' && previous.data()?.accessStatus !== 'DISABLED') return;
      const update = { role: 'ADMIN', accessStatus: 'ACTIVE', email: user.email, updatedAt: FieldValue.serverTimestamp() };
      if (previous.exists) tx.update(ref, update);
      else tx.create(ref, { ...update, name: user.displayName || null, universityId: null, createdAt: FieldValue.serverTimestamp() });
      tx.create(auditRef, { uid: user.uid, previousRole: previous.data()?.role || null, role: 'ADMIN', source: 'TRUSTED_OPERATOR', createdAt: FieldValue.serverTimestamp() });
    });
    console.log(JSON.stringify({ appointed: true, projectId, uid: user.uid, role: 'ADMIN' }));
  }
} finally { await deleteApp(app); }
