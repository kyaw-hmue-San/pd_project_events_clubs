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

### FR-08 — Publish Activity

The system shall allow an authorized organizer to create and publish an event or club activity.

### FR-09 — Update Activity

The system shall allow an authorized organizer to update information for an activity that they manage.

### FR-10 — View Activity Registrations

The system shall allow an authorized organizer to view the students registered for an activity that they manage.

---

# 2. Non-Functional Requirements

### NFR-01 — Performance

Normal user actions such as viewing activities, opening activity details, and submitting registration should provide a response within a reasonable time under expected university-project usage.

### NFR-02 — Security

Only authenticated users shall be allowed to perform actions that require a student, organizer, or administrator identity.

### NFR-03 — Authorization

The system shall verify that users can access or modify only information permitted by their assigned role and ownership.

### NFR-04 — Usability

The main student journey shall be understandable and completable without requiring technical knowledge or additional instructions.

### NFR-05 — Reliability

The system shall provide clear success or error feedback when registration, cancellation, publishing, or updating cannot be completed.

### NFR-06 — Cost

The MVP shall operate within a **0 THB deployment budget** and should use services that can remain within appropriate free-tier limits.

### NFR-07 — Maintainability

The system structure and project documentation shall be simple enough for a five-member student team to understand, test, and maintain during one semester.

---

# 3. Business Rules

### BR-01 — One Registration per Student

A student may have only one active registration for the same activity.

### BR-02 — Published Activities

Students may register only for activities that are currently published and available for registration.

### BR-03 — Registration Ownership

A student may view or cancel only their own registrations.

### BR-04 — Organizer Ownership

An organizer may update and manage registrations only for activities that they are authorized to manage.

### BR-05 — Required Activity Information

An activity cannot be published unless the minimum required information has been provided.

Minimum information should include:

* Activity name
* Description
* Date and time
* Location
* Organizer
* Registration information

### BR-06 — Cancellation

Cancellation shall remove or change the student's active registration so that the student is no longer considered registered for that activity.

### BR-07 — Registration Availability

The system shall reject a registration when the selected activity is no longer available for registration.

> **Needs validation:** Registration deadlines and maximum participant limits should become additional business rules only if Team 12 confirms that the MVP requires them.

---

# 4. Permissions / Roles

| Role              | Main Permissions                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Student**       | View published activities, view activity details, register, view own registrations, cancel own registration   |
| **Organizer**     | Create activities, publish activities, update activities they manage, view registrations for their activities |
| **Administrator** | Manage platform-level information or users only if an administrator role is confirmed as necessary            |

## Permission Principles

* Students cannot modify another student's registration.
* Students cannot publish or modify activities.
* Organizers cannot modify activities they do not manage.
* Organizer-only actions must not be available to normal students.
* Administrator permissions should remain minimal if the role is included.

> **Decision required:** Team 12 should confirm whether a separate **Administrator** is necessary for the MVP. If not, the MVP can remain focused on Student and Organizer roles.

---

# 5. Constraints

### CON-01 — Team Size

The system will be developed by a university project team of **5 students**.

### CON-02 — Development Time

The MVP must be realistically designed, implemented, tested, and documented within **one semester**.

### CON-03 — Deployment Budget

The deployment budget is **0 THB**.

### CON-04 — Free-Tier Services

Any later technology or external service selection should be capable of operating within an appropriate free tier without requiring paid billing for the MVP.

### CON-05 — Simplicity

The architecture and implementation shall avoid unnecessary enterprise-level complexity.

### CON-06 — MVP Priority

Features that do not directly support the main Events & Clubs journey should not delay implementation of the core MVP.

### CON-07 — Core Interface

The project shall provide the required core user interfaces necessary to demonstrate the main Events & Clubs user journey.

---

# 6. Out-of-Scope

The following are not required for the first MVP:

* Online payments
* Paid event tickets
* Paid club memberships
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
