import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { testEnvironment } from './test-environment.mjs';
const env = testEnvironment();
// Homebrew Java is sometimes installed without the macOS Java launcher shim.
if (!env.JAVA_HOME && existsSync('/opt/homebrew/opt/openjdk/bin/java')) env.PATH = `/opt/homebrew/opt/openjdk/bin:${env.PATH}`;
const child = spawn(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:exec',
  '--config', 'firebase.test.json', '--project', 'demo-campus-pulse-e2e', '--only', 'auth,firestore', 'node ../scripts/test-services.mjs'],
  { cwd: fileURLToPath(new URL('../firebase/', import.meta.url)), env, stdio: 'inherit' });
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { stopping = true; child.kill(signal); });
child.once('error', () => process.exit(1));
child.once('exit', code => process.exit(stopping ? 0 : code || 0));
