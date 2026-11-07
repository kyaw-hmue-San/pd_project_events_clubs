# Paste this into Figma Make (attach PRD.md + DESIGN_TOKENS.md when possible)

Act as a senior product designer and React/Tailwind interface engineer. Create a complete **interactive, polished, responsive** prototype and exportable component system for **Campus Events & Clubs**, a real university service by **Team 12**. The university lecturer must be able to observe clear, credible Student, Organizer and **read-only Admin** journeys. Do not treat the prototype as the real backend.

## Product and functionality
Student: Firebase-email sign-in UI, browse listed campus events and club activities, read details, see status, register, get clear confirmation, see active and cancelled registration history, confirm cancellation. Organizer: sign-in, own activities including DRAFT/PUBLISHED/CLOSED, create/edit draft with title, description, EVENT vs CLUB_ACTIVITY, date/time, location, publish valid activity, close it, inspect own registration roster. Admin: **read-only** sign-in and overview, list **all organizers' activities** including drafts/published/closed, view activity details, see safe aggregate counts. Admin may **not** create/edit/delete/publish events, manage users, view personal registration rosters or integration secrets. No other roles.

## Design concept — Campus Pulse
Friendly, credible, modern university event discovery; compelling but not a fake corporate analytics platform. Calm white/slate backgrounds; navy `#172554`, campus blue `#2563EB`, teal `#0D9488`, amber `#F59E0B`, canvas `#F8FAFC`, text `#0F172A`. Use Inter or Plus Jakarta Sans, accessible contrast, 8px spacing, 8–16px radii, subtle borders, limited animation. Clear event title/date/location/type/status and action are always more prominent than decoration. Strong visual coherence across three role shells. No overuse of glassmorphism, charts, gradients or stock photography.

## Screens and layout
1. Auth: email+password, show/hide password, loading, invalid credentials, unverified account, no self-assigned roles.
2. Student Home/Events & Clubs: responsive header, category chips, event cards, useful hierarchy, pagination/load more, filters only for already loaded data unless backend API supports them; loading/empty/offline states.
3. Event details: organizer display when available, date/time in campus timezone, location, title, description, EVENT/CLUB_ACTIVITY, PUBLISHED/CLOSED and primary action, already-registered or unauthorized states.
4. My Registrations: ACTIVE and CANCELLED history, cancellation confirmation and pending/success/error states; no hard-coded persisted result.
5. Organizer My Activities: own draft/published/closed cards/table, Create Activity, actions consistent with lifecycle; editing only own.
6. Organizer Activity Form: reusable create/edit form; required fields, validations, Save Draft, Publish and Close confirmation. No reopen CLOSED.
7. Organizer Roster: own activity registrations with only necessary participant details, active/cancelled state, desktop table/mobile cards.
8. Admin Overview: authentic counts (placeholder preview labels only), counts for total/published/draft/closed activities and total registrations if backend safely supports it; all-event list and details. Every action read-only. No fake analytics or user management.
9. Access-denied/404/offline feedback for all roles.

## Reusable design system and code
React + Vite compatible, Tailwind CSS. Componentize `AppShell`, nav per role, `EventCard`, `StatusBadge`, `Button`, `Input`, `Select`, `Textarea`, `DateTimeField`, `Modal`, `EmptyState`, `Skeleton`, `InlineError`, `Toast`, `Pagination`, `RegistrationRow` and `RoleGuard` presentation. Organize files by features under `src/features/auth`, `src/features/student`, `src/features/organizer`, `src/features/admin`; shared `src/components`, `src/styles`, and a typed/model-friendly `src/api` interface. Avoid a monolithic App file and avoid adding Supabase or another backend.

Responsive 360/768/1024/1440px; no horizontal scroll, usable keyboard focus, screen-reader labels, 44px-ish touch targets, accessible dialog focus and reduced-motion support. Mobile-first layouts and empty/error/denied/loading/success states on each data-driven view. Responsive roster cards on phones.

## Prototype data and integration boundary
Use a handful of clearly labeled **preview-only** campus events and sample roles to make clickable navigation and form feedback inspectable. Never imply this preview connects to real Firestore or logs in as real users. Treat every real API response as pending integration; make visible data adapters replaceable. Actual backend API currently authenticates all `/api/*` calls via Firebase bearer token, returns `{"data":...,"nextCursor":...}` for activity list, uses `PATCH /api/registrations/:id/cancel`, and currently has two roles; Admin endpoints are proposed and must be built later. Don't invent working endpoints or credentials.

## Completion requirements
Provide a cohesive working **design prototype** of all screens; reusable code, clear navigable routes, full component states, a central design token system, and a handoff explaining routes/components/data models. If code export/clone is supported, preserve the source or prepare an exportable source ZIP; never claim the prototype is production-connected. First establish visual design system and a Student screen, then complete Organizer/Admin consistently; do not expand scope beyond this brief.
