import { createHash } from 'node:crypto';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const organizerUid = process.env.ORGANIZER_UID;
const studentUid = process.env.STUDENT_UID;
const adminUid = process.env.ADMIN_UID;
if (!projectId || !organizerUid || !studentUid || organizerUid === studentUid) {
  throw new Error('Set FIREBASE_PROJECT_ID, ORGANIZER_UID and STUDENT_UID to distinct existing Auth users');
}
if (adminUid && [organizerUid, studentUid].includes(adminUid)) throw new Error('ADMIN_UID must identify a distinct existing Auth user');
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const auth = getAuth();
const profiles = [
  { uid: organizerUid, universityId: process.env.ORGANIZER_UNIVERSITY_ID, role: 'ORGANIZER', name: 'Demo Organizer' },
  { uid: studentUid, universityId: process.env.STUDENT_UNIVERSITY_ID, role: 'STUDENT', name: 'Demo Student' },
  ...(adminUid ? [{ uid: adminUid, universityId: process.env.ADMIN_UNIVERSITY_ID, role: 'ADMIN', name: 'Demo Admin' }] : [])
];
// Provisioning is a trusted operator action, never a public role-edit endpoint.
for (const profile of profiles) {
  if (!profile.universityId || !/^[A-Za-z0-9-]{1,40}$/.test(profile.universityId)) throw new Error('Set valid demo university IDs');
  const user = await auth.getUser(profile.uid);
  if (!user.email || !user.emailVerified) throw new Error('Demo users need verified email addresses');
  const ref = db.doc(`users/${profile.uid}`);
  const claimRef = db.doc(`universityIds/${createHash('sha256').update(profile.universityId).digest('hex')}`);
  await db.runTransaction(async tx => {
    const [existing, claim] = await Promise.all([tx.get(ref), tx.get(claimRef)]);
    if (claim.exists && claim.data().uid !== profile.uid) throw new Error('University ID already assigned');
    if (existing.exists) {
      if (existing.data().universityId !== profile.universityId || existing.data().role !== profile.role) throw new Error('Existing profile differs; refusing overwrite');
      if (!claim.exists) tx.create(claimRef, { uid: profile.uid });
      return;
    }
    tx.create(ref, { universityId: profile.universityId, name: profile.name, email: user.email, role: profile.role, createdAt: FieldValue.serverTimestamp() });
    if (!claim.exists) tx.create(claimRef, { uid: profile.uid });
  });
}
const ref = db.doc('activities/demo-welcome-event');
await db.runTransaction(async tx => {
  if ((await tx.get(ref)).exists) return;
  tx.create(ref, {
    title: 'Sample: Campus Welcome Event', description: 'Sample demo activity: meet students and discover campus activities.',
    activityType: 'EVENT', dateTime: Timestamp.fromMillis(Date.now() + 7 * 86400000),
    location: 'University Main Hall', organizerId: organizerUid, status: 'PUBLISHED',
    registrationCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
  });
});
console.log('Demo users and activity provisioned. Existing matching documents were preserved.');
