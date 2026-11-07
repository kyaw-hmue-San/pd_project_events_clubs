---
name: backend-fill-prd-gaps
description: Implement missing P0 Organizer list, Student cancelled history, organizer display and safe validation error behavior compatible with existing API clients.
---
# Skill: Backend PRD gap closure
**Use when:** Backend feature modules are extracted and UI wiring needs missing endpoints.

## Procedure
1. Read `SPECS/API_GAP_AND_ROLE_MATRIX.md` and actual code. Document exact existing schema/indices; do not guess field names.
2. Add `GET /api/me/activities` for owning Organizer, include draft/published/closed, cursor/pagination; derive UID server-side. Return no other Organizer drafts.
3. Extend Student history to include CANCELLED as required by PRD. Preserve existing consumers via reviewed optional flag or safe response migration. Consistent UTC timestamps and stable pagination.
4. Add organizer display from trusted user profile if available. If not, design safe fallback and mark data gap; never invent names/emails.
5. Centralize API errors to `error.code` + user-safe message + optional field errors; preserve existing error code. Validate statuses/fields/pagination and don't leak stack traces.
6. Confirm CLOSED rules, both cancellation formats, concurrency transaction and auth still hold. Document Firestore index requirements and deployed setup needs.
7. Fast-check affected routes using emulator and syntax, then update contract and real progress. Full regression suite after feature wiring.

## Deliverables
New/extended API contracts, modular handlers/services/validators, necessary index config and concise evidence.

## Acceptance
An Organizer can see own draft; a Student sees cancelled history; no cross-account leakage; validation actionable; existing client routes intact.
