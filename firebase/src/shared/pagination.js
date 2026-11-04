import { docId, fail } from './domain.js';

export function pageLimit(query, fallback = 20) {
  const raw = query.limit ?? String(fallback);
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 50) fail(400, 'INVALID_LIMIT');
  return Number(raw);
}

export function statusFilter(query, allowed) {
  if (query.status === undefined) return undefined;
  if (typeof query.status !== 'string' || !allowed.includes(query.status)) fail(400, 'INVALID_STATUS');
  return query.status;
}

export async function paginate({ db, collection, query, input, matches, defaultLimit = 20 }) {
  const limit = pageLimit(input, defaultLimit);
  if (input.after !== undefined) {
    const last = await db.collection(collection).doc(docId(input.after)).get();
    if (!last.exists || !matches(last.data())) fail(400, 'INVALID_CURSOR');
    query = query.startAfter(last);
  }
  const result = await query.limit(limit + 1).get();
  const docs = result.docs.slice(0, limit);
  return { docs, nextCursor: result.docs.length > limit ? docs.at(-1).id : null };
}
