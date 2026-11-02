# Source of truth — what the provided investigation actually supports
**Source:** User-pasted repository investigation from 2026-11-02. This ZIP author has **not independently opened the repository or re-run its checks**.

| Finding from investigation | Evidence/limitations to preserve |
|---|---|
| Repo clean at `main`, 52 tracked files, latest commit `Evidence` on 2026-09-21 | At investigator's inspection only; re-run `git status`, `git log`, `git ls-files` on handoff. |
| Firebase API in `firebase/api.mjs`; integration in `firebase/integration.mjs` | Existing activity, registration/cancel, organizer/role checks, Team 10 integration reported. Inspect routes and shape, not just summary. |
| Existing tests 5/5 pass; Node syntax checks pass | Only integration *helper* tests; does not establish API E2E or frontend correctness. |
| Render `/health` returned `{"status":"ok"}` on 2026-11-02 | Process liveness only; not proof Firebase auth, database connectivity, or authenticated CRUD. |
| Team 10 September integration screenshots and redacted logs present | Historical evidence; automatic consumer recovery not captured, recovery followed manual request. Revalidate if this is graded. |
| No React/Vite frontend found in tracked files | Recheck on teammate's branch; do not claim UI is already built. |
| Early architecture: React/Vite + Express + Supabase + Vercel | Main PRD/architecture describes intended MVP; **not** current implemented database. |
| Assignment 3/5: Firebase Auth/Firestore + Express + Render + partner integration | Separate implementation track; no approved migration between tracks shown. |
| Workshop architecture 100-point rubric in `docs/02_architecture_design.md` around line 604 | Includes architecture consistency and individual role reviews; inspect actual rubric before claiming compliance. |
| Missing current lecturer final-implementation brief, Assignment 5 full marking rubric/deadline | Must be supplied or explicitly marked unknown. |

## Investigated gaps requiring action or decision
- Activity `CLOSED` state: PRD says still visible and cannot be reopened; API reportedly hides it from Student and permits `CLOSED → PUBLISHED`. Verify code and choose documented product rule before patching.
- Cancellation: PRD `PATCH /api/registrations/:id/cancel`; Firebase API `PATCH /api/registrations/:id` with `{ "status": "CANCELLED" }`. Contract must be unified before frontend wiring.
- Cross-origin CORS not configured; browser frontend needs approved-origin preflight support (CORS is not authentication).
- Express interval worker is for persistent runtime; do not copy to stateless Vercel Functions without redesign.
- Any Organizer reportedly can view integration logs; restrict by actual ownership/admin policy, minimize/redact PII.
- Registration lists limited to 50; add pagination if needed. Partner retry has no max; add bounded retry/backoff with safe behavior if required.
- Current database permissions/indexes and authenticated routes not verified in production; test safely in demo environment.
- Student/Organizer interviews/validation not yet verified; genuine research and individual contributions cannot be filled in fictitiously.

## First files to inspect in repository
`README.md`, `docs/PRD.md`, `docs/architecture.md`, `docs/02_architecture_design.md`, `docs/role-reviews.md`, `docs/firebase_database_assignment.md`, `docs/A5-Team12-Integration-Evidence.md`, `firebase/api.mjs`, `firebase/integration.mjs`, `firebase/package.json`, `firebase/DEPLOY.md`, `firebase` tests, rules, seed scripts. Names based on prior report; verify paths.
