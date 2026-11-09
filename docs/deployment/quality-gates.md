# Continuous integration and quality gates

GitHub Actions workflow: [quality-gates.yml](../../.github/workflows/quality-gates.yml).
Added 9 November 2026. This is **CI with manual deployment**; no deployment action,
Firebase login, Render hook, production credentials or partner writes are included.
The workflow becomes active when the user publishes it to GitHub. A local run
does not prove a GitHub-hosted run or configure branch protection.

## What runs

Triggers: every pull request targeting `main`, pushes to `main`, and manual
workflow dispatch once available on GitHub. No path exclusions skip documentation
changes. `master` is the folder skeleton and deliberately has no build trigger.

| GitHub check | Gate |
|---|---|
| Build and artifact safety | Validate production-shaped public configuration; TypeScript/Vite build; existing Hosting artifact guard. |
| Backend emulator tests | All Node helper/API tests against local Auth/Firestore emulators, with JUnit results. |
| Browser journeys | Full Playwright suite against isolated services, including Chromium/WebKit where the tests use them; JUnit results. Focused `.only` tests are forbidden when CI is set. |
| **Quality gate** | Always evaluates build/backend/browser outcomes and fails if any is failed, cancelled or skipped. Make this the required merge check. |

The three main jobs use separate Ubuntu24.04 runners, Node22 and Java21 where
needed. Official actions are pinned to immutable commits. Read-only repository
permissions, non-persisted checkout credentials, timeouts and cancelled superseded
runs keep the workflow bounded. No `pull_request_target` privilege is used.

## Safety and reports

`scripts/ci-checks.mjs` removes inherited production/provider credential variables
before child commands. Tests force disposable `demo-` projects/loopback emulators
and injected AI/partner doubles. No backend `.env` is loaded. Do not add production
secrets, Admin keys, live fixture seeds or real partner calls to these jobs.
They do not affect the user's cleaned presentation database or two retained accounts.

The build uses deliberately nonfunctional public web key/app-ID fixtures plus
the existing Hosting site ID and API origin. It makes no runtime API calls and
**its output is not a deployment candidate**. `ci:build` replaces `frontend/dist`
locally; the normal deploy command always rebuilds with real public production
settings. CI does not upload that build or deploy it.

The existing artifact guard checks filenames, symlinks and private-key markers;
local configured server values are also checked when available. CI has no real
secret values to compare, so this is not a comprehensive repository/credential
scanner or proof that arbitrary hardcoded secrets cannot exist.

Only named stage JSON summaries and backend/browser JUnit XML are uploaded,
with seven-day retention. Build files, `.env`, private backups, emulator debug
logs, browser traces, QR screenshots and the whole repository are not uploaded.
Workflow logs/test failures can include synthetic fixture details; never modify
tests to use real participant data. `ci-results/` is ignored by Git.

## Run the same gates locally

Install dependencies once and browser runtimes as needed:

```sh
npm ci
npm ci --prefix backend
npx playwright install chromium webkit
```

Java21+ is required for Firestore emulation. The local runner recognizes the
existing Homebrew Java installation when JAVA_HOME is absent. GitHub installs
Temurin21 and Linux browser dependencies explicitly.

```sh
npm run ci:check
```

This runs build → backend → browser sequentially and stops on failure. For one
stage: `npm run ci:build`, `npm run ci:backend`, or `npm run ci:browser`.
Do not run the backend/browser stages simultaneously on one machine because
they share emulator ports. Existing `npm test`, `test:emulator` and `test:e2e`
commands remain available. JSON/XML results are in `ci-results/`.

## Activate the merge gate on GitHub

The user retains Git publication control. After committing/pushing this feature
branch and opening a PR into `main`, inspect its **Checks** tab. In the repository
**Actions → Quality gates**, open each job for logs and download result artifacts.
Do not describe checks as GitHub-passed until that run actually completes.

After the check has appeared, configure a branch rule/ruleset for `main`:

1. Require pull requests before merging and require status checks.
2. Select **Quality gate**, with GitHub Actions as its expected source where
   offered. Keep the exact name; requiring a different name can block all PRs.
3. Require the branch to be up to date before merging. Avoid bypasses if the rule
   should apply to repository administrators too. Configure real human reviews
   according to actual team participation; no synthetic authors/reviews.

This task adds the workflow only; it does not change repository settings or
activate enforcement remotely. Workflow checks alone do not prohibit a merge.
If a merge queue is adopted later, add its `merge_group` trigger before requiring
this workflow for that queue. No paid plan or GitHub billing change is requested.

## Deployment after passing checks

Review → passing checks → merge → explicit manual deployment:

- Frontend: `npm run deploy:frontend`, which rebuilds and checks the actual
  production public settings before uploading `frontend/dist`.
- Backend: existing Render dashboard Manual Deploy of the intended commit.
  If Render auto-deploy is enabled independently, it may deploy on pushes even
  though this workflow has no deploy step. Review that dashboard setting if you
  want fully manual releases; CI does not silently change it.

References: [Playwright CI](https://playwright.dev/docs/ci),
[Firebase emulator setup](https://firebase.google.com/docs/emulator-suite/install_and_configure),
[GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
Tests with mocked partners do not replace the live Maintenance presentation flow.
