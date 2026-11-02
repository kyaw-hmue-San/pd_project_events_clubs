# Decisions and blockers — resolve deliberately

## D1. Final lecturer scope [OPEN / highest priority]
**Input needed:** latest project brief, submission checklist, grading rubric, requested demo length, individual/team deliverables, due date if any. The architecture workshop rubric alone is not the final implementation rubric. Until supplied, pursue the smallest usable Student + Organizer MVP; do not claim full course compliance.

## D2. Architecture decision [PROVISIONAL]
**Recommended for demo unless lecturer requires otherwise:** React + Vite frontend; **existing** Express API + Firebase Auth + Firestore backend deployed on persistent Render-style service. A static frontend can deploy to Vercel/other static host; do not move long-running worker to serverless Functions.  
**Why:** existing implemented backend minimizes risk and preserves Assignment 3/5 evidence.  
**Trade-off:** canonical main-MVP docs show Supabase/PostgreSQL/Vercel; must update *final architecture appendix* transparently, while preserving original assignment submissions.  
**Decision owner:** project team + lecturer if stack mandated.  
**If Supabase explicitly required:** stop further Firebase-specific UI integration, scope a funded/time-bounded migration separately; do not maintain two conflicting production data sources.

## D3. Closed event behavior [OPEN]
Proposal: Published events are publicly visible to signed-in Students; `CLOSED` events remain visible with registration disabled, cannot reopen, and existing historical registrations stay viewable. Confirm against PRD and backend. Add tests before implementing. Never silently change teacher-required lifecycle rules.

## D4. Cancellation contract [OPEN]
Pick and document *one* route. Prefer a backward-compatible adapter if clients/tests depend on the existing `PATCH /api/registrations/:id` endpoint; frontend always uses shared typed API client matching deployed implementation. Update PRD/API guide and tests. Don't invent new routes until inspecting current code.

## D5. Test/demo environment [OPEN]
Separate demo Firebase project/data where practical; or an isolated collection namespace if code supports it safely. Use dedicated Student and Organizer Firebase Auth accounts. **Never** overwrite existing real data or reuse personal credentials.

## D6. Account creation/roles [OPEN]
Existing seed script reportedly creates demo roles. Verify teacher needs public signup vs prepared role accounts; public Organizer self-selection would be a privilege escalation. For demo, controlled provisioning is acceptable. Do not invent signup requirement.

## D7. Team 10 service availability [OPEN]
Check permission to send live integration requests; preserve API contract, retries, and evidence. If partner is unavailable, demonstrate truthful queued/degraded mode, label historical evidence, and explain limitations; do not fake success.

## D8. Visual design [PROPOSAL]
Modern, trustworthy, campus-friendly UI. Specific tokens/layout in `DESIGN_SYSTEM.md` are **new recommendations**, not extracted lecturer requirements. User/lecturer can adapt colors/branding.

## Decisions ledger (friend fills this before implementation)
| ID | Final decision | Who approved | Date | Impact on docs/tests |
|---|---|---|---|---|
| D1 | TBD | TBD | TBD | TBD |
| D2 | TBD | TBD | TBD | TBD |
| D3 | TBD | TBD | TBD | TBD |
| D4 | TBD | TBD | TBD | TBD |
| D5 | TBD | TBD | TBD | TBD |
| D6 | TBD | TBD | TBD | TBD |
| D7 | TBD | TBD | TBD | TBD |
| D8 | TBD | TBD | TBD | TBD |
