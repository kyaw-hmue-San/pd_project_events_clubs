# 01 — Problem Discovery

## Events & Clubs

### 1. Main Problem

Students may find it difficult to discover campus events and club activities when information is shared through different channels. They may also have difficulty knowing whether they have successfully registered or how to cancel their participation.

At the same time, event and club organizers need a clear way to publish activity information and manage student registrations.

---

### 2. Target Users

**Primary User**

* University students who want to discover and participate in campus events and clubs.

**Secondary User**

* Event or club organizers who publish activities and manage registrations.

**Possible Supporting User**

* Administrator who manages or controls platform information.

> The need for a separate administrator role must be validated by the team.

---

### 3. Current Workflow

**Assumed current workflow:**

1. An organizer prepares an event or club activity.
2. The activity information is announced through available university communication channels.
3. Students find and read the announcement.
4. Interested students use the provided method to register.
5. The organizer keeps track of registered students.
6. If a student cannot attend, they use the available method to cancel or inform the organizer.

> This workflow is an assumption and should be validated before being treated as the actual university process.

---

### 4. Pain Points

Possible pain points are:

* Event and club information may be scattered across different communication channels.
* Students may miss activities that they are interested in.
* Students may not have one clear place to check activity details.
* Registration methods may differ between activities.
* Students may find it difficult to check their registration status.
* Cancellation may require a separate process.
* Organizers may need to manage event information and registration records separately.

These pain points should be validated with actual users.

---

### 5. Core User Journey

The most important happy path is:

**Student opens Events & Clubs → Browses available activities → Selects an activity → Views details → Registers → Receives confirmation**

A related cancellation journey is:

**Student views own registration → Selects Cancel → Confirms cancellation → Registration status is updated**

The registration journey should be treated as the main core journey because it provides the main value of connecting students with campus activities.

---

### 6. Expected Value

The platform should provide students with one clear place to discover campus events and clubs, understand activity details, register for activities, and manage their own participation.

For organizers, it should provide a simpler way to publish activity information and see which students have registered.

The expected result is a clearer and more consistent interaction between students and campus activity organizers.

---

### 7. Assumptions That Need Validation

The following assumptions should be confirmed before finalizing the PRD:

1. Students currently receive event and club information through multiple channels.
2. Organizers currently use different methods for registration.
3. Students need to see their own registration status.
4. Students should be allowed to cancel their own registration.
5. Events may have a maximum number of participants.
6. Registration may have an opening or closing deadline.
7. Organizers should be able to edit activities after publishing them.
8. The team needs to decide whether **Event Organizer** and **Administrator** are separate roles.
9. The team needs to decide whether joining a **club** and registering for an **event** follow the same process.
10. The minimum information required for every event or club activity must be defined.

---

### 8. Features NOT Necessary for MVP

To keep the project realistic for one semester, the following features are not necessary for the first MVP:

* Online payments
* Paid event tickets
* Paid club memberships
* Live chat
* Comments and reactions
* Social-media-style feeds
* AI event recommendations
* Complex recommendation algorithms
* Advanced analytics dashboards
* Gamification or reward points
* Event photo galleries
* Native mobile applications
* Complex attendance tracking
* QR-code check-in
* Public event sharing to external social media

These can be considered as future improvements only if the core platform is completed successfully.

---

## MVP Focus

For the first version, the platform should focus on one simple value:

> **Allow students to discover a campus activity, view its details, register successfully, and cancel their own registration when needed.**

If this journey works properly, the Events & Clubs platform already provides meaningful value to its main users.
