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
const fields = ['title', 'description', 'activityType', 'dateTime', 'location', 'status'];
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
    if (typeof body.dateTime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(body.dateTime) || !Number.isFinite(Date.parse(body.dateTime))) fail(400, 'INVALID_DATE_TIME');
    const wall = new Date(body.dateTime.slice(0, 19) + 'Z');
    if (!Number.isFinite(wall.getTime()) || wall.toISOString().slice(0, 19) !== body.dateTime.slice(0, 19)) fail(400, 'INVALID_DATE_TIME');
    out.dateTime = Timestamp.fromDate(new Date(body.dateTime));
  }
  if ('status' in body) {
    if (!['DRAFT', 'PUBLISHED', 'CLOSED'].includes(body.status)) fail(400, 'INVALID_STATUS');
    out.status = body.status;
  }
  if (partial && !Object.keys(out).length) fail(400, 'EMPTY_UPDATE');
  return out;
}
