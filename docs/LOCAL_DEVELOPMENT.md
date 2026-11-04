# Run Campus Pulse with real school accounts

Normal sign-in is **Google only**. Students require @lamduan.mfu.ac.th;
other verified Google accounts can submit Organizer requests and wait for Admin
approval. Admin appointment remains manual. No demo account or password sign-up
is needed. See [the current workflow](ACCESS_WORKFLOW.md). See [Google sign-in setup](GOOGLE_SIGN_IN.md).

## Frontend

```sh
npm ci
npm run dev
```

Open **http://localhost:5173** (localhost is authorized in the real Firebase
project; 127.0.0.1 currently is not). The ignored root `.env.local` contains the
public Firebase web configuration supplied by the user for
`events-management-4d8ce`, with emulator mode off and the existing Render API URL.
No service-account or Google OAuth secret belongs in this file.

For a fresh checkout, copy `.env.example` to `.env.local` and supply the Firebase
web configuration. Set `VITE_API_BASE_URL` to the updated API environment you
intend to use. Restart Vite after changing environment values.

A first-time Google user completes their university ID once. The server creates
a Student profile and a unique ID claim atomically. Returning users go straight
to their existing role. Organizer/Admin are assigned through trusted operations,
not through onboarding or a role selector.

## Backend

Keep the Express process on its existing persistent host. Deploy the updated
`firebase/` source and query indexes. Configure:

```dotenv
SCHOOL_EMAIL_DOMAIN=lamduan.mfu.ac.th
FRONTEND_ORIGINS=http://localhost:5173,https://your-actual-frontend.example
```

Use the actual frontend origin, not the example placeholder. Existing Firebase
Admin credentials remain server-only. Keep direct client Firestore reads/writes
denied. No production seeding is needed for Google login or first-time onboarding.

To run the backend locally instead, configure `firebase/.env` with the correct
project and an existing authorized credential path, then use:

```sh
npm ci --prefix firebase
npm run dev:api
```

Point root `VITE_API_BASE_URL` at `http://localhost:3000` in that case. The checked
local backend credential path was not found in this session, so local real-project
API startup has not been verified. Never send the service-account key in chat.

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
