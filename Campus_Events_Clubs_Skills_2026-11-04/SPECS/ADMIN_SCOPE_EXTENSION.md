# PRD change proposal — lightweight read-only Admin
**Change type:** proposed extension to PRD section 3.3 (which currently explicitly says no Administrator role). **Origin:** user states they discussed with lecturer that Admin should be able to see events and other overview information. **Formal grading/rubric confirmation:** not provided.

## User story
As a trusted campus Admin, I can view all campus activities, their lifecycle states, organizer names and trustworthy participation summary **without being able to change anything or inspect individual students' private registrations**.

## Proposed requirements
- ADM-FR-01: Trusted Admin can authenticate via existing Firebase Auth and protected `ADMIN` role.
- ADM-FR-02: Admin can see aggregate counts for total/DRAFT/PUBLISHED/CLOSED activities. Participation total only if accurately computable without privacy leak; exclude if not available.
- ADM-FR-03: Admin can list and view activities across organizers, including DRAFT, with sensible pagination, date, type, status and organizer display.
- ADM-FR-04: Admin may not create, edit, publish, close, delete, register/cancel, read detailed student rosters, modify roles or access Team 10 logs by default.
- ADM-NFR-01: Server returns 403 for unprivileged admin route access; browser hidden controls do not substitute for backend authorization.
- ADM-NFR-02: No sensitive student data or secrets; error, loading, empty, responsive states.

## Acceptance examples to verify in final QA
1. Organizer A and Organizer B create separate Draft/Published events; Admin sees both in admin-only list.
2. Student can see only permitted public/authenticated events, never someone else's draft.
3. Organizer A sees only own drafts; Organizer B cannot edit Organizer A activity.
4. Admin gets current summary counts matching stored records and can view details.
5. Admin request to create/publish event or access roster is denied; Student/Organizer requests to admin endpoints get 403.
6. An unprovisioned login cannot choose ADMIN role through browser request.

## Exclusions
No moderation queue, account/user management, admin CRUD, payment controls, role assignment UI, audits/log admin, QR check-in, uploaded media or advanced analytics.
