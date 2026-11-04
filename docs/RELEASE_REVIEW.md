# Prepared release review

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
- `docs/frontend-handoff-review.md`
- `docs/implementation-decisions.md`
- `firebase/.env.example`
- `firebase/DEPLOY.md`
- `firebase/api.emulator.test.mjs`
- `firebase/api.mjs`
- `firebase/appoint-admin.mjs`
- `firebase/firebase.json`
- `firebase/firebase.test.json`
- `firebase/firestore.indexes.json`
- `firebase/inspect-auth-setup.mjs`
- `firebase/integration.mjs`
- `firebase/package-lock.json`
- `firebase/package.json`
- `firebase/seed-test-fixtures.mjs`
- `firebase/seed.mjs`
- `firebase/src/app.js`
- `firebase/src/features/activities/routes.js`
- `firebase/src/features/admin/routes.js`
- `firebase/src/features/integrations/routes.js`
- `firebase/src/features/integrations/service.js`
- `firebase/src/features/organizer-requests/routes.js`
- `firebase/src/features/registrations/routes.js`
- `firebase/src/features/users/routes.js`
- `firebase/src/middleware/auth.js`
- `firebase/src/server.js`
- `firebase/src/shared/domain.js`
- `firebase/src/shared/errors.js`
- `firebase/src/shared/pagination.js`
- `firebase/src/shared/projections.js`
- `firebase/src/shared/school-access.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `scripts/test-environment.mjs`
- `scripts/test-services.mjs`
- `scripts/test-stack.mjs`
- `src/App.tsx`
- `src/components/ui.tsx`
- `src/data.ts`
- `src/features/admin/AdminViews.tsx`
- `src/features/admin/OrganizerRequests.tsx`
- `src/features/auth/AuthView.tsx`
- `src/features/auth/OrganizerAccess.tsx`
- `src/features/auth/ProfileSetup.tsx`
- `src/features/organizer/OrganizerViews.tsx`
- `src/features/student/StudentViews.tsx`
- `src/hooks/useRemote.ts`
- `src/hooks/useSession.ts`
- `src/index.css`
- `src/lib/adapters.ts`
- `src/lib/api.ts`
- `src/lib/firebase.ts`
- `src/lib/google-signin.ts`
- `src/main.tsx`
- `src/models.ts`
- `src/vite-env.d.ts`
- `tests/campus-flow.spec.ts`
- `tsconfig.json`
- `vite.config.ts`
