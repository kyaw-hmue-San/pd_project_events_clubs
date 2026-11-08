# Deployment preparation

Current user-selected setup: [Firebase Hosting + existing Render service](firebase-render.md).
Prepared Firebase Hosting configuration publishes only frontend/dist. Render
uses the full `main` branch; lowercase master is an empty skeleton. Deployment
results are recorded in root PROGRESS.md after verification.

Hosting released on 2026-11-08. Live static assets, API version/CORS/denials and
user-confirmed school Google sign-in are recorded in
[release evidence](../evidence/hosted-release-2026-11-08/check-results.json).
Broader production acceptance and lecturer stack approval are not implied.
Keep the Firebase/Express deviation from the original PRD explicit.

## Static frontend

1. Build directory: repository root. Install: `npm ci`.
2. Set [production frontend values](../../config/env/frontend.production.env.example)
   on the build host, including the real HTTPS API origin. For deliberate local
   deployment builds, use `frontend/.env.production.local` instead.
3. Build: `npm run build:production`. Publish: `frontend/dist/`. The check rejects
   localhost/placeholder/test-tunnel API origins and emulator settings.
4. Configure the actual frontend domain in Firebase Google authorized domains
   and the API's exact CORS allowlist; verify real Google sign-in.

Browser values are embedded during build, so rebuild after changing them. The
app currently uses hash routes and a root-path manifest; retain root deployment
unless deliberately updating those assumptions. `npm run preview` is for local
preview, not production serving. See official [Vite environments](https://vite.dev/guide/env-and-mode)
and [static deployment](https://vite.dev/guide/static-deploy).

## Persistent backend

Keep Express and its outbox worker on a persistent Node host, not a serverless
route. No worker architecture change is part of this cleanup.

| Setting | Existing value |
|---|---|
| Service directory | `backend/` |
| Node | Match repository engines; 22.12+ for the complete app |
| Install | `npm ci` in `backend/` |
| Start | `npm start` in `backend/` |
| Listener | `0.0.0.0`, host-provided `PORT` |
| Health | `GET /health` |

Configure [production API values](../../config/env/backend.production.env.example)
on that host. Mount the Admin credential as a secret file and set its host path,
not the developer Mac path. `npm start` does not load local `.env`. Keep exact
HTTPS frontend origins, Student domain `lamduan.mfu.ac.th` and denied browser
Firestore access. No Admin/AI/partner secret belongs in `VITE_` variables.

With intended host variables, run `npm run check:env:api:production` from the
checkout. It reads host variables only and checks their shape, without starting
servers, loading local secrets or contacting Firebase/partners. Actual startup
and credential/network validation still belong to the existing server.

Facilities sending needs explicit enabled flag, confirmed HTTPS creation URL,
agreed dedicated key, HMAC mode and secret. Do not copy temporary ngrok URLs to
production by default. The user approved the exact old Team 10 tunnel for the
coordinated demo; TEAM10_APPROVED_TEST_URL records that narrow exception. Do not
relink local-test orders; use another activity for new hosted
tests. AI admission needs the explicit confirmed policy/version; uncertain or
unavailable assessments remain for Admin. Internship and Library contracts are
implemented; Notification Hub remains pending.

## Verify before sharing

Check assets/favicon/manifest, API health, CORS, real Google sign-in, role and
ownership denials, query indexes and a complete agreed user journey. Health alone
does not prove Firebase or partner readiness. Automated writes stay in demo
emulators; do not seed the connected project or send live requests in checks.
Verify real HTTPS callbacks and partner responses separately.

The [release review](release-review.md) retains its original context. Host limits,
pricing, stack approval and actual production results remain release decisions.
No automatic deployment or Git workflow was added.
