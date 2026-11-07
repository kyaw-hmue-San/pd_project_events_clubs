# AI Event Planning Copilot and deterministic fallback

Implemented locally on 2026-11-05. The provider is AI/ML API, as selected by the
user. This supports the stated AI-assisted-flow/fallback requirement; it does
not replace the other webhook, API, testing and deployment evidence requirements.

## Current planning flow — 2026-11-06

1. Organizer (including an approved Student) opens Create activity → Plan with AI.
2. Enters topic, audience, purpose and estimated participants. Duration uses Hours/Minutes plus common shortcuts and a written total; the API receives total minutes.
3. Generate event plan returns title/description, timed agenda, before/during/after
   preparation checklist, facilities suggestions and assumptions to confirm.
4. Preview is honestly labeled AI-generated event plan or Standard template plan.
5. Choose Title, Description, Timed agenda, Preparation checklist and/or Facilities
   notes. Agenda/checklist append to existing description unless Description is
   selected. Replacing nonempty title/description/facilities text requires explicit
   acknowledgment. Overlong composed descriptions cannot be applied.
6. Apply selected sections changes only those text fields. Date/time, location,
   activity type, capacity/deadline and other manual fields remain unchanged.
   Facilities are optional and not selected by default. Applying/saving notes
   never sends a maintenance request or reserves equipment.
7. Normal save/publish remains separate. Later explicit Review facilities request
   → Send is the only action sharing saved requirements with Team 10.

Edit brief supports adjusting duration/count/goals and generating a fresh plan.
This is not a conversational chat or volunteer-assignment engine. Agenda/checklist
persist as human-reviewed description text; selected facilities persist in the
existing private notes field. No new planning collection/schema migration.

`POST /api/me/activity-plan` requires Organizer authorization. Exact request:

```json
{"topic":"Beginner coding workshop","audience":"MFU beginners","purpose":"Learn programming through practical exercises.","activityType":"EVENT","durationMinutes":120,"participants":50}
```

Duration is an integer 15–480 minutes; estimated participants 1–100,000. Existing
brief text/type limits apply. Response `{source, fallbackReason?, brief, plan}`;
plan contains title, description, agenda entries `{title,minutes,startMinute,
endMinute}`, checklist `{before,during,after}`, facilities, assumptions and a safe
composed draft. Server validates bounded exact JSON, positive whole agenda minutes
and exact duration total; it derives offsets itself. Invalid provider plans become
TEMPLATE, never partially applied AI success. Composed text stays within existing
5,000-character description and 2,000-character facilities limits.

The fixed template totals the supplied duration exactly and provides all three
planning sections. AI and template outputs are suggestions: venue/equipment
availability, costs and endorsements are unconfirmed. Input duration/count do not
silently set an event schedule or enforce capacity. Normal validation remains.
Provider uses the existing configured model/chat endpoint, planning-only 45-second timeout,
2,800 output-token maximum, 64 KiB response cap and no redirects. Both planning
and legacy drafting share five attempts per UID/minute and one in flight per UID.
No participant/identity/token data is sent, only the entered brief. Emulator
provider calls remain disabled unless an isolated double is explicitly injected.

A separate AI Organizer admission flow is documented in
[ORGANIZER_AI_ADMISSION.md](ORGANIZER_AI_ADMISSION.md). Its failure fallback is
manual review, never template approval. Planning itself never changes permissions.

## Legacy basic drafting compatibility

The earlier POST /api/me/activity-draft remains supported with its existing brief,
response and deterministic template. The Create activity UI now uses the richer
planning endpoint above; legacy API consumers remain compatible.

## Private local setup

Add these to **backend/.env**, which is ignored by Git and loaded only by the
backend. Replace the placeholder locally; do not paste the key into chat or any
VITE-prefixed configuration.

```dotenv
AIML_API_KEY=your_private_aiml_key
AIML_MODEL=google/gemini-2.5-flash
```

The model can be changed to a compatible AI/ML API chat model ID. The default
model and chat endpoint follow the provider's
[official Gemini 2.5 Flash documentation](https://docs.aimlapi.com/api-references/text-models-llm/google/gemini-2.5-flash).
No extra SDK is installed; the server uses native fetch with bearer auth.

Restart the existing backend terminal (Ctrl+C, then `npm run dev:api`) after
changing these settings. Keep the usual frontend terminal running `npm run dev`.
Open localhost:5173, select Organizer workspace when applicable, then Create
activity → Plan with AI.

For a deliberate local fallback demonstration, stop the backend and launch:

```sh
AIML_API_KEY= npm run dev:api
```

This disables AI only for that process without changing the private file. Restart
normally to use the configured key again. No real Google identity needs seeding.

## API and provider behavior

`POST /api/me/activity-draft` requires the existing verified Google token and
Organizer authorization. The exact body is:

```json
{"topic":"Beginner Python workshop","audience":"MFU students","purpose":"Learn basic Python through practical exercises.","activityType":"EVENT"}
```

- Topic/audience: 3–160 normalized characters each; purpose: 10–600.
- Type is EVENT or CLUB_ACTIVITY. Unknown fields, including identity, role,
  model and key, are rejected.
- Response: `{source:"AI"|"TEMPLATE",fallbackReason?:string,draft:{title,description,activityType}}`.
- AI receives only the submitted brief. Google tokens, UID, email, university ID,
  participant lists and backend secrets are not included in the model request.
- The provider call has a 12-second timeout, one attempt, a 1,200-output-token
  limit and a 64KiB response limit. JSON structure/lengths are checked before use;
  dates, locations and permissions are not returned as editable suggestion fields.
- The per-process endpoint guard permits five attempts per UID per minute and
  one in flight per UID. This is a local persistent-server guard, not a claim
  of a distributed billing quota.
- Missing configuration, provider failure/refusal, timeout, truncated output or
  invalid JSON returns a standard template with an honest TEMPLATE source.
  Input/auth errors still return normal 4xx errors; invalid input is not treated
  as an AI outage.
- The fallback is a fixed function of the normalized brief. It uses no random
  values, timestamps, remote calls or model decisions. Identical valid inputs
  produce identical template content.
- No provider response body or credential is returned in error messages/logs.
  Existing sanitized API request evidence remains in place.

## Earlier manual draft verification and isolated checks

Historical 2026-11-05 record (before the new planning/admission extensions): the user subsequently supplied the private AIML key. On 2026-11-05 a single
user-authorized manual check through the actual draft service returned HTTP 200
and source AI, with a valid title, description and agenda. It used 981 tokens
(139 input, 842 output) and completed in approximately 7.1 seconds. Only a
synthetic coding-workshop brief was sent; no event/profile was saved. This was
separate from automated tests. The local API was restarted to load the working
key. The user's signed-in browser apply/save/publish walkthrough remains to be
tested interactively; the provider completion itself is now verified.

- 37 backend checks passed: 22 emulator API scenarios, 9 AI service checks with
  injected provider responses, and 6 existing integration helpers.
- Existing browser scenarios passed. New browser scenarios passed for template
  generation/progress → explicit apply → manual publish/reload, and controlled
  delayed session/data/refresh/profile/register/cancel requests.
- Emulator projects always disable real AI calls, and test launchers remove AIML
  environment credentials. Success/failure/timeout provider checks use injected
  fetch implementations; no paid AI credits or real-user data are used in tests.
- No application push, hosted deployment, real-user profile migration or connected
  project seed was performed. Evidence is linked in root PROGRESS.md.

New planning/admission checks are recorded in the latest PROGRESS entry. The earlier manual provider completion above does not verify the new schemas or real automatic admission.

## Planning timeout follow-up — 2026-11-06

A user-authorized synthetic manual planning diagnostic returned a valid AI plan
in 13.259 seconds, HTTP 200/finish stop, consuming 2,132 tokens. The prior planner
cutoff was only 12 seconds, consistent with the user's 12.472-second request and
reported template fallback. Increased planning to 45 seconds; short basic drafts
and admission remain at their existing limit. No model/key change. Template
messages now distinguish TIMEOUT/NOT_CONFIGURED/PROVIDER_UNAVAILABLE/INVALID_RESPONSE.
This verifies one new-schema provider completion, not real applicant admission
or a saved/published event. Automated tests remain mocked. See PROGRESS evidence.

## Published text display follow-up — 2026-11-06

Applied agenda/checklist text remains in the existing public description contract.
The detail views now preserve paragraphs, format generated agenda ranges into
rows and put Preparation checklist behind an expandable summary with stage/list
formatting. Existing descriptions work on refresh without editing or regeneration.
This is display-only; preparation content was not made private or removed from
DTOs. All rendering uses React text nodes; no raw HTML or provider markup runs.
