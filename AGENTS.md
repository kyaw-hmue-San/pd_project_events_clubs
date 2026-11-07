# Campus Events & Clubs implementation rules

Use the confirmed policy in `docs/ACCESS_WORKFLOW.md`, the actual API contract,
and root PROGRESS.md. The user-supplied local skills pack may be present under
`Campus_Events_Clubs_Skills_2026-11-04/`; its reference snapshots are historical.
Select the relevant local skill before implementation when available. The
confirmed scope below supersedes its older read-only-Admin wording for bounded
Organizer-request review and the authenticated person's own username edit.

## Confirmed access scope

- Three roles: Student, Organizer, Admin. No Owner/Super Admin implementation.
- Google identity with server-side token/revocation/provider/email verification.
- Student enrollment is limited to @lamduan.mfu.ac.th and requires a unique
  university ID. Never infer an official student ID from email.
- Enrolled MFU Students keep Student access after Organizer approval. The server
  derives Student/Organizer capabilities; the UI offers both workspaces. Existing
  approved Student profiles recover this access without rewriting their records.
  Personal-email Organizers and unenrolled school Organizers do not gain Student
  powers. Admin remains separate. Keep the existing three primary role labels.
- Other Google accounts may request Organizer access. No campus-data access
  before approval. Clients cannot choose their own effective role.
- Admin may approve/reject Organizer requests; event oversight remains read-only.
  Every provisioned role may edit only its own display name through the bounded
  profile endpoint. This grants no identity, enrollment or role-management powers.
  No event CRUD, private Student roster, integration logs or public Admin
  appointment endpoints. Admin appointment uses trusted operator setup only.
- Keep request/role/decision updates atomic and concurrent/idempotent behavior
  intact. Preserve existing identity and registration data on promotion.
- AI planning is Organizer-authorized; timed agenda, checklist and facilities
  suggestions require explicit section review/application. Preserve manual text
  unless replacement is acknowledged; save/publish and facilities Send stay
  separate. Keep deterministic template fallback and honest source labels.
- User-confirmed Organizer admission policy CAMPUS_ORGANIZER_V1 permits any
  verified Google applicant, including personal accounts, to qualify for automatic
  Organizer approval. Require explicit evidence of a specific campus activity,
  purpose/audience, organization or independent-organizer identity, and personal
  organizing responsibilities, with consistent/safe text and no bypass attempts.
  Validate all required model criteria and supporting quotes server-side; AI
  cannot establish verified affiliation. Missing/unclear criteria, provider failure,
  invalid output or changed identity remain PENDING for Admin. No AI rejection or
  Admin appointment. Auto-approval requires explicit policy/version configuration.
  Bind assessment to the exact request revision and lease; recheck Google token,
  account and profile before atomic promotion/audit. Never overwrite an Admin
  decision/resubmission or bulk-process old pending requests on startup. Preserve
  Student enrollment/registrations/capabilities. Model prompts get only the
  submitted organization/reason, never account tokens or unrelated identity data.
- Student-capable registration owners may retrieve their own opaque QR ticket.
  Only the event's owning Organizer can verify/check in an active attendee, with
  explicit confirmation. Attendance is separate from registration status; update
  attendance/counter atomically and count repeat scans once. Checked-in records
  cannot be cancelled. Admin gets no ticket, roster or check-in powers. Keep
  ticket credentials out of list DTOs, URLs, logs and committed evidence.
- Activity limits, end times and registration deadlines are optional for legacy
  compatibility. Allocate seats and enforce deadlines in the registration
  transaction; capacity edits cannot undercut active registrations. Facilities
  notes are Organizer-owner-only; saving/publishing never sends them. The owner
  may explicitly review and send a facilities request using Team 10's confirmed
  creation contract. User-approved exception: the backend may atomically link a
  unique work order from the authenticated HTTPS creation response only after
  validating its activityId matches the sending activity. Clients cannot supply
  work-order IDs or change established links. Trusted operator setup remains
  available for existing orders. Verify signed maintenance webhooks over raw
  bytes and apply monotonic lifecycle versions; preserve legacy secret-verified
  compatibility without allowing versioned status to regress. Ignore incoming
  payload-supplied activity associations and flag legacy equal-time ambiguity.
  Preserve the Team 10 HTTP payload contract, stable retry identity and leases.

## Engineering boundaries

The user-requested layout is React/Vite (`frontend/src/`) and the persistent Express API
(`backend/src/`). Keep `.mjs` compatibility entrypoints and existing Team 10
provider/webhook paths, shared-secret validation, request evidence, outbox leases
and retries. Do not move the persistent worker into a serverless route.
Importing `backend/src/app.js` must not initialize Firebase or start a listener
or worker. Preserve server-side role/ownership checks and atomic registration
locks/counts/cancellation behavior. Direct browser Firestore access stays denied.

Do not commit credentials, raw tokens, service-account keys, private environment
files or operational logs. Web Firebase config may be public; Admin credentials
must remain server-only. Do not print unrelated environment values. Never seed
the connected project or call external partner services during automated tests.
Keep AI provider keys server-only; automated checks must mock the provider or
use the emulator's deterministic fallback without consuming real AI credits.
Keep the provisional Firebase-vs-Supabase PRD deviation explicit; do not invent
lecturer approval, interviews, teammate authorship or test/deployment evidence.

Keep changes focused and reversible, on a feature branch. No force pushes,
destructive schema changes, secret rotation, paid-service/billing changes or
architecture migration without authorization. Run builds and targeted isolated
emulator/browser checks for changed behavior, update contract/progress, and
clearly separate local verification from production results. Preserve user
uploads and unrelated work. Use responsive, keyboard-accessible screens with
loading, empty, error, denied and authoritative success states.
