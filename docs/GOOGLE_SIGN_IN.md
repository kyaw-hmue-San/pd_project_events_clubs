# School Google sign-in

Current confirmed scope is [ACCESS_WORKFLOW.md](ACCESS_WORKFLOW.md): Students
are limited to @lamduan.mfu.ac.th; verified personal Google accounts can request
Organizer access, and Admin has a bounded Approve/Reject screen. Manual Admin
appointment remains a trusted operator task. No Owner/Super Admin or general
membership approval workflow is implemented. The chooser has no school-domain
hint, while Student eligibility remains enforced by the server.

The old blanket-domain policy notes below describe the earlier implementation
and are superseded by ACCESS_WORKFLOW.md and the latest API contract section.

Decision: user requested Google-only sign-in for `@lamduan.mfu.ac.th` on
2026-11-04. This supersedes the earlier provisioned email/password UI.

## User journey

1. Choose **Continue with Google** and select the school account.
2. Firebase authenticates the user. The backend verifies the Firebase token,
   revocation, Google provider, verified email, and exact school email domain.
3. Existing campus profiles retain their UID, registrations, and server-assigned
   role. A new user completes their university ID once, then the API creates a
   Student profile. That profile step is not a password/account sign-up page.
4. Organizer and read-only Admin roles remain trusted operator assignments.

The Google account picker no longer sends a school-domain hint. Current server checks
apply to every `/api/*` request, including existing profiles; personal Gmail,
lookalike domains, subdomains, password tokens, and other providers are denied.
Partner-key/webhook-secret endpoints retain their separate authentication.

University ID is supplied by the student, validated and reserved uniquely; it is
not inferred from email or claimed to be checked against an official registry.
A transaction prevents duplicate claims, including concurrent first-time setup.
Existing legacy profile IDs are also checked. No request body can choose a role.

## Real Firebase setup

Project: `events-management-4d8ce`.

- The user supplied the public web app configuration, saved in ignored
  `.env.local`. Emulator mode is false. Do not commit this local configuration or
  put Admin SDK/OAuth secrets in browser variables.
- Google OAuth initiation returned a valid authorization URI on 2026-11-04.
  The provider is already usable for starting sign-in; it does not need a new
  password registration form.
- Under Authentication → Settings → Authorized domains, localhost is already
  present. Use **http://localhost:5173** for local real-account sign-in. The
  numeric loopback address is not currently on that list. Add any actual deployed
  frontend domain before using it.
- Keep the one-account-per-email policy. Google's trusted-provider linking can
  retain an existing account when the email matches. Confirm UID continuity for
  actual existing school accounts before retiring other sign-in methods in the
  Firebase Console. The app already hides password login and the updated API
  rejects password-provider tokens.
- An account conflict shows a support/linking message; the application never
  merges users, deletes accounts, or reassigns registrations based on a submitted
  email address. Provider conflicts requiring intervention must be resolved by
  the authorized project operator while preserving the existing UID.

## Backend deployment still needed

The “Add new account” widget reported after implementation was caused by an old
manual demo launcher still serving port 5173 with inherited emulator variables.
That launcher was stopped and the real `npm run dev` server was started at
`http://localhost:5173`. Its served configuration was checked: real project
`events-management-4d8ce`, emulator mode false. Normal Vite startup now rejects
emulator configuration unless explicitly run in test mode; automated fixtures use
their separate test port and `--mode test`.
An automated browser check of the real-configured development server confirmed
that Continue with Google opens `https://accounts.google.com`; no credentials
were entered and no user was signed in. The isolated Google profile regression
also passed after the mode separation change.

The checked existing service is
`https://pd-project-events-clubs.onrender.com`.
Its public `/health` returned 200; its localhost preflight returned 401 with no
CORS headers. Deploy the updated backend before treating real-account access as
ready, and set:

```dotenv
SCHOOL_EMAIL_DOMAIN=lamduan.mfu.ac.th
FRONTEND_ORIGINS=http://localhost:5173,https://your-actual-frontend.example
```

Replace the example deployed origin. Keep the persistent server/worker and its
existing server-side credentials. No demo seeding is required. Updated queries
still require the checked-in Firestore indexes. The local credential file
configured for Firebase Admin was not found; CLI project inspection was also
unavailable because CLI authentication was absent. Browser inspection of Chrome
was not approved by the computer-use tool. These access limits prevented this
session from changing the live Firebase/hosting settings.

After deployment, use a real school account interactively to check Google popup,
first-time profile, refresh, returning-user access and sign-out. Verify browser
CORS and existing privileged-account UID/role continuity. Automated emulator
success and the OAuth-initiation check do not establish these real-user results.

## Relevant source

- `src/lib/google-signin.ts`: Google popup, blocked-popup redirect fallback,
  redirect completion and safe error messages.
- `src/features/auth/AuthView.tsx`: Google-only sign-in UI.
- `src/features/auth/ProfileSetup.tsx`: one-time university ID completion.
- `firebase/src/shared/school-access.js`: exact school-domain/provider policy.
- `firebase/src/features/users/routes.js`: protected atomic Student onboarding.

Implementation follows the official
[Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin),
[account linking](https://firebase.google.com/docs/auth/web/account-linking), and
[server ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
documentation.
