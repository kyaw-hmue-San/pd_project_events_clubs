import { createHash } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const fail = (status, code) => { throw Object.assign(new Error(code), { status }); };
export const stamp = () => FieldValue.serverTimestamp();
export const hash = value => createHash('sha256').update(value).digest('hex');
export const docId = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) fail(400, 'INVALID_ID');
  return value;
};
export const serialize = value => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
};
export const row = snap => ({ id: snap.id, ...serialize(snap.data()) });
export const own = (req, activity) => {
  if (req.user.role !== 'ORGANIZER' || activity.organizerId !== req.user.uid) fail(403, 'FORBIDDEN');
};
const fields = ['title', 'description', 'activityType', 'dateTime', 'location', 'status', 'maxParticipants', 'endDateTime', 'registrationDeadline', 'facilitiesNotes'];
function activityTimestamp(value, code) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(400, code);
  const wall = new Date(value.slice(0, 19) + 'Z');
  if (!Number.isFinite(wall.getTime()) || wall.toISOString().slice(0, 19) !== value.slice(0, 19)) fail(400, code);
  return Timestamp.fromDate(new Date(value));
}
export function validateActivityPolicy(activity) {
  if (activity.endDateTime && activity.endDateTime.toMillis() <= activity.dateTime.toMillis()) fail(400, 'END_BEFORE_START');
  if (activity.registrationDeadline && activity.registrationDeadline.toMillis() > activity.dateTime.toMillis()) fail(400, 'DEADLINE_AFTER_START');
  if (activity.maxParticipants != null && activity.maxParticipants < (activity.registrationCount || 0)) fail(409, 'CAPACITY_BELOW_REGISTRATIONS');
}
export function validateActivity(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'INVALID_BODY');
  if (Object.keys(body).some(k => !fields.includes(k))) fail(400, 'UNKNOWN_FIELD');
  const out = {};
  for (const key of ['title', 'description', 'location']) {
    if (!partial || key in body) {
      const max = key === 'description' ? 5000 : 200;
      if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > max) fail(400, 'INVALID_' + key.toUpperCase());
      out[key] = body[key].trim();
    }
  }
  if (!partial || 'activityType' in body) {
    if (!['EVENT', 'CLUB_ACTIVITY'].includes(body.activityType)) fail(400, 'INVALID_ACTIVITY_TYPE');
    out.activityType = body.activityType;
  }
  if (!partial || 'dateTime' in body) {
    out.dateTime = activityTimestamp(body.dateTime, 'INVALID_DATE_TIME');
  }
  for (const [key, code] of [['endDateTime', 'INVALID_END_DATE_TIME'], ['registrationDeadline', 'INVALID_REGISTRATION_DEADLINE']]) {
    if (key in body) out[key] = body[key] === null ? null : activityTimestamp(body[key], code);
  }
  if ('maxParticipants' in body) {
    if (body.maxParticipants !== null && (!Number.isInteger(body.maxParticipants) || body.maxParticipants < 1 || body.maxParticipants > 100000)) fail(400, 'INVALID_CAPACITY');
    out.maxParticipants = body.maxParticipants;
  }
  if ('facilitiesNotes' in body) {
    if (body.facilitiesNotes !== null && (typeof body.facilitiesNotes !== 'string' || body.facilitiesNotes.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body.facilitiesNotes))) fail(400, 'INVALID_FACILITIES_NOTES');
    out.facilitiesNotes = body.facilitiesNotes?.trim() || null;
  }
  if ('status' in body) {
    if (!['DRAFT', 'PUBLISHED', 'CLOSED'].includes(body.status)) fail(400, 'INVALID_STATUS');
    out.status = body.status;
  }
  if (partial && !Object.keys(out).length) fail(400, 'EMPTY_UPDATE');
  if (!partial) validateActivityPolicy(out);
  return out;
}
