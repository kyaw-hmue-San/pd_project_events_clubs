# Privacy, personal-data handling and security evidence

Updated 9 November 2026. Team 12 mini project.
Public notice: `https://events-management-4d8ce.web.app/#privacy` **after deploying
this frontend change**. Implemented locally, readable without sign-in.
Public contact supplied by the user: **6731503062@lamduan.mfu.ac.th**.

This records implemented controls and operating policy, not certified/full PDPA
compliance. Team 12 is the project operator/contact. Formal controller identity/
address, lawful processing basis, processor agreements and transfer safeguards
require responsible university/project confirmation before institutional use.
Reading a notice or signing in is not blanket consent. No new marketing,
consent-tracking database or public data-management privilege is introduced.

## Data inventory and sharing

| Data | Purpose | Access and external disclosure |
|---|---|---|
| Google UID, verified email, display name | Identity and profile | Firebase Auth/API; own profile; name/email on own event's Organizer roster. Admin sees applicant identity, not general rosters. |
| University ID and unique hashed claim | Student enrollment uniqueness | Server enrollment/own profile; never inferred from email or sent to partners. |
| Activity title/description/schedule/location and Organizer name | Discovery and event management | Authorized campus readers; owner-only facilities fields excluded from public projections. |
| Registrations, cancellations, attendance and tickets | History, seats and check-in | Registration owner and owning Organizer within bounded routes. Ticket credentials excluded from lists, URLs and evidence. |
| Organizer organization/reason/revision/review | Admission and decision audit | Applicant, bounded Admin review and operators. Only organization/reason sent to AI/ML API; no attached Google identity/token. Free text may itself identify someone. |
| Planning brief/duration/count | Optional event planning | AI/ML API gets task text, no attached profile/roster. No saved plan collection: reviewed text persists only through normal activity save. |
| Public activity title/description, catalog query | Library relevance and search | AI/ML API for relevance/query; Library gets search/paging and server key, no caller identity. Relevance can run automatically on an eligible activity open. |
| Internship search/filter/paging | Read-only placements | Team 17 public feed, no caller identity/credentials. Demo-labelled provider data. |
| Facilities snapshot, activity/work-order ID and event metadata | Explicit support request/status | Team 10 gets reviewed fields, not attendee lists or Google tokens. Notes may themselves contain personal data: review before Send. |
| Request/integration records | Diagnostics, security, retry/deduplication | Restricted operators/allowlisted viewers. Request logs: ID/path/method/status/time/duration/role, no bearer header/body. Integration records retain bounded request/event data. |

Google/Firebase and Render also process service/network metadata under their
terms. Do not promise all processing stays in Thailand, zero provider retention
or exclusion from model training without checking actual regions/contracts and
AI/ML API account settings. Following partner links opens their websites and
their own processing practices apply.

## User-facing controls

- Public notice before login/enrollment/application and a shared workspace
  footer link. Links open separately to preserve unfinished forms. The notice
  itself requires no API request or campus-data access.
- Own name edit and eligible cancellation already exist. Sign-out is not erasure;
  cancellation preserves history. Email/ID/role edits remain operator-controlled.
- Planning/application text warns against sensitive personal details. Notice
  explains automatic Library relevance and conditional Organizer AI approval;
  human review is available through the contact channel.
- Manual email requests: access/copy, correction, erasure, restriction, objection,
  applicable portability, withdrawal where consent applies, and human review.
  No automatic export/delete/role-revocation endpoint is claimed.
- QR camera/image decoding stays on-device; verification sends the private code,
  not the image. Do not put QR credentials, tokens or keys in email/evidence.

## Retention policy adopted for the project

The user delegated the schedule choice on 9 November 2026. This is an
**operator-reviewed policy**, not an implemented Firestore TTL or executed purge.

| Record class | Retention target and action |
|---|---|
| Routine `requestLogs` and diagnostic integration logs | Review and delete/anonymize after 30 days from creation. A documented security incident may justify a narrow hold with a review/end date. |
| Identifiable profiles, enrollment claims, registrations, attendance, tickets, applications/decisions and facilities/integration references | Remove or anonymize within 90 days after the final evaluation, following dependency/obligation review. Collect the actual evaluation date in the private operator tracker; none has been invented. |
| Active inbox/outbox, work-order links and retry identities | Treat as project records, not disposable 30-day diagnostics. Preserve while requests/retries are active; review for the same project closure schedule to avoid duplicate deliveries or broken links. |
| Coursework evidence | Prefer sanitized aggregate/test artifacts. Remove account emails, real participant data, QR credentials and raw request headers; review any remaining identifiable evidence under the project record schedule. |
| Provider-held records/backups | Verify each provider's controls and retention separately. Our cleanup does not prove deletion of their copies. Coordinate applicable partner requests and record actual results. |

No cleanup has run as part of this change. No automatic expiry exists yet;
operators must review logs regularly and schedule closure cleanup. Holds must
record the limited purpose, affected records and next review date; explain
justified exceptions to a requester. If the service continues after evaluation,
notify users of an updated purpose/retention policy rather than silently extending
this one. Do not delete merely `users/{uid}` or break seats, claims and audit links.

## Manual rights-request procedure

1. Receive requests privately at the public contact. Track reference, date,
   category and reply channel outside Git with restricted access.
2. Verify identity proportionately using the existing account/contact. Never ask
   for a Google password, bearer token, QR or Admin key. Avoid confirming another
   person's account to an unverified requester.
3. Assess scope/requirements/exceptions with the responsible operator. Route AI
   admission objections to a human; Admin review can decide pending applications.
   Already approved access changes need trusted operator handling, not a new
   arbitrary public role endpoint.
4. Prepare access/copy results server-side across related profile, claims,
   application, registration, attendance and integration references. Release only
   the verified person's releasable data privately, excluding secrets/other people.
5. For correction/erasure, obtain approval for a specific plan preserving counters,
   unique claims, ticket lookups, partner correlation and applicable audit needs.
   Execute only authorized actions and record verification. This task authorizes
   no bulk deletion, account disabling, schema change or credential rotation.
6. Where needed, coordinate recipients' correction/erasure and document their
   response. Reply with action/justified retained records and escalation options.
   Assess applicable statutory deadlines; do not invent a substitute project SLA.

## Implemented security controls and evidence

| Control | Source | Existing verification |
|---|---|---|
| Verified Google identity/revocation | `backend/src/middleware/auth.js`, `shared/school-access.js` | Missing/invalid/revoked/provider/email emulator cases; hosted anonymous account401. |
| Server roles/capabilities/ownership | Feature guards and trusted Admin setup | Student write/cross-owner denial, Admin restriction and dual-access tests. |
| Denied direct browser Firestore | `backend/firestore.rules` | Deny-all source and isolated tests; source alone does not prove deployed rules. |
| Bounded input and safe output | `shared/domain.js`, schemas, React text rendering/safe URLs | Unknown/invalid fields and provider schema/link tests. |
| Browser request boundary | Bearer auth and exact-origin CORS | Approved preflight204, denied origin403. CORS is not authentication. |
| Webhook integrity/replay/order | `features/integrations/webhook-auth.js` and durable inbox | Tampering, inconsistent metadata, duplicates, stale-version tests; historical manual receipts separately labelled. |
| Transaction/concurrency integrity | Locks, counters, leases, revisions | Duplicate/final-seat/cancellation and AI/receipt race tests. |
| Credential isolation | Server-only env/Admin key, gitignore, hosting artifact guard | Synthetic artifact rejection, hosted private URLs404 and redacted evidence. A user's own DevTools token is expected but must not be shared. |
| AI bounds/fallback | Schema/evidence validation; per-process concurrency/rate guards | Mocked policy/fallback/relevance/race tests. These are not distributed quotas or a general API firewall. |

See [evidence index](evidence/README.md) for dated results. No comprehensive
penetration test, distributed DDoS protection, legal audit or completed data purge
is claimed. No real AI credits or partner writes are required for automated checks.

## Incident procedure and remaining legal decisions

Privately notify the project contact, preserve minimal redacted evidence, identify
affected systems/data and contain through authorized actions. Assess scope,
severity and applicable regulator/data-subject notification duties with the
responsible controller. Record actions/recovery; rotate/revoke secrets only with
authorization and coordinate partner changes. Avoid publishing an active token
or personal records in a screenshot, repository or group chat.

Reference: [MDES-hosted English PDPA translation](https://www.mdes.go.th/law/detail/1909-Personal-Data-Protection-Act--B-E--2562--2019-).
Relevant topics include section23 notice, sections24/26 processing grounds,
sections28/29 transfers and sections30–37 rights/security. The Thai law and
applicable current subordinate rules prevail. This guide is not legal approval.

Before claiming full compliance: confirm controller details/basis and processor/
transfer arrangements; record the final evaluation date and carry out the manual
retention reviews; exercise the rights/incident procedure with genuine evidence.
Keep legal/operational confirmation separate from a passing software test.
