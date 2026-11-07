---
name: figma-organizer-experience
description: Design a practical Organizer dashboard and create/edit/publish/close/roster flows matched to server ownership and lifecycle constraints.
---
# Skill: Figma Organizer experience
**Use when:** Creating Organizer UI after design foundation.

## Inputs
PRD FR-08–11, BR-04/05/07, `API_CONTRACT.md`, decision D04.

## Procedure
1. Design My Activities page that displays ONLY own DRAFT/PUBLISHED/CLOSED items with clearly labeled status and owner context.
2. Provide Create / Edit form using real required fields: title, description, activityType EVENT/CLUB_ACTIVITY, dateTime and location. Save Draft and Publish are distinct.
3. Make Close activity a confirmed action; CLOSED cannot reopen and cannot accept new registrations. Delete only unused DRAFT if UI exposes it.
4. Design roster view for activity's registrations, including active/cancelled status and only necessary data, with mobile cards.
5. Design errors for missing fields, cross-owner denied, failed publish, stale data and no participants. Keep client form values until server confirms.
6. Annotate `GET /api/me/activities` as **new backend endpoint needed**, rather than deriving own drafts from public list.
7. Keep all visuals composed from common design tokens and components.

## Deliverables
Organizer activity list, create/edit view, status actions and roster, plus component/use-case map.

## Acceptance
Organizer prototype covers draft -> publish -> appears to student -> roster; no Admin editing controls or pretend production save.
