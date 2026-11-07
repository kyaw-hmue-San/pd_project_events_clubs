# Five-person contribution and Git handoff workflow
The user may write a large share of the initial implementation. **Contribution evidence must still reflect actual work**, not reshuffled code attributed to teammates.

## Suggested roles (flexible, not assigned names)
- Integrator / backend lead: modularize API, contract changes, merge reviews.
- Student feature contributor: implement/refine student UI, request/error states, accessibility.
- Organizer feature contributor: create/edit/publish/roster screens, verify owner boundaries.
- Admin / integration contributor: restricted Admin read-only screens/API or Team 10 compatibility checks.
- QA + release contributor: automate tests, seed isolated accounts, production smoke, evidence/readme/demo.

These are **workstream examples**. One person may begin the code; others earn traceable contributions through genuine subsequent changes, tests, review comments, fixes and deployment work.

## Git process
1. Integrator creates `feature/backend-modular`, `feature/student-ui`, `feature/organizer-ui`, `feature/admin-readonly`, etc. from up-to-date main. Commit functional patches on genuine author's branch.
2. Teammates pull branches, review/modify real code, add their own tests/fixes/docs and commit using their own configured Git identity.
3. Push and open focused PR; tag reviewer(s); record changed files, acceptance, checks and links in progress tracker. Squash only with team approval preserving co-authorship as appropriate.
4. Integrate frequently, resolve conflicts openly. Do not have all five copy the same implementation from Google Docs and pretend independently implemented.
5. Use Docs for requirements, meeting notes and demo scripts, **not source-of-truth executable code**. `git stash` is local scratch space, not a collaboration/delivery method.
6. Never push `.env`, Firebase Admin credentials, session tokens, sensitive screenshots, local emulator data or real personal information.

## Evidence for lecturer
Each member can explain what they did and show PR/commit history, tests added, review notes or deployed configuration contributions. Record genuine role-review names once provided, but do not invent credits.

## Fast progress reporting
`Task ID | Feature | Assignee | Implemented/Integrated/Tested/Released | Branch | PR/commit | Evidence | Blocker`.
Don't label someone else's unmodified code as your feature implementation merely because they pushed it.
