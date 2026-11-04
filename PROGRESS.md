# Campus Pulse implementation progress

Date: 2026-11-04 (Asia/Bangkok). Branch:
`implementation/campus-pulse-full-stack`.

Status: **Connected local implementation. Production release not verified.**
The work reuses the user-supplied Campus Pulse prototype and current skills pack.

## Release publication state

The implementation is committed locally as `baaeac7` on
`implementation/campus-pulse-full-stack`, with Codex attribution and explicit
credit that the original prototype came from the user. Private configuration and
the user-uploaded skills pack were not included.

Automatic approval review rejected the attempted public GitHub push because the
user had not explicitly authorized exporting the complete implementation to
`https://github.com/kyaw-hmue-San/pd_project_events_clubs`. The rejected command
never executed: no push, PR, merge or production deployment occurred. There is no
PR URL to report. See [the concrete release review](docs/RELEASE_REVIEW.md) for
payload, verification, exclusions and outstanding live setup. Local-only cleanup
and documentation remain permitted; no alternate publication route is being used.

## Current release — Organizer requests and Admin review

Confirmed by the user: implement Request Organizer access, one Admin Approve /
Reject screen, and keep Admin appointment manual. Student accounts remain only
@lamduan.mfu.ac.th. This supersedes the broader Owner/Super Admin/general-member
approval proposals discussed earlier.

Implemented and locally verified:

- Verified Google identities can submit one pending Organizer request and read
  only their own status. Personal-email applicants have no campus-data access
  before approval. Students retain Student access while pending.
- Admin has paginated Pending/Approved/Rejected request views, confirmation and
  rejection-reason controls. Review is the only new bounded Admin write API;
  campus events remain read-only for Admin.
- Approval atomically saves the decision, grants ORGANIZER, and preserves existing
  identity/registration data. New non-Student Organizers use no fabricated student
  ID. Rejection shows its reason and permits a versioned resubmission.
- Duplicate submission/review, concurrent decisions, stale requests, self-review,
  wrong roles, changed Google identities and disabled access are checked.
- `npm run admin:appoint -- --email ...` performs a trusted dry run; `--apply`
  explicitly appoints an existing verified Google identity. It does not create
  Google accounts/passwords or expose an Admin signup route. No real Admin was
  nominated or appointed during this implementation.
- **Build passed. 24 backend checks passed (18 API scenarios + 6 helpers).
  6 browser scenarios passed**, covering the entire reject/resubmit/approve/
  publish flow, persisted refresh, Google popup, Student enrollment, role access,
  mobile layouts, and baseline activity/registration workflows.

Evidence: [check results](docs/evidence/organizer-access-2026-11-04/check-results.json),
[Admin request screen](docs/evidence/organizer-access-2026-11-04/admin-requests.png).
Current workflow and manual setup: [ACCESS_WORKFLOW.md](docs/ACCESS_WORKFLOW.md).

Live deployment still needs the updated API, required Firestore indexes and exact
frontend origins. GitHub access is available; Render was found as an uninstalled
integration and has not been confirmed connected. The local server credential
file is also unavailable. No production roles, profiles or event records were
changed. The public feature-branch push was blocked by automatic approval review;
see the release publication state above. Historical verification counts and proposals follow for traceability.

## Latest update — school Google sign-in

Latest discussion: the Google chooser now has no school-domain hint and requests
the normal account selection prompt. Admission for outside Google accounts and
school-Admin approval of Organizer requests is under design discussion. No
approval endpoints, privileged role changes or broader server admission have
been implemented. Current server restrictions remain until that policy is settled.

Popup correction: an obsolete demo process was still serving port 5173 and
overriding `.env.local`. It was stopped and replaced with the real development
server at localhost:5173. Served configuration confirms the real project and
emulator mode false. Normal Vite startup now refuses emulator configuration;
the isolated browser harness explicitly selects test mode. Build and the startup
guard were checked after this correction. The live backend/CORS blocker below
is separate and remains unresolved.
The real-configured button was verified to open accounts.google.com without
entering credentials. The targeted isolated Google-only/profile browser
regression passed with the new explicit test mode.

The user confirmed **Google only** and **@lamduan.mfu.ac.th**. The normal app now
uses real Firebase configuration with emulator mode off; manual demo commands
and demo credentials were removed from the user setup path.

- Google popup plus blocked-popup redirect fallback; password UI removed.
- Server verifies provider, verified email, exact school domain and token
  revocation even for existing profiles. Personal accounts/lookalike domains,
  unverified users and password tokens are denied.
- First-time school users complete university ID once. Atomic onboarding creates
  STUDENT only, preserves ID uniqueness and existing roles, and is safe to repeat.
- Real public web config supplied by the user is in ignored `.env.local`.
  Configured API is `https://pd-project-events-clubs.onrender.com`.
- Automated Google-policy/API checks: **20 passed, 0 failed**. Google-popup and
  three-role browser scenarios: **4 passed**, including onboarding/reload,
  personal account denial, sign-out, persistence, keyboard and responsive checks.
- Public real-project OAuth initiation: HTTP 200, valid Google authorization URI.
  Public authorized-domain check: localhost and the two project hosting domains.
  No actual Google user was signed in or created by these public setup checks.
- Live API `/health`: 200. Browser preflight: **401 with no CORS headers**.
  **Real-account end-to-end use is not ready until updated backend deployment
  and CORS configuration are applied.**
- CLI project inspection failed because it is not authenticated. Read-only SDK
  inspection failed because the configured local credential file was missing.
  The computer-use tool did not approve Chrome access. No live configuration,
  role assignments, account merges or production business records were changed.

See [real-account setup](docs/GOOGLE_SIGN_IN.md) and
[local development](docs/LOCAL_DEVELOPMENT.md). The first implementation evidence
below records the pre-Google baseline; current auth behavior supersedes it.

## Implemented source

| Slice | Implementation | Verification |
| --- | --- | --- |
| Backend modules | `firebase/src/app.js`, `server.js`, middleware, shared helpers, and activity/registration/user/integration/Admin features. Old `.mjs` entrypoints retained. Worker starts once in the persistent server and stops on shutdown. | All 13 original emulator/helper checks passed before and after pure extraction. Integration service source matches its original implementation. App imports without a project environment or listener. |
| Organizer API | Caller-owned activities, optional status, stable cursor paging, trusted organizer display name. | Owner filtering, foreign cursor and wrong-role denial, page size and next page checks. |
| Student API | Active-only default retained; explicit cancelled/all-history queries and cursor paging. Safe activity enrichment and caller-only active registration ID on details. | Cancellation, repeat cancellation, re-registration, history isolation and caller-specific projection. |
| Read-only Admin | Server-provisioned ADMIN role; protected global aggregate summary, all-event list/details with a strict field allowlist. No Student/Organizer inheritance. | Cross-role denial, Admin mutation/roster/history/diagnostic denial, true global counts, draft visibility and extra-field redaction. |
| Validation/errors | Compatible error codes plus safe messages and field errors; invalid calendar dates rejected. | Invalid fields, malformed JSON, invalid dates, unverified/unprovisioned accounts, and attempted client role assignment. |
| Frontend setup/auth | Root Vite/React/Tailwind project, TypeScript build, Firebase email/password session, server-derived role, bearer-token API client. Original fixtures are not imported by the running application. | Production compilation/build and real browser sign-in through the Auth emulator and `/api/me`. |
| Student UI | Paginated activity browsing, details, register, refresh persistence, active/cancelled history, confirmation and cancel. | Browser register/reload/cancel/reload/re-register flow; closed registration disabled; network failure and retry. |
| Organizer UI | Paginated own list, complete create/edit form, save draft, publish, close, delete unused draft, paginated roster and refresh. | Form fields survive reopening; direct form publishing, published edit, close, deletion, matching event IDs/counts across roles. |
| Admin UI | Accurate global cards, paginated all-status event list, read-only event details. | Browser draft visibility, counts, no mutation controls or participant email, foreign-role route fallback. |
| Accessibility/layout | Associated field labels/descriptions, live status/error feedback, skip link, keyboard dialog focus/trapping/Escape/restore, mobile navigation. | Browser checks at 360, 768 and 1440px for the Organizer view, 360px Student flow, 1440px Admin flow; modal keyboard checks. Broader accessibility audit remains release work. |
| Retired manual demo (historical) | Guarded `demo-campus-pulse` seed, three emulator-only identities, sample activities, API + Vite launcher, graceful test teardown. | Browser suite launches and stops the isolated environment; no connected-project writes or external partner requests. |

## Checks and evidence

- `npm run build`: TypeScript and Vite production build passed.
- `npm test`: 6 helper checks passed; API suite correctly skipped without emulators.
- `PATH=/opt/homebrew/opt/openjdk/bin:$PATH npm run test:emulator --prefix firebase`:
  **18 passed, 0 failed** (12 API scenarios plus 6 helper checks).
- `npm run test:e2e`: **3 browser scenarios passed** against real local Auth,
  HTTP API, and Firestore emulators. The main scenario uses distinct Organizer,
  Student, and Admin browser sessions. It includes persistence after reload;
  the final timezone check uses a New York Organizer device and UTC Student
  device while entering/displaying campus time.
- Backend JavaScript syntax checks and side-effect-free app import passed.
- `git diff --check`: run before handoff; no generated logs or credentials included.
- Frontend production dependency audit: **0 findings** after a compatible
  `@grpc/grpc-js` override. That transport comes from unused Firestore modules in
  the Firebase meta-package; the application only imports Web Auth/App.
- Backend production audit: **8 existing moderate findings**, all in the existing
  Firebase Admin dependency chain. Audit's proposed complete fix requires
  `firebase-admin@14.5.0`, a major upgrade from the existing 13.x baseline. That
  separate SDK migration was not bundled into these application changes.

Genuine local screenshots (sample data only):

- [Admin at 1440px](docs/evidence/campus-pulse-local-2026-11-04/admin-overview.png)
- [Student details at 360px](docs/evidence/campus-pulse-local-2026-11-04/student-mobile.png)

The suite and screenshots demonstrate local behavior, not production readiness,
performance targets, actual student usability results, or lecturer approval.

## Contract and decision changes

- Updated `docs/API_CONTRACT.md`, `docs/implementation-decisions.md`, query indexes,
  environment examples, backend deployment notes, and the root README.
- Added `docs/LOCAL_DEVELOPMENT.md`, project-level AGENTS guidance, and guarded
  emulator demo setup. The initial handoff review is explicitly marked historical.
- Anonymous published-only browsing (D03) remains unresolved. Existing authenticated
  published/closed browsing was preserved. No public data route was opened.
- Firebase vs the original Supabase/Vercel PRD and the post-PRD Admin extension
  remain recorded decisions requiring lecturer confirmation for final compliance.
- Capacity, end times, arbitrary event categories, media uploads, payments,
  account management and notifications were not added to the MVP schema/UI.
- Campus timezone defaults to Asia/Bangkok and is configurable; university
  confirmation remains required before release.

## Remaining release work

1. Public Firebase web configuration is now supplied. Deploy the updated backend
   and Firestore indexes, configure exact frontend CORS origins, then verify a
   real school Google account interactively. No demo seed is required.
2. Resolve lecturer stack/Admin/public-browsing decisions and confirm campus timezone.
3. Review the existing Firebase Admin dependency upgrade independently, then run
   its regression checks before release.
4. Verify production HTTPS login, role access, CRUD, indexes, CORS, host behavior,
   and any explicitly approved Team 10 recovery demonstration. Recheck current
   hosting cost/free-tier terms before publishing.
5. Complete the broader accessibility, supported-browser, usability participant,
   performance/load and lecturer-demo evidence gates from the skills pack.

## Authorship and Git state

The initial prototype and skills/specification pack were supplied by the user.
The implementation, integration fixes, tests and documentation above were made
in this Codex session. No teammate contributions, reviews or approvals are
invented. The later implementation commit is identified above. No public push, PR,
production deployment or production seed was performed; publication is pending
explicit authorization. The
original user uploads are preserved. `firebase/firestore-debug.log` remains
local and is now ignored rather than staged or deleted.
