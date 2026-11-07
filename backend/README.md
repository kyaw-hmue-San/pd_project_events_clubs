# Persistent API

- Live source: `frontend/src/`; compatibility entrypoints: `api.mjs`, `integration.mjs`.
- Operator/local `.mjs` tools, Firebase rules/indexes and emulator configs retain
  their existing paths. Tests are grouped in `tests/*.test.mjs`.
- Private local config: `.env`; [templates](../config/env/README.md).
- Preserved Postman collections may contain historical password/demo flows;
  use the current Google-only [API contract](../docs/API_CONTRACT.md).

See [local setup](../docs/LOCAL_DEVELOPMENT.md) and [deployment](../docs/deployment/README.md).
Importing `frontend/src/app.js` must not initialize Firebase or start a listener/worker.
Hosted startup stays `npm start` here and reads host variables only.
