import { fail, hash, row, stamp } from '../../shared/domain.js';
export function mountUsersRoutes(app, { db }) {
  app.get('/api/me', async (req, res) => res.json(row(await db.doc(`users/${req.user.uid}`).get())));
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
    res.status(created ? 201 : 200).json(row(await profileRef.get()));
  });
}
