import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeTicketCode } from '../src/features/tickets/routes.js';
import { safeRegistration } from '../src/shared/projections.js';

test('ticket parser accepts scanned and grouped manual codes without accepting URLs or personal identifiers', () => {
  const fixture = 'ABCD'.repeat(8);
  assert.equal(normalizeTicketCode(`CP1:${fixture}`), fixture);
  assert.equal(normalizeTicketCode(fixture.toLowerCase().match(/.{1,8}/g).join('-')), fixture);
  for (const invalid of [null, '', 'someone@lamduan.mfu.ac.th', '6731500000', `https://example.invalid/${fixture}`, 'x'.repeat(129), { code: fixture }]) {
    assert.throws(() => normalizeTicketCode(invalid), error => error.status === 400 && error.message === 'INVALID_TICKET');
  }
});

test('registration projection excludes check-in actor metadata and any accidental ticket credentials', () => {
  const result = safeRegistration({ id: 'registration-fixture', data: () => ({ studentId: 'student', activityId: 'event', status: 'ACTIVE', checkedInAt: null,
    checkedInBy: 'private-operator', checkInMethod: 'QR', code: 'private-credential-fixture', qrValue: 'private-credential-fixture' }) });
  assert.equal(result.checkedInAt, null);
  assert.equal('checkedInBy' in result, false);
  assert.equal('checkInMethod' in result, false);
  assert.equal('code' in result, false);
  assert.equal('qrValue' in result, false);
});
