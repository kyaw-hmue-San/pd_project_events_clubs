# Firebase Events API Contract

**Status:** Updated from `firebase/src/` on 2026-11-04. The original `.mjs` files remain compatibility entrypoints. Local emulator and browser evidence is recorded in `PROGRESS.md`; production CRUD and lecturer approval remain unverified.

## Latest access policy — Organizer request release

The confirmed policy in [ACCESS_WORKFLOW.md](ACCESS_WORKFLOW.md) supersedes the
older blanket school-domain gate described later in this document. Every caller
still needs a verified Google-provider Firebase token with revocation checks.
Student role/enrollment is limited to @lamduan.mfu.ac.th. Verified Google users
from other domains may submit/read only their own Organizer request until Admin
approval creates an Organizer profile. Existing Organizer/Admin profiles are
trusted role assignments and may use other Google email domains. Disabled
profiles are denied, including from the request paths.

| Route | Access and response |
| --- | --- |
| `GET /api/me/organizer-request` | Verified Google identity; own latest `{request:null|request}` only. Admin denied. |
| `POST /api/me/organizer-request` | Verified applicant without Organizer/Admin role; exactly `{organization,reason}`. Organization 1–160 chars, reason 10–1000. Server derives UID/name/email. 201 new submission/resubmission, 200 identical pending retry, 409 differing pending submission or already reviewed approval. |
| `GET /api/admin/organizer-requests?status=PENDING&limit=20&after=<id>` | Admin only. Optional PENDING/APPROVED/REJECTED, default PENDING. Stable createdAt/ID ascending cursor paging, size 1–50. Applicant identity and request fields only; no private student registrations. |
| `PATCH /api/admin/organizer-requests/:id` | Admin only. `{decision:"APPROVE",revision:number}` or `{decision:"REJECT",revision:number,reason:string}`. Rejection reason 1–500 chars. Atomically updates request, role on approval and private decision record. No Admin assignment. |

A request contains id, applicantId, name/email, organization/reason, status,
revision, createdAt/updatedAt, decidedAt and decisionReason. Reviewer UID is kept
in private server records. Rejected requests can be resubmitted with a new
revision. Stale revision, conflicting review, self-review and changed applicant
identity are rejected. Identical repeated reviews are idempotent.

Admin's event interface remains read-only. Its method guard permits only the
specific Organizer-request PATCH path as a new write operation. No arbitrary
Admin mutation, role-management API or fourth role exists. Manual appointment
uses `npm run admin:appoint -- --email ...` (dry run) and explicit `--apply` with
working server credentials; it cannot create Google accounts or passwords.

New personal-email applicants receive `403 ORGANIZER_APPROVAL_REQUIRED` on
campus routes. Only their own request endpoints are available. Student accounts
outside the Student domain remain denied even if an incorrect Student profile
was provisioned manually. Approval preserves existing student identifiers and
registrations, while new non-Student Organizer profiles have universityId null.

New errors: REQUEST_ALREADY_PENDING, REQUEST_ALREADY_REVIEWED, STALE_REQUEST,
APPLICANT_CHANGED, SELF_REVIEW_FORBIDDEN, INVALID_REVIEW, INVALID_ORGANIZATION,
INVALID_REQUEST_REASON, INVALID_DECISION_REASON, ACCOUNT_DISABLED and
ORGANIZER_APPROVAL_REQUIRED. Existing error codes remain compatible.

The new list query needs the checked-in organizerRequests status/createdAt index.
`GET /health` adds apiVersion `2026-11-04-organizer-access` for deployment checks;
this is still only process liveness. The older auth descriptions below are
historical where they conflict with this latest section.

## Common behavior

- API base: the deployed Express service URL; local default is `http://localhost:3000`.
- JSON request bodies are limited to 32 KB. Webhook event bodies are additionally limited to 8 KB by event validation.
- Every `/api/*` request requires `Authorization: Bearer <Firebase ID token>`. The server verifies the token including revocation, requires Google sign-in (`firebase.sign_in_provider=google.com`), verified email, and the exact configured school domain (`lamduan.mfu.ac.th` by default), then loads `users/{uid}` and accepts `STUDENT`, `ORGANIZER`, or `ADMIN` roles. Only Student profiles can be created through first-time school onboarding; privileged roles remain server-provisioned. Admin access is restricted to its own profile and read-only Admin endpoints; it does not inherit Student or Organizer powers.
- The API derives the caller UID and role from Firebase Auth and Firestore, not from request bodies.
- Responses use ISO-8601 UTC strings for Firestore timestamps. Errors use `{"error":{"code":"...","message":"...","fieldErrors":{"field":"..."}}}` (field errors are optional); unexpected server failures return `500 INTERNAL_ERROR` without internal details.
- Requests receive an `X-Request-ID`. Request evidence is logged without authorization headers or request bodies.
- CORS allows exact origins from `FRONTEND_ORIGINS` (default: `http://localhost:5173`); disallowed browser origins receive `403 ORIGIN_NOT_ALLOWED`. Preflight methods and headers are allowlisted. CORS does not replace Firebase token authorization.

## Application routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /health` | Public | None | `200 {"status":"ok"}`; does not test Firestore. |
| `GET /api/me` | School Google identity with a profile | None | `200` with the caller's profile and `id`; a valid first-time school identity receives `403 PROFILE_SETUP_REQUIRED`. |
| `POST /api/me/profile` | Verified school Google identity (no existing profile required); Admin denied | Exactly `{universityId:string}` | `201` with a new Student profile; same-ID retry returns existing profile with `200`. University ID is 1–40 letters, digits or hyphens. The transaction reserves the unique ID claim, checks legacy profiles, and creates the user atomically. Duplicate ID returns `409 UNIVERSITY_ID_TAKEN`; attempted ID changes return `409 PROFILE_ALREADY_EXISTS`. No role/name/email payload is accepted. |
| `GET /api/activities?limit=20&after=<id>` | Authenticated Student or Organizer | Optional integer `limit` 1–50; optional visible activity cursor | `200 {"data":[activity],"nextCursor":"id-or-null"}`. Lists `PUBLISHED` and `CLOSED` activities, ordered by date/time then document ID. |
| `GET /api/activities/:id` | Authenticated Student or Organizer | Activity document ID | `200` for a published or closed activity, or the caller's own draft; otherwise `404`. |
| `POST /api/activities` | Organizer | Required `title`, `description`, `activityType`, `dateTime`, `location`; optional `status` must be `DRAFT` | `201` with created draft; server sets owner, count, and timestamps. `activityType` is `EVENT` or `CLUB_ACTIVITY`. |
| `PATCH /api/activities/:id` | Owning Organizer | Non-empty subset of activity fields and/or `status` | `200` with updated activity. Status values are `DRAFT`, `PUBLISHED`, `CLOSED`; published activities require all descriptive fields. Cannot return a non-draft to `DRAFT` or reopen a `CLOSED` activity. |
| `DELETE /api/activities/:id` | Owning Organizer | Activity document ID | `204` only for an unused `DRAFT` with zero registrations; otherwise `409`. |
| `POST /api/activities/:id/registrations` | Student | Activity document ID; no body required | `201` with a new `ACTIVE` registration. Activity must be `PUBLISHED`; duplicate active registration returns `409 ALREADY_REGISTERED`. Registration, unique active lock, and count update are transactional. |
| `GET /api/me/registrations` | Student | Optional `status=ACTIVE|CANCELLED`, `includeCancelled=true|false`, `limit=1..50`, `after=<id>` | `200 {"data":[registration],"nextCursor":null|"id"}`. Default stays ACTIVE for compatibility; `includeCancelled=true` without status returns both states. Explicit status takes precedence. Newest registeredAt first, then ID descending. Caller-only, default page size 50. Each row embeds a safe `activity` or null. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Optional `limit=1..50`, `after=<id>` | `200 {"data":[registration],"nextCursor":null|"id"}`, newest registeredAt then ID descending; default 50. Includes cancelled records and a minimal `participant: {displayName,email}` or null, resolved only after ownership authorization. |
| `PATCH /api/registrations/:id` | Student who owns registration | Exactly `{"status":"CANCELLED"}` | `200` with the registration. Legacy route retained for compatibility. Cancellation preserves history, releases the active lock, decrements activity count, and is idempotent. |
| `PATCH /api/registrations/:id/cancel` | Student who owns registration | Empty body, or legacy-compatible `{"status":"CANCELLED"}` | `200` with the registration; same ownership and idempotent transaction behavior as the legacy route. |
| `GET /api/integration/partner` | Any authenticated Organizer | None | Calls configured partner API and returns current/degraded state; returns an unconfigured status when no partner URL exists. |
| `GET /api/integration/logs?limit=20` | Organizer whose Firebase UID is in `INTEGRATION_LOG_VIEWER_UIDS` | Optional integer `limit` 1–50 | `200 {"data":[log metadata]}`. Payloads, partner responses, and target URLs are omitted. Other Organizers receive `403`. |

## Google-only school access (2026-11-04 user-requested change)

This is an intentional authentication-policy change from provisioned
email/password access. Existing API URLs remain, but password-provider tokens
are no longer accepted. Existing callers/Postman must obtain a Firebase token
through school Google sign-in. Provider and exact school email checks apply even
to previously provisioned privileged profiles. Partner-key and webhook-secret
contracts are unchanged.

A verified new school identity can only submit `POST /api/me/profile` until
onboarding succeeds. Every other protected route returns PROFILE_SETUP_REQUIRED.
The server derives email/name/UID from the verified token and hardcodes the new
role to STUDENT. Direct client Firestore writes remain denied. No client role
assignment, account merge by email, or overwrite of existing roles is possible.
An existing Organizer can safely repeat setup only with its existing ID; Admin
remains GET-only.

The Google hosted-domain popup hint does not enforce membership. The API checks
the actual token email domain for equality, excluding personal Gmail, lookalike
suffixes and unapproved subdomains. `SCHOOL_EMAIL_DOMAIN` is server configuration;
`VITE_SCHOOL_EMAIL_DOMAIN` only configures frontend wording and picker hints.

Errors include `SCHOOL_GOOGLE_REQUIRED`, `SCHOOL_ACCOUNT_REQUIRED`,
`EMAIL_NOT_VERIFIED`, `PROFILE_SETUP_REQUIRED`, `INVALID_UNIVERSITY_ID`,
`UNIVERSITY_ID_TAKEN`, and `PROFILE_ALREADY_EXISTS` in the standard envelope.
The user-supplied university ID is not an official-registry verification.

See [Google setup and deployment state](GOOGLE_SIGN_IN.md). The existing Render
host has not been updated by this local implementation; live OAuth initiation
was checked, but real-user profile CRUD and browser CORS are not yet verified.

## New Organizer and read-only Admin routes

| Method and path | Access | Behavior |
| --- | --- | --- |
| `GET /api/me/activities?status=DRAFT&limit=20&after=<id>` | Organizer | Own activities across all states by default; optional DRAFT/PUBLISHED/CLOSED filter. Returns `{data,nextCursor}` ordered by dateTime then ID ascending. Server derives owner UID; foreign cursors are rejected. |
| `GET /api/admin/summary` | Admin | `{totalActivities,draft,published,closed,asOf}` using global Firestore count aggregations rather than the current page. No registration total is claimed. |
| `GET /api/admin/activities?status=DRAFT&limit=20&after=<id>` | Admin | All organizers' activities across all states, optional status filter, ordered by dateTime then ID ascending; `{data,nextCursor}`. |
| `GET /api/admin/activities/:id` | Admin | One event, including drafts, projected through the activity allowlist. |

New activity lists default to 20 rows, maximum 50. List cursors must belong to
the same owner/status scope. Student history/roster cursors are similarly scoped
to the authenticated Student or authorized activity.

Activity list/detail responses include `organizerName` from the trusted user's
`name` field, or null if unavailable; no organizer email is exposed. Student
activity details additionally include `viewerRegistrationId`, the caller's active
registration ID or null, so refresh can show authoritative registration state.
No other Student's registration is returned there.

Admin event fields are limited to id, title, description, activityType, dateTime,
location, status, organizerId, registrationCount, createdAt, updatedAt, and
organizerName. Admin cannot read rosters, Student history, diagnostics or partner
consumer data, or use Organizer/Student mutations. No public role-assignment
endpoint exists. The trusted `seed.mjs` supports optional ADMIN_UID and
ADMIN_UNIVERSITY_ID for a distinct existing verified Auth user; never run it
against production as an automatic build step.

Creation/update fields remain title (1–200), description (1–5000), location
(1–200), activityType, dateTime with an explicit UTC/offset timezone, and optional
status. Invalid calendar dates are rejected. End time, capacity, uploads, and
arbitrary categories have not been added to the schema.

The new queries require the checked-in activities organizerId/dateTime,
organizerId/status/dateTime, registrations studentId/registeredAt, and
activityId/registeredAt indexes, in addition to existing indexes. Emulator success
does not prove those composite indexes are deployed on the real project.

## Partner routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /partner/activities?limit=20` | `X-Partner-Key` | Optional integer `limit` 1–50 | `200` with published activities projected to partner fields, request ID, and generated time. |
| `POST /webhooks/partner` | `X-Webhook-Secret` | Event object with `id`, `type`, `occurredAt`, and object `data` | First accepted event returns `201`; exact duplicate ID+payload returns `200` with `duplicate: true`; same ID with different payload returns `409 EVENT_ID_CONFLICT`. |

## Integration worker behavior

- Activity publication and outbox creation occur in the same Firestore transaction. A persistent API process polls due webhook jobs every 30 seconds, leases each for 60 seconds, and retries failed deliveries with delays capped at 5 minutes.
- Webhook retries currently have no maximum-attempt/dead-letter policy. This is unchanged in Phase 2 and remains a reliability follow-up.
- Partner consumer requests are coalesced while in flight. Failed reads return the last successful response as stale data when available; the worker retries a degraded consumer state after its next check time.
- Emulator tests cover the existing provider route, webhook authentication/idempotency/conflict behavior, and unconfigured consumer response. They do not call Team 10 or verify a live retry/recovery cycle.

## Current errors

- `400`: malformed ID/body, unknown or invalid fields, invalid date/time, invalid limit/cursor, or invalid webhook event.
- `401`: missing/invalid/revoked Firebase token or invalid partner/webhook secret.
- `403`: unverified email, unprovisioned role, wrong role, failed ownership check, unapproved CORS origin, or denied preflight.
- `404`: missing resource or activity not visible to caller.
- `409`: duplicate registration, closed/non-published activity registration, invalid lifecycle/deletion, registration integrity failure, or webhook ID conflict.
- `500`: unexpected error mapped to `INTERNAL_ERROR`.

## Remaining frontend/deployment requirements

1. Configure `FRONTEND_ORIGINS` on the deployed API with the exact deployed HTTPS frontend origin. The local default is for development only.
2. Configure `INTEGRATION_LOG_VIEWER_UIDS` with the dedicated operator Organizer UID(s) if diagnostic-log access is needed. It is deny-by-default when unset.
3. A persistent process runs the integration retry worker. Keep the backend on a persistent host unless the worker is separately redesigned.
4. Isolated emulator and real-browser checks cover the connected local flows; production Auth/Firestore, deployed indexes, HTTPS CORS and partner recovery remain untested. See `PROGRESS.md`.
5. Anonymous published-only browsing remains unresolved (D03). Existing `/api/activities` stays authenticated and includes CLOSED activities; no anonymous route was opened by this implementation.

This contract is an inventory for implementation. API behavior and these unresolved points must be covered by tests before the corresponding frontend features are treated as complete.
