# Design system proposal — Campus Events & Clubs
This is a **proposed visual specification** for fast, consistent implementation (not an existing brand/rubric mandate). Tone: contemporary university service: credible, welcoming, uncluttered. Do not use unrelated retro/portfolio styles or flashy demo effects.

## Design principles
- Put real action before decoration: registration status, date, place, and organizer must be immediately legible.
- Consistent Student/Organizer components, with role-specific actions.
- Calm visual hierarchy, readable data density, minimal animation; show truthful loading/persistence.
- Prefer accessible system fonts, semantic HTML, predictable focus, robust mobile navigation.

## Tokens (CSS custom properties example)
```css
:root {
  --brand-700:#145C64; --brand-600:#087E85; --brand-50:#E8F6F4;
  --ink-900:#172630; --ink-700:#40545F; --muted-500:#627782;
  --canvas:#F7F9FA; --surface:#FFFFFF; --stroke:#DCE5E8;
  --success:#19735A; --danger:#B43C41; --warning:#8A5710;
  --focus:#175CD3;
  --radius-sm:8px; --radius-md:12px; --radius-lg:18px;
  --shadow-card:0 3px 14px rgba(15,35,45,.07);
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  --content-max:1120px;
}
```
Color tokens are a starting point: verify text/interactive states meet WCAG AA contrast; don't assume every hue combination passes. Default fonts: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`; fall back gracefully without downloading fonts.

## Type and layout
- H1: 32–40px desktop, 28–32px mobile, weight 700, tight but readable.
- H2: 24–28px, H3: 18–20px, body: 16px, supporting: 14px (never make essentials 12px).
- Layout: max-width 1120px, horizontal page padding 16px mobile / 24px tablet / 32px desktop.
- Mobile: one card column. Tablet: 2 cards. Desktop: 3 cards. Cards adapt to actual content.
- 44×44px preferred interactive touch area; logical spacing scale above; restrained 120–180ms transitions with `prefers-reduced-motion` support.

## Components + variants to implement once
`AppShell`, `SiteHeader`, `PrimaryNav`, `RoleBadge` (label only, not authorization), `Button` (primary/secondary/ghost/danger/loading/disabled), `Input`, `Textarea`, `Select`, `DateTimeField`, `FormField` (help+error), `EventCard`, `EventStatus`, `EventDetailsPanel`, `RegistrationStatus`, `ConfirmationDialog`, `Toast/InlineAlert`, `EmptyState`, `ErrorState`, `Spinner/Skeleton`, `Table`/mobile stacked roster, `PageTitle`, `ProtectedRoute` (UX only; still server guard).

## Visual information
- Event card: optional illustration/category icon or organizer-uploaded image (safe fallback), category/club, event title, human-readable date/time with timezone, venue, registration state/action, concise description. Avoid invented participant counts.
- Status texts: `Published`, `Closed`, `Draft`, `Registered`, `Cancelled`, `Unavailable` mapped to actual API states. Never color alone—include readable text.
- Organizer pages: simple dashboard list plus forms and roster, not fake charts/KPI cards.
- No stock-photo dependency needed for functionality; if images used, ensure rights and fallbacks. Emoji/placeholder illustration is acceptable for explicitly demo-seeded events.

## Accessibility and error behavior
- Native buttons/links; keyboard-compatible modals, visible focus, field labels; success and errors announced appropriately.
- Date and time always include local timezone and unambiguous formatting; verify storage UTC conversion.
- Form validations near fields and from real API; never silent failure.
- Show `403` permission-denied distinctly from `401` login required; timeout/offline retry messages; no data loss on failed form submit.
- Require confirmation for cancellation/destructive state; when success arrives, refetch authoritative server state.

## Fast quality bar
A clean, reusable layout with 5 functional screens is worth more than a complex aesthetic concept with fake buttons. Screenshot at 360px and 1440px; inspect forms, registration buttons, and roster at both widths.
