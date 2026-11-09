# Library learning resources

9 November 2026: user confirms the read-only connection is completed. No
borrowing/reservation was added. This is user-reported acceptance, not a new
hosted HTTP trace; Maintenance is the main evaluation showcase.

Student workspace → activity details → **Learning resources** connects event
topics to Campus Library's real catalog. Opening details checks whether the
public title/description has a clear learning purpose and a concrete reading
subject. Only a positive AI assessment shows **Find learning resources**.
That action makes a read-only catalog request using the assessed subject. AI
never supplies book records or availability. Manual search is always available.

## Setup

Configure these on the persistent API, in private `backend/.env` for local use
or server host variables for deployment:

```dotenv
LIBRARY_API_BASE_URL=https://campus-library-mu.vercel.app
LIBRARY_API_KEY=<privately supplied Library key>
```

The key from the user-supplied `campus-event.md` was configured locally without
changing Maintenance, Internship or AI credentials. That original document
contains a private credential: keep it private and out of commits/public shares.
This sanitized guide intentionally contains no key. The original upload was not
modified. Never use a `VITE_` prefix for this credential.

AI uses existing `AIML_API_KEY` and `AIML_MODEL`. Missing/failed/invalid AI leaves
the AI button hidden and manual search available. Missing
Library configuration or a failed catalog request shows an error; it never
creates a fabricated book list. Restart the API after changing configuration.
The Library configuration is independent of Maintenance modes and performs no
startup polling. Test/emulator configuration disables real calls; tests inject
mock providers.

## Provider contract

`GET https://campus-library-mu.vercel.app/api/integrations/catalog` uses the
server's `Authorization: Bearer <Library key>` and `Accept: application/json`.
Parameters are `q`, `category`, `page`, `limit`. The agreed response includes
`resources` with ID, title, author, category, description, available/total copies
and a provider-hosted `/books/{id}` detail link, plus pagination. No borrow,
reservation, user-history or webhook API is available. Detail links open the
Library website; Campus Events does not create loans or reservations.

## Our API and access

- `GET /api/activities/:id/library-resources?q=Python&page=1`: manual catalog
  search. Optional category; page 1–10000, limit 1–12 (default 4), text ≤100
  characters. Unknown/repeated parameters are rejected.
- `GET /api/activities/:id/library-resources/relevance`, no query parameters:
  server loads public text and returns `{eligible, status, query?}`, with status
  `RELEVANT`, `NOT_RELEVANT` or `UNAVAILABLE`. A cache miss may make one AI call;
  it never calls the Library catalog or writes an activity.
- `POST /api/activities/:id/library-resources/suggest`, JSON `{}`: load the
  activity's current public title/description, require a positive current
  relevance assessment, then retrieve the first catalog page. Clients cannot supply replacement activity
  text, identities, prompts, provider URLs or credentials.
- All three require server-derived Student capability and a PUBLISHED/CLOSED
  activity. Enrolled Student/Organizers qualify; Admin, Organizer-only and
  pending applicants do not. Drafts/missing activities return 404.
- Responses: `{resources, pagination: {page, limit, total, total_pages,
  has_next}, search: {query, source}}`. Source is `AI` or `MANUAL`.
  The earlier automatic activity-keyword fallback is superseded by manual search
  when relevance is unavailable. Only catalog-returned records are projected.
  Availability is a snapshot from that search, not a guaranteed reservation.
- Invalid queries/body return 400, denied access 403, absent/private activity
  404, AI concurrency/quota 429 `LIBRARY_AI_RATE_LIMITED`. Library disabled/
  unavailable returns 503 `LIBRARY_NOT_CONFIGURED`/`LIBRARY_UNAVAILABLE`;
  invalid provider data returns 502 `LIBRARY_INVALID_RESPONSE`. Provider errors
  are replaced with fixed safe messages.
- A direct suggestion request for an irrelevant activity is 409
  `LIBRARY_NOT_RELEVANT`; unconfirmed/failed relevance is 503
  `LIBRARY_RELEVANCE_UNAVAILABLE`. UI hiding is backed by server enforcement.

## Relevance policy and cache

`LIBRARY_RELEVANCE_V1` requires an explicit learning/training/research/literary
purpose plus a concrete reading subject. General welcome parties, celebrations,
social events, concerts and sports fixtures do not qualify just because students,
a country or a culture is mentioned. "Fresher Welcome for Burmese Students" with
"Welcome" is a negative example; a Python workshop is a positive example.
Vague descriptions do not qualify. This is an AI relevance judgment, not a
guarantee that useful books exist; catalog no-match handling is unchanged.

Strict output requires a boolean, bounded query and verbatim learning-purpose
quote. Both positive subject and evidence must occur in the supplied public text;
extra fields, invented quotes, unsafe queries and failures cannot enable the
button. Only title/description are sent, with instructions to treat them as data.

Concurrent identical checks coalesce. A process-local cache is keyed by exact
public text, model and policy version: positive/negative judgments live up to
24 hours, unavailable results 60 seconds. Text edits invalidate immediately on
the next request; a direct suggestion reads current text again. Up to 500 cache
entries and eight simultaneous assessments per process are allowed. No database
collection/index/migration is added. Restarts, eviction, expiry or multiple API
processes can cause another assessment; this is not a durable global cache.

## Data handling and limits

Only the explicitly projected public title and description go to AI. Only the
search query/category/pagination go to the Library, authenticated using its own
server-only key. No Student identity, Firebase token, roster, registration,
private facilities notes, other partner key or activity document is forwarded.
No prompt/body/credential logging or new database writes are introduced.

AI uses a 20-second timeout and 400-token output cap; catalog reads use a
10-second timeout, 256 KiB body limit and no redirects. Validate book fields,
UUIDs, copy counts, pagination and exact provider-origin book links. Descriptions
render as plain text. Responses are `no-store`; an activity view may assess
relevance once on a cache miss, with no polling or automatic catalog retrieval.
Fresh assessments and explicit AI-search actions share a one-in-flight and
five-per-minute per-person limit; cached relevance reads do not spend that quota.
Manual search stays available.
This is a per-process quota, not a distributed billing limit.

## Evidence

The [relevance-gating checks](../evidence/library-relevance-2026-11-08/check-results.json)
record the latest model-mocked policy/cache/access/UI verification.
See [sanitized checks](../evidence/library-resources-2026-11-08/check-results.json)
for actual verification results. Automated checks use synthetic Library/AI
responses and disposable Firebase emulators. Separate manual catalog reads do
not establish joint team sign-off, real book inventory accuracy or a hosted
Campus Events deployment. No real AI credits are used by automated checks.
