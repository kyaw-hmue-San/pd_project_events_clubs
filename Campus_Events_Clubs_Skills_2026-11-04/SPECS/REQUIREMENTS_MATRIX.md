# Requirements matrix — specification versus currently reported implementation
**Evidence:** uploaded PRD (2026-11-04), API_CONTRACT (observed 2026-11-03), and PROGRESS snapshot. Statuses are not fresh tests. `IMPLEMENTED` means document reports code, not production proof.

| PRD | Role | Required behavior | Known state (as of report) | Work / final proof |
|---|---|---|---|---|
| FR-01 | Student | Browse published activities | API `GET /api/activities` implemented; auth required; includes CLOSED; public conflict | Design list, wire auth; settle AC-FR-01 public visibility |
| FR-02 | Student | Title, description, type, date, location, organizer, availability | Detail API exists; organizer display name uncertain | Verify response and display safe organizer name |
| FR-03 | Student | Register available activity | Transactional API implemented | Wire register, server reload, production smoke |
| FR-04 | Student | Prevent duplicate active registration | Transactional lock; emulator checks | Verify simultaneous duplicate request in final suite |
| FR-05 | Student | Confirmation | No frontend | Real success response then UI state |
| FR-06 | Student | Own registration history/status | `/api/me/registrations` active-only cap 50 | Include cancelled status/history; privacy |
| FR-07 | Student | Cancel own registration | `/cancel` and legacy routes implemented | Modal, idempotent feedback and refetch |
| FR-08 | Organizer | Create own draft | API implemented | Own activities dashboard, form |
| FR-09 | Organizer | Publish valid draft | API implemented | Validate fields, publish UI, new event visible to Student |
| FR-10 | Organizer | Update own activity | API implemented | Own list with drafts, edit, close, no CLOSED reopen |
| FR-11 | Organizer | View owned roster | API implemented; max 50 | UI table/cards, permission-denied; pagination if needed |
| FR-12/13 | Both | Auth and roles | Firebase bearer + role check exists for 2 roles | Web client login/session; extend ADMIN minimally |
| NFR-01 | Student | >=80% representative students complete registration unaided | Not measured | Real supervised usability sessions; never invent |
| NFR-02 | All | p95 API <=2s for demo load | Not measured | Measured controlled load after deployment |
| NFR-03/04 | All | Secured ops, secrets, server authorization | Emulator testing 13 passes reported | Final role / ownership / credentials review |
| NFR-05/06 | All | Error UX and maintainability | Minimal response errors; large modules | Safe messages/fieldErrors; feature modules |
| NFR-07 | All | 0 THB free-tier operation | Not verified | Verify billing/usage/hosting plan and actual availability |
| NFR-08 | All | 360–1440px functional layout | No frontend shown | Viewport and keyboard checks |
| NFR-09 | Student | Atomic integrity / unique active registration | Implemented & emulator checked | Final concurrent coverage |
| AC-FR-01 | Visitor | Anonymous sees published activities only | **Conflict** with authenticated API | Decision D03; design does not imply it already works |
| Admin extension | Admin | Read-only all activities / summary | Not in PRD; no code | Server ADMIN role, GET endpoints, admin views, tests, documented change |
| Team 10 | Organizer / partner | Provider/webhook/retry | Implemented, local HTTP checked; live recovery unverified | Preserve paths, retest controlled integration, no secret disclosure |

## Definition of functional completeness
A dedicated organizer creates and publishes a real event; a separate Student account discovers it, registers and sees its status after refresh, cancels and sees cancelled history; organizer sees the real roster; read-only Admin sees the event/status/counts but receives 403 on mutations and cannot see private student registration records. All three roles use real identity verification and server-derived role checks. Production/HTTPS E2E evidence is still required for final release.
