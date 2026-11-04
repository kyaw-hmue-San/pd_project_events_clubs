import { fail } from '../shared/domain.js';
import { requireGoogleIdentity, isStudentEmail } from '../shared/school-access.js';

export function authenticate({ db, auth, schoolDomain }) {
  return async (req, _res, next) => {
    try {
      const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
      if (!match) fail(401, 'UNAUTHENTICATED');
      let token;
      try { token = await auth.verifyIdToken(match[1], true); }
      catch { fail(401, 'INVALID_TOKEN'); }
      req.identity = requireGoogleIdentity(token);
      req.isStudentEmail = isStudentEmail(req.identity, schoolDomain);
      const user = await db.doc(`users/${token.uid}`).get();
      if (user.exists && user.data().accessStatus === 'DISABLED') fail(403, 'ACCOUNT_DISABLED');
      if (user.exists && !['STUDENT', 'ORGANIZER', 'ADMIN'].includes(user.data().role)) fail(403, 'ACCOUNT_NOT_PROVISIONED');
      const role = user.exists ? user.data().role : null;
      req.user = { uid: token.uid, role };
      // A verified Google identity may request Organizer access, but cannot read campus
      // data or appoint itself before the school-email/profile checks below pass.
      if (['GET', 'POST'].includes(req.method) && ['/me/organizer-request', '/me/organizer-request/'].includes(req.path)) return next();
      if (role === 'STUDENT' && !req.isStudentEmail) fail(403, 'SCHOOL_ACCOUNT_REQUIRED');
      if (!user.exists) {
        if (!req.isStudentEmail) fail(403, 'ORGANIZER_APPROVAL_REQUIRED');
        if (req.method === 'POST' && ['/me/profile', '/me/profile/'].includes(req.path)) return next();
        fail(403, 'PROFILE_SETUP_REQUIRED');
      }
      if (role === 'ADMIN' && !['/me', '/me/'].includes(req.path) && !req.path.startsWith('/admin/')) fail(403, 'FORBIDDEN');
      next();
    } catch (error) { next(error); }
  };
}
