---
name: backend-admin-readonly
description: Implement minimal ADMIN role and strictly GET-only campus event monitoring with safe aggregates; extend the original PRD explicitly.
---
# Skill: Backend Admin extension
**Use when:** Building backend needed for proposed read-only lecturer Admin panel.

## Warning
Original PRD disallows Admin. This is a **change request**: log accepted scope or unresolved lecturer confirmation before final compliance claim.

## Procedure
1. Review role-check middleware that currently accepts only STUDENT/ORGANIZER. Add a protected ADMIN role to supported roles. Never allow client-submitted role claims or open sign-up to grant ADMIN; provision via trusted script/service account in approved environment.
2. Add Admin-only `GET /api/admin/summary`, `GET /api/admin/activities` and optionally `GET /api/admin/activities/:id`, routed through ADMIN authorization. Use strict field allowlists, no student roster, emails, integration logs or secrets.
3. List all organizers' DRAFT/PUBLISHED/CLOSED activities with stable pagination and safe display name. Keep Student/Organizer public/own visibility unchanged.
4. Counts must reflect whole dataset using appropriate Firestore aggregation or maintained accurate counters, not sum of first 20 results. Omit unverified totalRegistrations if it cannot be safely computed.
5. Ensure `ADMIN` cannot call Organizer mutations or Student registration/cancellation endpoints; do not accidentally grant universal privileges when extending auth global role list.
6. Consider Firestore composite indexes and free-tier query limits; do not scan entire database every page render.
7. Add targeted emulator allow/deny checks as fast gate, and defer broad cross-role E2E suite to post-wiring QA.
8. Update API_CONTRACT, scope extension, progress and demo role guide.

## Acceptance
ADMIN GET works, Student/Organizer get 403, Admin mutations get 403, unprivileged users cannot self-promote, private roster remains inaccessible.
