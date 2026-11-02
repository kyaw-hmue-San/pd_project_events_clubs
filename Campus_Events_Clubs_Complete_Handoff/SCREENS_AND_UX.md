# Pages, navigation, and end-to-end UX
**All screen examples must be populated via real API, except explicitly labeled optional sample data before deployment.** Suggested routes are for frontend implementation only; align with actual API names.

## Information architecture (recommended)
- `/` → welcome / quick explanation / link to events and login (may redirect to `/events` if simpler).
- `/login` → Firebase email/password demo sign-in or existing sign-in method; no public role picker.
- `/events` → student event discovery/list.
- `/events/:id` → event details, registration action/status, validation messages.
- `/my-registrations` → authenticated Student's persisted registrations, cancel action.
- `/organizer/events` → authenticated Organizer's own activities, create/publish/edit actions.
- `/organizer/events/new`, `/organizer/events/:id/edit` → event form.
- `/organizer/events/:id/registrations` → real roster for *owned* event, minimal PII.
- `*` → friendly 404.

## Student journey / real demo
`Login as Student → Events → Event details → Register → API/Firestore commit → My registrations → Refresh → Still registered → Cancel → Refresh → Cancelled`. Stop and show clear errors when actual backend rejects. Don't just mutate frontend local state.

## Organizer journey / real demo
`Login as Organizer → Create event → Validate form → Save draft if API supports → Publish → Sign in as Student in second profile → New event visible → Register → Organizer roster shows registration`. If draft/publish APIs differ, adjust UI to existing contract rather than inventing persistence.

## Page-by-page requirements
### Login
- Branded but minimal form; show identity/role after authentication. Wrong credentials, unauthorized role, network error states; `Forgot password` only if actually implemented. No pretending a login succeeded.
### Event listing
- Real API list; title, date, venue, status; optional basic search/filter only if done without misleading results. Empty state; error retry. Closed behavior per D3.
### Event detail
- Full existing fields; accessible register button, current status; backend errors surfaced (duplicate, closed, expired, permissions).
### My registrations
- Real returned registrations only; active/cancelled state; cancel confirmation; refresh after update; never show other students' data.
### Organizer list and editor
- Only own events, create/update/publish as current API allows; validate before and after API; unsaved changes warning where feasible; owner controls server-enforced.
### Organizer roster
- Real registrations for owned events; no sensitive extra fields; capped/list/pagination behavior explicitly shown; never fake attendee counts.

## Shared async state matrix (apply to every data screen)
| State | UI |
|---|---|
| Initial load | Skeleton/spinner with page title and accessible status |
| Success with records | Accurate server data and actions |
| Success empty | Useful CTA or 'No events / registrations yet' |
| 401 | Redirect or prompt to sign in, preserve safe return route |
| 403 | Permission denied; no details leaked |
| 404 | Resource not found |
| 409/business conflict | Explain duplicate/closed restriction and refresh |
| 5xx / offline | Honest error, retry; do not claim data saved |
| Mutation pending | Disable submit/duplicate click and show progress |
| Mutation success | Fetch canonical response/refetch then show success |

## UX checks
Use two browser profiles for simultaneous roles. At 360px verify header, forms, event cards, dialog, roster, and navigation; at desktop ensure consistent max width and no empty decorative dashboard elements. Check keyboard-only navigation and readable state changes.
