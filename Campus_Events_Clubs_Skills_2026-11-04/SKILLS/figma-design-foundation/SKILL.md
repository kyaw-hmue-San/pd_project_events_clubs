---
name: figma-design-foundation
description: Establish a single accessible Campus Pulse design language and reusable React-friendly component library in Figma Make.
---
# Skill: Figma design foundation
**Use when:** Starting any Student, Organizer or Admin Figma Make generation, or when designs drift across screens.

## Inputs
`PROMPTS/FIGMA_MAKE_MASTER_PROMPT.md`, `SPECS/DESIGN_TOKENS.md`, `SPECS/SCREEN_AND_DATA_HANDOFF.md` and PRD sections 1–7 and 11.

## Procedure
1. Define product name **Campus Events & Clubs**, not a new app. “Campus Pulse” is visual concept only.
2. Apply navy/blue/teal/amber token system from spec; typography Inter/Plus Jakarta, background, card, border and states. Use semantic text labels for statuses.
3. Build shared nav, event card, button, field, form error, status badge, modal, toasts, skeleton, empty/error/denied, pagination, accessible table/mobile roster.
4. Establish Student navigation (Events, My Registrations), Organizer (My Activities, Create Activity), Admin (Overview, All Events). Keep exactly three user roles in prototype; admin is read-only.
5. Set mobile-first frames at 360, 768, 1024 and 1440. Confirm no horizontal scroll; responsive by layout rather than scale-only resize.
6. Provide one interactive example of a component in disabled, busy, error and success states with readable labels and keyboard focus.
7. Ask Figma Make to keep the generated code split by reusable components, styles, feature screens and an adapter boundary for later API integration.

## Deliverables
A component inventory, tokens, responsive frame set and exportable prototype code; document any component that uses a preview-only interaction.

## Acceptance
Every role's screens use the same design language, primary Student registration action is obvious, no placeholder metric appears as genuine data, and all actions have realistic interaction states.
