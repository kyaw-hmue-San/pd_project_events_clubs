import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryConfig, libraryQuery, checkedCatalog, createLibrary } from '../src/features/library/service.js';
import { libraryCatalog, libraryFetch, libraryAiFetch } from '../../scripts/fixtures/library-catalog.mjs';

const config = { enabled: true, baseUrl: 'https://library.test', key: 'isolated-library-key', timeoutMs: 1000 };
const aiConfig = { enabled: true, apiKey: 'isolated-ai-key', model: 'test/model', timeoutMs: 1000 };
const client = extra => createLibrary({ config, aiConfig, fetchImpl: libraryFetch, aiFetchImpl: libraryAiFetch, ...extra });
const code = value => error => error.message === value;
test('Library configuration is explicit, server-only and disabled for real calls in emulator runs', () => {
  assert.equal(libraryConfig({}).enabled, false);
  const env = { LIBRARY_API_BASE_URL: config.baseUrl, LIBRARY_API_KEY: config.key };
  assert.equal(libraryConfig(env).enabled, true);
  for (const key of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST']) assert.equal(libraryConfig({ ...env, [key]: '127.0.0.1:9199' }).enabled, false);
  assert.equal(libraryConfig({ ...env, FIREBASE_PROJECT_ID: 'demo-campus' }).enabled, false);
  for (const url of ['http://library.test', 'https://library.test/api', 'https://user:secret@library.test', 'bad-url']) assert.throws(() => libraryConfig({ ...env, LIBRARY_API_BASE_URL: url }));
});
test('Library queries validate bounds and repeated/unknown parameters before provider calls', async () => {
  assert.equal(libraryQuery({ q: ' Python ' }).get('q'), 'Python');
  for (const value of [{ q: ['a', 'b'] }, { q: 'a'.repeat(101) }, { page: '01' }, { limit: '13' }, { url: 'https://evil.test' }]) await assert.rejects(client().search(value), code('INVALID_LIBRARY_QUERY'));
});
test('Library proxy sends only the configured catalog credential and projects real fields with pagination', async () => {
  const result = await client({ fetchImpl: async (url, options) => {
    assert.deepEqual(options.headers, { Accept: 'application/json', Authorization: 'Bearer isolated-library-key' });
    assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    return libraryFetch(url, options);
  } }).search({ q: 'Python', page: '2' });
  assert.equal(result.resources.length, 2); assert.equal(result.pagination.total, 6); assert.equal(result.pagination.has_next, false);
  assert.equal(result.resources[1].available_copies, 0); assert.equal(result.search.source, 'MANUAL');
});
test('Library rejects unsafe links, duplicate IDs and impossible copy counts without exposing extra fields', () => {
  const params = libraryQuery({}), valid = () => libraryCatalog(params);
  for (const mutate of [body => { body.resources[0].details_url = 'https://evil.test/books/x' }, body => { body.resources[0].details_url += '?token=private' }, body => { body.resources[1].id = body.resources[0].id }, body => { body.resources[0].available_copies = 3 }, body => { body.resources[0].total_copies = -1 }, body => { body.pagination.total_pages = 99 }]) {
    const body = valid(); mutate(body); assert.throws(() => checkedCatalog(body, params, config.baseUrl), code('LIBRARY_INVALID_RESPONSE'));
  }
  const body = valid(); body.resources[0].private_borrower = 'never expose';
  assert.equal(checkedCatalog(body, params, config.baseUrl).resources[0].private_borrower, undefined);
});
test('AI receives only public activity text and must confirm relevance before catalog suggestions', async () => {
  const activity = { title: 'Beginner Python workshop', description: 'Learn Python with campus peers.', facilitiesNotes: 'private equipment', email: 'private@example.test', uid: 'private-user' };
  const result = await client().suggest(activity);
  assert.equal(result.search.source, 'AI'); assert.equal(result.search.query, 'Python'); assert.equal(result.resources[0].title, 'Python resource 1');
  const fallback = client({ aiConfig: { enabled: false } });
  assert.deepEqual(await fallback.assess(activity), { eligible: false, status: 'UNAVAILABLE' });
  await assert.rejects(fallback.suggest(activity), code('LIBRARY_RELEVANCE_UNAVAILABLE'));
  const invalidAi = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ query: 'Python', books: ['Invented book'] }) } }] }));
  assert.equal((await client({ aiFetchImpl: invalidAi }).assess(activity)).status, 'UNAVAILABLE');
  await assert.rejects(client().suggest({ ...activity, title: 'Python fallback workshop' }), code('LIBRARY_RELEVANCE_UNAVAILABLE'));
});
const aiReply = value => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }));
test('social welcomes and unclear events hide AI suggestions without contacting the Library; manual search remains available', async () => {
  let reads = 0;
  const library = client({ fetchImpl: async (...args) => { reads++; return libraryFetch(...args) } });
  const social = { title: 'Fresher Welcome for Burmese Students', description: 'Welcome' };
  assert.deepEqual(await library.assess(social), { eligible: false, status: 'NOT_RELEVANT' });
  await assert.rejects(library.suggest(social), code('LIBRARY_NOT_RELEVANT'));
  assert.equal(reads, 0);
  assert.equal((await library.search({ q: 'Python' })).resources.length, 4);
  assert.equal(reads, 1);
});
test('relevance requires strict output and grounded subject/learning evidence, including non-English text', async () => {
  const activity = { title: 'Beginner Python workshop', description: 'Learn Python through practice.' };
  for (const value of [{ relevant: true, query: 'Chemistry', evidence: activity.title }, { relevant: true, query: 'Python', evidence: 'Invented educational purpose' }, { relevant: true, query: 'https://evil.test', evidence: activity.title }, { relevant: 'yes', query: 'Python', evidence: activity.title }, { relevant: true, query: 'Python', evidence: activity.title, books: [] }, { relevant: false, query: 'Python', evidence: '' }]) {
    assert.equal((await client({ aiFetchImpl: async () => aiReply(value) }).assess(activity)).status, 'UNAVAILABLE');
  }
  const thai = { title: 'อบรมภาษาไทย', description: 'ฝึกอ่านภาษาไทยสำหรับนักศึกษา' };
  const result = await client({ aiFetchImpl: async () => aiReply({ relevant: true, query: 'ภาษาไทย', evidence: thai.description }) }).assess(thai);
  assert.equal(result.eligible, true); assert.equal(result.query, 'ภาษาไทย');
});
test('relevance coalesces concurrent requests and caches by exact public text, with expiry and edit invalidation', async () => {
  let requests = 0, clock = 1000, release;
  const gate = new Promise(resolve => { release = resolve });
  const library = client({ now: () => clock, aiFetchImpl: async (...args) => { requests++; await gate; return libraryAiFetch(...args) } });
  const activity = { title: 'Python workshop', description: 'Learn Python.' };
  const first = library.assess(activity), second = library.assess({ ...activity, facilitiesNotes: 'private' });
  assert.equal(requests, 1); release();
  assert.equal((await first).eligible, true); assert.deepEqual(await second, await first);
  await library.suggest(activity); assert.equal(requests, 1);
  await library.assess({ ...activity, description: 'Learn Python with new exercises.' }); assert.equal(requests, 2);
  clock += 86400001; await library.assess(activity); assert.equal(requests, 3);
});
test('unavailable assessments suppress AI suggestions temporarily and retry after expiry without blocking manual search', async () => {
  let requests = 0, clock = 1000;
  const library = client({ now: () => clock, aiFetchImpl: async (...args) => { requests++; if (requests === 1) throw new DOMException('Synthetic timeout', 'TimeoutError'); return libraryAiFetch(...args) } });
  const activity = { title: 'Python workshop', description: 'Learn Python.' };
  assert.equal((await library.assess(activity)).eligible, false);
  await assert.rejects(library.suggest(activity), code('LIBRARY_RELEVANCE_UNAVAILABLE'));
  assert.equal(requests, 1); assert.equal((await library.search({ q: 'Python' })).resources.length, 4);
  clock += 60001; assert.equal((await library.assess(activity)).eligible, true); assert.equal(requests, 2);
});
test('Library disabled/network/auth/malformed/oversized responses fail safely without fabricated results or AI calls', async () => {
  const disabled = client({ config: { enabled: false }, aiFetchImpl: () => { throw new Error('Must not call AI') } });
  await assert.rejects(disabled.suggest({ title: 'Python' }), code('LIBRARY_NOT_CONFIGURED'));
  await assert.rejects(client().search({ q: 'unavailable' }), code('LIBRARY_UNAVAILABLE'));
  await assert.rejects(client().search({ q: 'malformed' }), code('LIBRARY_INVALID_RESPONSE'));
  await assert.rejects(client({ fetchImpl: async () => { throw new DOMException('private details', 'TimeoutError') } }).search({}), code('LIBRARY_UNAVAILABLE'));
  await assert.rejects(client({ fetchImpl: async () => new Response('private credential failure', { status: 401 }) }).search({}), code('LIBRARY_UNAVAILABLE'));
  await assert.rejects(client({ fetchImpl: async () => new Response('x'.repeat(262145)) }).search({}), code('LIBRARY_INVALID_RESPONSE'));
});
