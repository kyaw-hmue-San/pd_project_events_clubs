# Team 17 Internship connection

9 November 2026: user confirms the read-only connection is completed. This is
user-reported acceptance, not a newly captured hosted HTTP trace. Maintenance
is the main evaluation showcase; current listings remain demo-labelled.

Campus Events & Clubs consumes one public, read-only endpoint:
`GET https://team17-internship.vercel.app/api/placements`.
The original [handover](../../Team17-Team12-API-Handover/README.md) and
[OpenAPI contract](../../Team17-Team12-API-Handover/placements.openapi.json)
remain unchanged. Applications and placement details stay on Team 17's site.

## Setup and access

Set `TEAM17_API_BASE_URL=https://team17-internship.vercel.app` in the API's
private `backend/.env` or production host environment, then restart the API.
This is a public HTTPS origin, not a key. An empty setting disables the feed.
It is independent of Team 10 settings and works in every local API mode.
There is no startup polling. Emulator configuration disables real provider calls;
automated checks inject a synthetic provider instead.

Student workspace → **Internships** offers submitted keyword/location/work-mode
filters, pagination, refresh, loading, empty and retry states. The authenticated
`GET /api/internships` proxy requires server-derived Student capability, including
enrolled Students who also have Organizer access. Admin, personal-email
Organizers and pending applicants do not gain access through this feature.

Only `Accept: application/json` is sent to the provider. Google tokens, cookies,
email, university ID, partner keys and other caller headers are not forwarded.
No records are imported, no applications are submitted, and no webhook is added.

## Contract and safeguards

The proxy accepts `page` (1–10000, default 1), `limit` (1–50, default 6),
`q` (100 characters), `location` (100), `category` (60), and
`work_mode` (`remote`, `hybrid`, `on-site`). It always requests `status=open`.
Unknown/repeated parameters are rejected. The UI submits search explicitly.

Responses project validated placement fields, pagination and provider metadata.
Checks include UUIDs, types, date-only deadlines, work modes, demo flags and
same-provider `/opportunities/{id}` detail URLs. Descriptions render as plain
text; links open with `noopener noreferrer`. Responses use `Cache-Control:
no-store`; reads have a 10-second timeout, 256 KiB limit and no redirects.
Disabled/unavailable providers return honest errors without cached or invented
vacancies. Malformed responses are rejected with a safe fixed message.

The current hosted records are **fictional demo listings**. The page displays a
feed notice and individual demo labels. Deadlines are application dates in
Thailand, separate from event dates. A zero allowance remains zero; missing
allowance is described as unspecified.

## Verification

Manual public reads and isolated automated checks are recorded separately in
[verification evidence](../evidence/team17-internships-2026-11-08/check-results.json).
Synthetic browser screenshots do not prove real-user usability or deployment.
No teammate confirmation or production Campus Events deployment is claimed.
