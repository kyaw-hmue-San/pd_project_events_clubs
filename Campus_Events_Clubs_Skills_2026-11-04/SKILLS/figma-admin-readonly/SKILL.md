---
name: figma-admin-readonly
description: Add a restrained read-only Admin monitoring area as a proposed lecturer scope extension, without expanding privileges.
---
# Skill: Figma read-only Admin
**Use when:** Adding the requested Admin role screens to Figma Make.

## Scope note
Original PRD explicitly excludes Admin; user says lecturer was told about extension. **Do not label this rubric-mandated without confirmation**.

## Procedure
1. Build Admin Overview, All Activities and Activity Detail using the same Student/Organizer design system.
2. Dashboard metrics: total events, drafts, published and closed, plus registration total ONLY IF the real API can calculate complete accurate value. Use "Preview count" labels for prototype data.
3. List all organizers' events with status, organizer display, date, place and pagination, including DRAFT visible **only** to Admin; organizer's private drafts remain hidden to Student.
4. Do not render edit, delete, publish, cancel, manage-users, integration logs or student roster controls. Read-only explanation should be visible but not patronizing.
5. Design `401`, `403`, empty, pagination, loading and server-error states, plus keyboard-safe desktop table/mobile stacked items.
6. Annotate all calls `GET /api/admin/{summary,activities,activities/:id}` as proposed endpoints, requiring backend ADMIN role verification and safe data projection.

## Deliverables
Three cohesive responsive screens, preview-only data noted, no fake CRUD interactions, route/endpoint handoff.

## Acceptance
An Admin prototype can inspect campus activity status and nothing else. No sensitive student PII is displayed.
