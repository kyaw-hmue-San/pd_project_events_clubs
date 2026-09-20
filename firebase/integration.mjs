import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const error = (status, code) => { throw Object.assign(new Error(code), { status }); };
const sha = text => createHash('sha256').update(text).digest('hex');
const canonical = value => {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
};
const millis = value => value?.toMillis ? value.toMillis() : new Date(value).getTime();
const MAX_RESPONSE = 16384;

export function integrationConfig(env = process.env) {
  const url = key => {
    const value = env[key]?.trim() || '';
    if (!value) return '';
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash || parsed.search) {
      throw new Error(`${key} must be an HTTPS URL without credentials, query, or fragment`);
    }
    return parsed.href;
  };
  const secret = key => {
    const value = env[key] || '';
    if (value && (value.length < 32 || value.trim() !== value)) throw new Error(`${key} must have at least 32 characters and no surrounding whitespace`);
    return value;
  };
  const config = {
    partnerInboundApiKey: secret('PARTNER_INBOUND_API_KEY'),
    inboundSecret: secret('WEBHOOK_INBOUND_SECRET'),
    outboundSecret: secret('WEBHOOK_OUTBOUND_SECRET'),
    partnerApiUrl: url('PARTNER_API_URL'),
    partnerApiHeader: env.PARTNER_API_HEADER_NAME?.trim() || 'Authorization',
    partnerApiToken: env.PARTNER_API_TOKEN || '',
    partnerWebhookUrl: url('PARTNER_WEBHOOK_URL'),
    intervalMs: 30000,
    timeoutMs: 5000
  };
  if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(config.partnerApiHeader)) throw new Error('PARTNER_API_HEADER_NAME is invalid');
  if (config.partnerWebhookUrl && !config.outboundSecret) throw new Error('Set WEBHOOK_OUTBOUND_SECRET with PARTNER_WEBHOOK_URL');
  return config;
}

export function validSecret(actual, expected) {
  if (!expected || typeof actual !== 'string') return false;
  return timingSafeEqual(Buffer.from(sha(actual), 'hex'), Buffer.from(sha(expected), 'hex'));
}

export function validateEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(k => !['id', 'type', 'occurredAt', 'data'].includes(k)) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(body.id || '') ||
      typeof body.type !== 'string' || !/^[a-z][a-z0-9_.-]{0,79}$/.test(body.type) ||
      typeof body.occurredAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(body.occurredAt) ||
      !Number.isFinite(Date.parse(body.occurredAt)) ||
      !body.data || typeof body.data !== 'object' || Array.isArray(body.data) ||
      Buffer.byteLength(JSON.stringify(body)) > 8192) error(400, 'INVALID_WEBHOOK_EVENT');
  return body;
}

// Limits both download time and response size. Redirects are not followed with secrets.
export async function partnerRequest(url, options, config, fetchImpl = fetch) {
  const response = await fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs) });
  let raw = '';
  if (response.body) {
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE) throw new Error('RESPONSE_TOO_LARGE');
        chunks.push(Buffer.from(value));
      }
      raw = Buffer.concat(chunks).toString('utf8');
    } finally { await reader.cancel().catch(() => {}); }
  }
  let body;
  try { body = raw ? JSON.parse(raw) : null; }
  catch { body = { nonJsonResponse: true }; }
  return { ok: response.ok, status: response.status, body };
}

export function createIntegration({ db, config = integrationConfig(), fetchImpl = fetch, now = () => new Date() }) {
  const stateRef = db.doc('integrationState/partner');
  const audit = async data => {
    const ref = db.collection('integrationLogs').doc();
    await ref.create({ ...data, at: now() });
    return ref.id;
  };

  async function receive(secret, input, requestId) {
    if (!config.inboundSecret) error(503, 'WEBHOOK_NOT_CONFIGURED');
    if (!validSecret(secret, config.inboundSecret)) {
      await audit({ kind: 'webhook.received', requestId, secretVerified: false, outcome: 'REJECTED' });
      error(401, 'INVALID_WEBHOOK_SECRET');
    }
    const event = validateEvent(input);
    const payloadHash = sha(canonical(event));
    const ref = db.doc(`webhookInbox/${event.id}`);
    const logRef = db.collection('integrationLogs').doc();
    const outcome = await db.runTransaction(async tx => {
      const existing = await tx.get(ref);
      const outcome = !existing.exists ? 'CREATED' : existing.data().payloadHash === payloadHash ? 'DUPLICATE' : 'CONFLICT';
      if (!existing.exists) tx.create(ref, { event, payloadHash, receivedAt: now(), secretVerified: true, requestId });
      tx.create(logRef, { kind: 'webhook.received', eventId: event.id, requestId, at: now(), secretVerified: true, outcome, payloadHash, payload: event });
      return outcome;
    });
    if (outcome === 'CONFLICT') error(409, 'EVENT_ID_CONFLICT');
    return { status: outcome === 'CREATED' ? 201 : 200, body: { received: true, duplicate: outcome === 'DUPLICATE', eventId: event.id, requestId } };
  }

  // Called inside the activity transaction: publishing and queuing cannot split.
  function queuePublication(tx, activityId, activity, eventId, requestId) {
    if (!config.partnerWebhookUrl) return;
    const event = {
      id: eventId, type: 'activity.published', occurredAt: now().toISOString(),
      data: { activityId, title: activity.title, activityType: activity.activityType,
        dateTime: activity.dateTime.toDate().toISOString(), location: activity.location, status: 'PUBLISHED' }
    };
    tx.create(db.doc(`webhookOutbox/${eventId}`), {
      event, requestId, status: 'PENDING', attempts: 0, dueAt: now(), createdAt: now()
    });
  }

  async function deliver(ref) {
    const leaseId = randomUUID();
    const job = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().status !== 'PENDING' || millis(snap.data().dueAt) > now().getTime()) return null;
      const job = snap.data();
      tx.update(ref, { leaseId, dueAt: new Date(now().getTime() + 60000), attempts: job.attempts + 1 });
      return { ...job, attempts: job.attempts + 1 };
    });
    if (!job) return;
    let result;
    try {
      result = await partnerRequest(config.partnerWebhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': config.outboundSecret,
          'X-Event-ID': job.event.id, 'X-Request-ID': job.requestId }, body: JSON.stringify(job.event)
      }, config, fetchImpl);
    } catch { result = { ok: false, status: null, body: null }; }
    const logRef = db.collection('integrationLogs').doc();
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().leaseId !== leaseId) return;
      const at = now();
      tx.update(ref, { status: result.ok ? 'DELIVERED' : 'PENDING', lastAttemptAt: at,
        dueAt: result.ok ? new Date('9999-01-01T00:00:00Z') : new Date(at.getTime() + Math.min(300000, 30000 * 2 ** Math.min(job.attempts - 1, 4))),
        lastHttpStatus: result.status, ...(result.ok ? { deliveredAt: at } : {}) });
      tx.create(logRef, { kind: 'webhook.sent', at, eventId: job.event.id, requestId: job.requestId,
        target: config.partnerWebhookUrl, attempt: job.attempts, payload: job.event,
        httpStatus: result.status, response: result.body, outcome: result.ok ? 'DELIVERED' : 'RETRY_SCHEDULED',
        recovered: result.ok && job.attempts > 1 });
    });
  }

  let consumerFlight;
  async function consumePartner(source, requestId = randomUUID()) {
    if (!config.partnerApiUrl) return { status: 'unconfigured', data: null, reason: 'PARTNER_NOT_CONFIGURED', requestId };
    // Coalesce overlapping calls; all callers receive the actual attempt's correlation ID.
    if (consumerFlight) return consumerFlight;
    consumerFlight = (async () => {
      let result;
      try {
        result = await partnerRequest(config.partnerApiUrl, { headers: { Accept: 'application/json',
          ...(config.partnerApiToken ? { [config.partnerApiHeader]: config.partnerApiToken } : {}) } }, config, fetchImpl);
        if (!result.ok || !result.body || typeof result.body !== 'object' || result.body.nonJsonResponse) throw new Error('PARTNER_UNAVAILABLE');
      } catch { result = { ok: false, status: result?.status ?? null, body: null }; }
      const logRef = db.collection('integrationLogs').doc();
      return db.runTransaction(async tx => {
        const snap = await tx.get(stateRef);
        const previous = snap.exists ? snap.data() : {};
        const at = now();
        const recovered = result.ok && previous.status === 'degraded';
        const state = { status: result.ok ? 'ok' : 'degraded', checkedAt: at,
          nextCheckAt: new Date(at.getTime() + 30000), target: config.partnerApiUrl,
          data: result.ok ? result.body : previous.target === config.partnerApiUrl ? previous.data ?? null : null,
          lastSuccessAt: result.ok ? at : previous.target === config.partnerApiUrl ? previous.lastSuccessAt ?? null : null };
        tx.set(stateRef, state);
        tx.create(logRef, { kind: 'partner.fetch', at, requestId, source, target: config.partnerApiUrl,
          httpStatus: result.status, response: result.body, outcome: state.status, recovered });
        return { status: state.status, data: state.data, stale: !result.ok,
          lastSuccessAt: state.lastSuccessAt ? new Date(millis(state.lastSuccessAt)).toISOString() : null,
          ...(result.ok ? {} : { reason: 'PARTNER_UNAVAILABLE', retryAfterSeconds: 30 }), requestId };
      });
    })();
    try { return await consumerFlight; } finally { consumerFlight = null; }
  }

  let ticking = false;
  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      if (config.partnerWebhookUrl) {
        const due = await db.collection('webhookOutbox').where('dueAt', '<=', now()).orderBy('dueAt').limit(10).get();
        for (const ref of due.docs.map(snap => snap.ref)) await deliver(ref);
      }
      if (config.partnerApiUrl) {
        const snap = await stateRef.get();
        if (snap.exists && snap.data().status === 'degraded' && millis(snap.data().nextCheckAt) <= now().getTime()) {
          await consumePartner('automatic-retry');
        }
      }
    } finally { ticking = false; }
  }

  function start() {
    const run = () => tick().catch(() => console.error('Integration worker failed; pending work retained for retry'));
    const timer = setInterval(run, config.intervalMs);
    timer.unref();
    void run();
    return () => clearInterval(timer);
  }
  function authenticatePartner(secret) {
    if (!config.partnerInboundApiKey) error(503, 'PARTNER_API_NOT_CONFIGURED');
    if (!validSecret(secret, config.partnerInboundApiKey)) error(401, 'INVALID_PARTNER_KEY');
  }
  return { authenticatePartner, receive, queuePublication, consumePartner, tick, start };
}

export function requestEvidence(db) {
  return (req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    const startedAt = new Date();
    res.on('finish', () => {
      if (req.path === '/health' || req.method === 'OPTIONS') return;
      const record = { requestId: req.requestId, method: req.method, path: req.path,
        at: startedAt, status: res.statusCode, durationMs: Date.now() - startedAt.getTime(), role: req.user?.role || null };
      console.log(JSON.stringify({ kind: 'api.request', ...record }));
      // Never record authorization headers, webhook secrets, or login tokens.
      void db.doc(`requestLogs/${req.requestId}`).create(record).catch(() => console.error('Request evidence persistence failed', req.requestId));
    });
    next();
  };
}
