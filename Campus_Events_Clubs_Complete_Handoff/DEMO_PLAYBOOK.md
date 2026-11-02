# Lecturer demonstration — practical 8–10 minute outline
**Suggested timing only** (change to lecturer's actual demo slot). Live actions must use the working deployed app and demo-only accounts; do not frame sample events as actual university announcements.

| Time | Presenter action | What this proves |
|---|---|---|
| 0:00–0:45 | Introduce Campus Events & Clubs, problem, Student/Organizer roles and MVP boundary | Real user need and scope |
| 0:45–1:30 | Brief architecture diagram: React UI → Express API → Firebase Auth/Firestore; mention Team 10 integration honestly | Coherent technical story; why architecture differs from original plan |
| 1:30–2:30 | Student logs in; opens server-fetched event cards and details | Real auth, API read, usability |
| 2:30–3:45 | Student registers, reloads page, sees registration in My Registrations | Real data persistence, no fake state |
| 3:45–4:30 | Student tries second registration (safe error/disabled), then cancels and refreshes | Validation, duplicate prevention, cancellation |
| 4:30–6:30 | Organizer profile: create a new **[DEMO]** event and publish it; show organizer list | Role permissions, real create/update |
| 6:30–7:30 | Student profile (separate browser) sees new event and registers; organizer roster updates | End-to-end cross-role path |
| 7:30–8:30 | Show mobile responsive layout + authorization denial for inappropriate action | Quality/security |
| 8:30–9:30 | Cite actual test results, deployment, evidence and Team 10 integration if verifiable; disclose limits | Credible engineering and assessment |
| 9:30–10:00 | Summarize delivered features and future extensions | Clean finish |

## Setup 30 minutes before demo (no promises about how long development takes)
- Two browser profiles, one Student and one Organizer; both dedicated demo accounts.
- Make sure event dates are future; prepare clean publishable event title and text; ensure internet connection.
- Have demo frontend/backend URLs, commit and release identifier, local timezone, redacted network/devtools accessible.
- Ensure Team 10 external test permission if using live integration; no secret tokens on screen.
- Rehearse state resets without deleting real user records. Avoid contradictory slides/documentation.

## One-minute honest disclaimer script
> 'These are dedicated test accounts and clearly marked sample events for demonstration. The actions you are seeing—login, publishing, registering and cancelling—are processed by our deployed API and saved in Firestore. We are not simulating these operations in the browser. I'll distinguish any integration results documented from September from tests we verified today.'

## Lecturer FAQ preparation
- Why Firebase instead of Supabase? Original documents used Supabase, separate assignment implemented Firebase; final architecture was chosen based on approved brief, with clear record of decision.
- How do you prevent duplicate registrations? Explain server-owned identity + atomic Firestore transactions/active lock; refer to real tests, not a slogan.
- Can Students modify Organizer data? Server validates authenticated roles and ownership; show denied request.
- What happens with network loss/partner outage? Honest error/retry/degraded path; do not claim auto-recovery unless verified.
- What is incomplete? Disclose any remaining P1 and out-of-scope work clearly.
