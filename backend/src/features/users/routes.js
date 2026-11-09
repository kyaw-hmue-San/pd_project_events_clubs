import { fail, hash, row, stamp } from '../../shared/domain.js';
import { profileCapabilities } from '../../shared/school-access.js';
export function mountUsersRoutes(app, { db }) {
  const profileResponse = (snap, req) => ({ ...row(snap), capabilities: profileCapabilities(snap.data(), req.isStudentEmail) });
  app.get('/api/me', async (req, res) => res.json(profileResponse(await db.doc(`users/${req.user.uid}`).get(), req)));
  app.patch('/api/me/profile', async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail(400, 'INVALID_BODY');
    if (Object.keys(req.body).some(key => key !== 'name')) fail(400, 'UNKNOWN_FIELD');
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 80 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) fail(400, 'INVALID_NAME');
    const ref = db.doc(`users/${req.user.uid}`);
    await db.runTransaction(async tx => {
      const profile = await tx.get(ref);
      if (!profile.exists) fail(403, 'ACCOUNT_NOT_PROVISIONED');
      if (profile.data().accessStatus === 'DISABLED') fail(403, 'ACCOUNT_DISABLED');
      tx.update(ref, { name, updatedAt: stamp() });
    });
    res.json(profileResponse(await ref.get(), req));
  });
  app.post('/api/me/profile', async (req, res) => {
    if (!req.isStudentEmail) fail(403, 'SCHOOL_ACCOUNT_REQUIRED');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail(400, 'INVALID_BODY');
    if (Object.keys(req.body).some(key => key !== 'universityId')) fail(400, 'UNKNOWN_FIELD');
    const universityId = typeof req.body.universityId === 'string' ? req.body.universityId.trim() : '';
    if (!/^[A-Za-z0-9-]{1,40}$/.test(universityId)) fail(400, 'INVALID_UNIVERSITY_ID');
    const profileRef = db.doc(`users/${req.user.uid}`);
    const claimRef = db.doc(`universityIds/${hash(universityId)}`);
    const created = await db.runTransaction(async tx => {
      const [profile, claim, legacy] = await Promise.all([
        tx.get(profileRef), tx.get(claimRef),
        tx.get(db.collection('users').where('universityId', '==', universityId).limit(1)),
      ]);
      if (claim.exists && claim.data().uid !== req.user.uid) fail(409, 'UNIVERSITY_ID_TAKEN');
      if (legacy.docs.some(doc => doc.id !== req.user.uid)) fail(409, 'UNIVERSITY_ID_TAKEN');
      if (profile.exists) {
        if (profile.data().universityId !== universityId) fail(409, 'PROFILE_ALREADY_EXISTS');
        if (!claim.exists) tx.create(claimRef, { uid: req.user.uid });
        return false;
      }
      tx.create(profileRef, {
        universityId, name: req.identity.name, email: req.identity.email,
        role: 'STUDENT', createdAt: stamp(),
      });
      if (!claim.exists) tx.create(claimRef, { uid: req.user.uid });
      return true;
    });
    res.status(created ? 201 : 200).json(profileResponse(await profileRef.get(), req));
  });
}
