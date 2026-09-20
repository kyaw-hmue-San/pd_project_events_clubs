# Campus Events & Clubs — Team 12

This repository contains the discovery, requirements, data design, architecture, technology selection, PRD, review, validation, and stress-test documents for the Events & Clubs campus-service MVP.

## Submission Documents

- [PRD.md](docs/PRD.md) — canonical implementation-ready Product Requirements Document
- [architecture.md](docs/architecture.md) — canonical architecture options and selected design
- [role-reviews.md](docs/role-reviews.md) — architecture review, findings, and decision log
- [diagrams/platform-architecture.md](docs/diagrams/platform-architecture.md) — canonical platform diagram and data flow

## Firebase Database Assignment

- [Firebase Firestore database assignment](docs/firebase_database_assignment.md) — answers to all six questions, with schema, diagrams, CRUD APIs, and deployment instructions.

## Working Document Order

1. [Problem discovery](docs/group_assignment/01_problem_discovery.md)
2. [Problem validation plan](docs/group_assignment/01_validation_plan.md)
3. [MVP requirements](docs/group_assignment/02_requirement.md)
4. [Minimum data model](docs/group_assignment/03_design_the_data.md)
5. [Architecture design](docs/architecture.md)
6. [Technology selection](docs/group_assignment/05_techstack_selection.md)
7. [Product Requirements Document](docs/PRD.md)
8. [Architecture review](docs/role-reviews.md)
9. [Adversarial architecture stress test](docs/group_assignment/08_architecture_stress_test.md)

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

## Current Status

**READY WITH CHANGES**

The documents are internally aligned, but the following evidence is still required before changing the status to `READY`:

- Complete student and organizer validation.
- Record each student's name and individual review contribution.
- Deploy and smoke-test the frontend and API on Vercel.
- Run the high-severity integration and security tests in the stress-test document.
- Recheck official Vercel and Supabase free-tier conditions immediately before deployment.

## Constraints

- Team: 5 students
- Schedule: one semester
- Deployment budget: 0 THB
- MVP roles: Student and Organizer
- Architecture: React + Vite, Express, Supabase Auth/PostgreSQL, and Vercel

## Git Workflow

See [git_guide.md](docs/git_guide.md) for the team Git workflow. Work on a feature branch, review changes before staging, and open a pull request before merging into `main`.