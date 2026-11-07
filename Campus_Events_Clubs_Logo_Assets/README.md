# Campus Events & Clubs — Logo Assets

A reusable logo kit for the Campus Events & Clubs React/Vite application.

**Source and fidelity:** The mark was **recreated as scalable SVG artwork based on the user-provided cropped screenshot**. It preserves the recognizable navy graduation cap, blue calendar, and curved orbit. It is **not the original designer's vector master**, and minor geometry differences are possible. `references/user-cropped-reference.png` is reference-only and contains screenshot background; do **not** use it in the app.

## Recommended files

| Usage | File |
|---|---|
| Best scalable logo for light headers | `svg/logo-mark.svg` |
| Best scalable logo for dark headers | `svg/logo-mark-on-dark.svg` |
| Horizontal logo + product name | `svg/logo-horizontal.svg` |
| Horizontal logo for navy/dark background | `svg/logo-horizontal-on-dark.svg` |
| Light/white monochrome mark | `svg/logo-mark-monochrome.svg` |
| App icon, dark background | `svg/app-icon.svg` or `png/app-icon-512.png` |
| App icon, light background | `svg/app-icon-light.svg` or `png/app-icon-light-512.png` |
| Browser favicon | `favicons/favicon.ico` or `favicons/favicon.svg` |
| Apple touch icon | `favicons/apple-touch-icon.png` |
| PWA icons | `favicons/icon-192.png`, `favicons/icon-512.png` |
| Preview | `branding/preview.png` |

Transparent mark PNGs are provided at 64, 128, 256, 512, and 1024 pixels width. The plain mark SVGs and PNGs have transparent backgrounds; app icons intentionally have square backgrounds.

## React + Vite integration (recommended)

1. Copy `svg/logo-mark.svg`, `svg/logo-horizontal.svg`, and `svg/logo-mark-on-dark.svg` into `frontend/public/brand/` (adjust `frontend/` to the actual app directory).
2. Copy `favicons/favicon.ico`, `favicons/favicon.svg`, `favicons/apple-touch-icon.png`, `favicons/icon-192.png`, `favicons/icon-512.png`, and `favicons/site.webmanifest` into `frontend/public/`.
3. In a React component:

```jsx
export function BrandLogo({ compact = false }) {
  return <img
    src={compact ? '/brand/logo-mark.svg' : '/brand/logo-horizontal.svg'}
    alt="Campus Events & Clubs"
    className={compact ? 'h-10 w-auto' : 'h-12 w-auto'}
  />;
}
```

4. In `frontend/index.html`, inside `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="alternate icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#12376F" />
```

5. Use `/brand/logo-horizontal-on-dark.svg` on navy backgrounds. Keep the logo proportional: use `width: auto` when setting height, and do not crop or stretch it.

## Design tokens

- Navy: `#0E2E63`
- Brand navy: `#12376F`
- Orbit blue: `#137FDA`
- Calendar sky: `#3BA8EC`
- White: `#FFFFFF`

## For Codex / coding teammate

Use these exact exported assets instead of approximating the logo with emojis or icon libraries. Prefer SVG for the app shell and PNG for Open Graph/social previews if required. Keep the logo an independent shared component and retain the original source files. Ensure light/dark logo variants match background contrast. Do not claim the campus product is an official university service unless approved. This logo is a student-project brand, not the school crest.

No licensing grant from any official school emblem is implied.
