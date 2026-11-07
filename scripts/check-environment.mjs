import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const placeholder = value => !value?.trim() || /^(your_|replace_with_)/i.test(value);
const loopback = hostname => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
function validUrl(value, production, originOnly = false) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || (originOnly && url.pathname !== '/')) return false;
    if (!['https:', 'http:'].includes(url.protocol) || (production && url.protocol !== 'https:')) return false;
    if (production && (loopback(url.hostname) || url.hostname.endsWith('.ngrok-free.dev') || /(^|\.)example(\.(com|org|net))?$/.test(url.hostname))) return false;
    return true;
  } catch { return false; }
}

// Pure checks: errors describe settings, never include their values.
export function validateFrontendEnvironment(env, mode = 'local') {
  const errors = [], production = mode === 'production';
  for (const key of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']) {
    if (placeholder(env[key])) errors.push(`${key} must be configured.`);
  }
  if (!validUrl(env.VITE_API_BASE_URL, production, true)) errors.push('VITE_API_BASE_URL must be an API origin; production requires a real HTTPS host, not localhost, a test tunnel or an example.');
  if (env.VITE_USE_EMULATORS === 'true' || env.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-')) errors.push('Real-app environment checks do not permit emulator configuration. Use the isolated test commands instead.');
  if (env.VITE_SCHOOL_EMAIL_DOMAIN !== 'lamduan.mfu.ac.th') errors.push('VITE_SCHOOL_EMAIL_DOMAIN must match the confirmed Student domain.');
  try { new Intl.DateTimeFormat('en', { timeZone: env.VITE_CAMPUS_TIME_ZONE || 'Asia/Bangkok' }); } catch { errors.push('VITE_CAMPUS_TIME_ZONE must be a valid timezone.'); }
  for (const key of Object.keys(env)) if (/^VITE_.*(PRIVATE_KEY|SERVICE_ACCOUNT|AIML_API_KEY|PARTNER.*(KEY|TOKEN)|WEBHOOK.*SECRET)/i.test(key)) errors.push('Server-only credentials must not use the VITE_ prefix.');
  return [...new Set(errors)];
}

export function validateApiEnvironment(env, mode = 'local') {
  const errors = [], production = mode === 'production';
  if (placeholder(env.FIREBASE_PROJECT_ID) || env.FIREBASE_PROJECT_ID?.startsWith('demo-')) errors.push('FIREBASE_PROJECT_ID must identify the real application project.');
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) errors.push('Real API configuration must not contain emulator hosts.');
  if (env.SCHOOL_EMAIL_DOMAIN !== 'lamduan.mfu.ac.th') errors.push('SCHOOL_EMAIL_DOMAIN must match the confirmed Student domain.');
  const origins = (env.FRONTEND_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => !validUrl(origin, production, true) || origin.endsWith('/'))) errors.push('FRONTEND_ORIGINS must contain exact frontend origins without trailing slashes; production requires real HTTPS origins.');
  if (production && env.NODE_ENV !== 'production') errors.push('NODE_ENV must be production on the API host.');
  if (placeholder(env.GOOGLE_APPLICATION_CREDENTIALS)) errors.push('Set GOOGLE_APPLICATION_CREDENTIALS to the server-only credential file path.');
  if (env.ORGANIZER_AI_AUTO_APPROVE === 'true' && env.ORGANIZER_AI_POLICY !== 'CAMPUS_ORGANIZER_V1') errors.push('AI auto-approval requires the confirmed CAMPUS_ORGANIZER_V1 policy.');
  const secret = value => !placeholder(value) && value.length >= 32 && value.trim() === value;
  if (env.TEAM10_WORK_ORDERS_ENABLED === 'true') {
    if (placeholder(env.TEAM10_PARTNER_KEY)) errors.push('Facilities sending requires TEAM10_PARTNER_KEY.');
    if (!validUrl(env.TEAM10_WORK_ORDER_API_URL, production) || new URL(env.TEAM10_WORK_ORDER_API_URL).protocol !== 'https:' || new URL(env.TEAM10_WORK_ORDER_API_URL).pathname !== '/api/partner/work-orders') errors.push('Facilities sending requires the confirmed HTTPS creation URL/path; production must not use a temporary tunnel.');
    if (env.WEBHOOK_REQUIRE_HMAC !== 'true' || !secret(env.WEBHOOK_INBOUND_SECRET)) errors.push('Facilities integration requires HMAC and the agreed inbound secret.');
  }
  if (env.PARTNER_WEBHOOK_URL && (!validUrl(env.PARTNER_WEBHOOK_URL, production) || new URL(env.PARTNER_WEBHOOK_URL).protocol !== 'https:' || !secret(env.WEBHOOK_OUTBOUND_SECRET))) errors.push('Outgoing publication webhooks require an approved URL and a configured secret.');
  return errors;
}

async function main() {
  const { values } = parseArgs({ options: { target: { type: 'string', default: 'all' }, mode: { type: 'string', default: 'local' } }, strict: true });
  if (!['frontend', 'api', 'all'].includes(values.target) || !['local', 'production'].includes(values.mode)) throw new Error('Use --target frontend|api|all and --mode local|production.');
  const errors = [];
  let frontend;
  if (values.target !== 'api') {
    const { loadEnv } = await import('vite');
    frontend = loadEnv(values.mode === 'production' ? 'production' : 'development', resolve(root, 'frontend'), 'VITE_');
    errors.push(...validateFrontendEnvironment(frontend, values.mode));
  }
  if (values.target !== 'frontend') {
    const path = resolve(root, 'backend/.env');
    // Production checks intentionally read host variables only, never local secrets.
    const local = values.mode === 'local' && existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {};
    const env = { ...local, ...process.env, ...(values.mode === 'local' ? {
      // Match dev-api.mjs's enforced local settings, not hosted defaults.
      NODE_ENV: 'development', PORT: '3000', FRONTEND_ORIGINS: 'http://localhost:5173', SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th',
    } : {}) };
    errors.push(...validateApiEnvironment(env, values.mode));
    if (frontend?.VITE_FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID && frontend.VITE_FIREBASE_PROJECT_ID !== env.FIREBASE_PROJECT_ID) errors.push('Frontend and API Firebase project IDs must match.');
    const credential = env.GOOGLE_APPLICATION_CREDENTIALS;
    if (values.mode === 'local' && credential && !existsSync(resolve(root, credential))) errors.push('The local server credential file path does not exist.');
  }
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else console.log(`${values.target} ${values.mode} environment checks passed. No network requests or credential values emitted.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error('Environment check failed. Check arguments and configuration files.'); process.exitCode = 1; });
