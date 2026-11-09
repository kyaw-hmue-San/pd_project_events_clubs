# Prepared release review

> Historical pre-release review. Its branch, test counts and publication blocker
> below describe that earlier attempt, not current release status. See
> [current deployment](firebase-render.md), [implemented architecture](../architecture.md)
> and [privacy operations](../privacy-and-data-handling.md). The November9 privacy
> UI changes are local until a separate authorized frontend deployment.

Implementation is local on `implementation/campus-pulse-full-stack`.
Primary feature commit: `baaeac7` (Codex-attributed implementation; original
prototype supplied by the user). Public repository destination would be
`https://github.com/kyaw-hmue-San/pd_project_events_clubs`.

## Exact intended publication

Push this feature branch, open a PR against main, then release the updated API
through the existing Render service after authorization. This publishes the
Campus Pulse frontend, backend modules, Google/role workflows, tests, setup docs
and labeled local evidence. It includes the earlier local baseline/security
commits that were not yet on the remote main branch.

Private `.env` / `.env.local` files, credentials, node_modules, generated build
output and operational logs are excluded. The uploaded skills/reference pack is
preserved locally and is not in this implementation commit. A staged credential
scan passed. Publishing to this public repository makes the source/docs visible
to anyone; it is not a private deployment upload.

## Confirmed behavior

- Student accounts only @lamduan.mfu.ac.th.
- Other verified Google accounts may request Organizer access; no campus data
  before approval.
- Admin can approve/reject Organizer requests with atomic role/decision updates.
- Admin appointment is a trusted manual command; no Owner/Super Admin or public
  Admin signup. Event oversight remains read-only.
- Source compatibility, ownership, registration transactions and Team 10 secrets
  and worker behavior are preserved.

## Verification

- TypeScript/Vite production build: passed.
- Isolated API/helper suite: 24 passed, 0 failed.
- Browser suite: 6 passed, including reject/resubmit/approve/publish.
- Credential scan: passed. Private environment files verified ignored.
- No production role assignment, profile seed or event modification was performed.

## Current external blocker

Automatic approval review rejected the attempted public GitHub push because the
user had not explicitly authorized this exact code publication and public
destination. The rejected command did not execute: no push or PR was created.
No workaround will publish it without that authorization. Local-only cleanup and
release documentation continue independently.

Render was found as an uninstalled integration, not confirmed connected. The
configured local Firebase Admin credential file is absent. A real Admin email
has not yet been nominated; `npm run admin:appoint -- --email ...` documents the
trusted setup operation, with an explicit `--apply` step. Live indexes, deployment,
CORS and real-account flows still require verification after publication/access.

## Files in the prepared change against remote main

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `Campus_Events_Clubs_Complete_Handoff/PROGRESS.md`
- `PROGRESS.md`
- `README.md`
- `docs/ACCESS_WORKFLOW.md`
- `docs/API_CONTRACT.md`
- `docs/GOOGLE_SIGN_IN.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/evidence/campus-pulse-local-2026-11-04/admin-overview.png`
- `docs/evidence/campus-pulse-local-2026-11-04/check-results.json`
- `docs/evidence/campus-pulse-local-2026-11-04/student-mobile.png`
- `docs/evidence/google-auth-2026-11-04/check-results.json`
- `docs/evidence/organizer-access-2026-11-04/admin-requests.png`
- `docs/evidence/organizer-access-2026-11-04/check-results.json`
- `docs/archive/frontend-handoff-review.md`
- `docs/implementation-decisions.md`
- `backend/.env.example`
- `docs/archive/backend-deployment-2026-11-04.md`
- `backend/tests/api.emulator.test.mjs`
- `backend/api.mjs`
- `backend/appoint-admin.mjs`
- `backend/firebase.json`
- `backend/firebase.test.json`
- `backend/firestore.indexes.json`
- `backend/inspect-auth-setup.mjs`
- `backend/integration.mjs`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/seed-test-fixtures.mjs`
- `backend/seed.mjs`
- `backend/src/app.js`
- `backend/src/features/activities/routes.js`
- `backend/src/features/admin/routes.js`
- `backend/src/features/integrations/routes.js`
- `backend/src/features/integrations/service.js`
- `backend/src/features/organizer-requests/routes.js`
- `backend/src/features/registrations/routes.js`
- `backend/src/features/users/routes.js`
- `backend/src/middleware/auth.js`
- `backend/src/server.js`
- `backend/src/shared/domain.js`
- `backend/src/shared/errors.js`
- `backend/src/shared/pagination.js`
- `backend/src/shared/projections.js`
- `backend/src/shared/school-access.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `scripts/test-environment.mjs`
- `scripts/test-services.mjs`
- `scripts/test-stack.mjs`
- `frontend/src/App.tsx`
- `frontend/src/components/ui.tsx`
- `frontend/src/data.ts`
- `frontend/src/features/admin/AdminViews.tsx`
- `frontend/src/features/admin/OrganizerRequests.tsx`
- `frontend/src/features/auth/AuthView.tsx`
- `frontend/src/features/auth/OrganizerAccess.tsx`
- `frontend/src/features/auth/ProfileSetup.tsx`
- `frontend/src/features/organizer/OrganizerViews.tsx`
- `frontend/src/features/student/StudentViews.tsx`
- `frontend/src/hooks/useRemote.ts`
- `frontend/src/hooks/useSession.ts`
- `frontend/src/index.css`
- `frontend/src/lib/adapters.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/firebase.ts`
- `frontend/src/lib/google-signin.ts`
- `frontend/src/main.tsx`
- `frontend/src/models.ts`
- `frontend/src/vite-env.d.ts`
- `tests/campus-flow.spec.ts`
- `tsconfig.json`
- `vite.config.ts`
