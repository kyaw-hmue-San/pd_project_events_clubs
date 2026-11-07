# Frontend

React/Vite application:

```text
frontend/
  src/                 features, components, hooks and browser API client
  public/              official brand assets, favicons and manifest
  index.html
  vite.config.ts
  tsconfig.json
  .env.example         public local template
  .env.local           private local file, kept out of version control
  dist/                generated build output
```

Dependencies and orchestration are managed by the repository-root package.
Run `npm ci`, `npm run dev`, `npm run build`, and `npm run build:production`
**from the repository root**. The browser URL remains http://localhost:5173.

Vite loads environment files from this folder. Use `.env.production.local` here
or build-host variables for production; keep Admin/AI/partner secrets on the
backend. Frontend hosting should still install/build from the repository root
and publish `frontend/dist/`.

See [environment setup](../config/env/README.md), [deployment](../docs/deployment/README.md)
and [branding](../docs/BRANDING.md). Hash routes and public asset URLs are unchanged.
