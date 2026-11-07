# Approved access workflow — presentation release

Confirmed user scope, updated 2026-11-06:

- Google sign-in for everyone, with the normal account chooser.
- **Student accounts are only `@lamduan.mfu.ac.th`.** A verified Student creates
  their university-ID profile once. Other email domains cannot enroll as Students.
- A verified Google account can submit **Request Organizer access** with its
  organization and reason. An existing Student retains Student access while the
  request is pending and after approval. A personal-email applicant has only their own request/status
  page until approval.
- User-confirmed policy CAMPUS_ORGANIZER_V1 allows any verified Google applicant,
  including personal accounts, to receive AI automatic Organizer approval when all
  required criteria pass: specific campus activity, purpose/audience, organization
  or independent identity, personal organizing responsibility, consistent/safe text
  and no bypass/concerns. Server validates supporting quotes and rechecks identity,
  revision and profile before atomic promotion. Anything uncertain or unavailable
  stays PENDING for Admin; AI never rejects or appoints Admin. Explicit server
  policy/config is required; old pending requests are not bulk-processed.
  See [exact rubric and safeguards](ORGANIZER_AI_ADMISSION.md).
- Admin has one **Organizer requests** screen with **Approve / Reject**. No
  Owner/Super Admin role, Admin appointment UI, general membership queue or
  per-event approval workflow is included.
- Admin appointment is a trusted manual operation. Existing event oversight
  remains read-only. Admin may review Organizer requests and edit their own
  username through the same bounded self-profile API available to other roles.

## My profile

Student, Organizer and Admin navigation includes **My profile**. Each person may
edit their own username, used as their Campus Pulse display name, with 1–80
characters after trimming. Names do not need to be unique. The page shows Google
email, university ID when applicable, and campus access as read-only details.
Editing a name does not change Google identity, enrollment, permissions or
Organizer-request identity snapshots. Saved names are used by event and
participant projections on their next load. Pending personal-email applicants
still have only the request gate until they receive an approved campus profile.

## Activity registration policies and facilities — 2026-11-06

Organizers can optionally set a participant limit, an end date/time, a registration
deadline and private facilities notes on their own activities. Existing events
remain unlimited with no inferred deadline/end until edited. Capacity is enforced
transactionally, including the final-seat and limit-edit races; cancellation frees
a seat. Limits cannot fall below current active registrations. Deadline must be at
or before the start; end must be later and may be on another day. Registration
stops at a configured deadline/end. Existing ticket/cancel/check-in policies remain.

Students see counts/limits/seats left, full/deadline/end states and the complete
schedule. Facilities notes and linked work-order status are available only to the
owning Organizer. Saving notes is not a maintenance request. The owner explicitly
reviews the saved details and recipient, then chooses **Send facilities request**.
The backend sends only those requirements to Team 10 and validates the receipt's
activity ID before atomically linking the unique work order. The user approved
this narrow exception to operator-only linking; clients cannot choose IDs or
change links. An operator can still link an existing order. Signed webhooks supply
monotonic status updates; RESOLVED/CLOSED display completion in the owner's panel.
Retries preserve the original reviewed payload and request identity. No Student
or Admin creation/status-management power is added. See
[maintenance connection](MAINTENANCE_CONNECTION.md).

All schedule icons open app-controlled date/calendar or 24-hour time dialogs,
independent of browser `showPicker()` support. Selecting a day commits that field;
time is applied with Use time. Escape/Cancel closes without a change and returns
focus to the icon. Direct input remains available. Calendar dates are date-only
values; conversion to campus-time UTC timestamps still happens on normal save.

Dual Student/Organizer workspace choice is stored per person in browser session
storage, so reloading an ambiguous activity/profile route retains the chosen view.
It grants no access beyond the server-derived capabilities.

## Event draft assistant

Organizer workspace → Create activity includes AI Event Planning Copilot. The
brief includes duration and estimated participants. Suggestions contain a timed
agenda, preparation checklist and facilities requirements with unconfirmed
assumptions. Users choose sections, acknowledge replacement of existing text and
explicitly apply. Date/location/type/capacity remain manual; save/publish and
facilities Send remain separate. Deterministic template fallback and honest
source labels keep planning usable without AI. See [AI setup](AI_DRAFT_ASSISTANT.md).
The earlier basic drafting API remains compatible.

## What each person does

### Registration tickets and attendance — 2026-11-06

After registration, Students choose **View ticket** on the activity or in
**My registrations**. Their active-registration ticket contains a private QR,
manual code, event details and attendee name. They may download the QR for
arrival. Existing registrations receive a ticket lazily on first view; no
profile migration or re-registration is required. An enrolled Student who also
has Organizer access uses the same ticket flow from their Student workspace.

The owning Organizer opens **Roster → Scan tickets**, starts the camera, uploads
a ticket image, or enters the code. Verification displays the attendee and
current status; **Confirm check-in** records attendance. The roster also supports
manual name confirmation/check-in without a ticket. Camera permission is requested
only after Start camera, and the stream stops after detection or leaving the
screen. Image decoding stays on the device. Cameras require HTTPS or localhost.
Camera and saved-image options have separate controls, with manual code entry
below and a Read ticket → Confirm attendee indicator. PNG downloads and supported
screenshots are recognized from their actual image contents, including missing
file-type metadata. Image errors distinguish file size/type, damaged images,
unreadable QR and unrelated QR, with Try another image and focused Enter ticket
code recovery. Check-in still requires authoritative server verification.

Attendance has its own timestamp and count, separate from ACTIVE/CANCELLED.
Repeated/concurrent check-ins count once. Cancelled tickets and wrong-event
tickets are rejected; cancellation followed by re-registration produces a new
ticket. **Cancellation is blocked after check-in** to preserve attendance and
prevent cancellation/re-registration from counting a person twice. No correction
or attendance-reversal UI is included. Closed registration still allows arrival
check-in; draft events do not. No arrival-time window is inferred from the single
event start timestamp. Admin remains separate and cannot view or redeem tickets.

The QR holds a random 128-bit bearer code, without email or university ID. Keep
it private: a screenshot can be copied, so Organizers must confirm the person
against the displayed name. This is an attendance workflow, not identity-proof
or fraud-proof admission. See [ticket contract](API_CONTRACT.md#registration-tickets-and-attendance--2026-11-06).

1. **Student:** Google sign-in → complete university ID → discover/register/cancel.
   Use Organizer access in the navigation to apply when needed.
2. **Personal-email applicant:** Google sign-in → request form → pending review.
   Rejected applicants see the reason and can update/resubmit. Refresh request
   status after a decision; approved applicants choose Continue to Organizer
   workspace. No invented university ID is needed for a non-Student Organizer.
3. **Admin:** Google sign-in → Organizer requests → inspect identity, organization
   and reason → confirm approval or enter a rejection reason. Approved/Rejected
   tabs preserve the latest request state.
4. **Organizer:** After AI or Admin approval, create/publish/close own activities and view own
   roster using existing ownership-protected APIs.

The three primary role labels remain, but Student and Organizer access can now
coexist. Approved enrolled MFU Students can switch between Student workspace
(Discover, registrations, cancellation) and Organizer workspace (own events,
publishing, roster) without changing accounts. Approval preserves their university
ID and registrations. Personal-email Organizers remain Organizer-only. Admin is
separate and does not inherit Student or Organizer powers.

`GET /api/me` returns server-derived `capabilities: {student, organizer}`. The
stored primary role remains ORGANIZER after approval for compatibility with
existing ownership checks. Student access for an Organizer additionally requires
the current verified exact MFU Student email domain and a valid university ID in
their trusted profile. This also restores already-approved Students without a
data migration or manual role rollback. A school email by itself does not grant
Student access to an Organizer with no completed university-ID enrollment.
Clients cannot choose capabilities, grant Organizer access or bypass ownership
by selecting a workspace. Admin review never grants Admin or other broad powers.

## Manual Admin appointment with a real Google account

The person first signs in with Google once so Firebase has their real UID. Then
an authorized project operator uses existing server-only Firebase credentials:

```sh
npm run admin:appoint -- --email 'real-admin-email@example.com'
```

This is a **dry run**. Verify its project, Google identity, and proposed role,
then apply the same target explicitly:

```sh
npm run admin:appoint -- --email 'real-admin-email@example.com' --apply
```

Use the actual designated account, not the example. The command requires a
verified, enabled Google-linked account. It preserves existing identity fields,
creates an Admin profile only if needed, and records the assignment. Repeating
an unchanged appointment is idempotent. It never creates a Google account, sets
passwords, or assigns the first person who signs in as Admin. Admin appointment
is not available through a public API or the Admin dashboard.

On 2026-11-05 the user supplied a working local server credential and explicitly
selected their Google account for Admin. The trusted operator tool verified its
Google identity, completed the dry run, applied the appointment, and confirmed
the stored ADMIN role with a separate read-only check. The person can sign out
and sign back in to load the Admin workspace. No public appointment route,
password account, code push or deployment was involved. Credential contents
remain private and ignored by Git.

## Storage and authorization

- `users/{uid}` remains the authoritative role record. Google proves identity;
  clients cannot choose their effective role through a form or request body.
- `organizerRequests/{sha256(uid)}` stores the latest request and a revision.
  Only that applicant can read their request through the own-request API; only
  Admin can page through requests or review one.
- `organizerRequestDecisions` is a server-only decision history. It is not exposed
  as an Admin log browser or Student roster.
- Approval updates the request, Organizer role, and decision history atomically.
  It preserves existing profile fields. A new non-Student Organizer has a null
  university ID; no false student identifier is manufactured.
- Review rechecks the Firebase account, verified Google linkage and submitted
  email. Self-review, changed applicant identity, stale request versions and
  conflicting repeated decisions are rejected. Repeated identical submission or
  review does not duplicate a pending request or role grant.
- Rejection is not role revocation. Disabled campus profiles cannot submit new
  requests to bypass their disabled status.

## Deployment and verification

Deploy the new `organizerRequests: status ASC, createdAt ASC` index along with
other checked-in indexes. Existing routes and the Team 10 secret-based contracts
remain compatible. `/health` now includes the additive
`apiVersion: 2026-11-04-organizer-access` marker for deployment verification; it
still does not prove database connectivity.

Set `SCHOOL_EMAIL_DOMAIN=lamduan.mfu.ac.th` and exact `FRONTEND_ORIGINS` on the
persistent API. Do not move its worker to serverless or seed real sample users.
The current localhost frontend is configured for the real Firebase project and
updated local API on port 3000. The user supplied the server-only credential on
2026-11-05; read-only Auth/Firestore access and local health/CORS checks passed.
A real-user approval walkthrough is not verified. The older Render API still
requires the updated code/CORS/indexes before hosted use.

Automated verification uses isolated disposable Google identities and persisted
local Auth/API/Firestore paths. Normal app operation does not use those fixtures.
See root PROGRESS.md for actual counts and release status.
