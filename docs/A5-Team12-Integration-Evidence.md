# A5-Team12-Integration-Evidence

> Status: implementation prepared; joint evidence is pending the partner group's
> endpoint and a coordinated test. Replace every bracketed placeholder with real
> evidence. Do not claim a test passed until the screenshots and logs exist.

## Integration summary

| Item | Value |
|---|---|
| Team | Team 12 — Events & Clubs |
| Partner group | `[GROUP NAME]` |
| Partner project | `[PROJECT NAME]` |
| Our base URL | `https://pd-project-events-clubs.onrender.com` |
| Test window | `[START AND END WITH TIME ZONE]` |

## 1. Consumer Proof

Team 12 called the partner's endpoint.

| Evidence | Value |
|---|---|
| Partner URL | `[METHOD AND URL]` |
| Request timestamp | `[ISO-8601 TIMESTAMP WITH TIME ZONE]` |
| Correlation/request ID | `[REQUEST ID]` |
| HTTP status | `[STATUS]` |
| Response summary | `[SHORT DESCRIPTION]` |
| Screenshot | `[INSERT IMAGE OR RELATIVE LINK]` |

```json
[PASTE REDACTED RESPONSE BODY]
```

Internal Firestore evidence: `integrationLogs` record with
`kind = partner.fetch` and the matching `requestId`.

## 2. Provider Proof

The partner called Team 12's endpoint:

```http
GET https://pd-project-events-clubs.onrender.com/partner/activities?limit=20
```

| Evidence | Value |
|---|---|
| Partner request timestamp | `[TIMESTAMP]` |
| Response `requestId` | `[REQUEST ID]` |
| HTTP status | `[STATUS]` |
| Internal request log | `[SCREENSHOT/LINK TO requestLogs DOCUMENT OR RENDER LOG]` |
| Partner confirmation | `[QUOTE OR SCREENSHOT/LINK]` |

The secret `X-Partner-Key` value must be hidden in all screenshots.

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

## 4. Webhook Sender

An organizer published an activity. Team 12 queued and sent an
`activity.published` event to the partner.

| Evidence | Value |
|---|---|
| Internal trigger | `[ACTIVITY ID CHANGED DRAFT → PUBLISHED]` |
| Event ID | `[EVENT ID]` |
| Trigger timestamp | `[TIMESTAMP]` |
| Partner webhook URL | `[URL]` |
| Partner HTTP response | `[STATUS AND REDACTED BODY]` |
| Outbox/log evidence | `[SCREENSHOT/LINK]` |

```json
[PASTE OUTGOING PAYLOAD]
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

- [ ] Consumer: partner URL, request timestamp, response body screenshot.
- [ ] Provider: our URL, internal request log, partner confirmation.
- [ ] Receiver: payload, secret verification result, stored log.
- [ ] Sender: trigger, outgoing payload, partner response log.
- [ ] Idempotency: request 1/2 payloads and one stored inbox record.
- [ ] Degradation: breakage timestamp, fallback JSON, automatic recovery log.
- [ ] All secrets, passwords, Firebase tokens, and service-account data are redacted.

