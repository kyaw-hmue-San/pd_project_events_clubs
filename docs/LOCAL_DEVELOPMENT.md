# Run Campus Events & Clubs with real accounts

Start with the [environment guide](../config/env/README.md) for separate local
and deployment templates, and the [deployment guide](deployment/README.md) when
hosting. `npm run check:env` checks the effective local configuration offline.
Existing private files need no move or overwrite. Dated observations below are
historical evidence, not a claim that each older issue remains unresolved.

Normal sign-in is **Google only**. Students require @lamduan.mfu.ac.th;
other verified Google accounts can submit Organizer requests. Qualifying requests
may receive approval under the confirmed AI policy; other requests await Admin.
Admin appointment remains manual. No demo account or password sign-up
is needed. See [the current workflow](ACCESS_WORKFLOW.md). See [Google sign-in setup](GOOGLE_SIGN_IN.md).

## Frontend

```sh
npm ci
npm run dev
```

Open **http://localhost:5173** (localhost is authorized in the real Firebase
project; 127.0.0.1 currently is not). The ignored `frontend/.env.local` contains the
public Firebase web configuration supplied by the user for
`events-management-4d8ce`, with emulator mode off and the local API URL
`http://localhost:3000`. Run the backend below in a separate terminal.
No service-account or Google OAuth secret belongs in this file.

For a fresh checkout, copy `frontend/.env.example` to `frontend/.env.local` and supply the Firebase
web configuration. Set `VITE_API_BASE_URL` to the updated API environment you
intend to use. Restart Vite after changing environment values.

A first-time Google user completes their university ID once. The server creates
a Student profile and a unique ID claim atomically. Returning users go straight
to their existing role. Organizer/Admin are assigned through trusted operations,
not through onboarding or a role selector.

## Backend

Keep the Express process on its existing persistent host. Deploy the updated
`backend/` source and query indexes. Configure:

```dotenv
SCHOOL_EMAIL_DOMAIN=lamduan.mfu.ac.th
FRONTEND_ORIGINS=http://localhost:5173,https://your-actual-frontend.example
```

Use the actual frontend origin, not the example placeholder. Existing Firebase
Admin credentials remain server-only. Keep direct client Firestore reads/writes
denied. No production seeding is needed for Google login or first-time onboarding.

To run the backend locally, configure `backend/.env` with the correct
project and an existing authorized service-account credential path. Alternatively,
place that project's service-account JSON at `backend/service-account.local.json`
(ignored by Git). Do not put the key in frontend configuration or chat. Then use:

```sh
npm ci --prefix backend
npm run dev:api
```

The local launcher checks that frontend/backend projects match, uses port 3000
and allows exactly `http://localhost:5173`. It disables partner configuration and
emulator routing for this real-account development process. Production
`npm start --prefix backend` is unchanged and still runs the persistent worker
with its host configuration.

For the user-authorized inbound maintenance/webhook test, stop the normal API
process and use `npm run dev:api:maintenance`. It requires the existing agreed
WEBHOOK_INBOUND_SECRET in private backend/.env and enables receiving authenticated
webhooks only. Outbound delivery/polling, partner provider access and integration
diagnostics remain disabled. No public tunnel is opened by this command. Keep
the frontend at localhost:5173; separately expose API port 3000 and share the
HTTPS `/webhooks/partner` callback with Team 10. See
[maintenance testing](MAINTENANCE_CONNECTION.md). Normal `npm run dev:api` remains
fully integration-disabled.

On 2026-11-05 the user supplied `backend/service-account.local.json`. Its project
was checked, file permissions restricted, and the ignored `backend/.env`
credential path corrected. The local API started successfully; read-only Firebase
Auth and Firestore checks passed. The running frontend targets localhost:3000,
and the local API's health/version and browser CORS preflight passed. Refresh
Account access and retry to verify the actual signed-in user workflow. No demo
seeding is needed; no live roles or profiles were changed during these checks.

### Account access says it cannot reach the API

On 2026-11-05 the old Render API returned `/health` 200 but rejected a browser
preflight to `/api/me` with 401 and no CORS headers. This affects Student and
Organizer accounts equally; changing the Google account cannot fix it. The
frontend now targets the updated local API instead. That API must be running
with valid server-only credentials before real profiles or Organizer requests
can load. A successful Google popup alone does not establish API availability.

### Admin Organizer requests returns API failure 9

The exact list query was checked against real Firestore on 2026-11-05 and
requires the checked-in `organizerRequests` collection index with `status ASC`
and `createdAt ASC`. Existing indexes on other field combinations do not satisfy
it. The supplied local service credential cannot create indexes (HTTP 403), so
an authorized project operator must create this index in Firebase Console and
wait for READY before refreshing requests. Keep existing indexes. No broader
service-account role grant or code deployment is necessary for this manual step.

The user-created Organizer request index subsequently reached READY and its
query passed. A full seven-index audit then identified these remaining missing
COLLECTION indexes (all already defined in `backend/firestore.indexes.json`):

| Collection | Fields, in order | Used by |
| --- | --- | --- |
| activities | organizerId ASC, dateTime ASC | Organizer's event list |
| activities | organizerId ASC, status ASC, dateTime ASC | Organizer status filters |
| registrations | studentId ASC, registeredAt DESC | Student history including cancelled |
| registrations | activityId ASC, registeredAt DESC | Organizer's event roster |

Create these through an authorized project account in Firebase Console, keep the
existing indexes, and wait for them to become enabled. Firestore adds document
name ordering automatically. The audit read no document contents and wrote no
data; query checks remain pending for these four missing indexes.

The read-only `npm run setup:firebase` helper can retrieve a single registered web
app's public config using working backend credentials. It never overwrites an
existing `.env.local`, prints credentials, or enables providers remotely.

## Actual readiness on 2026-11-04

- User-supplied real public Firebase web config saved locally; not tracked in Git.
- A public OAuth-initiation check returned 200 with a Google authorization URI.
  No Google user was signed in or created by that check.
- Firebase's public authorized-domain list includes localhost and the project's
  firebaseapp.com/web.app domains. Use localhost for local real sign-in.
- The existing Render API health check returned 200, but a localhost browser
  preflight returned 401 without CORS headers. Updated backend deployment/CORS
  is still required. The deployed API has not been verified to include onboarding.
- Old manual demo commands have been removed. An obsolete demo launcher was
  found still running on port 5173 after the user's popup report. It was stopped
  and replaced with the real `npm run dev` server. Reload http://localhost:5173.
- Normal Vite startup rejects emulator configuration. Automated browser checks
  explicitly use `--mode test` and separate ports.

## Automated checks (developer tooling only)

Activity capacity/end/deadline/facilities fields require the updated API, so restart
`npm run dev:api` after pulling these changes. Existing records need no migration
or new composite index. Optional fields default to unlimited/no deadline/no end.
The local launcher disables partner integrations: facilities notes save normally,
but no real request is sent and the panel reports webhook reception disabled.
For explicit real facilities testing, stop the old API and run
`npm run dev:api:facilities`. This enables the reviewed owner-only Send action and
requires signed maintenance webhooks. It privately reuses the existing agreed
Team 10 key (the user confirmed it matches) or TEAM10_PARTNER_KEY; the inbound
shared secret must already be configured. Legacy publication/polling stay disabled.
Startup does not send anything. Use an unlinked published event with saved notes,
review the recipient/details, then explicitly send once. Keep the existing ngrok
tunnel pointing at port 3000 for signed completion updates. See
[MAINTENANCE_CONNECTION.md](MAINTENANCE_CONNECTION.md) for the confirmed contract,
retry states, mode comparison and trusted setup for existing work orders.
Never put server credentials in the browser.

QR tickets and attendance use the existing frontend/API startup commands; no new
service, API key, index or migration is needed. Register as a Student → View ticket.
As the event owner, open Roster → Scan tickets → verify name → Confirm check-in.
The roster also supports manual check-in. Camera scanning requires HTTPS or
localhost, with permission requested on Start camera. Uploading a downloaded QR
or entering its code is the fallback. Checked-in registrations cannot be cancelled.
Keep downloaded tickets, test traces and unmasked QR screenshots private; QR
evidence in documentation must mask both the QR and manual code.

Optional AI/ML API event drafts are configured server-side with AIML_API_KEY and
AIML_MODEL in backend/.env. See [AI_DRAFT_ASSISTANT.md](AI_DRAFT_ASSISTANT.md).
Without a key the normal activity-creation assistant returns a labeled standard
template. Restart the API after changing its private environment; no frontend
key/config change is needed. Automated checks never call the paid AI provider.

```sh
npm run build
npm test
npm run test:emulator
npm run test:e2e
```

Emulator checks require Java 21+ on PATH. On Apple Silicon Homebrew installations:

```sh
PATH=/opt/homebrew/opt/openjdk/bin:$PATH npm run test:emulator
```

Browser checks launch their own isolated Auth/Firestore test environment through
`scripts/test-stack.mjs`, then stop it. These disposable synthetic identities are
only automated regression fixtures, not accounts for normal app use. They do not
contact Google or the real Firebase project. Browser checks exercise the Firebase
emulator's Google popup, the actual HTTP API, and persisted Firestore test data.
The emulator widget's optional public CDN styling assets are blocked in these
checks so their availability cannot stall the local widget's scripts.

The dedicated ports are Auth 9199, Firestore 8180, hub 4410, logging 4510,
Firestore websocket 9160, API 3100, and test frontend 5174. The real `.env.local`
is overridden only inside that isolated test process. Install Playwright
Chromium if needed: `npx playwright install chromium`.

Traces/screenshots go to ignored `test-results/`. `npm test` alone runs helper
checks and skips API scenarios when isolated emulator endpoints are absent.

## AI planning and Organizer admission — 2026-11-06

Create activity now offers **Plan with AI** (duration, participant estimate, agenda,
checklist, facilities), with section selection and replacement acknowledgment.
Existing AIML_API_KEY/AIML_MODEL remain private; no frontend key or new index.
User-confirmed admission rubric allows any verified Google applicant, including
personal accounts, only when all required checks pass. Set both
ORGANIZER_AI_AUTO_APPROVE=true and ORGANIZER_AI_POLICY=CAMPUS_ORGANIZER_V1 in the
ignored backend environment to enable automatic approval. Missing config/provider
or uncertainty means PENDING for Admin; there is no automatic rejection. Only new
submissions/resubmissions are analyzed; startup never processes old pending rows.
Restart the currently chosen local API mode (normal/inbound/facilities), keeping
its integration boundaries. See [admission policy](ORGANIZER_AI_ADMISSION.md) and
[planning details](AI_DRAFT_ASSISTANT.md). Automated tests inject providers and
never consume real AI credits or approve real users.
