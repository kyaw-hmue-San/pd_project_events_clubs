# Progress tracker (initially based on pasted report; must reverify)
**Project branch:** `implementation/phase-1-verified-baseline`  **Implementer:** GitHub Copilot  **Phase 2 base commit:** `e4b038a`  **Demo environment:** Local emulator tests pass; production authenticated CRUD not tested  **Last checked:** 2026-11-03
Status vocabulary: `NOT STARTED`, `IN PROGRESS`, `DONE (verified)`, `BLOCKED`, `NOT REQUIRED`.

## Verified starting state (2026-11-03)
- Firebase/Express backend and Team 10 integration exist in the current checkout; see [implementation baseline](../docs/implementation-decisions.md). No remote API writes or partner calls were made in this session.
- `npm test --prefix firebase`: 6 passed, 0 failed. These are integration-helper tests, not API/Firestore end-to-end coverage.
- `node --check firebase/api.mjs` and `node --check firebase/integration.mjs`: passed.
- No frontend app or root package manifest exists yet.
- `firebase/.env` exists and is ignored; names only were inspected, never values. This does not verify credential validity or Firestore access.
- Current lecturer implementation brief and final rubric are not in the repository; continue the reversible Firebase-backed MVP while tracking this risk.

## Working board
| Task ID | Status | Implementer | Commit / PR | Test result / evidence | Blocker / next action |
|---|---|---|---|---|---|
| 001 | DONE (verified) | Copilot | — | Current tree, routes, dependencies, environment-key presence and branch verified; see [implementation baseline](../docs/implementation-decisions.md) | Continue to Task 006 |
| 002 | BLOCKED | Team | | Current implementation brief/final rubric unavailable in repo | Request from lecturer; reversible work continues |
| 003 | IN PROGRESS | Team | | User selected Firebase/Express/Render provisionally; decision recorded | Confirm no lecturer-mandated Supabase migration |
| 004 | NOT STARTED | Team | | `.env` values not inspected; demo account UIDs not present among checked variable names | Confirm isolated demo project/accounts before seeding |
| 005 | DONE (verified) | Copilot | — | 6 tests pass; both Node syntax checks and dependency resolution pass | Add API/Firestore regression coverage in Task 011 |
| 006 | DONE (verified) | Copilot | `e4b038a` | Current routes, auth, inputs/outputs, limits, and known mismatches documented in [API contract](../docs/API_CONTRACT.md) | Contract is ready for frontend use after Phase 2 review |
| 007 | DONE (verified) | Copilot | — | Emulator verifies Students can list/open CLOSED events and cannot reopen closed events | Production behavior not re-tested |
| 008 | DONE (verified) | Copilot | — | Emulator verifies old body route and new `/cancel` route, repeat cancellation, and cross-user denial | Existing Postman route remains supported |
| 009 | DONE (verified) | Copilot | — | Emulator verifies explicit-origin preflight, rejected origin, auth still required, and request-header allowlist | Set deployed `FRONTEND_ORIGINS` before browser deployment |
| 010 | DONE (verified) | Copilot | — | Emulator verifies UID allowlist, deny-other-Organizer, payload/response redaction, Student role denial | Configure intended viewer UID privately on host |
| 011 | DONE (verified) | Copilot | — | 13/13 emulator tests pass using `demo-campus-events-tests`; 6/6 ordinary helper tests pass | Run browser/E2E tests in later phases |
| 012 | DONE (verified) | Copilot | — | Worker code reviewed; provider/webhook HTTP contracts pass emulator tests; worker remains unchanged and persistent | No external call or automatic recovery test; retry loop has no maximum-attempt policy, carry to Task 030 |
| 013–017 | NOT STARTED | | | | Student flow |
| 018–021 | NOT STARTED | | | | Organizer flow |
| 022–027 | NOT STARTED | | | | Deploy/demo/evidence |
| 028–031 | NOT STARTED | | | | P1/P2 extensions |

### Daily brief template
**Date/branch/commit:**  
**Completed + proof:**  
**Changed files:**  
**Tests run/results:**  
**Not tested and why:**  
**Decisions/blockers:**  
**Next top priority:**
