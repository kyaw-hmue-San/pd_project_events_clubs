---
name: frontend-auth-api-wiring
description: Wire the exported React frontend to Firebase Web Auth and real Express API via one typed-friendly client without direct Firestore writes.
---
# Skill: Frontend authentication and API wiring
**Use when:** Moving from Figma Make UI to real application behavior.

## Procedure
1. Create frontend React/Vite/Tailwind app, import approved design tokens/components, set `VITE_API_BASE_URL` and Firebase **web client** config from environment templates; Admin service credentials only in backend.
2. Implement Firebase email/password login, session persistence and logout using Firebase Web SDK; do not add social login or self-service account provisioning unless specified. Handle unverified/unknown user safely.
3. After Firebase login, call `GET /api/me` with current Firebase ID token, read server-provided role, route to Student/Organizer/Admin. RoleGuard is UX only; server enforces authorization.
4. Build central `apiClient` that obtains fresh ID token, attaches Authorization safely, handles request IDs/errors, maps `error.code`, `message`, `fieldErrors`, and retries only where idempotent/safe. Do not cache raw bearer tokens in localStorage logs.
5. Keep `endpoints` wrappers matched to latest API_CONTRACT; ensure paging, field names and date UTC conversion. Do not bake a hardcoded local or Render URL in JSX screens.
6. Remove/disable Figma prototype data in product paths; no local fake success. On success refetch server state; on error preserve input and show feedback.
7. Short gate: build, login + one authenticated API request against isolated backend; full end-to-end tests postponed until final QA.

## Acceptance
Sign in -> `/api/me` -> role app renders, token is real, no exposed Admin SDK, and one real data route loads from Express/Firestore.
