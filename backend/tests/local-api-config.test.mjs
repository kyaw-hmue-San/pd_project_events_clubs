import test from 'node:test';
import assert from 'node:assert/strict';
import { localIntegrationEnvironment } from '../local-api-config.mjs';
import { createIntegration, integrationConfig } from '../src/features/integrations/service.js';

const secret = 'isolated-inbound-test-secret-1234567890';
const source = {
  FIREBASE_PROJECT_ID: 'demo-mode-unit-tests', WEBHOOK_INBOUND_SECRET: secret,
  WEBHOOK_OUTBOUND_SECRET: 'outbound-fixture-secret-123456789012345', PARTNER_WEBHOOK_URL: 'https://partner.example/webhook',
  PARTNER_API_URL: 'https://partner.example/health', PARTNER_API_TOKEN: 'test-partner-token',
  PARTNER_INBOUND_API_KEY: 'provider-fixture-secret-123456789012345', INTEGRATION_LOG_VIEWER_UIDS: 'fixture-uid',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
  AIML_API_KEY: 'unrelated-fixture-value',
};

test('default development mode still disables every integration and emulator routing', () => {
  const env = localIntegrationEnvironment(source);
  assert.equal(Object.keys(env).some(key => /^(PARTNER_|WEBHOOK_)/.test(key) || key.includes('EMULATOR')), false);
  assert.equal(env.INTEGRATION_LOG_VIEWER_UIDS, undefined);
  assert.equal(integrationConfig(env).inboundSecret, '');
});
test('explicit maintenance mode retains only the agreed inbound webhook secret', () => {
  const env = localIntegrationEnvironment(source, { maintenanceTest: true });
  assert.deepEqual(Object.keys(env).filter(key => /^(PARTNER_|WEBHOOK_)/.test(key)), ['WEBHOOK_INBOUND_SECRET']);
  assert.equal(integrationConfig(env).inboundSecret, secret);
  assert.equal(env.INTEGRATION_LOG_VIEWER_UIDS, undefined);
  assert.equal(env.FIRESTORE_EMULATOR_HOST, undefined);
});
test('missing, weak, placeholder or padded secrets fail closed without disclosing their values', () => {
  for (const value of [undefined, '', 'weak', 'replace_with_a_different_32_character_secret', ` ${secret}`, `${secret} `]) {
    assert.throws(() => localIntegrationEnvironment({ WEBHOOK_INBOUND_SECRET: value }, { maintenanceTest: true }), error => {
      assert.match(error.message, /^Set WEBHOOK_INBOUND_SECRET privately/);
      if (value) assert.equal(error.message.includes(value), false);
      return true;
    });
  }
});
test('configuration filtering preserves unrelated app settings without mutating its input', () => {
  const previous = { ...source };
  const env = localIntegrationEnvironment(source, { maintenanceTest: true });
  assert.deepEqual(source, previous);
  assert.equal(env.AIML_API_KEY, source.AIML_API_KEY);
  assert.equal(env.FIREBASE_PROJECT_ID, source.FIREBASE_PROJECT_ID);
});
test('inbound-only worker cannot query delivery jobs or make a partner request', async () => {
  let calls = 0;
  const config = integrationConfig(localIntegrationEnvironment(source, { maintenanceTest: true }));
  const integration = createIntegration({ db: { doc: () => ({}) }, config, fetchImpl: () => { calls++; throw new Error('Forbidden external call') } });
  await integration.tick();
  assert.equal(calls, 0);
  assert.equal(integration.maintenanceWebhookEnabled, true);
});
test('partner provider authentication stays disabled even with a previously configured key', () => {
  const integration = createIntegration({ db: { doc: () => ({}) }, config: integrationConfig(localIntegrationEnvironment(source, { maintenanceTest: true })) });
  assert.throws(() => integration.authenticatePartner(source.PARTNER_INBOUND_API_KEY), /PARTNER_API_NOT_CONFIGURED/);
});
