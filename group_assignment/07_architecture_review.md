# Product Requirements Document (PRD)

# Digital Campus → Campus Services

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
* Multi-university support

---

# 3. User Roles

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

An Administrator is **not required for the core MVP unless the university/project requirements confirm that one is necessary**.

If included, the Administrator should have only the minimum platform-management permissions required.

---

# 4. User Journey

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

The main student journey should be understandable without technical knowledge.

## NFR-02 — Performance

Normal operations such as viewing activities, viewing details, registering, and cancelling should respond within a reasonable time under expected university-project usage.

## NFR-03 — Security

Protected operations shall require authentication.

## NFR-04 — Authorization

The system shall enforce role and ownership permissions.

## NFR-05 — Reliability

The system shall provide clear success and error feedback.

## NFR-06 — Maintainability

The implementation shall remain understandable and maintainable by a five-person student team.

## NFR-07 — Cost

The deployed MVP shall operate within a **0 THB budget** using free-tier services.

## NFR-08 — Responsiveness

The web interface should work on common desktop and mobile browser sizes.

## NFR-09 — Data Integrity

The system shall prevent invalid relationships and duplicate registrations.

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

## BR-08 — Valid Registration Status

Registration status shall use controlled values such as:

```text
ACTIVE
CANCELLED
```

## BR-09 — Role Restrictions

Only authorized organizers may create or modify activities.

## BR-10 — No Duplicate Active Registration

The database shall enforce uniqueness for:

```text
student_id + activity_id
```

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
| `activity_type` | Event or Club              |
| `date_time`     | Activity date/time         |
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

# 9. Data Integrity

Important database constraints include:

```text
User.university_id
    → UNIQUE

Registration(student_id, activity_id)
    → UNIQUE

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

# 10. Data Privacy

## 10.1 Data That Should Not Be Stored

The MVP should not store unnecessary personal information such as:

* Home address
* National ID
* Passport information
* Financial information
* Academic grades
* Health information
* Location tracking
* Unnecessary social-media information

## 10.2 Sensitive Data

Sensitive information includes:

* University identity
* University email
* Authentication credentials
* User roles
* Activity registrations

Passwords, if applicable to the chosen authentication system, must never be stored as plain text.

---

# 11. Architecture

## 11.1 Architecture Style

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

## 11.2 Architecture Principles

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

# 12. Technology Stack

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

# 13. API Design

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
| DELETE | `/api/registrations/:id`            | Cancel registration           |
| GET    | `/api/activities/:id/registrations` | Organizer views registrations |

The exact API contract, request bodies, response structures, error codes, and authentication requirements should be documented before implementation.

---

# 14. API Authorization

## Student

Allowed:

```text
GET published activities
GET activity details
POST own registration
GET own registrations
DELETE own registration
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

# 15. User Interface

The MVP should focus on the core user journeys rather than creating many screens.

## Core Student Interface

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

---

# 16. Course-Level Platform Capabilities

Where required by the course/project brief, the completed platform should also demonstrate:

* Multiple meaningful UI journeys
* A REST API with at least the required number of operations
* An inter-team capability such as a webhook
* An AI-native capability
* Automated tests covering important business rules

These capabilities should be implemented without expanding the core product unnecessarily.

## 16.1 Inter-Team Capability

A lightweight webhook can be introduced for a meaningful system event, such as:

```text
Activity Published
        ↓
Webhook Event
        ↓
Another Campus Service
```

The webhook should be kept simple and should not require a message broker or microservice architecture.

## 16.2 AI-Native Capability

If an AI capability is required by the course, it should support an existing product task rather than create a new product area.

A suitable example is:

> **Organizer uses AI assistance to generate or improve an activity description from a short set of organizer-provided details.**

The organizer remains responsible for reviewing and approving the generated content.

AI recommendations, chatbots, and personalized recommendation systems are not required for the core product.

---

# 17. Security

## 17.1 Authentication

Protected actions require an authenticated user.

## 17.2 Authorization

The system shall verify:

* User role
* Resource ownership
* Registration ownership

## 17.3 Data Protection

The system shall minimize stored personal information.

## 17.4 Secrets

Secrets and credentials shall not be committed to source control.

Environment variables shall be used for deployment configuration.

## 17.5 Input Validation

API requests shall validate:

* Required fields
* Field formats
* Allowed status values
* User permissions
* Activity availability

---

# 18. Deployment

## Deployment Architecture

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Web Application
   └── API
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

No paid infrastructure should be required for the MVP.

---

# 19. Development Constraints

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

# 20. Risks

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

# 21. Testing Strategy

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

# 22. Acceptance Criteria

The MVP is considered successful when:

### AC-01 — Discovery

A student can open Events & Clubs and see published activities.

### AC-02 — Details

A student can select an activity and view its required information.

### AC-03 — Registration

A student can register for an available activity.

### AC-04 — Duplicate Prevention

A student cannot create a duplicate registration for the same activity.

### AC-05 — Confirmation

A successful registration produces clear confirmation.

### AC-06 — Registration Management

A student can view their own registrations.

### AC-07 — Cancellation

A student can cancel their own active registration.

### AC-08 — Organizer Publishing

An authorized organizer can create and publish an activity.

### AC-09 — Organizer Management

An organizer can update activities they manage.

### AC-10 — Registration Management

An organizer can view registrations for their own activities.

### AC-11 — Authorization

Unauthorized users cannot perform protected operations.

### AC-12 — Deployment

The MVP is accessible through its deployed environment without requiring paid infrastructure.

---

# 23. MVP Success Definition

The most important success condition is:

> **A student can discover a campus activity, understand its details, register successfully, see their registration, and cancel it when necessary.**

The platform should also demonstrate that organizers can publish activities and manage participation.

The project should prioritize a reliable core journey over a large number of secondary features.

---

# 24. Future Improvements

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

# 25. Final Product Boundary

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
