import { fail } from '../../shared/domain.js';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
function dateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function internshipsConfig(env = process.env) {
  const value = env.TEAM17_API_BASE_URL?.trim();
  const emulated = env.FIREBASE_PROJECT_ID?.startsWith('demo-') || env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!value) return { enabled: false, baseUrl: '', timeoutMs: 10000 };
  let url;
  try { url = new URL(value); } catch { throw new Error('TEAM17_API_BASE_URL must be an HTTPS origin'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('TEAM17_API_BASE_URL must be an HTTPS origin without a path, credentials, query or fragment');
  return { enabled: !emulated, baseUrl: url.origin, timeoutMs: 10000 };
}

export function internshipQuery(input) {
  const allowed = new Set(['page', 'limit', 'q', 'location', 'category', 'work_mode']);
  if (!input || Object.keys(input).some(key => !allowed.has(key)) || Object.values(input).some(value => typeof value !== 'string')) fail(400, 'INVALID_INTERNSHIP_QUERY');
  const number = (key, fallback, max) => {
    const value = input[key];
    if (value === undefined) return fallback;
    if (!/^[1-9]\d*$/.test(value) || !integer(Number(value), 1, max)) fail(400, 'INVALID_INTERNSHIP_QUERY');
    return Number(value);
  };
  const params = new URLSearchParams({ page: String(number('page', 1, 10000)), limit: String(number('limit', 6, 50)), status: 'open' });
  for (const [key, max] of [['q', 100], ['location', 100], ['category', 60]]) {
    const value = input[key]?.trim();
    if (value && (value.length > max || /[\u0000-\u001f\u007f]/u.test(value))) fail(400, 'INVALID_INTERNSHIP_QUERY');
    if (value) params.set(key, value);
  }
  if (input.work_mode) {
    if (!['remote', 'hybrid', 'on-site'].includes(input.work_mode)) fail(400, 'INVALID_INTERNSHIP_QUERY');
    params.set('work_mode', input.work_mode);
  }
  return params;
}

export function checkedInternships(body, params, baseUrl) {
  const invalid = () => fail(502, 'INTERNSHIPS_INVALID_RESPONSE');
  const page = Number(params.get('page')), limit = Number(params.get('limit'));
  const pagination = body?.pagination, meta = body?.meta;
  if (body?.success !== true || !Array.isArray(body.data) || body.data.length > limit ||
    pagination?.page !== page || pagination.limit !== limit || !integer(pagination.total, 0, Number.MAX_SAFE_INTEGER) ||
    pagination.total_pages !== Math.ceil(pagination.total / limit) || pagination.has_next !== (page < pagination.total_pages) ||
    meta?.api_version !== '1.0' || !uuid.test(meta.request_id || '') || !timestamp(meta.timestamp) || !['local-postgresql', 'postgresql'].includes(meta.data_source)) invalid();
  if (body.data.length > pagination.total || (page > pagination.total_pages && body.data.length)) invalid();
  const ids = new Set();
  const data = body.data.map(item => {
    if (!item || !uuid.test(item.id || '') || ids.has(item.id) || !text(item.title, 300) || !text(item.company, 300) ||
      !text(item.description, 20000) || !text(item.location, 300) || !text(item.category, 100) ||
      !['remote', 'hybrid', 'on-site'].includes(item.work_mode) || !Array.isArray(item.skills) || item.skills.length > 50 || item.skills.some(skill => !text(skill, 200)) ||
      !(item.allowance_thb === null || integer(item.allowance_thb, 0, Number.MAX_SAFE_INTEGER)) || !integer(item.duration_weeks, 1, 104) ||
      !dateOnly(item.application_deadline) || item.status !== 'open' || typeof item.is_demo !== 'boolean' || !timestamp(item.published_at) || !timestamp(item.updated_at)) invalid();
    let link;
    try { link = new URL(item.details_url); } catch { invalid(); }
    if (link.origin !== baseUrl || link.pathname !== `/opportunities/${item.id}` || link.username || link.password || link.search || link.hash) invalid();
    ids.add(item.id);
    return { ...Object.fromEntries(['id', 'title', 'company', 'description', 'location', 'category', 'work_mode', 'skills', 'allowance_thb', 'duration_weeks', 'application_deadline', 'status', 'is_demo', 'published_at', 'updated_at', 'details_url'].map(key => [key, item[key]])), details_url: link.href };
  });
  return { data, pagination: { page, limit, total: pagination.total, total_pages: pagination.total_pages, has_next: pagination.has_next },
    meta: { api_version: meta.api_version, request_id: meta.request_id, timestamp: meta.timestamp, data_source: meta.data_source } };
}

export function createInternships({ config = internshipsConfig(), fetchImpl = fetch } = {}) {
  return { async list(input) {
    const params = internshipQuery(input);
    if (!config.enabled) fail(503, 'INTERNSHIPS_NOT_CONFIGURED');
    try {
      // No Google tokens, cookies, partner keys or caller headers are forwarded.
      const response = await fetchImpl(`${config.baseUrl}/api/placements?${params}`, { method: 'GET', headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs) });
      if (!response.ok) { await response.body?.cancel(); fail(503, 'INTERNSHIPS_UNAVAILABLE'); }
      if (!response.body) fail(502, 'INTERNSHIPS_INVALID_RESPONSE');
      const reader = response.body.getReader(), chunks = []; let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.byteLength;
          if (size > 262144) fail(502, 'INTERNSHIPS_INVALID_RESPONSE');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel().catch(() => {}); }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(502, 'INTERNSHIPS_INVALID_RESPONSE'); }
      return checkedInternships(body, params, config.baseUrl);
    } catch (error) {
      if (['INTERNSHIPS_INVALID_RESPONSE', 'INTERNSHIPS_UNAVAILABLE'].includes(error.message)) throw error;
      fail(503, 'INTERNSHIPS_UNAVAILABLE');
    }
  } };
}
