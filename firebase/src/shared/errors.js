const messages = {
  UNAUTHENTICATED: 'Sign in to continue.',
  INVALID_TOKEN: 'Your session has expired. Sign in again.',
  EMAIL_NOT_VERIFIED: 'Verify your email before signing in.',
  ACCOUNT_NOT_PROVISIONED: 'Your account has not been assigned a campus role. Contact your project administrator.',
  SCHOOL_GOOGLE_REQUIRED: 'Continue with Google to access Campus Pulse.',
  SCHOOL_ACCOUNT_REQUIRED: 'Student access requires a verified @lamduan.mfu.ac.th Google account.',
  ORGANIZER_APPROVAL_REQUIRED: 'Organizer access requires approval. Submit a request or sign in with your MFU Student account.',
  ACCOUNT_DISABLED: 'Campus access for this account has been disabled. Contact the project administrator.',
  REQUEST_ALREADY_PENDING: 'You already have a pending request. Wait for a decision before submitting another.',
  REQUEST_ALREADY_REVIEWED: 'This request has already been reviewed. Refresh to see its current status.',
  STALE_REQUEST: 'This request changed since you opened it. Refresh before reviewing it.',
  APPLICANT_CHANGED: 'The applicant account changed or is no longer eligible. Refresh and verify the account before reviewing.',
  SELF_REVIEW_FORBIDDEN: 'You cannot review your own Organizer request.',
  INVALID_REVIEW: 'Choose Approve or Reject for the current request version.',
  PROFILE_SETUP_REQUIRED: 'Complete your campus profile to continue.',
  UNIVERSITY_ID_TAKEN: 'That university ID is already assigned to an account. Contact your project administrator.',
  PROFILE_ALREADY_EXISTS: 'Your campus profile already exists. Refresh the page to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested record could not be found.',
  ALREADY_REGISTERED: 'You already have an active registration for this activity.',
  REGISTRATION_CLOSED: 'This activity is no longer accepting registrations.',
  CANNOT_REOPEN_CLOSED_ACTIVITY: 'Closed activities cannot be reopened.',
  CANNOT_RETURN_TO_DRAFT: 'Published activities cannot return to draft.',
  CREATE_AS_DRAFT: 'Create a draft first, then publish it.',
  ONLY_UNUSED_DRAFT_CAN_BE_DELETED: 'Only an unused draft can be deleted.',
  INVALID_CURSOR: 'This page is no longer available. Refresh the list.',
  INVALID_LIMIT: 'Page size must be between 1 and 50.',
  UNKNOWN_FIELD: 'The request contains unsupported fields.',
  EMPTY_UPDATE: 'Provide at least one supported field to update.',
  INTERNAL_ERROR: 'The service could not complete your request. Please try again.',
  ORIGIN_NOT_ALLOWED: 'This application origin is not allowed.',
  CORS_PREFLIGHT_DENIED: 'The requested browser operation is not allowed.'
};
const fields = {
  INVALID_TITLE: ['title', 'Enter a title of 1–200 characters.'],
  INVALID_DESCRIPTION: ['description', 'Enter a description of 1–5000 characters.'],
  INVALID_LOCATION: ['location', 'Enter a location of 1–200 characters.'],
  INVALID_ACTIVITY_TYPE: ['activityType', 'Choose Event or Club activity.'],
  INVALID_DATE_TIME: ['dateTime', 'Enter a valid date and time with an explicit timezone.'],
  INVALID_UNIVERSITY_ID: ['universityId', 'Enter your university ID using 1–40 letters, numbers or hyphens.'],
  INVALID_ORGANIZATION: ['organization', 'Enter your club or organization name (1–160 characters).'],
  INVALID_REQUEST_REASON: ['reason', 'Explain why you need Organizer access (10–1000 characters).'],
  INVALID_DECISION_REASON: ['reason', 'Enter a rejection reason (1–500 characters).']
};
export function errorEnvelope(code) {
  const field = fields[code];
  return { error: { code, message: messages[code] || field?.[1] || 'The request could not be completed. Check your input and try again.',
    ...(field ? { fieldErrors: { [field[0]]: field[1] } } : {}) } };
}
export function handleError(err, _req, res, _next) {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  const code = status >= 500 ? 'INTERNAL_ERROR'
    : err.type === 'entity.parse.failed' ? 'INVALID_BODY'
    : err.type === 'entity.too.large' ? 'BODY_TOO_LARGE'
    : /^[A-Z][A-Z0-9_]+$/.test(err.message) ? err.message : 'INVALID_REQUEST';
  if (status >= 500) console.error('API failure:', err.code || err.name);
  res.status(status).json(errorEnvelope(code));
}
