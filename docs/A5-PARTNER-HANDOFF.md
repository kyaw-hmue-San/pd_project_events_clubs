# Team 12 — Events & Clubs Integration Handoff

Hello! Team 12 has prepared our provider API and webhook contract for Assignment 5.

## Our system

- **Service:** Campus Events & Clubs
- **Base URL:** `https://pd-project-events-clubs.onrender.com`
- **Health check:** `GET /health`
- **Partner API:** `GET /partner/activities?limit=20`
- **Authentication:** `X-Partner-Key: <shared privately>`
- **Webhook receiver:** `POST /webhooks/partner`
- **Webhook authentication:** `X-Webhook-Secret: <shared privately>`

We will send the two secrets privately. Do not put them in GitHub, screenshots,
or the submitted Markdown file.

## Provider API request

```http
GET https://pd-project-events-clubs.onrender.com/partner/activities?limit=20
X-Partner-Key: <partner-api-key>
Accept: application/json
```

Successful response:

```json
{
  "data": [
    {
      "id": "activity-document-id",
      "title": "Campus Welcome Event",
      "description": "Meet students and discover campus activities.",
      "activityType": "EVENT",
      "dateTime": "2026-10-01T03:00:00.000Z",
      "location": "University Main Hall",
      "status": "PUBLISHED",
      "registrationCount": 0
    }
  ],
  "requestId": "server-generated-correlation-id",
  "generatedAt": "2026-09-20T15:00:00.000Z"
}
```

Please call this endpoint and send us:

1. Your group name and project name.
2. A screenshot showing the URL, request timestamp, `200` status, and response body.
3. The response's `requestId`, so we can match it to our internal log.
4. A short confirmation: “Group ___ successfully consumed Team 12's endpoint at ___.”

## Webhook you may send to us

```http
POST https://pd-project-events-clubs.onrender.com/webhooks/partner
Content-Type: application/json
X-Webhook-Secret: <inbound-webhook-secret>
X-Event-ID: partner-event-001
```

```json
{
  "id": "partner-event-001",
  "type": "notification.delivered",
  "occurredAt": "2026-09-20T15:00:00Z",
  "data": {
    "activityId": "activity-document-id",
    "message": "Partner processed the activity"
  }
}
```

Rules:

- `id` must be stable and unique for the logical event.
- Retrying the exact same event with the same `id` returns `duplicate: true`
  and does not create a second inbox record.
- Reusing an `id` with a different payload returns `409 EVENT_ID_CONFLICT`.
- Keep the body under 8 KB.

First delivery response (`201`):

```json
{
  "received": true,
  "duplicate": false,
  "eventId": "partner-event-001",
  "requestId": "server-generated-correlation-id"
}
```

Repeated identical delivery response (`200`):

```json
{
  "received": true,
  "duplicate": true,
  "eventId": "partner-event-001",
  "requestId": "server-generated-correlation-id"
}
```

## Information we need from your group

Please reply with:

```text
Group name:
Project name:
Base URL:
Consumer endpoint we should call:
HTTP method:
Authentication header/instructions:
Example success response:
Webhook receiver URL:
Webhook secret/header instructions:
Webhook event types you accept:
```

Our planned outgoing event is `activity.published`. It is generated when an
organizer changes an activity from `DRAFT` to `PUBLISHED`:

```json
{
  "id": "unique-event-id",
  "type": "activity.published",
  "occurredAt": "2026-09-20T15:00:00.000Z",
  "data": {
    "activityId": "activity-document-id",
    "title": "Backend Workshop",
    "activityType": "EVENT",
    "dateTime": "2026-10-02T02:00:00.000Z",
    "location": "Computer Lab 2",
    "status": "PUBLISHED"
  }
}
```

We retry failed deliveries automatically and record the partner response. Once
you send your endpoint details, we will configure and run the joint evidence test.

