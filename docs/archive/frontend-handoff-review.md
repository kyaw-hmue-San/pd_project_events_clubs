# Campus Pulse frontend handoff review

Reviewed: 2026-11-04. Based on the actual repository, including the newly added
`Campus_Events_Clubs_Skills_2026-11-04/` and `src/` folders.

This is the **initial review before implementation**. The local full-stack work
that followed is recorded in [PROGRESS.md](../../PROGRESS.md); use that file and the
current API contract for present implementation status.

## Current state

- The skills pack is a specification and workflow handoff, not application code.
  Its local skills can guide implementation when explicitly read; adding the
  folder alone does not install them globally. Its `AGENTS.md` is inside the pack,
  rather than at the repository root.
- `src/` contains React/TypeScript screens and Tailwind CSS for the Campus Pulse
  interactive prototype. Student, Organizer, Admin, and preview sign-in views exist.
- No root `package.json`, HTML entrypoint, TypeScript configuration, or Vite
  configuration exists. The frontend cannot currently be built or started as a
  complete Vite project from this checkout.
- `firebase/` contains the existing Express/Firebase backend and tests. It remains
  separate from the frontend source.
- Current branch: `implementation/phase-1-verified-baseline`. Both added folders
  are untracked. An untracked `firebase/firestore-debug.log` also exists; it was
  not inspected or included in this review's changes.

## Screen and API mapping

| Screen | Source | Integration needed |
| --- | --- | --- |
| Sign-in | `src/features/auth/AuthView.tsx` | Replace timer and role selector with Firebase Auth, session observation, and `GET /api/me`. Roles must come from the server. |
| Discovery/details | `src/features/student/StudentViews.tsx` | Fetch activities/details; support pagination and real request states. |
| Register/cancel/history | `src/App.tsx`, `StudentViews.tsx` | Replace local state mutations with registration POST and cancellation PATCH; refetch server state. Backend history currently returns ACTIVE only. |
| Organizer activities | `src/features/organizer/OrganizerViews.tsx` | Replace hardcoded ownership filtering with a new protected Organizer-owned activity listing. |
| Create/edit/publish/close | `OrganizerViews.tsx`, `src/App.tsx` | Save all supported form fields through draft POST/PATCH, then publish through PATCH. |
| Roster | `OrganizerViews.tsx` | Replace shared sample roster with the activity's ownership-protected API response. |
| Admin overview/details | `src/features/admin/AdminViews.tsx` | Add protected read-only Admin APIs. Current backend authentication admits only STUDENT and ORGANIZER. |

## Concrete issues to resolve during integration

1. **All core frontend actions are preview-only.** Activities, registrations, and
   rosters come from `src/data.ts`; changes live in React state and reset on
   reload. Preview labels correctly acknowledge this. No Firebase SDK or API
   requests are present in `src/`.
2. **The activity form discards input.** Its save callback accepts only title and
   description. Activity type, location, date, start time, and end time are not
   passed to the save handler. The date defaults to `2025-11-13`.
3. **The view model differs from the API.** Map `type` to `activityType`,
   `registered` to `registrationCount`, and formatted dates to/from `dateTime`.
   Capacity, end time, category, and organizer display name are not provided by
   the current activity creation contract. Resolve these deliberately; do not
   fabricate live values or expand scope just to match preview fixtures.
4. **The shared details screen exposes Student actions to Organizers.** Organizer
   navigation opens `ActivityDetails`, which renders registration controls
   without receiving a role. Registration is correctly Student-only on the
   server; the integrated UI needs appropriate role-specific actions.
5. **Real data needs missing-record handling.** `App.tsx` assumes an activity
   exists, and registration cards assert that every related activity is present.
   Empty results, pagination, and missing details need explicit handling.
6. **Keyboard behavior needs implementation and browser verification.** The
   shared modal declares a dialog but has no focus management, focus trap,
   Escape handling, or return-focus behavior. Toasts lack a live announcement.

## Recommended implementation sequence

Follow the pack's build waves, adapting its stale claim that no frontend source
exists:

1. Preserve the uploaded prototype and existing API baseline. Follow
   `SKILLS/backend-modular-refactor/SKILL.md` for a behavior-preserving backend
   extraction before adding new routes.
2. Add Organizer-owned listing and compatible cancelled history, then the
   proposed strictly read-only Admin scope with server authorization.
3. Complete React/Vite/Tailwind project setup using the existing screens. Keep
   the preview explicitly labeled until real wiring is ready.
4. Wire Firebase sign-in and one authenticated `/api/me` request, then Student,
   Organizer, and Admin flows in separate reviewable slices.
5. Perform the full browser, accessibility, emulator, and deployment release
   checks after wiring, retaining targeted checks for each implemented slice.

The existing Firebase stack remains provisional relative to the older
Supabase/Vercel PRD. Lecturer approval of the stack deviation and Admin extension
is not established by these files. Existing documented authorization supports
continued reversible local work; this review does not authorize production
seeding, deployment, or partner calls.

## Checks run in this review

- `npm test --prefix firebase`: 6 passed, 0 failed; emulator tests skipped.
- `node --check firebase/api.mjs`: passed.
- `node --check firebase/integration.mjs`: passed.
- Read the frontend source, backend routes/validation, skill index, handoff
  skill, build waves, decision register, and screen/API mapping.

Frontend compilation and rendered browser behavior were not verified because the
frontend project setup is missing. Auth/Firestore emulator scenarios, production
behavior, and external partner recovery were not run. Application source, API
contracts, and product decisions were not changed by this review. No commit or
PR was created.
