# AGENTS.md — Campus Events & Clubs development contract
## Mission
Ship a reliable university MVP and live demo without falsifying results or breaking existing Firebase + Team 10 work. Operate on actual repository evidence. Read `START_HERE.md`, `SOURCE_OF_TRUTH.md`, and `WORK_ORDERS.md` before implementation.

## Mandatory operating rules
1. Start each work session with `git status`, examine source and docs, state *what exists*, then select one backlog item. No sweeping rewrite or unnecessary dependency.
2. Protect existing code, configuration, integration evidence, data, and history. Use a feature branch; make focused commits; do not force push or reset shared projects.
3. Never assume the pasted investigation guarantees present behavior. Validate claims in code; update status to **verified / claimed / not tested**.
4. Default to Firebase Auth + Firestore + persistent Express/Render for implementation *only if* the lecturer permits. Supabase/Vercel is a conflicting canonical plan; record an architecture decision before changes.
5. Preserve role and ownership checks on the server. Never use only a hidden button as authorization. Never expose Admin SDK credentials in frontend. Firestore direct rules are intentionally restrictive; use API for protected data.
6. Keep registration/cancellation atomic and idempotent; avoid duplicate active registrations; don't weaken transaction behavior to make a demo pass.
7. Implement **real** frontend→API→Firestore reads/writes. Only sign-in users and clearly labeled example events should be seeded. Never mock a success response for a core demo flow.
8. No fabricated interviews, screenshots, completed tests, partner acknowledgments, reliability claims, or research citations.
9. Do not store secrets in Git, examples, browser bundles, logs, screenshots, or handoff package. Use `.env.example` with placeholders and separate environments.
10. Get approval for architecture migration, database/schema destructive changes, real external API calls with side effects, paid services, or dropping lecturer requirements. Local non-destructive tests may proceed.
11. Build vertically: each slice includes API contract, UI, server validation, tests, and acceptance evidence. Do not build all visual pages with fake data first.
12. Keep UX accessible and responsive; show loading, empty, error, success, and permission-denied states; no hardcoded absolute production URLs in components.
13. After each task: run applicable checks, manual smoke test, update `PROGRESS.md`, note changed files and unresolved issues, commit with clear message.
14. If blockers appear, report exact error, likely cause, attempted solution, workaround, and impact; do not conceal or silently simulate capability.

## Response format for the friend
- **Task ID / objective**
- **Verified starting state** (files/lines, tests)
- **Proposed changes** (minimal)
- **Implementation changes** (files)
- **Validation** (commands + result, note when not run)
- **Outstanding blockers / next task**

## Completion gate
Do not say 'finished' unless every required item in `MVP_FEATURES_AND_ACCEPTANCE.md` is demonstrated against the approved deployed environment and `TEST_PLAN.md`/`DEMO_PLAYBOOK.md` are supported by genuine evidence.
