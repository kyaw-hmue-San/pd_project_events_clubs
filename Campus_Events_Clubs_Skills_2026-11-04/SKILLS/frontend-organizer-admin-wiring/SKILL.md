---
name: frontend-organizer-admin-wiring
description: Wire Organizer forms/rosters and minimal Admin oversight screens to actual authorized backend APIs.
---
# Skill: Wire Organizer and Admin
**Use when:** Student flow and API client are functional; new Organizer/Admin GET endpoints are available.

## Procedure
1. Organizer: own activities list via `GET /api/me/activities` showing DRAFT/PUBLISHED/CLOSED; no global list used to fake own draft inventory.
2. Create draft, edit own activity, publish after required fields, close with confirmation; enforce no reopen UI and show backend errors instead of optimistic unverified success.
3. Show registration roster via owned activity route and page/list limits; no unrelated personal data. Refresh after Student registers/cancels.
4. Admin: overview from verified accurate aggregate API, all activity list incl drafts across organizers, read-only details; remove every mutation affordance from Admin shell.
5. Protect pages by `/api/me` role plus server `403`; Admin can never call Organizer write flows. No company finance metrics, user management or private roster.
6. Validate one Organizer publish + Student register + Organizer roster + Admin view using distinct local/emulator accounts. Full E2E/cross-role test matrix comes later.

## Acceptance
Shared event has the same server-generated ID and status across all three role screens, one row persisted on Student registration, and Admin can only read.
