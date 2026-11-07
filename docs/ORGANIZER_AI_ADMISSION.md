# AI Organizer admission — confirmed policy

Policy: CAMPUS_ORGANIZER_V1. Confirmed by the user on 2026-11-06.
The user chose **any verified Google applicant, including personal accounts**.
This is the bounded exception to the earlier Admin-only admission workflow.
Admin appointment and all unrelated role/ownership boundaries remain unchanged.

## Exact automatic-approval criteria

Server preconditions: verified/revocation-checked Google token, enabled account,
matching current account/email, request still PENDING at its original revision,
unmodified application text, active processing deadline and eligible profile
(not Admin, already Organizer or disabled). Personal accounts do not need a
Student profile. Enrollment as a Student still requires the exact school domain
and separately supplied unique university ID; approval never enrolls a Student.

Every application must explicitly establish:

1. A specific, legitimate campus activity.
2. Its purpose and intended audience.
3. A named organization OR a clear independent-organizer identity.
4. The applicant's own organizing responsibilities.
5. Consistent information, no abuse/deception or instructions to bypass review,
   and no unresolved concerns in the assessment.

The model must provide exact supporting quotes from organization/reason for each
of the first four criteria. Server validates exact schema, bounded strings,
boolean types, quote presence in the application, all criteria met, consistent
and safe flags and no concerns. Explicit common bypass instructions independently
prevent auto-approval. No arbitrary confidence percentage is used.

These rules assess application information. A declared affiliation is not proof
of club membership, identity beyond the Google account or university endorsement.
AI judgments can still be imperfect; the UI displays evidence and decision source
instead of claiming institutional verification. This limitation was explained
before the user selected the personal-account-inclusive policy.

## Behavior and review

New submission is saved as PENDING before analysis. Only organization and reason
are sent to the server-configured AI/ML API model. UI discloses that processing.
No email, UID, university ID, Google token or roster is included in its prompt.

- All criteria pass AND explicit automatic-approval config is enabled: atomically
  update request/profile and create a source=AI decision audit. Applicant sees
  Approved automatically by AI and continues into Organizer workspace.
- Incomplete/unclear/contradictory application, concerns/bypass, provider outage,
  malformed/truncated response, missing config, changed/revoked/disabled identity
  or expired processing deadline: remain PENDING for Admin. **Never auto-reject.**
- Valid assessment with auto-approval disabled: shows criteria met but Admin must
  decide. No simulated AI approval or template approval.
- Admin sees analysis/evidence/concerns with existing Approve/Reject controls.
  AI and Admin decisions are labeled separately. Legacy decisions remain Admin.

Existing enrolled Students retain their university ID, name, registrations and
Student capability after promotion; new personal-account profiles get Organizer
only. Three primary role labels remain. AI never grants Admin access.

## Concurrency and failure boundaries

No network call runs inside a Firestore transaction. One private processing record
per request in organizerAiReviews stores revision, random lease, input hash and a
45-second deadline. Concurrent duplicate submissions return the existing request
without another model call. A new request binds the exact revision returned by
the submission transaction, not a later read that may have been resubmitted.

Before promotion reverify the original token/revocation, fetch current Auth user,
and transactionally recheck the request, input hash, lease/deadline and profile.
Admin decisions win if already committed. Old model results cannot overwrite a
rejection, resubmission, new lease or role/profile change. No destructive profile
rewrite. Decision audit for each AI-approved revision has a deterministic ID.

Provider timeout: 12 seconds; one call, max 1,300 output tokens, 64 KiB bounded
response; redirects refused. A process-local cap of 20 concurrent analyses falls
back to Admin rather than queueing unbounded provider work. A crash can leave a
processing marker: own/Admin reads expose manual review after its deadline.
There is no automatic background retry, bulk approval or startup migration.
Existing PENDING applications remain with Admin; new submissions/resubmissions
are assessed. Google Auth and Firestore are separate services, so revalidation
immediately precedes the transaction rather than claiming a cross-service lock.

Private credentials and provider responses are never logged or returned. The
bounded assessment/source/policy is visible only through existing own-request
and authorized Admin request projections. Private leases/audit internals stay
server-only. Existing inbox/outbox/partner paths are unchanged. No new index.

## Configuration

Existing ignored server backend/.env contains AIML_API_KEY/AIML_MODEL. Enable
real automatic approvals only after adopting this confirmed policy:

```dotenv
ORGANIZER_AI_AUTO_APPROVE=true
ORGANIZER_AI_POLICY=CAMPUS_ORGANIZER_V1
```

Missing/wrong policy or false/unset flag prevents automatic approval. Missing
provider config or provider failure also prevents it, even when the flag is true.
Set the flag false and restart to keep AI assessments but require Admin decisions.
No browser config, new secret or credential rotation is needed. No startup action
processes pending requests. Keep the existing chosen local API mode; facilities
settings are independent. Automated emulators disable real provider calls and use
explicit injected doubles for success/failure/race scenarios.

## Verification boundary

Isolated tests cover qualifying personal applicants, retained Student enrollment
and registration, incomplete/unavailable/disabled automatic approval, concurrent
duplicate submissions, Admin rejection races, resubmission races, changed account
state, strict schema/evidence and bypass text. Browser checks show approved,
manual-review and Admin-source views using synthetic provider responses. See
PROGRESS.md for final counts/evidence. These are not real applicant approvals,
proof of model accuracy or a new live provider verification.
