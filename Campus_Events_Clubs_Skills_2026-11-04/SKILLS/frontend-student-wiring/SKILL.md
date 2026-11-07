---
name: frontend-student-wiring
description: Complete Student frontend screens using the observed API, including persistence, duplicate and cancelled history UX.
---
# Skill: Wire Student flows
**Use when:** Auth + central API client works.

## Procedure
1. Implement event list with cursor/Load More, Activity details, registration POST and My Registrations (ACTIVE/CANCELLED). Use accepted Figma components and theme.
2. Display real fields only; if organizerName isn't supported yet show honest fallback. Format dates in confirmed campus time zone.
3. On Register disable button while request is in flight; show success only after 201, then reload own registrations. `409 ALREADY_REGISTERED` yields informative state not a false success.
4. Closed event remains visible but Register disabled; duplicate registration and role 403 handled. Require confirmation for Cancel; PATCH `/cancel`, show server authoritative CANCELLED result and retain history.
5. Handle loading, no activities, no registrations, expired auth, offline/network, denied, validation and unexpected errors. Stay usable at 360 px.
6. Use dedicated demo accounts to smoke one register->refresh->cancel in emulator/isolated environment after wiring. Do not run full final QA yet.

## Acceptance
Student can discover, view, register, refresh, see active, cancel and see CANCELLED history against real persisted backend. No preview data survives production path.
