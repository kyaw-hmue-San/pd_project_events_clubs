# Proposed source layout and safe migration from `.mjs`
The problem is **large modules**, not ESM `.mjs`. Do not change extensions until confirming package `"type":"module"`, Node version and current import behavior. A `.js` module using ESM is fine; `.mjs` is also fine.

```
repo/
  firebase/
    api.mjs                     # thin compatibility entrypoint initially (optional)
    integration.mjs             # compatibility export shim initially (optional)
    src/
      app.js                    # Express app factory; middleware + route mounting
      server.js                 # load config, listen, start worker; no side effects in app.js
      config/firebase.js        # server-only Admin SDK
      config/env.js             # validated config; never print secrets
      middleware/auth.js        # token verify, email verified, user role loaded
      middleware/roles.js       # allowlist + resource-owner guards
      middleware/errors.js      # stable JSON error envelope
      middleware/cors.js        # exact allowlist
      features/
        activities/{routes,controller,service,validation}.js
        registrations/{routes,controller,service,validation}.js
        users/{routes,service}.js
        admin/{routes,service}.js
        integrations/{routes,service,worker,validators}.js
      shared/{pagination,time,logger}.js
    tests/{activities,registrations,admin,integration}.emulator.test.js
    package.json
  frontend/
    src/
      app/{router,providers}.jsx
      api/{client,endpoints}.js
      auth/{firebaseClient,session,roleGuard}.js
      features/
        student/events/
        student/registrations/
        organizer/activities/
        organizer/roster/
        admin/overview/
      components/{ui,layout}/
      styles/tokens.css
    package.json
```

## Extraction sequence, commit one logical slice at a time
1. Baseline `npm test` + emulator suite; record existing route list and outputs, branch. No production calls.
2. Add `src/app.js` Express factory but keep server startup behavior; separate side effects so HTTP tests can import app without starting worker. Keep existing `api.mjs` entrypoint pointing to new server if stable.
3. Extract config/auth/errors/CORS; preserve exact code paths, status codes, `X-Request-ID` and route base.
4. Extract Activities (including publication + outbox transaction) preserving partner event shape.
5. Extract Registrations (atomic lock/count/idempotent cancel) with no duplication of transaction logic.
6. Extract Users and Integrations; worker remains started only by server.js on persistent host, not tests.
7. Add Admin feature and new P0 routes separately after extraction; don't conflate pure refactor with behavior changes.
8. Update `package.json` `start`/`seed`/tests; preserve Postman contract and update deployment guide. Ensure no duplicate route mounting or extra worker.

**Fast checks after each move:** `node --check`, import/boot check, old tests, exact route smoke on emulator as feasible. Full regression campaign comes after wiring, but don't claim equivalence without baseline. Never replace the working transactional implementation with superficial CRUD.

## Feature convention
`routes` wires HTTP + route-specific role; `controller` translates request/response; `service` holds domain and Firestore transaction logic; `validation` checks allowlisted fields; share concerns where repeated. For a tiny module combine files rather than force needless layers. Keep tests close to domains and interface stable.
