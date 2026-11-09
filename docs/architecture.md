# Campus Events & Clubs — implemented system architecture

Updated 9 November 2026. Team 12. This describes the implemented application,
not a proposed stack. [Diagram](diagrams/platform-architecture.md) ·
[Standalone SVG](diagrams/platform-architecture.svg) ·
[Privacy and security](privacy-and-data-handling.md).

## Deployment and trust boundaries

| Layer | Actual responsibility | Location |
|---|---|---|
| Browser | One React/TypeScript/Vite application; Student, Organizer and Admin interfaces; local ticket QR rendering/decoding | `frontend/src/` |
| Static hosting | HTML, compiled JS/CSS and official branding; no server credentials | Firebase Hosting: `https://events-management-4d8ce.web.app` |
| Identity | Google sign-in through Firebase Authentication; client obtains Firebase ID tokens | Google/Firebase Auth |
| API | Persistent Node/Express process, Firebase Admin SDK, authoritative identity/roles/ownership/business rules | Render: `https://pd-project-events-clubs.onrender.com`; `backend/src/` |
| Database | Firestore application records, transactions and durable integration state | Firebase project `events-management-4d8ce` |
| External providers | AI/ML API; Team 10 Maintenance; Library; Team 17 Internship | Backend-to-provider HTTPS for in-app calls |

The browser signs in with Firebase Auth and calls Express with an ID token.
It never reads/writes Firestore directly; client Firestore rules deny all access.
Admin SDK bypasses those rules, so server authorization and IAM credentials are
the actual application data boundary. CORS is a browser control, not authentication.
Partner callbacks use their separate shared-secret/HMAC boundary, not Google tokens.

## Application modules

| Module | Responsibility and limits |
|---|---|
| Authentication and profiles | Verify token/revocation, Google provider and email; load trusted profile. Student enrollment requires exact school domain and a separately supplied unique university ID. Each provisioned role can edit only its own display name. |
| Activities | Owning Organizer creates, edits, publishes and closes activities. Optional capacity, end time and deadline. Admin event oversight is read-only. |
| Registration | Student-capability checks; atomic seats/count/active-registration lock; duplicate protection and history-preserving cancellation. |
| QR and attendance | Private opaque ticket for its registration owner; event-owning Organizer verifies and explicitly confirms check-in. Atomic attendance/counter; repeated scans count once. No Admin ticket/roster access. |
| Organizer admission | Own request and Admin review; conditional AI admission under explicit CAMPUS_ORGANIZER_V1 config. Revision/lease/identity checks; uncertainty stays pending, never AI rejection or Admin appointment. |
| AI planning | Organizer-only agenda/checklist/facilities suggestions; reviewed section application, replacement acknowledgment and labelled fixed-template fallback. No automatic publish or facilities Send. |
| Maintenance | Owner-reviewed creation, stable retries/leases, validated unique response linking; raw-byte signed webhooks with monotonic lifecycle versions. |
| Library | Student-only published/closed activity resources. Cached LIBRARY_RELEVANCE_V1 assessment gates AI suggestions; manual search stays available. Library supplies all books/copy counts. |
| Internship | Student-only read-only proxy with validated search/pagination/safe links. Provider demo records remain labelled. |

Three primary roles: Student, Organizer, Admin. An enrolled Student approved as
Organizer retains Student capability and both workspaces. Personal-email or
unenrolled Organizers gain no Student powers. Admin appointment is trusted
operator setup, with no public role-selection API.

## Data and transactions

Firestore is document-based; there is no PostgreSQL database or SQL migration.

- `users`, `universityIds`: profiles and unique enrollment claims.
- `activities`, `registrations`, `activeRegistrations`: lifecycle, retained
  history and unique active-registration locks. Seat allocation, cancellation
  and counters transact against the activity.
- `registrationTickets`, `ticketCodes`: private tickets and hashed lookup keys.
  Ticket credentials are excluded from list DTOs, URLs and committed evidence.
- `organizerRequests`, `organizerAiReviews`, `organizerRequestDecisions`:
  exact revisions, processing leases and decision evidence.
- `facilitiesRequests`, `maintenanceBindings`, `maintenanceWorkOrderLinks`,
  `maintenanceWorkOrders`: reviewed payload/retry identity, unique associations
  and latest authenticated work-order status.
- Integration inbox/outbox/log records and `requestLogs`: deduplication,
  optional delivery retries and sanitized operational evidence. Admin does not
  automatically receive integration-log access.

See [feature modules](../backend/src/features/) and [API contract](API_CONTRACT.md).
Transactions preserve cross-document invariants. AI/partner network calls run
outside transactions; results are rechecked against revision/lease before writes.
Required composite indexes support bounded queries. No destructive migration is
introduced by the architecture update.

## Main data flows

1. **Sign-in:** Google → Firebase Auth → browser ID token → Express verification/
   revocation/provider/email checks → trusted Firestore profile/capabilities.
   UI workspace choice grants no authority.
2. **Join/check in:** Student request → visibility/deadline/capacity checks →
   transactional registration/lock/count → authoritative response/refetch →
   optional own QR. Owning Organizer verifies and confirms attendance separately.
3. **Plan:** Organizer brief → AI/ML API → strict schema/duration validation →
   AI plan or fixed template → human section review/apply → separate save/publish.
4. **Admission:** save pending request → assess organization/reason → validate
   rubric/quotes → recheck current Google identity/revision/lease → atomic
   conditional promotion/audit, otherwise Admin review. Student data is preserved.
5. **Facilities:** review saved requirements → backend POST to Team 10 → validate
   receipt activity ID and unique order → persist link → signed callback →
   deduplicate/version-check → persist status → owner panel refresh. Saving
   notes alone never sends them. Later edits do not update the remote request.
6. **Library:** eligible activity open → cached relevance check of public
   title/description → AI action only on positive result → explicit search →
   real Library records. Manual search is independent of AI. No Student identity
   is attached to AI prompts/catalog requests.
7. **Internship:** Student search → protected proxy → public Team 17 feed →
   validated results/demo labels → optional external detail/application website.

## Partner boundaries and evaluation status

| Connection | Direction and data | Status |
|---|---|---|
| Team 10 Maintenance | Outbound reviewed activity ID/title/requirements/schedule/location/category; inbound work-order receipt and signed status events | User confirms connection completed; main evaluation showcase. Latest permanent-origin health was separately checked. New hosted HTTP/lifecycle artifacts have not been captured by this documentation task. |
| Library | Read-only catalog GET with search/paging and server-only provider key; real books/copy counts returned | User confirms connection completed. No borrowing/reservation. |
| Team 17 Internship | Read-only public GET with search/filters/paging; no caller identity/credentials | User confirms connection completed. Applications remain on provider site. |
| Notification Hub | No current runtime data flow | Coordination attempted, per user. No delivery implementation or success claimed. |

Permanent endpoints:

- Creation: `https://maintenance-team10.vercel.app/api/partner/work-orders`.
- Receiver: `https://pd-project-events-clubs.onrender.com/webhooks/partner`.
- Library: `https://campus-library-mu.vercel.app`.
- Internship: `https://team17-internship.vercel.app`.

Evaluation infrastructure must not depend on localhost/ngrok. Historical local
receipts remain labelled as such. User confirmation is not a captured HTTP trace.
The user is preparing the Working Happy Path; no additional production writes
or partner messages are performed by this documentation change.

## Runtime, deployment and failure behavior

`backend/api.mjs` starts the persistent service. Importing `backend/src/app.js`
does not initialize Firebase, listen or start a worker. The in-process worker
uses durable leases/retries for enabled legacy integration jobs. Hosted settings
currently disable legacy publication/polling. Facilities sends/retries are
explicit owner actions, not automatic worker jobs. Do not move the worker to
a Vercel/serverless request handler.

Render idle sleep suspends the process/worker until wake-up. In-memory AI caches
and rate guards reset on restart; they are not distributed quotas. Provider
failure yields honest unavailable/manual-review/template states. An uncertain
receipt preserves original retry identity, not invented success.

Build from the root and publish only `frontend/dist` to Firebase Hosting. Deploy
`backend/` using persistent `npm start`. Keep local and hosted environments
separate; AI/partner/Admin credentials never belong in Vite assets.
See [release guide](deployment/firebase-render.md).

## Security, privacy and verification

Implemented: HTTPS, verified identity, server role/owner checks, bounded input,
exact-origin CORS, denied client Firestore access, safe links, webhook HMAC/
replay/version checks, transactional writes and server-only credentials. Request
logs exclude bearer headers/bodies. Free text can still contain personal data.
The public `#privacy` page explains actual sharing and manual rights requests.
[Privacy operations](privacy-and-data-handling.md) distinguishes policy,
implemented controls and remaining institutional decisions.

[Evidence](evidence/README.md) separates emulator tests, historical hosted checks
and user/peer reports. Contributions must reflect actual work; each member must
be able to explain and modify their assigned code. No invented authorship,
lecturer approval, production verification or legal certification.

## Historical stack decision

Earlier Supabase/PostgreSQL/Vercel options are preserved unchanged in
[the archive](archive/architecture-options-original.md). Firebase/Firestore/Render
is the implemented deviation; lecturer approval has not been recorded. Earlier
AI/Admin exclusions were superseded by the confirmed bounded scope in
[ACCESS_WORKFLOW.md](ACCESS_WORKFLOW.md). Historical coursework is not rewritten.
