import test from 'node:test';
import assert from 'node:assert/strict';
import { validateActivity, validateActivityPolicy } from '../src/shared/domain.js';
import { maintenanceEvent, latestMaintenance } from '../src/features/integrations/maintenance.js';

test('optional activity policies retain legacy defaults and validate calendar, order and capacity boundaries', () => {
  const input = { title: 'Policy test', description: 'Test details', activityType: 'EVENT', location: 'Test Hall', dateTime: '2027-01-15T10:00:00Z' };
  assert.equal(validateActivity(input).maxParticipants, undefined);
  const complete = validateActivity({ ...input, maxParticipants: 20, endDateTime: '2027-01-16T01:00:00+07:00', registrationDeadline: input.dateTime, facilitiesNotes: '  Projector\nMicrophone  ' });
  assert.equal(complete.facilitiesNotes, 'Projector\nMicrophone');
  assert.throws(() => validateActivity({ ...input, endDateTime: '2027-02-30T10:00:00Z' }), /INVALID_END_DATE_TIME/);
  assert.throws(() => validateActivity({ ...input, endDateTime: input.dateTime }), /END_BEFORE_START/);
  assert.throws(() => validateActivity({ ...input, registrationDeadline: '2027-01-15T10:01:00Z' }), /DEADLINE_AFTER_START/);
  assert.throws(() => validateActivityPolicy({ ...complete, registrationCount: 21 }), /CAPACITY_BELOW_REGISTRATIONS/);
});

test('maintenance projection only selects bounded maintenance work-order statuses', () => {
  const event = { id: 'event-one', type: 'maintenance.status_changed', occurredAt: '2026-09-21T14:55:52.6173967Z', data: { workOrderId: 'order-one', toStatus: 'ASSIGNED', activityId: 'untrusted-claim' } };
  assert.deepEqual(maintenanceEvent(event), { workOrderId: 'order-one', status: 'ASSIGNED', occurredAt: '2026-09-21T14:55:52.617Z', lastEventId: 'event-one' });
  assert.equal(maintenanceEvent({ ...event, type: 'other.event' }), null);
  assert.equal(maintenanceEvent({ ...event, data: { workOrderId: '../order', toStatus: 'OPEN' } }), null);
  assert.equal(maintenanceEvent({ ...event, data: { workOrderId: 'order-one', toStatus: '<script>' } }), null);
});

test('older maintenance updates cannot regress status and equal-time conflicts require confirmation', () => {
  const first = latestMaintenance(null, { status: 'ASSIGNED', occurredAt: '2026-11-06T01:00:00Z' });
  assert.equal(first.orderingConflict, false);
  assert.equal(latestMaintenance(first, { status: 'OPEN', occurredAt: '2026-11-05T01:00:00Z' }), null);
  const conflict = latestMaintenance(first, { status: 'OPEN', occurredAt: first.occurredAt });
  assert.equal(conflict.orderingConflict, true);
  assert.equal(latestMaintenance(conflict, { status: 'IN_PROGRESS', occurredAt: '2026-11-06T02:00:00Z' }).orderingConflict, false);
});
