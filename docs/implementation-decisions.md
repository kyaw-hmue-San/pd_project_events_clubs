# Implementation Baseline and Decisions

**Last checked:** 2026-11-03  
**Branch:** `implementation/phase-1-verified-baseline`  
**Base commit:** `6d02a3d`  
**Status:** Phase 1 repository/environment inventory complete; no runtime behavior changed.

## Architecture decision

The project will provisionally reuse Firebase Authentication, Firestore, Express, and the existing persistent Render API, with a new React + Vite frontend. This follows the current user decision and preserves the existing Assignment 3/5 backend and Team 10 integration. The older canonical MVP documents still specify Supabase/PostgreSQL and Vercel. The lecturer's current implementation brief and final rubric were not found in the repository, so this is not a final claim of course compliance. Do not migrate databases or move the persistent integration worker to serverless hosting without an explicit requirement and a reviewed migration plan.

## Verified repository and environment

- Root repository was clean on `main` at `6d02a3d` before this work; no React/Vite app or root `package.json` was tracked.
- `firebase/package.json` defines an Express 5 API with `firebase-admin`, Node `>=22`, and `start`, `seed`, and `test` scripts. Installed versions are Express 5.2.1 and Firebase Admin 13.10.0.
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
| `GET /api/integration/logs` | Any authenticated Organizer | Returns integration logs; access is not scoped to an owner. Review privacy/access before frontend exposure. |
| `GET /api/activities` | Authenticated Student/Organizer | Lists only `PUBLISHED` activities with a page limit/cursor. |
| `GET /api/activities/:id` | Authenticated Student/Organizer | Returns published activity or the caller's own activity. Other states are hidden from non-owners. |
| `POST /api/activities` | Organizer | Creates a validated draft owned by the authenticated Organizer. |
| `PATCH /api/activities/:id` | Owning Organizer | Updates fields and changes lifecycle status; publishing enqueues partner webhook delivery in the same Firestore transaction. |
| `DELETE /api/activities/:id` | Owning Organizer | Permanently deletes an unused draft only. |
| `POST /api/activities/:id/registrations` | Student | Transactionally creates registration and active lock, increments activity count. |
| `GET /api/me/registrations` | Authenticated user | Returns caller's active registrations, maximum 50. Route currently lacks an explicit Student-role guard. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Returns activity registrations, maximum 50. |
| `PATCH /api/registrations/:id` | Student who owns registration | Cancels idempotently and updates lock/count transactionally; body must be `{"status":"CANCELLED"}`. |

## Verified baseline checks

- `npm test --prefix firebase`: 6 passed, 0 failed. These are integration helper/configuration tests, not API/Firestore end-to-end tests.
- `node --check firebase/api.mjs` and `node --check firebase/integration.mjs`: passed.
- `npm ls --depth=0 --prefix firebase`: dependencies resolve.
- No authenticated API call, Firestore write, seed, deployment, or partner request was run in this inventory.

## Known contract gaps for the next phase

1. PRD cancellation path is `PATCH /api/registrations/:id/cancel`; existing backend path is `PATCH /api/registrations/:id`. Keep the existing route and add a compatible adapter only after tests define both behaviors.
2. PRD says `CLOSED` activities remain visible and cannot reopen. The list/detail routes currently hide closed activities from Students, and update validation allows `CLOSED` to `PUBLISHED`. Confirm/record the rule before altering code.
3. No CORS middleware or origin allowlist is configured; a browser-hosted frontend needs explicit local/deployed origins and preflight support.
4. Integration logs are available to any Organizer and need a deliberate authorization/redaction policy before being exposed in the UI.
5. The current backend is a persistent Express process with an interval worker; retain a persistent host for the existing integration worker.
6. Lecturer final implementation brief, final rubric, deadline, and any required Assignment 5 rubric remain unavailable in this repository. Continue reversible Firebase-backed MVP work and revisit if supplied.

## Next implementation gate

Proceed with backlog Task 006: publish a contract based on the actual routes, then add narrow regression tests before Tasks 007–010 change lifecycle, cancellation, CORS, or log authorization. Do not seed or write to the connected Firebase project until the demo environment and accounts are confirmed.
