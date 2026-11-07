import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFrontendEnvironment, validateApiEnvironment } from '../../scripts/check-environment.mjs';

const frontend = { VITE_FIREBASE_API_KEY: 'public-web-key', VITE_FIREBASE_AUTH_DOMAIN: 'campus-project.firebaseapp.com', VITE_FIREBASE_PROJECT_ID: 'campus-project', VITE_FIREBASE_APP_ID: '1:123:web:abc', VITE_API_BASE_URL: 'https://api.campus.test', VITE_SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th', VITE_USE_EMULATORS: 'false' };
const api = { FIREBASE_PROJECT_ID: 'campus-project', GOOGLE_APPLICATION_CREDENTIALS: '/server/credentials.json', NODE_ENV: 'production', FRONTEND_ORIGINS: 'https://app.campus.test', SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th' };
test('production frontend cannot silently bake local, temporary or placeholder API URLs into a deployed bundle', () => {
  assert.deepEqual(validateFrontendEnvironment(frontend, 'production'), []);
  for (const url of ['http://localhost:3000', 'https://localhost:3000', 'https://temporary.ngrok-free.dev', 'https://your-api.example.com', 'https://api.campus.test/api']) assert.ok(validateFrontendEnvironment({ ...frontend, VITE_API_BASE_URL: url }, 'production').length);
  assert.deepEqual(validateFrontendEnvironment({ ...frontend, VITE_API_BASE_URL: 'http://localhost:3000' }, 'local'), []);
  assert.ok(validateFrontendEnvironment({ ...frontend, VITE_PARTNER_API_KEY: 'server-secret' }, 'production').length);
  assert.ok(validateFrontendEnvironment({ ...frontend, VITE_USE_EMULATORS: 'true' }, 'production').length);
});
test('production API checks preserve exact-origin, explicit facilities/HMAC and admission boundaries', () => {
  assert.deepEqual(validateApiEnvironment(api, 'production'), []);
  for (const origin of ['*', 'http://localhost:5173', 'https://app.campus.test/', 'https://app.campus.test/path']) assert.ok(validateApiEnvironment({ ...api, FRONTEND_ORIGINS: origin }, 'production').length);
  assert.ok(validateApiEnvironment({ ...api, TEAM10_WORK_ORDERS_ENABLED: 'true' }, 'production').length);
  assert.ok(validateApiEnvironment({ ...api, ORGANIZER_AI_AUTO_APPROVE: 'true', ORGANIZER_AI_POLICY: 'unconfirmed' }, 'production').length);
  const facilities = { ...api, TEAM10_WORK_ORDERS_ENABLED: 'true', TEAM10_PARTNER_KEY: 'private-test-key', TEAM10_WORK_ORDER_API_URL: 'https://maintenance.campus.test/api/partner/work-orders', WEBHOOK_REQUIRE_HMAC: 'true', WEBHOOK_INBOUND_SECRET: 'isolated-test-secret-not-a-real-key-12345' };
  assert.deepEqual(validateApiEnvironment(facilities, 'production'), []);
  assert.ok(validateApiEnvironment({ ...facilities, TEAM10_WORK_ORDER_API_URL: 'https://temporary.ngrok-free.dev/api/partner/work-orders' }, 'production').length);
});
