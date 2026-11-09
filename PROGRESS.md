# Campus Pulse implementation progress

Latest update: 2026-11-09 (Asia/Bangkok). Current working branch: `fix/team10-permanent-endpoint`.

Status: **Hosted on Firebase Hosting + Render. School Google sign-in confirmed
by the user; broader hosted workflows and partner lifecycle acceptance remain separate.**
The work reuses the user-supplied Campus Pulse prototype and current skills pack.

## User-approved presentation data reset — 2026-11-09

- User explicitly confirmed the exact live cleanup after reviewing the inventory.
  Kept the specified Admin and school account only. School profile is now
  STUDENT with Student-only capabilities; preserved name/email/university ID,
  enrollment claim and creation timestamp. Admin profile remained unchanged.
  Removed old Organizer approvals/applications so a fresh request is possible.
- Private typed Firestore/Auth recovery backup was written and checksum/roundtrip
  verified before mutation. It includes original account/provider/password-hash
  recovery data; restricted local directory/file permissions and explicit root/
  backend gitignore rules keep it out of Git. Never publish its contents.
- One transaction deleted the approved99 Firestore records across events,
  registrations/locks/tickets, application reviews/decisions, facilities requests/
  links, old publication jobs and extra profiles/enrollment claims; reset the
  Student role and appended a trusted-operator role audit. Deleted the other8
  Firebase sign-in accounts after the database commit. Backed-up document versions
  and collection membership were checked to reject unreviewed concurrent changes.
- Direct read-only verification confirms exactly2 Auth accounts/profiles,1
  enrollment claim and zero records in all cleared presentation collections.
  Request/integration logs, inbox/replay protection, latest maintenance statuses
  and integration configuration were retained. External Team10 work orders were
  untouched. No partner call, AI usage, schema/rules change, deploy or Git push.
  This is a real operator reset, not an automated test or browser login acceptance.
  [Sanitized result](docs/evidence/demo-cleanup-2026-11-09/check-results.json).

## Architecture and privacy preparation — 2026-11-09

- Replaced the outdated architecture/diagram with implemented Firebase Hosting,
  React/Vite, persistent Render/Express, Firebase Google Auth/Firestore, three
  roles/capabilities, AI and partner boundaries. Added a standalone accessible
  SVG for presentation/export. Preserved the original architecture options in
  docs/archive/architecture-options-original.md; historical reviews clearly
  point to the actual stack. No lecturer approval of the stack deviation invented.
- User reports Maintenance, Library and Internship connections completed;
  Maintenance is the main evaluation flow, the other two read-only. Notification
  Hub coordination is attempted, with no active delivery claimed. No fresh
  hosted partner trace is fabricated. User prepares the Working Happy Path.
- Added public #privacy notice before authentication/enrollment/application and
  shared workspace footer links, public contact explicitly authorized by user,
  AI/free-text disclosure and manual rights-request procedure. User delegated
  retention choice: routine diagnostic logs30 days; identifiable project records
  within90 days after final evaluation, operator-reviewed. No automatic purge,
  export endpoint, consent checkbox or production data changes. Controller/basis/
  processor-transfer confirmation remains a separate institutional/legal task.
- Implementation is local on the feature branch. No push, deploy, partner
  messages, real AI call or production mutation performed by this change.
- Verification: production build and Hosting artifact guard pass; two focused
  isolated browser tests pass (public notice without session/API access and
  workspace navigation). SVG rendered and inspected with no text outside its
  canvas. Local screenshots/evidence remain separate from hosted acceptance.

## Permanent Team 10 backend — 2026-11-09

- User supplied https://maintenance-team10.vercel.app (hyphenated hostname).
  Updated facilities provider default, public environment examples and private
  local/Render import URL to its /api/partner/work-orders route. Removed private
  temporary-tunnel approvals; credentials, request identity, existing links,
  HMAC/status ordering and other integrations are unchanged.
- Separate manual authenticated reads: partner health200; work-orders GET400
  MISSING_QUERY_PARAM. No creation POST, record change or lifecycle acceptance
  claimed. Render's running environment must still be changed in its dashboard;
  our receiver remains https://pd-project-events-clubs.onrender.com/webhooks/partner.
  No commit, push, deployment or partner message performed.
- Verification: 17 targeted isolated facilities/environment/local-mode tests
  pass; local and production-import environment checks pass. No real partner
  calls or AI credits during automated checks. Frontend unchanged.

## Hosted release — 2026-11-08

- User authorized Firebase Hosting + existing Render deployment, superseding the
  earlier no-deploy instruction for this release. User updated Render through
  its dashboard; agent published the static frontend with the owner-authorized
  Firebase CLI. Frontend https://events-management-4d8ce.web.app; backend
  https://pd-project-events-clubs.onrender.com. No Git push/commit or billing-plan
  change. Release setup/docs remain uncommitted on main; master is the skeleton.
- Added Hosting-only configuration, production build/artifact guard and deploy
  command. Only frontend/dist was published. Live HTML/entry module hash-match
  the build; logo/favicon/manifest200, private env/Admin-key/handover URLs404,
  root HTML no-store and correct Render API origin verified. Render health200
  with current API marker, correct frontend CORS204, denied origin403 and
  unauthenticated account401. Google provider enabled and all seven required
  Firestore indexes READY via read-only checks. No database seed or schema/rules
  deployment. User confirmed school Google login opens their hosted workspace;
  this is user-reported, not an agent-observed full cross-role production test.
- Production build, artifact checks (including synthetic private-file/key
  rejection) and two environment tests pass. Full isolated browser suite:
  **24 passed**, using mock AI/partners and disposable Firebase emulators. Fixed
  the QR test's outdated download filename to match the already supplied brand;
  no ticket behavior change. No automated live partner writes or AI credits.
- Preserved separate private localhost and deployment environments. Backend
  import file retains AI/Internship/Library/HMAC and dedicated facilities config,
  with legacy polling/publication disabled. User explicitly approved the exact
  old Team 10 HTTPS ngrok creation URL as a temporary demo exception, recorded
  by TEAM10_APPROVED_TEST_URL; frontend/API addresses remain permanent. Team 10
  deployed health returned200 but its old creation tunnel was offline. Their
  tunnel must return online and their webhook target must become
  https://pd-project-events-clubs.onrender.com/webhooks/partner. No partner
  message, new work order or relinking was performed.
- Render Free idle sleep still pauses the in-process worker; an always-on plan
  was not enabled. Firebase/Express PRD deviation and lecturer approval remain
  unchanged. [Release guide](docs/deployment/firebase-render.md),
  [sanitized evidence](docs/evidence/hosted-release-2026-11-08/check-results.json).

## Relevance-gated Library AI button — 2026-11-08

- User requested hiding AI Library search for unrelated activities. Added
  LIBRARY_RELEVANCE_V1: a clear learning purpose plus a concrete, grounded reading
  subject is required. Social welcomes, vague text, uncertainty, invalid model
  output and failures cannot enable the button. Manual catalog search remains
  available. A protected relevance read on activity details checks only public
  title/description; AI suggestions also recheck current text server-side before
  touching the catalog. No identity/roles/private notes are sent to AI.
- Concurrent checks coalesce in a bounded process-local cache keyed by public
  text/model/policy. Positive/negative results last up to24h, failed checks60s;
  edits invalidate, cache caps500 entries/eight active checks. Existing per-person
  request limits apply to misses and explicit suggestions. No new DB writes,
  collection/index, environment change or partner contract change. This replaces
  the previous automatic title-keyword fallback with manual search when relevance
  cannot be confirmed. No actual book relevance/availability is guaranteed by AI.
- Build/env checks pass; **119 isolated backend tests** and **two browser
  journeys** pass. Covered social welcome exclusion, positive workshop, grounded
  evidence/schema, concurrent/cache reuse, expiry/edits, direct-call enforcement,
  manual recovery and existing Student loading/register/cancel behavior. All
  AI/partner providers mocked; no real AI credits or external reads/writes.
- API restarted in existing facilities mode. Local health/frontend200 and new
  unauthenticated relevance route401. Real-model/UI testing remains with user;
  no Git operations, push or deployment.
  [Evidence](docs/evidence/library-relevance-2026-11-08/check-results.json),
  [policy/configuration](docs/integrations/library-resources.md#relevance-policy-and-cache).

## Plain-language helper text — 2026-11-08

- Replaced provider/API, deterministic-template and server/retry terminology in
  planning, Organizer application, Library and facilities helper text with short
  task-focused wording. Planning fallback now says Starter plan and clearly
  states AI is unavailable; AI source labels, manual review, replacement review
  and explicit save/publish/maintenance-send behavior remain intact.
- Copy-only frontend changes. Updated existing text assertions; build and the
  isolated planning progress/fallback/application browser journey pass. No new
  tests, backend/config changes, real AI/partner calls, Git operations, push or
  deployment. Technical configuration/data-flow details remain in the guides.

## Single progress feedback across portals — 2026-11-08

- Reviewed duplicate loading feedback across shared Student, Organizer, Admin,
  applicant, ticket, profile, AI and integration UI. Added explicit shared Button
  busyFeedback=notice support and applied it to 27 actions already covered by a
  progress panel. Their original labels/icons stay visible, with disabled and
  aria-busy retained; the panel owns the spinner/live announcement. Default
  standalone button feedback remains available.
- Removed the second Organizer list refresh notice, overlapping application
  processing/poll notices and the refresh notice during a pending facilities
  request. Existing status badges, review evidence, confirmations, requests and
  access rules remain intact. Frontend-only change; no backend/env changes.
- Build passes. Four isolated browser journeys pass: AI planning, Student
  loading/save/register/cancel, Organizer refresh/applicant submission/Admin
  refresh/approval, and Library AI/manual/fallback. Delayed test requests assert
  one status/spinner, unchanged disabled action labels, aria-busy, blocked
  duplicate actions/dialog dismissal and completion/recovery. Providers mocked;
  no external partner/AI calls, connected-record changes, Git operations, push
  or deployment. No broader real-user/cross-browser UI claim.
  [Evidence](docs/evidence/single-progress-2026-11-08/check-results.json).

## AI-assisted Library learning resources — 2026-11-08

- Added a Student-only Learning resources section on published/closed activity
  details. Explicit Find learning resources uses the existing AI model to select
  one catalog keyword from public title/description, then retrieves real Library
  books. No invented book recommendations or availability. Manual search,
  pagination, available/no-copy states, safe links, loading/empty/error/retry and
  clearly labelled activity-keyword fallback are included. No borrowing or
  reservation operation, activity write or new role powers.
- New protected GET/POST activity Library routes validate Student capability and
  visibility before provider access. Neither provider receives Student identity,
  Firebase tokens, private facilities notes or unrelated partner credentials.
  Catalog reads are bounded/validated; AI output may only select a search, with
  in-flight/five-per-minute process-local limits. Library settings are independent
  of Maintenance and Internship. Local server-only key configured from the
  supplied handover; original credential-bearing campus-event.md is unchanged
  and must remain private/out of commits. No Git operations performed.
- Build/offline environment checks pass. **114 isolated backend tests passed**,
  including six Library helpers and three authenticated Library API scenarios.
  New Library browser journey passed, as did existing Internship and cross-role
  journeys. AI/catalog providers were mocked throughout automated verification;
  no real AI credits or external partner writes. Separate manual deployed catalog
  and application-adapter reads returned200, with two resources matching
  programming. Existing AI configuration was verified present without invoking
  the real model. Live AI generation and a real-user UI walkthrough remain for
  user testing; no joint team sign-off or production deployment claimed.
- Local API restarted in its prior facilities mode; frontend/health200, both
  unauthenticated Library routes401. Original Maintenance/Internship settings
  preserved. No Git operations, push or deployment.
  [Guide](docs/integrations/library-resources.md),
  [sanitized verification](docs/evidence/library-resources-2026-11-08/check-results.json).

## Team 17 read-only Internship connection — 2026-11-08

- Connected the supplied Team17-Team12 handover to an authenticated
  Student-capability `GET /api/internships` proxy and Student **Internships**
  page. Submitted keyword/location/work-mode filters, pagination, refresh,
  safe external detail links and loading/empty/error/retry states are included.
  Enrolled Student/Organizers retain access; other Organizers, pending applicants
  and Admin are denied. No application submission, identity forwarding or writes.
- Independent `TEAM17_API_BASE_URL` is configured privately for the public
  deployed provider. Maintenance settings are preserved. Bounded reads validate
  the response/schema/link origin and reject malformed data. Current hosted six
  listings are explicitly fictional demos, with per-card labels and a notice.
- Build and offline environment checks pass. Complete isolated backend suite:
  **105 passed**, including five provider helper tests and two authenticated API
  scenarios. Internship browser journey and existing cross-role journey pass;
  Internship browser checks cover loading, filters, pagination, errors/recovery,
  safe links, mobile menu and no overflow at 360/768/1024/1440px. Providers were
  mocked throughout automated checks; no real AI credits or partner writes.
- Separate manual public reads returned HTTP 200, including a read through the
  actual adapter with six valid demo records. Local frontend/API started on
  5173/3000, preserving facilities mode; health200 and unauthenticated feed401.
  No authenticated real-user UI walkthrough or Campus Events deployment claimed.
  No Git operations, pushes or deployment. Original supplied handover preserved.
  [Setup](docs/integrations/team17-internships.md),
  [sanitized evidence](docs/evidence/team17-internships-2026-11-08/check-results.json).

## Explicit frontend/backend application folders — 2026-11-07

- User requested replacing the ambiguous root frontend source/firebase names
  with frontend/ and backend/. Moved React source, public assets, HTML, Vite/TS
  config, frontend private/example environments and build output into frontend/;
  renamed the entire API tree to backend/, including tests and existing deps.
  Root package/dependencies remain the frontend toolchain/orchestrator.
- Root npm commands retained and repointed. Updated Vite root/env directory,
  TypeScript command, test-stack paths, operator credential fallback/frontend
  setup path, offline environment checks, links and guides. Persistent worker,
  runtime .mjs basenames, URL paths, ports and role/business rules are preserved.
- Frontend env, Admin credential and brand assets hash-match the originals.
  Private backend env changed only the credential file path to the moved file;
  all other values preserved. Ignore rules and original user packs untouched.
  No Git commands, staging/commit/branch operations, dependency upgrades, external partner call,
  connected-record write, push or deployment. Verified project services restarted
  in their previous facilities mode on 3000/5173; own public receiver health200.
- Build and local env check pass; 98 isolated backend tests pass, helper checks
  46 pass/one API skip, and one isolated browser cross-role journey passes.
  App factory still imports without Firebase/listener initialization. Local HTTP
  checks serve HTML, entry module, logo, favicon and manifest. Production guard
  still intentionally blocks current localhost values. Current documentation
  links/protected-file checks pass; broader UI review remains with the user.
  [Evidence](docs/evidence/application-layout-2026-11-07/check-results.json).

## Repository/document and environment cleanup — 2026-11-07

- User explicitly reserved all Git work for themselves. No Git command, staging,
  commit, branch/remote change, push or deployment was performed. Existing ignore
  rules, active frontend/backend private files and Admin credential hash-match
  the pre-cleanup snapshots. Original supplied packs were left untouched.
- Moved 33 documents/tests without discarding contents. Coursework/prompts/
  templates use grouped plural folders and kebab-case filenames; historical
  reviews/evidence and older deployment guide are archived. Previous root README
  content preserved; new README/docs index/layout guide provide navigation.
  Stable policy/contract/handoff paths remain. Backend tests live in backend/tests
  with imports and child-process working directories corrected; runtime/operator
  .mjs entrypoints, API/access behavior and dependency versions remain intact.
- Added four public example templates under config/env for local/production
  frontend/API, preserving compatibility local examples. Package display names
  now match the brand. Offline environment checks and build:production prevent
  silently baking localhost/example/test-tunnel API URLs into deployment builds.
  API production checks read host variables only, never the local private file.
- Local environment/build passed, helper checks 46 passed/one API skip, complete
  isolated backend emulator suite 98 passed. Local Markdown links: zero broken
  across 61 checked documents. Production guard correctly rejected the currently
  local-only API origin; no hosted values/deployment success is claimed. Browser
  checks not run per user's UI review preference. No live provider/partner call
  or connected-project mutation. Build/emulator outputs regenerated normally.
  [Checks](docs/evidence/repository-cleanup-2026-11-07/check-results.json),
  [move inventory](docs/evidence/repository-cleanup-2026-11-07/moves.json).

## Additional pod outreach drafts — 2026-11-07

- Created three member-facing Markdown messages under docs/partner-requests for
  Notification Hub, Internship and Library. Each proposes one useful existing
  endpoint, asks what alternatives the team can provide, and requests the basic
  contract/test URL with credentials exchanged privately.
- These are unsent proposals for the user to share, not confirmed contracts or
  implemented integrations. No app/runtime configuration change or partner call.
  Documentation diff check only; no build/tests needed. No push/deploy.

## Real Team 10 local work-order creation succeeded — 2026-11-07

- User supplied Team 10's HTTPS ngrok creation endpoint and chose to click the
  retry themselves. Changed only the ignored server endpoint override to
  https://ethanol-prayer-skyline.ngrok-free.dev/api/partner/work-orders;
  agreed credentials retained. Validated config and restarted the verified
  facilities API. Team 10 local health and our local/public health returned 200.
- User's third attempt for activity rXTvjUumz1aTJDwiq9yt succeeded with HTTP 201,
  duplicate=false, state SENT, work order 39a8f615-6561-406d-8c4f-c30ecb063f0a
  at 2026-11-07T07:52:34.636Z. Scoped read confirmed original payload and retry
  identity preserved, both unique link directions, TEAM10_CREATION_RESPONSE
  source and OPEN sequence/version 1 from the creation snapshot.
- Observed actual Brave Organizer UI showing accepted/linked, matching order ID
  and Maintenance status OPEN. Agent opened the review only; user performed the
  final retry. No impersonation/role bypass. This is manual partner-local evidence,
  separate from mocked automated suites. No code change/new automated checks for
  this endpoint setting. Dispatch Board confirmation and signed versions 2–5
  remain pending Team 10. No push/deploy. Preserve this local-order association;
  use another activity for deployed-environment creation tests.
  [Evidence](docs/evidence/maintenance-local-creation-2026-11-07/check-results.json).

## Actual facilities POST 404 confirmed — 2026-11-07

- User performed the explicit owner retry. Scoped read confirmed activity
  rXTvjUumz1aTJDwiq9yt has attempts=2, RETRYABLE,
  FACILITIES_PARTNER_NOT_FOUND and saved partnerHttpStatus=404 at
  2026-11-07T07:03:42.136Z, with no returned workOrderId or binding. The actual
  POST now confirms the failure at the configured Team 10 creation URL; earlier
  GET evidence alone did not. Receiver public health is still 200.
- No additional retry/partner call, record write, code change or push/deploy.
  Waiting for Team 10 to confirm/fix its deployed creation route or supply a
  corrected contract URL. Preserve the original request identity when retrying.

## Facilities failure diagnostics — 2026-11-07

- User supplied a different failed activity, rXTvjUumz1aTJDwiq9yt. Scoped read
  confirmed PUBLISHED, one RETRYABLE attempt, FACILITIES_PARTNER_UNAVAILABLE,
  no receipt/binding; failure recorded at 2026-11-07T06:57:14.099Z. Local/public
  health and Team 10 health pass. GET on creation URL returns 404, which alone
  does not establish how POST behaves. The original remote status was not saved.
- Added private numeric partnerHttpStatus to bounded creation attempts without
  storing response bodies/headers/secrets or exposing it in owner DTOs. Actual
  POST 404 now has FACILITIES_PARTNER_NOT_FOUND with actionable UI copy. Original
  payload/idempotency, leases, role checks and association rules remain intact.
- Build, diff check and all 96 isolated backend tests passed, including a mocked
  two-attempt 404 test verifying unchanged payload/key, no body leak or binding.
  Restarted the verified facilities API; local/public health returned 200 at
  07:01:44Z. Automated tests made no live provider/partner calls.
- Found the target activity in the existing Brave Organizer session, but automatic
  approval review rejected the coordinate click on Review and retry request as
  a possible consequential submission without verified controls/action-time
  authorization. No workaround, manual retry, work-order creation or state update
  was performed. Owner's explicit UI retry is pending; real partner POST cause
  and dispatch-board/status confirmation are still unverified. No push/deploy.

## Coordinated maintenance test readiness — 2026-11-07

- Manual checks found ngrok offline and the verified API in normal integrations-
  disabled mode. Restored facilities-mode API and the existing port-3000 ngrok
  tunnel. Public health returned 200; an unsigned empty callback POST returned
  expected 401 INVALID_WEBHOOK_SECRET (rejection audit only, no status change).
- Our stored key passed Team 10's deployed health API with HTTP 200. No credential
  disclosed/changed. Creation URL is still the agreed Vercel partner/work-orders
  endpoint. Their separately reported local-key 401 needs private alignment.
- Scoped receipt read found activity uEha4rNd3OZsngPGZdk4 RETRYABLE after one
  unavailable-partner attempt, with no returned workOrderId. Current browser is
  Admin; no owner impersonation/retry or real work-order creation was performed.
  Owning Organizer's explicit retry and Team 10's signed lifecycle walkthrough
  remain pending; no real UI status success claimed. No push or deployment.
  Details/timestamps: [maintenance connection](docs/MAINTENANCE_CONNECTION.md).

## Official logo kit integration — 2026-11-07

- Read the already extracted Campus Events & Clubs logo kit README and inspected
  its preview. Preserved the original source kit and copied all seven supplied
  SVG variants plus six favicon/manifest assets unchanged into public assets.
- Shared BrandLogo selects horizontal/compact and light/dark exports without
  color or proportion changes. Header uses horizontal above 640px and compact
  below; sign-in, loading, profile setup and dark surfaces reuse the component.
  Updated visible product names, page title and QR download filename. Existing
  access rules, API/partner contracts, ticket values and session keys remain.
- Wired supplied SVG/ICO favicon, Apple icon, manifest and theme color in Vite.
  Build/diff passed; 13 asset hashes and icon dimensions verified. User handles
  visual testing, so no browser checks. No provider calls, push or deployment.
  See [branding usage](docs/BRANDING.md).

## Shared motion refinement — 2026-11-07

- Added small press feedback to shared buttons, segmented controls and navigation;
  immediate press with a smooth release. Busy/normal button icons fade on change.
- Workspace and mobile menus enter from their trigger edge in 200ms and exit in
  160ms. Shared dialogs fade/lift in with faster exits. A bounded presence hook
  retains the visual exit only; closed panels become inert/hidden to assistive
  technology immediately, and existing focus return/traps remain tied to open.
- Activity, registration, roster and Admin request rows enter with 30ms stagger
  capped at 150ms. Stable keyed rows retain their DOM across normal updates; no
  refresh-driven animation keys or artificial loading delays were added.
- Confirmed-action toasts/check-in/Organizer approval get a single checkmark
  pulse. AI plan summary, agenda, checklist and facilities sections reveal in
  sequence while all section review/application controls remain unchanged.
- Reduced motion removes press scaling and stagger delays, minimizes animations
  and skips the exit wait. No dependencies, API or permission changes. Build and
  diff check passed. User requested to do visual UI/UX testing personally; no
  browser/emulator checks or live provider/partner calls for this refinement.
  No push or deployment.

## Admin activity list cleanup — 2026-11-07

- Replaced the tall stacked mobile rows with a compact title/status group,
  date/time and location metadata, and a small organizer line beside the
  consistent View details action. Desktop uses aligned Activity/Organizer/View
  columns at 1024px and above; long names and locations wrap.
- Read-only routes and permissions are unchanged. Updated the existing browser
  selector for the renamed action. Build and diff check passed; browser/visual
  testing is left to the user as requested. No push or deployment.

## Published description readability — 2026-11-06

- User showed an AI-planned event where prose, agenda and preparation tasks ran
  together. The existing paragraph renderer collapsed saved newlines. Added a
  shared safe plain-text ActivityDescription renderer for Student/Organizer and
  read-only Admin details: separated paragraphs, known generated agenda headings,
  time-range rows, real bullets/numbered lists and checklist stage headings.
- Preparation checklist is a native keyboard-accessible collapsed disclosure to
  reduce visual overload. Published content and existing reader access remain
  intact; this is not a new private planning field. No HTML interpretation,
  database rewrite, regeneration, API/DTO change or record migration. Existing
  events display correctly after refresh. Long text can shrink/wrap in the grid.
- Build and two targeted isolated browser scenarios passed: generated plan
  application/publish/reload/structured display/checklist expansion and the
  existing Student/Organizer/Admin registration/roster/read-only journey.
  Verified no overflow at 360/768/1440; desktop/mobile screenshots inspected.
  Diff check passed. Backend/full suite not repeated for this display-only fix.
  No live provider/partner call, real event edit, push or deployment.
- [Evidence](docs/evidence/description-format-2026-11-06/check-results.json),
  [desktop](docs/evidence/description-format-2026-11-06/activity-description-readable.png),
  [mobile](docs/evidence/description-format-2026-11-06/activity-description-readable-mobile.png).

## Planning timeout diagnosis and duration UX — 2026-11-06

- User reported a template instead of AI and difficulty calculating duration in
  minutes. Inspected the real local request evidence: planning finished after
  12,472ms while its configured cutoff was 12 seconds. A single user-authorized
  manual provider diagnostic, with a synthetic workshop and 45-second allowance,
  returned HTTP 200, source AI, finish stop, valid 120-minute agenda in 13,259ms
  (2,132 total tokens). Key/model are configured and working. This strongly
  supports premature timeout; the original fallback reason was not logged.
- Increased **planning only** to 45 seconds. Short drafting/admission limits,
  auto-approval policy and facilities mode are unchanged. No model/key switch or
  automatic retries. Template UI now distinguishes timeout, missing config,
  provider failure and invalid plan instead of calling every case unavailable.
- Duration now accepts Hours/Minutes with common shortcuts and a written total.
  No conversion required by users. Enforce 15-minute–8-hour bounds in the UI;
  server still receives/validates integer total minutes. Presets are keyboard/
  touch accessible and form fields remain preserved.
- Build, 18 targeted unit/service checks and two targeted browser scenarios
  passed. Verified preset conversion, invalid short duration, 360/768/1440 layouts,
  mocked timeout wording, section application and manual publish. Screenshots
  visually inspected. Full backend/browser suites were not repeated for this
  focused follow-up. Restarted only the verified local facilities API; health ok.
- The manual diagnostic used real AI credits, separate from mocked automated
  checks. No real account approval, event/work-order write, partner call, push or
  deployment. User's real signed-in browser generation walkthrough remains.
  [Evidence](docs/evidence/planning-timeout-2026-11-06/check-results.json),
  [duration controls](docs/evidence/planning-timeout-2026-11-06/planning-duration-input.png).

## AI Organizer admission and Event Planning Copilot — 2026-11-06

- User explicitly confirmed automatic approval eligibility for **any verified
  Google applicant, including personal accounts**, if every stated criterion
  passes. Adopted CAMPUS_ORGANIZER_V1 before enabling real approvals: explicit
  campus activity, purpose/audience, organizer/independent identity, personal
  responsibility, consistent/safe information and no concerns or bypass. Validate
  strict model output and supporting quotes; no arbitrary confidence threshold
  or invented affiliation proof. Any failure/uncertainty remains PENDING for
  Admin; AI never rejects or appoints Admin. Updated AGENTS and access/contract.
- New submissions persist PENDING, then analyze only their exact committed
  revision. Network runs outside transactions; private lease/hash/deadline plus
  reverified token/account and atomic profile/request/audit checks prevent stale
  promotion, concurrent duplication and overwrite of Admin/resubmission changes.
  Student identities, enrollment and registrations survive promotion. Personal
  applicants gain Organizer only. Automatic and manual decisions have honest
  source/evidence labels on applicant/Admin screens. Old pending requests are
  not scanned or processed on startup. Analysis interruption falls to Admin.
- Expanded Create activity → Plan with AI into a structured copilot: bounded
  duration/count input, timed agenda, before/during/after checklist, facilities
  suggestions and explicit assumptions. Server validates positive integer minutes,
  exact total and derived offsets. Invalid/unavailable AI gives a complete fixed
  template with honest labels. Legacy drafting API remains compatible.
- Select sections to apply; agenda/checklist append unless replacing description.
  Replacing existing nonempty text requires acknowledgment. All other manual
  fields remain intact. Facilities selection defaults off; applying/saving notes
  never sends a maintenance request. Actual save/publish/Send remain separate.
  No new event schema migration/index. Shared UI/header/neon and partner worker
  paths are preserved. Separate planning and admission provider limits documented.
- Final isolated checks: **95 backend tests passed**, **21 browser scenarios
  passed**, production build, side-effect-free app import and diff whitespace
  check passed. Covered personal approval, retained Student registration, provider
  failure/disabled mode, duplicate/Admin/resubmission races, disabled accounts,
  expired deadline, structured fallback and reviewed section application. The
  full browser suite also covers existing QR, facilities, workspace and Chromium/
  WebKit schedule behavior. Planning widths 360/768/1440 checked. Five synthetic
  screenshots visually inspected. Providers mocked; demo Firebase only.
- Enabled the user-confirmed policy/version privately in ignored backend/.env,
  confirmed the existing AI key is configured (no value printed), and restarted
  only the verified project facilities-mode API. /health returned status ok;
  existing Vite stayed running and returned HTTP 200. No old pending application
  processed, real applicant approved, new provider call, real partner call,
  connected-project seed, push, merge or deployment during this implementation.
  The older manual basic-draft provider result is historical and does not verify
  the new plan/admission schemas. Real provider-backed user walkthrough remains.

Evidence: [check results](docs/evidence/ai-flows-2026-11-06/check-results.json),
[automatic approval](docs/evidence/ai-flows-2026-11-06/ai-admission-approved.png),
[manual review](docs/evidence/ai-flows-2026-11-06/ai-admission-manual.png),
[planning preview](docs/evidence/ai-flows-2026-11-06/ai-event-plan.png).
Policies: [admission](docs/ORGANIZER_AI_ADMISSION.md),
[planning](docs/AI_DRAFT_ASSISTANT.md). Next-session handoff rewritten for current
implementation; no additional eligibility decision is pending.

## Menu neon hover/focus treatment — 2026-11-06

- User requested rotating neon light around each menu button on hover. Added
  subtle blue/cyan conic-gradient edge decoration to shared navigation cards and
  sign-out for all roles. It is hidden/paused at idle, revealed on hover-capable
  pointer hover, keyboard focus or press, with a light surrounding glow. The mask
  keeps content clear and pointer-events:none preserves interaction. No layout
  movement. Unsupported compositing retains static focus/hover glow.
- Reduced-motion preference disables the orbit and retains a static highlight.
  Production build and existing all-role menu browser check passed. Offline
  Chromium and WebKit smoke checks confirmed the angle advances, decoration
  does not intercept pointers and reduced-motion animation is none. Four hover/
  reduced-motion screenshots visually inspected. No new behavior unit tests,
  full-suite/backend rerun, real provider calls, push or deployment.
- [Evidence](docs/evidence/menu-neon-2026-11-06/check-results.json),
  [Organizer hover](docs/evidence/menu-neon-2026-11-06/navigation-organizer-neon-hover.png).

## Shared mobile menu polish — 2026-11-06

- User requested a more futuristic hamburger/menu across all roles. Added a 44px
  softly shaded trigger with staggered lines that animate into a close mark.
  The menu is now a floating rounded panel with a navy/blue workspace heading,
  descriptive navigation cards, selected icon treatment and separate sign-out.
  The same shared component serves Student, Organizer and Admin destinations.
- Kept non-modal disclosure semantics. Opening focuses the current destination;
  Escape restores the trigger, outside clicks/focus dismiss, and selecting a
  destination closes the panel and returns focus. Explicit closing is idempotent.
  Desktop resize closes the mobile panel and focuses visible desktop navigation;
  fixed a CSS-hide/blur race discovered by the browser check. Panel height stays
  bounded with internal scrolling on short screens. Reduced motion is respected.
- Updated workspace popup bounds for the 44px menu button at 320px. Shared header
  height remains constant when the floating menu opens. No role, API or access
  policy change; AI extensions remain pending as described in the handoff.
- Final build and **four targeted browser scenarios passed**, including all-role
  menu interaction, header/workspace switching, existing mobile/network behavior
  and cross-role profile/mobile sign-out regression. Widths 320/360/768 plus
  1024px resize and short 360px height checked. The full expanded browser suite
  was not rerun for this follow-up; previous 18-scenario result below is historical.
- Six synthetic screenshots visually inspected; no real provider calls or project
  seeding, push or deployment. Diff whitespace check passed.
  [Evidence](docs/evidence/mobile-menu-2026-11-06/check-results.json),
  [Organizer menu](docs/evidence/mobile-menu-2026-11-06/navigation-organizer-mobile.png),
  [menu trigger](docs/evidence/mobile-menu-2026-11-06/navigation-organizer-trigger.png).

## Header/workspace cleanup — 2026-11-06

- User requested a cleaner header from a screenshot showing duplicated role and
  workspace controls. Replaced the separate workspace bar with one compact
  active-workspace disclosure in the 64px header. Dual-access users no longer
  have a repeated role badge. Branding, primary navigation and account actions
  align in one row; mobile navigation begins below 1024px.
- Student/Organizer choices include short purpose descriptions and a selected
  check. Switching remains available directly in the mobile header. Supports
  keyboard activation, arrows/Home/End, Escape/focus return, outside-click and
  focus-leave dismissal. Existing capabilities, routes and per-person workspace
  persistence remain authoritative; no API or role policy changed.
- Production build and focused isolated header/browser check passed, including
  320/360/768/1024/1280/1440 widths, popup bounds, keyboard switching, mobile
  navigation and Organizer preference after profile reload. Genuine synthetic
  screenshots visually inspected. **18 browser scenarios passed**, including
  Chromium/WebKit schedule regression. Diff whitespace check passed. Backend unchanged; no real-project seed or external calls.
- Evidence: [desktop](docs/evidence/header-cleanup-2026-11-06/header-desktop.png),
  [mobile workspace menu](docs/evidence/header-cleanup-2026-11-06/header-mobile-workspaces.png).
  No push or deployment. AI handoff updated with the header follow-up.

## Next AI features agreed; handoff saved — 2026-11-06

The user chose automatic AI approval of acceptable Organizer applications with
all other cases retained for Admin review (no automatic rejection), plus expanded
AI event planning. These changes are **not implemented**. Exact admission criteria
still need definition before enabling real auto-approval. This new user direction
supersedes the earlier intended Admin-only/Organizer-drafting-only AI scope when
implemented; preserve all unrelated authorization boundaries. Existing feature
verification below does not cover these proposed extensions.

Read [next-session handoff](docs/NEXT_AI_HANDOFF.md) for the user's decision,
implementation boundaries, relevant files, current tests and pending Team 10 test.

## Reviewed facilities requests and signed completion updates — 2026-11-06

- User supplied Team 10's dedicated POST /api/partner/work-orders contract and
  exact raw-byte HMAC/sequence webhook contract, confirmed the existing partner
  key is the same, and explicitly approved automatic linking of a validated
  creation response that echoes the sending activity ID. Updated AGENTS/access
  scope for that bounded exception. No client IDs, arbitrary relinks or new
  Student/Admin powers; existing trusted links and legacy worker stay intact.
- Owning Organizer opens published activity → Facilities support → Review
  facilities request, reviews recipient/saved details/category, then explicitly
  sends. Saving or publishing alone sends no facilities request. Verified receipt
  atomically claims both unique association directions. Existing duplicate
  receipts are labeled honestly: they do not update remote work-order details.
- Durable original payload/revision, canonical JSON bytes, stable UUID
  idempotency key and 45-second leases prevent concurrent calls and make lost
  response/restart retries safe. SENT repeats make no new call. Transient or
  unverifiable results remain RETRYABLE; definitive rejection/association conflict
  requires coordinator review. No blind automatic resend. Original submitted
  details remain visible after subsequent activity edits.
- Signed maintenance events validate HMAC-SHA256 over exact raw body bytes and
  consistent UUID/header/envelope/data versions. Per-work-order OPEN=1 through
  CLOSED=5 ordering rejects stale/equal regressions, preserves early webhooks,
  and prevents legacy status downgrades. Existing inbox dedupe/conflict and
  shared-secret-only compatibility remain outside HMAC-required mode. Payload
  activityId never creates an association.
- Owner status refreshes every 15 seconds while the page is visible. RESOLVED
  and CLOSED display facilities completion without closing the campus activity.
  Added loading, review/cancel, disabled, uncertain, retry, collision and receipt
  states; checked responsive widths 360/768/1024/1440. No new composite index.
- Added explicit `npm run dev:api:facilities`: creation only after reviewed Send,
  signed inbound maintenance required, agreed existing private key reused,
  legacy publication/polling disabled. Startup itself makes no partner request.
  Normal and inbound-only modes retain their previous boundaries.
- Local checks: **79 backend tests passed**, **17 browser scenarios passed**,
  production build, side-effect-free app import and diff whitespace check passed.
  Browser checks include synthetic lost-response retry and signed auto-completion.
  All automated providers were mocked and Firebase used demo emulators; no real
  partner/AI calls, connected-project seed, push or deployment.
- Started the local frontend on localhost:5173 (HTTP 200) and API in explicit
  facilities mode on localhost:3000 (/health status ok). No previous project
  listeners were running, so no user server was terminated. No ngrok process was
  observed; external status delivery needs the user's port-3000 tunnel running.
- Real creation/Team 10 dispatch-board acceptance still needs the user's explicit
  reviewed Send on an unlinked published activity with saved notes. Earlier manual
  inbound delivery and trusted activity association below are preserved and are
  separate evidence. No new real work order is claimed.

Evidence: [local check results](docs/evidence/facilities-request-2026-11-06/check-results.json),
[review/retry dialog](docs/evidence/facilities-request-2026-11-06/facilities-review-retry.png),
[received completion](docs/evidence/facilities-request-2026-11-06/facilities-resolved.png).
Contract/setup: [maintenance connection](docs/MAINTENANCE_CONNECTION.md).

## Coordinated Team 10 inbound webhook verified — 2026-11-06

**Association follow-up:** the user selected published activity
`iGR6mXYnQMDHBYV8GnZ4` (Collaborative Webhook Testing Session: Teams 10, 12 &
Maintenance). The trusted tool's dry run passed; applied exactly that work-order
association, then independently read back both mapping directions and the existing
latest status. Activity is PUBLISHED, source TRUSTED_OPERATOR, status ASSIGNED,
reported event ID/timestamp match and no ordering conflict. This explicitly
authorized connected-project setup wrote only the two mapping records; no event,
role, registration or maintenance status was changed. The initial unlinked state
below records the earlier receipt check. Real Organizer browser confirmation is
still pending the user's panel refresh; no UI result is invented. No code change,
new automated test, partner call, push or deployment for this setup step.

- User supplied Team 10's manual test report for maintenance work order
  `88888888-8888-4888-8888-888888888888`, event
  `f82ab543-7de7-4fce-91f2-15d6611dbead`, occurrence time
  `2026-11-06T08:00:01.921Z`, OPEN → ASSIGNED. The peer reported first delivery
  201/duplicate=false and exact replay 200/duplicate=true through the ngrok URL.
- Independently performed a narrowly scoped **read-only** verification in the
  configured `events-management-4d8ce` project: that inbox event exists with
  secretVerified=true, expected event type/work-order ID/toStatus; the two supplied
  request IDs match POST /webhooks/partner statuses 201 and 200; and the private
  latest-status record references the same event, status ASSIGNED, occurrence
  timestamp and no ordering conflict. No credentials or secret values were printed.
- The work-order reverse mapping is absent. Requested the user's chosen published
  activity URL before binding; no target is inferred from title/location or an
  unrelated existing activity. **Organizer UI linkage and real-browser status
  confirmation are still pending.** No trusted association or other record was
  written by this verification.
- This is actual manual peer-to-local-API inbound evidence, separate from emulator
  results and earlier deployment evidence. It does not verify new work-order
  creation, outbound delivery, retry/recovery, venue reservation, lecturer
  approval or hosted deployment. The peer's deliveries created the accepted
  operational records; automated checks still never seed/call the real partner.
- No code change, new automated test, push, merge or deployment for this receipt
  verification. Sanitized evidence contains targeted result metadata only, not
  private headers, raw environment values or full operational logs.

Evidence: [manual inbound verification](docs/evidence/maintenance-live-2026-11-06/check-results.json).

## Inbound-only maintenance testing enabled — 2026-11-06

- User explicitly asked to enable receiving maintenance updates before the
  coordinated tunnel test. Added `npm run dev:api:maintenance`, which runs the
  existing local launcher with --maintenance-test. Normal `npm run dev:api`
  remains fully integration-disabled. Production entrypoints/worker are unchanged.
- Test mode retains only the existing agreed WEBHOOK_INBOUND_SECRET from private
  configuration. It requires at least 32 characters with no padding/known example
  placeholder; missing/invalid values fail closed. All outbound partner URLs,
  delivery credentials, polling settings, provider keys, diagnostics allowlists
  and emulator routing are stripped. Firebase credential/project matching, port
  3000 and exact localhost:5173 browser CORS remain. No secret is created, rotated,
  logged or copied into tracked files.
- Verified only the existing inbound secret's presence/validity, without printing
  its value. Identified the running dev API by command/cwd, stopped that process
  normally and started the explicit inbound-only mode. Startup confirms inbound
  reception enabled and outbound/provider access disabled; `/health` returns 200.
  No test webhook, work-order mapping, partner HTTP request or database seed was
  sent to the connected project. A public tunnel is not opened by this launcher.
- Production build passed; **63 backend checks passed** (37 API/emulator scenarios,
  9 mocked AI checks and 17 helpers). Six new mode-policy checks cover defaults,
  whitelist, fail-closed secret handling, preserved unrelated settings, no worker
  delivery/polling and disabled provider access. A new emulator scenario verifies
  authenticated acceptance, rejection and idempotent duplicate receipt using the
  filtered mode, with zero external requests. No new browser run was needed for
  this launcher-only change; the previous 16-browser baseline is separate.
- Ngrok/public reachability and an actual Team 10 update remain the next joint
  test. Incoming accepted updates will persist in the configured project once
  Team 10 sends them. The trusted work-order association is still required for an
  activity's private status panel. No push, merge or deployment.

Commands and next steps: [maintenance testing](docs/MAINTENANCE_CONNECTION.md).

## Calendar and clock icon repair — 2026-11-06

- User reported date/time icons focusing the native fields without opening usable
  pickers. The previous shared control inferred support from the presence of
  `HTMLInputElement.showPicker`; its catch only retained typing, with no visible
  chooser. Reproduced this failure in a browser where showPicker exists but
  returns without opening UI. Earlier schedule checks only clicked the opener
  and pressed Escape; they did not assert an actual visible picker or selection.
- Replaced the icon action with app-controlled dialogs for date, start/end time,
  end date and registration deadline. Native input/typing/required validation
  remain. Calendar supports month/year selection, leap years, Today, roving-focus
  arrow/Home/End/Page navigation and explicit date selection. Time has accessible
  24-hour hour/minute selects and Use time. Cancel/Escape preserves values and
  restores focus to the correct field icon. Campus timezone is shown explicitly.
- Opening/closing a picker never saves an event. Picker selection dispatches the
  normal controlled-input events, then the existing campus-to-UTC converter and
  normal save/publish API remain authoritative. Modal close buttons explicitly
  use type=button, Enter in the calendar year field moves focus into the grid
  rather than submitting the enclosing form, and focus trapping excludes negative
  tab indices. Select controls use consistent 44px sizing in WebKit and Chromium.
- Verification: production build passed; **all 16 browser scenarios passed in one
  final full run**, including the 14 existing flows plus two new engine-specific
  picker scenarios. Chromium checks a no-op native picker; WebKit checks a native
  picker that throws. Neither path calls showPicker after the fix. Tests assert
  visible dialogs, month/year navigation, leap/non-leap February, keyboard date
  rollover/selection, Tab trapping, focus restore, Escape/cancel, year Enter and
  close without submission, direct typing, all start/end/deadline fields, and
  persisted UTC values from a New York device using campus time. Layouts pass at
  360/768/1024/1440px. WebKit engine testing is separate from a manual Safari or
  physical mobile-device check. Screenshots were visually inspected.
- Frontend-only fix: API contract shapes, auth/roles, registration rules, dates
  stored in Firestore and partner integration behavior are unchanged. The prior
  56-backend-check baseline is not a new backend run. No real AI/partner calls,
  connected-project test records, backend restart, push, merge or deployment.
  Existing Vite hot reload serves the change at http://localhost:5173.

Evidence: [checks](docs/evidence/picker-fix-2026-11-06/check-results.json),
[WebKit mobile calendar](docs/evidence/picker-fix-2026-11-06/webkit-calendar-mobile.png),
[WebKit time picker](docs/evidence/picker-fix-2026-11-06/webkit-time-picker.png),
[Chromium desktop calendar](docs/evidence/picker-fix-2026-11-06/chromium-calendar-desktop.png).

## Activity limits, complete schedules and linked maintenance — 2026-11-06

- User approved participant limits, registration deadlines, end times, facilities
  requirements and a bounded connection to the existing Team 10 webhook. Creation
  now groups activity details, campus-time schedule, registration, optional private
  facilities notes and a review summary. End times can cross dates. All new
  fields are optional/null for compatibility; existing activities remain unlimited
  with no inferred end/deadline. Corrections clear stale form validation feedback.
- Added `maxParticipants` (integer 1–100,000 or null), `endDateTime`,
  `registrationDeadline` and owner-only `facilitiesNotes` (2,000 characters).
  Calendar/order validation applies to the merged stored event, not only the
  submitted patch. End must follow start; deadline must be at/before start.
  Capacity edits cannot fall below current ACTIVE registrations. Registration
  checks server time/status/deadline/end/capacity in the existing transaction;
  final-seat and capacity-edit races cannot overbook. Cancellation frees a seat,
  while checked-in registration/cancellation behavior is preserved.
- Student cards/details show count/limit/seats left and disabled full/deadline/end
  states. End/deadline display uses campus time in details/tickets/Admin oversight;
  time-dependent hints refresh locally every 15 seconds. Backend enforcement is
  authoritative. Facilities notes are excluded from Student/general activity,
  other-Organizer, Admin, ticket/history and partner projections; the owning
  Organizer can read/edit them under the existing ownership checks.
- The Organizer's activity page now includes a private facilities/status panel:
  saved notes, no linked request, waiting, last-received status/time, uncertain
  ordering, disabled configuration and refresh/error/retry. Saving notes **does
  not create/send a maintenance request or reserve a room**. The existing
  `activity.published` and provider payloads remain unchanged. Team 10's current
  work-order creation/association contract has not been supplied; the user plans
  to discuss it after choosing the product flow.
- Added owner-only GET `/api/activities/:id/maintenance`, no-store responses,
  private latest maintenance-status projection and trusted operator
  `npm run maintenance:link` (dry run by default, explicit --apply). Associations
  are atomic, unique and idempotent for existing PUBLISHED/CLOSED activities.
  There is no public linking/request-creation/status-mutation endpoint and no
  new Admin rights. Incoming payload-supplied activity IDs never create links.
  Secret-verified maintenance events project status in the inbox transaction;
  duplicates/older updates cannot regress it. Equal-millisecond conflicting
  states display needs-confirmation until a newer update resolves them.
- The new browser flow exposed an existing dual-role reload problem on ambiguous
  activity/profile URLs. Fixed it by persisting a per-person workspace preference
  in session storage; server-derived capabilities/roles remain authoritative.
- Verification: **56 backend checks passed** (36 API scenarios, 9 mocked AI checks,
  11 helpers), production build passed, and app factory import remained free of
  Firebase/listener initialization. **All 14 browser scenarios passed in the final
  complete run.** The new scenario covers invalid order corrections, New York
  device → UTC persistence/campus display, overnight schedule, create/reopen/edit,
  private notes, one-seat full/reopen after cancel, deadline denial, maintenance
  unlinked/waiting/received/loading/network/retry, and workspace/status persistence
  after reload. Layouts passed 360/768/1024/1440px checks. Expanded partner
  projection fixture plus policy/ordering helpers also passed a targeted 9-check
  run. Earlier full runs found two old preview assertions matching the new review
  summary; scoped them to the selected-schedule paragraph. No unresolved failure.
- Browser maintenance fixtures use guarded demo emulators and the actual receiver
  projection; API checks separately exercise HTTP webhook authentication/delivery.
  No real Team 10 calls, AI credits, connected-project test seed/link, new index,
  migration, push, merge or deployment. Restarted the local API on port 3000 with
  partner integrations disabled; Vite remains at http://localhost:5173. Process
  health/frontend HTTP 200 passed, not a production/database-connectivity claim.

Setup and ready-to-share partner questions:
[MAINTENANCE_CONNECTION.md](docs/MAINTENANCE_CONNECTION.md).
Evidence: [checks](docs/evidence/activity-policy-2026-11-06/check-results.json),
[creation form](docs/evidence/activity-policy-2026-11-06/activity-policy-form.png),
[linked maintenance](docs/evidence/activity-policy-2026-11-06/activity-linked-maintenance.png),
[Student deadline mobile](docs/evidence/activity-policy-2026-11-06/activity-deadline-mobile.png).

## QR image upload recovery and check-in UX — 2026-11-06

- User reported the generic unreadable-QR message when uploading the app's own
  Download QR PNG. Reproduced the same failure using a valid ticket PNG with an
  empty browser MIME type. The original uploader rejected it before decoding,
  and also collapsed format, size, loading and decoding failures into one message.
  The user's exact file/browser failure has not been independently inspected.
- The uploader now identifies PNG/JPEG/WebP by file contents and normalizes the
  local Blob type, so empty/generic metadata no longer rejects real PNGs. Explicit
  load/error/timeout handling replaces the opaque image-URL decoder. A white
  canvas handles transparent exports; bounded scales/sections support screenshots.
  File size (5 MiB), image dimensions (32M pixels/16,384px edges), cancellation
  guards and URL/canvas cleanup bound the work. No image is uploaded to a service.
- Unsupported file, excessive size/dimensions, damaged image, unreadable QR and
  unrelated QR now have distinct actionable messages. Readable non-ticket QR
  contents are rejected locally; the server still authorizes every real ticket
  and remains the only authority for attendance. API bodies/permissions and
  check-in transaction semantics are unchanged.
- Check-in UI now has separate camera/saved-ticket cards, consistent shared
  buttons, a Read ticket → Confirm attendee indicator, compact recovery notices,
  Try another image, focused Enter ticket code, a Clear action and a bounded
  camera preview. New image selection resets the previous error, and busy states
  disable overlapping actions. Existing explicit attendance confirmation remains.
- Build passed. **Three targeted browser scenarios passed**, covering ordinary
  Download QR, missing/generic metadata, transparent PNG, a rotated ticket within
  a tall screenshot, JPEG/WebP, six failure/recovery cases, no verify requests for
  invalid images, retry/focus, 360/768/1024/1440px layouts, camera permission denial,
  simulated camera decoding/cleanup, explicit/idempotent attendance, Student
  receipt and manual roster check-in. The new regression failed before the fix
  and passed afterward. Screenshot-only follow-up captured the cleaned states.
  No backend test rerun was needed for this frontend-only fix; the preceding
  46-backend/full-12-browser baseline remains historical evidence above/below.
- Physical camera and the user's original file still require their real-device
  retry. Local Vite and API remain running; no new services, credentials, index,
  backend restart, cloud writes, real AI credits, partner calls, push or deployment.

Evidence: [checks](docs/evidence/qr-upload-fix-2026-11-06/check-results.json),
[check-in desktop](docs/evidence/qr-upload-fix-2026-11-06/check-in-desktop.png),
[mobile upload recovery](docs/evidence/qr-upload-fix-2026-11-06/upload-recovery-mobile.png).

## QR registration tickets and attendance wiring — 2026-11-06

- Implemented the user's approved QR proposal in the live React and Express
  sources. Students choose View ticket after registering or in My registrations;
  tickets show event/name details, a locally generated QR, manual code, Download
  QR, copy and refresh actions. Existing active registrations work through lazy,
  concurrent-idempotent issuance. Enrolled MFU Student Organizers keep the same
  Student ticket flow and their Organizer workspace.
- The event owner opens Roster → Scan tickets. Camera scanning, local image
  decoding, manual code entry and roster check-in are connected to real API
  endpoints. Verification displays the attendee before explicit confirmation;
  only a successful server response shows attendance recorded. Camera permission
  is user-initiated; streams stop on detection/navigation. Loading, denied/error,
  duplicate and authoritative success states are present.
- Added POST own-registration ticket, POST owning-event ticket verification and
  POST owning-event check-in. Random 128-bit opaque codes contain no identity
  data, use no-store responses and stay outside list/roster DTOs and request logs.
  Private lookup documents use direct reads; no new composite index, cloud
  migration, role or Admin attendance powers are needed. Direct Firestore access
  stays denied. Team 10 integration paths/worker remain intact.
- Attendance timestamp/private audit and event checkedInCount are transactional;
  duplicate and concurrent QR/manual check-ins increment once. Cancellation and
  check-in races retain consistent locks/counts. Cancelled tickets fail, wrong
  events fail, and re-registration gets a new credential. **Checked-in active
  registrations cannot be cancelled**, preserving attendance history. CLOSED
  registration still permits arrival check-in; drafts do not. No arrival-time
  window or attendance-reversal workflow is invented.
- Validation: production build and side-effect-free app import passed;
  **46 backend checks passed** (29 API scenarios, 9 mocked AI checks, 8 helpers).
  **All 12 browser scenarios passed in one full run**, covering the existing
  Google/enrollment, approval, dual workspace, profile, publish/register/cancel,
  Admin protection, AI template/review and loading flows plus two new QR scenarios.
  New checks decode an actual downloaded QR PNG and actual QR video frames from
  a simulated stream; confirm camera-denied fallback/stream shutdown, explicit
  confirmation, repeat attendance, Student receipt, manual roster check-in and
  reload persistence. Layout checks passed at 360/768/1024/1440px. One initial
  browser failure was a test-file MIME issue (Playwright's extensionless download
  path); supplying the downloaded PNG's filename/type fixed it. No unresolved
  test failure remains.
- Screenshots were inspected; committed evidence masks QR/manual bearer values.
  Automated checks used disposable Auth/Firestore demo projects, with real AI
  and partner services disabled. **Physical phone-camera and real-account QR
  walkthroughs are not verified**. Static QR is copyable, so Organizer name
  confirmation is still needed; this does not claim fraud-proof identity checks.
- Started the updated local API on port 3000 with partner integrations disabled
  and Vite at http://localhost:5173. Health/frontend returned HTTP 200; health
  does not prove database connectivity. No connected-project ticket/test records
  were created during verification. No push, merge or deployment.

Evidence: [checks](docs/evidence/qr-attendance-2026-11-06/check-results.json),
[ticket desktop, redacted](docs/evidence/qr-attendance-2026-11-06/ticket-desktop-masked.png),
[ticket mobile, redacted](docs/evidence/qr-attendance-2026-11-06/ticket-mobile-masked.png),
[confirmed attendance](docs/evidence/qr-attendance-2026-11-06/check-in-confirmed.png),
[roster](docs/evidence/qr-attendance-2026-11-06/attendance-roster.png).

## Date/time UX follow-up — 2026-11-05

- User requested a small date/time form refinement and asked for an opinion on
  QR registration/check-in. Implemented the UX change only: visible calendar and
  clock opener buttons, native input/typing support, grouped date/time fields,
  clear hints, campus timezone label and selected-schedule preview with a written
  month and 24-hour value. No new scheduling restrictions or backend schema/API
  changes. Existing campus-wall-time conversion remains authoritative.
- Build passed; two isolated browser scenarios passed, covering calendar opener,
  preview, New York-device → campus-time UTC persistence, reopen/edit, publishing,
  registration/cancellation and Organizer/Admin protections. No real AI credits
  or connected-project seed was used. Frontend changes are available via Vite.
- At this stage QR was a proposal (implemented in the 2026-11-06 follow-up above): active-registration ticket →
  event-owner scan/name confirmation → idempotent check-in; cancelled tickets
  invalidated, wrong-event tickets denied, manual roster/ticket-code fallback.
  Attendance should be separate from ACTIVE/CANCELLED registration status. No
  scanner, ticket issuance, attendance records or new API permissions were added.
- No push, merge or deployment.

Evidence: [checks](docs/evidence/schedule-ux-2026-11-05/check-results.json),
[date/time form](docs/evidence/schedule-ux-2026-11-05/date-time-form.png).

## AI/ML API event drafts and visible loading — 2026-11-05

**Live provider setup verified:** after the user added the private key and said
ready, one explicitly authorized manual synthetic request through the actual
draft service returned source AI and provider HTTP 200. The validated result
included title, description and agenda; duration 7,113ms, usage 981 tokens (139
input / 842 output). No events or profiles were changed. The local API was
restarted with the key and partner integrations disabled. Automated tests still
use only injected responses/emulator fallback. The user's real-browser workflow
remains an interactive check, separate from this successful provider completion.
Sanitized evidence: [manual live check](docs/evidence/ai-loading-2026-11-05/manual-live-provider-check.json).

- The user confirmed AI/ML API (aimlapi.com) and requested prominent loading
  feedback across the app. Implemented Organizer workspace → Create activity →
  Draft with AI, with a brief form, preparation state, source-labeled preview and
  explicit Use this draft. Only title/description/type are applied; date/time and
  location remain manual, and save/publish is separate. No Organizer approval or
  role changes are delegated to AI.
- Added protected POST `/api/me/activity-draft`. The server uses the configurable
  AIML model (default `google/gemini-2.5-flash`) through its documented chat API.
  Credentials stay server-only. Inputs/output are bounded, response JSON is
  validated, calls have a 12s timeout and one attempt, and per-UID in-flight and
  five-attempt/minute guards apply. No activity/profile is created by generation.
- Missing configuration, provider errors/timeouts and invalid/truncated outputs
  return the deterministic template with an honest TEMPLATE source. Automated
  emulators cannot call AI even if credentials are inherited; unit provider
  success/failure checks use injected fetch responses. No real AI credits or
  connected-project seeds were used for automated verification.
- Added branded full-page session/sign-out loading, card/list/form/profile
  skeletons, indeterminate progress, prominent operation notices and busy buttons.
  Covered onboarding, own request/status, review decisions, profile saves,
  activity save/publish/close/delete, registration/cancellation, AI generation,
  route data, refresh and pagination. Refresh keeps already-loaded records;
  initial loads no longer briefly show empty registration/roster results.
  Busy dialogs prevent duplicate actions/dismissal; motion honors reduced-motion
  preferences. Progress follows real promises with no artificial UI delays or
  fabricated percentages.
- Validation: build passed; **37 backend checks passed** (22 API scenarios,
  9 AI-service checks and 6 existing helpers). The 8 existing browser scenarios
  passed, as did the new template/apply/publish scenario. The delayed-loading
  test initially held only one of React development's duplicate reads; corrected
  that test gate, then **both new browser scenarios passed** on targeted rerun.
  Ten distinct browser scenarios are therefore verified; no unresolved test
  failure remains. Loading/preview screenshots were inspected at desktop/mobile.
- Restarted the local API on port 3000 with partner integrations disabled. The
  private AIML key was not configured during those automated checks; this was
  subsequently resolved and manually verified as recorded above.
  No push, merge, hosted deployment, cloud index change or real profile migration.

Setup/limits: [AI_DRAFT_ASSISTANT.md](docs/AI_DRAFT_ASSISTANT.md).
Evidence: [check results](docs/evidence/ai-loading-2026-11-05/check-results.json),
[session loading](docs/evidence/ai-loading-2026-11-05/session-loading.png),
[AI preparation](docs/evidence/ai-loading-2026-11-05/ai-draft-loading.png),
[template preview](docs/evidence/ai-loading-2026-11-05/ai-template-preview.png).

## Shared UI refinement — 2026-11-05

- Applied the project design-foundation skill to the existing React UI. Shared
  buttons, inputs/selects, focus/disabled states, status badges, cards and page
  headings now use consistent sizing, borders, color and spacing. Destructive
  actions use quiet red list actions and red confirmations.
- Replaced oversized workspace CTAs and mixed filter treatments with one
  accessible segmented-control component. The compact workspace bar retains
  both Student/Organizer capabilities. Already-approved Organizers no longer
  have a redundant application link in Student navigation.
- Aligned the shell, navigation, content and footer on a shared 72rem container.
  Tablet navigation collapses before links become crowded. The profile has a
  saved-name/avatar summary, grouped actions and side-by-side identity details
  on desktop; it stacks on mobile. Refresh controls and detail cards were tidied.
- Event-card actions align at the bottom across wrapped titles. Removed the
  disconnected prototype Load more activities button; the paged API remains the
  sole source for actual pagination. Real loaded counts remain visible.
- Build passed. Full isolated browser regression: **8 passed, 0 failed**. After
  the final detail/refresh styling changes, two targeted cross-role/onboarding
  scenarios and two targeted form/profile scenarios also passed. Profile layout
  overflow was checked for all roles at 360, 768, 1024 and 1440px. Desktop/mobile
  profile, discovery, Organizer list/form and Admin overview screenshots were
  inspected. This is not a full WCAG or cross-browser certification.
- No backend access-policy change, real-project seed, new dependency, code push,
  merge or hosted deployment was made for this refinement. The user subsequently
  asked to discuss an AI-assisted flow first; no AI integration had been made at
  that point. The later AI/loading implementation is recorded above.

Design reference: [UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md).
Evidence: [check results](docs/evidence/ui-refinement-2026-11-05/check-results.json),
[profile desktop](docs/evidence/ui-refinement-2026-11-05/profile-desktop.png),
[profile mobile](docs/evidence/ui-refinement-2026-11-05/profile-mobile.png).

## My profile and editable usernames — 2026-11-05

- Added My profile to Student, Organizer and Admin desktop/mobile navigation.
  Each user can save or reset their own username, treated as a non-unique
  Campus Pulse display name. Google email, university ID and access are shown
  as read-only account details. Loading/error states, field validation, busy
  controls and authoritative success feedback are included.
- `PATCH /api/me/profile` accepts only `{name}` (trimmed 1–80 characters, no
  embedded controls). A transaction updates only the bearer user's name and
  updatedAt after rechecking profile existence/enabled status. UID, Google
  email, enrollment, roles and capabilities cannot be changed through this API.
  Admin has only this bounded self-profile exception; event oversight remains
  read-only. Campus display names are used in refreshed activity and participant
  lists; Google Auth names and Organizer-request identity snapshots are intact.
- Build passed. **27 backend checks passed** (21 API scenarios + 6 helpers),
  including own-profile edits for all roles and personal-email Organizer/Admin,
  unknown-field/privilege/other-user tampering, invalid names, disabled and
  unprovisioned callers, and updated event/roster projections.
- **8 browser scenarios passed**, including save, failed-save input retention,
  reset, reload and fresh-sign-in persistence for all three roles. Mobile
  navigation and the 360px profile screenshot were checked. Tests use isolated
  emulators only; no real user's display name was modified for testing.
- Restarted the local API on port 3000 with partner integrations disabled.
  Refresh the app and open My profile to test interactively. No push, merge,
  hosted deployment, new index or connected-project profile migration was done.

Evidence: [regression results](docs/evidence/profile-2026-11-05/check-results.json),
[Admin profile at 360px](docs/evidence/profile-2026-11-05/admin-profile-mobile.png).

## Student and Organizer access together — 2026-11-05

The user reported losing Student access after their Organizer request was
approved. This explicitly supersedes the earlier exclusive-role limitation.

- `/api/me` and profile-setup responses now include server-derived
  `capabilities: {student, organizer}`. Primary role values and approval
  transactions remain compatible; Student enrollment/registration data is kept.
- An approved MFU Organizer with their valid preserved university ID keeps
  Student registration create/list/cancel and viewer-registration state, while
  gaining existing Organizer tools. Already-approved enrolled profiles recover
  access without migration, reapproval or manual role rollback. Organizer
  ownership, atomic registration rules, Google verification and disabled-account
  checks are preserved. Personal Organizers and school Organizers without
  completed enrollment do not gain Student powers; Admin remains separate.
- The responsive Student / Organizer workspace buttons expose both interfaces.
  Routes/reloads preserve Organizer workspace where appropriate; Student
  discovery/registration screens remain available. Refreshing an approved
  request can open Organizer workspace without removing Student access.
- Validation: build passed; **26 backend checks passed** (20 API scenarios,
  6 helpers), and **7 browser scenarios passed**, including new full approval →
  preserved registration/cancellation → workspace switch → publish → switch
  back, reload and 360px layout checks. No real data was seeded for these tests.
- Restarted the verified local development API on port 3000 with partner
  integrations disabled. No code was pushed, merged or deployed; this fix does
  not rewrite connected-project profiles. Real-user interactive retesting of
  the new switch remains with the user.

Evidence: [regression results](docs/evidence/dual-access-2026-11-05/check-results.json),
[Student and Organizer switch at 360px](docs/evidence/dual-access-2026-11-05/student-organizer-mobile.png).

## Local login connectivity — 2026-11-05

**Full application index audit after Organizer list error:** compared all seven
checked-in index definitions with cloud state and executed their representative
read-only query shapes using identifier filters that match no real account.
Activities `status/dateTime`, registrations `studentId/status/registeredAt`, and
Organizer requests `status/createdAt` were READY and passed. Four definitions
were missing and returned code 9: activities `organizerId/dateTime` and
`organizerId/status/dateTime`; registrations `studentId/registeredAt` and
`activityId/registeredAt`. Retrieved Firebase's exact create-index links for the
user. No records or index settings were changed by this audit. The Admin request
index is now verified ready; Organizer list/roster and unfiltered Student history
still require their missing indexes. See `docs/LOCAL_DEVELOPMENT.md` for fields.

**Organizer request list blocked by missing cloud index:** after the user's
interactive Admin sign-in, reproduced Firestore code 9 and confirmed the exact
query reports a missing index. The required COLLECTION index is already defined
in `backend/firestore.indexes.json`: `organizerRequests` / `status ASC` /
`createdAt ASC` (implicit document-name ordering). Cloud index inspection found
other indexes on this collection but no matching one. Attempted to create only
this additive index; Firebase returned HTTP 403 PERMISSION_DENIED, so no index
was created. Retrieved Firestore's exact Console create-index link for the user
to apply with their project account. No existing indexes or data were removed;
application code was not pushed/deployed. End-to-end list verification must wait
until that index is READY. The local service credential works for data access
but lacks index-management permission.

The user subsequently created the correct index in Firebase Console. A read-only
cloud check confirmed its state was CREATING; Pending/Approved/Rejected list
queries still reported code 9 during subsequent checks while it built. No
additional index creation or app restart was attempted. Refresh the Admin list
once Firebase reports the index enabled; successful real list queries remain
unverified until the build completes.

**Manual Admin setup completed:** after the user explicitly nominated their
Google email, the trusted operator tool verified the existing enabled, verified,
Google-linked identity, previewed its appointment, applied ADMIN and confirmed
the saved role with a separate read-only check. The new campus profile and
trusted-assignment audit were written to the real Firebase project as requested.
No password account was created; no other users were appointed. Actual Admin
dashboard use still requires the user's interactive sign-in. No push/deployment.

**Credential blocker resolved:** the user added the project service-account file
locally. Corrected the ignored backend credential path, restricted the key's
file permissions and started the local API on port 3000 with partner integrations
disabled. Read-only Firebase Auth and Firestore checks passed, as did versioned
health, exact-origin CORS preflight, and the running frontend's localhost API
target. No real accounts, profiles, roles, events or remote settings were changed
by these checks. The user's interactive sign-in/approval walkthrough is still
pending. The key and private environment files remain ignored by Git. No push,
merge or deployment occurred.

Initial diagnosis and setup before the key was supplied:

- User reported Account access network errors for Student and Organizer Google
  accounts. Rechecked the existing Render backend: `/health` 200 with no version
  marker, but localhost `OPTIONS /api/me` 401 without CORS headers. The browser
  cannot reach its protected API; this is independent of the applicant's role.
- No local API was listening on port 3000. The configured server credential path
  was missing; no conventional local ADC credential or project-key filename in
  the immediate Downloads/Desktop/Documents directories was found.
- Private `.env.local` now targets `http://localhost:3000`. Added a local-only
  `npm run dev:api` launcher that validates project/credential setup, disables
  partner integration and emulator configuration, and allows localhost:5173.
  Production startup and partner-worker behavior are unchanged.
- Asked for the local credential path only, never its contents. Real-user API
  verification was blocked until the project's server credential was supplied.
  No real roles/data were changed. User explicitly requested local testing first:
  **do not push, merge or deploy**.
- Validation: frontend build passed; 6 existing helper checks passed (emulator
  API suite skipped in that command). Local startup refused missing, malformed
  and wrong-project credential files without exposing contents. An isolated
  updated-app preflight returned 204 with the exact localhost origin, without
  accessing Auth or Firestore. This does not establish real-project connectivity.

## Release publication state

The implementation is committed locally as `baaeac7` on
`implementation/campus-pulse-full-stack`, with Codex attribution and explicit
credit that the original prototype came from the user. Private configuration and
the user-uploaded skills pack were not included.

Automatic approval review rejected the attempted public GitHub push because the
user had not explicitly authorized exporting the complete implementation to
`https://github.com/kyaw-hmue-San/pd_project_events_clubs`. The rejected command
never executed: no push, PR, merge or production deployment occurred. There is no
PR URL to report. See [the concrete release review](docs/deployment/release-review.md) for
payload, verification, exclusions and outstanding live setup. Local-only cleanup
and documentation remain permitted; no alternate publication route is being used.

## Current release — Organizer requests and Admin review

Confirmed by the user: implement Request Organizer access, one Admin Approve /
Reject screen, and keep Admin appointment manual. Student accounts remain only
@lamduan.mfu.ac.th. This supersedes the broader Owner/Super Admin/general-member
approval proposals discussed earlier.

Implemented and locally verified:

- Verified Google identities can submit one pending Organizer request and read
  only their own status. Personal-email applicants have no campus-data access
  before approval. Students retain Student access while pending.
- Admin has paginated Pending/Approved/Rejected request views, confirmation and
  rejection-reason controls. Review is the only new bounded Admin write API;
  campus events remain read-only for Admin.
- Approval atomically saves the decision, grants ORGANIZER, and preserves existing
  identity/registration data. New non-Student Organizers use no fabricated student
  ID. Rejection shows its reason and permits a versioned resubmission.
- Duplicate submission/review, concurrent decisions, stale requests, self-review,
  wrong roles, changed Google identities and disabled access are checked.
- `npm run admin:appoint -- --email ...` performs a trusted dry run; `--apply`
  explicitly appoints an existing verified Google identity. It does not create
  Google accounts/passwords or expose an Admin signup route. No real Admin was
  nominated or appointed at that stage; see the 2026-11-05 setup above.
- **Build passed. 24 backend checks passed (18 API scenarios + 6 helpers).
  6 browser scenarios passed**, covering the entire reject/resubmit/approve/
  publish flow, persisted refresh, Google popup, Student enrollment, role access,
  mobile layouts, and baseline activity/registration workflows.

Evidence: [check results](docs/evidence/organizer-access-2026-11-04/check-results.json),
[Admin request screen](docs/evidence/organizer-access-2026-11-04/admin-requests.png).
Current workflow and manual setup: [ACCESS_WORKFLOW.md](docs/ACCESS_WORKFLOW.md).

Live deployment still needs the updated API, required Firestore indexes and exact
frontend origins. GitHub access is available; Render was found as an uninstalled
integration and has not been confirmed connected. The local server credential
file was unavailable at that stage; this was resolved on 2026-11-05. The later
user-authorized Admin appointment is recorded above. The public feature-branch push was blocked by automatic approval review;
see the release publication state above. Historical verification counts and proposals follow for traceability.

## Latest update — school Google sign-in

Latest discussion: the Google chooser now has no school-domain hint and requests
the normal account selection prompt. Admission for outside Google accounts and
school-Admin approval of Organizer requests is under design discussion. No
approval endpoints, privileged role changes or broader server admission have
been implemented. Current server restrictions remain until that policy is settled.

Popup correction: an obsolete demo process was still serving port 5173 and
overriding `.env.local`. It was stopped and replaced with the real development
server at localhost:5173. Served configuration confirms the real project and
emulator mode false. Normal Vite startup now refuses emulator configuration;
the isolated browser harness explicitly selects test mode. Build and the startup
guard were checked after this correction. The live backend/CORS blocker below
is separate and remains unresolved.
The real-configured button was verified to open accounts.google.com without
entering credentials. The targeted isolated Google-only/profile browser
regression passed with the new explicit test mode.

The user confirmed **Google only** and **@lamduan.mfu.ac.th**. The normal app now
uses real Firebase configuration with emulator mode off; manual demo commands
and demo credentials were removed from the user setup path.

- Google popup plus blocked-popup redirect fallback; password UI removed.
- Server verifies provider, verified email, exact school domain and token
  revocation even for existing profiles. Personal accounts/lookalike domains,
  unverified users and password tokens are denied.
- First-time school users complete university ID once. Atomic onboarding creates
  STUDENT only, preserves ID uniqueness and existing roles, and is safe to repeat.
- Real public web config supplied by the user is in ignored `.env.local`.
  Configured API is `https://pd-project-events-clubs.onrender.com`.
- Automated Google-policy/API checks: **20 passed, 0 failed**. Google-popup and
  three-role browser scenarios: **4 passed**, including onboarding/reload,
  personal account denial, sign-out, persistence, keyboard and responsive checks.
- Public real-project OAuth initiation: HTTP 200, valid Google authorization URI.
  Public authorized-domain check: localhost and the two project hosting domains.
  No actual Google user was signed in or created by these public setup checks.
- Live API `/health`: 200. Browser preflight: **401 with no CORS headers**.
  **Real-account end-to-end use is not ready until updated backend deployment
  and CORS configuration are applied.**
- CLI project inspection failed because it is not authenticated. Read-only SDK
  inspection failed because the configured local credential file was missing.
  The computer-use tool did not approve Chrome access. No live configuration,
  role assignments, account merges or production business records were changed.

See [real-account setup](docs/GOOGLE_SIGN_IN.md) and
[local development](docs/LOCAL_DEVELOPMENT.md). The first implementation evidence
below records the pre-Google baseline; current auth behavior supersedes it.

## Implemented source

| Slice | Implementation | Verification |
| --- | --- | --- |
| Backend modules | `backend/src/app.js`, `server.js`, middleware, shared helpers, and activity/registration/user/integration/Admin features. Old `.mjs` entrypoints retained. Worker starts once in the persistent server and stops on shutdown. | All 13 original emulator/helper checks passed before and after pure extraction. Integration service source matches its original implementation. App imports without a project environment or listener. |
| Organizer API | Caller-owned activities, optional status, stable cursor paging, trusted organizer display name. | Owner filtering, foreign cursor and wrong-role denial, page size and next page checks. |
| Student API | Active-only default retained; explicit cancelled/all-history queries and cursor paging. Safe activity enrichment and caller-only active registration ID on details. | Cancellation, repeat cancellation, re-registration, history isolation and caller-specific projection. |
| Read-only Admin | Server-provisioned ADMIN role; protected global aggregate summary, all-event list/details with a strict field allowlist. No Student/Organizer inheritance. | Cross-role denial, Admin mutation/roster/history/diagnostic denial, true global counts, draft visibility and extra-field redaction. |
| Validation/errors | Compatible error codes plus safe messages and field errors; invalid calendar dates rejected. | Invalid fields, malformed JSON, invalid dates, unverified/unprovisioned accounts, and attempted client role assignment. |
| Frontend setup/auth | Root Vite/React/Tailwind project, TypeScript build, Firebase email/password session, server-derived role, bearer-token API client. Original fixtures are not imported by the running application. | Production compilation/build and real browser sign-in through the Auth emulator and `/api/me`. |
| Student UI | Paginated activity browsing, details, register, refresh persistence, active/cancelled history, confirmation and cancel. | Browser register/reload/cancel/reload/re-register flow; closed registration disabled; network failure and retry. |
| Organizer UI | Paginated own list, complete create/edit form, save draft, publish, close, delete unused draft, paginated roster and refresh. | Form fields survive reopening; direct form publishing, published edit, close, deletion, matching event IDs/counts across roles. |
| Admin UI | Accurate global cards, paginated all-status event list, read-only event details. | Browser draft visibility, counts, no mutation controls or participant email, foreign-role route fallback. |
| Accessibility/layout | Associated field labels/descriptions, live status/error feedback, skip link, keyboard dialog focus/trapping/Escape/restore, mobile navigation. | Browser checks at 360, 768 and 1440px for the Organizer view, 360px Student flow, 1440px Admin flow; modal keyboard checks. Broader accessibility audit remains release work. |
| Retired manual demo (historical) | Guarded `demo-campus-pulse` seed, three emulator-only identities, sample activities, API + Vite launcher, graceful test teardown. | Browser suite launches and stops the isolated environment; no connected-project writes or external partner requests. |

## Checks and evidence

- `npm run build`: TypeScript and Vite production build passed.
- `npm test`: 6 helper checks passed; API suite correctly skipped without emulators.
- `PATH=/opt/homebrew/opt/openjdk/bin:$PATH npm run test:emulator --prefix backend`:
  **18 passed, 0 failed** (12 API scenarios plus 6 helper checks).
- `npm run test:e2e`: **3 browser scenarios passed** against real local Auth,
  HTTP API, and Firestore emulators. The main scenario uses distinct Organizer,
  Student, and Admin browser sessions. It includes persistence after reload;
  the final timezone check uses a New York Organizer device and UTC Student
  device while entering/displaying campus time.
- Backend JavaScript syntax checks and side-effect-free app import passed.
- `git diff --check`: run before handoff; no generated logs or credentials included.
- Frontend production dependency audit: **0 findings** after a compatible
  `@grpc/grpc-js` override. That transport comes from unused Firestore modules in
  the Firebase meta-package; the application only imports Web Auth/App.
- Backend production audit: **8 existing moderate findings**, all in the existing
  Firebase Admin dependency chain. Audit's proposed complete fix requires
  `firebase-admin@14.5.0`, a major upgrade from the existing 13.x baseline. That
  separate SDK migration was not bundled into these application changes.

Genuine local screenshots (sample data only):

- [Admin at 1440px](docs/evidence/campus-pulse-local-2026-11-04/admin-overview.png)
- [Student details at 360px](docs/evidence/campus-pulse-local-2026-11-04/student-mobile.png)

The suite and screenshots demonstrate local behavior, not production readiness,
performance targets, actual student usability results, or lecturer approval.

## Contract and decision changes

- Updated `docs/API_CONTRACT.md`, `docs/implementation-decisions.md`, query indexes,
  environment examples, backend deployment notes, and the root README.
- Added `docs/LOCAL_DEVELOPMENT.md`, project-level AGENTS guidance, and guarded
  emulator demo setup. The initial handoff review is explicitly marked historical.
- Anonymous published-only browsing (D03) remains unresolved. Existing authenticated
  published/closed browsing was preserved. No public data route was opened.
- Firebase vs the original Supabase/Vercel PRD and the post-PRD Admin extension
  remain recorded decisions requiring lecturer confirmation for final compliance.
- Capacity and end times were excluded in this original MVP baseline and are
  now implemented as optional fields in the 2026-11-06 follow-up. Arbitrary event
  categories, general media uploads, payments and notifications remain outside
  this scope; bounded profile names and QR attendance are described above.
- Campus timezone defaults to Asia/Bangkok and is configurable; university
  confirmation remains required before release.

## Remaining release work

1. Public Firebase web configuration is now supplied. Deploy the updated backend
   and Firestore indexes, configure exact frontend CORS origins, then verify a
   real school Google account interactively. No demo seed is required.
2. Resolve lecturer stack/Admin/public-browsing decisions and confirm campus timezone.
3. Review the existing Firebase Admin dependency upgrade independently, then run
   its regression checks before release.
4. Verify production HTTPS login, role access, CRUD, indexes, CORS, host behavior,
   and any explicitly approved Team 10 recovery demonstration. Recheck current
   hosting cost/free-tier terms before publishing.
5. Complete the broader accessibility, supported-browser, usability participant,
   performance/load and lecturer-demo evidence gates from the skills pack.

## Authorship and Git state

The initial prototype and skills/specification pack were supplied by the user.
The implementation, integration fixes, tests and documentation above were made
in this Codex session. No teammate contributions, reviews or approvals are
invented. The later implementation commit is identified above. No public push, PR,
production deployment or production seed was performed; publication is pending
explicit authorization. The
original user uploads are preserved. `backend/firestore-debug.log` remains
local and is now ignored rather than staged or deleted.
