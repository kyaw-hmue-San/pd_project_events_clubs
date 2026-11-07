# Safe environment/deployment handoff
**Never paste .env values or credentials into ChatGPT/Figma Make, Google Docs, commit messages, screenshots or demo videos.**

## Backend (existing Firebase/Express persistent host)
- Verify actual `firebase/.env.example` and deployment guide in CURRENT repository; do not invent required variable names. The documents mention `FRONTEND_ORIGINS` (exact origin allowlist), `INTEGRATION_LOG_VIEWER_UIDS` (optional diagnostic allowlist), project/service-account configuration, Team 10 partner keys and URLs.
- Keep Firebase Admin credentials server-side. Production front/back origins must match HTTPS URL exactly; test browser OPTIONS preflight before claiming CORS works.
- Worker retries depend on persistent process: keep on Render or another approved persistent service, not stateless Vercel Function unchanged.
- Add Admin role to protected `users/{uid}` using trusted provisioning only. No self-serve Admin registration form.

## Frontend (new React/Vite/Tailwind)
- Web client Firebase configuration is not Admin SDK credentials. Configure web API key, auth domain, project ID using named `VITE_` config **after checking current approved setup**; no Admin private key in bundle.
- `VITE_API_BASE_URL` is a suggested public base URL key; verify/export names in code. Keep URL in env not each component.
- Manage browser routing refresh/404 on hosting; test deep links after deploy.
- Browser uses Firebase Web Auth ID token for every protected API call. Database writes via Express, not direct Firestore browser SDK.

## Production conditions to verify, not assume
- Auth authorized domain and verified-email policy work for demo accounts.
- Live Firestore rules/indexes align; existing local emulator tests alone do not confirm production setup.
- Backend responds to authenticated data requests after possible free-tier cold start.
- 0 THB use is actually achievable with selected services/account policies. If billing would be required, report blocker, do not activate paid tier without approval.
- Any Team 10 external integration testing is authorized; do not send test webhooks to real partner without coordination.
