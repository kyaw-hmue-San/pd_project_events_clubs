# Campus Pulse — proposed single design source of truth
This pack intentionally selects the **blue/navy concept** discussed most recently, superseding the older teal handoff palette **for new Figma work**. Visual direction is suggested, not a lecturer mandate. Change consistently across all roles if the team prefers another theme.

## Tokens
| Token | Value | Usage |
|---|---|---|
| `--color-brand-dark` | `#172554` | navigation/header, strong text/brand |
| `--color-primary` | `#2563EB` | primary actions, links |
| `--color-teal` | `#0D9488` | positive status/accent, validate contrast |
| `--color-amber` | `#F59E0B` | highlights/warning, not unadjusted small text |
| `--color-canvas` | `#F8FAFC` | app background |
| `--color-surface` | `#FFFFFF` | cards/forms |
| `--color-text` | `#0F172A` | main text |
| `--color-muted` | `#475569` | secondary text |
| `--color-border` | `#CBD5E1` | outlines/dividers |
| `--color-error` | `#B91C1C` | error/failed state |
| `--color-focus` | `#1D4ED8` | focus outline |

Font: Inter / Plus Jakarta Sans / system sans. Weights regular 400, medium 500, semibold 600, bold 700. Body 16px, meta 14px, heading 24–36px responsive. 8px spacing grid with 4px micro-adjustments; radii 8/12/16px; subtle shadows only. Buttons ~44px minimum target. No full-width wall of card metrics for Student pages.

## Visual rules
- Student landing: clear hero/heading, category chips, authentic event cards, strong RSVP status.
- Organizer: practical lists and forms, no corporate finance dashboard or fake statistics.
- Admin: quiet read-only event oversight, factual numbers + paginated list, no edit affordances.
- Event art: use generated/simple non-copyrighted abstract category backgrounds, not uploaded photos or arbitrary real campus imagery unless permission. Images are optional; their absence cannot break layout.
- Use text + icon + color for status; never color alone. Contrast check WCAG AA before release; token list is not a contrast certification.
- Responsive widths: 360, 768, 1024, 1440 px; mobile 1-column cards, tablet 2, desktop 3 when appropriate; roster table collapses to readable stacked cards.
- Keyboard access, visible focus, proper `<label>`, error feedback, confirmation for cancellation, reduced motion.

## Handoff output
Figma Make should provide route/screen inventory, tokens, reusable component inventory and exported React source. Coding agent must map exported components to API data and remove preview-only fake state.
