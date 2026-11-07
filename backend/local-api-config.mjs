// Local launcher policy only. Production configuration and worker are unchanged.
export function localIntegrationEnvironment(source, { maintenanceTest = false, facilitiesTest = false } = {}) {
  maintenanceTest = maintenanceTest || facilitiesTest;
  const secret = source.WEBHOOK_INBOUND_SECRET;
  if (maintenanceTest && (typeof secret !== 'string' || secret.length < 32 || secret.trim() !== secret || /^replace_with_/i.test(secret))) {
    throw new Error('Set WEBHOOK_INBOUND_SECRET privately in backend/.env to the agreed secret (at least 32 characters, no surrounding whitespace).');
  }
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (/^(PARTNER_|WEBHOOK_|TEAM10_|INTEGRATION_LOG_VIEWER_UIDS$)/.test(key) || key.includes('EMULATOR')) delete env[key];
  }
  if (maintenanceTest) env.WEBHOOK_INBOUND_SECRET = secret;
  if (facilitiesTest) {
    const key = source.TEAM10_PARTNER_KEY || source.PARTNER_API_TOKEN;
    if (typeof key !== 'string' || !key.trim() || /[\r\n]/.test(key) || /^replace_with_/i.test(key)) throw new Error('Set TEAM10_PARTNER_KEY privately in backend/.env to the agreed Team 10 key.');
    env.TEAM10_PARTNER_KEY = key;
    env.TEAM10_WORK_ORDER_API_URL = source.TEAM10_WORK_ORDER_API_URL || 'https://maintenanceteam10.vercel.app/api/partner/work-orders';
    env.TEAM10_WORK_ORDERS_ENABLED = 'true';
    env.WEBHOOK_REQUIRE_HMAC = 'true';
  }
  return env;
}
