# Build order — finish feature wiring first, then formal QA
This plan avoids long test-writing before pages exist while still preventing unchecked broken integration. Figma Make and backend extraction can proceed **in parallel** when different people are available.

| Wave | Work | Skill(s) | Functional milestone | Quick checks during wave | Later full tests |
|---|---|---|---|---|---|
| 0 | Confirm current branch, frozen docs, scope extension and environment | `git-team-attribution`, `backend-modular-refactor` | Reproducible baseline and real owner | git status, existing 13+6 tests if available | Full baseline at release |
| 1A (parallel) | Generate Campus Pulse Figma system + Student/Organizer/Admin flows | `figma-*` | Interactive complete preview with exportable components | Preview each role at mobile/desktop | Accessibility & visual checks at QA |
| 1B (parallel) | Extract existing backend domains without functional changes | `backend-modular-refactor`, `backend-auth-and-integration` | `src/features/*` with stable routes and worker | import/syntax/existing tests | Full API contract suite |
| 2 | Close required backend API gaps | `backend-fill-prd-gaps` | Organizer own list, cancelled history, clear errors/display names | targeted emulator calls | Comprehensive role tests |
| 3 | Add read-only Admin scope extension | `backend-admin-readonly` | Accurate API read-only overview/all-events/details | ADMIN GET, non-ADMIN 403, mutation denied | Full auth/security matrix |
| 4 | Import/refine Figma components; setup React/Vite/Tailwind | `figma-export-to-code`, `frontend-auth-api-wiring` | Real login/session + one GET | frontend build + `/api/me` request | E2E auth/accessibility |
| 5 | Wire Student full path | `frontend-student-wiring` | List/detail/register/refresh/cancel/history | one emulator complete Student scenario | Stress/error/cross-user QA |
| 6 | Wire Organizer and Admin full path | `frontend-organizer-admin-wiring` | Publish->register->roster->Admin read | one cross-role emulator walkthrough | Full end-to-end matrix |
| 7 | Final integration/QA/test fixes | `qa-deployment-and-demo` | No P0 failures, complete evidence | **Full QA now** | N/A |
| 8 | Deploy/rehearse/submit | `qa-deployment-and-demo`, `git-team-attribution` | HTTPS live three-role demo, accurate contribution history | production smoke + cost verification | close gaps |

## Feature implementation standards
- Do not create 30 stub files and claim completion; only count a wave done once it yields usable code or reviewable design artifact.
- Keep a working app at the end of every wave, not just after all waves.
- Each wave has distinct PRs/commits for *actual* contributors. PR review is part of work, not invented authorship.
- Avoid optional image uploads, payments, QR, chat, user management, complex capacity, advanced analytics until approved scope works.
- Any unresolved lecturer-mandated Supabase stack decision can require revisiting architecture; openly record it rather than hiding PRD conflict.
