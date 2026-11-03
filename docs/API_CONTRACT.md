# Firebase Events API Contract

**Status:** Observed from `firebase/api.mjs` and `firebase/integration.mjs` on 2026-11-03. This documents current behavior; it does not resolve product-contract mismatches or claim production CRUD has been tested.

## Common behavior

- API base: the deployed Express service URL; local default is `http://localhost:3000`.
- JSON request bodies are limited to 32 KB. Webhook event bodies are additionally limited to 8 KB by event validation.
- Every `/api/*` request requires `Authorization: Bearer <Firebase ID token>`. The server verifies the token including revocation, requires verified email, then loads `users/{uid}` and accepts only `STUDENT` or `ORGANIZER` roles.
- The API derives the caller UID and role from Firebase Auth and Firestore, not from request bodies.
- Responses use ISO-8601 UTC strings for Firestore timestamps. Errors use `{"error":{"code":"..."}}`; unexpected server failures return `500 INTERNAL_ERROR` without internal details.
- Requests receive an `X-Request-ID`. Request evidence is logged without authorization headers or request bodies.
- No CORS middleware is currently configured. This is a source inventory, not browser integration approval.

## Application routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /health` | Public | None | `200 {"status":"ok"}`; does not test Firestore. |
| `GET /api/me` | Authenticated Student or Organizer | None | `200` with the caller's `users/{uid}` document and `id`. |
| `GET /api/activities?limit=20&after=<id>` | Authenticated Student or Organizer | Optional integer `limit` 1–50; optional published activity cursor | `200 {"data":[activity],"nextCursor":"id-or-null"}`. Lists `PUBLISHED` only, ordered by date/time then document ID. |
| `GET /api/activities/:id` | Authenticated Student or Organizer | Activity document ID | `200` for a published activity or the caller's own activity; otherwise `404`. |
| `POST /api/activities` | Organizer | Required `title`, `description`, `activityType`, `dateTime`, `location`; optional `status` must be `DRAFT` | `201` with created draft; server sets owner, count, and timestamps. `activityType` is `EVENT` or `CLUB_ACTIVITY`. |
| `PATCH /api/activities/:id` | Owning Organizer | Non-empty subset of activity fields and/or `status` | `200` with updated activity. Status values are `DRAFT`, `PUBLISHED`, `CLOSED`; published activities require all descriptive fields. Cannot return a non-draft to `DRAFT`. Current code permits `CLOSED` to `PUBLISHED`. |
| `DELETE /api/activities/:id` | Owning Organizer | Activity document ID | `204` only for an unused `DRAFT` with zero registrations; otherwise `409`. |
| `POST /api/activities/:id/registrations` | Student | Activity document ID; no body required | `201` with a new `ACTIVE` registration. Activity must be `PUBLISHED`; duplicate active registration returns `409 ALREADY_REGISTERED`. Registration, unique active lock, and count update are transactional. |
| `GET /api/me/registrations` | Authenticated Student or Organizer | None | `200 {"data":[registration]}` for active registrations matching caller UID, newest first, maximum 50. Current handler has no explicit Student-role guard. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Activity document ID | `200 {"data":[registration]}` for the activity, maximum 50, including cancelled history. |
| `PATCH /api/registrations/:id` | Student who owns registration | Exactly `{"status":"CANCELLED"}` | `200` with the registration. Cancellation preserves history, releases the active lock, decrements activity count, and is idempotent. |
| `GET /api/integration/partner` | Any authenticated Organizer | None | Calls configured partner API and returns current/degraded state; returns an unconfigured status when no partner URL exists. |
| `GET /api/integration/logs?limit=20` | Any authenticated Organizer | Optional integer `limit` 1–50 | `200 {"data":[log]}`. Current implementation does not scope logs to an organizer or redact partner payloads here. |

## Partner routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /partner/activities?limit=20` | `X-Partner-Key` | Optional integer `limit` 1–50 | `200` with published activities projected to partner fields, request ID, and generated time. |
| `POST /webhooks/partner` | `X-Webhook-Secret` | Event object with `id`, `type`, `occurredAt`, and object `data` | First accepted event returns `201`; exact duplicate ID+payload returns `200` with `duplicate: true`; same ID with different payload returns `409 EVENT_ID_CONFLICT`. |

## Current errors

- `400`: malformed ID/body, unknown or invalid fields, invalid date/time, invalid limit/cursor, or invalid webhook event.
- `401`: missing/invalid/revoked Firebase token or invalid partner/webhook secret.
- `403`: unverified email, unprovisioned role, wrong role, or failed ownership check.
- `404`: missing resource or activity not visible to caller.
- `409`: duplicate registration, closed/non-published activity registration, invalid lifecycle/deletion, registration integrity failure, or webhook ID conflict.
- `500`: unexpected error mapped to `INTERNAL_ERROR`.

## Known frontend integration mismatches

1. The PRD specifies `PATCH /api/registrations/:id/cancel`; current API exposes `PATCH /api/registrations/:id` with `{"status":"CANCELLED"}`. Keep the existing route and add a compatible adapter only with regression tests.
2. The PRD says `CLOSED` events remain visible to Students and cannot reopen. The current list/detail routes expose only published events, and current update logic allows closed-to-published transitions. Resolve before wiring event state into the UI.
3. The service has no CORS origin allowlist or preflight handling, so a separate browser frontend cannot yet rely on cross-origin API calls.
4. A persistent process runs the integration retry worker. Keep the backend on a persistent host unless the worker is separately redesigned.

This contract is an inventory for implementation. API behavior and these unresolved points must be covered by tests before the corresponding frontend features are treated as complete.
