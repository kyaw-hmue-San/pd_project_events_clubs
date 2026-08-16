## Campus Events & Clubs

## Hein Htut Aung — Backend API and Database

### Summary

The PRD establishes a clear relational data model and identifies critical integrity rules (partial unique index, atomic registration, role-based access). However, several backend and database implementation details remain unspecified:

- Request/response body schemas and parameter definitions for API endpoints
- Database indexing and query optimization strategy
- Timezone handling semantics and conversion points
- Authentication token parsing and validation within Express
- Explicit cascade and soft-delete behaviors
- Transaction isolation levels for concurrent registration attempts
- Error response format and field-level validation details

These gaps are not fatal but should be clarified before implementation to avoid inconsistent behavior, performance problems, or security oversights.

### Findings

| ID | PRD section | Issue or question | Why it matters | Severity | Recommended change |
|---|---|---|---|---|---|
| BE-01 | 11. API / Interfaces | Request and response body schemas are not defined; only endpoint paths and methods are listed | Developers cannot implement the API consistently without agreeing on data shapes, naming, and field types | High | Before implementation, create a detailed API specification document (or OpenAPI/Swagger file) with request/response examples for every endpoint, including field names, types, required fields, and validation rules |
| BE-02 | 11. API / Interfaces | No pagination, filtering, or search parameters are specified for `GET /api/activities` | A frontend might request all activities at once, causing performance problems and poor user experience on large campuses or with many activities | High | Define pagination (e.g., limit, offset or cursor), optional filters (e.g., by activity_type, date range), and whether sorting is supported before implementation |
| BE-03 | 8. Data Model | User.role is listed as a field but no enum, validation rules, or database constraint is documented | Role values could be typos (e.g., "organizer" vs "Organizer"), making authorization unpredictable | High | Document allowed role values as controlled constants (e.g., STUDENT, ORGANIZER) and enforce them with a CHECK constraint or enum type in PostgreSQL |
| BE-04 | 12. Security and Privacy, 11. API / Interfaces | Authentication method is mentioned (Supabase access token) but the Express middleware for token parsing and verification is not documented | A weak or missing token verification could allow access to protected operations without valid identity | High | Document the exact token verification middleware: how the token is extracted from headers, where it is validated, how the user identity is loaded from the token, and what happens on invalid/expired tokens |
| BE-05 | 9. Platform Architecture, 8. Data Model | Timezone handling: `date_time` stored in UTC and displayed in campus time zone, but conversion logic and which layer performs it is not specified | A mismatch between storage and display logic could cause registrations to appear at wrong times or miss deadlines | High | Specify in the API specification: (1) the campus timezone (e.g., UTC+7), (2) which layer converts (API on input/output or database), (3) how the timezone is stored/communicated to the frontend |
| BE-06 | 8. Data Model | Foreign key relationships are described but explicit cascade/soft-delete behavior is missing for User and Activity deletions | If an organizer is deleted, orphan Activity and Registration records could remain or fail to delete cleanly; if an activity is deleted, students lose visibility of their registrations | Medium | Document: (1) can Users be deleted, or must they be soft-deleted (status=INACTIVE)? (2) If Activity is deleted, are Registrations hard-deleted or marked CANCELLED? (3) Should deleted activities remain visible in student history? |
| BE-07 | 11. API / Interfaces, 13. Error Handling | Error response format is mentioned ("consistent JSON shape with error code, user-safe message, optional field errors") but no example or schema is provided | Frontend error handling and logging will be inconsistent if the error format is not standardized before implementation | Medium | Provide a concrete error response schema with examples, e.g., `{ "code": "DUPLICATE_REGISTRATION", "message": "You are already registered for this activity", "fields": null }` and `{ "code": "VALIDATION_ERROR", "message": "Invalid input", "fields": { "date_time": "Must be in the future" } }` |
| BE-08 | 5. Functional Requirements, 14. Deployment Plan | No explicit mention of database connection pooling, query timeouts, or serverless runtime assumptions for Vercel Functions | Express running on Vercel Functions may encounter connection exhaustion or timeouts if database connections are not pooled correctly; connections can hang if a query exceeds runtime limits | Medium | Document: (1) use a connection pool (e.g., pgBouncer or Supabase connection pooling); (2) set explicit query timeouts (e.g., 10 seconds); (3) verify that Vercel Function execution time allows the slowest expected query to complete |
| BE-09 | 8. Data Model | No mention of indexing strategy beyond the partial unique index on `(student_id, activity_id)` | Query performance for common operations (list activities, view registrations for an organizer) could degrade without indexes on foreign keys, organizer_id, and status | Medium | Create indexes on: (1) Activity.organizer_id (for organizer queries); (2) Registration.student_id (for "My Registrations"); (3) Registration.activity_id (for viewing registrations per activity); (4) Activity.status (for filtering published activities) |
| BE-10 | 7. Business Rules, 11. API / Interfaces | Authorization is checked "at the API level" but the exact code location (middleware, controller, or DAO) and ownership verification logic is not documented | An implementation might only check role at the endpoint level and miss activity-ownership or registration-ownership checks, exposing data to unauthorized users | Medium | Document the authorization flow: which middleware/function verifies the user identity, which controller layer checks role, and which business logic layer verifies resource ownership before returning or modifying data |
| BE-11 | 7. Business Rules (BR-05) | Required activity fields for publishing are listed but no validation rule specifies whether date_time must be in the future or a minimum time until the event | An organizer could publish an event for a past date, making it impossible to register or causing confusion | Medium | Add a validation rule: Activity.date_time must be >= (current time + some buffer, e.g., 1 hour or 1 day). Document the buffer and rationale |
| BE-12 | 7. Business Rules | No documented behavior when an organizer updates an activity title, location, or date_time after students have already registered | Should registered students be notified? Should the registration remain valid if the date changes to a time the student cannot attend? | Medium | Define update restrictions: (1) can organizers modify critical fields (date_time, location) after the first registration? (2) If yes, should an audit log or notification be created? (3) If no, enforce a status-based rule (e.g., only DRAFT can be modified freely) |
| BE-13 | 11. API / Interfaces, 13. Error Handling | GET endpoints do not specify whether they return 404 or empty lists for missing resources (e.g., activity not found vs. no registrations) | Frontend error handling will be inconsistent if some endpoints return 404 and others return empty arrays for "not found" scenarios | Low | Standardize the convention: (1) GET single resource (e.g., `/api/activities/:id`) returns 404 if not found; (2) GET collection endpoints (e.g., `/api/registrations`) return 200 with an empty array if no results |
| BE-14 | 9. Platform Architecture | No mention of whether API logs will strip sensitive data (tokens, email, passwords) or whether logging is enabled in Supabase PostgreSQL | Logs containing access tokens or user emails could leak secrets or personally identifiable information to team members or monitoring services | Low | Define a logging policy: (1) Express middleware should log sanitized requests/responses (method, path, status, response time, NOT headers or body); (2) database queries should not be logged with parameters containing sensitive data |
| BE-15 | 10. Technology Stack | Supabase PostgreSQL plan is selected, but no mention of backup, recovery, or data retention policy | If data is accidentally deleted or the database becomes corrupted, there is no documented recovery plan | Low | Document: (1) Supabase backup retention (usually 7 days on free tier); (2) a manual export/backup process if long-term retention is needed; (3) a test recovery procedure before the final demonstration |

### Decision Requests for the Group

1. **API Specification**: Before coding, the backend owner should create a detailed API specification (or OpenAPI file) with all request/response schemas, parameter definitions, and error codes. This can be done in parallel with frontend design and prevents rework.

2. **Database Indexing**: The team should agree on indexes beyond the partial unique index and document them in a database schema migration or init script.

3. **Timezone Convention**: The campus timezone should be agreed and documented (e.g., UTC+7 for Thailand). All date_time values should be stored in UTC and converted only on API boundaries.

4. **Token Verification Middleware**: The backend owner should create a reusable Express middleware that extracts, validates, and loads the user identity from Supabase tokens. This should be documented and tested before the first protected endpoint is implemented.

5. **Error Response Format**: A single JSON error response schema should be agreed and used consistently across all endpoints. Examples should be added to the API specification.

6. **Activity Update Policy**: Define whether organizers can modify critical fields (date_time, location) after students register. If allowed, specify whether registered students should be notified and if an audit log is required. If not allowed, document the status-based rule (e.g., only DRAFT activities can be modified).

---