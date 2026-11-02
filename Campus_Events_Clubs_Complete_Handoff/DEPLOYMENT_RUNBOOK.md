# Deployment and recovery runbook
**Provisional layout:** React/Vite static frontend (Vercel or equivalent) → HTTPS Express API on persistent Render → Firebase Auth/Firestore. Preserve existing background integration worker on persistent host; confirm worker durability/instance duplication behavior.

## Pre-deploy environment inventory (no secret values in documentation)
Backend: Firebase service credentials in host secret store, project ID, integration partner keys/endpoints, allowed frontend origin(s), logging rules, worker configuration. Frontend: API base URL, public Firebase web config (client config is not a server secret), static hosting rewrite for SPA routes. **Inspect real env variable names in code; these are categories, not exact names.**

## Deployment procedure
1. Confirm approved architecture and account/project ownership; create restricted staging/demo Firebase project or non-destructive safe test strategy.
2. Run current backend tests and syntax checks; record commit SHA and actual branch. Confirm no `.env`/service account in Git history/current artifacts.
3. Configure backend secrets in Render dashboard; keep worker scheduling compatible with persistent service. Verify deployed `/health` and logs (redacted).
4. Configure strict CORS allowlist with exact frontend origin(s), required methods/headers and OPTIONS handling. Avoid broad wildcard with privileged cross-origin calls.
5. Build frontend with API base URL and Firebase client config injected through host environment; ensure build output has no admin credentials.
6. Deploy frontend and configure SPA deep-link rewrites/fallback so `/events/:id` and `/my-registrations` refresh correctly.
7. Sign in using controlled accounts and perform **real** create→publish→register→roster→cancel calls on deployed system.
8. Verify Firestore data, query indexes, auth role documents/rules and partner integration status as permitted; update evidence with timestamp+environment+commit.
9. If Render scales/sleeps/restarts, check retry worker behavior. Don't promise immediate auto-retry without proof.

## Smoke-check table (friend fills)
| Check | Result | Date/env | Evidence |
|---|---|---|---|
| Backend `/health` HTTP 200 | TBD | TBD | TBD |
| Deployed Student Firebase sign-in | TBD | TBD | TBD |
| Authenticated event listing works | TBD | TBD | TBD |
| Organizer creates+publishes event | TBD | TBD | TBD |
| Student registers + refresh persists | TBD | TBD | TBD |
| Organizer sees Student roster | TBD | TBD | TBD |
| Student cancels + refresh persists | TBD | TBD | TBD |
| Unauthorized role access refused | TBD | TBD | TBD |
| Mobile width and deep-link refresh | TBD | TBD | TBD |
| Integration observed or limitation disclosed | TBD | TBD | TBD |

## Recovery / demo contingency
If partner Team 10 service is offline: do not pretend success. Show core product and explain integration is separate; use genuine historical redacted evidence labeled by date and any actual degraded-state status. If Render cold-starts: have dashboard and health page prepared, but don't claim data is up until auth/API verified. If seeded event already registered: use unique new event/another prepared Student or perform safe own cancellation. Keep an offline screen recording of a prior **genuine successful run** clearly labeled recording/date, as fallback, not as a live demo.
