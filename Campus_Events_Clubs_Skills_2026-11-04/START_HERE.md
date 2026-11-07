# Campus Events & Clubs — Figma + Full-Stack Agent Skills Pack
**Prepared:** 2026-11-04 | **Product:** Team 12, Platform Development, one-semester MVP | **Budget constraint:** 0 THB

## Purpose
Help one implementer and a five-student team finish a **real, connected, presentable application** with modular code, clear honest contribution history and a later end-to-end test/release pass. This is a **skills/specification handoff, not finished source code**.

## Status at packaging (from provided documents, NOT independently rerun)
- Express 5 + Firebase Auth + Firestore API and Team 10 integration implemented; source currently concentrated in `firebase/api.mjs` and `firebase/integration.mjs`.
- Phase 2 report claims **13 passing emulator API tests** and **6 passing helper tests**; no production Auth/Firestore CRUD, browser CORS or Team 10 live recovery verification.
- No React/Vite frontend shown in progress snapshot. Backend modularization, Organizer-own activity listing, cancelled history and Admin panel have not been implemented in those sources.
- PRD specifies React/Vite/Tailwind + Supabase/PostgreSQL/Vercel and **explicitly excludes Admin**. User now proposes a **small read-only Admin panel** after discussing with lecturer. Neither the Firebase deviation nor Admin extension is confirmed as formal rubric approval.

## Exact reading order
1. `REFERENCES/PRD.md` — product scope and acceptance; **do not assume its old stack is resolved**.
2. `REFERENCES/API_CONTRACT.md` — what backend currently does, not a wish list.
3. `REFERENCES/implementation-decisions.md` + `REFERENCES/PROGRESS_snapshot.md` — observed implementation/verification status.
4. `SPECS/DECISION_REGISTER.md` + `SPECS/REQUIREMENTS_MATRIX.md` — bounded decisions and work left.
5. `AGENTS.md` — safety, modularization, team attribution and build-first rules.
6. Choose a skill under `SKILLS/*/SKILL.md` for the specific job.

## Two agent entrypoints
- **Figma Make:** paste `PROMPTS/FIGMA_MAKE_MASTER_PROMPT.md` in Figma Make, attach PRD and `SPECS/DESIGN_TOKENS.md` if supported. The SKILL.md files are reference instructions for humans/agents, **not proof Figma Make automatically executes local skills**.
- **Coding agent / friend:** place `AGENTS.md` at repo root (or copy its rules into existing root AGENTS.md after merging carefully), add this pack as `docs/handoff/` or separately, paste `PROMPTS/CODING_AGENT_MASTER_PROMPT.md`, then follow skill files by phase. Do not replace project sources with these documents.

## Delivery sequence — build-first, not no-checks
A. Confirm scope and freeze current 19-test baseline; choose authorized repo branch. Figma creates UI in parallel.
B. Modularize backend **without changing endpoint behavior**. Preserve `.mjs` entrypoints as shims if needed; use `.js` with `"type":"module"` only after checking manifest.
C. Fill P0 Student/Organizer gaps and implement minimal read-only Admin as **scope extension**. Record API/schema changes.
D. Bring approved Figma code into React/Vite/Tailwind app; build all required screens and wire real Firebase sign-in -> bearer-token Express API -> Firestore. No fake core paths.
E. After complete wiring, perform comprehensive emulator/frontend/E2E/security/responsiveness/production checks, fix failures, gather honest evidence, deploy and rehearse lecturer demo.

**Minimum checks during A–D:** compile/build/syntax/lint where configured, current backend tests on changes, and one real (emulator) request per newly wired vertical slice. The comprehensive suite is intentionally concentrated in E, **not skipped**. No merge of known-broken functionality just because the full QA phase is later.

## Start commands
- Figma designer: use `PROMPTS/FIGMA_MAKE_MASTER_PROMPT.md`.
- Agent developer: use `PROMPTS/CODING_AGENT_MASTER_PROMPT.md`.
- Later complete QA: use `PROMPTS/FINAL_QA_PROMPT.md`.
- Track per-feature actual contributions using `SPECS/TEAM_COLLABORATION.md`; update the repository's real `PROGRESS.md`, not this frozen snapshot.

## Completion definition
Only say **complete** when all approved PRD + Admin-extension flows work across roles through real HTTP/Firebase/Firestore, are accessible at a real URL, have deployed smoke evidence and pass the agreed release checks. See `SPECS/TEST_AND_RELEASE.md`.
