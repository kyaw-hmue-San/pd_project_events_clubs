# Campus Events & Clubs — implementation handoff for teammate + coding agent
**Version:** 1.0 — prepared 2026-11-02 from the user's pasted agent investigation (not a new repository audit).
**Goal:** deliver a *real, functional, demoable* university campus events and clubs MVP, not a clickable mockup.

## Read this first (10 minutes)
1. Read `SOURCE_OF_TRUTH.md` and `AGENTS.md`. Then inspect the **real repository** before changing code.
2. Read `DECISIONS_AND_BLOCKERS.md`; obtain the current lecturer brief/rubric if available. Do not invent requirements or deadline.
3. Read `MVP_FEATURES_AND_ACCEPTANCE.md`, `DESIGN_SYSTEM.md`, `SCREENS_AND_UX.md`, and `BACKLOG.csv`.
4. Execute `WORK_ORDERS.md` in order, in small testable PRs/commits; update `PROGRESS.md` after each task.
5. Finish with `TEST_PLAN.md`, `DEPLOYMENT_RUNBOOK.md`, `DEMO_PLAYBOOK.md`, `SUBMISSION_EVIDENCE.md`.

## Core instruction
This is a **continuation of an existing project**, not a rewrite. The investigation reports that the Firebase/Express API exists and Team 10 integration has evidence; a React frontend was not found. The React + Vite / Express / Supabase / Vercel stack is the older **main-MVP document plan**, while the code assignment uses **Firebase Auth + Firestore + Express on Render**. For speed, **provisionally reuse the working Firebase code**, but first verify and document whether the lecturer explicitly requires Supabase or the older architecture. Do not merge two databases by accident.

## Definition of a genuine live demo
- A Student signs in with Firebase Auth; a protected API verifies their token/role; a *real Firestore record* is created on event registration and appears again after refresh/re-login.
- Student can cancel; status changes persist. Duplicate registrations and unauthorized operations are rejected correctly.
- An Organizer signs in; creates/publishes an event; Student sees it; Organizer can see the real registration.
- Seeded example events / dedicated test accounts are acceptable **when openly labeled sample/demo data**. Do **not** fabricate real students, research results, usage counts, successful partner messages, or completed tests.
- Deployment works end-to-end on two devices or two browser profiles, not just on localhost or a `/health` response.

## Decision priority (if time tight)
**P0 demo blockers:** approved scope/stack, Firebase credentials & authorization, usable frontend, real event browsing and student registration/cancellation, organizer create/publish/roster, CORS + live deployment, data persistence, security checks, smoke test.  
**P1 important:** lifecycle reconciliation, robust automated API tests, recovery/retry verification, accessible responsive states, documentation/rubric evidence.  
**P2 optional:** search/filter, pagination if needed, club pages if in lecturer scope, polish.  
**Explicitly defer unless required:** payments, chat, analytics dashboards, QR attendance, push notifications, complex capacity/waitlists, AI features, full Supabase migration.

## Contents
- `AGENTS.md`: agent guardrails and engineering workflow (copy into repository root **only after review**)
- `SOURCE_OF_TRUTH.md`: source-backed status and uncertainty
- `DECISIONS_AND_BLOCKERS.md`: architecture, scope, owner, and missing brief
- `MVP_FEATURES_AND_ACCEPTANCE.md`: precise role permissions and done criteria
- `SCREENS_AND_UX.md` + `DESIGN_SYSTEM.md`: pages, states, design tokens, accessibility
- `API_AND_DATA_CHECKLIST.md`: contract, Firebase/Auth/Firestore, integration guidance
- `BACKLOG.csv`: actionable, ordered task register
- `WORK_ORDERS.md` + `AGENT_PROMPTS.md`: phased orders and copy/paste prompts
- `DEMO_DATA_PLAN.md` + `sample_demo_events.json`: safe controlled seed examples
- `TEST_PLAN.md`: tests and verification matrix
- `DEPLOYMENT_RUNBOOK.md`: safe deployment and smoke checks
- `DEMO_PLAYBOOK.md`: 8–10 minute live presentation and recovery plan
- `SUBMISSION_EVIDENCE.md`: authentic evidence, rubrics, individual contributions
- `PROGRESS.md`: tracker to update during implementation
- `INVESTIGATION_REPORT_USER_SUPPLIED.txt`: source report excerpt/full text for reference

**Note:** This ZIP is a *handoff specification*, not a built frontend or an audited version of the live repository. Work remains until the friend follows and verifies the work orders.
