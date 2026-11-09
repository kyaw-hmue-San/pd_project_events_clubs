<img src="frontend/public/brand/logo-horizontal.svg" alt="Campus Events & Clubs" width="320" />

# Campus Events & Clubs

**Team 12** — A campus platform for discovering activities, managing registrations,
planning events and coordinating facilities support.

**Live app:** [Campus Events & Clubs](https://events-management-4d8ce.web.app)
· [API health](https://pd-project-events-clubs.onrender.com/health)

## Features

- Google-only sign-in with server-verified access.
- Activity discovery, registration, cancellation and personal registration history.
- Private QR tickets and Organizer-confirmed attendance check-in.
- Organizer tools for drafts, publishing, capacity, schedules and registration deadlines.
- AI Event Planning Copilot with reviewed agenda, checklist and facilities suggestions.
- Organizer access requests with optional policy-based AI approval and Admin review.
- Reviewed Maintenance requests and signed work-order status updates.
- Read-only Team 17 internships with search, filters, demo labels and detail links.
- AI-assisted Library searches on activity details, with real catalog results and manual search.
- Editable display names and responsive interfaces across all three roles.

## Access

| Role | Main capabilities |
|---|---|
| Student | Discover and join activities, manage own registrations and view own tickets. Enrollment requires a verified `@lamduan.mfu.ac.th` account and a unique university ID. |
| Organizer | Create and manage own activities, view their rosters, confirm attendance and request facilities support. Enrolled Students retain Student access after approval. |
| Admin | Review Organizer access requests and view campus activities. Event oversight is read-only; Admin appointments use trusted operator setup. |

Other verified Google accounts may request Organizer access. Effective roles and
ownership are enforced by the backend. See the [access workflow](docs/ACCESS_WORKFLOW.md).

## Technology

| Area | Stack |
|---|---|
| Frontend | React, TypeScript, Vite and Tailwind CSS |
| Backend | Node.js, Express and Firebase Admin SDK |
| Identity and data | Firebase Authentication and Cloud Firestore |
| AI | Server-side AI/ML API with deterministic planning fallback |
| Verification | Node.js tests, Firebase emulators and Playwright |

## Project structure

```text
frontend/
  src/             React features, shared components, hooks and API client
  public/          Official logos, favicons and web manifest
  index.html
  vite.config.ts
  tsconfig.json
backend/
  src/             Express API, authorization, integrations and worker
  tests/           Backend unit and emulator tests
  api.mjs          Persistent API entrypoint
config/env/        Local and production environment templates
scripts/           Development checks and isolated test tooling
tests/             Browser workflow tests
docs/              Contracts, guides, coursework and verification evidence
```

Frontend dependencies and shared tooling are managed by the **root package**.
The backend has its own package. Run the commands below from the repository root.

## Local setup

### 1. Install dependencies

Use **Node.js 22.12 or newer** and npm.

```sh
npm ci
npm ci --prefix backend
```

### 2. Configure the environment

For a fresh setup, copy the examples to the destinations below and enter your
project values. Keep existing working private files instead of overwriting them.

| Configuration | Example | Local destination |
|---|---|---|
| Public frontend settings | [Frontend template](config/env/frontend.local.env.example) | `frontend/.env.local` |
| Server settings | [Backend template](config/env/backend.local.env.example) | `backend/.env` |
| Firebase Admin credentials | Your authorized service-account JSON | `backend/service-account.local.json` |

Use the same Firebase project for frontend and backend, enable Google sign-in,
and set the backend credential path to your local file. Admin credentials,
AI keys and partner secrets belong only on the server.

```sh
npm run check:env
```

See [environment setup](config/env/README.md) and [Google sign-in setup](docs/GOOGLE_SIGN_IN.md)
for the complete configuration.

### 3. Start both services

Frontend — terminal 1:

```sh
npm run dev
```

Backend — terminal 2:

```sh
npm run dev:api
```

Open **http://localhost:5173**. The API runs at **http://localhost:3000**;
its process health endpoint is `/health`. Restart the relevant service after
changing environment settings.

## Maintenance integration

Run only one local API mode at a time:

| Command | Enabled behavior |
|---|---|
| `npm run dev:api` | Normal development with Maintenance/legacy integrations disabled |
| `npm run dev:api:maintenance` | Authenticated incoming maintenance updates only |
| `npm run dev:api:facilities` | Explicit owner-reviewed facilities requests and signed incoming updates |

Saving or publishing an activity does not send a facilities request. Coordinated
testing requires the agreed private credentials and an HTTPS callback tunnel to
API port 3000. See the [Maintenance guide](docs/MAINTENANCE_CONNECTION.md).

The independent [Team 17 Internship feed](docs/integrations/team17-internships.md)
works in any API mode when `TEAM17_API_BASE_URL` is configured. Current listings
are fictional demos. [Library learning resources](docs/integrations/library-resources.md)
use independent server-only Library credentials and the existing AI provider.
Notification Hub's contract remains pending.

Maintenance is the main integration demonstration; Library and Internship are
read-only connections, completed per the user's confirmation. Notification Hub
coordination was attempted; no active notification delivery is implemented.

## Privacy and architecture

The public `#privacy` page explains collected data, AI/partner sharing, access,
retention and the project contact for manual personal-data requests. It is linked
before sign-in and from all workspaces; deploy the latest frontend to publish it.
The project retention policy is 30 days for routine technical logs and 90 days
after final evaluation for identifiable project records, with operator review.
Automatic deletion is not implemented and full PDPA compliance is not certified.
See [privacy operations](docs/privacy-and-data-handling.md).

The [current architecture](docs/architecture.md) and
[exportable diagram](docs/diagrams/platform-architecture.svg) describe Firebase
Hosting, the persistent Render API, Firebase Auth/Firestore, AI and partners.

## Checks and builds

| Command | Purpose |
|---|---|
| `npm run check:env` | Check local configuration without network calls |
| `npm run build` | Type-check and build the frontend using current settings |
| `npm test` | Run backend helper tests; API scenarios require emulators |
| `npm run test:emulator` | Run the isolated backend suite |
| `npm run test:e2e` | Run browser workflows against isolated demo services |
| `npm run build:production` | Validate production frontend settings, then build |
| `npm run check:hosting` | Check that only safe production frontend assets will be published |
| `npm run deploy:frontend` | Rebuild, validate and publish to the existing Firebase Hosting site |

Emulator tests require Java 21+; see [local development](docs/LOCAL_DEVELOPMENT.md).
Automated checks use disposable demo projects and mocked AI/partner providers.
Recorded results and their limits are in [PROGRESS.md](PROGRESS.md).

## Deployment

- **Frontend:** install/build from the repository root, configure production public
  values, run `npm run build:production`, and publish **`frontend/dist/`**.
- **Backend:** use **`backend/`** as the service directory on a persistent Node host,
  configure host environment variables and a server-only credential file, then
  run `npm start`. Keep the integration worker in the persistent process.

Production templates and verification steps are in the [deployment guide](docs/deployment/README.md).
Local build or test success does not establish production readiness.

## Documentation

- [Documentation index](docs/README.md)
- [API contract](docs/API_CONTRACT.md)
- [AI planning](docs/AI_DRAFT_ASSISTANT.md) and [Organizer admission policy](docs/ORGANIZER_AI_ADMISSION.md)
- [Branding](docs/BRANDING.md) and [repository layout](docs/REPOSITORY_LAYOUT.md)
- [Implementation decisions](docs/implementation-decisions.md)

The implemented Firebase/Express stack remains a documented deviation from the
original Supabase/Vercel PRD; lecturer approval has not been recorded.
