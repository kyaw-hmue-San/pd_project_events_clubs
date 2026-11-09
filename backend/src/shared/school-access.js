import { fail } from './domain.js';

export function schoolEmailDomain(env = process.env) {
  const domain = (env.SCHOOL_EMAIL_DOMAIN || 'lamduan.mfu.ac.th').trim().toLowerCase();
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
    throw new Error('SCHOOL_EMAIL_DOMAIN must be one exact student email domain without @ or wildcards');
  }
  return domain;
}

export function requireGoogleIdentity(token) {
  if (token.firebase?.sign_in_provider !== 'google.com') fail(403, 'SCHOOL_GOOGLE_REQUIRED');
  if (!token.email_verified) fail(403, 'EMAIL_NOT_VERIFIED');
  if (typeof token.email !== 'string' || token.email.length > 254 || token.email.split('@').length !== 2 || /\s/.test(token.email)) fail(403, 'INVALID_EMAIL');
  return { uid: token.uid, email: token.email.toLowerCase(),
    name: typeof token.name === 'string' && token.name.trim() ? token.name.trim().slice(0, 200) : null };
}

export const isStudentEmail = (identity, domain) => identity.email.split('@')[1] === domain;

// The primary role stays compatible with existing Organizer ownership checks.
// Approval adds organizing access without removing an enrolled MFU student's
// Student access, including profiles approved before this capability existed.
export function profileCapabilities(profile, studentEmail) {
  return {
    student: studentEmail && (profile?.role === 'STUDENT' ||
      (profile?.role === 'ORGANIZER' && typeof profile.universityId === 'string' && /^[A-Za-z0-9-]{1,40}$/.test(profile.universityId))),
    organizer: profile?.role === 'ORGANIZER',
  };
}
