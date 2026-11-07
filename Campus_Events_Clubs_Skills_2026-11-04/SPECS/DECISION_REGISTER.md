# Decision register — do not turn proposals into claimed approvals

| ID | Decision | Current working rule | Authority / unresolved |
|---|---|---|---|
| D01 | Backend stack | Continue Firebase Auth + Firestore + Express on persistent host, React/Vite/Tailwind frontend. Do not migrate to Supabase now. | **Provisional**; PRD still mandates Supabase/PostgreSQL and Vercel. Lecturer brief may override. Record approved deviation before final marking. |
| D02 | Admin | Build **read-only event oversight** as an **explicit post-PRD scope extension**, not a silent reinterpretation. | User stated they told lecturer; exact approval/criteria not yet provided. No broad Admin powers. |
| D03 | Public event browsing | Figma can show visitor teaser but **do not claim public GET works**. Existing `/api/*` requires verified Firebase ID token. | PRD AC-FR-01 says anonymous published-only browsing; API contract says authenticated. Request final choice. Safest compatible default: signed-in browsing first. |
| D04 | Organizer-owned draft listing | Introduce dedicated protected `GET /api/me/activities` endpoint; preserve existing listing semantics. | Proposed P0 requirement for a real Organizer UI; implement with ownership-filtered Firestore query and pagination. |
| D05 | Cancelled history | Extend `GET /api/me/registrations` to include ACTIVE + CANCELLED records, using optional status filter or separate query, backwards-compatible where possible. | PRD requires history/status; existing endpoint active only. Confirm compatibility with older consumers. |
| D06 | Error envelope | Standardize safe `error: { code, message, fieldErrors? }` while retaining existing `error.code` consumers. | PRD expects message/field errors; API currently code-only. Do not reveal sensitive detail. |
| D07 | Organizer name | Show a safe display name if actually available and permitted; no fabricated name. | PRD activity details need Organizer. Existing API only verified to have owner ID. Validate Users model/projection. |
| D08 | Admin visibility | Admin may view all activities across organizers (including drafts) plus safe aggregate counts. No student identities/rosters, logs or mutations. | Proposed minimal Admin extension. Authorization and pagination mandatory. |
| D09 | Uploads | **Not in this release** unless lecturer explicitly adds image/file uploads. Use category illustration fallback. | PRD 10 and 18 exclude file storage and list images as future work. |
| D10 | Test schedule | Integrate first, do comprehensive QA after wiring; retain fast checks each feature. | User schedule preference, with safety/functional guardrails. |
| D11 | Team contribution history | Genuine feature/review/test/docs/integration contributions via branches/PRs. | No fictitious commit attribution by moving files or stashes under other names. |
| D12 | Demo accounts/data | Approved dedicated Student, Organizer and Admin accounts + small clearly described sample events; actual API persistence. | Credentials/seeds must be configured privately; do not modify production until approved. |

## Decision handling
When the lecturer supplies formal instructions, record date/source and change only the affected work order. Do not retroactively label a proposal "required" or claim scope compliance while D01/D02/D03 are unresolved. Maintain `docs/implementation-decisions.md` in the real repository.
