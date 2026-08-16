# 02 — MVP Requirements

## Events & Clubs

## 1. Functional Requirements

### FR-01 — View Published Activities

The system shall allow students to view a list of published campus events and club activities.

### FR-02 — View Activity Details

The system shall allow students to view the details of a selected activity, including its name, description, date/time, location, organizer, and registration status.

### FR-03 — Register for Activity

The system shall allow an eligible student to register for an available activity.

### FR-04 — Prevent Duplicate Registration

The system shall prevent the same student from registering more than once for the same activity.

### FR-05 — Registration Confirmation

The system shall display a clear confirmation after a registration is successfully completed.

### FR-06 — View Own Registrations

The system shall allow students to view activities for which they are currently registered.

### FR-07 — Cancel Registration

The system shall allow students to cancel their own valid registration.

### FR-08 — Create Activity

The system shall allow an authorized organizer to create an event or club activity as a draft.

### FR-09 — Publish Activity

The system shall allow an authorized organizer to publish an activity that they manage after all required information is present.

### FR-10 — Update Activity

The system shall allow an authorized organizer to update information for an activity that they manage.

### FR-11 — View Activity Registrations

The system shall allow an authorized organizer to view the students registered for an activity that they manage.

### FR-12 — User Authentication

The system shall authenticate users before allowing protected operations.

### FR-13 — Role Identification

The system shall identify the authenticated user's role for authorization checks.

---

# 2. Non-Functional Requirements

### NFR-01 — Usability

During usability testing, at least 80% of representative student participants shall complete the discovery-to-registration journey without assistance.

### NFR-02 — Performance

For the expected classroom-demonstration load, 95% of ordinary API requests shall complete within 2 seconds, excluding third-party authentication redirects.

### NFR-03 — Security

Only authenticated users shall be allowed to perform protected student or organizer operations. Secrets shall remain server-side and outside source control.

### NFR-04 — Authorization

The backend and database shall verify that users can access or modify only information permitted by their role and resource ownership.

### NFR-05 — Reliability

The system shall provide clear success or error feedback when registration, cancellation, publishing, or updating cannot be completed.

### NFR-06 — Maintainability

The system structure and project documentation shall be simple enough for a five-member student team to understand, test, and maintain during one semester.

### NFR-07 — Cost

The MVP shall operate within a **0 THB deployment budget** and should use services that can remain within appropriate free-tier limits.

### NFR-08 — Responsiveness

The main student and organizer journeys shall remain usable without horizontal scrolling at viewport widths from 360 px through 1440 px.

### NFR-09 — Data Integrity

Database constraints and atomic backend operations shall prevent invalid relationships and more than one active registration per student and activity.

---

# 3. Business Rules

### BR-01 — One Active Registration

A student may have only one active registration for the same activity.

### BR-02 — Published Activity

Students may register only for activities that are currently published and available for registration.

### BR-03 — Registration Ownership

A student may view or cancel only their own registrations.

### BR-04 — Activity Ownership

An organizer may update and manage registrations only for activities that they are authorized to manage.

### BR-05 — Required Activity Information

An activity cannot be published unless the minimum required information has been provided.

Minimum information should include:

* Activity name
* Description
* Activity type
* Date and time
* Location
* Organizer
* Registration availability

### BR-06 — Cancellation

Cancellation shall remove or change the student's active registration so that the student is no longer considered registered for that activity.

### BR-07 — Valid Activity Status

Activity status shall use `DRAFT`, `PUBLISHED`, or `CLOSED`. Drafts are visible only to their organizer, published activities are visible and open for registration, and closed activities reject new registrations.

### BR-08 — Valid Registration Status

Registration status shall use `ACTIVE` or `CANCELLED`.

### BR-09 — Role Restrictions

Only authorized Organizers may create, publish, or modify activities. Students may manage only their own registrations.

### BR-10 — No Duplicate Active Registration

The database shall allow at most one `ACTIVE` registration for each `student_id + activity_id` pair while retaining cancelled history.

> **Needs validation:** Registration deadlines and maximum participant limits should become additional business rules only if Team 12 confirms that the MVP requires them.

---

# 4. Permissions / Roles

| Role              | Main Permissions                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Student**       | View published activities, view activity details, register, view own registrations, cancel own registration   |
| **Organizer**     | Create activities, publish activities, update activities they manage, view registrations for their activities |

## Permission Principles

* Students cannot modify another student's registration.
* Students cannot publish or modify activities.
* Organizers cannot modify activities they do not manage.
* Organizer-only actions must not be available to normal students.
* The MVP has no Administrator role. Platform administration and long-term club membership management are outside scope.

---

# 5. Constraints

### CON-01 — Team Size

The system will be developed by a university project team of **5 students**.

### CON-02 — Time

The MVP must be realistically designed, implemented, tested, and documented within **one semester**.

### CON-03 — Budget

The deployment budget is **0 THB**.

### CON-04 — Simplicity

The architecture should remain understandable by the whole team.

### CON-05 — No Unnecessary Enterprise Infrastructure

The MVP shall not introduce microservices, Kubernetes, message queues, dedicated API gateways, multiple databases, distributed caching, or separate authentication infrastructure unless a later confirmed requirement makes one necessary.

### CON-06 — Free Tier

Selected services must remain within appropriate free-tier limits without requiring paid billing for the MVP.

## Scope Priority

Features that do not directly support the main Events & Clubs journey should not delay implementation. The project shall provide only the interfaces necessary to demonstrate that core journey.

---

# 6. Out-of-Scope

The following are not required for the first MVP:

* Online payments
* Paid event tickets
* Paid club memberships
* General club membership management
* A separate Administrator role or administration console
* Live chat
* Comments and reactions
* Social-media-style feeds
* AI event recommendations
* Personalized recommendation algorithms
* Gamification and reward points
* Advanced analytics dashboards
* Complex attendance analytics
* QR-code attendance check-in
* Event photo galleries
* Native Android or iOS applications
* External social-media publishing
* Real-time messaging
* Complex notification systems
* Enterprise-scale administration tools
* Advanced reporting
* Multi-university support

These features may be considered later only after the core Events & Clubs journey works successfully.

---

# MVP Requirement Boundary

The MVP is focused on:

**Organizer publishes activity → Student discovers activity → Student views details → Student registers → Registration is confirmed → Student can view or cancel their own registration**

Any requirement that does not meaningfully support this journey should normally remain outside the MVP.
