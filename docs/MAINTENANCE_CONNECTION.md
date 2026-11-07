# Maintenance connection and Team 10 handoff

Updated 2026-11-07. The creation and signed-webhook contracts were supplied by
the user from Team 10. Automated verification uses isolated partner doubles.
A real manual work order was created through Team 10's local tunnel on Nov 7;
that result and the earlier inbound delivery/operator link are recorded below.

## Organizer flow

1. **Create/Edit activity → Facilities support** saves private requirements such
   as microphones or room setup. Saving/publishing does not send a facilities
   request or reserve a venue. Existing publication notifications are unchanged.
2. Publish the activity, then open **My activities → activity title → Facilities
   support → Review facilities request**. Review the exact saved title, notes,
   location, campus-time schedule and maintenance category. Cancel sends nothing.
3. **Send facilities request** makes an authenticated backend-to-Team-10 call.
   Only the owning Organizer can use it. Students, Admins and other Organizers
   cannot see the private requirements, request receipt or linked work-order panel.
4. A validated receipt atomically links the returned work order. This is the
   user's approved narrow exception to operator-only linking: the response must
   come from the configured HTTPS endpoint using the private partner key, have a
   successful supported shape and echo the sending activity's ID. Established
   links and unique reverse claims cannot be replaced. Clients never supply IDs.
5. The panel shows OPEN → ASSIGNED → IN PROGRESS → RESOLVED → CLOSED as signed
   updates arrive. RESOLVED shows **Facilities support completed**; CLOSED adds
   that the request is closed. This does not close the campus activity. Status
   refreshes every 15 seconds while the page is visible, plus manual Refresh.
   It is a last-received snapshot, not a room-availability or booking guarantee.

The submitted request snapshot remains available after later activity edits.
Editing/rescheduling an activity does not update or cancel Team 10's work order;
coordinate changes with maintenance. There is one work order per activity in the
current contract. Personal data, participant lists and Google credentials are not
included. Facilities notes are shared only through the reviewed action.

## Creation contract and safe retries

`POST https://maintenanceteam10.vercel.app/api/partner/work-orders` with server-only
`X-Partner-Key`, `Content-Type: application/json`, stable UUID `Idempotency-Key`
and `ngrok-skip-browser-warning: true`.

```json
{
  "activity_id": "campus-activity-document-id",
  "title": "Campus workshop",
  "description": "Two microphones and projector setup",
  "schedule": "2027-03-12 10:00 (Asia/Bangkok)",
  "location": "Campus hall",
  "category": "Electrical"
}
```

Supported categories: Electrical, Plumbing, HVAC, Safety. Dates and optional end
time come from saved timestamps, formatted in the configured campus timezone.
Team 10's 201 must contain `success:true, duplicate:false, workOrderId, activityId,
status`; its 200 duplicate receipt must contain `success:true, duplicate:true`
and the same identity/status fields. Status must be a supported lifecycle value.
A duplicate returns an existing work order; it does **not** update its details.

Private `facilitiesRequests/{activityId}` stores the first reviewed payload,
revision hash, stable idempotency UUID, attempt count and 45-second lease. JSON
field order is canonical so retries send identical bytes even after Firestore
serialization. Preview revisions reject activity edits made before the first
submission. Later retries deliberately use the immutable first snapshot.

- SENDING: another click cannot make a concurrent call while the lease is active.
- SENT: verified receipt and both association directions committed atomically;
  repeat submissions return the stored receipt without contacting Team 10.
- RETRYABLE: timeout, lost connection, unavailable partner, authentication issue
  or unverifiable response. Review/retry uses the same key and original payload.
  An expired SENDING lease can also be retried with this same identity.
- REVIEW_REQUIRED: definitive HTTP 400/409/422 rejection or an association
  collision. No blind retry or automatic relinking; contact the coordinator.

Requests have an 8-second timeout, a bounded 16 KB response and no secret-bearing
redirects. A webhook arriving before the creation response is preserved when the
receipt is linked. A stale lease callback cannot overwrite a newer attempt.
The existing persistent publication outbox/worker and its retries are unchanged;
facilities sends/retries require the explicit owner action.

## Signed incoming status contract

Endpoint: `POST /webhooks/partner`. Team 10 sends `X-Webhook-Secret` plus:

- `X-Webhook-Signature: sha256=<64 lowercase hex characters>`: HMAC-SHA256 with
  the agreed shared secret over the **exact UTF-8 raw body bytes**.
- `X-Event-ID`: UUID v4, equal to body `id`.
- `X-Event-Sequence` and `X-Event-Version`: equal integer strings from 1 to 5,
  matching `sequence` and `version` at both envelope and `data` levels.
- `Content-Type: application/json`; through ngrok also
  `ngrok-skip-browser-warning: true`.

```json
{
  "id": "6aee64ef-f586-49a5-a9bd-c1915a913735",
  "type": "maintenance.status_changed",
  "occurredAt": "2026-11-06T08:00:01.921Z",
  "sequence": 2,
  "version": 2,
  "data": {
    "workOrderId": "team10-work-order-id",
    "fromStatus": "OPEN",
    "toStatus": "ASSIGNED",
    "sequence": 2,
    "version": 2,
    "activityId": "campus-activity-document-id"
  }
}
```

Ordering is per work order: OPEN=1, ASSIGNED=2, IN_PROGRESS=3, RESOLVED=4,
CLOSED=5. Only a larger version updates an already versioned status, irrespective
of timestamp. Old/equal versions are acknowledged and retained in the inbox but
cannot regress the panel. Incoming `data.activityId` never establishes a link.

New event ID → 201, exact event replay → 200 with `duplicate:true`, reused ID with
changed payload → 409. Invalid secret/signature → 401; inconsistent signed
metadata → 400. Constant-time signature comparison uses length guards. No
unspecified timestamp-expiry window is invented; dedupe and versions prevent
replay effects. Use a fresh event UUID when testing the new signed envelope;
do not add fields to the already-delivered legacy test ID.

Legacy secret-only envelopes remain supported unless WEBHOOK_REQUIRE_HMAC=true.
Any signature/version metadata invokes full HMAC validation even in legacy mode.
Versioned state cannot be downgraded by a legacy update. Legacy-only updates keep
timestamp ordering and expose conflicting equal-time statuses as uncertain.

## Local setup

Keep Vite (`npm run dev`), one API and the existing port-3000 ngrok tunnel running.
Stop the old API before choosing a mode:

| API command | Reception | Creation calls | Legacy publication/polling |
|---|---|---|---|
| `npm run dev:api` | Disabled | Disabled | Disabled |
| `npm run dev:api:maintenance` | Existing shared-secret mode | Disabled | Disabled |
| `npm run dev:api:facilities` | HMAC required for maintenance | Explicit reviewed Send only | Disabled |

The facilities mode uses the ignored `backend/.env` agreed inbound secret and
TEAM10_PARTNER_KEY. The user confirmed the existing PARTNER_API_TOKEN is the same
Team 10 key, so this local mode may reuse it privately if no dedicated key is set.
The default HTTPS creation endpoint is the confirmed URL above; an approved
Team 10 HTTPS tunnel may replace TEAM10_WORK_ORDER_API_URL with the same API path.
Do not put partner/shared secrets in frontend configuration or chat. No mode
rotates secrets, starts ngrok or automatically sends a request on startup.

Current agreed receiver:
`https://veneering-decipher-entire.ngrok-free.dev/webhooks/partner`.
Tunnel it to localhost:3000. Both API and tunnel must be running for delivery.
For hosted persistent API configuration set TEAM10_WORK_ORDERS_ENABLED=true,
TEAM10_PARTNER_KEY, WEBHOOK_REQUIRE_HMAC=true and WEBHOOK_INBOUND_SECRET privately;
configure TEAM10_WORK_ORDER_API_URL only if changing the confirmed endpoint.
No persistent worker migration is required.

For the next real creation test, use an **unlinked published activity with saved
facilities notes**, review the details and explicitly send once. Ask Team 10 to
confirm that returned workOrderId appears on their dispatch board and progress it
through the signed lifecycle. The already linked manual test activity keeps its
existing work order and offers no new Send action. No live creation is claimed
until that coordinated test is observed.

### Failed request diagnostic follow-up — 2026-11-07

User selected activity `rXTvjUumz1aTJDwiq9yt`. One attempt is RETRYABLE with
FACILITIES_PARTNER_UNAVAILABLE at 2026-11-07T06:57:14.099Z, without a returned
workOrderId or binding. Our handler returned HTTP 200 with the authoritative
failed state, not partner acceptance. The original remote HTTP status was not
persisted, so its exact cause cannot be reconstructed from that generic code.

New attempts privately record only numeric partnerHttpStatus (or null for a
transport failure); response bodies, credentials and headers are not retained.
A POST 404 now gives FACILITIES_PARTNER_NOT_FOUND and prompts the coordinator to
verify Team 10's deployed creation URL. It stays RETRYABLE with the same payload
and idempotency identity. No new diagnostic fields are added to owner DTOs.

Our local/public health and the manual authenticated Team 10 health GET passed.
GET /api/partner/work-orders returned 404; that method check alone does not prove
the POST route is missing. An actual new owner-reviewed retry is still needed to
capture its POST result. The target page was found in Brave's Organizer session,
but automatic approval review blocked the coordinate click as potentially
submitting a real work order. No workaround or retry was performed. User should
review/retry through the existing UI, then share the resulting screen for scoped
receipt verification. Build and all 96 isolated backend tests passed. Facilities
API restarted; public health 200 at 2026-11-07T07:01:44Z. No deployed fix claimed.

### Owner retry confirmed creation POST 404 — 2026-11-07

After the user explicitly retried, scoped receipt read confirmed activity
`rXTvjUumz1aTJDwiq9yt`, attempts=2, state RETRYABLE,
FACILITIES_PARTNER_NOT_FOUND, partnerHttpStatus=404, updated
2026-11-07T07:03:42.136Z. No returned workOrderId or binding. This is now evidence
of the actual creation POST failing, not merely the earlier GET method probe.
Configured URL: https://maintenanceteam10.vercel.app/api/partner/work-orders.
Receiver public health returned 200 at 07:04:07Z. No additional retry/partner
request or connected-record write was performed during this verification.
Team 10 must confirm/correct its deployed POST route/domain or supply the correct
contract URL privately through the coordinator. Do not guess alternate routes or
change credentials. Retry the original request only after the endpoint is fixed.

### Real local creation receipt — 2026-11-07

Team 10 supplied https://ethanol-prayer-skyline.ngrok-free.dev/api/partner/work-orders.
Its health accepted the agreed key with 200. Configured this URL only in ignored
backend/.env and restarted the verified facilities API; no credential change.
The user chose to perform the final UI retry themselves. Original details were
visible in the review dialog; the agent did not click the final submit control.

At 2026-11-07T07:52:34.636Z (14:52 Bangkok), activity rXTvjUumz1aTJDwiq9yt's
third attempt returned 201, duplicate=false, SENT, OPEN and workOrderId
39a8f615-6561-406d-8c4f-c30ecb063f0a. Scoped reads verified original canonical
payload/retry identity unchanged, unique bidirectional links and source
TEAM10_CREATION_RESPONSE. Actual Organizer UI showed accepted, matching ID and
Maintenance status OPEN. Our public receiver health was 200 at 07:52:49Z.

OPEN sequence/version 1 is the creation snapshot, not a lifecycle webhook.
Team 10 Dispatch Board visibility and signed status versions 2–5 still need peer
confirmation and per-event receiver/UI checks. This is a partner-local test,
not deployed production creation evidence. This activity is now linked to that
local work order; do not relink/recreate it against production. Use a separate
activity for a later deployed-environment test. No push/deploy.
See [sanitized evidence](evidence/maintenance-local-creation-2026-11-07/check-results.json).

## Trusted setup for existing work orders

Confirm both IDs with the coordinator; dry run, then explicit application:

```sh
npm run maintenance:link -- --activity ACTIVITY_ID --work-order WORK_ORDER_ID
npm run maintenance:link -- --activity ACTIVITY_ID --work-order WORK_ORDER_ID --apply
```

The tool requires PUBLISHED/CLOSED, validates both unique mapping directions and
never calls Team 10. No arbitrary unlink/relink API is exposed. Private records
are maintenanceBindings/{activityId}, maintenanceWorkOrderLinks/{sha256(orderId)},
maintenanceWorkOrders/{sha256(orderId)} and facilitiesRequests/{activityId}.
Direct browser access remains denied; owner DTOs exclude secret headers, full
inbox payloads, idempotency keys and lease credentials. New lookups need no index.

Remaining partner agreement: cancellation/rescheduling, correcting a rejected
immutable request, category/venue business rules and sandbox availability. These
are not silently implemented as edit or resend operations.

## Verification boundaries

### Coordinated test readiness — 2026-11-07

A scoped read of the ten most recent facilities receipts found one request:
activity `uEha4rNd3OZsngPGZdk4`, RETRYABLE, one attempt, error
FACILITIES_PARTNER_UNAVAILABLE, updated 2026-11-06T14:24:27.341Z, with no returned
workOrderId. This is distinct from the historical operator-linked test below.
No retry was submitted and no work order or association was created in this check.

The verified local API was running normal disabled-integrations mode, and ngrok
was offline (public health returned ERR_NGROK_3200). Restarted only that verified
project API in facilities mode and restored the existing approved ngrok URL to
localhost:3000. Public /health returned 200, status ok, at
2026-11-07T06:52:50Z. A diagnostic unsigned empty POST to /webhooks/partner returned
401 INVALID_WEBHOOK_SECRET at 06:54:20Z, confirming route reachability and the
authentication boundary. This probe creates rejection audit/request evidence;
it is not a valid status delivery or a maintenance-state change. GET on that
POST-only route returns 404 normally.

One manual read-only GET to Team 10's deployed /api/partner/health using our
configured X-Partner-Key returned 200. The local facilities key currently reuses
PARTNER_API_TOKEN; no key was changed or disclosed. Creation URL remains
https://maintenanceteam10.vercel.app/api/partner/work-orders. Their reported 401
with their locally configured key requires their private environment alignment;
our health success does not prove creation or dispatch-board acceptance.

Current Chrome session was on Admin overview. No role bypass, impersonation or
request submission was performed. The owning Organizer should review/retry the
existing failed request in the UI, preserving its stable idempotency identity.
New signed deliveries and per-transition HTTP/stored/UI confirmations remain
pending Team 10. Runtime availability lasts only while both local processes run.

On 2026-11-06 the user supplied a new coordinated Team 10 delivery report through
ngrok. A targeted read-only check of our connected project's inbox, two matching
request records and latest maintenance projection confirmed secret verification,
HTTP 201 then 200 and ASSIGNED for the reported event. At verification time the
work order had no trusted activity association, so real Organizer-panel linkage
remained pending the user's target URL. See
[sanitized manual evidence](evidence/maintenance-live-2026-11-06/check-results.json).
This manual receipt verification is distinct from the isolated checks below.

The user then selected published activity `iGR6mXYnQMDHBYV8GnZ4`. Its trusted
association dry run and application completed, with independent readback of both
mapping directions and the same ASSIGNED event/status. Only the two mapping
records were written, under that explicit selection. The actual Organizer panel
refresh remains a user walkthrough; the backend association/status are verified.

The backend emulator suite exercises secret rejection, accepted/duplicate/older
updates, equal-time conflicts, trusted link uniqueness, owner-only reads and
ignored untrusted correlation claims. The browser test uses a guarded local
fixture process to link a demo event and invoke the actual receiver projection;
it creates no real work order and makes no partner HTTP call. API tests separately
exercise the actual HTTP webhook receiver. No current production connectivity,
deployed-production creation or cross-team completion acceptance is claimed.
The later real partner-local creation is documented separately above.
