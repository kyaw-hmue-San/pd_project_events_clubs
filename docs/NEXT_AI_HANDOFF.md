# Next AI session handoff — current implementation status

Updated 2026-11-08, Asia/Bangkok. Current working branch main.
Read AGENTS.md, PROGRESS.md, docs/ACCESS_WORKFLOW.md and API_CONTRACT.md first.
Preserve uploaded files, existing uncommitted changes, UI polish and access rules.
User authorized and completed the Firebase Hosting + Render release, superseding
the earlier no-deploy restriction for this deployment. No Git push/commit or
billing-plan change was performed; release setup/docs are uncommitted on main.
Frontend https://events-management-4d8ce.web.app; backend
https://pd-project-events-clubs.onrender.com. User handled Render dashboard;
agent published Hosting-only using the owner's Firebase CLI login. School Google
workspace login was confirmed by the user; broader production journeys remain
unverified. Live HTML/entry hashes, assets200, private URLs404, CORS204/403,
protected API401 and current health marker200 verified. All seven indexes READY,
Google provider enabled. Full isolated browser suite24 passed; two env tests,
production build and artifact guard pass. See hosted-release-2026-11-08 evidence.
Preserve local backend/.env and frontend/.env.local. Deployment files
backend/.env.render and frontend/.env.production.local are private/ignored.
Local Admin key was replaced after the user revoked the recovered old key:
never restore an old checkpoint Admin credential as if it were valid. Render
must use the new key in /etc/secrets/firebase-service-account.json.
Team 10's deployed health worked, but the user-approved old ngrok creation URL
was offline; TEAM10_APPROVED_TEST_URL is a narrow temporary demo exception.
Team10 must restore their tunnel and target our permanent /webhooks/partner.
No partner messages or new work orders were sent. Render Free sleeps on idle;
worker is still persistent/in-process while service runs, not serverless.
User keeps Git publication control; no agents/delegation requested.
LATEST Library behavior supersedes the earlier always-visible AI button and
activity-keyword fallback. Activity details perform a cached relevance check of
public title/description; only positive LIBRARY_RELEVANCE_V1 results show AI
search. General welcomes/vague text/failure hide it; manual search always works.
Server suggestions recheck current relevance and reject direct bypass attempts.
See Library guide/relevance policy. Cache is process-local, bounded, coalesced,
text/model/policy keyed,24h valid/60s failed; restarts/eviction can reassess. No
DB writes/index/env change. API restarted in facilities mode (session68562).
Build/env,119 isolated backend tests and two targeted browser journeys pass,
all providers mocked. Real-model validation remains with user; no real credits,
partner calls, Git operations, push or deployment in this change.

LATEST copy: user asked to remove abnormal technical helper text. Planning,
admission, Library and facilities wording is now shorter and task-focused;
provider/API/server/retry jargon moved out of those normal product messages.
Starter plan honestly identifies AI fallback. Source/review/send safeguards and
all behavior unchanged. Build plus existing isolated planning browser journey
pass. No new tests/backend/config/Git operations, real provider calls or deploy.

LATEST UI: single progress feedback across roles. Buttons with an existing
Loading/OperationNotice use busyFeedback="notice" to keep their original label
and static icon while disabled/aria-busy, avoiding duplicate spinners/text. Default
standalone button progress remains. Organizer list refresh, admission processing
and Maintenance refresh overlap cleaned up. Build and four isolated targeted
browser journeys pass; see single-progress-2026-11-08 evidence and UI guide.
Frontend-only; no backend/env/Git operations, deployment or real provider calls.

LATEST: Library AI-assisted learning resources implemented on Student activity
details. Read [Library guide](integrations/library-resources.md). Explicit AI
search uses only server-loaded public title/description to pick one keyword;
all books/copies come from the Library. Manual search/fallback/error handling,
pagination and Student/published-closed guards are in place. No borrowing or
reservations, identity sharing, record writes or role changes. Independent
LIBRARY_API_BASE_URL/LIBRARY_API_KEY configured in private backend/.env, existing
AI model/key reused. Original campus-event.md contains their key: do not print,
commit or share it; source upload was preserved. No Git operations. 114 backend
tests and three targeted browser journeys pass, all with mock providers. Separate
manual Library catalog/actual-adapter reads returned200; no real AI credits were
used. Real-user/live-AI walkthrough remains for user testing. API restarted in
facilities mode (session48947), Vite existing session17484; recheck listeners.
Local health/frontend200 and both unauthenticated Library routes401. No push,
deployment, real Firebase write or change to Maintenance/Internship settings.

LATEST connection: Team 17 public Internship feed implemented. Read
[connection guide](integrations/team17-internships.md) and dated progress/evidence.
Student workspace has Internships; GET /api/internships enforces Student
capability and uses a validated, bounded, read-only provider adapter. No identity
or credentials forwarded. Current hosted six records are fictional demos, labelled.
Private backend/.env additionally sets TEAM17_API_BASE_URL to the public provider
origin; all Maintenance settings preserved. No key needed. Independent of local
Maintenance modes and disabled against live providers in emulator configuration.
105 isolated backend tests, two targeted browser journeys, build and env checks
pass. Separate manual adapter read returned200. No writes to Team17/real Firebase,
Git operations, push or deployment. API started in facilities mode (session40231),
Vite session17484; recheck listeners after resets. Local frontend/health200,
unauthenticated feed401. Live authenticated UI testing remains with the user.

LATEST layout: user explicitly requested frontend/backend folder names.
React/Vite, public assets, HTML/config/env now live in frontend/; the complete
former firebase/ tree (API, tests, credentials, local env and dependencies) is
backend/. Root package/dependencies still manage frontend tooling and npm
orchestration. Root commands remain; Vite uses --config frontend/vite.config.ts,
build output frontend/dist/. Runtime .mjs basenames preserved in backend/.
Only the server credential filesystem path changed inside private backend/.env;
all other env values, credentials and asset hashes preserved. Existing ignore
rules untouched, no Git operations. Live services restarted in the same facilities
mode/ports (API session85751, frontend session77255, private campus-layout logs).
Recheck listeners after resets. Offline env check/build, 98 backend tests and one
isolated cross-role browser journey passed. Own local/public health and frontend
entry/logo/favicon/manifest returned200. No new partner calls or deployment.
See application-layout-2026-11-07 evidence and frontend/README.md.
Latest cleanup instruction: do not run Git commands or change Git state; user
handles history/staging/branches/commits/remotes personally. See docs/README.md
and REPOSITORY_LAYOUT.md. Tests moved to backend/tests with imports/spawn CWD
updated; runtime .mjs entrypoints and active private environments remain intact.
Canonical environment examples live in config/env (local/production frontend/API).
check:env is offline; build:production validates the frontend before building;
API production check uses host variables only. Production URLs remain unconfigured.

## User decisions and implemented AI flows

Both agreed AI directions are now implemented locally:

1. **Automatic AI Organizer admission** under CAMPUS_ORGANIZER_V1. User explicitly
   selected any verified Google applicant, including personal accounts, if every
   criterion passes. Anything uncertain/unavailable stays pending for Admin;
   there is no automatic rejection or AI Admin appointment.
2. **AI Event Planning Copilot** in Create activity, replacing the small drafting
   UI while preserving the legacy /api/me/activity-draft contract. Core outputs:
   timed agenda, before/during/after preparation checklist, facilities suggestions.

Do not reopen the eligibility question. Exact user-confirmed rubric is in
[ORGANIZER_AI_ADMISSION.md](ORGANIZER_AI_ADMISSION.md): specific campus activity,
purpose/audience, organization or independent-organizer identity, personal
organizing responsibilities, consistent/safe text and no unresolved concerns or
bypass instructions. Server validates all required booleans, bounded schema and
supporting quotes. This assesses self-reported application text, not verified
club affiliation. The user was told that limitation before choosing this scope.

## Admission implementation

- backend/src/features/organizer-requests/ai-review.js: bounded model assessment,
  per-request private lease/hash/deadline, reverified Google token/account and
  atomic revision-safe promotion/audit. No network inside transactions.
- Existing routes save a new revision PENDING, then review exactly that revision.
  Duplicate existing submissions do not trigger another call. Old responses
  cannot overwrite Admin decisions, changed accounts, resubmissions or leases.
- Four evidence-backed criteria, consistency/safety and no concerns required.
  Unknown/invalid output, missing provider, timeout or expired deadline -> Admin.
- Three roles remain. Enrolled Students keep enrollment/registration/capabilities;
  new personal-email Organizers gain no Student capability. Profile updates do not
  replace identity/enrollment data. No privileged public role-management route.
- UI: own assessment/processing/automatic approval and Admin assessment/evidence/
  source labels. Existing Admin Approve/Reject remains available for PENDING.
- Explicit server enablement: ORGANIZER_AI_AUTO_APPROVE=true AND
  ORGANIZER_AI_POLICY=CAMPUS_ORGANIZER_V1. Default config requires Admin.
- No background scan, bulk approval or processing of old pending requests on
  startup. Existing requests stay with Admin; new submissions/resubmissions run AI.
- Auth and Firestore are separate services: account/token revalidation immediately
  precedes the promotion transaction; do not claim a cross-service atomic lock.

## Planning implementation

- backend/src/features/draft-assistant/planning.js, frontend/src/features/organizer/
  DraftAssistant.tsx and OrganizerViews.tsx. Models/API updated; shared Modal can
  use a wide review layout. Old basic draft endpoint/service remains compatible.
- New POST /api/me/activity-plan: topic/audience/purpose/type plus duration integer
  15–480 minutes and estimated participants 1–100,000. Organizer-only.
- Strict schema and exact agenda total validated; server derives offsets.
  Fixed complete template on provider error/invalid output, honest source labels.
- Section selection: title, description, agenda, checklist, facilities. Agenda/
  checklist append unless replacing description; replacing existing nonempty text
  requires acknowledgment. Combined length is checked. Dates/location/type/
  capacity are untouched. Facilities selection defaults off and never sends.
- Edit brief supports new generation with changed goals/count/duration. No chat
  history, volunteer assignment engine or automatic facilities booking is claimed.
- Selected agenda/checklist save as reviewed description text; facilities use the
  existing private notes field. No new activity schema collection/migration/index.

## Provider and test boundaries

Existing user-selected AI/ML API model/key remain privately in backend/.env.
Never print or paste credentials; no frontend key. Shared bounded transport is
backend/src/shared/ai-json.js. Prompts receive only the entered brief or the
application organization/reason, not tokens, UID, email or participant records.

Automated tests must mock all AI/partner providers and use demo Firebase. No real
AI credit use, applicant approval, connected-project seed or partner call was
performed for these checks. The historical manual basic-draft completion is
recorded separately in AI_DRAFT_ASSISTANT.md; it does not verify the new schemas.

Unit tests: backend/tests/ai-flows.test.mjs plus existing draft checks. Emulator tests:
real local Auth/Firestore/HTTP with injected providers, including personal approval,
Student data preservation, unavailable/disabled AI, duplicate submissions, Admin
and resubmission races, account changes and expired deadlines. Browser tests use
scripts/e2e-api.mjs guarded demo provider doubles; do not move those into production.

Full browser suite passed 21 scenarios; final backend suite passed 95 tests,
production build, side-effect-free app import and diff check passed. Sanitized
screenshots and runtime checks are in the latest PROGRESS
entry and docs/evidence/ai-flows-2026-11-06. Backend command on this Mac:
PATH=/opt/homebrew/opt/openjdk/bin:$PATH npm run test:emulator.
Run backend and browser stacks sequentially because emulator ports overlap.
Do not print raw Firebase debug logs; extract only relevant summaries.

## Existing project and runtime

React/Vite frontend/src/; persistent Express/Firebase Admin backend/src/. Preserve .mjs
compatibility, side-effect-free app import, worker leases/retries, partner paths,
Google verification, exact Student domain lamduan.mfu.ac.th, unique supplied
university ID (never inferred from email), QR/attendance and shared UI.

Frontend localhost:5173; API localhost:3000. Inspect listeners before restarting
and stop only a verified project process. Normal npm run dev:api disables partner
traffic. npm run dev:api:maintenance enables inbound only. Current explicit
npm run dev:api:facilities enables reviewed creation + signed maintenance reception,
while legacy publication/polling stay disabled. AI config is independent. Recheck
processes after any reset; do not assume they survived. The confirmed policy and
auto-approval flag were enabled privately in backend/.env, and the verified
facilities-mode API restarted with health ok. Existing Vite returned HTTP 200.
No real AI call or admission was performed for this setup. Private keys remain local.

The user requested clean, futuristic UI: single compact workspace dropdown,
animated 44px hamburger, floating role-specific mobile panel, keyboard/outside/
resize dismissal and bounded short-screen scrolling. Menu rows/sign-out have
subtle rotating blue/cyan edge light on hover/focus, static under reduced motion.
Keep workspace choice per-user session storage and server capabilities authoritative.

## Facilities integration and remaining cross-team test

Read MAINTENANCE_CONNECTION.md; do not ask Team 10 for its already supplied
contract/key again. Real local creation succeeded Nov 7 (latest receipt below);
peer Dispatch Board confirmation and signed completion walkthrough remain pending.

Owner reviews saved notes/category and explicitly sends. Validated HTTPS receipt
must echo activityId and atomically claim a unique link. Stable original payload/
canonical bytes/idempotency key and 45-second leases protect retries. Preserve
SENT/RETRYABLE/REVIEW_REQUIRED semantics. No normal save/publish auto-sends notes.
Signed raw-body HMAC and lifecycle versions OPEN1/ASSIGNED2/IN_PROGRESS3/RESOLVED4/
CLOSED5 reject stale regressions; completion polls every 15 seconds while visible.
Payload activityId never establishes an association.

Creation: https://maintenanceteam10.vercel.app/api/partner/work-orders
Receiver: https://veneering-decipher-entire.ngrok-free.dev/webhooks/partner
Tunnel: ngrok http 3000 --url https://veneering-decipher-entire.ngrok-free.dev

Use an unlinked published activity with saved notes, explicitly send once, confirm
returned ID on Team 10 board, then progress signed statuses to completion. Preserve
earlier manual test association: activity iGR6mXYnQMDHBYV8GnZ4 -> work order
88888888-8888-4888-8888-888888888888 (ASSIGNED). Do not recreate/relink it. New signed
events need fresh UUIDs; do not reuse an old event ID with changed payload.

## Latest description display cleanup

Published descriptions now use frontend/src/components/ActivityDescription.tsx in the
Student/Organizer and read-only Admin detail views. Existing stored newlines are
preserved; full-line generated agenda headers/ranges become rows, lists become
lists, and Preparation checklist is a collapsed native disclosure with stage
headings. Content/access/DTOs are unchanged; this does NOT make previously public
checklist text private. No regeneration or DB edit needed. Build and two targeted
cross-role/planning-display browser checks passed, with 360/768/1440 overflow
checks and inspected screenshots in description-format-2026-11-06 evidence.

## Remaining work / honest limits

- LATEST: real local creation succeeded after user clicked retry. Private URL
  override is https://ethanol-prayer-skyline.ngrok-free.dev/api/partner/work-orders.
  Activity rXTvjUumz1aTJDwiq9yt -> work order 39a8f615-6561-406d-8c4f-c30ecb063f0a,
  HTTP201, SENT, duplicate=false, attempt3 at 2026-11-07T07:52:34.636Z. Independent
  read confirmed original payload/retry identity and both links; real Brave UI
  shows accepted/OPEN. Source TEAM10_CREATION_RESPONSE, sequence/version1,
  lastEventId null. OPEN is receipt snapshot, not a received status webhook.
  User chose manual final click; agent opened review only. Credentials unchanged.
  API restarted in facilities mode (session53409, private log
  /private/tmp/campus-team10-local-api.log); ngrok session92745 remains, public
  health200 at07:52:49Z. Team 10 must confirm local Dispatch Board and send signed
  statuses2–5; verify each HTTP/inbox/status/UI. Preserve this local association;
  don't resend/relink this activity to production. See maintenance-local-creation
  evidence folder. No code change/tests/push/deploy for endpoint override.

- CONFIRMED after user's manual retry: activity rXTvjUumz1aTJDwiq9yt now has
  attempts=2, RETRYABLE, FACILITIES_PARTNER_NOT_FOUND, partnerHttpStatus=404 at
  2026-11-07T07:03:42.136Z, no receipt/binding. This is actual POST evidence.
  Public receiver health200 at 07:04:07Z. Team 10 needs to confirm/fix deployed
  creation URL/route; do not guess endpoints, change secrets or retry again
  before confirmation. No additional outgoing partner call or write was made
  for the latest read-only verification. Preserve original retry identity.

- Latest failure (2026-11-07): user target rXTvjUumz1aTJDwiq9yt has one RETRYABLE
  attempt at 06:57:14Z, FACILITIES_PARTNER_UNAVAILABLE, no receipt/binding. Added
  private partnerHttpStatus for future attempts; actual POST 404 gets a clear
  endpoint-not-found UI code. No raw body/secret storage or DTO diagnostic leak.
  All 96 backend tests/build/diff pass. Facilities API restarted (tool session
  88248, /private/tmp/campus-facilities-diagnostics-api.log); local/public health
  200 at 07:01:44Z. Ngrok remains session 92745. Team 10 health GET succeeds;
  creation-path GET404 is not proof of POST404. Found target in native Brave
  Organizer session; Chrome is Admin. Automatic approval review rejected my
  coordinate click on Review and retry request for consequential-action risk.
  No workaround/retry/work order was performed. User must explicitly review/
  retry; inspect the new saved numeric HTTP status/receipt afterward. Never log
  unrelated browser/ticket contents. Real cause and lifecycle still pending.

- Coordinated maintenance readiness (2026-11-07): normal-mode API and offline
  tunnel discovered, restored facilities mode + agreed ngrok URL. Public health
  200, unsigned empty callback POST expected 401 INVALID_WEBHOOK_SECRET; no valid
  status sent. Our stored key passed deployed Team 10 health HTTP 200. Pending
  activity uEha4rNd3OZsngPGZdk4 has RETRYABLE one-attempt request, no workOrderId.
  Current Chrome session is Admin, so owning Organizer must explicitly review/
  retry through UI; preserve request identity. No submission/role bypass/key
  change. API/ngrok started as tool sessions 94158/92745 with private logs under
  /private/tmp/campus-coordinated-*.log; recheck listeners after resets. New signed
  transitions/board visibility/UI confirmation remain pending Team 10. See
  MAINTENANCE_CONNECTION.md; do not confuse historical 8888 work order with a new
  creation receipt. No messages sent to Team 10 by tools.

- Official branding (2026-11-07): supplied already-extracted kit README read;
  assets preserved byte-for-byte in frontend/public/brand and public favicon/manifest
  files. Shared BrandLogo handles horizontal/compact and background-appropriate
  variants across shell/auth/loading/setup/discovery. Visible name is Campus
  Events & Clubs; internal session/ticket/API identity stays stable. See
  BRANDING.md. Build, asset hashes/dimensions/paths and diff verified; user does
  visual testing. No browser checks, push or deployment for this pass.

- Shared motion refinement (2026-11-07): press/release feedback, 200/160ms menu
  and dialog presence transitions, capped keyed-list stagger, once-only confirmed
  checkmark pulse and sequential AI result sections. useMotionPresence retains
  visual exits with closed content inert/aria-hidden; existing focus behavior
  remains tied to open. Reduced motion skips delays/scale and exit wait. Build
  and diff passed; user requested personal UI/UX testing, so browser/emulator
  checks were not run for this UI-only follow-up. No new API/dependencies.

- Admin activity list cleanup (2026-11-07): compact mobile title/status/metadata,
  organizer and View details footer; aligned desktop rows from 1024px. Build/diff
  passed, existing test selector updated. User requested to do UI/UX testing
  personally, so no browser checks were run for this follow-up.

- Planning provider follow-up: one user-authorized synthetic real call returned
  a valid AI plan in 13.259 seconds (HTTP 200, 2,132 total tokens). The old 12-second
  cutoff was too short; planning now allows 45 seconds. Admission/basic drafts
  retain their original limits. UI duration uses hours/minutes/presets and fallback
  text explains the actual reason. Build, 18 service checks and two planning
  browser scenarios passed; see planning-timeout-2026-11-06 evidence. Verified
  project facilities API restarted, health ok. No real application/event write.
- User should exercise the signed-in planning UI and real admission locally;
  mocked source=AI tests are not model-accuracy or real-admission evidence.
- Coordinate real Team 10 creation/status walkthrough when that team is ready.
- Lecturer stack deviation (Firebase vs original Supabase PRD), broader production
  checks and existing SDK upgrade remain separate release items. Do not invent
  lecturer approval, user research, teammate authorship or deployed success.
- No push, merge or deployment without the user's authorization.
