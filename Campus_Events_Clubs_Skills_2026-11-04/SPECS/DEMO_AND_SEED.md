# Demo accounts, sample data, and genuine lecturer walk-through
## Rules
- Create a separate **approved** test/demo Firebase project when feasible; never point destructive tests at existing production data.
- Provision three test identities using authorized server-side setup: `STUDENT`, `ORGANIZER`, `ADMIN`. Admin role must be assigned only from trusted server/admin provisioning, not editable client UI. Never package passwords or UIDs in source control.
- Seed 3–5 *clearly labeled* sample activities with plausible campus types/dates/venues; don't misrepresent as official real campus events. Use the same normal activity creation/publishing semantics where possible. All registrations/cancellations in the live demo must be generated through real app/API calls.
- For privacy use fabricated demo *identities* not real student records, and label example events. It is acceptable that the events are demo data; the behavior must not be faked.
- Use one draft, two published, optionally one CLOSED activity to show lifecycle. Dates should be future of the actual demo day, checked before seeding.

## Instructor demo (approx. 5–8 minutes; adjust to lecturer's time)
1. Show live link and explain real Firebase-backed auth + roles and Team 10 integration boundary.
2. Organizer signs in, sees **own** activity dashboard, creates draft, publishes it, sees status.
3. Student (other browser profile) signs in, finds just-published event, reads details, registers; refresh verifies persistence; tries duplicate and gets safe feedback.
4. Organizer refreshes roster and sees registered demo Student.
5. Admin signs in, views all activities and true summary; show no edit/publish actions; if safe and requested, show a forbidden API call for Admin mutation returning 403.
6. Student cancels; verify CANCELLED history, organizer roster state, Admin summary update if included.
7. Show test report and honest unverified caveats; if partner integration is in-scope demonstrate recorded evidence or safe local endpoint; no unauthorized external Team 10 calls.

## Fallbacks
Have a local/emulator rehearsal and redacted screenshots, but **never claim screenshots are a live production demo** if production is down. The lecturer can distinguish an honest recorded demonstration from a fake interaction.
