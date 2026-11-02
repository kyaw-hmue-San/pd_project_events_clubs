# Verification plan — honest executable acceptance
Use Firebase Emulator or isolated *authorized* demo project for writes; never point destructive automated tests to shared production. Log commands/results under `PROGRESS.md`. Initial baseline of five passing tests reportedly covers helper functions only.

## Automated suite targets
| Test ID | Expected behavior | Priority |
|---|---|---|
| AUTH-01 | Unauthenticated protected API returns 401 | P0 |
| AUTH-02 | Student cannot create/publish or view organizer roster | P0 |
| AUTH-03 | Organizer cannot manage another organizer's event | P0 |
| AUTH-04 | Student cannot read/cancel another user's registration | P0 |
| EVENT-01 | Organizer creates valid event and Student can fetch after publish | P0 |
| EVENT-02 | Empty/invalid fields or invalid date/state return 4xx | P0 |
| EVENT-03 | CLOSED state visibility/reopening conforms to D3 | P1 |
| REG-01 | Student registers once; record exists in Firestore | P0 |
| REG-02 | Double click / concurrent requests yield one active registration | P0 |
| REG-03 | Same Student sees registration after refresh/re-login | P0 |
| REG-04 | Cancel changes persisted state, repeat is safe | P0 |
| REG-05 | Database transaction failure doesn't leave half-written data | P1 |
| API-01 | Cancel route matches approved D4 contract, response validated | P0 |
| API-02 | CORS preflight works from chosen frontend origin | P0 |
| API-03 | Restricted/disallowed origins fail browser access; auth still checked | P0 |
| INTEG-01 | Partner webhook signature/auth and duplicate-id handling | P1 |
| INTEG-02 | Partner unavailable → genuine retry/degraded state | P1 |
| INTEG-03 | Recovery occurs automatically if required; evidence captured | P1 |
| SEC-01 | Frontend bundle does not contain service-account secret | P0 |
| SEC-02 | Direct Firestore privileged access denied from browser | P0 |

## Frontend browser manual/E2E checklist
- Student sign-in and sign-out; deny Organizer route for Student.
- Browse server events, detail view, retry after network error.
- Register; see disabled/pending button; refetch/persist after refresh; cancel and persist.
- Organizer sign-in; new event created/published; Student sees; roster updates.
- 360px/768px/1440px: no broken nav, horizontal overflow, unreadable dialogs or cards.
- Keyboard focus visible, form labels and errors, loading/empty/403/offline states.
- Deploy URL deep links refresh, Firebase token expiration handling, no sensitive token in URL.

## Environment/verifiability matrix
| Environment | Purpose | Pass proof |
|---|---|---|
| Node syntax/unit tests | regression baseline | exact command + successful exit |
| Firebase Emulator | authorization, Firestore queries, transactions | test output + isolated project config |
| Local frontend+API | browser integration, CORS, auth | screenshots and API/network trace redacted |
| Deployed frontend + Render API + demo Firebase | real usability demo | video/screenshots + authenticated persistence |
| Partner integration (if accessible) | true webhook/consumer/retry | redacted logs, request IDs, observed result |

## Rules for reporting
PASS = actually executed and observed. FAIL = executed, incorrect result. BLOCKED = cannot run with reason. NOT TESTED = not executed. An old screenshot is historical evidence, not proof today's service works. `/health` alone is not proof CRUD works. Never claim '100%' without satisfying all required assertions.
