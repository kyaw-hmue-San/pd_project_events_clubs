// Offline deployment check. Never print secret values or upload source folders.
import { readFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { loadEnv } from 'vite';
import { validateFrontendEnvironment } from './check-environment.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('production', resolve(root, 'frontend'), 'VITE_');
const errors = validateFrontendEnvironment(env, 'production');
const config = JSON.parse(readFileSync(resolve(root, 'firebase.hosting.json'), 'utf8'));
if (config.hosting?.public !== 'frontend/dist' || config.hosting.site !== env.VITE_FIREBASE_PROJECT_ID) errors.push('Hosting target must match the frontend project and publish only frontend/dist.');
if (!existsSync(resolve(root, 'frontend/dist/index.html'))) errors.push('Build the production frontend before publishing.');
const privatePath = resolve(root, 'backend/.env');
const privateEnv = existsSync(privatePath) ? parseEnv(readFileSync(privatePath, 'utf8')) : {};
const secretKeys = ['AIML_API_KEY', 'LIBRARY_API_KEY', 'PARTNER_INBOUND_API_KEY', 'PARTNER_API_TOKEN', 'WEBHOOK_INBOUND_SECRET', 'WEBHOOK_OUTBOUND_SECRET', 'TEAM10_PARTNER_KEY'];
const secrets = secretKeys.map(key => privateEnv[key]).filter(value => value && value.length >= 12);
const scan = directory => {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (lstatSync(path).isSymbolicLink()) { errors.push('Hosting output must not contain symlinks.'); continue; }
    if (entry.isDirectory()) { scan(path); continue; }
    if (/^\.env|service-account|firebase-adminsdk|private-key/i.test(entry.name)) errors.push('Hosting output contains a private configuration filename.');
    const bytes = readFileSync(path);
    if (bytes.includes(Buffer.from('-----BEGIN PRIVATE KEY-----')) || secrets.some(value => bytes.includes(Buffer.from(value)))) errors.push('Hosting output contains a server credential; publication is blocked.');
  }
};
scan(resolve(root, 'frontend/dist'));
if (errors.length) {
  for (const message of new Set(errors)) console.error(message);
  process.exitCode = 1;
} else console.log('Hosting artifact checks passed: production configuration and static assets only; no configured server credentials found.');
