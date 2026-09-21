# A5–Team12–Integration–Evidence

**Team 12:** Campus Events & Clubs

**Partner:** Team 10, Maintenance platform

**Team 12 API:** `https://pd-project-events-clubs.onrender.com`

**Team 10 API:** `https://maintenanceteam10.vercel.app`
**Test date:** 21 September 2026, UTC

This report records the six Assignment 5 evidence areas. All identifiers and times below come from the supplied Postman responses, Firestore screenshots, Team 10's redacted report, and the [redacted integration log extract](evidence/integration-log-extract.json). Authentication values are omitted.

## 1. Consumer proof: Team 12 calls Team 10

Team 12 called Team 10's `GET /api/partner/health` through our authenticated `GET /api/integration/partner` route. The healthy response was HTTP `200` with `status: "ok"`, `stale: false`, Team 10 service data, and request ID `c292cbba-ba5f-4663-ba34-142caafcc0f5`. Its `lastSuccessAt` was `2026-09-21T15:30:52.917Z`.

The matching `partner.fetch` log is `integrationLogs/1MzNuzsIaRmtde1EsW2Z`: `source: api-request`, Team 10 HTTP `200`, `outcome: ok`, `recovered: false`, and the same request ID.

![Healthy consumer response, Postman request 16](<evidence/Screenshot 2569-09-21 at 22.31.14.png>)

![Matching consumer log, Postman request 17](<evidence/Screenshot 2569-09-21 at 22.32.04.png>)

## 2. Provider proof: Team 10 calls Team 12

Team 10 reported a successful `GET https://pd-project-events-clubs.onrender.com/partner/activities?limit=20` at `2026-09-21T14:55:51.8064554Z`. Their HTTP response was `200`, included five published activities, and carried request ID `53f7919b-1d3a-4f82-8ff5-0bfb00400960`. The screenshot of our internal `requestLogs` document with that ID shows `GET /partner/activities`, status `200`, duration `263 ms`, and time 21:55:52 UTC+7 (14:55:52 UTC).

![Team 12 provider request log matching Team 10's request ID](<evidence/Screenshot 2569-09-21 at 22.33.15.png>)

Team 10's confirmation and response summary are transcribed above from its redacted handoff. Its full response screenshot was not supplied to this workspace.

## 3. Webhook receiver proof: Team 12 receives Team 10

Team 10 sent the following event to `POST https://pd-project-events-clubs.onrender.com/webhooks/partner` using the privately shared `X-Webhook-Secret`:

```json
{
  "id": "a95db2cc-99b2-4e23-ba2e-979319ef7538",
  "type": "maintenance.status_changed",
  "occurredAt": "2026-09-21T14:55:52.6173967Z",
  "data": {
    "workOrderId": "88888888-8888-4888-8888-888888888888",
    "fromStatus": "OPEN",
    "toStatus": "ASSIGNED"
  }
}
```

The first accepted delivery returned HTTP `201` with `received: true`, `duplicate: false`, event ID `a95db2cc-99b2-4e23-ba2e-979319ef7538`, and request ID `ce850655-28d2-42c9-9041-677b1f7a834f`. Its `webhook.received` log is `integrationLogs/rB92i4e1ygsxJBkb5Z5J`, at `2026-09-21T15:01:13.124Z`, with `secretVerified: true` and `outcome: CREATED`.

The stored document `webhookInbox/a95db2cc-99b2-4e23-ba2e-979319ef7538` contains the event, first request ID, received timestamp, payload hash, and `secretVerified: true`.

![Single stored maintenance event in Team 12's webhook inbox](<evidence/Screenshot 2569-09-21 at 22.32.35.png>)

The receiver initially rejected this event because its seven-digit fractional timestamp exceeded the old three-digit validation limit. Team 12 expanded the validator to accept up to nine fractional digits and Team 10's retry succeeded. The earlier rejected requests did not create inbox records.

## 4. Webhook sender proof: Team 12 sends Team 10

Publishing Team 12 activity `sm5ioKgDgsWkSYYKhLV2` generated event `419f3a6f-8bed-4426-8269-f3473f20b011` at `2026-09-21T14:33:11.125Z`. The event type was `activity.published`; its payload included the activity ID, title, type, date/time, location, and `PUBLISHED` status. Team 12's `webhook.sent` log `integrationLogs/Ou2KGdWTA0DyRTTBef7W` records attempt 1, Team 10 HTTP `201`, response `received: true`, `duplicate: false`, and `outcome: DELIVERED`. Team 10 separately confirmed that it stored this event in its inbox at `2026-09-21T14:33:18.151612Z`.

A separate Postman screenshot below shows the same application trigger path: activity `zBV4crPasygVyLVpygv1` changed to `PUBLISHED` by `PATCH /api/activities/{activityId}` and returned HTTP `200`. This screenshot is **not** presented as the trigger for event `419f3a6f-8bed-4426-8269-f3473f20b011`; the activity IDs differ.

![Later activity publication through Postman](<evidence/Screenshot 2569-09-21 at 22.34.52.png>)

The [log extract](evidence/integration-log-extract.json) contains the delivered event's outgoing payload and Team 10 response. It also shows a separate webhook retry: event `9cc046ef-391c-457c-a545-0c981a0a7d29` had a failed first attempt at 15:10:33 UTC, then automatic attempt 2 succeeded at 15:11:29 UTC with Team 10 HTTP `200`, `duplicate: true`, `outcome: DELIVERED`, and `recovered: true`.

## 5. Idempotency proof

Team 10 sent the **identical maintenance event** twice. Both requests used event ID `a95db2cc-99b2-4e23-ba2e-979319ef7538` and the same payload hash `93f0b6328d4accc357d6f4c43e4c035d0b29d9f902beb14228672ae7ea1e6b75`.

| Delivery | Team 10 send time (UTC) | HTTP | Response | Team 12 log |
|---|---|---:|---|---|
| First | 15:01:11.9626252 | 201 | `duplicate: false`, request ID `ce850655-28d2-42c9-9041-677b1f7a834f` | `rB92i4e1ygsxJBkb5Z5J`: `CREATED` |
| Second | 15:01:13.2203466 | 200 | `duplicate: true`, request ID `4b2605ed-0882-4af0-b575-fb6335f2f4b4` | `Z9Vdpv3I9K2kKoEZfR05`: `DUPLICATE` |

Both internal logs show `secretVerified: true`. The Firestore inbox screenshot in section 3 shows one document keyed by this event ID. The two full internal log entries are in the [redacted log extract](evidence/integration-log-extract.json). Team 10 supplied the two HTTP response bodies as redacted text; response screenshots were not supplied to this workspace.

## 6. Degradation and recovery proof

Team 10 verified that its `GET /api/partner/health` endpoint returned HTTP `503` at `2026-09-21T15:15:09.5917579Z`, with `PARTNER_UNAVAILABLE`. At `15:16:12.343Z`, Team 12's application call returned HTTP `200` containing fallback JSON: `status: degraded`, `stale: true`, the last successful Team 10 data, `lastSuccessAt: 2026-09-21T14:30:45.590Z`, `reason: PARTNER_UNAVAILABLE`, `retryAfterSeconds: 30`, and request ID `6c1aa848-2b27-40d6-9356-5f53c3c3c754`.

The matching `partner.fetch` log `integrationLogs/GePhUqmhXGIbqL5fxfcZ` records Team 10 HTTP `503`, `source: api-request`, `outcome: degraded`, and the same request ID. Subsequent `source: automatic-retry` consumer attempts, including `integrationLogs/Y3y8HCVPs4WNUfIL1fOV` at 15:24:58 UTC, still received `503`.

![Degraded fallback response with cached partner data](<evidence/User attachment.png>)

By `2026-09-21T15:25:57.812Z`, the endpoint was healthy again. Postman request 16 returned `status: ok`, `stale: false`; `integrationLogs/VchfKsSla6ypvdjM9gxT` records Team 10 HTTP `200` and `recovered: true`. **That successful consumer log has `source: api-request`, so it proves recovery after a manual call, not automatic consumer recovery.** A successful `partner.fetch` log with `source: automatic-retry` was not captured. The separate automatic webhook recovery is documented in section 4.

## Evidence limitations and redaction

The supplied screenshots show the consumer response and matching log, provider request log, webhook inbox record, one publication response, and degraded fallback. Team 10's provider response and two webhook responses, plus several Team 12 log entries, were supplied as redacted text and are transcribed or linked above. The publication screenshot and the primary delivered webhook refer to different activities and are labelled accordingly. The automatic **consumer** recovery log required by the evidence audit was not observed; the documented successful consumer recovery followed a manual API request.

No partner key, webhook secret, Firebase token, password, or service-account credential appears in this report or its included screenshots and log extract.
