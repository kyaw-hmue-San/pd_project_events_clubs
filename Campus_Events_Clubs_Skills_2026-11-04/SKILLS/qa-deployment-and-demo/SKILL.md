---
name: qa-deployment-and-demo
description: Execute comprehensive cross-role QA after wiring, deploy within 0 THB constraints if achievable, and collect authentic lecturer evidence.
---
# Skill: Release QA and demo
**Use when:** All required pages and backend routes are connected. **Not** a substitute for basic quick checks during development.

## Procedure
1. Follow `SPECS/TEST_AND_RELEASE.md` and `PROMPTS/FINAL_QA_PROMPT.md`; construct a PRD FR/AC and Admin acceptance matrix with pass/fail evidence.
2. Run full emulator suite; add auth/role/ownership/concurrency/cancellation/closed lifecycle/validation/admin read-only/Team 10 regression tests. Re-run helper tests.
3. Run frontend E2E across three real test identities in isolated project; double browser role transitions, refresh persistence, network/error states.
4. Verify accessibility and responsiveness 360–1440, keyboard tab focus and dialogs, no overflow.
5. Run production HTTPS smoke using approved demo data after checking origin/credentials and persistent server. Watch hosting free-tier limits, sleeping hosts, actual billing status, CORS. Run no unapproved external partner calls.
6. Measure perf and usability targets only if time/test participants exist; mark unverified otherwise. Capture redacted screenshots, HTTP status, timestamp and commit.
7. Rehearse short live demo in `SPECS/DEMO_AND_SEED.md`; prepare honest fallback if host unavailable.
8. Update deployment guide, API contract, README, progress, role contributions and source-of-truth decisions.

## Acceptance
No P0 bug, genuine authenticated production full journey, protected Admin, validated free-tier operation, recorded evidence and safe deploy. Do not say "all tests pass" if anything omitted.
