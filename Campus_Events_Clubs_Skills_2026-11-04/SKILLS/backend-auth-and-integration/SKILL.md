---
name: backend-auth-and-integration
description: Preserve Firebase Auth/Firestore server authorization, CORS, Team 10 webhooks, provider and persistent outbox worker during app completion.
---
# Skill: Backend auth and partner safeguards
**Use when:** Any change touches bearer auth, role guards, integration routes, middleware, deployment or worker.

## Procedure
1. Verify Firebase ID token with correct project, revocation checking and verified email per current contract; load immutable server-side role from Firestore `users/{uid}`.
2. No protected Firestore direct-browser CRUD; server Admin SDK is server-only. Public Firebase web config is not a server secret, but Admin creds are.
3. Preserve exact origin CORS whitelist in env; no `*` with credentials, disallow partner secret headers on browser preflight, never trust Origin as authentication.
4. Keep partner-key `GET /partner/activities` and webhook-secret `POST /webhooks/partner` distinct from Firebase-bearer `/api/*` routes. Preserve request ID, sanitized logs, idempotency and conflict response.
5. Worker must run on persistent server, once per process, with lease/retry semantics; don't move to serverless route. Avoid production Team 10 calls during local refactor.
6. Protect integration logs with configured Organizer UID allowlist, redact payload/URLs/responses, no implicit Admin log access.
7. Test minimal changed auth/integration path locally and note unknown external recovery. Retest full provider/consumer/retry/recovery only in approved final QA environment.

## Acceptance
No role elevation, secret leak, broken partner endpoint, new unauthorized access, duplicate worker or silent retry loss.
