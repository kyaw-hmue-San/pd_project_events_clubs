// No local .env is loaded. This mode uses only an isolated demo project.
export function testEnvironment() {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (/^(PARTNER_|WEBHOOK_|GOOGLE_APPLICATION_CREDENTIALS$|INTEGRATION_LOG_VIEWER_UIDS$)/.test(name)) delete env[name];
  }
  return { ...env, FIREBASE_PROJECT_ID: 'demo-campus-pulse-e2e',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180',
    FRONTEND_ORIGINS: 'http://127.0.0.1:5174,http://localhost:5174', PORT: '3100',
    VITE_FIREBASE_API_KEY: 'demo-campus-web-key', VITE_FIREBASE_PROJECT_ID: 'demo-campus-pulse-e2e',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-campus-pulse-e2e.firebaseapp.com', VITE_FIREBASE_APP_ID: 'demo-campus-web-app',
    VITE_API_BASE_URL: 'http://127.0.0.1:3100', VITE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9199', SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th', VITE_SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th', VITE_USE_EMULATORS: 'true', VITE_CAMPUS_TIME_ZONE: 'Asia/Bangkok' };
}
