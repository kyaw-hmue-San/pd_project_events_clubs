# Firebase Events API Contract

**Status:** Updated from `backend/src/` through 2026-11-06. The original `.mjs` files remain compatibility entrypoints. Local emulator and browser evidence is recorded in `PROGRESS.md`; production CRUD and lecturer approval remain unverified.

## Latest access policy — Organizer request release

2026-11-06: AI Organizer admission now supports the user-confirmed policy for all
verified Google applicants, including personal accounts, behind explicit server
configuration. Uncertainty remains PENDING for Admin; no AI rejection. The current
Create activity UI uses the new structured planning endpoint. See **AI admission
and planning additions** below and the linked policy/setup docs. Earlier entries
remain API compatibility/history rather than the current UI.

2026-11-05 AI draft assistant: `POST /api/me/activity-draft` is Organizer-only,
including approved Students with Organizer access. Exact body:
`{topic:string,audience:string,purpose:string,activityType:"EVENT"|"CLUB_ACTIVITY"}`.
Topic/audience are 3–160 normalized characters and purpose 10–600. Returns
`200 {source:"AI"|"TEMPLATE",fallbackReason?:string,draft:{title,description,activityType}}`.
The suggestion is not persisted as an activity. Missing/unavailable/timed-out or
invalid AI responses fall back to a deterministic template; auth and input
errors remain 4xx. Five attempts per UID/minute, one in flight, with 429 on the
per-process limit. Clients cannot supply identity, roles, model or provider keys.
Normal save/publish remains separate. Provider setup/limits and actual verification
are recorded in [AI_DRAFT_ASSISTANT.md](AI_DRAFT_ASSISTANT.md).

2026-11-05 profile addition: all three provisioned roles can update their own
Campus Pulse username (a non-unique display name). `PATCH /api/me/profile` accepts
exactly `{name:string}`; the trimmed value must contain 1–80 characters with no
embedded control characters. It returns the saved profile and server-derived
capabilities. Unknown fields, including UID, email, universityId, role,
capabilities and accessStatus, are rejected. The server resolves only the bearer
user's document and changes only name/updatedAt in a transaction, rechecking that
the profile exists and is enabled. Unprovisioned/disabled users cannot use this
to bypass admission. Existing `POST /api/me/profile` still performs Student
enrollment only. Admin's method guard permits the exact own-profile PATCH in
addition to existing Admin routes; it does not permit any enrollment or other
campus mutations. Google Auth identity and application permissions are unchanged.
Updated display names appear on freshly loaded activity and participant lists;
Organizer-request identity snapshots still use the verified Google identity.

2026-11-05 correction: enrolled MFU Students retain Student permissions after
Organizer approval. `GET /api/me` and profile setup responses include additive
`capabilities: {student:boolean, organizer:boolean}` derived by the server, never
accepted from clients. Primary `role` remains compatible with existing records.
An ORGANIZER additionally receives Student capability only when their verified
Google email matches the exact Student domain and their stored university ID
meets the enrollment format. Existing approved Student profiles therefore work
without migration. Personal Organizers, unenrolled school Organizers, Admins,
disabled profiles and non-school Student identities do not gain Student access.
Registration create/list/cancel and activity viewer-registration state use
Student capability; organizing/ownership and Admin guards remain unchanged.
The frontend offers a workspace switch to callers with both capabilities.

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

Admin's event interface remains read-only. Its write exceptions are the specific
Organizer-request review and exact own-profile username PATCH. No arbitrary
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
- Every `/api/*` request requires `Authorization: Bearer <Firebase ID token>`. The server verifies the token including revocation, Google sign-in (`firebase.sign_in_provider=google.com`) and verified email, then derives access from the trusted profile. Exact `lamduan.mfu.ac.th` enrollment is required for Student capabilities; admitted personal-email Organizers and manually appointed Admins follow the latest access policy above. Clients cannot select a role. Admin has its own profile, bounded Organizer-request review and read-only event oversight; it does not inherit Student or Organizer powers.
- The API derives the caller UID and role from Firebase Auth and Firestore, not from request bodies.
- Responses use ISO-8601 UTC strings for Firestore timestamps. Errors use `{"error":{"code":"...","message":"...","fieldErrors":{"field":"..."}}}` (field errors are optional); unexpected server failures return `500 INTERNAL_ERROR` without internal details.
- Requests receive an `X-Request-ID`. Request evidence is logged without authorization headers or request bodies.
- CORS allows exact origins from `FRONTEND_ORIGINS` (default: `http://localhost:5173`); disallowed browser origins receive `403 ORIGIN_NOT_ALLOWED`. Preflight methods and headers are allowlisted. CORS does not replace Firebase token authorization.

## Application routes

### Activity scheduling, registration and facilities additions — 2026-11-06

Activity create/update additionally accept these optional fields. Missing/null
values preserve legacy unlimited/no-deadline/no-end behavior; existing records
require no migration. Normal title/description/type/start/location validation
still applies. Unknown fields, counters, work-order IDs and status claims cannot
be written through activity CRUD.

| Field | Validation and behavior |
|---|---|
| `maxParticipants` | Integer 1–100,000 or null for unlimited. Updates below the current ACTIVE registration count fail with `409 CAPACITY_BELOW_REGISTRATIONS`, including a race with registration. Checked-in attendees remain ACTIVE and consume a seat. |
| `endDateTime` | ISO UTC/offset timestamp or null. A real calendar date strictly after `dateTime`; overnight/multi-day schedules are allowed. `400 END_BEFORE_START` or `INVALID_END_DATE_TIME` on failure. |
| `registrationDeadline` | ISO UTC/offset timestamp or null. Must be at or before `dateTime`; `400 DEADLINE_AFTER_START` or `INVALID_REGISTRATION_DEADLINE` on failure. A past deadline is permitted to close registration immediately. |
| `facilitiesNotes` | Trimmed string up to 2,000 characters, or null/blank to clear. Control characters except tabs/newlines are rejected. Returned only in the owning Organizer's own-list/detail/create/update responses and own maintenance endpoint. Excluded from Student/general activity lists, other Organizers, Admin, tickets, history and existing publication/provider payloads. Shared with Team 10 only by the explicit reviewed facilities action. Saving notes is not a sent request. |

Relationships are revalidated against the **merged stored event** in the update
transaction, including moving its start without resending its deadline/end.
The registration transaction checks current status, duplicate lock, server time,
deadline, end and capacity before creating the registration/lock and incrementing
the count. Full returns `409 ACTIVITY_FULL`; a reached deadline returns
`409 REGISTRATION_DEADLINE_PASSED`; a reached end returns `409 REGISTRATION_CLOSED`.
Concurrent requests for the last seat cannot both succeed. Cancellation releases
one seat; existing registration cancellation and attendance remain available
after deadline/end under their existing rules. Checked-in cancellation stays
blocked. There is no waitlist or automatic enrollment of another Student.

Public/Admin activity projections add the three policy fields when stored.
Partner provider/publication payloads remain unchanged until a new contract is
agreed with Team 10. The browser displays count/limit/seats left, full/deadline/end
states, campus-time end/deadline and optional creation controls. Time hints refresh
every 15 seconds without API polling; backend enforcement remains authoritative.

Schedule icon controls use app-controlled calendar/time dialogs, with native
typing retained. They commit the same date-only and HH:mm form values, then the
existing campus-wall-time converter produces the UTC timestamps on normal save.
No request is made on picker open/close/cancel, and no API payload or server
validation rule changes for this UI repair.

### Owning-Organizer facilities requests and maintenance status

All three endpoints below require the event's owning Organizer and use
`Cache-Control: no-store`. Student/Admin/foreign Organizer access is denied.

| Method/path | Request | Result |
|---|---|---|
| `GET /api/activities/:id/maintenance` | None | `{notes,webhookConfigured,requestsEnabled,activityStatus,request,workOrder}`. Work order is null or `{id,status,occurredAt,receivedAt,needsReview}`. Configuration flags do not imply reachability. |
| `GET /api/activities/:id/maintenance/preview?category=Electrical` | Category Electrical/Plumbing/HVAC/Safety | `{payload,revision,previousAttempt,requestsEnabled}` for a PUBLISHED/CLOSED activity. Existing attempts return their original immutable payload. Manually linked orders cannot create another request. |
| `POST /api/activities/:id/maintenance/requests` | Exactly `{category,revision}` from reviewed preview | `200` with authoritative local request state; `202` while another lease is SENDING. HTTP 200 alone does not mean partner acceptance. No work-order ID, recipient, status or payload fields accepted. |

`request` is null or `{state,payload,revision,workOrderId,initialStatus,duplicate,
error,canRetry,submittedAt}`. It excludes private key/idempotency/lease fields.
Payload fields are `activity_id,title,description,schedule,location,category`;
server derives saved details and campus-time schedule. Facilities notes are only
shared by explicit reviewed Send, never normal save/publish or list projections.
Preview revisions reject stale first submissions. Private durable requests use a
45-second lease, stable UUID idempotency key and canonical original bytes across
retries. SENT returns its receipt without another call. Uncertain/transient
results become RETRYABLE; definitive partner 400/409/422 or link conflicts become
REVIEW_REQUIRED and block blind retries. A lease-expired SENDING may be retried.

Creation attempts retain a private numeric `partnerHttpStatus` (or null when no
HTTP response was obtained), without partner response bodies/headers. This field
is excluded from owner DTOs. A partner POST 404 returns the existing RETRYABLE
state with error `FACILITIES_PARTNER_NOT_FOUND`, prompting coordinator endpoint
verification. Payload bytes, retry identity, leases and linking rules are unchanged.

Backend sends to Team 10's confirmed HTTPS
`/api/partner/work-orders` with server-only X-Partner-Key, JSON and
Idempotency-Key. Valid receipts require `success:true`, exact matching activityId,
safe workOrderId and supported status, plus 201/duplicate=false or
200/duplicate=true. A duplicate returns the existing order without updating it.
The user approved automatic atomic linking only from this validated creation
response. Both mapping directions enforce uniqueness, cannot replace existing
links, and preserve status received before the receipt. Trusted operator linking
of existing orders remains available. Incoming webhook activityId is ignored for
association. No public arbitrary linking/status management route is added.

The existing `POST /webhooks/partner` requires X-Webhook-Secret. Signed maintenance
events additionally require X-Webhook-Signature (`sha256=<64 lowercase hex>`),
HMAC-SHA256 over exact UTF-8 raw bytes, X-Event-ID equal to UUID-v4 body.id, and
X-Event-Sequence/X-Event-Version matching sequence/version copies at both envelope
and data levels. UTC occurredAt uses milliseconds (`...ss.sssZ`). Per-order
lifecycle/version is OPEN=1, ASSIGNED=2, IN_PROGRESS=3, RESOLVED=4, CLOSED=5.
Only a larger version updates versioned state; timestamps cannot override it.
Legacy secret-only events remain compatible unless WEBHOOK_REQUIRE_HMAC=true;
any supplied signature/version metadata requires full validation, and legacy
updates cannot downgrade versioned state. Legacy equal-time conflicts expose
needsReview. Existing 201/duplicate-200/conflict-409 and inbox/log restrictions
remain. Invalid signature is 401; inconsistent signed metadata is 400.

Normal local dev disables Maintenance/legacy integration. `npm run dev:api:maintenance`
enables inbound-only shared-secret compatibility. `npm run dev:api:facilities`
enables reviewed creation plus HMAC-required maintenance reception while keeping
legacy outbound publication/polling disabled. It privately reuses the existing
partner key only under the user's explicit confirmation. Neither startup nor
normal activity saves contact Team 10. Status polls every 15 seconds while the
owner page is visible; RESOLVED/CLOSED show completion without closing the event.
All new lookups use direct document IDs; no composite index deployment is needed.
See [full payloads, configuration and manual-test steps](MAINTENANCE_CONNECTION.md).

### AI admission and planning additions — 2026-11-06

`POST /api/me/organizer-request` keeps its exact `{organization,reason}` body and
201-created/200-duplicate contract, but a new request revision is now saved PENDING
then assessed. Response remains authoritative: status may already be APPROVED with
`decisionSource:"AI"`, or PENDING for Admin. Existing duplicate submissions do not
trigger a second analysis. An old callback returns current state; it cannot
restore an obsolete revision. Own/Admin request DTOs add optional `decisionSource`
(AI/ADMIN/null) and bounded `aiReview` (status/source/policy/revision, summary,
criterion evidence, concerns, reason, evaluatedAt/model as applicable). PROCESSING
expires to visible manual review after 45 seconds; private leases are excluded.
Admin review remains atomic/idempotent, records ADMIN source and supersedes a
processing assessment. Existing legacy rows without source imply manual review.

User-confirmed CAMPUS_ORGANIZER_V1 permits all verified Google applicants,
including personal accounts, when all four explicit criterion/evidence checks,
consistent/safe flags and no concerns pass; common explicit bypass instructions
block approval independently. Server requires its explicit auto-approval/policy
config, reverified token/account, original revision/text/lease/deadline and valid
profile state. Student enrollment/registrations are preserved; personal accounts
gain Organizer only. No automated rejection or Admin assignment. Failures and
uncertainty remain PENDING. No startup/bulk processing, public model override,
new arbitrary role mutation or direct browser database access. Full rubric and
limits: [Organizer AI admission](ORGANIZER_AI_ADMISSION.md).

`POST /api/me/activity-plan` is Organizer-only, no-store, exact body
`{topic,audience,purpose,activityType,durationMinutes,participants}`. Existing text
brief limits apply; duration integer 15–480, participants integer 1–100,000. Response
`{source:"AI"|"TEMPLATE",fallbackReason?,brief,plan}` with title, description,
agenda `{title,minutes,startMinute,endMinute}[]`, before/during/after checklist,
facilities suggestions, assumptions and composed draft text. Strict bounded schema,
positive integer durations and exact sum are checked server-side, offsets derived
rather than trusted. Provider failure/invalid totals returns fixed complete
TEMPLATE. The existing activity-draft route remains compatible and shares the
five-per-UID/minute, one-in-flight rate guard. Both expose normal 4xx validation.

Planning/applying performs no persistence or partner call. UI applies only selected
text sections, preserves manual fields, requires acknowledgment before replacing
nonempty text, and enforces combined description length. Saved event validation
and facilities Send remain authoritative. No new index or record migration.

### Core application routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /health` | Public | None | `200 {"status":"ok"}`; does not test Firestore. |
| `GET /api/me` | Verified Google identity with an admitted Student, Organizer or Admin profile | None | `200` with the caller's profile, `id` and server-derived `capabilities`; a valid first-time school identity receives `403 PROFILE_SETUP_REQUIRED`. |
| `PATCH /api/me/profile` | Own admitted profile, all three roles | Exactly `{name:string}` | `200` with the saved profile and capabilities. Trimmed display name 1–80 characters, no embedded controls; only name/updatedAt change. Unknown fields denied, no third-party profile target or enrollment bypass. |
| `POST /api/me/profile` | Verified school Google identity (no existing profile required); Admin denied | Exactly `{universityId:string}` | `201` with a new Student profile; same-ID retry returns existing profile with `200`. University ID is 1–40 letters, digits or hyphens. The transaction reserves the unique ID claim, checks legacy profiles, and creates the user atomically. Duplicate ID returns `409 UNIVERSITY_ID_TAKEN`; attempted ID changes return `409 PROFILE_ALREADY_EXISTS`. No role/name/email payload is accepted. |
| `GET /api/activities?limit=20&after=<id>` | Authenticated Student or Organizer | Optional integer `limit` 1–50; optional visible activity cursor | `200 {"data":[activity],"nextCursor":"id-or-null"}`. Lists `PUBLISHED` and `CLOSED` activities, ordered by date/time then document ID. |
| `GET /api/activities/:id` | Authenticated Student or Organizer | Activity document ID | `200` for a published or closed activity, or the caller's own draft; otherwise `404`. |
| `POST /api/activities` | Organizer | Required `title`, `description`, `activityType`, `dateTime`, `location`; optional `status` must be `DRAFT` | `201` with created draft; server sets owner, count, and timestamps. `activityType` is `EVENT` or `CLUB_ACTIVITY`. |
| `PATCH /api/activities/:id` | Owning Organizer | Non-empty subset of activity fields and/or `status` | `200` with updated activity. Status values are `DRAFT`, `PUBLISHED`, `CLOSED`; published activities require all descriptive fields. Cannot return a non-draft to `DRAFT` or reopen a `CLOSED` activity. |
| `DELETE /api/activities/:id` | Owning Organizer | Activity document ID | `204` only for an unused `DRAFT` with zero registrations; otherwise `409`. |
| `POST /api/activities/:id/registrations` | Student | Activity document ID; no body required | `201` with a new `ACTIVE` registration. Activity must be `PUBLISHED`; duplicate active registration returns `409 ALREADY_REGISTERED`. Registration, unique active lock, and count update are transactional. |
| `GET /api/me/registrations` | Student | Optional `status=ACTIVE|CANCELLED`, `includeCancelled=true|false`, `limit=1..50`, `after=<id>` | `200 {"data":[registration],"nextCursor":null|"id"}`. Default stays ACTIVE for compatibility; `includeCancelled=true` without status returns both states. Explicit status takes precedence. Newest registeredAt first, then ID descending. Caller-only, default page size 50. Each row embeds a safe `activity` or null. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Optional `limit=1..50`, `after=<id>` | `200 {"data":[registration],"nextCursor":null|"id"}`, newest registeredAt then ID descending; default 50. Includes cancelled records and a minimal `participant: {displayName,email}` or null, resolved only after ownership authorization. |
| `PATCH /api/registrations/:id` | Student who owns registration | Exactly `{"status":"CANCELLED"}` | `200` with the registration. Legacy route retained for compatibility. Cancellation preserves history, releases the active lock, decrements activity count, and is idempotent. Checked-in active registrations return `409 CANNOT_CANCEL_CHECKED_IN`. |
| `PATCH /api/registrations/:id/cancel` | Student who owns registration | Empty body, or legacy-compatible `{"status":"CANCELLED"}` | `200` with the registration; same ownership and idempotent transaction behavior as the legacy route. |
| `GET /api/integration/partner` | Any authenticated Organizer | None | Calls configured partner API and returns current/degraded state; returns an unconfigured status when no partner URL exists. |
| `GET /api/integration/logs?limit=20` | Organizer whose Firebase UID is in `INTEGRATION_LOG_VIEWER_UIDS` | Optional integer `limit` 1–50 | `200 {"data":[log metadata]}`. Payloads, partner responses, and target URLs are omitted. Other Organizers receive `403`. |

## Registration tickets and attendance — 2026-11-06

These additive routes use the same verified identity/profile middleware. Student
access includes approved, enrolled MFU Student Organizers in Student workspace.
Admin and personal-email Organizers cannot retrieve Student tickets. All ticket,
verification and check-in responses set `Cache-Control: no-store`.

| Method and path | Access | Exact request | Success |
|---|---|---|---|
| `POST /api/registrations/:id/ticket` | Registration owner with Student capability | No body or `{}` | `201` on first issue; `200` on repeat. Returns `{registration,activity,holderName,code,qrValue}`. Concurrent first views return the same code. ACTIVE registration and PUBLISHED/CLOSED activity required; other owners get `404`. |
| `POST /api/activities/:id/tickets/verify` | Owning Organizer | `{code:string}` | `200 {registration,activity,participant:{displayName,email},alreadyCheckedIn}`. Validates ticket, event, ACTIVE registration, active lock and enabled holder. No attendance write. |
| `POST /api/activities/:id/check-ins` | Owning Organizer | Either `{code:string}` or `{registrationId:string}`, never both | `200` with the same shape as verify and resolved server attendance timestamp. First success returns `alreadyCheckedIn:false`; repeat returns true without incrementing again. The manual ID form uses the same registration, owner and status checks. |

`qrValue` is `CP1:` followed by 32 random uppercase hexadecimal characters
(128 bits); `code` is the same value grouped into four eight-character blocks.
Verification accepts the prefix, grouped code, whitespace and lowercase, with
a 128-character input bound. QR/code never contains a UID, email or university ID.
Unknown fields, URLs, arbitrary identifiers and malformed codes are rejected.
Ticket credentials stay in private server-only `registrationTickets/{registrationId}`
and `ticketCodes/{sha256(code)}` documents. Direct browser Firestore access remains
denied. No raw ticket value appears in list/roster projections or request logs.

Registrations expose optional `checkedInAt` in their safe projection. Private
`checkedInBy` and `checkInMethod` audit metadata are never returned. Activities
expose `checkedInCount` (new records start at zero; missing legacy values mean
zero). Clients cannot write either attendance field or counter through event
CRUD. The check-in transaction writes timestamp/actor/method and increments the
counter once; it does not change registration status/count. Check-in and cancel
contend on the same records so a cancellation/check-in race has one winner.

Cancelled registrations cannot issue/verify/redeem tickets. Re-registration
creates a new registration and ticket; the old code remains invalid. Cancellation
after check-in returns `409 CANNOT_CANCEL_CHECKED_IN` on both cancel routes.
PUBLISHED and CLOSED activities accept arrival check-in; drafts return
`409 CHECK_IN_UNAVAILABLE`. No check-in time window, reversal endpoint or Admin
attendance permission is added. Errors include `400 INVALID_TICKET`,
`400 INVALID_CHECK_IN`, `404 INVALID_TICKET`, `409 TICKET_WRONG_EVENT`,
`409 TICKET_CANCELLED` and `409 TICKET_UNAVAILABLE` (including disabled holders).
Ownership is checked before looking up ticket credentials
or attendee details. New ticket paths use direct document lookups; **no new
composite index or connected-project data migration is required**.

Browser image reading is local and does not change this contract. It recognizes
PNG/JPEG/WebP bytes even when the browser supplies no MIME type or a generic
type, caps files at 5 MiB, and rejects images over 32 million pixels or 16,384px
on either edge. It loads the image with explicit failure handling, composites
transparency onto white and tries bounded image sizes/sections for screenshots.
Format, size, image-open, unreadable-QR and unrelated-QR failures have distinct
recovery messages. Only decoded Campus Pulse-shaped codes are sent for server
verification; local parsing never confirms a registration or records attendance.

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
location, status, organizerId, registrationCount, checkedInCount, createdAt, updatedAt, and
organizerName. Admin cannot read rosters, Student history, diagnostics or partner
consumer data, or use Organizer/Student mutations. No public role-assignment
endpoint exists. The trusted `seed.mjs` supports optional ADMIN_UID and
ADMIN_UNIVERSITY_ID for a distinct existing verified Auth user; never run it
against production as an automatic build step.

Creation/update fields remain title (1–200), description (1–5000), location
(1–200), activityType, dateTime with an explicit UTC/offset timezone, and optional
status. Invalid calendar dates are rejected. Optional capacity, end and deadline
fields plus owner-only facilities notes are described above. General media
uploads and arbitrary categories have not been added to the schema.

The new queries require the checked-in activities organizerId/dateTime,
organizerId/status/dateTime, registrations studentId/registeredAt, and
activityId/registeredAt indexes, in addition to existing indexes. Emulator success
does not prove those composite indexes are deployed on the real project.

## Student internship feed — Team 17

`GET /api/internships` requires authenticated server-derived Student capability.
Enrolled Student/Organizers qualify; Admin and Organizer-only accounts receive
403. No enrollment or role is changed. Query: `page` (1–10000, default 1),
`limit` (1–50, default 6), optional `q`/`location` (100 characters), `category`
(60), `work_mode` (`remote`, `hybrid`, `on-site`). Unknown/repeated parameters
return 400 `INVALID_INTERNSHIP_QUERY`. The proxy fixes upstream `status=open`.

200 returns `{data, pagination: {page, limit, total, total_pages, has_next},
meta: {api_version, request_id, timestamp, data_source}}` with validated placement
fields from Team 17's contract, including `is_demo`, application deadline and a
same-provider details URL. No authentication/identity is forwarded upstream.
No persistence, application submission or webhooks are introduced. Responses
are `no-store`. Disabled configuration returns 503 `INTERNSHIPS_NOT_CONFIGURED`,
provider failures 503 `INTERNSHIPS_UNAVAILABLE`, malformed data 502
`INTERNSHIPS_INVALID_RESPONSE`, all using fixed safe error messages.
See [provider setup and constraints](integrations/team17-internships.md).

## Activity Library learning resources — 2026-11-08

Student capability plus a PUBLISHED/CLOSED activity is required for both routes:

- `GET /api/activities/:id/library-resources`: optional `q` and `category` ≤100
  characters, `page` 1–10000 (default 1), `limit` 1–12 (default 4). Unknown or
  repeated parameters return 400 `INVALID_LIBRARY_QUERY`.
- `POST /api/activities/:id/library-resources/suggest`: JSON `{}`, no query
  parameters. Server loads current public activity text, requires a positive
  reading-relevance assessment and uses its grounded query to search Library.
  No client-supplied activity/prompt is accepted. Irrelevant is 409
  `LIBRARY_NOT_RELEVANT`; unavailable is 503 `LIBRARY_RELEVANCE_UNAVAILABLE`.
- `GET /api/activities/:id/library-resources/relevance`, no query parameters:
  `{eligible, status: RELEVANT|NOT_RELEVANT|UNAVAILABLE, query?}`. A miss in the
  bounded process-local public-text/model/policy cache can call AI; it does not
  retrieve catalog books. Uncertainty/failure cannot enable the button. Manual
  search stays available. Auth/activity checks apply before cache/provider access.

200: `{resources, pagination: {page, limit, total, total_pages, has_next},
search: {query, source: AI|MANUAL}}` for catalog/search routes.
Resources project ID/title/author/category/description, available/total copies
and a same-provider `/books/{id}` URL. No student data or Firebase credentials
are sent to either provider; no records are written. `Cache-Control: no-store`.
Admin/Organizer-only access is 403; draft/missing activity 404. AI requests have
per-process in-flight and five-per-minute limits (429 `LIBRARY_AI_RATE_LIMITED`).
Library unavailable/disabled: 503 `LIBRARY_UNAVAILABLE`/`LIBRARY_NOT_CONFIGURED`;
malformed responses: 502 `LIBRARY_INVALID_RESPONSE`. No raw provider errors.
See [setup, contract and limits](integrations/library-resources.md).

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

Planning timeout follow-up (2026-11-06): the activity-plan provider deadline is
45 seconds; basic drafting/admission deadlines are unchanged. Response still uses
source/fallbackReason; UI now explains individual fallback reasons and collects
hours/minutes/presets, converting them to the unchanged durationMinutes contract.
No provider/model override or automatic retry was added.
