// Local real-account development only. Production still starts api.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';
import { localIntegrationEnvironment } from './local-api-config.mjs';

async function start() {
  const { values } = parseArgs({ options: { 'maintenance-test': { type: 'boolean', default: false }, 'facilities-test': { type: 'boolean', default: false } }, strict: true });
  const facilitiesTest = values['facilities-test'];
  const maintenanceTest = values['maintenance-test'] || facilitiesTest;
  const root = fileURLToPath(new URL('../', import.meta.url));
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId || projectId.startsWith('demo-')) {
    throw new Error('Set the real FIREBASE_PROJECT_ID in backend/.env.');
  }
  const frontendFile = resolve(root, 'frontend/.env.local');
  if (existsSync(frontendFile)) {
    const frontend = parseEnv(readFileSync(frontendFile, 'utf8'));
    if (frontend.VITE_FIREBASE_PROJECT_ID && frontend.VITE_FIREBASE_PROJECT_ID !== projectId) {
      throw new Error('Frontend and backend Firebase project IDs must match.');
    }
    if (frontend.VITE_API_BASE_URL !== 'http://localhost:3000') {
      throw new Error('Set VITE_API_BASE_URL=http://localhost:3000 in frontend/.env.local and restart Vite.');
    }
  }

  const configured = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fallback = resolve(root, 'backend/service-account.local.json');
  const credentialFile = configured && existsSync(configured) ? resolve(configured) : fallback;
  if (!existsSync(credentialFile)) {
    throw new Error('Firebase Admin credential file is missing. Place it at backend/service-account.local.json or correct GOOGLE_APPLICATION_CREDENTIALS in backend/.env. Keep its contents private.');
  }
  let credential;
  try { credential = JSON.parse(readFileSync(credentialFile, 'utf8')); }
  catch { throw new Error('The Firebase Admin credential file must contain valid JSON.'); }
  if (credential.type !== 'service_account' || credential.project_id !== projectId ||
      !credential.private_key || !credential.client_email) {
    throw new Error('Use a Firebase Admin service-account JSON for the configured Firebase project.');
  }

  // Modes retain only their explicitly authorized partner settings. Legacy
  // outbound publication/polling, diagnostics and emulator routing stay disabled.
  const localEnv = localIntegrationEnvironment(process.env, { maintenanceTest, facilitiesTest });
  for (const key of Object.keys(process.env)) if (!(key in localEnv)) delete process.env[key];
  Object.assign(process.env, localEnv);
  Object.assign(process.env, {
    GOOGLE_APPLICATION_CREDENTIALS: credentialFile,
    NODE_ENV: 'development', PORT: '3000', FRONTEND_ORIGINS: 'http://localhost:5173',
    SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th',
  });
  console.log(facilitiesTest ? 'Starting local API on port 3000 with real Firebase. Explicit facilities requests and signed maintenance webhooks are enabled; legacy outbound publication and polling remain disabled.' : maintenanceTest
    ? 'Starting local API on port 3000 with real Firebase. Inbound maintenance webhooks are enabled; outbound partner calls and partner provider access are disabled.'
    : 'Starting local API on port 3000 with real Firebase. Partner integrations are disabled.');
  await import('./api.mjs');
}

start().catch(error => {
  // Do not print SDK error objects or private credential contents.
  console.error(error.message.startsWith('Firebase Admin credential file is missing') ||
    /^(Set |Frontend |The Firebase Admin |Use a Firebase Admin )/.test(error.message)
    ? error.message : 'Local API startup failed. Check the private backend configuration.');
  process.exitCode = 1;
});
