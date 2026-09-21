# A5-Team12-Integration-Evidence

> Status: Team 12's application consumer succeeded against Team 10 on
> 2026-09-21, and an application-triggered `activity.published` delivery
> succeeded. Team 10's provider call succeeded, but its maintenance webhook
> received `400` because its timestamp had seven fractional digits and the
> deployed validator accepted at most three. The validator is fixed locally;
> redeploy and retry are pending. Degradation evidence remains pending. Replace every bracketed placeholder
> with real evidence.

## Integration summary

| Item | Value |
|---|---|
| Team | Team 12 — Events & Clubs |
| Partner group | Team 10 |
| Partner project | Maintenance platform |
| Our base URL | `https://pd-project-events-clubs.onrender.com` |
| Test window | `[START AND END WITH TIME ZONE]` |

## Manual Team 10 endpoint smoke tests

These calls were made directly from a shell; they do not establish an
application `partner.fetch` log or an activity-triggered `webhook.sent` log.

| Test | Time (UTC, from response `Date`) | HTTP status | Response |
|---|---|---|---|
| `GET https://maintenanceteam10.vercel.app/api/partner/health` with `X-Partner-Key` | 2026-09-21 14:10:02 | 200 | `{"status":"ok","service":"maintenance-team10-api"}` |
| `POST https://maintenanceteam10.vercel.app/api/integrations/team12/webhook` with `activity.published` | 2026-09-21 14:10:25 | 201 | `{"received":true,"duplicate":false,"eventId":"team12-test-1789999823"}` |
| Repeat identical POST with the same event ID and payload | 2026-09-21 14:11:12 | 200 | `{"received":true,"duplicate":true,"eventId":"team12-test-1789999823"}` |

The POST used `X-Webhook-Secret` and `X-Event-ID`. No secret value is recorded
here. Team 10's response confirms duplicate handling for this test event.

## 1. Consumer Proof

Team 12 called the partner's endpoint.

| Evidence | Value |
|---|---|
| Partner URL | `GET https://maintenanceteam10.vercel.app/api/partner/health` |
| Request timestamp | `2026-09-21T14:30:45.590Z` (matching internal log) |
| Correlation/request ID | `1121313f-2b3f-438f-b28e-f8c0e8eb6396` |
| HTTP status | `200` |
| Response summary | Team 10 returned `status: ok`, `service: maintenance-team10-api`; Team 12 returned `status: ok`, `stale: false` |
| Screenshot | Postman request 16 response shown in conversation; export or attach to submission |

```json
{
  "status": "ok",
  "data": {
    "status": "ok",
    "service": "maintenance-team10-api"
  },
  "stale": false,
  "lastSuccessAt": "2026-09-21T14:30:45.590Z",
  "requestId": "1121313f-2b3f-438f-b28e-f8c0e8eb6396"
}
```

Internal Firestore evidence: `integrationLogs/XXezQzDkMP3aD0DfBHZb` has
`kind = partner.fetch`, `source = api-request`, `httpStatus = 200`,
`outcome = ok`, `recovered = false`, and the matching `requestId`.

## 2. Provider Proof

The partner called Team 12's endpoint:

```http
GET https://pd-project-events-clubs.onrender.com/partner/activities?limit=20
```

| Evidence | Value |
|---|---|
| Partner request timestamp | `2026-09-21T14:55:51.8064554Z` (Team 10 report) |
| Response `requestId` | `53f7919b-1d3a-4f82-8ff5-0bfb00400960` |
| HTTP status | `200`; Team 10 reports five published activities |
| Internal request log | `[SCREENSHOT/LINK TO requestLogs DOCUMENT OR RENDER LOG]` |
| Partner confirmation | Team 10's redacted integration report received in conversation; attach their response screenshot |

The secret `X-Partner-Key` value must be hidden in all screenshots.
Find `requestLogs/53f7919b-1d3a-4f82-8ff5-0bfb00400960` in Firestore and
capture it to finish the internal request-log requirement.

## 3. Webhook Receiver

The partner sent an event to:

```http
POST https://pd-project-events-clubs.onrender.com/webhooks/partner
```

| Evidence | Value |
|---|---|
| Event ID and type | `[ID]`, `[TYPE]` |
| Received timestamp | `[TIMESTAMP]` |
| Secret verification result | `true` |
| HTTP result | `[201/200]` |
| Stored inbox record | `[SCREENSHOT/LINK TO webhookInbox/{eventId}]` |
| Stored log | `[SCREENSHOT/LINK TO integrationLogs RECORD]` |

```json
[PASTE INCOMING PAYLOAD WITH SECRETS REMOVED]
```

Team 10 sent `maintenance.status_changed` event
`a95db2cc-99b2-4e23-ba2e-979319ef7538` twice at
`2026-09-21T14:56:14.0258278Z` and `2026-09-21T14:56:14.9710141Z`.
Both returned `400 INVALID_WEBHOOK_EVENT`. Its `occurredAt` was
`2026-09-21T14:55:52.6173967Z`; the seven fractional digits exceeded the
deployed three-digit validator limit. The event type itself is accepted.
The local validator now permits up to nine fractional digits. After deploy,
Team 10 must resend the identical event twice to collect `201` and `200`
receiver/idempotency evidence. The earlier failed attempts did not create an
inbox record.

## 4. Webhook Sender

An organizer published an activity. Team 12 queued and sent an
`activity.published` event to the partner.

| Evidence | Value |
|---|---|
| Internal trigger | Activity `sm5ioKgDgsWkSYYKhLV2` changed from draft to `PUBLISHED` via Postman request 07; retain the request/response screenshot |
| Event ID | `419f3a6f-8bed-4426-8269-f3473f20b011` |
| Trigger timestamp | `2026-09-21T14:33:11.125Z` (`occurredAt`) |
| Partner webhook URL | `https://maintenanceteam10.vercel.app/api/integrations/team12/webhook` |
| Partner HTTP response | `201`, `{"received":true,"duplicate":false,"eventId":"419f3a6f-8bed-4426-8269-f3473f20b011"}` |
| Outbox/log evidence | `integrationLogs/Ou2KGdWTA0DyRTTBef7W`; `attempt = 1`, `outcome = DELIVERED`, `recovered = false`; attach request 17 screenshot |

```json
{
  "id": "419f3a6f-8bed-4426-8269-f3473f20b011",
  "type": "activity.published",
  "occurredAt": "2026-09-21T14:33:11.125Z",
  "data": {
    "activityId": "sm5ioKgDgsWkSYYKhLV2",
    "title": "What is Love?",
    "activityType": "EVENT",
    "dateTime": "2026-10-02T02:00:00.000Z",
    "location": "Computer Lab 2",
    "status": "PUBLISHED"
  }
}
```

## 5. Idempotency Proof

The partner sent the exact same event twice with the same event ID.

| Evidence | First request | Second request |
|---|---|---|
| Timestamp | `[TIMESTAMP]` | `[TIMESTAMP]` |
| Event ID | `[SAME ID]` | `[SAME ID]` |
| HTTP status | `201` | `200` |
| `duplicate` | `false` | `true` |
| Request ID | `[REQUEST ID 1]` | `[REQUEST ID 2]` |

Database proof: show exactly one document at `webhookInbox/{eventId}` and two
`integrationLogs` attempts (`CREATED`, then `DUPLICATE`).

## 6. Degradation Proof

Team 12 called the partner while its endpoint was intentionally unavailable.
The API returned fallback JSON, retained the last successful data where available,
and scheduled a retry.

```json
{
  "status": "degraded",
  "data": null,
  "stale": true,
  "lastSuccessAt": null,
  "reason": "PARTNER_UNAVAILABLE",
  "retryAfterSeconds": 30,
  "requestId": "[REQUEST ID]"
}
```

| Evidence | Value |
|---|---|
| Breakage timestamp | `[TIMESTAMP]` |
| Fallback response screenshot | `[IMAGE/LINK]` |
| Failed `partner.fetch` log | `[IMAGE/LINK]` |
| Partner restored timestamp | `[TIMESTAMP]` |
| Automatic recovery log | `[LOG WITH source=automatic-retry, recovered=true]` |
| Final status | `ok` |

## Evidence audit

- [x] Consumer: partner URL, request timestamp, response body, and matching log captured; attach the Postman screenshot to the submitted file.
- [ ] Provider: our URL, internal request log, partner confirmation.
- [ ] Receiver: payload, secret verification result, stored log.
- [x] Sender: trigger, outgoing payload, and partner response log captured; attach Postman screenshots.
- [ ] Idempotency: request 1/2 payloads and one stored inbox record.
- [ ] Degradation: breakage timestamp, fallback JSON, automatic recovery log.
- [ ] All secrets, passwords, Firebase tokens, and service-account data are redacted.

## Next execution steps for Team 12

1. In Render's Environment settings, set `PARTNER_API_URL` to
   `https://maintenanceteam10.vercel.app/api/partner/health`,
   `PARTNER_API_HEADER_NAME` to `X-Partner-Key`, `PARTNER_API_TOKEN` to the
   privately shared Team 10 partner key, `PARTNER_WEBHOOK_URL` to
   `https://maintenanceteam10.vercel.app/api/integrations/team12/webhook`, and
   `WEBHOOK_OUTBOUND_SECRET` to the privately shared Team 10 webhook secret.
   Redeploy and verify `/health`. The local `firebase/.env` is not uploaded to
   Render.
2. In the updated `Campus_Events_API.postman_collection.json`, set `baseUrl` to
   the live Team 12 URL and sign in as a provisioned Organizer with request 02.
   Run request 16 (`Consume Team 10 Partner API`), then request 17 (`Read
   Integration Logs`). Match the response `requestId` to a `partner.fetch` log.
3. Run request 06 to create a draft, then request 07 to publish it. After at
   least 30 seconds while the Render service is awake, run request 17 again.
   Match the published activity's ID to a `webhook.sent` log with
   `outcome = DELIVERED` and Team 10's HTTP response.
4. Ask Team 10 to call our provider endpoint and send a real
   `maintenance.status_changed` event twice with the exact same body and ID.
   Use request 17 and the Firestore inbox to collect our provider, receiver,
   and idempotency evidence.
5. Coordinate a brief Team 10 endpoint outage for degradation and recovery
   evidence. Capture the failed consumer response and subsequent
   `partner.fetch` log with `source = automatic-retry` and `recovered = true`.
