# Build-first QA and release policy
The user prioritizes finishing functionality and wiring **before the full testing campaign**. Respect that sequencing, while keeping cheap safety checks at each change to avoid an untestable last-minute release.

## During implementation (fast gates, not full QA)
- API/module refactor: syntax/import/start, existing offline tests, targeted Auth/Firestore emulator route smoke for changed behavior.
- Frontend components: `npm run build` (and lint/typecheck when configured), routes render without crashes, interaction does not imply fake persistence.
- Each connected feature: one real HTTP request under appropriate demo role in emulator/isolated environment, confirmed server response/refetch; note everything not yet tested.
- Admin: guard GET as `ADMIN`, confirm one Student/Organizer forbidden request and one Admin permitted request in emulator; no mutation path.
- Document failures; never merge deliberately failing code to catch up with schedule.

## Full QA phase **after all modules wired**
**API emulator / contract:** auth missing/invalid/revoked, unverified email, `STUDENT/ORGANIZER/ADMIN`, cross-user/cross-owner denial, invalid payloads, lifecycle Draft->Published->Closed, CLOSED rejects register/reopen, concurrent duplicate lock exactly one success, cancel repeat/idempotent/historical status, pagination, error JSON contract, Team 10 provider/webhook signature + duplicate behavior, worker no regression. No external Team 10 call unless authorized.

**Frontend E2E:** login/logout/reload; role redirect; Student list/details/register/refresh/cancel/history; Organizer own list/create/edit/publish/close/roster; Admin summary/all events/details; no admin writes; actionable loading/empty/offline/network/403 states; role switches in separate browser contexts.

**Security/privacy:** secrets absent from browser bundle and Git; exact-origin CORS, no header bypass, Firestore client deny rules, server-derived role and UID, profile data minimal, Admin has no roster/PII access, no unsafe partner log exposure, inputs validated, no secret in screenshots.

**Responsive/accessibility:** 360, 768, 1024, 1440 px, keyboard-only flows, visible focus, form labels and feedback, dialogs, touch targets, no horizontal scrolling; reduced-motion. Use real screens and note pass/fail.

**Performance/usability:** measure p95 <=2 seconds at classroom demo load if tool/run exists, excluding auth redirect as PRD says; conduct representative student unaided journey test for >=80% if feasible. Do not assert percentages without measurements; flag unmet acceptance.

**Deployment:** verify backend stays on persistent host, worker startup once, HTTPS, live Firebase Admin and Auth credentials privately configured, client web config and exact `FRONTEND_ORIGINS`, browser refresh/deep links, real create/register/cancel/roster/read-only Admin after approved isolated deployment, actual free-tier costs and reliability, free-tier sleeping host caveats. Never promise 0 THB unless verified.

## Release evidence file template
- Date / environment / branch SHA / deployed URLs (no secrets)
- Command or manual steps, role, expected result, actual result, pass/fail, screenshot/log ref (redacted)
- PRD acceptance mapping and Admin extension mapping
- Known missing tests/defects, owner and mitigation
- Signed-off team roles based on actual participation

## Reject release if any P0 fail
Auth or role bypass; a Student modifies events; an Organizer manages another Organizer's event; Admin can mutate/read registrant PII; duplicate ACTIVE registrations; registration falsely claims success; cancelled record is deleted; live app can't reach API; production demo depends on hardcoded mock data; secret exposed; essential lecturer-mandated requirement missing.
