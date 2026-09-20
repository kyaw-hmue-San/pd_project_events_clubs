# Platform Architecture Diagram

```text
┌──────────────────────────────────────┐
│ Browser                              │
│ Student and Organizer interfaces     │
└──────────────────┬───────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────┐
│ Vercel                               │
│ React + Vite frontend                │
│ Express REST API (one stateless      │
│ Vercel Function)                     │
└──────────────────┬───────────────────┘
                   │ verified access token
                   ▼
┌──────────────────────────────────────┐
│ Supabase                             │
│ Auth                                 │
│ PostgreSQL                           │
│ Constraints and database policies    │
└──────────────────────────────────────┘
```

## Data Flow

1. The browser signs in through Supabase Auth and receives an access token.
2. The browser sends the token with protected API requests.
3. Express verifies the token and loads the trusted role and resource ownership.
4. Express applies business rules and performs an authorized PostgreSQL operation.
5. PostgreSQL constraints enforce relationships, controlled states, and one active registration per student and activity.
6. Express returns a sanitized success or error response to the browser.

The API is stateless. It does not rely on local disk, in-memory sessions, or a continuously running background process.
