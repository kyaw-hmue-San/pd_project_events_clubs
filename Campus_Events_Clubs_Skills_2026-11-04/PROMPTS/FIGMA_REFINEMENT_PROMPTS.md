# Optional short Figma Make refinement prompts
Use **one at a time** after `FIGMA_MAKE_MASTER_PROMPT.md` rather than regenerating the entire app. This keeps changes focused and saves prompt budget. Figma Make's official guidance recommends layout first and interactions after.

## Design quality and consistency
Keep all existing screens and routes. Audit the current UI against `Campus Pulse` navy/blue/teal tokens, uniform typography, spacing, card shape, button styles and visible focus. Fix inconsistent variants only. Do not add new features or backend code. Return a concise list of changed components.

## Student states
Keep existing layout. Add accurate states for Student event list/details/registrations: empty, loading, offline, 401, 403, already registered, CLOSED cannot register, success after a simulated preview-only response, and cancel confirmation. Label all prototype behavior clearly and keep the API adapter replaceable.

## Organizer details
Keep design system. Ensure Organizer My Activities includes OWN DRAFT/PUBLISHED/CLOSED rows; add create/edit form validation, Publish and Close confirmations and mobile-friendly roster. No reopen CLOSED. Annotate `GET /api/me/activities` as a backend dependency, not a working API.

## Admin read-only pass
Keep existing screens, create only Admin Overview, All Activities, Activity Detail. Remove **all** buttons that imply Admin write powers. Any counts are preview only until backed by real API aggregate. No PII, roster or logs. Render nice but restrained all-event management table as read-only inspection.

## Responsive and export cleanup
Do not redesign entire product. Inspect at 360/768/1024/1440px; fix overflow, cramped table/roster, inaccessible focus and dialog behavior. Convert repeated elements into reusable React components, centralize tokens and keep one API adapter with no mock persistence in production paths. Provide export/readme map.
