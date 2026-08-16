# 07 — Architecture Review and Decision Log

## Events & Clubs

**Team:** Team 12  
**Team Size:** 5 students  
**Review Scope:** `01_problem_discovery.md` through `06_PRD.md`  
**Constraints:** One semester, five students, 0 THB deployment budget

---

## 1. Executive Summary

The proposed React + Vite, Express, Supabase PostgreSQL/Auth, and Vercel architecture is appropriate for the MVP. It keeps one frontend, one API, and one relational database and does not introduce microservices or unnecessary storage.

The initial review found traceability, data-integrity, cancellation, authorization, failure-handling, and scope inconsistencies. The accepted changes are recorded below and have been incorporated into the supporting documents. User-problem validation and production deployment verification remain required before the project can be treated as fully validated.

**Architecture Score: 88/100**

**Status: READY WITH CHANGES**

Implementation may begin after owners accept the remaining Medium actions in this review. No unresolved Critical issue remains.

---

## 2. Findings

| ID | Area | Problem | Why it matters | Severity | Recommended change | Current state |
|---|---|---|---|---|---|---|
| DATA-01 | Registration integrity | The original unique constraint covered every registration, while the rule prohibited only duplicate active registrations | A cancelled student could never register again | High | Use a partial unique index on `(student_id, activity_id)` where status is `ACTIVE` | Accepted and documented |
| API-01 | Cancellation | Cancellation was a preserved status change but the API used `DELETE` | Implementations could permanently delete registration history | High | Use `PATCH /api/registrations/:id/cancel` and make repeated cancellation idempotent | Accepted and documented |
| REL-01 | Failure handling | Network, retry, database, authentication, and simultaneous-request behavior was missing | The core registration journey could return inconsistent or misleading results | High | Define error codes, atomic behavior, safe retries, and rollback expectations | Accepted and documented |
| SEC-01 | Authentication boundary | The documents did not explain how Express trusts a Supabase identity or role | A client-supplied role or exposed service key could allow unauthorized access | High | Verify the Supabase token in the API, load a protected role, keep privileged keys server-side, and enforce ownership | Accepted and documented |
| DOC-01 | Traceability | Functional and non-functional IDs changed between Requirements and PRD | Tests and implementation tasks could refer to different behavior under the same ID | High | Preserve the PRD ID set in the upstream requirement document | Accepted and documented |
| SCOPE-01 | Unconfirmed features | Administrator, AI, and webhook capabilities appeared without a confirmed MVP need | They increase scope, security work, and delivery risk | High | Exclude Administrator, AI, webhook, and club-membership management unless separately approved | Accepted and documented |
| API-02 | Publishing | The API listed create/update but did not state how publishing occurs | The organizer journey was not fully implementable from the API notes | Medium | Publish through the activity PATCH operation and validate required fields | Accepted and documented |
| DATA-02 | Activity lifecycle | `DRAFT`, `PUBLISHED`, and `CLOSED` lacked precise behavior | Visibility and registration eligibility could differ between frontend and backend | Medium | Define visibility, registration behavior, and reopening policy | Accepted and documented |
| UX-01 | Interface states | Loading, empty, denied, and failure states were omitted | The main journey could become confusing during ordinary failures | Medium | Require standard states for every data-driven screen | Accepted and documented |
| DEP-01 | Express deployment | The stack named Vercel but treated Express like a conventional persistent server | Serverless runtime assumptions could cause session or background-task bugs | Medium | Document one stateless Vercel Function and production endpoint verification | Accepted and documented |
| VAL-01 | Product evidence | Problem and workflow claims are still hypotheses | A technically correct product may solve the wrong problem | Medium | Complete student and organizer validation before freezing the backlog | Pending validation |
| COST-01 | Free tiers | Free-plan conditions can change | The 0 THB constraint could be violated unexpectedly | Medium | Recheck official pricing before deployment and before the final demonstration | Pending recurring check |

---

## 3. Requirement Fit

The architecture supports every confirmed MVP capability:

| Requirement group | Responsible component |
|---|---|
| Activity discovery and details | React frontend, Express read endpoints, PostgreSQL Activity table |
| Registration and cancellation | Express business logic, Registration table, active-only unique index |
| Organizer creation and publishing | Organizer UI, protected Express endpoints, Activity ownership rules |
| Authentication | Supabase Auth |
| Authorization | Express token verification and role/ownership checks, with database rules as defense in depth |
| Responsive interface | React + Tailwind CSS |
| Zero-budget deployment | Vercel Hobby and Supabase Free, subject to current plan limits |

No confirmed requirement needs microservices, queues, Redis, object storage, real-time messaging, AI, or a separate Administrator application.

---

## 4. Data and Concurrency Review

The relational model is a good fit for User, Activity, and Registration relationships. The following invariants must be implemented at the database boundary:

1. `User.university_id` is unique.
2. Foreign keys prevent orphan Activity and Registration records.
3. Controlled values restrict roles and statuses.
4. A partial unique index allows at most one `ACTIVE` registration for a student and activity.
5. Registration creation is atomic; simultaneous conflicts return `409 Conflict`.
6. Cancellation changes status and timestamps without deleting history.
7. Only the responsible organizer can modify an activity or view its private registration list.

Frontend availability checks are advisory. They must never be the only protection against conflicting registrations.

---

## 5. Authentication and Authorization Review

The approved trust flow is:

```text
Browser
  → Supabase Auth sign-in
  → access token
  → Express API verifies token
  → API loads protected role and resource ownership
  → authorized PostgreSQL operation
```

The frontend may hide unavailable controls for usability, but security decisions occur in the API and database. The client cannot choose its trusted role. Service-role credentials must never be shipped to the browser or committed to Git.

---

## 6. Failure and Recovery Review

The PRD now defines expected responses for invalid input, missing authentication, forbidden access, missing resources, simultaneous registration, repeated cancellation, network ambiguity, database failure, and authentication-provider unavailability.

Required implementation tests include:

- two simultaneous registrations produce one active row;
- a retry after a lost response does not create a duplicate;
- repeated cancellation remains successful and preserves history;
- an organizer cannot access another organizer's registrations;
- a Student cannot promote their own role;
- a database failure never produces a success message;
- production frontend routes and API routes both work on Vercel.

---

## 7. Simplicity, Cost, and Maintainability

The architecture remains intentionally small:

```text
React + Vite frontend
        ↓
Express REST API on Vercel
        ↓
Supabase Auth + PostgreSQL
```

This is feasible for five students if the team avoids optional infrastructure. The primary operational risks are free-plan changes, Supabase inactivity pausing, serverless runtime assumptions, and unclear ownership of deployment configuration.

The team should record the date and links used for every free-tier check. A free allowance is not the same as a guaranteed permanent zero-cost service.

---

## 8. Role-Perspective Review Summary

### Product Manager

The core journey and out-of-scope boundary are clear. Product assumptions still require interviews and prototype validation before they should be presented as confirmed facts.

### Frontend UX/UI

The three main student screens are sufficient for an MVP. Loading, empty, validation, success, network-error, and permission-denied states are now required. Organizer screens should reuse the same application.

### Backend API and Database

The API boundary and relational model are appropriate. The partial unique index, atomic registration operation, soft cancellation, consistent error shape, and explicit publishing operation are mandatory implementation details.

### Quality and Security

Authentication and authorization are correctly separated after revision. Automated tests must prioritize ownership, simultaneous registration, retry behavior, state transitions, and sanitized errors/logging.

### Delivery and Document

The stack is feasible within one semester, but production deployment should be proven early. Free-tier terms must be rechecked rather than copied forward indefinitely.

> Team 12 must add each student's name beside their assigned perspective before submission; this consolidated review does not replace evidence of individual participation.

---

## 9. Decision Log

| Finding ID | Decision | Document change made | Owner | Reason |
|---|---|---|---|---|
| DATA-01 | Accept | Active-only PostgreSQL uniqueness documented | Backend API and Database | Preserve history while preventing active duplicates |
| API-01 | Accept | Cancellation changed from DELETE to an idempotent PATCH operation | Backend API and Database | Match the cancellation business rule |
| REL-01 | Accept | Failure-scenario table and response expectations added | Quality and Security | Make retries and failures testable |
| SEC-01 | Accept | Trusted token/role/ownership flow documented | Quality and Security | Prevent client-controlled authorization |
| DOC-01 | Accept | Requirement IDs aligned across Requirements and PRD | Delivery and Document | Restore traceability |
| SCOPE-01 | Accept | Unconfirmed Administrator, AI, webhook, and membership features excluded | Product Manager | Protect MVP scope |
| API-02 | Accept | Publishing defined as a validated activity status update | Backend API and Database | Complete organizer workflow |
| DATA-02 | Accept | Activity lifecycle semantics documented | Backend API and Database | Prevent inconsistent eligibility behavior |
| UX-01 | Accept | Required interface states added | Frontend UX/UI | Make ordinary states and failures understandable |
| DEP-01 | Accept | Stateless Vercel Function deployment documented | Delivery and Document | Match the selected runtime |
| VAL-01 | Defer | Validation plan retained as a required pre-backlog activity | Product Manager | Requires real user evidence, not document editing |
| COST-01 | Accept | Free-tier recheck added as a recurring release task | Delivery and Document | Pricing and limits can change |

---

## 10. Final Checklist

- [x] Requirements map to architecture components.
- [x] Requirement IDs are stable.
- [x] Duplicate active registrations are prevented at the database boundary.
- [x] Cancellation preserves history and is idempotent.
- [x] Authentication and authorization trust boundaries are explicit.
- [x] Failure scenarios and error behavior are documented.
- [x] Unconfirmed optional services are outside the MVP.
- [ ] Student and organizer assumptions have real validation evidence.
- [ ] Each reviewer name and individual contribution are recorded.
- [ ] The selected stack has been deployed and smoke-tested in production.
- [ ] Free-tier conditions have been rechecked immediately before deployment.

The architecture should move to **READY** after the four unchecked items are completed and no new High or Critical issue is found.
