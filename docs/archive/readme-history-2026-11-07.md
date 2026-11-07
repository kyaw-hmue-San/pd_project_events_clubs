<!-- Preserved README content before the landing-page cleanup; historical review status is not a release claim. -->

# Campus Events & Clubs — Team 12

This repository contains the discovery, requirements, data design, architecture, technology selection, PRD, review, validation, and stress-test documents for the Events & Clubs campus-service MVP.

## Run the current application

Campus Events & Clubs uses **Google sign-in** with three server-controlled roles.
Students must use `@lamduan.mfu.ac.th` and complete their university ID once.
Other verified Google accounts can request Organizer access; qualifying requests
may receive AI approval under the confirmed policy, while Admin reviews or
rejects requests. Admin appointment is manual, with no public Admin signup.
See [the access workflow](../ACCESS_WORKFLOW.md).

Official branding uses the supplied logo kit through the shared
[`BrandLogo`](../../frontend/src/components/BrandLogo.tsx). See [asset usage](../BRANDING.md).

```sh
npm ci
npm run dev
```

Start the local backend in a second terminal:

```sh
npm run dev:api
```

Open **http://localhost:5173**. Real Firebase public web configuration is saved in
ignored `.env.local` in this workspace. A fresh checkout needs its own public
config and server-only Firebase credentials. Local API runs on port 3000 and
disables partner integrations. Hosted use requires the updated backend and exact
frontend CORS origin; the older hosted deployment is not verified for this release.
For an explicitly coordinated inbound maintenance test, use
`npm run dev:api:maintenance` instead of the normal API command. It retains the
agreed inbound webhook secret only; outbound partner traffic stays disabled.

Organizers can optionally set participant limits, registration deadlines, end
times and private facilities notes. Students see seat availability and registration
closing states. Saving notes does not create a maintenance request. An owning
Organizer can review and explicitly send them to Team 10, then see signed status
updates and completion on the activity page. For this coordinated test use
`npm run dev:api:facilities` instead of the normal API command; creation requires
the private agreed partner key, and maintenance reception requires HMAC. Startup
does not send anything; legacy publication/polling remain disabled. See
[maintenance setup and Team 10 handoff](../MAINTENANCE_CONNECTION.md).

See [Google setup and current blockers](../GOOGLE_SIGN_IN.md),
[development setup](../LOCAL_DEVELOPMENT.md),
[implementation evidence](../../PROGRESS.md), and the [API contract](../API_CONTRACT.md).
Use `npm run build`, `npm run test:emulator`, and `npm run test:e2e` for automated
checks. Disposable test fixtures are isolated from normal app operation.

The Firebase/Express implementation remains a recorded deviation from the older
Supabase/Vercel PRD.

## Submission Documents

- [PRD.md](../PRD.md) — canonical implementation-ready Product Requirements Document
- [architecture.md](../architecture.md) — canonical architecture options and selected design
- [role-reviews.md](../role-reviews.md) — architecture review, findings, and decision log
- [diagrams/platform-architecture.md](../diagrams/platform-architecture.md) — canonical platform diagram and data flow

## Firebase Database Assignment

- [Firebase Firestore database assignment](../assignments/firebase-database.md) — answers to all six questions, with schema, diagrams, CRUD APIs, and deployment instructions.

## Working Document Order

1. [Problem discovery](../assignments/01-problem-discovery.md)
2. [Problem validation plan](../assignments/01-validation-plan.md)
3. [MVP requirements](../assignments/02-requirement.md)
4. [Minimum data model](../assignments/03-design-the-data.md)
5. [Architecture design](../architecture.md)
6. [Technology selection](../assignments/05-techstack-selection.md)
7. [Product Requirements Document](../PRD.md)
8. [Architecture review](../role-reviews.md)
9. [Adversarial architecture stress test](../assignments/08-architecture-stress-test.md)

The numbered Stage 04, 06, and 07 files under `docs/group_assignment/` link to the canonical submission documents to avoid maintaining conflicting duplicate copies.

## Prompt Workflow

The reusable prompts are stored under `docs/prompt/` and follow the same lifecycle:

1. Problem discovery
2. Requirement generation
3. Data design
4. Architecture options
5. Technology selection
6. PRD generation
7. Architecture review
8. Adversarial architecture stress test

Replace bracketed inputs such as `[Requirements]` with the corresponding approved document content. AI output must be reviewed by the team and must not be treated as validated user evidence.

## Original document review status

**READY WITH CHANGES**

The documents are internally aligned, but the following evidence is still required before changing the status to `READY`:

- Complete student and organizer validation.
- Record each student's name and individual review contribution.
- Resolve the recorded stack deviation and verify the approved production frontend/API deployment.
- Run the high-severity integration and security tests in the stress-test document.
- Recheck official Vercel and Supabase free-tier conditions immediately before deployment.

## Original PRD constraints

- Team: 5 students
- Schedule: one semester
- Deployment budget: 0 THB
- MVP roles: Student and Organizer
- Architecture: React + Vite, Express, Supabase Auth/PostgreSQL, and Vercel

## Git Workflow

See [git_guide.md](../git_guide.md) for the team Git workflow. Work on a feature branch, review changes before staging, and open a pull request before merging into `main`.

AI features: Organizer applications can be automatically approved under the
user-confirmed [CAMPUS_ORGANIZER_V1 rubric](../ORGANIZER_AI_ADMISSION.md); any
unmet criterion or AI failure stays pending for Admin. This requires explicit
server policy/config. Organizer → Create activity → **Plan with AI** generates a
timed agenda, preparation checklist and facilities suggestions. Choose sections
and acknowledge replacement before applying; saving/publishing and maintenance
Send remain separate. See [planning/fallback setup](../AI_DRAFT_ASSISTANT.md).
