# Repository layout and naming

`frontend/src/` is React/Vite; `backend/src/` is the persistent Express API. Keep the
worker there. `frontend/public/brand/` retains supplied SVGs. Backend tests now live in
`backend/tests/`, browser tests in `tests/`, tooling in `scripts/`.

## Names and compatibility

- React components: PascalCase. Hooks: `useSomething.ts`.
- Node tooling: lowercase kebab-case `.mjs`; tests: descriptive `*.test.mjs`.
- New documents: lowercase kebab-case, grouped by topic.
- Existing `.mjs` startup/operator filenames are retained under `backend/`;
  root npm commands now point there. No `firebase/` alias folder is needed.
- `AGENTS.md`, `PROGRESS.md` and current policy/contract/setup/feature documents
  keep known paths. Existing source modules were not renamed just for style.

## Document groups

| Folder | Contents |
|---|---|
| `docs/assignments/` | Coursework stages and database/API assignment material |
| `docs/prompts/` | Reusable generation/review prompts |
| `docs/templates/` | Document templates |
| `docs/deployment/` | Current hosting preparation and release review |
| `docs/partner-requests/` | Proposed connections with other pods |
| `docs/evidence/` | Dated sanitized verification artifacts |
| `docs/archive/` | Historical reviews, instructions and evidence |

Former `group_assignment`, `prompt` and `template` documents moved to the plural
folders above; underscore filenames became kebab-case. `assignment_3` and
`firebase_database_assignment` now live under assignments as `assignment-3.md`
and `firebase-database.md`. Current links were rebased; supplied historical packs
remain verbatim. Canonical PRD/architecture/reviews are still at their known paths.

## Preserved material

Frontend private files moved into `frontend/`; API config and credentials moved
with `backend/`. Only GOOGLE_APPLICATION_CREDENTIALS's filesystem path is adjusted
when it referred to the old folder; all other server values and credentials are
preserved. Existing ignore rules still cover these locations and were not edited.
Original uploaded packs and historical evidence were preserved.
Generated artifacts were not manually purged; normal build/emulator outputs were
regenerated during verification. Database records, work-order links, dependency versions
and runtime access rules were not changed. Package labels match the current name.

No Git command, staging/index change, commit, branch/remote operation, push or
deployment is part of cleanup. The user handles repository history separately.
