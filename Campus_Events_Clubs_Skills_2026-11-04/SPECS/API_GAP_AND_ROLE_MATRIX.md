# API delta specification and role matrix
Read the complete observed contract in `REFERENCES/API_CONTRACT.md`. These are **proposals**, not existing routes unless verified in current code.

## Existing endpoints — preserve URLs/semantics
- Public `GET /health` => liveness only.
- Authenticated `GET /api/me`.
- Authenticated `GET /api/activities` and `GET /api/activities/:id` (published + closed, own draft); Organizer `POST/PATCH/DELETE /api/activities`.
- Student `POST /api/activities/:id/registrations`, `GET /api/me/registrations`, `PATCH /api/registrations/:id/cancel`; preserve legacy `PATCH /api/registrations/:id`.
- Owning Organizer `GET /api/activities/:id/registrations`.
- Team 10 `/partner/activities` and `/webhooks/partner`; Organizer diagnostics route with UID allowlist.

## Proposed new/change endpoints — implement server checks first

### A. Organizer dashboard
`GET /api/me/activities?status=DRAFT|PUBLISHED|CLOSED&limit=20&after=<cursor>`
- `ORGANIZER` only; server filters to `organizerId == req.user.uid`, never trusts query-supplied UID.
- Return `200 {"data":[{...}],"nextCursor":null|"..."}` with ALL own states (optional filter). Sort stably and document required Firestore index.
- No leak of others' drafts. Test owner and cross-role denial.

### B. Student history
Keep `GET /api/me/registrations`; extend to ACTIVE **and** CANCELLED history (with optional `status`, `limit`, `after`) and stable ordering. Returning history by default changes previous response contents: investigate old clients/Postman before choosing default vs opt-in `includeCancelled=true`; record in contract and test whichever approved.
- `STUDENT` only; server filter on authenticated UID; no studentId query parameter.
- Include id, activityId, status, registeredAt, cancelledAt; enrich activity data only if safe or fetch details from authorized route; verify no private data.
- Preserve soft-cancel and re-registration after cancellation when activity remains published.

### C. Uniform validation errors
Preserve `error.code` and add safe optional `error.message` and `error.fieldErrors` (map field -> short description), no stack traces or Firebase internals. Standardize 400/401/403/404/409/500 handling. For list queries/invalid input, no partial writes.

### D. Safe organizer identity for cards/details
Serve `organizer: {displayName}` or `organizerName` **only from authenticated/server-controlled data** if available, or display a non-fabricated fallback such as `Campus Organizer`. Do not expose contact email by default. Keep old ID fields where clients depend on them.

### E. Read-only Admin endpoints (new approved extension)
- `GET /api/admin/summary`: ADMIN only; `200 {"totalActivities":number,"draft":number,"published":number,"closed":number,"totalRegistrations"?:number,"asOf":ISOstring}`. Include only counts that are accurately computable across all items, not a sampled page. If registration total cannot be safely/cheaply calculated, OMIT field, don't show false zero.
- `GET /api/admin/activities?status=DRAFT|PUBLISHED|CLOSED&limit=20&after=<cursor>`: ADMIN only; all organizers' activities, pagination stable, safe organizer display, no private roster.
- `GET /api/admin/activities/:id`: ADMIN only; safe activity fields incl draft; no roster, student identities, partner secrets or integration logs.
- ADMIN must NOT be allowed to use Organizer mutations or Student registration APIs just because the role is authenticated. No admin mutation route.

### F. Public browsing decision D03
If lecturer requires AC-FR-01, implement **narrow anonymous GET listing/details** showing only PUBLISHED activities and safe fields; retain auth for all protected paths. Note CLOSED visibility difference, use versioning or explicit visibility rules. Do not open all `/api/*` paths by removing the middleware.

## Authorization matrix
`Y=allow under matching resource rules; N=deny; P=public only if formally chosen`

| Operation | Visitor | Student | Organizer | Admin |
|---|---:|---:|---:|---:|
| Login + /health | Y | Y | Y | Y |
| Visible activity list/details (current auth) | N (P proposed) | Y | Y | via admin view |
| Student register/cancel/history | N | Y (own) | N | N |
| Organizer create/edit/publish/close/delete draft | N | N | Y (own) | N |
| Organizer own list + roster | N | N | Y (own) | N |
| Admin overview/all activities/details | N | N | N | Y (read-only) |
| Integration diagnostics | N | N | UID allowlist only | N by default |
| Partner endpoints | Secret-based only | Secret-based only | Secret-based only | Secret-based only |

## Review points before implementation
Current `api.mjs` may place role verification in global middleware or allow only STUDENT/ORGANIZER: extend allowlist carefully, then apply route-specific `requireRole('ADMIN')`. Prefer no direct Firestore access from browser (rules deny it). Validate all pagination cursors and avoid unbounded reads to compute Admin summary. Use Firestore aggregation queries or stored accurate derived counters if needed, and verify cost/free-tier.
