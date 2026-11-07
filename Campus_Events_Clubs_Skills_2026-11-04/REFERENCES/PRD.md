# Product Requirements Document (PRD)

**Digital Campus → Campus Services**

## Events & Clubs

**Team:** Team 12
**Team Size:** 5 students
**Course:** Platform Development
**Project:** Digital Campus → Campus Services
**Development Period:** One semester
**Deployment Budget:** 0 THB
**Document Status:** MVP PRD

---

# 1. Product Overview

## 1.1 Product Name

**Campus Events & Clubs**

Working product name. The team may rename the product later.

## 1.2 Product Description

Campus Events & Clubs is a university platform that provides one place for students to discover campus events and club activities, view activity information, register for activities, and cancel their own registrations.

Authorized organizers can publish activities and manage registrations.

The MVP focuses on one core value:

> **Allow a student to discover a campus activity, understand its details, register successfully, and manage their own registration.**

## 1.3 Problem

Students may find it difficult to discover campus events and club activities when information is distributed through different communication channels.

Students may also have difficulty knowing:

* Which activities are available
* Where and when an activity takes place
* Whether they have successfully registered
* How to cancel their registration

Organizers also need a clear way to publish activity information and manage student registrations.

> These problem statements are assumptions that should be validated with actual university users.

## 1.4 Product Goal

Provide a simple campus service that connects students with university events and clubs while giving organizers a consistent way to publish activities and manage registrations.

---

# 2. Scope

## 2.1 MVP In Scope

The MVP will provide:

1. Published event and club activity listing
2. Activity details
3. Student registration
4. Registration confirmation
5. Student registration history/status
6. Student registration cancellation
7. Organizer activity creation
8. Organizer activity publishing
9. Organizer activity updating
10. Organizer registration viewing
11. Authentication
12. Role-based authorization
13. Responsive web interface
14. REST API
15. Automated testing of important business rules
16. Free-tier deployment

## 2.2 MVP Out of Scope

The MVP will not include:

* Online payments
* Paid event tickets
* Paid club memberships
* General club membership management
* Live chat
* Comments
* Likes/reactions
* Social-media feeds
* AI recommendation algorithms
* Complex personalization
* Gamification
* Advanced analytics
* Complex attendance analytics
* QR-code check-in
* Native Android application
* Native iOS application
* External social-media publishing
* Real-time messaging
* Enterprise administration tools
* A separate Administrator role or administration console
* Multi-university support

---

# 3. User Roles and Permissions

## 3.1 Student

### Goal

Discover and participate in campus activities.

### Permissions

A Student can:

* View published activities
* View activity details
* Register for an activity
* View their own registrations
* Cancel their own registration

A Student cannot:

* Create activities
* Modify activities
* View another student's private registration information
* Manage another user's registration

---

## 3.2 Organizer

### Goal

Publish campus activities and manage participation.

### Permissions

An Organizer can:

* Create an activity
* Publish an activity
* Update activities they manage
* View registrations for activities they manage

An Organizer cannot:

* Modify another organizer's activities
* Access unrelated activity registration data

---

## 3.3 Administrator

The MVP does not include an Administrator role. Student and Organizer are the only application roles. Administration features require a future, separately approved requirement and threat review.

---

# 4. Core User Journey

## 4.1 Core Happy Path

```text
Student
   ↓
Open Events & Clubs
   ↓
Browse activities
   ↓
Select activity
   ↓
View activity details
   ↓
Register
   ↓
Registration confirmed
   ↓
View own registration
```

## 4.2 Cancellation Journey

```text
Student
   ↓
Open My Registrations
   ↓
Select registered activity
   ↓
Cancel registration
   ↓
Confirm cancellation
   ↓
Registration becomes Cancelled
```

## 4.3 Organizer Journey

```text
Organizer
   ↓
Create activity
   ↓
Enter required information
   ↓
Publish activity
   ↓
Students can discover activity
   ↓
View registrations
```

---

# 5. Functional Requirements

## Student Requirements

### FR-01 — View Published Activities

The system shall allow students to view a list of published campus events and club activities.

### FR-02 — View Activity Details

The system shall allow students to view the details of an activity.

Activity details shall include, at minimum:

* Activity name
* Description
* Activity type
* Date and time
* Location
* Organizer
* Registration availability/status

### FR-03 — Register for Activity

The system shall allow an eligible student to register for an available activity.

### FR-04 — Prevent Duplicate Registration

The system shall prevent the same student from creating more than one active registration for the same activity.

### FR-05 — Registration Confirmation

The system shall show a clear confirmation after successful registration.

### FR-06 — View Own Registrations

The system shall allow a student to view their own registrations.

### FR-07 — Cancel Registration

The system shall allow a student to cancel their own active registration.

---

## Organizer Requirements

### FR-08 — Create Activity

The system shall allow an authorized organizer to create an activity.

### FR-09 — Publish Activity

The system shall allow an authorized organizer to publish an activity.

### FR-10 — Update Activity

The system shall allow an organizer to update activities that they manage.

### FR-11 — View Activity Registrations

The system shall allow an authorized organizer to view registrations for activities they manage.

---

## Authentication Requirements

### FR-12 — User Authentication

The system shall authenticate users before allowing protected operations.

### FR-13 — Role Identification

The system shall identify the user's role for authorization.

---

# 6. Non-Functional Requirements

## NFR-01 — Usability

During usability testing, at least 80% of representative student participants shall complete the discovery-to-registration journey without assistance.

## NFR-02 — Performance

For the expected classroom-demonstration load, 95% of ordinary API requests shall complete within 2 seconds, excluding third-party authentication redirects.

## NFR-03 — Security

Protected operations shall require authentication. Secrets shall remain server-side and outside source control.

## NFR-04 — Authorization

The backend and database shall enforce role and resource-ownership permissions for every protected operation.

## NFR-05 — Reliability

The system shall provide clear success and error feedback.

## NFR-06 — Maintainability

The implementation shall remain understandable and maintainable by a five-person student team.

## NFR-07 — Cost

The deployed MVP shall operate within a **0 THB budget** using free-tier services.

## NFR-08 — Responsiveness

The main student and organizer journeys shall remain usable without horizontal scrolling at viewport widths from 360 px through 1440 px.

## NFR-09 — Data Integrity

Database constraints and atomic backend operations shall prevent invalid relationships and more than one active registration per student and activity.

---

# 7. Business Rules

## BR-01 — One Active Registration

A student may have only one active registration for the same activity.

## BR-02 — Published Activity

Students may register only for activities that are published and available for registration.

## BR-03 — Registration Ownership

A student may view and cancel only their own registrations.

## BR-04 — Activity Ownership

An organizer may update and manage only activities they are authorized to manage.

## BR-05 — Required Activity Information

An activity cannot be published without the required information.

Required information:

* Title
* Description
* Activity type
* Date/time
* Location
* Organizer
* Registration availability

## BR-06 — Cancellation

Cancellation changes an active registration to a cancelled state.

The registration should not need to be permanently deleted.

## BR-07 — Valid Activity Status

Activity status shall use controlled values such as:

```text
DRAFT
PUBLISHED
CLOSED
```

`DRAFT` is visible only to its organizer, `PUBLISHED` is visible and open for registration, and `CLOSED` remains visible but rejects new registrations. Changing an activity to `PUBLISHED` requires all BR-05 fields. Reopening a closed activity is outside the MVP unless the team adds an explicit rule.

## BR-08 — Valid Registration Status

Registration status shall use controlled values such as:

```text
ACTIVE
CANCELLED
```

## BR-09 — Role Restrictions

Only authorized organizers may create or modify activities.

## BR-10 — No Duplicate Active Registration

The database shall enforce uniqueness for active registrations:

```text
student_id + activity_id
```

In PostgreSQL, this shall be implemented as a partial unique index applying only when `status = 'ACTIVE'`. Cancelled registration history is retained, and a student may register again later if the activity remains available.

---

# 8. Data Model

The MVP uses three main entities.

## 8.1 User

| Field           | Description            |
| --------------- | ---------------------- |
| `user_id`       | Unique user identifier |
| `university_id` | University identifier  |
| `name`          | User display name      |
| `email`         | University email       |
| `role`          | Student/Organizer      |
| `created_at`    | Creation timestamp     |

### Relationships

* One Organizer can manage many Activities.
* One Student can have many Registrations.

---

## 8.2 Activity

| Field           | Description                |
| --------------- | -------------------------- |
| `activity_id`   | Unique activity identifier |
| `title`         | Activity name              |
| `description`   | Activity description       |
| `activity_type` | Event or Club Activity     |
| `date_time`     | Activity date/time stored in UTC and displayed in the campus time zone |
| `location`      | Activity location          |
| `organizer_id`  | Responsible organizer      |
| `status`        | Draft/Published/Closed     |
| `created_at`    | Creation timestamp         |
| `updated_at`    | Last update timestamp      |

### Relationships

* One Activity belongs to one Organizer.
* One Activity can have many Registrations.

---

## 8.3 Registration

| Field             | Description                    |
| ----------------- | ------------------------------ |
| `registration_id` | Unique registration identifier |
| `student_id`      | Registered student             |
| `activity_id`     | Selected activity              |
| `status`          | Active/Cancelled               |
| `registered_at`   | Registration timestamp         |
| `cancelled_at`    | Cancellation timestamp         |

### Relationships

* One Student can have many Registrations.
* One Activity can have many Registrations.

---

## 8.4 Data Integrity

Important database constraints include:

```text
User.university_id
    → UNIQUE

Registration(student_id, activity_id)
    → UNIQUE WHERE status = 'ACTIVE'

Registration.student_id
    → User.user_id

Registration.activity_id
    → Activity.activity_id

Activity.organizer_id
    → User.user_id
```

The system shall also validate allowed values for:

```text
User.role
Activity.status
Activity.activity_type
Registration.status
```

---

## 8.5 Data Privacy

### 8.5.1 Data That Should Not Be Stored

The MVP should not store unnecessary personal information such as:

* Home address
* National ID
* Passport information
* Financial information
* Academic grades
* Health information
* Location tracking
* Unnecessary social-media information

### 8.5.2 Sensitive Data

Sensitive information includes:

* University identity
* University email
* Authentication credentials
* User roles
* Activity registrations

Passwords, if applicable to the chosen authentication system, must never be stored as plain text.

---

# 9. Platform Architecture

## 9.1 Architecture Style

The MVP will use a simple web application architecture.

```text
                  ┌─────────────────────┐
                  │       Browser       │
                  │ Student / Organizer │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │     Web Frontend    │
                  │                     │
                  │ React + Vite        │
                  │ Tailwind CSS        │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │      REST API       │
                  │                     │
                  │ Node.js + Express   │
                  │                     │
                  │ Business Rules      │
                  │ Authorization       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │      Supabase       │
                  │                     │
                  │ Authentication      │
                  │ PostgreSQL          │
                  │                     │
                  │ User                │
                  │ Activity            │
                  │ Registration        │
                  └─────────────────────┘
```

## 9.2 Architecture Principles

The project will:

* Use one main application.
* Use one relational database.
* Keep the API layer simple.
* Avoid microservices.
* Avoid unnecessary infrastructure.
* Keep authentication centralized.
* Enforce authorization on protected operations.
* Prefer simple solutions over theoretical scalability.

---

# 10. Technology Stack

## Frontend

**React + Vite**

Used to build the student and organizer interfaces.

## Styling

**Tailwind CSS**

Used for responsive UI styling and reusable interface patterns.

## Backend

**Node.js + Express**

Used to provide the REST API and business logic.

## Database

**Supabase PostgreSQL**

Used to store:

* Users
* Activities
* Registrations

## Authentication

**Supabase Auth**

Used to authenticate users.

## Storage

**None for MVP**

No file-upload capability is required by the current MVP.

## Deployment

**Vercel + Supabase**

Vercel hosts the web application.

Supabase provides database and authentication services.

## Version Control

**Git + GitHub**

Used for source-code collaboration and version history.

---

# 11. API / Interfaces

The MVP will expose REST operations supporting the core workflows.

Minimum API operations include:

| Method | Endpoint                            | Purpose                       |
| ------ | ----------------------------------- | ----------------------------- |
| GET    | `/api/activities`                   | List published activities     |
| GET    | `/api/activities/:id`               | View activity details         |
| POST   | `/api/activities`                   | Create activity               |
| PATCH  | `/api/activities/:id`               | Update activity               |
| POST   | `/api/activities/:id/registrations` | Register student              |
| GET    | `/api/me/registrations`             | View own registrations        |
| PATCH  | `/api/registrations/:id/cancel`     | Soft-cancel registration      |
| GET    | `/api/activities/:id/registrations` | Organizer views registrations |

Publishing uses `PATCH /api/activities/:id` with `status: "PUBLISHED"`; the API validates BR-05 before changing the status. The exact request bodies and response schemas shall be recorded in the implementation API specification before endpoint development begins.

---

## 11.1 API Authorization

## Student

Allowed:

```text
GET published activities
GET activity details
POST own registration
GET own registrations
PATCH own registration to Cancelled
```

## Organizer

Allowed:

```text
POST activity
PATCH own activity
GET registrations for own activity
```

The API must reject unauthorized requests even if a user manually constructs the request.

---

## 11.2 User Interface

The MVP should focus on the core user journeys rather than creating many screens.

### Core Student Interface

### Screen 1 — Events & Clubs

Purpose:

* Browse activities
* Identify event/club type
* Select an activity

### Screen 2 — Activity Details

Purpose:

* Read activity information
* Check registration availability
* Register

### Screen 3 — My Registrations

Purpose:

* View registered activities
* Check registration status
* Cancel registration

Organizer functionality can reuse the same application and provide organizer-specific views/forms rather than requiring a separate application.

Every data-driven screen shall define loading, empty, success, validation-error, network-error, and permission-denied states. Destructive-looking actions such as cancellation require confirmation and must report the authoritative server result.

---

# 12. Security and Privacy

## 12.1 Authentication

Protected actions require an authenticated user. The client sends a Supabase access token to the Express API, and the API verifies that token before executing protected business logic.

## 12.2 Authorization

The system shall verify:

* User role
* Resource ownership
* Registration ownership

The client must not declare its own trusted role. The API shall load the role from protected server-side data or a protected token claim. Any Supabase service-role key must remain server-side; when used, the API must perform explicit role and ownership checks because service-role access can bypass Row Level Security.

## 12.3 Data Protection

The system shall minimize stored personal information.

## 12.4 Secrets

Secrets and credentials shall not be committed to source control.

Environment variables shall be used for deployment configuration.

## 12.5 Input Validation

API requests shall validate:

* Required fields
* Field formats
* Allowed status values
* User permissions
* Activity availability

---

# 13. Error Handling and Failure Scenarios

| Scenario | Required behavior | API response / recovery |
|---|---|---|
| Invalid or malicious input | Validate on the API before writing; database constraints remain the final integrity boundary | Return `400 Bad Request` with field-level errors and no partial write |
| Missing or invalid authentication | Reject the request before business logic runs | Return `401 Unauthorized` |
| Incorrect role or resource ownership | Do not reveal or modify protected data | Return `403 Forbidden` |
| Missing activity or registration | Do not create related orphan records | Return `404 Not Found` |
| Duplicate or simultaneous registration | Perform registration atomically and rely on the partial unique index for the final decision | One request succeeds; conflicting requests return `409 Conflict` |
| Repeated cancellation | Treat cancellation as idempotent and preserve the cancelled record | Return the current cancelled state without creating another record |
| Network failure after submission | Allow a safe retry and refresh authoritative server state before reporting the final result | Show a retry option and retrieve the current registration state |
| Database failure | Roll back the operation and do not report success | Return `503 Service Unavailable` or `500 Internal Server Error`; log a sanitized diagnostic |
| Supabase Auth unavailable | Do not bypass authentication or trust client-supplied roles | Show a temporary-unavailability message and allow retry |

All error responses shall use a consistent JSON shape containing an application error code, a user-safe message, and optional field errors. Logs must not contain access tokens, passwords, or unnecessary personal data.

---

# 14. Deployment Plan

## Deployment Architecture

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Web Application
   └── Express API as one Vercel Function
          │
          ▼
      Supabase
       ├── Auth
       └── PostgreSQL
```

## Deployment Constraint

The project must remain within:

> **0 THB**

The team should use free-tier services and monitor usage.

The API shall remain stateless and shall not depend on background processes, local disk persistence, or in-memory sessions. Deployment verification must test both frontend routing and every API endpoint in the production environment.

No paid infrastructure should be required for the MVP.

---

# 15. Constraints

## CON-01 — Team Size

The project is developed by five university students.

## CON-02 — Time

The MVP must be completed within one semester.

## CON-03 — Budget

Deployment budget is 0 THB.

## CON-04 — Simplicity

The architecture should remain understandable by the whole team.

## CON-05 — No Unnecessary Enterprise Infrastructure

The MVP will not introduce:

* Microservices
* Kubernetes
* Message queues
* Dedicated API gateways
* Multiple databases
* Distributed caching
* Separate authentication infrastructure

unless a later confirmed requirement makes one necessary.

## CON-06 — Free Tier

Services must remain within appropriate free-tier limits.

---

# 16. Risks and Mitigations

## Risk 1 — Scope Creep

### Risk

The team may add social features, recommendations, chat, analytics, or other features before completing the core journey.

### Mitigation

Prioritize:

```text
Discover
→ View
→ Register
→ Confirm
→ Cancel
```

---

## Risk 2 — Incorrect Authorization

### Risk

Users may access data belonging to other users.

### Mitigation

Enforce role and ownership checks at the API/database level.

---

## Risk 3 — Duplicate Registration

### Risk

A student may register multiple times.

### Mitigation

Use database uniqueness constraints and server-side validation.

---

## Risk 4 — Free-Tier Limitations

### Risk

Free services may have usage or inactivity limits.

### Mitigation

Monitor usage and verify deployments before demonstrations.

---

## Risk 5 — Team Coordination

### Risk

Five developers working on the same codebase can introduce conflicts.

### Mitigation

Use:

* Git branches
* Pull requests
* Code reviews
* Clear ownership of modules
* Shared API/data contracts

---

## Risk 6 — Insufficient Testing

### Risk

Registration and authorization bugs may remain hidden.

### Mitigation

Prioritize automated tests around business-critical operations.

---

# 17. Acceptance Criteria

## 17.1 Testing Strategy

The project should prioritize tests for the highest-risk business rules.

Important test cases include:

1. Student can view published activities.
2. Student can view activity details.
3. Student can register successfully.
4. Duplicate registration is rejected.
5. Student can view their own registration.
6. Student can cancel their registration.
7. Student cannot cancel another student's registration.
8. Organizer can create an activity.
9. Organizer can update their own activity.
10. Organizer cannot modify another organizer's activity.
11. Organizer can view registrations for their own activity.
12. Student cannot access organizer-only operations.

The final automated test count should satisfy the course/project requirement while prioritizing meaningful business behavior rather than superficial coverage.

---

## 17.2 Acceptance Checks

The MVP is considered successful when all of the following observable checks pass:

- [ ] **AC-FR-01:** An unauthenticated visitor sees only activities whose status is `PUBLISHED`; drafts are absent.
- [ ] **AC-FR-02:** Selecting an activity displays title, description, type, date/time, location, organizer, and registration availability.
- [ ] **AC-FR-03:** An authenticated Student registers for an available activity and receives a success response containing the new active registration.
- [ ] **AC-FR-04:** Two simultaneous registration requests for the same student and activity produce exactly one active registration; the conflicting request receives `409 Conflict`.
- [ ] **AC-FR-05:** After success, the interface shows confirmation and the registration appears in My Registrations after refresh.
- [ ] **AC-FR-06:** A Student can retrieve their registrations but cannot retrieve another student's private registration list.
- [ ] **AC-FR-07:** Cancelling changes `ACTIVE` to `CANCELLED`, records `cancelled_at`, preserves history, and is safe to repeat.
- [ ] **AC-FR-08/09:** An Organizer can create a draft and publish it only after every field required by BR-05 is present.
- [ ] **AC-FR-10/11:** An Organizer can update and view registrations only for activities they manage.
- [ ] **AC-FR-12/13:** Missing authentication returns `401`; an authenticated user without role or ownership permission receives `403` and no protected data.
- [ ] **AC-NFR-01:** At least 80% of representative student test participants complete discovery through registration without assistance.
- [ ] **AC-NFR-02:** Under the agreed classroom-demonstration test load, 95% of ordinary API requests complete within 2 seconds.
- [ ] **AC-DEPLOY:** The production MVP is accessible through HTTPS and operates without paid infrastructure or a required paid billing plan.

---

## 17.3 MVP Success Definition

The most important success condition is:

> **A student can discover a campus activity, understand its details, register successfully, see their registration, and cancel it when necessary.**

The platform should also demonstrate that organizers can publish activities and manage participation.

The project should prioritize a reliable core journey over a large number of secondary features.

---

# 18. Future Improvements

Possible future improvements include:

* Event capacity management
* Registration deadlines
* Club profile pages
* Club membership management
* Attendance tracking
* QR-code check-in
* Notifications
* Calendar integration
* Activity images
* Search and filtering
* Personalized recommendations
* Advanced analytics
* Mobile applications
* External social-media sharing
* More advanced AI assistance

These are not required for the first MVP.

---

## 18.1 Final Product Boundary

## Core MVP

```text
                 ORGANIZER
                     │
                     ▼
              Publish Activity
                     │
                     ▼
                  ACTIVITY
                     │
                     ▼
                  STUDENT
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       Discover              Details
          │                     │
          └──────────┬──────────┘
                     ▼
                 Register
                     │
                     ▼
                Confirmation
                     │
                     ▼
              My Registrations
                     │
                     ▼
                  Cancel
```

## Final Stack

```text
Frontend      React + Vite
Styling       Tailwind CSS
Backend       Node.js + Express
API           REST
Database      Supabase PostgreSQL
Auth          Supabase Auth
Storage       None for MVP
Deployment    Vercel + Supabase
Version Ctrl  Git + GitHub
```

## Final Architecture Principle

> **Keep the architecture simple enough for five students to build, test, explain, and deploy within one semester and 0 THB.**
