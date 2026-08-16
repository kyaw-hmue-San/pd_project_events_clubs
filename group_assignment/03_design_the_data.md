# 03 — Minimum Data Model

## Events & Clubs

For the MVP, the platform needs only **three main entities**:

1. User
2. Activity
3. Registration

This is enough to support the core journey:

**Organizer publishes activity → Student views activity → Student registers → Student views/cancels registration**

---

# 1. User

Represents a person who uses the platform.

### Important Fields

| Field           | Purpose                                       |
| --------------- | --------------------------------------------- |
| `user_id`       | Unique identifier for each user               |
| `university_id` | Identifies the university user                |
| `name`          | Display name                                  |
| `email`         | University email used for account identity    |
| `role`          | Student or Organizer                          |
| `created_at`    | Date/time the user record was created         |

### Relationships

* One **User acting as Organizer** can manage many Activities.
* One **Student User** can have many Registrations.

### Permissions

| Action | Permission                                             |
| ------ | ------------------------------------------------------ |
| Create | Created through the approved user/account process      |
| Read   | User can read their own basic information              |
| Update | User can update permitted information about themselves |
| Delete | Normal users should not directly delete other users    |

> Organizer and Student do **not** need separate tables. They are users with different roles.

---

# 2. Activity

Represents a draft, published, or closed campus event or club activity.

### Important Fields

| Field           | Purpose                           |
| --------------- | --------------------------------- |
| `activity_id`   | Unique identifier                 |
| `title`         | Activity name                     |
| `description`   | Activity information              |
| `activity_type` | Event or Club Activity            |
| `date_time`     | When the activity occurs, stored in UTC and displayed in the campus time zone |
| `location`      | Where the activity occurs         |
| `organizer_id`  | User responsible for the activity |
| `status`        | Draft, Published, or Closed       |
| `created_at`    | Record creation time              |
| `updated_at`    | Last update time                  |

### Relationships

* Each Activity belongs to **one Organizer User**.
* One Organizer may manage **many Activities**.
* One Activity may have **many Registrations**.

### Permissions

| Action                  | Student | Organizer                                       |
| ----------------------- | ------- | ----------------------------------------------- |
| Create                  | No      | Yes                                             |
| Read published activity | Yes     | Yes                                             |
| Update                  | No      | Only activities they manage                     |
| Delete                  | No      | Only their own activity, if deletion is allowed |

For the MVP, using a status such as `Closed` or removing publication may be safer than permanently deleting an activity that already has registrations.

---

# 3. Registration

Connects a Student to an Activity.

### Important Fields

| Field             | Purpose                         |
| ----------------- | ------------------------------- |
| `registration_id` | Unique registration identifier  |
| `student_id`      | Student who registered          |
| `activity_id`     | Activity selected               |
| `status`          | Active or Cancelled             |
| `registered_at`   | Registration date/time          |
| `cancelled_at`    | Cancellation time, if cancelled |

### Relationships

* Each Registration belongs to **one Student**.
* Each Registration belongs to **one Activity**.
* One Student can register for many Activities.
* One Activity can have many Students.

Therefore:

**User → Registration ← Activity**

This is a many-to-many relationship between students and activities, resolved through the Registration entity.

### Permissions

| Action | Student                      | Organizer                                |
| ------ | ---------------------------- | ---------------------------------------- |
| Create | Own registration             | No                                       |
| Read   | Own registrations            | Registrations for activities they manage |
| Update | Cancel own registration      | Normally no                              |
| Delete | No direct permanent deletion | No direct permanent deletion             |

For cancellation, the MVP should normally change:

`status = Active`

to:

`status = Cancelled`

instead of deleting the registration record.

---

# Simple Relationship Model

```text
USER
│
│ organizer_id
│
└──────────< ACTIVITY
               │
               │ activity_id
               │
               ▼
          REGISTRATION
               ▲
               │ student_id
               │
             USER
```

Or more simply:

```text
User (Organizer)
      │
      │ 1
      ▼
    Activity
      │
      │ 1
      ▼
 Registration
      ▲
      │ *
      │
User (Student)
```

---

# 1. Data That Should NOT Be Stored

The MVP should avoid collecting information that is unnecessary for the core Events & Clubs journey.

Do not store:

* Student home addresses
* Personal phone numbers unless genuinely required
* National ID/passport information
* Financial information
* Credit/debit card details
* Payment history
* Academic grades
* Full university academic records
* Health information
* Social media account information
* Personal interests for recommendation algorithms
* Chat histories
* Location tracking
* Unnecessary profile information

The MVP should collect only data required to identify users, publish activities, and manage registrations.

---

# 2. Sensitive Data

The following should be treated carefully:

### User Identity

* `university_id`
* University email
* User role

### Registration Information

A student's registrations reveal which campus events or clubs they participate in.

Students should therefore normally access only **their own registrations**.

### Authorization Information

The system must protect role information because changing a Student into an Organizer could give that user additional permissions.

### Authentication Credentials

Authentication information is sensitive.

**Plain-text passwords must never be stored.**

The exact authentication method will be decided later during architecture and technology selection.

---

# 3. Potential Duplicate or Inconsistent Data

## Duplicate Student Registration

### Problem

The same student could accidentally register twice for the same activity.

### Prevention

The combination:

```text
student_id + activity_id
```

should be unique.

---

## Duplicate User

### Problem

One person could accidentally receive multiple user records.

### Prevention

`university_id` should uniquely identify a user.

---

## Invalid Organizer

### Problem

An activity could reference a user who does not exist or who is not permitted to organize activities.

### Prevention

`organizer_id` must reference a valid User.

The system must also verify that the user has the Organizer permission.

---

## Invalid Registration

### Problem

A registration could reference a student or activity that no longer exists.

### Prevention

Both:

```text
student_id
activity_id
```

must reference valid records.

---

## Incorrect Registration Status

### Problem

A cancelled registration could still appear as active.

### Prevention

Registration status should use a controlled set of values such as:

```text
ACTIVE
CANCELLED
```

---

## Incorrect Activity Status

Activity status should also use a controlled set such as:

```text
DRAFT
PUBLISHED
CLOSED
```

Students should see and register only for activities that are `PUBLISHED` and available.

---

# 4. Important Database Constraints

### DB-01 — Unique User

`university_id` must be unique.

This prevents duplicate user accounts representing the same university user.

---

### DB-02 — Unique Active Registration

The combination of:

```text
student_id + activity_id
```

must be unique only for rows whose status is `ACTIVE`.

In PostgreSQL, implement this as a partial unique index. This prevents duplicate active registrations while allowing a student to register again after cancelling a previous registration.

---

### DB-03 — Valid Student Reference

`Registration.student_id` must reference an existing User.

---

### DB-04 — Valid Activity Reference

`Registration.activity_id` must reference an existing Activity.

---

### DB-05 — Valid Organizer Reference

`Activity.organizer_id` must reference an existing User.

---

### DB-06 — Required Activity Information

A published Activity must contain required information such as:

* Title
* Description
* Activity type
* Date/time
* Location
* Organizer
* Registration availability

---

### DB-07 — Controlled User Roles

The role should contain only approved values:

```text
STUDENT
ORGANIZER
```

---

### DB-08 — Controlled Registration Status

Registration status must contain only valid states such as:

```text
ACTIVE
CANCELLED
```

---

### DB-09 — Controlled Activity Status

Activity status must contain only defined values such as:

```text
DRAFT
PUBLISHED
CLOSED
```

---

### DB-10 — Controlled Activity Type

Activity type must contain only:

```text
EVENT
CLUB_ACTIVITY
```

This classification does not create club membership functionality.

---

### DB-11 — Ownership Validation

Only the organizer responsible for an Activity should be permitted to modify that Activity or access its registration list.

This rule must ultimately be enforced by the system rather than relying only on what buttons are displayed in the interface.

---

# MVP Data Model Summary

| Entity           | Why It Exists                               |
| ---------------- | ------------------------------------------- |
| **User**         | Identifies Students and Organizers          |
| **Activity**     | Stores published Events and Club activities |
| **Registration** | Records which Student joined which Activity |

No additional entity should be introduced unless a confirmed requirement needs it.

For example, a separate **Club entity** should be added later only if Team 12 decides that clubs need permanent profiles, memberships, officers, or multiple events.

For the current MVP, these **three entities are sufficient**.
