import { createHmac, timingSafeEqual } from 'node:crypto';
import { fail } from '../../shared/domain.js';

export const maintenanceSequences = Object.freeze({ OPEN: 1, ASSIGNED: 2, IN_PROGRESS: 3, RESOLVED: 4, CLOSED: 5 });
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function verifyMaintenanceWebhook(event, secret, delivery = {}, required = false) {
  if (event.type !== 'maintenance.status_changed') return null;
  const versioned = event.sequence !== undefined || event.version !== undefined || event.data?.sequence !== undefined || event.data?.version !== undefined;
  const signed = delivery.signature !== undefined || delivery.eventId !== undefined || delivery.sequence !== undefined || delivery.version !== undefined;
  if (!required && !versioned && !signed) return null; // Legacy shared-secret contract.
  if (!Buffer.isBuffer(delivery.rawBody) || delivery.rawBody.length > 8192 || !/^sha256=[a-f0-9]{64}$/.test(delivery.signature || '')) fail(401, 'INVALID_WEBHOOK_SIGNATURE');
  const digest = createHmac('sha256', secret).update(delivery.rawBody).digest();
  const received = Buffer.from(delivery.signature.slice(7), 'hex');
  if (received.length !== digest.length || !timingSafeEqual(received, digest)) fail(401, 'INVALID_WEBHOOK_SIGNATURE');
  const sequence = event.sequence;
  if (!uuidV4.test(event.id) || delivery.eventId !== event.id || !Number.isInteger(sequence) || sequence < 1 || sequence > 5 ||
      event.version !== sequence || event.data?.sequence !== sequence || event.data?.version !== sequence ||
      delivery.sequence !== String(sequence) || delivery.version !== String(sequence) || maintenanceSequences[event.data?.toStatus] !== sequence ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.occurredAt) || new Date(event.occurredAt).toISOString() !== event.occurredAt) fail(400, 'INVALID_WEBHOOK_METADATA');
  return { sequence, version: sequence, authentication: 'HMAC_SHA256' };
}
