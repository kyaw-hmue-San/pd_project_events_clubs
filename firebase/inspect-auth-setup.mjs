// Read-only remote setup check. Only public web config is persisted; no tokens,
// service-account keys, Google OAuth secrets or account lists are printed/saved.
import { applicationDefault } from 'firebase-admin/app';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId || projectId.startsWith('demo-')) throw new Error('Set the real FIREBASE_PROJECT_ID in firebase/.env');
let phase = 'credentials';
try {
  const credential = applicationDefault();
  const { access_token: token } = await credential.getAccessToken();
  const get = async url => {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Object.assign(new Error('SETUP_READ_FAILED'), { status: response.status });
    return response.json();
  };
  phase = 'list-web-apps';
  const apps = await get(`https://firebase.googleapis.com/v1beta1/projects/${encodeURIComponent(projectId)}/webApps`);
  if (apps.apps?.length !== 1) {
    console.log(JSON.stringify({ status: 'needs-web-app-selection', projectId, webAppCount: apps.apps?.length || 0 }));
    process.exitCode = 1;
  } else {
    phase = 'public-web-config';
    const config = await get(`https://firebase.googleapis.com/v1beta1/${apps.apps[0].name}/config`);
    if (config.projectId !== projectId || !config.apiKey || !config.authDomain || !config.appId) throw new Error('INVALID_WEB_CONFIG');
    const destination = fileURLToPath(new URL('../.env.local', import.meta.url));
    let wrotePublicConfig = false;
    if (!existsSync(destination)) {
      const values = {
        VITE_FIREBASE_API_KEY: config.apiKey, VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
        VITE_FIREBASE_PROJECT_ID: config.projectId, VITE_FIREBASE_APP_ID: config.appId,
        VITE_API_BASE_URL: 'http://localhost:3000', VITE_USE_EMULATORS: 'false',
        VITE_CAMPUS_TIME_ZONE: 'Asia/Bangkok', VITE_SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th',
      };
      writeFileSync(destination, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx' });
      wrotePublicConfig = true;
    }
    phase = 'google-provider-status';
    // This response may include an OAuth secret. Read only .enabled; never log it.
    const provider = await get(`https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(projectId)}/defaultSupportedIdpConfigs/google.com`);
    console.log(JSON.stringify({ status: 'checked', projectId, wrotePublicConfig, googleEnabled: provider.enabled === true }));
  }
} catch (error) {
  console.error(JSON.stringify({ status: 'setup-access-unavailable', phase, code: error.status || error.code || 'AUTHENTICATION_FAILED' }));
  process.exitCode = 1;
}
