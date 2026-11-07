# AGENTS.md — Campus Events & Clubs execution guardrails

## Mission & scope
Build the lecturer-demonstrable Team 12 Campus Events & Clubs MVP as modular, traceable and real: **Student + Organizer + proposed read-only Admin**. Prefer existing Firebase Auth/Firestore, Express API, persistent Render server, React/Vite/Tailwind frontend until a lecturer-approved stack change. The PRD still lists Supabase/Vercel; document deviation, do not assert course approval.

## Source of truth hierarchy
1. Explicit **confirmed** lecturer instructions > 2. approved product decisions (`SPECS/DECISION_REGISTER.md`) > 3. PRD functional/acceptance requirements > 4. observed API contract/source > 5. design prototypes > 6. suggestions. Preserve discrepancies rather than silently erase them. Read actual repository files before modifying.

## Nonnegotiable behavior
1. **No fake persistence**: demo accounts and clearly marked sample activities may be seeded in a dedicated approved project; real API, roles and Firestore must perform publish/register/cancel/roster/overview.
2. **No secrets** in code, screenshots, LLM prompts, Git or browser bundles; do not read/print unrelated `.env` values. Firebase *public web config* may be client-side, never Admin service credentials.
3. Never bypass server-side token verification, verified-email policy, Firestore role checks, activity ownership, registration ownership, atomic duplicate prevention, cancellation idempotency or integration webhook signature/secret checks.
4. **Admin is read-only**. Permit only approved GET endpoints for event overview/list/details and safe aggregate counts; no CRUD, secret logs, account provisioning UI, personal roster or private student information. Enforce role on server.
5. Preserve existing URL paths/status behavior for Postman and Team 10. Add compatible endpoints for new workflows. Keep persistent outbox/retry worker lifecycle; do not move it to Vercel serverless unchanged.
6. Refactor in slices with stable imports. `.mjs` is valid; change extension for organizational preference only if `package.json`, imports, tests and start scripts are updated. Keep old files as thin compatibility entrypoints until verified.
7. Figma prototype data is strictly preview-only. Do not ask Figma Make to deploy a parallel backend, Supabase app or fake authenticated prod. UI integration belongs in repo.
8. One feature per branch/PR where practical; **authorship is truthful**. A teammate commits actual implementation, review improvements, tests, fixes, docs or integration; never distribute identical work under others' names to simulate contributions. Do not cherry-pick/stash someone else's work merely to falsify attribution.
9. Keep all changes reversible; no force-push, destructive schema deletion, partner external calls, production seeding, billing change, secret rotation or architecture migration without authorized approval.
10. Follow **build-first schedule**: finish features/wiring before the large formal QA campaign, **but** run syntax/build/regression checks and a targeted emulator smoke for each modified feature. Known-breaking work cannot be called finished.
11. Update API contract, decision register and real repository progress after behavior changes. Distinguish implemented, local tested, production tested, and unverified.
12. All views must support 360–1440px, keyboard navigation, actionable errors, loading/empty/denied/success states. Keep data minimal and avoid unsafe images/uploads.

## Work unit procedure
- Observe branch, clean/dirty state, actual source and existing tests.
- Declare selected skill and a short file/change plan.
- Implement minimal files; avoid whole-repo rewrite or extra framework.
- Run fast appropriate checks; record exactly what ran. On wiring, verify at least one real emulator path.
- Record affected files, contract migration needs, genuine author/reviewer, commit SHA, and next blocker.
- Do full test/evidence/deployment campaign at the release gate.

## Response schema
`Feature / status` • `Files changed` • `What really works` • `Quick checks run` • `Not yet tested` • `Contract/decision changes` • `PR and actual contributors` • `Next slice`.

## Do not overbuild
No paid tickets, social chat, QR, complex club memberships, separate Admin powers, media uploading, image storage, payments, analytics or notifications unless confirmed by lecturer. Dashboard summary counts are simple read-only aggregate data, not advanced analytics.
