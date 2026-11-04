import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testEnvironment } from './test-environment.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = testEnvironment();
const seed = spawn(process.execPath, ['firebase/seed-test-fixtures.mjs'], { cwd: root, env, stdio: 'inherit' });
const result = await new Promise(resolve => seed.once('exit', resolve));
if (result !== 0) process.exit(result || 1);
const children = [spawn(process.execPath, ['firebase/api.mjs'], { cwd: root, env, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { cwd: root, env, stdio: 'inherit' })];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  Promise.all(children.map(child => child.exitCode !== null ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))))
    .then(() => process.exit(code));
}
for (const child of children) {
  child.once('error', () => stop(1));
  child.once('exit', code => { if (!stopping) stop(code || 1); });
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
