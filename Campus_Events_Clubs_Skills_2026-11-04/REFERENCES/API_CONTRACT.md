# Firebase Events API Contract

**Status:** Observed from `firebase/api.mjs` and `firebase/integration.mjs` on 2026-11-03. This documents current behavior; it does not resolve product-contract mismatches or claim production CRUD has been tested.

## Common behavior

- API base: the deployed Express service URL; local default is `http://localhost:3000`.
- JSON request bodies are limited to 32 KB. Webhook event bodies are additionally limited to 8 KB by event validation.
- Every `/api/*` request requires `Authorization: Bearer <Firebase ID token>`. The server verifies the token including revocation, requires verified email, then loads `users/{uid}` and accepts only `STUDENT` or `ORGANIZER` roles.
- The API derives the caller UID and role from Firebase Auth and Firestore, not from request bodies.
- Responses use ISO-8601 UTC strings for Firestore timestamps. Errors use `{"error":{"code":"..."}}`; unexpected server failures return `500 INTERNAL_ERROR` without internal details.
- Requests receive an `X-Request-ID`. Request evidence is logged without authorization headers or request bodies.
- CORS allows exact origins from `FRONTEND_ORIGINS` (default: `http://localhost:5173`); disallowed browser origins receive `403 ORIGIN_NOT_ALLOWED`. Preflight methods and headers are allowlisted. CORS does not replace Firebase token authorization.

## Application routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /health` | Public | None | `200 {"status":"ok"}`; does not test Firestore. |
| `GET /api/me` | Authenticated Student or Organizer | None | `200` with the caller's `users/{uid}` document and `id`. |
| `GET /api/activities?limit=20&after=<id>` | Authenticated Student or Organizer | Optional integer `limit` 1–50; optional visible activity cursor | `200 {"data":[activity],"nextCursor":"id-or-null"}`. Lists `PUBLISHED` and `CLOSED` activities, ordered by date/time then document ID. |
| `GET /api/activities/:id` | Authenticated Student or Organizer | Activity document ID | `200` for a published or closed activity, or the caller's own draft; otherwise `404`. |
| `POST /api/activities` | Organizer | Required `title`, `description`, `activityType`, `dateTime`, `location`; optional `status` must be `DRAFT` | `201` with created draft; server sets owner, count, and timestamps. `activityType` is `EVENT` or `CLUB_ACTIVITY`. |
| `PATCH /api/activities/:id` | Owning Organizer | Non-empty subset of activity fields and/or `status` | `200` with updated activity. Status values are `DRAFT`, `PUBLISHED`, `CLOSED`; published activities require all descriptive fields. Cannot return a non-draft to `DRAFT` or reopen a `CLOSED` activity. |
| `DELETE /api/activities/:id` | Owning Organizer | Activity document ID | `204` only for an unused `DRAFT` with zero registrations; otherwise `409`. |
| `POST /api/activities/:id/registrations` | Student | Activity document ID; no body required | `201` with a new `ACTIVE` registration. Activity must be `PUBLISHED`; duplicate active registration returns `409 ALREADY_REGISTERED`. Registration, unique active lock, and count update are transactional. |
| `GET /api/me/registrations` | Student | None | `200 {"data":[registration]}` for the caller's active registrations, newest first, maximum 50. Organizer receives `403`. |
| `GET /api/activities/:id/registrations` | Owning Organizer | Activity document ID | `200 {"data":[registration]}` for the activity, maximum 50, including cancelled history. |
| `PATCH /api/registrations/:id` | Student who owns registration | Exactly `{"status":"CANCELLED"}` | `200` with the registration. Legacy route retained for compatibility. Cancellation preserves history, releases the active lock, decrements activity count, and is idempotent. |
| `PATCH /api/registrations/:id/cancel` | Student who owns registration | Empty body, or legacy-compatible `{"status":"CANCELLED"}` | `200` with the registration; same ownership and idempotent transaction behavior as the legacy route. |
| `GET /api/integration/partner` | Any authenticated Organizer | None | Calls configured partner API and returns current/degraded state; returns an unconfigured status when no partner URL exists. |
| `GET /api/integration/logs?limit=20` | Organizer whose Firebase UID is in `INTEGRATION_LOG_VIEWER_UIDS` | Optional integer `limit` 1–50 | `200 {"data":[log metadata]}`. Payloads, partner responses, and target URLs are omitted. Other Organizers receive `403`. |

## Partner routes

| Method and path | Access | Request | Current success behavior |
|---|---|---|---|
| `GET /partner/activities?limit=20` | `X-Partner-Key` | Optional integer `limit` 1–50 | `200` with published activities projected to partner fields, request ID, and generated time. |
| `POST /webhooks/partner` | `X-Webhook-Secret` | Event object with `id`, `type`, `occurredAt`, and object `data` | First accepted event returns `201`; exact duplicate ID+payload returns `200` with `duplicate: true`; same ID with different payload returns `409 EVENT_ID_CONFLICT`. |

## Integration worker behavior

- Activity publication and outbox creation occur in the same Firestore transaction. A persistent API process polls due webhook jobs every 30 seconds, leases each for 60 seconds, and retries failed deliveries with delays capped at 5 minutes.
- Webhook retries currently have no maximum-attempt/dead-letter policy. This is unchanged in Phase 2 and remains a reliability follow-up.
- Partner consumer requests are coalesced while in flight. Failed reads return the last successful response as stale data when available; the worker retries a degraded consumer state after its next check time.
- Emulator tests cover the existing provider route, webhook authentication/idempotency/conflict behavior, and unconfigured consumer response. They do not call Team 10 or verify a live retry/recovery cycle.

## Current errors

- `400`: malformed ID/body, unknown or invalid fields, invalid date/time, invalid limit/cursor, or invalid webhook event.
- `401`: missing/invalid/revoked Firebase token or invalid partner/webhook secret.
- `403`: unverified email, unprovisioned role, wrong role, failed ownership check, unapproved CORS origin, or denied preflight.
- `404`: missing resource or activity not visible to caller.
- `409`: duplicate registration, closed/non-published activity registration, invalid lifecycle/deletion, registration integrity failure, or webhook ID conflict.
- `500`: unexpected error mapped to `INTERNAL_ERROR`.

## Remaining frontend/deployment requirements

1. Configure `FRONTEND_ORIGINS` on the deployed API with the exact deployed HTTPS frontend origin. The local default is for development only.
2. Configure `INTEGRATION_LOG_VIEWER_UIDS` with the dedicated operator Organizer UID(s) if diagnostic-log access is needed. It is deny-by-default when unset.
3. A persistent process runs the integration retry worker. Keep the backend on a persistent host unless the worker is separately redesigned.
4. Emulator regressions cover the current contract; production Auth/Firestore and browser integration remain untested.

This contract is an inventory for implementation. API behavior and these unresolved points must be covered by tests before the corresponding frontend features are treated as complete.
