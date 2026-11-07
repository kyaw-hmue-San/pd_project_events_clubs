---
name: figma-student-experience
description: Design and prototype the complete Student discovery, details, registration and cancellation journey without fake production behavior.
---
# Skill: Figma Student experience
**Use when:** Designing first usable Student flow in Figma Make.

## Inputs
PRD FR-01–07, BR-01–08, AC-FR-01–07; backend observed route table; `SPECS/SCREEN_AND_DATA_HANDOFF.md`.

## Procedure
1. Compose Sign In, Events & Clubs discovery, Activity Details, My Registrations and cancellation confirmation screens.
2. Include title/description/type/date/time/place, organizer display when data exists, Published/Closed and eligibility status; do not invent capacities or uploaded images.
3. Show Preview-only activity examples in Figma; tag prototype data as sample. For real app, registration must call POST activity registration endpoint with Firebase ID token.
4. Handle `409 ALREADY_REGISTERED`, closed event, `401` login, `403` role, invalid credentials, loading, empty state, network retry, refresh and cancellation idempotency as designed states.
5. Show both ACTIVE and CANCELLED registration history, despite current API active-only limitation; annotate backend requirement in handoff.
6. Make cancel require confirmation, then only show success after a real server reply in the wired app; no client-only persistent state.
7. Verify visual and interaction hierarchy at mobile and desktop. Keep categories as Event / Club Activity.

## Deliverables
Five role-specific interactive screens, states matrix, annotated API call expectations, reusable components and exportable code.

## Acceptance
Designer can click through discover -> details -> preview register -> history -> preview cancel; the prototype honestly indicates sample behavior and correctly hands off real API dependency.
