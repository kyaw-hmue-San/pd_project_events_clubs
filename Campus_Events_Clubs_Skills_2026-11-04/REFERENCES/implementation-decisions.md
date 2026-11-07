# Implementation Baseline and Decisions

**Last checked:** 2026-11-03  
**Branch:** `implementation/phase-1-verified-baseline`  
**Phase 2 base commit:** `e4b038a`
**Status:** Phase 2 backend contract/security changes pass isolated emulator regressions; no production writes or deployment changes made.

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

## Next implementation gate

Phase 2 code and isolated API regressions are complete on the feature branch. Review and approve the Phase 2 implementation before starting the React frontend. The lecturer brief remains unavailable; keep the Firebase architecture provisional and do not seed or write to the connected Firebase project until the demo environment and accounts are confirmed.
