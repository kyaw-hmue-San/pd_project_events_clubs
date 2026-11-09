import { fail } from '../../shared/domain.js';
import { plainText } from '../../shared/ai-json.js';
import { draftAssistantConfig } from '../draft-assistant/service.js';
import { createLibraryRelevance } from './relevance.js';

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const libraryAiConfig = (env = process.env) => ({ ...draftAssistantConfig(env), timeoutMs: 20000 });
export function libraryConfig(env = process.env) {
  const value = env.LIBRARY_API_BASE_URL?.trim(), key = env.LIBRARY_API_KEY?.trim() || '';
  let baseUrl = '';
  if (value) {
    let url;
    try { url = new URL(value); } catch { throw new Error('LIBRARY_API_BASE_URL must be an HTTPS origin'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('LIBRARY_API_BASE_URL must be an HTTPS origin');
    baseUrl = url.origin;
  }
  const emulated = env.FIREBASE_PROJECT_ID?.startsWith('demo-') || env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST;
  return { enabled: Boolean(baseUrl && key && !/[\r\n]/.test(key) && !emulated), baseUrl, key, timeoutMs: 10000 };
}

export function libraryQuery(input) {
  if (!input || Object.keys(input).some(key => !['q', 'category', 'page', 'limit'].includes(key)) || Object.values(input).some(value => typeof value !== 'string')) fail(400, 'INVALID_LIBRARY_QUERY');
  const params = new URLSearchParams();
  for (const [key, max] of [['q', 100], ['category', 100]]) {
    const value = input[key]?.trim();
    if (value && (!plainText(value, 1, max) || /[\r\n\t]/u.test(value))) fail(400, 'INVALID_LIBRARY_QUERY');
    if (value) params.set(key, value);
  }
  for (const [key, fallback, max] of [['page', 1, 10000], ['limit', 4, 12]]) {
    const value = input[key];
    if (value !== undefined && (!/^[1-9]\d*$/.test(value) || !integer(Number(value), 1, max))) fail(400, 'INVALID_LIBRARY_QUERY');
    params.set(key, value || String(fallback));
  }
  return params;
}

export function checkedCatalog(body, params, baseUrl) {
  const invalid = () => fail(502, 'LIBRARY_INVALID_RESPONSE');
  const page = Number(params.get('page')), limit = Number(params.get('limit')), p = body?.pagination;
  if (!Array.isArray(body?.resources) || body.resources.length > limit || p?.page !== page || p.limit !== limit || !integer(p.total, 0, Number.MAX_SAFE_INTEGER) || p.total_pages !== Math.ceil(p.total / limit) || body.resources.length > p.total || (page > p.total_pages && body.resources.length)) invalid();
  const ids = new Set();
  const resources = body.resources.map(item => {
    if (!item || !uuid.test(item.id || '') || ids.has(item.id) || !plainText(item.title, 1, 500) || !plainText(item.author, 1, 500) || !plainText(item.category, 1, 200) || !plainText(item.description, 0, 10000) || !integer(item.total_copies, 0, 1000000) || !integer(item.available_copies, 0, item.total_copies)) invalid();
    let url;
    try { url = new URL(item.details_url); } catch { invalid(); }
    if (url.origin !== baseUrl || url.pathname !== `/books/${item.id}` || url.username || url.password || url.search || url.hash) invalid();
    ids.add(item.id);
    return { id: item.id, title: item.title, author: item.author, category: item.category, description: item.description,
      available_copies: item.available_copies, total_copies: item.total_copies, details_url: url.href };
  });
  return { resources, pagination: { page, limit, total: p.total, total_pages: p.total_pages, has_next: page < p.total_pages } };
}

export function createLibrary({ config = libraryConfig(), aiConfig = libraryAiConfig(), fetchImpl = fetch, aiFetchImpl = fetch, now = Date.now } = {}) {
  const assessRelevance = createLibraryRelevance({ config: aiConfig, fetchImpl: aiFetchImpl, now });
  const requireConfigured = () => { if (!config.enabled) fail(503, 'LIBRARY_NOT_CONFIGURED'); };
  const search = async input => {
    const params = libraryQuery(input);
    requireConfigured();
    try {
      const response = await fetchImpl(`${config.baseUrl}/api/integrations/catalog?${params}`, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs), headers: { Accept: 'application/json', Authorization: `Bearer ${config.key}` } });
      if (!response.ok) { await response.body?.cancel(); fail(503, 'LIBRARY_UNAVAILABLE'); }
      if (!response.body) fail(502, 'LIBRARY_INVALID_RESPONSE');
      const reader = response.body.getReader(), chunks = []; let size = 0;
      try {
        while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 262144) fail(502, 'LIBRARY_INVALID_RESPONSE'); chunks.push(Buffer.from(value)); }
      } finally { await reader.cancel().catch(() => {}); }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(502, 'LIBRARY_INVALID_RESPONSE'); }
      return { ...checkedCatalog(body, params, config.baseUrl), search: { query: params.get('q') || '', source: 'MANUAL' } };
    } catch (error) {
      if (['LIBRARY_INVALID_RESPONSE', 'LIBRARY_UNAVAILABLE'].includes(error.message)) throw error;
      fail(503, 'LIBRARY_UNAVAILABLE');
    }
  };
  const assess = (activity, options) => config.enabled ? assessRelevance(activity, options) : Promise.resolve({ eligible: false, status: 'UNAVAILABLE' });
  return { search, assess, async suggest(activity) {
    requireConfigured();
    const assessment = await assess(activity);
    if (!assessment.eligible) fail(assessment.status === 'NOT_RELEVANT' ? 409 : 503, assessment.status === 'NOT_RELEVANT' ? 'LIBRARY_NOT_RELEVANT' : 'LIBRARY_RELEVANCE_UNAVAILABLE');
    const result = await search({ q: assessment.query });
    return { ...result, search: { query: assessment.query, source: 'AI' } };
  } };
}
