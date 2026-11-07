# Screen inventory and wiring plan
Figma output is the **presentation baseline**, not the authority for API behavior. Display backend names/status only if returned or actually derived; no pretend successful registration.

| Screen / route suggestion | Role | Calls | Loading/error/success requirements |
|---|---|---|---|
| `/login` | Visitor | Firebase client Auth; then `/api/me` | error codes, unverified email, no role-provision self-service |
| `/events` | Student (visitor only if D03 approved) | `GET /api/activities` | skeleton/empty/network/pagination, correct CLOSED state |
| `/events/:id` | Student | `GET /api/activities/:id`; registration POST | 404/closed/already registered/busy, server confirmation and refetch |
| `/my-registrations` | Student | `GET /api/me/registrations`; `PATCH /api/registrations/:id/cancel` | active/cancelled statuses, confirmation modal, rollback/no fake success |
| `/organizer/activities` | Organizer | **new** `GET /api/me/activities` | drafts/published/closed, action visibility per lifecycle |
| `/organizer/activities/new` | Organizer | `POST /api/activities` | validated draft fields, correct UTC conversion, 201 success |
| `/organizer/activities/:id/edit` | Owning Organizer | GET detail, PATCH activity | full validation, no CLOSED reopen, server state |
| `/organizer/activities/:id/registrations` | Owning Organizer | roster GET | roster with only approved user data; no foreign ownership |
| `/admin` | Admin | **new** `GET /api/admin/summary`, activities | aggregate cards, no fake metrics, loading/denied |
| `/admin/activities` | Admin | **new** `GET /api/admin/activities` | all activity statuses and organizer, search locally only if justified |
| `/admin/activities/:id` | Admin | **new** admin activity GET | read-only details, no mutations, no participant PII |

## UI foundations
- React Router (or simple equivalent) with role-based navigation; **server API remains real authorization**.
- Firebase Web SDK session persistence, `getIdToken()` on each authenticated call, unauthorized handling and refresh/relogin states; never hardcode bearer tokens.
- One fetch wrapper builds URL from approved `VITE_API_BASE_URL`, attaches Authorization safely and reads `{error:{code,message,fieldErrors?}}`; never silently mask a 403/500.
- No browser Firestore direct CRUD; database rules deny direct access.
- Date input local -> UTC ISO for API, display campus timezone with explicit label (verify campus zone; don't assume user device zone is campus zone).
- API may cap list at 50, so use cursor/Load More, don't hardcode a count or claim complete history if truncated.
- Loading, empty, error, validation, offline, denied, success states are defined per screen.
- Static preview-only event objects must be removed from production flow; keep demo seed script/config separate.
