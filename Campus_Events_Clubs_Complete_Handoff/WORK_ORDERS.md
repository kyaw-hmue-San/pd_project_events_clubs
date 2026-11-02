# Execution orders — friend/coding agent follows this sequence
**Use exactly one phase at a time; review before moving forward.** Match each task ID in `BACKLOG.csv`. All work starts by verifying actual source and the lecturer scope; no task is approved merely by this document.

## Phase 0 — lock truth & unblock (short)
**Orders:** 001 inspect repo/current branch; 002 collect lecturer requirements; 003 record stack decision; 004 establish demo isolation and role provisioning; 005 baseline tests.  
**Output:** `docs/implementation-decisions.md`, up-to-date route inventory, list of missing inputs, checked baseline commands, branch.  
**Gate:** choose no architecture rewrite without explicit requirement; credentials/external services handled safely.

## Phase 1 — stabilize API contract and environment
**Orders:** 006 endpoint contract inventory, 007 lifecycle alignment, 008 cancel contract alignment, 009 CORS, 010 role ownership/log privacy, 011 emulator/contract tests, 012 integration worker review.  
**Output:** one contract for frontend, passing baseline tests, ability to make authenticated request from local browser.  
**Gate:** Student role cannot use Organizer API; transaction duplicate logic still works; required changes have regression tests.

## Phase 2 — build vertical Student experience
**Orders:** 013 frontend scaffold/theme/router, 014 Firebase client auth/session, 015 event list/details, 016 register/duplicate UI, 017 My Registrations/cancellation.  
**Output:** student signs in, sees data, registers, reloads, cancels using real Firestore API.  
**Gate:** complete Student journey with no mocked persistence and no server-auth bypass.

## Phase 3 — build Organizer experience
**Orders:** 018 organizer list/ownership, 019 create/edit/publish event, 020 roster view, 021 cross-role journey.  
**Output:** organizer publishes; Student sees and joins; organizer sees actual roster.  
**Gate:** create-publish-register roster demonstrated in two browser profiles; unauthorized cross-owner test passes.

## Phase 4 — productionize the demo
**Orders:** 022 responsive/accessibility/error states, 023 safe demo seeding, 024 deployment and secrets, 025 live smoke tests, 026 integration recheck, 027 evidence/documentation and demo recording/rehearsal.  
**Output:** live link, reproducible demo, genuine screenshots/checklist, README and contributions.  
**Gate:** `DEMO_PLAYBOOK.md` rehearsed live; P0 acceptance tests all pass on deployed setup.

## P1 extensions only when gates pass
028 paginate, 029 add robust E2E automation, 030 improve retry/automatic recovery evidence, 031 optional discovery filters if lecturer scope. Do **not** sacrifice deploy/demo for decorative scope.

## Every task's acceptance protocol
1. State observed existing behavior with file and line references.
2. Propose minimal file changes and non-destructive test commands.
3. Implement (one feature slice) and preserve current APIs where possible.
4. Run available tests; explicitly list *not run* tests.
5. Manually verify in role-correct UI and/or emulator.
6. Update `PROGRESS.md`: DONE/BLOCKED, commit SHA, evidence link/screenshot path, next task.

## Friend/agent handoff rhythm
- Friend owns coding review, choices, credentials, actual tests and deployment; the agent implements small approved slices.
- Each working session begins with `AGENT_PROMPTS.md` **session prompt** plus current task ID; no need to paste the full ZIP each time if files are checked into their branch.
- If student/organizer login works but create/publish fails, stop and fix API permissions/shape; don't hide failure with preloaded cards.
- When urgent: ship the minimum **real vertical slice** before optional dashboard styling.
