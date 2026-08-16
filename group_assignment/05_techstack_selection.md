# 05 — Technology Stack Selection

## Events & Clubs

## 1. Selected Architecture

**Recommended Architecture: Vercel + Supabase**

The project will use a simple web application architecture consisting of:

```text
Student / Organizer
        │
        ▼
   Web Frontend
        │
        ▼
     REST API
        │
        ▼
     Supabase
   ┌────┴──────────────┐
   │                   │
Authentication      PostgreSQL
```

The architecture avoids microservices and other unnecessary infrastructure because the MVP is being developed by a 3–5 person university team within one semester with a deployment budget of 0 THB.

---

# 2. Technology Stack

| Layer                       | Selected Technology                               | Purpose                                                 |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| **Frontend**                | React + Vite                                      | Build the student and organizer web interfaces          |
| **UI / Styling**            | Tailwind CSS                                      | Build a responsive and consistent interface             |
| **Backend / API**           | Node.js + Express                                 | Provide REST API endpoints and business logic           |
| **Database**                | Supabase PostgreSQL                               | Store Users, Activities and Registrations               |
| **Authentication**          | Supabase Auth                                     | User authentication                                     |
| **Authorization**           | Application role checks + database security rules | Enforce Student/Organizer permissions                   |
| **Storage**                 | None for MVP                                      | No file storage is required by the current requirements |
| **Frontend Deployment**     | Vercel                                            | Deploy the web application                              |
| **Database / Auth Hosting** | Supabase                                          | Host PostgreSQL database and authentication             |
| **Version Control**         | Git + GitHub                                      | Source-code collaboration and version history           |

---

# 3. Frontend

## React + Vite

React will be used to build the web interface.

The frontend will contain the main user interfaces required by the MVP:

### Student

* Activity listing
* Activity details
* Registration / registration status
* My registrations / cancellation

### Organizer

* Create activity
* Manage activity
* View registrations

Vite will be used as the frontend build tool.

### Why?

* Simple for a university team.
* Fast development workflow.
* Suitable for a small single-page web application.
* Does not require server-side rendering for the current MVP.
* Keeps the frontend architecture understandable.

---

# 4. UI / Styling

## Tailwind CSS

Tailwind CSS will be used for styling.

The team will create a small set of reusable UI patterns for:

* Navigation
* Activity cards
* Forms
* Buttons
* Status messages
* Registration states
* Tables/lists

The project does not need a large component library unless the team later determines that one is necessary.

---

# 5. Backend / API

## Node.js + Express

The backend will provide a REST API.

The API will contain the core business operations required by the MVP.

Example API structure:

```text
GET    /api/activities
GET    /api/activities/:id

POST   /api/activities
PATCH  /api/activities/:id

POST   /api/activities/:id/registrations
GET    /api/me/registrations

DELETE /api/registrations/:id

GET    /api/activities/:id/registrations
```

The exact API contract will be finalized in the API design phase.

### Backend Responsibilities

The backend will:

* Validate request data.
* Verify authentication.
* Check user roles.
* Check resource ownership.
* Apply business rules.
* Create registrations.
* Prevent duplicate registrations.
* Cancel registrations.
* Return appropriate success/error responses.

The backend should remain a **single application**.

No microservices are required.

---

# 6. Database

## Supabase PostgreSQL

PostgreSQL will store the three MVP entities:

```text
User
Activity
Registration
```

### Relationships

```text
User
 │
 ├────────── Activity
 │              │
 │              │
 └──── Registration
                │
                └──── Activity
```

### Important Constraints

The database should enforce important data-integrity rules such as:

```text
UNIQUE(student_id, activity_id)
```

This prevents duplicate registrations for the same activity.

Foreign-key relationships should also ensure that:

* A Registration references a valid Student.
* A Registration references a valid Activity.
* An Activity references a valid Organizer.

---

# 7. Authentication

## Supabase Auth

Supabase Auth will handle user authentication.

The application will distinguish users using roles:

```text
STUDENT
ORGANIZER
```

An `ADMIN` role should only be added if the team later confirms that an administrator is necessary for the MVP.

### Authentication Flow

```text
User
 │
 ▼
Login
 │
 ▼
Supabase Auth
 │
 ▼
Authenticated User
 │
 ▼
Application
 │
 ├── Student
 │
 └── Organizer
```

Authentication and authorization are separate concepts:

* **Authentication:** Who is this user?
* **Authorization:** What is this user allowed to do?

---

# 8. Authorization

Authorization will follow the MVP permission model.

### Student

Can:

* View published activities.
* View activity details.
* Register for an activity.
* View their own registrations.
* Cancel their own registration.

Cannot:

* Create activities.
* Modify activities.
* View another student's registrations.

### Organizer

Can:

* Create activities.
* Publish activities.
* Update activities they manage.
* View registrations for their activities.

Cannot:

* Modify another organizer's activities.
* Access unrelated activity registrations.

Authorization must be enforced on the server/database side, not only by hiding UI buttons.

---

# 9. Storage

## No Storage Service for MVP

The current MVP does not require:

* Event images
* Videos
* Documents
* User-uploaded files

Therefore, no separate storage service will be introduced.

This keeps the architecture smaller and reduces unnecessary deployment dependencies.

If file uploads become a confirmed requirement later, storage can be added without changing the core data model.

---

# 10. Deployment

## Vercel

The frontend/application will be deployed through Vercel.

Expected deployment flow:

```text
Developer
    │
    ▼
GitHub Repository
    │
    ▼
Vercel
    │
    ▼
Production Web Application
```

The team should use a shared Git repository with branches/pull requests to coordinate development.

---

# 11. Supabase Deployment

Supabase will provide the managed backend services required by the project:

```text
Supabase
├── PostgreSQL
└── Authentication
```

The team will avoid adding optional Supabase services unless a confirmed MVP requirement requires them.

---

# 12. Environment Configuration

Sensitive configuration values must not be committed to Git.

Examples include:

```text
DATABASE credentials
AUTH secrets
API secrets
```

Environment variables should be used for deployment configuration.

The project's `.env` files containing secrets should be excluded from version control.

---

# 13. Development Tools

The team can use:

* **Git** — version control
* **GitHub** — source-code collaboration
* **VS Code** — development environment
* **Postman / similar API client** — API testing
* **Browser developer tools** — frontend debugging

These are development tools rather than additional production architecture components.

---

# 14. Why This Stack Was Selected

## Reason 1 — Fits the Data Model

The platform has a relational data model:

```text
User
Activity
Registration
```

PostgreSQL is therefore a natural fit.

---

## Reason 2 — Simple Authentication

Supabase Auth avoids building authentication from scratch.

This reduces implementation time and security risk for a student team.

---

## Reason 3 — Clear API Architecture

Node.js + Express provides a straightforward REST API.

This makes the system boundary easy to explain:

```text
React
  ↓
REST API
  ↓
PostgreSQL
```

---

## Reason 4 — Free-Tier Deployment

The selected services have free-tier options appropriate for a small student project.

The team must monitor usage and remain within the applicable free-tier limits.

---

## Reason 5 — One-Semester Feasibility

The stack is familiar and relatively lightweight.

The team can focus development effort on:

* User experience
* Business rules
* API implementation
* Database integrity
* Testing
* Deployment

rather than infrastructure management.

---

## Reason 6 — No Unnecessary Enterprise Infrastructure

The project will NOT use:

* Microservices
* Kubernetes
* Message queues
* Dedicated API gateway
* Redis/cache infrastructure
* Multiple databases
* Dedicated authentication server
* Separate file-storage provider

These components are not justified by the current MVP requirements.

---

# 15. Alternatives Considered

## Cloudflare Workers + D1

Considered because it provides a lightweight serverless API and SQL database.

However, it introduces more authentication and platform-specific complexity for this team.

**Decision: Not selected.**

---

## Firebase

Considered because it provides rapid development and integrated authentication.

However, Firestore is less natural for the current relational data model, and adding some Firebase services introduces additional billing-plan considerations.

**Decision: Not selected.**

---

# 16. Final Technology Decision

| Category              | Final Selection             |
| --------------------- | --------------------------- |
| Frontend              | **React + Vite**            |
| Styling               | **Tailwind CSS**            |
| Backend               | **Node.js + Express**       |
| API Style             | **REST**                    |
| Database              | **Supabase PostgreSQL**     |
| Authentication        | **Supabase Auth**           |
| Authorization         | **Role + ownership checks** |
| File Storage          | **None for MVP**            |
| Frontend Deployment   | **Vercel**                  |
| Database/Auth Hosting | **Supabase**                |
| Version Control       | **Git + GitHub**            |

## Final Stack

```text
┌─────────────────────────────┐
│       React + Vite          │
│       Tailwind CSS          │
│        Frontend             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Node.js + Express      │
│         REST API            │
│                             │
│ Authentication checks       │
│ Role checks                 │
│ Business rules              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│       Supabase Auth         │
│             │               │
│             ▼               │
│      PostgreSQL             │
│                             │
│  User                       │
│  Activity                   │
│  Registration               │
└─────────────────────────────┘

Deployment:
Vercel + Supabase
```

### Technology Selection Principle

> **Choose the simplest technology that satisfies the requirements.**

The selected stack is intentionally designed for the current university MVP rather than for hypothetical large-scale production traffic.
