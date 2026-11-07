---
name: figma-export-to-code
description: Turn Figma Make's interactive prototype into a maintainable React/Vite/Tailwind source handoff without carrying fake production state.
---
# Skill: Figma export and engineering handoff
**Use when:** Figma design has been approved and coding agent is preparing the real frontend.

## Procedure
1. Capture screen navigation map, components list, token definitions, font dependencies, sample data registry and any interaction behavior that is preview-only.
2. Use Figma Make supported code export/download or GitHub clone/branch/PR flow; availability depends on account access and exact Make setup. Do not assume every environment offers direct GitHub push. Never overwrite backend repo or default branch.
3. Inspect generated project for big monolithic components, unnecessary libraries, unexpected Supabase backend/configuration, mock auth, fabricated API responses and unlicensed assets.
4. Move reusable UI to `frontend/src/components`, tokens to `frontend/src/styles`, role pages to feature folders. Keep one source for routes and data adapters.
5. Clearly mark and remove preview-only fake persistence before release; keep isolated demo fixture for Storybook-like previews if desired, but never production path.
6. Pair exported UI state to observed API contract and `SPECS/SCREEN_AND_DATA_HANDOFF.md`. If an endpoint does not exist, document it as backend gap.
7. Run a frontend dev/build smoke and render each route; full automated visual/keyboard/E2E tests are deferred until integration gate.

## Deliverables
Exported source commit/PR, screen-to-component map, mock-to-real replacement checklist and build output.

## Acceptance
The compiled UI can be integrated without a second backend, no credentials in bundle and no false promise that Figma prototype data is real Firestore state.
