# MVP product contract and acceptance criteria
**Priority labels:** P0 must demonstrably work for a final live MVP; P1 high quality/important to grading; P2 only if lecturer requires or P0/P1 finish.

## Actors and server-enforced permissions
| Actor | Allowed | Not allowed |
|---|---|---|
| Guest | Optional landing page/public event preview *only if consistent with current API* | Direct Firestore privileged operations; register or view private roster without auth. |
| Student | Sign in, browse published/approved-visible events, view details, register once, view own registrations, cancel own registration | Create/publish events; view other students' private registrations; impersonate users. |
| Organizer | Sign in, create/edit own events, publish/close under approved lifecycle, view registration roster for own events | Edit another organizer's event; assign themselves roles; view unrestricted partner logs or all user data. |
| Admin/Integration operator | Only if existing role policy explicitly supports it | Do not introduce a publicly selectable admin role. |

## User stories / acceptance criteria
### P0-A: Authentication and roles
- Real Firebase client sign-in; token attached as `Authorization: Bearer <ID_TOKEN>` via one API client; protected routes verify token server-side.
- Role resolved from protected server database, not user-editable browser storage. Sign out clears in-memory session; expired session is handled with helpful message.
- Student and Organizer demo accounts have distinct permissions. Unauthorized/forbidden errors do not leak data.
- UI must not embed service-account credentials or assume firebaseConfig values are secrets (client firebase config can be public; admin creds cannot).

### P0-B: Discover and view events
- Student sees server-fetched event cards and details with title, description, date/time, location, organizer/club label **where supported by real schema**.
- Event list refreshes from API, not static JS array. Loading, empty, network-failure, and unauthorized states appear appropriately.
- Non-published/private activity exposure and CLOSED behavior follow D3 and are tested.

### P0-C: Register and cancel (end-to-end proof)
- Student registers on open, eligible event. API stores real Firestore registration; the UI shows persisted state after reload and re-login.
- Second immediate click/concurrent request cannot produce a second **active** registration. API responds with a clear outcome; UI disables duplicate submissions.
- Student can see only *their own* registrations and cancel one with a confirmation, pending state, and persisted cancellation result.
- Student cannot cancel someone else's registration. Invalid or missing event IDs produce correct 4xx; database failures must not falsely show success.

### P0-D: Organizer activity management
- Organizer can create and update **their own** draft/eligible activity with validated required fields; publish using actual supported API.
- New published activity appears in Student listing through real API. Organizer sees actual Student registration on their own event.
- Organizer cannot change another organizer's event; cannot submit invalid dates, empty required fields, or unauthorized state transitions.

### P0-E: App quality and real demo
- Responsive at 360, 768, 1024/1440px, basic keyboard navigation, visible focus, labels, meaningful errors, consistent empty states.
- The deployed frontend calls deployed backend from allowed origin. Directly refreshable routes work. No secret keys in browser build.
- Full demo works with dedicated accounts; all critical writes persist in Firestore; can be repeated safely with a prepared reset plan.

### P1-F: Lifecycle + product contract
- D3/D4 choices recorded; documentation, API, tests, and frontend all agree; existing clients not unexpectedly broken.

### P1-G: Partner integration
- Preserve Team 10 integration and test webhook auth/idempotency, safe retries, degraded mode, recovery evidence. Expose only authorized operations. Partner outcomes must be genuine, not a UI animation pretending success.

### P1-H: Test coverage and documentation
- Emulator/controlled-environment integration tests validate role/ownership, cancel, transactions, visibility; frontend tests and deployed smoke checklist pass.
- README updated to actual state, deployment instructions usable, lecturer rubric traced, team contributions accurately credited.

### P2 extension candidates (not assumptions)
Search/filter or club discovery pages, paginated rosters, higher event capacity, better loading skeletons. Implement only if required or time permits after P0/P1.

## Product-wide definition of done
A feature is DONE only when code exists, required inputs are validated server-side, authorized data behavior is tested, errors are handled, responsive UI works, deployed live smoke passes, and evidence/reference is linked in `PROGRESS.md`.
