# Campus Events & Clubs UI foundation

Updated 2026-11-07 after the shared motion refinement. This is the
implemented React UI, using the existing navy/blue concept and shared components.
It is not a Figma export or a claim of full accessibility certification.

Official supplied branding is centralized in `BrandLogo` and `frontend/public/brand/`;
see [usage and variants](BRANDING.md). All roles share the same header, with a
horizontal logo from 640px and an icon-only mark below. Use on-dark exports on
navy surfaces, and preserve the supplied SVG colors and proportions.

## Layout and typography

- Shared `app-container` and `page-wrap`: 72rem maximum width, centered, with
  16/24/32px responsive gutters. Page padding is 28px on mobile and 32px above it.
- Profile uses the same content alignment as the shared header. Form and
  account details sit beside each other on desktop and stack on smaller screens.
- Page headings use 24px on mobile and 30px above it; body/form text is 14px,
  supporting labels 12px. The existing system/Inter sans stack remains.
- The application shell keeps the footer below short pages. Desktop navigation
  gives way to the mobile menu below 1024px. A single 64px header replaces the
  separate workspace bar; workspace switching stays available on mobile.

## Mobile navigation

All three roles share the same 44px menu trigger. Its staggered lines animate
into a close mark, with a clear selected blue surface and visible focus. The
floating panel uses a navy/blue heading, rounded navigation cards, supporting
labels, selected icon treatment and a separated sign-out action. It overlays
content without expanding the shared header. Width and maximum height stay
within the viewport, with internal scrolling on short screens. Motion honors
reduced-motion preferences. Menu cards and sign-out reveal a subtle orbiting
blue/cyan edge on pointer hover or keyboard focus. The masked decoration does
not cover labels or intercept input, stays paused/hidden at idle and becomes
a static highlight under reduced motion.

This is a non-modal navigation disclosure. Opening focuses the current route;
Escape restores the toggle, selecting a route returns focus to it, and outside
pointer/focus movement dismisses the panel. The panel closes on desktop resize,
returning focus to the visible desktop current-route link when needed. Explicit
close state prevents pointer/focus events from toggling it open again. Existing
role-specific destinations and access rules remain unchanged.

## Motion

- Shared buttons/navigation press to 0.98 immediately and release in 120ms.
  Color/border changes use 160ms; busy/normal icons fade in 140ms.
- Menus enter from the top-right trigger edge in 200ms, exit in 160ms. Shared
  dialogs use a 12px lift/fade entrance and an 8px fade exit at the same timings.
  Closed panels are immediately inert and hidden from assistive technology;
  focus restoration and event handling never wait for the visual exit.
- Keyed list rows enter over 240ms with a 30ms stagger capped at 150ms. Existing
  rows do not get new animation keys on refresh. AI plan results reveal sections
  over 260ms with delays capped at 200ms. No animation blocks actions or saving.
- Confirmed-action toasts and approval/check-in checkmarks pulse once. Loading
  notices have a short fade/lift, with the existing honest progress copy retained.
- Reduced motion disables press scaling and stagger delays, minimizes animation
  durations and removes the exit wait. No additional animation dependency.
- Build verified locally; user performs visual/interaction review for this pass.

## Shared controls

Admin activity oversight uses compact responsive rows: title and status together,
date/time and venue below, then organizer and a quiet View details action. At
1024px the list aligns into Activity/Organizer/View columns. Keep labels wrapping
and preserve the read-only detail destination. Updated 2026-11-07; visual review
of this list refinement is assigned to the user.

- Primary blue: the main positive action, including save, create and publish.
- Secondary outlined: alternative actions, details, reset and refresh.
- Ghost: quiet navigation/support actions. Red ghost marks destructive list
  actions; filled red is used for their confirmation.
- Buttons share border, radius, type and icon sizing. Default height is 44px;
  compact controls remain 44px on mobile and become 36px on larger screens.
  Disabled controls share a neutral, legible appearance rather than faded blue.
- Inputs/selects use the same 44px height and 8px radius, with visible focus and
  invalid states. Selects have a visible chevron; labels/hints remain associated.
- `SegmentedControl` is used for activity, registration, roster and request
  filters. Each button exposes `aria-pressed`; these are button groups, not ARIA
  tab widgets. Workspace selection has its own header disclosure with the current
  workspace, descriptive choices and a selected check. It supports keyboard
  Enter/Space, Arrow/Home/End, Escape with focus return, outside-click/Tab
  dismissal and ordinary button semantics. It does not grant permissions.
- Status badges use one text + dot + color treatment across events, requests
  and registrations. Surface cards use a 16px radius, fine border and light shadow.
- Modals scroll within the viewport and retain focus trapping/return behavior.
  Dialog and toast dismiss buttons have visible focus and generous touch areas.

## Screen refinements

- Activity creation groups details, campus schedule, registration limits/deadline
  and optional private facilities notes, followed by a review summary. End times
  can cross dates; all preview times use written-month campus formatting. Editing
  a field clears stale validation feedback. Student cards/details show seat
  counts and full/deadline/end states; buttons follow time while the backend
  remains authoritative. The Organizer's private maintenance panel distinguishes
  unlinked/waiting/received/uncertain/disabled and network-error states, with
  refresh/retry. Workspace preference survives activity/profile reload for dual
  Student/Organizer accounts without changing server capabilities.

- Organizer check-in separates camera and saved-ticket upload into matching
  option cards, followed by manual code entry. A two-step indicator distinguishes
  reading from attendance confirmation. Shared buttons replace the custom file
  label; focused code recovery, a Clear action, bounded camera preview and compact
  actionable image notices improve the error path. Image-reader states identify
  what failed rather than reporting every failure as an unreadable QR.

- Activity date/time controls have explicit calendar/clock buttons opening
  app-controlled dialogs. The calendar has month/year navigation, leap-year dates,
  arrow/Home/End/Page keyboard navigation, Today and Cancel. Time uses 24-hour
  hour/minute selects and explicit Use time; Cancel/Escape preserves the field.
  Direct native input/typing and validation remain available. Date, start, end
  and deadline openers have distinct accessible names. The grouped
  schedule section shows the campus timezone, field hints and a written-month,
  24-hour preview so the chosen instant is clear across browser date formats.
  The earlier `showPicker()` enhancement is retired: method presence did not
  establish that usable native picker UI would open in the user's browser.
- A compact Student/Organizer dropdown sits in the single header and replaces
  the separate workspace bar and repeated role badge for dual-access users.
  Approved Organizers no longer have a redundant request-access link in Student
  navigation; their existing own-request route remains available.
- Profile has a saved-name/avatar summary, a clear editable field and grouped
  reset/save actions. Read-only identity and access details form a side panel.
- Event cards use consistent secondary buttons aligned at the bottom regardless
  of title wrapping. Duplicate category decoration was removed from their art.
- The inert prototype “Load more activities” button was removed. Pagination is
  shown only by the real paged API state; list count and refresh sit together.
- Organizer lists/forms, Admin requests/overview, registration history and roster
  use the same controls. Published edits have a clear primary save action.

## Published activity descriptions

Student/Organizer details and read-only Admin details share a plain-text renderer.
Paragraph breaks are preserved. Full-line generated agenda headings, relative
minute ranges and numbered/bulleted lists render as readable headings and rows.
A generated Preparation checklist section is a native keyboard-accessible
collapsed disclosure with before/during/after task lists, so it does not dominate
the public description. It remains available to the same readers as before.
No HTML/Markdown execution, stored-content rewrite, access change or migration.
Ordinary manually written prose stays plain text with its line breaks preserved.

## Product wording

Use short instructions focused on the person's task. Provider names, API
transport, deterministic templates, server confirmations and retry identifiers
belong in technical documentation. Keep useful AI source/fallback labels and
clear review/send choices. The planning fallback is called Starter plan and
explicitly explains when AI is unavailable; never present it as generated AI.

## Verification

Loading is driven by the actual request lifecycle, with no deliberate app delays
or invented percentages. The full-page branded screen covers initial Google
session/campus-profile checks and sign-out. Data routes use card/list/form/profile
skeletons. Refresh/pagination preserves existing records and shows an inline
progress panel. Save, submit/resubmit, publish, close/delete, register/cancel,
Admin approval/rejection and AI generation use one operation message per action.
When a Loading/OperationNotice already explains progress, buttons use
`busyFeedback="notice"`: keep the original action label/icon, remain disabled
and expose `aria-busy`, without a second spinner or progress label. Standalone
buttons retain the default button spinner/optional busyLabel. Do not add a second
live region for the same operation. Organizer list refresh uses the shared list
notice; mutation notices appear only for the actual publish/close/delete action.
Processing admission and pending Maintenance notices take precedence over a
duplicate refresh notice. Busy dialogs keep duplicate actions/dismissal disabled until completion.
Errors release the busy state and preserve relevant form input. Motion honors
prefers-reduced-motion; skeleton decoration is hidden from assistive technology
and progress text uses status announcements. The delayed-loading browser check
holds test HTTP requests rather than slowing the application itself.

Build and isolated browser results are recorded in root PROGRESS.md. Profile
overflow is checked for all three roles at 360, 768, 1024 and 1440px. Screenshots
use disposable emulator identities and label that environment. Existing browser
flows cover Google sign-in, saving, registration/cancellation, approval,
ownership-protected publishing, mobile navigation and keyboard modal behavior.
These checks do not establish complete WCAG, cross-browser or real-user usability
compliance. No real-project seeding, code publication or deployment is needed for
this styling work.
