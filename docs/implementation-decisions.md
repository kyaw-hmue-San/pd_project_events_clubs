# Implementation Baseline and Decisions

**Last checked:** 2026-11-04

**Branch:** `implementation/campus-pulse-full-stack`

**Phase 2 base commit:** `e4b038a`
**Status:** Local full-stack implementation is connected across Student, Organizer, and read-only Admin. Emulator and browser evidence is recorded in [PROGRESS.md](../PROGRESS.md). No production writes, deployments, or external partner requests were made.

## 2026-11-04 implementation decisions

- Preserve Firebase/Express and the existing Team 10 contracts. Move backend
  domains into `firebase/src/features/`; preserve `.mjs` compatibility entrypoints.
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
- `firebase/package.json` defines an Express 5 API with `firebase-admin`, Node `>=22`, and `start`, `seed`, and `test` scripts. Installed versions are Express 5.2.1 and Firebase Admin 13.10.0.
- Firebase CLI 15.34.2 is a development dependency for isolated emulators. Its transitive `superstatic` package warns that it supports Node 20/22/24, while this machine uses Node 26.12.1; the CLI and emulator suite nevertheless ran successfully here.
- Local runtime is Node 26.12.1 and npm 11.20.0. Firebase dependencies are installed.
- `firebase/.env` exists and is ignored by `.gitignore`. Only variable names were checked; values were not read or recorded. It contains project/service-account path, integration credential, partner URL, and partner auth variable names. This does not verify that credentials are valid or that remote Firestore access works.
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

- `npm test --prefix firebase`: 6 passed, 0 failed. These are integration helper/configuration tests, not API/Firestore end-to-end tests.
- `node --check firebase/api.mjs` and `node --check firebase/integration.mjs`: passed.
- `npm ls --depth=0 --prefix firebase`: dependencies resolve.
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
