# Paste into your friend's coding agent

You are implementing **Team 12 Campus Events & Clubs** in the actual repository. Read `AGENTS.md`, `START_HERE.md`, `SPECS/REQUIREMENTS_MATRIX.md`, `SPECS/API_GAP_AND_ROLE_MATRIX.md`, `SPECS/DECISION_REGISTER.md`, and the frozen references first. Then inspect the **live checkout**; the pack's status is from November 4, 2026 and may be outdated.

**GOAL**: Deliver real React/Vite/Tailwind -> Firebase client Auth -> Express bearer-token REST API -> Firestore workflows for Student, Organizer and an added **read-only Admin**. Keep Team 10 provider/webhook/worker integration functional. Use modular feature-first source rather than giant api.mjs/integration.mjs. Do not migrate stack, impersonate commit authors, or simulate core successes.

**Build-first with release QA later**: Develop complete modules and wire all screens first. At each slice run short build/syntax checks plus applicable existing regression tests and one targeted emulator HTTP request; defer comprehensive E2E/responsive/perf/security matrix until all feature slices are connected. Do not hide untested behavior.

**Implement in this order:**
1. Preflight/branch and architecture decisions; record Admin as scope extension and public-browse conflict. Preserve existing 13 emulator + 6 helper tests when practical.
2. Modularize backend with `app`/`server`/`config`/`middleware`/`features/{activities,registrations,users,admin,integrations}`. Prefer `.js` modules with ESM manifest, keep old `.mjs` startup shims or route compatibility until new entrypoints are verified. One domain per commit.
3. Fill API gaps: Organizer-owned activity list (including drafts); cancelled registration history/status; appropriate organizer display; consistent safe error/field validation; scope decision for public browse. Update contract and compatibility tests.
4. Implement read-only Admin role, with server-side provisioning and only limited `GET /api/admin/summary`, `GET /api/admin/activities`, and optional `GET /api/admin/activities/:id`. Never allow Admin to edit, register, view private student rosters or integration logs by default. Use paginated queries and accurate aggregates.
5. Create/bring in frontend from approved Figma Make export: React/Vite/Tailwind; shared tokens/components and `features/auth`, `student`, `organizer`, `admin`, `api`. Remove mock persistence from product paths.
6. Wire Firebase web sign-in + verified-email session, secure bearer-token fetch, `/api/me` role route, Student discovery/details/register/confirmation/history/cancel; Organizer own activities/create/edit/publish/close/roster; Admin overview/all activities/details. Refetch server state after mutation and refresh.
7. Prepare approved demo project/accounts and 3–5 explicitly sample events, no real student PII. Keep data genuinely persisted. Deploy frontend + persistent backend, set exact `FRONTEND_ORIGINS`; do not expose secrets.
8. Then use `PROMPTS/FINAL_QA_PROMPT.md` for **comprehensive test-and-fix** and report production evidence, PRD acceptance and lecturer demo readiness.

For each slice, show observed source evidence, impacted files, change summary, fast check results, untested items, real commit/PR attribution, and next slice. Do not ask to restart investigation or produce another large plan instead of implementation. Stop for only genuinely high-risk choices (mandatory Supabase migration, production writes, paid deployment, privilege expansion).
