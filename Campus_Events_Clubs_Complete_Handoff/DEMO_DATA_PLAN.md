# Demo accounts and seed data — real functions, honest examples
## Rule
Test/demo accounts and sample events are legitimate for a university demo **only when presented as sample data**. All demonstrated operations must use real authentication, authorization, API and Firestore persistence. No fake attendee totals, user testimonials, interviews, analytic results, integration responses, or screenshots.

## Accounts
- **Student demo account:** real Firebase Authentication account, server role `STUDENT`, only own registrations.
- **Organizer demo account:** real Firebase Authentication account, server role `ORGANIZER`, only own events/registrations.
- Optionally a **second Student** and **second Organizer** for duplicate/concurrency/cross-owner denial tests (not needed for normal lecturer walkthrough).
- Existing seed script reportedly provisions two verified demo accounts; **inspect it before creating more**. Provision roles using server/admin tooling only, never from public signup or client localStorage.
- Create accounts in controlled project; send credentials to teammate via secret manager/private channel, not Git, README, slide, video, or ZIP.

## Seed event principles
- 4–6 clearly titled representative campus events covering different categories, dates, venues and states; sample payload in `sample_demo_events.json` is **illustrative and NOT asserted to match Firestore schema**.
- Use plausible future dates relative to demo date; choose actual event timezone and ensure future dates on demo day. Replace examples if past.
- Add a visible `Demo / sample activity` marker or event description disclaimer when shown to lecturer.
- Seed only into isolated demo project or explicit safe namespace, with controlled IDs and **idempotent script** (re-running does not duplicate).
- Never seed real-person names, emails, phone numbers, fabricated registration/attendance statistics; keep rosters empty initially or populated by actual demo logins/actions.
- Preserve source/ownership: events belong to seeded Organizer user. Do not manipulate real professor/student accounts.

## Safe setup / reset checklist
1. Confirm exact Firebase project ID and environment, and that it is demo-only. Never run destructive seed on production by default.
2. Verify `firebase/` seed script behavior, required roles/claims and event schema.
3. Create two accounts securely and initialize server-side roles; confirm Student cannot use Organizer APIs.
4. Seed sample events once with clear demo label; verify through API. Keep at least one `PUBLISHED` with no active registration to exercise new action.
5. For each rehearsal: either use a newly created event or safely cancel only the demo Student's own prior registration. Do not delete existing users/events.
6. Record seed IDs/owner IDs and nonsecret config in a local secure handover note.
7. After demonstration, decide whether to keep or clean **demo-only** records; obtain owner approval for deletes.

## Live-demo proof checklist
Event name entered by Organizer (unique timestamp/title) → appears for Student via API → Student registers → Organizer roster changes → both browser sessions refresh → registration persists → Student cancels → status updates. All mutations from the actual app.
