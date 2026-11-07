# Environment setup

Examples are not active configuration and contain no real credentials. Keep
existing working private files; do not overwrite them with examples in cleanup.

| Target | Template | Active configuration |
|---|---|---|
| Local frontend | [frontend.local.env.example](frontend.local.env.example) | `frontend/.env.local` |
| Hosted frontend | [frontend.production.env.example](frontend.production.env.example) | Build-host variables or `frontend/.env.production.local` |
| Local API | [backend.local.env.example](backend.local.env.example) | `backend/.env` plus explicit launcher mode |
| Persistent hosted API | [backend.production.env.example](backend.production.env.example) | Host variables and mounted secret file |

`frontend/.env.example` and `backend/.env.example` remain fresh-local-setup templates,
not deployment defaults. Copy examples only for a fresh setup and fill in your
own project values. Frontend and backend Firebase project IDs must match.

## Local

`npm run check:env` checks the effective local configuration without starting
servers, calling Firebase/partners or printing credentials. The API launcher
enforces port 3000, `http://localhost:5173`, the confirmed Student domain and no
emulator routing. It reads `backend/.env` explicitly.

`dev:api` disables integrations. `dev:api:maintenance` enables inbound only;
`dev:api:facilities` enables reviewed owner sends and signed updates. Restart
only the selected API process after changes. The existing approved Team 10 test
URL stays in the private file until the coordinator deliberately changes it.

## Production

Set all frontend values on the build host, or in `.env.production.local` for a
deliberate local deployment build. Vite reads files in `frontend/`, including
generic `.env.local`; mode
values and existing host variables take priority. Public values are embedded at
build time, so rebuild after changing them. See [Vite's environment guide](https://vite.dev/guide/env-and-mode).

Use `npm run build:production` to reject placeholder/localhost/test-tunnel API
origins and emulator settings. Ordinary `npm run build` remains local verification,
not certification of deployable configuration.

For the API, configure the production template on the persistent host.
`npm run check:env:api:production` reads **host variables only**, never local
`backend/.env`. It checks exact HTTPS frontend origins and optional explicit
facilities/HMAC and admission settings. It does not prove credentials, network
connectivity, indexes, contracts or uptime. Secret-file paths refer to the host.

Never use `VITE_` for Admin credentials, AI/partner keys or webhook secrets.
Firebase's web API key is public configuration; Admin JSON remains server-only.
Do not relink existing local work orders to production. Automated test configuration
is separate in `scripts/test-environment.mjs` and guarded demo emulator files.
