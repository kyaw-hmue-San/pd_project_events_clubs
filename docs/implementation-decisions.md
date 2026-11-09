# Implementation Baseline and Decisions

Current architecture and privacy operations (9 November 2026):
[implemented cloud system](architecture.md), [diagram](diagrams/platform-architecture.md),
[personal-data handling](privacy-and-data-handling.md). Sections below preserve
dated implementation decisions; their local-only deployment status is historical.

**Last checked:** 2026-11-06

**Branch:** `implementation/campus-pulse-full-stack`

**Phase 2 base commit:** `e4b038a`
**Status:** Local full-stack implementation is connected across Student, Organizer, and read-only Admin. Emulator and browser evidence is recorded in [PROGRESS.md](../PROGRESS.md). Local feature checks use isolated emulators and mocked providers. The later user-authorized real inbound receipt/association is separately recorded; no deployment or new live creation call is claimed.

## AI planning and conditional Organizer approval — 2026-11-06

- User explicitly selected automatic approval for all acceptable verified Google
  applicants, including personal accounts. Confirmed exact criterion categories
  and deterministic manual fallback before enabling real approval. This
  supersedes earlier Admin-only admission and Organizer-drafting-only AI scope,
  preserving manual Admin appointment, three roles and all ownership boundaries.
- Policy CAMPUS_ORGANIZER_V1 requires explicit campus activity, purpose/audience,
  organizer identity and personal responsibility with supporting quotes, plus
  consistency/safety and no concerns/bypass. Schema validation and final identity/
  revision/lease/profile checks happen server-side; model cannot grant roles.
  This assesses self-reported application information, not verified affiliation.
- Keep provider network work outside transactions, bind exact submission revision,
  preserve Student profiles/registrations, and atomically record AI decisions.
  Default config requires Admin; explicit policy/version and auto-approval flag
  permit conditional AI promotion. No automatic rejection, old-request bulk scan
  or new arbitrary role-management route. Process interruption falls to Admin.
- Add structured event-planning endpoint while preserving legacy basic drafting.
  Validate agenda totals/offsets, limits and strict output schema; label complete
  deterministic fallback honestly. Review/apply selected text sections, require
  acknowledgment before replacement, preserve all other manually entered fields.
  Facilities suggestions remain notes until separate reviewed Send. No automatic
  save/publish/booking, new plan database collection or planning migration.
- Existing configured AI/ML API model/credentials are reused server-side. No real
  provider call or real admission is claimed by mocked/emulator/browser evidence.

## 2026-11-04 implementation decisions

### Capacity, scheduling and facilities follow-up — 2026-11-06

- User approved optional participant limits, deadlines, end times, facilities
  requirements and linked maintenance status. This supersedes the earlier MVP
  exclusion of capacity/end time, without requiring a migration for old events.
  Dates remain campus-time input/UTC storage, with complete calendar/order
  validation. Registration and capacity edits contend on the same activity doc.
- Facilities requirements remain private owner notes on save. The user supplied
  Team 10's dedicated creation and signed-webhook contracts, confirmed the same
  existing partner key, and approved a narrow automatic-linking exception. After
  owner review, the backend may link only a validated HTTPS creation response
  echoing the exact activity ID. Clients cannot choose order IDs or alter links.
  Preserve legacy publication/provider payloads, worker and operator setup.
- Store a durable original reviewed payload, canonical bytes, stable idempotency
  UUID and 45-second lease. Retry uncertain results without changing details or
  identity; stop on definitive rejection/link collision. Do not claim acceptance
  from a local HTTP 200; the persisted SENT receipt is authoritative. A duplicate
  links the existing work order and does not update its remote details.
- Verify raw-byte HMAC and all signed sequence/version/header copies. Order by
  OPEN=1 through CLOSED=5 per work order, reject stale regressions, and preserve
  early webhook status during receipt linking. Legacy secret-only reception is
  retained outside HMAC-required mode without downgrading versioned status.
  Owner polling exposes RESOLVED/CLOSED completion within the active-page refresh
  cycle. No activity closure, cancellation/rescheduling API, or new role power.
- Added explicit local facilities-test mode; it does not enable legacy outbound
  publication or polling and performs no request on startup. Automated checks
  use injected partners and demo projects only. Live creation/dispatch-board
  acceptance remains a coordinated manual test, distinct from inbound evidence.
- Status is a last-received snapshot with time/order uncertainty handled openly,
  not a room-booking/availability guarantee. Admin gains no private panel or
  integration-log rights. New lookups use direct document IDs; no new index.
- Persist only per-person workspace preference in browser session storage to
  preserve the chosen Student/Organizer view after activity/profile reload. All
  permissions still derive server-side. The Firebase-vs-Supabase course-stack
  deviation remains provisional; no lecturer approval is inferred.

### Additive QR attendance follow-up — 2026-11-06

- User approved QR registration tickets and owning-Organizer attendance check-in.
  Use locally generated opaque 128-bit tickets and on-device ZXing decoding;
  no third-party QR service, new privileged role or AI decision is involved.
- Issue tickets lazily so existing registrations work. Verify current server
  state again at explicit confirmation; keep attendance distinct from enrollment
  and registration status. Atomic, idempotent writes prevent duplicate counts.
- Block cancellation after check-in to preserve attendance. No reversal workflow
  or time-window policy is invented. CLOSED means registration closed and still
  permits check-in. Organizer confirms the displayed name because a static QR
  is copyable. Admin remains read-only for events and has no ticket access.
- Store private code lookup documents with direct reads, so no new query index
  or production migration is necessary. Preserve Team 10 integration and the
  provisional Firebase-vs-Supabase course-stack deviation.

- Preserve Firebase/Express and the existing Team 10 contracts. Move backend
  domains into `backend/src/features/`; preserve `.mjs` compatibility entrypoints.
  App creation is separate from Firebase initialization, listener, and worker.
- Add Organizer-owned paginated listing. Keep Student history ACTIVE by default
  for old consumers; use explicit status or `includeCancelled=true` for history.
  Return safe related event data and ownership-protected participant display data.
- Add ADMIN to server-provisioned roles and restrict it to its own profile and
  read-only Admin routes. Counts use Firestore aggregation across the dataset;
  no participant PII or integration diagnostics are exposed in Admin views.
- Reuse the supplied Campus Pulse UI and wire it to real Firebase Web Auth and
  Express. Retain original fixtures only as an unimported reference. Remove
  unsupported capacity/end-time fields from the product flow rather than
  fabricate API values. Activity type supplies the Events/Clubs filter.
- Keep authenticated published/closed browsing. PRD anonymous published-only
  browsing (D03) remains unresolved and is not silently asserted complete.
- Campus timezone is configurable; Asia/Bangkok is the current default, pending
  university confirmation. Store API dates in UTC and convert campus wall time
  independently of the browser's timezone.
- Historical first implementation: used `demo-campus-pulse` for the local demo (now retired). No production seed is
  needed to run it. Real environment provisioning, index deployment, origin
  configuration, HTTPS smoke, lecturer decisions, and usability/performance
  acceptance remain release work.

The baseline sections below preserve the earlier investigation history. Their
claims that no frontend existed describe the earlier checkout, not the current
source. The current route contract is maintained in [API_CONTRACT.md](API_CONTRACT.md).

## Confirmed presentation scope — Organizer approvals

2026-11-05 profile addition: the user requested editable usernames for all roles.
This is implemented as a non-unique Campus Pulse display name, not a new login
identifier. My profile edits only the authenticated person's stored name; Google
email, university ID, primary role and capabilities cannot be body-selected.
Admin has this exact own-profile write exception, while event oversight remains
read-only. Google identity/approval snapshots are not rewritten by name edits.

2026-11-05 user correction: a Student who is approved to organize must remain a
Student too. The server now derives Student/Organizer capabilities in `/api/me`
and uses Student capability on registration endpoints. The stored primary role
and existing Organizer ownership checks stay compatible. Verified MFU Organizers
with a valid preserved university ID regain Student access, including previously
approved accounts. Personal Organizers and school Organizers without enrollment
do not receive it. A responsive workspace switch exposes both sets of screens.
This supersedes the earlier exclusive-role limitation; Admin remains separate.

The user approved the smaller Organizer-request workflow on 2026-11-04 and
clarified that Students must use @lamduan.mfu.ac.th. This supersedes earlier
proposals for general membership approval, personal-email Student admission,
Owner permissions and a Super Admin role.

Implemented: verified Google applicants can submit an Organizer request;
Student accounts retain Student access while pending; personal-email applicants
have request/status access only. Admin can approve/reject requests, with atomic
role assignment, revision checks and decision history. Admin's event interface
remains read-only. Admin appointment uses a trusted operator tool, not a public
API or Admin management UI. Existing role identity and registration records are
preserved. New non-Student Organizer/Admin profiles can have a null university
ID rather than an invented student identifier.

See docs/ACCESS_WORKFLOW.md and root PROGRESS.md for the current source/verification.
Earlier discussion sections below remain historical where superseded.

## Google-only school authentication — latest decision

Follow-up discussion: user clarified that other Google accounts must be considered
and suggested a school Admin approval flow for would-be Organizers. The domain
hint was removed from the chooser; server admission has not been broadened.
Proposed MVP: MFU Student admission, approved membership for outside accounts,
Organizer-request approval by appointed school Admins, and one-time Organizer
approval. This would extend read-only Admin with approval actions and requires
settling that scope before implementation. No account role is chosen from the
Google picker, email prefix, or self-service role selection.

Confirmed by the user on 2026-11-04: show Google only and allow the exact
`@lamduan.mfu.ac.th` school domain. This supersedes the earlier email/password
UI and manual-only Student provisioning; those earlier sections are historical.

- Require a verified Google-provider Firebase ID token and exact school email
  domain on the server for every protected request. Privileged existing profiles
  do not bypass this policy. Keep partner authentication separate.
- New school users complete their real university ID once, preserving the current
  unique-university-ID data model rather than inventing an ID from email. Atomic
  onboarding creates STUDENT only; roles/email/name/UID cannot be body-selected.
- Preserve existing UIDs/profiles/registrations, never merge based on a browser
  email submission. Google-provider conflicts require supported account linking.
- Use the real user-supplied Firebase web configuration in ignored `.env.local`
  with emulator mode false and the existing Render API URL. Manual demo launch
  commands were removed; disposable fixtures remain only in automated checks.
- Public Firebase checks confirm Google OAuth initiation and localhost as an
  authorized domain. The live Render host responds to health but rejects the
  browser preflight without CORS headers. Updated backend deployment is still
  required. Missing CLI auth, a missing local backend credential file, and denied
  Chrome computer-use access prevented live management changes in this session.

See `docs/GOOGLE_SIGN_IN.md` and current evidence in root `PROGRESS.md`.

## Architecture decision

The project will provisionally reuse Firebase Authentication, Firestore, Express, and the existing persistent Render API, with a new React + Vite frontend. This follows the current user decision and preserves the existing Assignment 3/5 backend and Team 10 integration. The older canonical MVP documents still specify Supabase/PostgreSQL and Vercel. The lecturer's current implementation brief and final rubric were not found in the repository, so this is not a final claim of course compliance. Do not migrate databases or move the persistent integration worker to serverless hosting without an explicit requirement and a reviewed migration plan.

## Verified repository and environment

- Root repository was clean on `main` at `6d02a3d` before this work; no React/Vite app or root `package.json` was tracked.
- `backend/package.json` defines an Express 5 API with `firebase-admin`, Node `>=22`, and `start`, `seed`, and `test` scripts. Installed versions are Express 5.2.1 and Firebase Admin 13.10.0.
- Firebase CLI 15.34.2 is a development dependency for isolated emulators. Its transitive `superstatic` package warns that it supports Node 20/22/24, while this machine uses Node 26.12.1; the CLI and emulator suite nevertheless ran successfully here.
- Local runtime is Node 26.12.1 and npm 11.20.0. Firebase dependencies are installed.
- `backend/.env` exists and is ignored by `.gitignore`. Only variable names were checked; values were not read or recorded. It contains project/service-account path, integration credential, partner URL, and partner auth variable names. This does not verify that credentials are valid or that remote Firestore access works.
- Firebase client configuration for a future browser app and the provisioned demo account UIDs were not identified in the frontend (none exists) or the checked environment variable names. Obtain client config and dedicated demo account details through approved private setup; never put Admin SDK credentials in the frontend.
- Firestore rules deny all direct client reads and writes. The API is expected to access Firestore through the Admin SDK.

## Existing API inventory

| Method and path | Access | Behavior |
|---|---|---|
| `GET /health` | Public | Process health only; not a Firestore connectivity check. |
| `POST /webhooks/partner` | Shared webhook secret | Receives partner events with validation and idempotency. |
| `GET /partner/activities` | Partner API key | Returns published activities using a sanitized partner projection. |
| `GET /api/me` | Firebase bearer token, provisioned Student/Organizer | Returns the caller's profile. |
| `GET /api/integration/partner` | Organizer | Calls the configured partner consumer endpoint. |
| `GET /api/integration/logs` | Organizer UID in `INTEGRATION_LOG_VIEWER_UIDS` | Returns sanitized operational metadata only. |
| `GET /api/activities` | Authenticated Student/Organizer | Lists `PUBLISHED` and `CLOSED` activities with a page limit/cursor. |
| `GET /api/activities/:id` | Authenticated Student/Organizer | Returns published/closed activities or the caller's own draft. |
| `POST /api/activities` | Organizer | Creates a validated draft owned by the authenticated Organizer. |
| `PATCH /api/activities/:id` | Owning Organizer | Updates fields and changes lifecycle status; publishing enqueues partner webhook delivery in the same Firestore transaction. |
| `DELETE /api/activities/:id` | Owning Organizer | Permanently deletes an unused draft only. |
| `POST /api/activities/:id/registrations` | Student | Transactionally creates registration and active lock, increments activity count. |
| `GET /api/me/registrations` | Student | Returns caller's active registrations, maximum 50. Organizer is denied. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Returns activity registrations, maximum 50. |
| `PATCH /api/registrations/:id` | Student who owns registration | Cancels idempotently and updates lock/count transactionally; body must be `{"status":"CANCELLED"}`. |
| `PATCH /api/registrations/:id/cancel` | Student who owns registration | PRD-compatible alias; accepts no body or the legacy cancellation body. |

## Verified baseline checks

- `npm test --prefix backend`: 6 passed, 0 failed. These are integration helper/configuration tests, not API/Firestore end-to-end tests.
- `node --check backend/api.mjs` and `node --check backend/integration.mjs`: passed.
- `npm ls --depth=0 --prefix backend`: dependencies resolve.
- No authenticated API call, Firestore write, seed, deployment, or partner request was run in this inventory.

## Phase 2 contract status

Lifecycle visibility/reopening, cancellation compatibility, CORS allowlisting, and integration-log authorization/redaction are implemented and covered by isolated emulator tests. See [API contract](API_CONTRACT.md).

- `npm run test:emulator`: 13 passed, 0 failed against local Auth/Firestore emulators using only `demo-campus-events-tests`.
- `npm test`: 6 passed, 0 failed; the emulator test file is skipped when emulator endpoints are not present.
- `node --check api.mjs` and `node --check integration.mjs`: passed after implementation.
- The compatible production audit update removed the high `body-parser` and moderate `qs` findings. `npm audit --omit=dev` still reports 8 moderate `uuid` transitive findings through Firebase Admin; the available fix requires a major `firebase-admin@14` upgrade and was not applied.
- Team 10 provider/webhook HTTP contracts pass locally with emulator data and test-only secrets; no external request or automatic recovery cycle was run.

The deployed host must receive its exact frontend origin in `FRONTEND_ORIGINS` and any intended diagnostic Organizer UIDs in `INTEGRATION_LOG_VIEWER_UIDS`; local `.env` values were not changed. The current backend uses a persistent Express process with an interval worker, so retain a persistent host. Production CORS, Auth/Firestore CRUD, deployed indexes, and log-viewer configuration have not been verified. Lecturer final implementation brief, final rubric, deadline, and any required Assignment 5 rubric remain unavailable; continue reversible Firebase-backed MVP work and revisit if supplied.

## Previous Phase 2 implementation gate (historical)

Phase 2 code and isolated API regressions are complete on the feature branch. Review and approve the Phase 2 implementation before starting the React frontend. The lecturer brief remains unavailable; keep the Firebase architecture provisional and do not seed or write to the connected Firebase project until the demo environment and accounts are confirmed.
