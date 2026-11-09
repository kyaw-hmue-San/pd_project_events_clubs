# Integration request — Notification Hub

Status on 9 November 2026: coordination attempted, per user confirmation.
The message below is the request proposal, not a completed implementation.
No notification API call, queued/delivered result or recipient sharing is claimed.

Hi Notification Hub team! We’re Team 12, **Campus Events & Clubs**.

We’d like to connect with your system using **one existing API endpoint**, starting with a registration confirmation notification after a student successfully registers for an activity.

**Proposed connection:** Our backend sends a **POST** request to your notification API.

We can provide:

- Recipient reference, in the format your system supports.
- Activity ID, title, date/time and location.
- Activity page link and confirmation message.
- A unique request ID to help prevent duplicate notifications on retries.

We’d like a response containing a notification ID and its actual status, such as accepted or queued. Acceptance does not have to mean the notification has already been delivered. A separate fetch endpoint is not required for this first flow.

**Can your current API support this?** If not, please tell us what notification type, recipient format or existing endpoint you can offer. We can agree on a smaller flow that fits both systems.

Please share the endpoint URL, HTTP method, authentication instructions, and an example request/response. Also let us know whether duplicate-request protection is supported. An HTTPS ngrok URL is fine for testing.

Please exchange credentials privately. We can test with an agreed test recipient when your team is ready. Thanks!
