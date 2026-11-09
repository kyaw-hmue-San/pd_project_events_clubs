// CI and local rehearsal share the same gates. Never deploy or load backend/.env.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { testEnvironment } from './test-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2];
if (!['build', 'backend', 'browser', 'all'].includes(mode)) {
  console.error('Use ci-checks.mjs build|backend|browser|all.');
  process.exit(1);
}
const resultDirectory = resolve(root, 'ci-results');
mkdirSync(resultDirectory, { recursive: true });
const baseEnv = { ...process.env, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true' };
for (const key of Object.keys(baseEnv)) {
  if (/^(AIML_|ORGANIZER_AI_|PARTNER_|WEBHOOK_|TEAM10_|TEAM17_|LIBRARY_|GOOGLE_|GCLOUD_|GCP_|CLOUDSDK_|FIREBASE_|FIRESTORE_|VITE_|INTEGRATION_LOG_VIEWER_UIDS$|GH_TOKEN$|GITHUB_TOKEN$|NODE_OPTIONS$)/.test(key)) delete baseEnv[key];
}
baseEnv.FIREBASE_CLI_DISABLE_UPDATE_CHECK = 'true';
if (!baseEnv.JAVA_HOME && existsSync('/opt/homebrew/opt/openjdk/bin/java')) {
  baseEnv.PATH = `/opt/homebrew/opt/openjdk/bin:${baseEnv.PATH}`;
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, env, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Command failed (${signal || code}).`)));
  });
}

async function gate(stage) {
  const started = Date.now();
  let passed = false;
  try {
    if (stage === 'build') {
      // Build-only public fixtures: never used for login, deployed, or uploaded.
      // Project ID matches the existing Hosting target, as required by its guard.
      const env = { ...baseEnv,
        VITE_FIREBASE_API_KEY: 'ci-build-public-key-not-a-real-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'events-management-4d8ce.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'events-management-4d8ce',
        VITE_FIREBASE_APP_ID: 'ci-build-only-app-id',
        VITE_API_BASE_URL: 'https://pd-project-events-clubs.onrender.com',
        VITE_CAMPUS_TIME_ZONE: 'Asia/Bangkok',
        VITE_SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th', VITE_USE_EMULATORS: 'false' };
      await run(npm, ['run', 'build:production'], env);
      await run(npm, ['run', 'check:hosting'], env);
    } else {
      const env = testEnvironment(baseEnv);
      if (stage === 'backend') {
        env.FIREBASE_PROJECT_ID = 'demo-campus-events-tests';
        await run(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js',
          'emulators:exec', '--config', 'firebase.test.json', '--project', env.FIREBASE_PROJECT_ID,
          '--only', 'auth,firestore',
          'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=../ci-results/backend.xml tests/*.test.mjs'], env, resolve(root, 'backend'));
      } else {
        env.PLAYWRIGHT_JUNIT_OUTPUT_FILE = resolve(resultDirectory, 'browser.xml');
        await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--reporter=line,junit'], env);
      }
    }
    passed = true;
  } finally {
    writeFileSync(resolve(resultDirectory, `${stage}.json`), JSON.stringify({ stage,
      status: passed ? 'passed' : 'failed', durationMs: Date.now() - started,
      environment: stage === 'build' ? 'Build-only public fixtures; no provider calls' : 'Disposable demo emulators and mocked providers',
      deployed: false }, null, 2) + '\n');
  }
}

try {
  // Locally these share emulator ports; never run backend and browser together.
  for (const stage of mode === 'all' ? ['build', 'backend', 'browser'] : [mode]) await gate(stage);
} catch {
  console.error('Quality check failed. See the command output and ci-results.');
  process.exitCode = 1;
}
