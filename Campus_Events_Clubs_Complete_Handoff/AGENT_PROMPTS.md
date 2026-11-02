# Agent prompts — ready to paste to friend's coding agent

## First message / orientation (paste ONCE)
> You are implementing a university Campus Events & Clubs MVP in an EXISTING repository. Read `START_HERE.md`, `AGENTS.md`, `SOURCE_OF_TRUTH.md`, `DECISIONS_AND_BLOCKERS.md`, `MVP_FEATURES_AND_ACCEPTANCE.md`, `WORK_ORDERS.md`, and `BACKLOG.csv` (from the handoff pack, committed under a handoff/docs folder). The original investigation is user-provided, not proof of the current branch. First inspect repository code, git status, scripts, tests, endpoints, lecturer brief/rubric and infrastructure. Report any conflicts. Do not code or migrate architecture until you establish the baseline and D1/D2. For speed provisionally retain Express/Firebase/Firestore/Render, unless official requirements mandate otherwise. Never fabricate live behavior, integration evidence or human research. Work in small, tested PRs and update `PROGRESS.md`. Start Phase 0 and report results.

## Subsequent task prompt (one task at a time)
> Implement backlog task **[ID + TITLE]**, following `AGENTS.md` and `WORK_ORDERS.md`. Before edits, cite exact existing source/lines, current test status, impacted roles, data contract and minimal plan. Keep changes small, preserve existing functionality and secrets, and add tests appropriate to the slice. After edits give changed files, test commands + results, manual verification, commit SHA, and `PROGRESS.md` update. If lecturer scope or architecture decision blocks this task, stop and explain the decision needed.

## Fast QA audit before final deploy
> Audit all P0 acceptance criteria against the *deployed* product, not just README. Perform student and organizer end-to-end journeys with controlled demo accounts and real data, cross-role/ownership denial tests, refresh persistence, responsive checks, CORS/preflight, secret scan, and error states. Verify `/health` separately from authenticated Firestore operations. Record truthful pass/fail/not-tested evidence and a prioritized remaining blockers list. Do not alter or reset shared data without approval.

## Final handoff to lecturer demo owner
> Produce a single page with final URLs (no credentials), demo account ROLE labels and secure access handoff method, prerequisite services, exact reproducible steps, clean state/reset procedure, genuine test summary and known limitations. Update README to match the implemented stack and note conflicts with historical architecture documents; preserve dated assignment evidence.
