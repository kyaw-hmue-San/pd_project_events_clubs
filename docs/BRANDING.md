# Campus Events & Clubs branding

The user-supplied `Campus_Events_Clubs_Logo_Assets/` folder was already extracted
when integrated. Its [README](../Campus_Events_Clubs_Logo_Assets/README.md) defines
the supplied artwork, provenance, colors and usage. The source kit is retained
unchanged; reference screenshots are not application assets.

## Shared component

Use `frontend/src/components/BrandLogo.tsx` across all roles:

```tsx
<BrandLogo />
<BrandLogo compact height={40} />
<BrandLogo tone="dark" height={64} />
<BrandLogo compact tone="dark" height={32} decorative />
```

`tone` describes the background: `light` for white/light surfaces, `dark` for
navy/dark surfaces. It intentionally follows the actual surface, not OS theme.
`compact` chooses the supplied icon-only SVG; otherwise use the horizontal SVG.
`height` sets display height while width remains automatic. Do not tint, filter,
crop, stretch, regenerate, or substitute an icon-library mark. The component has
product-name alt text; use `decorative` only when nearby text or a labelled
control already supplies the accessible name.

The shared application header uses the horizontal SVG at 640px and above and
the compact mark below that width. Its home control has an accessible name.
Sign-in uses the horizontal light/dark variants; loading/profile setup use the
compact mark. Dark mobile navigation and discovery use the on-dark mark.
Visible product names use Campus Events & Clubs. Existing internal session keys,
ticket credentials, API paths and integration payload contracts remain stable.

## Central runtime assets

- `frontend/public/brand/`: all seven supplied SVG variants, copied byte-for-byte.
- `frontend/public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`,
  `icon-512.png`, `site.webmanifest`: supplied files, copied byte-for-byte.
- `frontend/index.html`: SVG/ICO favicon, Apple touch icon, manifest, product title and
  supplied `#12376F` theme color. React logo URLs use Vite `BASE_URL`; HTML links
  use `%BASE_URL%`. The supplied manifest targets the current root deployment.

The manifest supplies standalone launch metadata and app icons. This change
does not add a service worker or offline data storage. Brand navy, orbit blue,
calendar sky and white remain exactly as exported in each asset.

## Local verification — 2026-11-07

Production build and diff check passed. SHA-256 comparisons confirmed all 13
runtime assets match their supplied originals. PNG dimensions match manifest
entries (192/512) and Apple touch size (180). Built output includes the assets
and resolves its local head/manifest links. No real AI/partner calls, deployment
or push. User performs visual UI/UX review; no browser tests for this pass.
