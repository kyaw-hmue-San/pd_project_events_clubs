# Approved access workflow — presentation release

Confirmed user scope, 2026-11-04:

- Google sign-in for everyone, with the normal account chooser.
- **Student accounts are only `@lamduan.mfu.ac.th`.** A verified Student creates
  their university-ID profile once. Other email domains cannot enroll as Students.
- A verified Google account can submit **Request Organizer access** with its
  organization and reason. An existing Student retains Student access while the
  request is pending. A personal-email applicant has only their own request/status
  page until approval.
- Admin has one **Organizer requests** screen with **Approve / Reject**. No
  Owner/Super Admin role, Admin appointment UI, general membership queue or
  per-event approval workflow is included.
- Admin appointment is a trusted manual operation. Existing event oversight
  remains read-only; the sole new Admin write API reviews Organizer requests.

## What each person does

1. **Student:** Google sign-in → complete university ID → discover/register/cancel.
   Use Organizer access in the navigation to apply when needed.
2. **Personal-email applicant:** Google sign-in → request form → pending review.
   Rejected applicants see the reason and can update/resubmit. Refresh request
   status after a decision; approved applicants choose Continue to Organizer
   workspace. No invented university ID is needed for a non-Student Organizer.
3. **Admin:** Google sign-in → Organizer requests → inspect identity, organization
   and reason → confirm approval or enter a rejection reason. Approved/Rejected
   tabs preserve the latest request state.
4. **Organizer:** After approval, create/publish/close own activities and view own
   roster using existing ownership-protected APIs.

Roles remain the current three exclusive roles for this MVP. Promotion preserves
existing university ID and registration records; it changes the active workspace
and permissions to Organizer. Combining Student and Organizer permissions is
not part of this release. Admin review never grants Admin or other broad powers.

## Manual Admin appointment with a real Google account

The person first signs in with Google once so Firebase has their real UID. Then
an authorized project operator uses existing server-only Firebase credentials:

```sh
npm run admin:appoint -- --email 'real-admin-email@example.com'
```

This is a **dry run**. Verify its project, Google identity, and proposed role,
then apply the same target explicitly:

```sh
npm run admin:appoint -- --email 'real-admin-email@example.com' --apply
```

Use the actual designated account, not the example. The command requires a
verified, enabled Google-linked account. It preserves existing identity fields,
creates an Admin profile only if needed, and records the assignment. Repeating
an unchanged appointment is idempotent. It never creates a Google account, sets
passwords, or assigns the first person who signs in as Admin. Admin appointment
is not available through a public API or the Admin dashboard.

The local Firebase credential path currently does not exist. Run the command in
an approved environment with working credentials, or correct the private local
credential path without putting the key in chat/Git/browser config. A real Admin
email has not yet been nominated, so no live Admin account was appointed by this
implementation.

## Storage and authorization

- `users/{uid}` remains the authoritative role record. Google proves identity;
  clients cannot choose their effective role through a form or request body.
- `organizerRequests/{sha256(uid)}` stores the latest request and a revision.
  Only that applicant can read their request through the own-request API; only
  Admin can page through requests or review one.
- `organizerRequestDecisions` is a server-only decision history. It is not exposed
  as an Admin log browser or Student roster.
- Approval updates the request, Organizer role, and decision history atomically.
  It preserves existing profile fields. A new non-Student Organizer has a null
  university ID; no false student identifier is manufactured.
- Review rechecks the Firebase account, verified Google linkage and submitted
  email. Self-review, changed applicant identity, stale request versions and
  conflicting repeated decisions are rejected. Repeated identical submission or
  review does not duplicate a pending request or role grant.
- Rejection is not role revocation. Disabled campus profiles cannot submit new
  requests to bypass their disabled status.

## Deployment and verification

Deploy the new `organizerRequests: status ASC, createdAt ASC` index along with
other checked-in indexes. Existing routes and the Team 10 secret-based contracts
remain compatible. `/health` now includes the additive
`apiVersion: 2026-11-04-organizer-access` marker for deployment verification; it
still does not prove database connectivity.

Set `SCHOOL_EMAIL_DOMAIN=lamduan.mfu.ac.th` and exact `FRONTEND_ORIGINS` on the
persistent API. Do not move its worker to serverless or seed real sample users.
The current localhost frontend is configured for the real Firebase project and
Render API. Until that API has the updated code/CORS/indexes, a real-user approval
walkthrough is not verified.

Automated verification uses isolated disposable Google identities and persisted
local Auth/API/Firestore paths. Normal app operation does not use those fixtures.
See root PROGRESS.md for actual counts and release status.
