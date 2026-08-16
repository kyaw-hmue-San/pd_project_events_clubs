# 04 — Architecture Options

## Events & Clubs

## Architecture Goal

The architecture only needs to support the core MVP:

**Organizer publishes activity → Student discovers activity → Student views details → Student registers → Student receives confirmation → Student can view or cancel registration**

The system uses three main entities:

* User
* Activity
* Registration

Because this is a 3–5 person university project with one semester and a 0 THB deployment budget, the architecture should use **one frontend, one backend/API responsibility, and one main database**.

Microservices, message queues, multiple databases, Kubernetes, or other enterprise infrastructure are not necessary.

---

# Option 1 — Vercel + Supabase

## Frontend

A single responsive web application can be deployed on **Vercel**.

The same frontend should support both:

* Student screens
* Organizer screens

There is no need to create separate student and organizer applications.

Vercel's Hobby plan is currently free and includes Git-based deployment, automatic HTTPS and preview deployments, making it suitable for a small non-commercial student application.

## Backend / API

Use a **thin API layer within the same web application**.

```text
Browser
   │
   ▼
Frontend
   │
   ▼
REST API
   │
   ▼
Supabase
```

The API is responsible for:

* Reading published activities
* Creating activities
* Updating activities
* Creating registrations
* Cancelling registrations
* Viewing registrations
* Checking role and ownership rules

A separate backend server or microservice is unnecessary.

## Database

Use **Supabase PostgreSQL**.

The relational database matches the existing data model well:

```text
User
 ├── manages ──> Activity
 │
 └── creates ──> Registration ──> Activity
```

Important database constraints such as:

```text
UNIQUE(student_id, activity_id)
```

can be enforced directly.

Supabase's current Free plan includes a PostgreSQL database and is designed for small projects, with free projects subject to usage limits.

## Authentication

Use **Supabase Authentication**.

Authentication determines who the user is.

Authorization then determines what they are allowed to do:

```text
STUDENT
→ view activities
→ create own registration
→ cancel own registration

ORGANIZER
→ create activities
→ update own activities
→ view registrations for own activities
```

Authorization should be enforced by the backend/database rules, not only by hiding buttons in the interface.

## Storage

**No file storage is necessary for the current MVP.**

The existing data model contains text-based activity and registration information only.

If activity cover images are introduced later, Supabase Storage could be added. Supabase currently includes limited file storage in its Free plan.

## Deployment

```text
              USERS
                │
                ▼
       ┌─────────────────┐
       │     Vercel      │
       │                 │
       │ Frontend        │
       │ REST API        │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │    Supabase     │
       │                 │
       │ Authentication  │
       │ PostgreSQL      │
       │ Optional Storage│
       └─────────────────┘
```

## Advantages

* Simple architecture
* Strong match with the relational data model
* Authentication and database are integrated
* Easy to enforce database constraints
* Explicit API layer is possible
* Easy deployment workflow
* Small number of components
* Suitable for a five-person team
* Good balance between learning and implementation speed

## Disadvantages

* Depends heavily on Supabase
* Team members need basic SQL knowledge
* Authorization rules must be configured carefully
* Free-tier limitations must be monitored

## Major Risks

### Free Project Inactivity

Supabase currently pauses Free projects after one week of inactivity. The team should therefore check and reactivate the project before demonstrations or presentations.

### Authorization Errors

Incorrect ownership rules could allow:

* A student to access another student's registration
* An organizer to modify another organizer's activity

Authorization therefore needs backend/database enforcement.

### Free-Tier Dependency

The project must remain within Vercel and Supabase Free-plan limits. For this small university MVP, expected usage should be relatively low, but the team should still monitor usage during testing.

---

# Option 2 — Cloudflare Workers + D1

## Frontend

A single lightweight web frontend can be served through Cloudflare.

```text
Browser
   │
   ▼
Web Frontend
```

The frontend would contain the Student and Organizer interfaces.

## Backend / API

Use **one Cloudflare Worker** as the REST API.

```text
Frontend
   │
   ▼
Cloudflare Worker
   │
   ▼
D1 Database
```

The Worker would handle:

* Authentication checks
* Role validation
* Activity CRUD
* Registration
* Cancellation
* Ownership validation

Only one Worker/backend application is necessary.

## Database

Use **Cloudflare D1**.

D1 is Cloudflare's serverless SQL database and can support the three relational entities required by this MVP. Its Free plan currently includes free database capacity and daily read/write allowances suitable for prototype-scale applications.

## Authentication

Authentication is the biggest architectural issue with this option.

Workers + D1 do not provide the same integrated application authentication experience as Firebase or Supabase.

The team would therefore need to design or integrate authentication separately.

Conceptually:

```text
User
 │
 ▼
Authentication
 │
 ▼
Token
 │
 ▼
Worker API
 │
 ▼
D1
```

This creates additional work that does not directly improve the Events & Clubs MVP.

## Storage

No file storage is necessary for the current MVP.

If files become necessary later, another Cloudflare service such as object storage would have to be introduced.

For now:

```text
Storage = Not Required
```

## Deployment

```text
              USERS
                │
                ▼
        Web Frontend
                │
                ▼
     ┌───────────────────┐
     │ Cloudflare Worker │
     │     REST API      │
     └─────────┬─────────┘
               │
               ▼
        ┌────────────┐
        │     D1     │
        │ SQL DB     │
        └────────────┘
```

## Advantages

* Clear API architecture
* SQL database
* Good separation between frontend and backend
* Strong learning value for API development
* Generous Free-tier capacity for a university project
* Serverless deployment
* Good control over backend business rules

Cloudflare's Free Workers plan currently supports up to 100,000 Worker requests per day, while D1 includes prototype-scale free database quotas.

## Disadvantages

* Higher learning curve
* Authentication requires more design work
* More Cloudflare-specific concepts
* More configuration than Vercel + Supabase
* Team has greater responsibility for backend implementation

## Major Risks

### Authentication Complexity

Authentication and authorization may consume significant development time compared with the actual Events & Clubs features.

### Worker Limitations

The Free Workers plan currently has a 10 ms CPU-time limit per invocation, so backend handlers need to remain lightweight.

For basic CRUD requests this may be manageable, but it introduces another constraint for a student team to understand.

### Higher Delivery Risk

The architecture provides more technical control but also creates more implementation work.

For a single-semester project, this increases the risk that the team spends time on infrastructure instead of completing the core user journey.

---

# Option 3 — Firebase

## Frontend

Use a single web application with Firebase Hosting.

```text
Browser
   │
   ▼
Web Frontend
```

Firebase provides a no-cost Spark plan with no payment method required for supported no-cost usage.

## Backend / API

The simplest Firebase architecture would allow the frontend to communicate directly with Firebase services:

```text
Frontend
   │
   ├── Firebase Authentication
   │
   └── Firestore
```

This makes development fast.

However, it means there is less of a traditional explicit REST API backend.

A custom Cloud Functions API could be introduced, but Cloud Functions requires the Blaze pay-as-you-go plan and a linked billing account.

Because the project requirement is **0 THB with minimum billing risk**, introducing Cloud Functions would be undesirable.

## Database

Use **Cloud Firestore**.

Possible collections could be:

```text
users
activities
registrations
```

Firestore's free quota currently includes limited daily document reads, writes and deletes that would be sufficient for a small university prototype.

However, the current Events & Clubs data model is naturally relational.

For example:

```text
Student
   │
Registration
   │
Activity
```

and:

```text
UNIQUE(student_id, activity_id)
```

are more naturally represented by a relational SQL database.

## Authentication

Use **Firebase Authentication**.

Most standard Firebase Authentication options are available without charge under the supported no-cost product model.

Roles would still need to be handled carefully:

```text
Student
Organizer
Optional Admin
```

and Security Rules would need to prevent unauthorized access.

## Storage

**Do not use Firebase Storage for the MVP.**

It is not required by the current data model.

More importantly, Cloud Storage for Firebase now requires projects to use the **Blaze pay-as-you-go plan**, even though some storage usage may remain within no-cost allowances.

That conflicts with the project's desire to avoid billing risk.

## Deployment

```text
              USERS
                │
                ▼
      ┌──────────────────┐
      │ Firebase Hosting │
      │    Frontend      │
      └────────┬─────────┘
               │
        ┌──────┴───────┐
        ▼              ▼
 Firebase Auth     Firestore
```

## Advantages

* Very quick to prototype
* Integrated Authentication
* Simple deployment
* Little backend infrastructure
* Good for small teams
* Generous enough no-cost Firestore quota for this MVP

## Disadvantages

* NoSQL is less natural for the current relational model
* Explicit REST API architecture is weaker
* Unique registration rules require more application-level care
* Security Rules become critical
* Custom backend functions create billing-plan complexity

## Major Risks

### Data Integrity

Preventing duplicates such as:

```text
student_id + activity_id
```

is less straightforward than using a relational unique database constraint.

### Billing Requirement for Additional Services

Cloud Functions require Blaze, and Cloud Storage for Firebase also requires Blaze.

Adding these services therefore increases billing risk.

### Architecture Learning

The direct frontend-to-Firebase model is convenient, but it provides less experience with explicit API boundaries than the other two architectures.

---

# Architecture Comparison

| Area                                | Vercel + Supabase  | Cloudflare + D1 | Firebase                          |
| ----------------------------------- | ------------------ | --------------- | --------------------------------- |
| Overall complexity                  | **Low–Medium**     | Medium–High     | Low                               |
| Database model                      | **Relational SQL** | Relational SQL  | NoSQL                             |
| Fit with User–Activity–Registration | **Excellent**      | Good            | Moderate                          |
| Authentication                      | **Integrated**     | Additional work | **Integrated**                    |
| Explicit API                        | **Easy**           | **Strongest**   | Limited without Functions         |
| Database constraints                | **Strong**         | Strong          | More application-driven           |
| Zero-budget suitability             | **Strong**         | Strong          | Strong only with limited services |
| Learning curve                      | Moderate           | Highest         | Lowest                            |
| Development speed                   | **Fast**           | Slower          | **Fastest**                       |
| Delivery risk                       | **Low**            | Higher          | Low–Medium                        |
| MVP suitability                     | **Excellent**      | Good            | Good                              |

---

# Recommended Architecture

## Vercel + Supabase

For Team 12's **Events & Clubs MVP**, the recommended option is:

> **Vercel + Supabase**

### Proposed Architecture

```text
                  ┌────────────────────┐
                  │      Browser       │
                  │ Student / Organizer│
                  └─────────┬──────────┘
                            │ HTTPS
                            ▼
               ┌────────────────────────┐
               │       Vercel App       │
               │                        │
               │  Frontend UI           │
               │       │                │
               │       ▼                │
               │  REST API Layer        │
               │       │                │
               │ Auth / Role /          │
               │ Ownership Validation   │
               └───────────┬────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │       Supabase       │
                │                      │
                │ Authentication       │
                │                      │
                │ PostgreSQL           │
                │ ├── User             │
                │ ├── Activity         │
                │ └── Registration     │
                │                      │
                │ Storage              │
                │ Not required for MVP │
                └──────────────────────┘
```

## Why This Option Is Appropriate

### 1. It matches the data model

The platform already has a relational structure:

```text
User
Activity
Registration
```

PostgreSQL can directly enforce relationships and constraints such as:

```text
UNIQUE(student_id, activity_id)
```

This reduces duplicate and inconsistent registration data.

### 2. Authentication is already available

The team does not need to build a separate authentication service.

That reduces development effort and security risk.

### 3. It still provides a clear API architecture

Instead of allowing the frontend to contain all business logic:

```text
Frontend
   ↓
API
   ↓
Database
```

gives the team a clear separation of responsibilities.

### 4. It remains simple

Only two deployed platforms are required:

```text
Vercel
+
Supabase
```

No microservices are necessary.

No queue is necessary.

No cache layer is necessary.

No separate authentication server is necessary.

No separate file-storage service is necessary.

### 5. It fits the budget

Vercel provides a free Hobby tier for small non-commercial projects, while Supabase provides a Free plan.

The expected scale of a university demonstration should be kept comfortably within those limits.

### 6. It fits one semester

The architecture is complex enough to demonstrate:

* Frontend
* API
* Authentication
* Authorization
* Database
* Relationships
* Business rules
* Deployment

but simple enough for a five-person student group to implement and explain.

---

# Final Architecture Decision

**Recommended: Vercel + Supabase**

```text
Web Frontend
     ↓
REST API
     ↓
Supabase Authentication
     ↓
PostgreSQL Database
```

This option provides the best balance of:

**simplicity + relational data integrity + authentication + zero-budget deployment + realistic semester delivery.**

The project should optimize for completing a reliable MVP rather than designing infrastructure for hypothetical large-scale future traffic.

---

# Free-Tier Verification Record

**Last verified:** 2026-08-16

| Service | Verified condition relevant to this project | Official source |
|---|---|---|
| Vercel | Hobby is intended for personal/non-commercial use; Express runs as a Vercel Function | [Vercel terms](https://vercel.com/legal/terms), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) |
| Supabase | Free projects may pause after a seven-day period of low activity | [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) |
| Cloudflare | Workers Free includes 100,000 requests per day; D1 has separate free limits | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers and D1 pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Firebase | Cloud Storage requires the Blaze plan even though no-cost allowances may exist | [Firebase Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) |

These conditions are time-sensitive. The Delivery and Document owner must recheck them before stack lock, production deployment, and the final demonstration.
