# Firebase Hosting + Render

User-selected hosting setup, 2026-11-08. Use `main` for the complete application.
Lowercase `master` is the folder skeleton and cannot run the application.
Git publication remains with the user; these commands do not commit or push.

Released: frontend and updated API are live at the URLs below. Basic live checks
passed and the user confirmed school Google login opens their workspace. See
[sanitized release evidence](../evidence/hosted-release-2026-11-08/check-results.json).
The remaining instructions document reproduction and future updates.

## Backend: existing Render service

Existing API: `https://pd-project-events-clubs.onrender.com`.
Update that service; do not create a duplicate or change its billing plan.

| Setting | Value |
|---|---|
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Node version | `NODE_VERSION=22` |

Import the privately prepared `backend/.env.render` in Environment. It contains
server credentials and must not be committed, pasted into chat or copied to the
frontend. Local `backend/.env` is preserved separately. Let Render supply PORT.
Remove any old emulator-host settings if present.

In Secret Files, use filename `firebase-service-account.json` and the contents
of the newly validated local `backend/service-account.local.json`.
`GOOGLE_APPLICATION_CREDENTIALS` points to
`/etc/secrets/firebase-service-account.json`. The old revoked key must not be
reused on Render. Never commit this JSON or send it in a team message.

The prepared environment retains AI planning/admission, Internship, Library and
signed incoming Maintenance updates. It disables legacy outbound publication
and polling rather than activating old partner URLs on startup. CORS permits
only the actual Firebase Hosting domains. Select Manual Deploy → latest commit.
Verify `/health` returns both status ok and
`apiVersion: 2026-11-04-organizer-access`; the old API returned status only.

Render Free can sleep after 15 minutes without inbound traffic, pausing the
in-process worker until a request wakes the service. This is a presentation
limitation; no always-on or paid plan is enabled automatically. See
[Render's limits](https://render.com/docs/free).

## Maintenance connection

Team 10 supplied their permanent backend on 2026-11-09. Configure Render's
`TEAM10_WORK_ORDER_API_URL` as
`https://maintenance-team10.vercel.app/api/partner/work-orders` (note the hyphen).
Remove `TEAM10_APPROVED_TEST_URL`; a tunnel exception is no longer needed.
Keep the agreed partner key and webhook secret unchanged. Save the environment
and let Render restart the service. Local `backend/.env` and the private Render
import file have been updated; these files do not change Render automatically.

A separate manual, authenticated GET of `/api/partner/health` returned200.
GET `/api/partner/work-orders` returned400 `MISSING_QUERY_PARAM`, confirming
the route responds but not proving the agreed POST creation contract. No order
was created during these checks. Verify the next explicit reviewed facilities
submission and subsequent signed lifecycle updates with Team 10.
Their permanent webhook callback remains:
`https://pd-project-events-clubs.onrender.com/webhooks/partner`.
Do not relink existing work orders, generate keys or submit test requests without
an explicit reviewed activity action. No partner message has been sent.

## Frontend: existing Firebase Hosting site

Target site: `events-management-4d8ce`.
Frontend: `https://events-management-4d8ce.web.app`.
Both this host and its firebaseapp.com alias are already authorized for Google
sign-in. No new domain/permission was added during preparation.

Private `frontend/.env.production.local` uses the existing public Firebase web
configuration and permanent Render API URL. `frontend/.env.local` retains
localhost development. Build and validate offline:

```sh
npm run build:production
npm run check:hosting
```

Once the backend is updated and verified:

```sh
./backend/node_modules/.bin/firebase login
npm run deploy:frontend
```

`firebase.hosting.json` publishes only `frontend/dist`, not the repository,
backend, credentials, private handovers or original assets directory. Its
predeploy steps rebuild/validate production settings and reject private files
or configured server keys in the output. Index/manifest use fresh-cache headers;
hashed assets use immutable cache headers. The CLI deploy is Hosting-only: it
does not deploy Firestore rules/indexes or seed/modify records. Use the project's
owner account through a separately authorized Firebase CLI login. The deploy
command does not load backend secrets into the CLI/build environment. The local
server credential can read Hosting, but the CLI's service-usage permission check
returned403; no IAM roles were broadened to work around that denial.

## Acceptance

Check live HTML/assets/favicon/manifest, exact-origin CORS, unauthenticated
denials and the API version. A real school Google account must complete the
hosted login/Student journey; owning Organizer/Admin checks remain separate.
Do not claim real-user acceptance from health or emulator tests alone.

Preparation verified existing Hosting access and all seven required Firestore
indexes READY. Current deployment status and actual test counts belong in root
PROGRESS.md; this guide is not itself proof that either release completed.
