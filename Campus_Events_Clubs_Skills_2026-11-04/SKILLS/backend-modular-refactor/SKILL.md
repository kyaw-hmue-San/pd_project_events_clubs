---
name: backend-modular-refactor
description: Extract oversized api.mjs and integration.mjs into feature-focused ESM modules safely, preserving HTTP behavior, transactions and worker lifecycle.
---
# Skill: Backend modular refactor
**Use when:** Preparing backend for multiple genuine contributors and feature additions.

## Inputs
`firebase/api.mjs`, `firebase/integration.mjs`, `firebase/package.json`, `SPECS/MODULE_BLUEPRINT.md`, current Postman export and tests.

## Procedure
1. Verify exact current checkout and baseline before editing. Prefer **pure refactor** separate from functional additions.
2. Use `firebase/src/{app,server}.js`, config/middleware, feature folders for activities, registrations, users, integrations. `app` must import without starting worker or listener; `server` starts them once.
3. Move one route cluster at a time; preserve matching URL, HTTP status/error shape, authorization, request ID, log redaction, CORS and response fields.
4. Keep publication plus outbox in same transaction; preserve registration active-lock/count atomic transaction; retain cancellation idempotency; preserve webhook validation/idempotency and worker lease timing.
5. Only use `.js` ESM if `"type":"module"` is correct and tested; alternatively keep `.mjs` modular files. Leave old entrypoint as thin shim until deployment/start commands move cleanly.
6. Update imports, package scripts, tests and deployment docs. Maintain strict secret isolation and Firestore deny-direct-client rules.
7. After each extraction run syntax, old helper tests, emulator smoke on touched endpoint. Save full exhaustive suite until all wiring complete but catch regressions early.

## Deliverables
Feature folders, simple imports, no duplicate route mounting, same externally observed API, bounded commits/PRs.

## Acceptance
Old Postman requests still address same paths; 13 existing emulator + 6 helper baseline tests remain viable; `start` launches once and worker still runs persistently.
