import { randomBytes } from 'node:crypto';
import { fail, hash, docId, stamp } from '../../shared/domain.js';
import { safeActivity, safeRegistration } from '../../shared/projections.js';

export function normalizeTicketCode(value) {
  if (typeof value !== 'string' || value.length > 128) fail(400, 'INVALID_TICKET');
  const code = value.trim().toUpperCase().replace(/^CP1:/, '').replace(/[\s-]/gu, '');
  if (!/^[A-F0-9]{32}$/.test(code)) fail(400, 'INVALID_TICKET');
  return code;
}

function bodyOnly(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'INVALID_BODY');
  if (Object.keys(body).some(key => !fields.includes(key))) fail(400, 'UNKNOWN_FIELD');
}

export function mountTicketRoutes(app, { db }) {
  // POST is intentional: first viewing a pre-existing registration may issue its
  // one opaque ticket. Concurrent/repeated requests return that same credential.
  app.post('/api/registrations/:id/ticket', async (req, res) => {
    if (!req.user.capabilities.student) fail(403, 'FORBIDDEN');
    if (req.body !== undefined) { bodyOnly(req.body, []); }
    const registrationRef = db.doc(`registrations/${docId(req.params.id)}`);
    const ticketRef = db.doc(`registrationTickets/${registrationRef.id}`);
    const candidate = randomBytes(16).toString('hex').toUpperCase();
    const result = await db.runTransaction(async tx => {
      const registration = await tx.get(registrationRef);
      if (!registration.exists || registration.data().studentId !== req.user.uid) fail(404, 'NOT_FOUND');
      if (registration.data().status !== 'ACTIVE') fail(409, 'TICKET_CANCELLED');
      const [activity, ticket, holder] = await Promise.all([
        tx.get(db.doc(`activities/${registration.data().activityId}`)), tx.get(ticketRef), tx.get(db.doc(`users/${req.user.uid}`)),
      ]);
      if (!activity.exists || !['PUBLISHED', 'CLOSED'].includes(activity.data().status)) fail(409, 'TICKET_UNAVAILABLE');
      if (!holder.exists || holder.data().accessStatus === 'DISABLED') fail(403, 'ACCOUNT_DISABLED');
      const code = ticket.exists ? ticket.data().code : candidate;
      if (ticket.exists) {
        const lookup = await tx.get(db.doc(`ticketCodes/${hash(code)}`));
        if (!lookup.exists || lookup.data().registrationId !== registration.id || lookup.data().activityId !== activity.id) fail(409, 'INTEGRITY_ERROR');
      } else {
        tx.create(ticketRef, { code, createdAt: stamp() });
        tx.create(db.doc(`ticketCodes/${hash(code)}`), { registrationId: registration.id, activityId: activity.id });
      }
      return { created: !ticket.exists, registration: safeRegistration(registration), activity: safeActivity(activity),
        holderName: typeof holder.data().name === 'string' ? holder.data().name.slice(0, 200) : null, code };
    });
    const { created, code, ...ticket } = result;
    res.set('Cache-Control', 'no-store');
    res.status(created ? 201 : 200).json({ ...ticket, code: code.match(/.{1,8}/g).join('-'), qrValue: `CP1:${code}` });
  });

  async function inspect(tx, req, activityId, input) {
    const activityRef = db.doc(`activities/${activityId}`);
    const activity = await tx.get(activityRef);
    if (!activity.exists) fail(404, 'NOT_FOUND');
    if (activity.data().organizerId !== req.user.uid) fail(403, 'FORBIDDEN');
    if (!['PUBLISHED', 'CLOSED'].includes(activity.data().status)) fail(409, 'CHECK_IN_UNAVAILABLE');
    let registrationId;
    if (input.code !== undefined) {
      const lookup = await tx.get(db.doc(`ticketCodes/${hash(normalizeTicketCode(input.code))}`));
      if (!lookup.exists) fail(404, 'INVALID_TICKET');
      if (lookup.data().activityId !== activityId) fail(409, 'TICKET_WRONG_EVENT');
      registrationId = docId(lookup.data().registrationId);
    } else registrationId = docId(input.registrationId);
    const registrationRef = db.doc(`registrations/${registrationId}`);
    const registration = await tx.get(registrationRef);
    if (!registration.exists) fail(404, 'INVALID_TICKET');
    if (registration.data().activityId !== activityId) fail(409, 'TICKET_WRONG_EVENT');
    if (registration.data().status !== 'ACTIVE') fail(409, 'TICKET_CANCELLED');
    const lock = await tx.get(db.doc(`activeRegistrations/${hash(JSON.stringify([registration.data().studentId, activityId]))}`));
    if (!lock.exists || lock.data().registrationId !== registration.id) fail(409, 'TICKET_UNAVAILABLE');
    const holder = await tx.get(db.doc(`users/${registration.data().studentId}`));
    if (!holder.exists || holder.data().accessStatus === 'DISABLED') fail(409, 'TICKET_UNAVAILABLE');
    const participant = { displayName: typeof holder.data().name === 'string' ? holder.data().name.slice(0, 200) : null,
      email: typeof holder.data().email === 'string' ? holder.data().email.slice(0, 254) : null };
    return { activity, activityRef, registration, registrationRef, participant };
  }

  app.post('/api/activities/:id/tickets/verify', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    bodyOnly(req.body, ['code']);
    if (req.body.code === undefined) fail(400, 'INVALID_TICKET');
    const activityId = docId(req.params.id);
    const result = await db.runTransaction(async tx => {
      const { activity, registration, participant } = await inspect(tx, req, activityId, req.body);
      return { registration: safeRegistration(registration), activity: safeActivity(activity), participant, alreadyCheckedIn: Boolean(registration.data().checkedInAt) };
    });
    res.set('Cache-Control', 'no-store'); res.json(result);
  });

  app.post('/api/activities/:id/check-ins', async (req, res) => {
    if (req.user.role !== 'ORGANIZER') fail(403, 'FORBIDDEN');
    bodyOnly(req.body, ['code', 'registrationId']);
    if ((req.body.code === undefined) === (req.body.registrationId === undefined)) fail(400, 'INVALID_CHECK_IN');
    const activityId = docId(req.params.id);
    const result = await db.runTransaction(async tx => {
      const inspected = await inspect(tx, req, activityId, req.body);
      const { activity, activityRef, registration, registrationRef, participant } = inspected;
      const alreadyCheckedIn = Boolean(registration.data().checkedInAt);
      if (!alreadyCheckedIn) {
        const count = activity.data().checkedInCount ?? 0;
        if (!Number.isInteger(count) || count < 0) fail(409, 'INTEGRITY_ERROR');
        tx.update(registrationRef, { checkedInAt: stamp(), checkedInBy: req.user.uid, checkInMethod: req.body.code !== undefined ? 'QR' : 'MANUAL' });
        tx.update(activityRef, { checkedInCount: count + 1, updatedAt: stamp() });
      }
      return { registrationRef, activityRef, participant, alreadyCheckedIn };
    });
    // Read back resolved server timestamps, never an optimistic client check-in.
    const [registration, activity] = await Promise.all([result.registrationRef.get(), result.activityRef.get()]);
    res.set('Cache-Control', 'no-store');
    res.json({ registration: safeRegistration(registration), activity: safeActivity(activity), participant: result.participant, alreadyCheckedIn: result.alreadyCheckedIn });
  });
}
