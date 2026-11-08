import test from 'node:test';
import assert from 'node:assert/strict';
import { createInternships, internshipsConfig, internshipQuery, checkedInternships } from '../src/features/internships/service.js';
import { internshipFeed, internshipFetch } from '../../scripts/fixtures/internship-feed.mjs';

const config = { enabled: true, baseUrl: 'https://team17.test', timeoutMs: 1000 };
test('internship connection is explicit, separate and disabled in emulators without an injected provider', () => {
  assert.equal(internshipsConfig({}).enabled, false);
  assert.equal(internshipsConfig({ TEAM17_API_BASE_URL: config.baseUrl }).enabled, true);
  assert.equal(internshipsConfig({ TEAM17_API_BASE_URL: config.baseUrl, FIREBASE_PROJECT_ID: 'demo-test' }).enabled, false);
  for (const url of ['http://team17.test', 'https://user:secret@team17.test', 'https://team17.test/path', 'https://team17.test?q=1']) assert.throws(() => internshipsConfig({ TEAM17_API_BASE_URL: url }));
});
test('internship queries accept bounded literal filters and reject extra/repeated parameters before provider calls', async () => {
  const params = internshipQuery({ q: ' React & SQL% ', work_mode: 'remote', page: '2' });
  assert.equal(params.get('q'), 'React & SQL%'); assert.equal(params.get('status'), 'open');
  for (const input of [{ page: '0' }, { page: '01' }, { limit: '51' }, { q: ['a', 'b'] }, { url: 'https://other.test' }, { status: 'closed' }, { work_mode: 'anything' }, { q: 'x'.repeat(101) }]) assert.throws(() => internshipQuery(input), /INVALID_INTERNSHIP_QUERY/);
  let calls = 0;
  const service = createInternships({ config, fetchImpl: async () => { calls++; throw new Error('must not call') } });
  await assert.rejects(service.list({ limit: '0' }), /INVALID_INTERNSHIP_QUERY/); assert.equal(calls, 0);
});
test('validated internship pages preserve pagination/demo/deadline fields and send no credentials', async () => {
  let options;
  const service = createInternships({ config, fetchImpl: async (url, init) => { options = init; return internshipFetch(url, init) } });
  const first = await service.list({}); assert.equal(first.data.length, 6); assert.equal(first.pagination.has_next, true);
  assert.deepEqual(options.headers, { Accept: 'application/json' }); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
  assert.equal(first.data[0].is_demo, true); assert.equal(first.data[0].allowance_thb, 0); assert.equal(first.data[1].allowance_thb, null);
  assert.equal(first.data[0].application_deadline, '2027-02-05');
  const second = await service.list({ page: '2' }); assert.equal(second.data.length, 2); assert.equal(second.pagination.has_next, false);
  const empty = await service.list({ q: 'no-such-opportunity' }); assert.equal(empty.data.length, 0); assert.equal(empty.pagination.total_pages, 0);
});
test('unverified provider payloads and unsafe details links are rejected; unknown/private fields are projected away', () => {
  const params = internshipQuery({}), body = internshipFeed(params);
  const response = patch => checkedInternships({ ...body, data: [{ ...body.data[0], ...patch }] }, params, config.baseUrl);
  for (const patch of [{ details_url: 'javascript:alert(1)' }, { details_url: 'https://other.test/opportunities/x' }, { is_demo: 'true' }, { status: 'draft' }, { application_deadline: '2027-02-30' }, { allowance_thb: -1 }, { duration_weeks: 105 }]) assert.throws(() => response(patch), /INTERNSHIPS_INVALID_RESPONSE/);
  assert.throws(() => checkedInternships({ ...body, success: false }, params, config.baseUrl), /INTERNSHIPS_INVALID_RESPONSE/);
  assert.throws(() => checkedInternships({ ...body, data: [body.data[0], body.data[0]] }, params, config.baseUrl), /INTERNSHIPS_INVALID_RESPONSE/);
  assert.equal(response({ private_notes: 'must disappear' }).data[0].private_notes, undefined);
});
test('provider failure, malformed/oversized response and disabled connection fail honestly without fake listings', async () => {
  const service = createInternships({ config, fetchImpl: internshipFetch });
  await assert.rejects(service.list({ q: 'unavailable' }), /INTERNSHIPS_UNAVAILABLE/);
  await assert.rejects(service.list({ q: 'timeout' }), /INTERNSHIPS_UNAVAILABLE/);
  await assert.rejects(service.list({ q: 'malformed' }), /INTERNSHIPS_INVALID_RESPONSE/);
  await assert.rejects(createInternships({ config, fetchImpl: async () => new Response('x'.repeat(262145)) }).list({}), /INTERNSHIPS_INVALID_RESPONSE/);
  await assert.rejects(createInternships({ config: { enabled: false } }).list({}), /INTERNSHIPS_NOT_CONFIGURED/);
});
