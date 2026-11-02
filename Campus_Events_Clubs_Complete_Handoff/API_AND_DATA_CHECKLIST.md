# Backend/API & data checklist (verify actual source before changing)
## Current reported architecture
Frontend obtains Firebase ID token → Express verifies with Admin SDK → server loads protected role → Firestore operations via Admin SDK; client direct Firestore access intentionally denied. Existing files reportedly `firebase/api.mjs`, `firebase/integration.mjs`, rules, seed, `firebase/DEPLOY.md`.

## Required work order
1. Inventory existing endpoints, methods, auth roles, request/response schemas, error codes from `api.mjs` + current tests. Build one authoritative `API_CONTRACT.md` *in the repo*; do not guess endpoint fields.
2. Resolve D3 (CLOSED visibility/reopening) and D4 (cancel route); preserve backward compatibility where necessary. Add contract tests before UI.
3. Recheck creation, update, publish and ownership checks, all required form fields, date/time and status constraints, duplicate lock behavior, Firestore indexes.
4. Confirm Student listings, Student 'mine', and Organizer roster have enough fields for UI. Add minimal endpoints only if necessary; avoid fetching all students to the browser.
5. Build central typed fetch client: base URL env config, Bearer token, JSON, request cancellation/timeouts, error normalization, 401 refresh/re-sign-in handling. No Admin SDK in browser.
6. Add strictly allowlisted CORS for known frontend origin(s), correct preflight OPTIONS, permitted headers and methods; never `*` with credentials or treat CORS as auth.
7. Check Firestore rules still deny direct privileged client reads/writes; verify Emulator flow, not just code inspection.
8. Restrict and redact integration logs; verify partner webhooks (auth, idempotency, bounded retry/backoff, queue lifecycle, sensitive logs), avoid sending real partner traffic without permission.
9. Keep background worker on persistent host, monitor wake/retry behavior and automatic recovery. Document any queue durability limits.
10. Add pagination/limits if needed for realistic rosters or large event sets, without delaying P0 flows.

## Critical invariants / tests
- `organizer_id` and `student_id` **must be derived server-side** from authenticated identity, not trusted request fields.
- A Student cannot publish/create/update or view another Student's registrations.
- An Organizer cannot edit another Organizer's event or fetch its private roster.
- Event lifecycle transitions match approved state chart; closed event cannot accept new registration.
- Only one active registration per Student × Event under concurrency; duplicate requests return safe deterministic outcome.
- Cancellation updates correct registration and preserves history as policy requires; repeated cancellation predictable/idempotent.
- Failures never commit half a multi-document transaction; avoid client-side optimistic 'registered' without server confirmation.
- Firestore indexes and data shape fit listing/ownership queries; environment matches deployment.

## Existing route conflict specifically reported
PRD: `PATCH /api/registrations/:id/cancel`; backend: `PATCH /api/registrations/:id` with `{ "status": "CANCELLED" }`. Choose a consistent public contract, adapt implementation and UI, regression test.

## Suggested minimal OpenAPI/API table (fill with actual code, NOT assumptions)
| Operation | Existing route/method | Auth/role | Input | Successful output | 4xx cases | Test |
|---|---|---|---|---|---|---|
| List student-visible events | inspect | Student/defined | filters? | actual shape | 401/403 | pending |
| Get event details | inspect | inspect | event id | actual shape | 404 | pending |
| Create/update/publish event | inspect | Organizer owner | actual schema | event | 400/403/409 | pending |
| Register event | inspect | Student | event id | registration | 400/401/409 | pending |
| List own registrations | inspect | Student | none | registrations | 401/403 | pending |
| Cancel registration | inspect | Student owner | id | status | 403/404/409 | pending |
| Organizer roster | inspect | Organizer owner | event id | registrations | 403/404 | pending |
| Partner integration | inspect | approved role | actual shape | status/log id | partner failure | pending |

## Recommended repo structure only if compatible
`frontend/` (React/Vite app) with `src/api`, `src/auth`, `src/components`, `src/pages`, `src/styles`, `src/utils`, `src/tests`; keep existing `firebase/` backend. Avoid reorganizing backend just for neatness. Keep env examples for each app, root README with start commands.
