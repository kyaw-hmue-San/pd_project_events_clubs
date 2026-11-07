# Skills index — what to invoke for which job
These are **portable instructions** for humans and coding agents. Figma Make generally receives the master prompt; **do not assume** it automatically loads or interprets local `SKILL.md` folders.

## Figma Make design (prototype, not production backend)
1. `SKILLS/figma-design-foundation/SKILL.md` — tokens, shared components, responsive rules
2. `SKILLS/figma-student-experience/SKILL.md` — Student discovery/details/registration/cancel UI
3. `SKILLS/figma-organizer-experience/SKILL.md` — Organizer drafts/create/publish/roster
4. `SKILLS/figma-admin-readonly/SKILL.md` — Admin overview/all events/details only
5. `SKILLS/figma-export-to-code/SKILL.md` — export, clean components, remove preview data

**Entry prompt:** `PROMPTS/FIGMA_MAKE_MASTER_PROMPT.md`.

## Backend engineering
6. `SKILLS/backend-modular-refactor/SKILL.md` — safe extraction of existing .mjs files
7. `SKILLS/backend-fill-prd-gaps/SKILL.md` — Organizer own list, cancelled history, errors
8. `SKILLS/backend-admin-readonly/SKILL.md` — protected ADMIN role and GET endpoints
9. `SKILLS/backend-auth-and-integration/SKILL.md` — security, Team 10, worker preservation

**Entry prompt:** `PROMPTS/CODING_AGENT_MASTER_PROMPT.md`. **Next concrete task:** `PROMPTS/NEXT_CODING_AGENT_TASK.md`.

## Frontend integration
10. `SKILLS/frontend-auth-api-wiring/SKILL.md` — real Firebase token, Express client
11. `SKILLS/frontend-student-wiring/SKILL.md` — real Student flow
12. `SKILLS/frontend-organizer-admin-wiring/SKILL.md` — real Organizer and Admin flow

## Final QA and teamwork
13. `SKILLS/qa-deployment-and-demo/SKILL.md` — full testing AFTER wiring, deployment, lecturer demo
14. `SKILLS/git-team-attribution/SKILL.md` — truthful PR reviews and contributions

**Release prompt:** `PROMPTS/FINAL_QA_PROMPT.md`.

## Important source boundaries
- PRD is the product goal; Firebase API contract documents actual pre-frontend behavior.
- Admin and Firebase stack are *explicitly flagged decisions*, not assumed lecturer-approved.
- The `REFERENCES/` files are copies of user-supplied snapshots, **not evidence of current repository state**.
- Existing `Campus_Events_Clubs_Complete_Handoff` from an earlier handoff is useful for demo/test details. This package adds a build-first skills framework and new read-only Admin scope, and intentionally prioritizes the new blue Campus Pulse design over the older teal draft.
