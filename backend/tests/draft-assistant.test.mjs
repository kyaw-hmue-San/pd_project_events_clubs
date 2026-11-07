import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDraftAssistant, draftAssistantConfig, templateDraft, validateDraftBrief } from '../src/features/draft-assistant/service.js';

const brief = { topic: 'Beginner Python workshop', audience: 'MFU students', purpose: 'Learn basic Python through practical exercises.', activityType: 'EVENT' };
const config = { enabled: true, apiKey: 'unit-only-not-a-live-key', model: 'google/gemini-2.5-flash', timeoutMs: 100 };
const suggestion = { title: 'Python for Beginners', description: 'Build your first small Python program with guided exercises.', agenda: ['Introductions', 'Guided coding', 'Questions and next steps'] };
const response = value => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }), { headers: { 'Content-Type': 'application/json' } });

test('draft brief validation bounds inputs and rejects identity/permission fields', () => {
  assert.deepEqual(validateDraftBrief({ ...brief, topic: '  Beginner   Python workshop  ' }), brief);
  for (const body of [null, [], {}, { ...brief, topic: 'x' }, { ...brief, purpose: 'x'.repeat(601) }, { ...brief, role: 'ADMIN' }, { ...brief, activityType: 'OTHER' }]) {
    assert.throws(() => validateDraftBrief(body), error => error.status === 400);
  }
});

test('template fallback is deterministic and contains no invented scheduling or identity fields', () => {
  assert.deepEqual(templateDraft(brief), templateDraft(brief));
  assert.deepEqual(Object.keys(templateDraft(brief).draft).sort(), ['activityType', 'description', 'title']);
  assert.ok(templateDraft(brief).draft.description.includes(brief.purpose));
});

test('missing credentials returns the useful template without calling a provider', async () => {
  const generate = createDraftAssistant({ config: { ...config, apiKey: '' }, fetchImpl: () => assert.fail('Provider must not be called') });
  assert.deepEqual(await generate(brief), templateDraft(brief));
});

test('emulator and demo-project configurations cannot consume real AI credits', async () => {
  for (const env of [{ FIREBASE_PROJECT_ID: 'demo-tests' }, { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199' }, { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180' }]) {
    const generate = createDraftAssistant({ config: draftAssistantConfig({ AIML_API_KEY: config.apiKey, ...env }), fetchImpl: () => assert.fail('No external AI in emulator checks') });
    assert.equal((await generate(brief)).source, 'TEMPLATE');
  }
});

test('valid AI output produces a bounded editable draft through the documented AIML endpoint', async () => {
  const generate = createDraftAssistant({ config, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.aimlapi.com/v1/chat/completions');
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.model, config.model);
    assert.deepEqual(JSON.parse(body.messages[1].content), brief);
    assert.equal(JSON.stringify(body).includes(config.apiKey), false);
    return response(suggestion);
  } });
  const result = await generate(brief);
  assert.equal(result.source, 'AI');
  assert.equal(result.draft.title, suggestion.title);
  assert.ok(result.draft.description.includes('1. Introductions'));
  assert.equal(result.draft.activityType, 'EVENT');
});

test('provider HTTP failures use the same deterministic draft with a transparent fallback source', async () => {
  for (const status of [401, 429, 500]) {
    const generate = createDraftAssistant({ config, fetchImpl: async () => new Response('private provider diagnostic', { status }) });
    const result = await generate(brief);
    assert.deepEqual(result, templateDraft(brief, 'PROVIDER_UNAVAILABLE'));
    assert.equal(JSON.stringify(result).includes('private provider diagnostic'), false);
  }
});

test('timeouts return a template rather than leaving the action hanging', async () => {
  const generate = createDraftAssistant({ config: { ...config, timeoutMs: 10 }, fetchImpl: async (_url, { signal }) => {
    await new Promise((resolve, reject) => { const timer = setTimeout(resolve, 1000); signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason) }, { once: true }) });
    assert.fail('Timed out request must not succeed');
  } });
  assert.deepEqual(await generate(brief), templateDraft(brief, 'TIMEOUT'));
});

test('malformed JSON, extra privileged fields and oversized model output are rejected', async () => {
  const invalid = [new Response('not JSON'), response({ ...suggestion, role: 'ADMIN' }), response({ ...suggestion, title: 'x'.repeat(201) }),
    response({ ...suggestion, agenda: [] }), response({ ...suggestion, title: 'Two\nlines' }), new Response('x'.repeat(66000))];
  for (const item of invalid) {
    const generate = createDraftAssistant({ config, fetchImpl: async () => item });
    assert.deepEqual(await generate(brief), templateDraft(brief, 'INVALID_RESPONSE'));
  }
});

test('truncated model completions and network failures cannot be mistaken for AI success', async () => {
  const truncated = createDraftAssistant({ config, fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: JSON.stringify(suggestion) } }] })) });
  assert.equal((await truncated(brief)).source, 'TEMPLATE');
  const network = createDraftAssistant({ config, fetchImpl: async () => { throw new Error('private provider failure') } });
  assert.equal((await network(brief)).source, 'TEMPLATE');
});
