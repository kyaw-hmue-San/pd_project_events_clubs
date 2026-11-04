# Campus Events & Clubs implementation rules

Use the confirmed policy in `docs/ACCESS_WORKFLOW.md`, the actual API contract,
and root PROGRESS.md. The user-supplied local skills pack may be present under
`Campus_Events_Clubs_Skills_2026-11-04/`; its reference snapshots are historical.
Select the relevant local skill before implementation when available. The
confirmed Organizer-request scope below supersedes its older read-only-Admin
wording only for the bounded request review operation.

## Confirmed access scope

- Three roles: Student, Organizer, Admin. No Owner/Super Admin implementation.
- Google identity with server-side token/revocation/provider/email verification.
- Student enrollment is limited to @lamduan.mfu.ac.th and requires a unique
  university ID. Never infer an official student ID from email.
- Other Google accounts may request Organizer access. No campus-data access
  before approval. Clients cannot choose their own effective role.
- Admin may approve/reject Organizer requests; event oversight remains read-only.
  No event CRUD, private Student roster, integration logs or public Admin
  appointment endpoints. Admin appointment uses trusted operator setup only.
- Keep request/role/decision updates atomic and concurrent/idempotent behavior
  intact. Preserve existing identity and registration data on promotion.

## Engineering boundaries

The live source is root React/Vite (`src/`) and the persistent Express API
(`firebase/src/`). Keep `.mjs` compatibility entrypoints and existing Team 10
provider/webhook paths, shared-secret validation, request evidence, outbox leases
and retries. Do not move the persistent worker into a serverless route.
Importing `firebase/src/app.js` must not initialize Firebase or start a listener
or worker. Preserve server-side role/ownership checks and atomic registration
locks/counts/cancellation behavior. Direct browser Firestore access stays denied.

Do not commit credentials, raw tokens, service-account keys, private environment
files or operational logs. Web Firebase config may be public; Admin credentials
must remain server-only. Do not print unrelated environment values. Never seed
the connected project or call external partner services during automated tests.
Keep the provisional Firebase-vs-Supabase PRD deviation explicit; do not invent
lecturer approval, interviews, teammate authorship or test/deployment evidence.

Keep changes focused and reversible, on a feature branch. No force pushes,
destructive schema changes, secret rotation, paid-service/billing changes or
architecture migration without authorization. Run builds and targeted isolated
emulator/browser checks for changed behavior, update contract/progress, and
clearly separate local verification from production results. Preserve user
uploads and unrelated work. Use responsive, keyboard-accessible screens with
loading, empty, error, denied and authoritative success states.
