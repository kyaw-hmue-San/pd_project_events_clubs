import assert from 'node:assert/strict';

export function libraryCatalog(params, baseUrl = 'https://library.test') {
  const all = Array.from({ length: 6 }, (_, index) => ({ id: `80000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, title: `Python resource ${index + 1}`, author: 'Synthetic Library Author', category: 'Programming', description: 'Python programming book for isolated Library integration checks.', available_copies: index % 2 ? 0 : 2, total_copies: 2 }));
  const q = (params.get('q') || '').toLowerCase(), category = (params.get('category') || '').toLowerCase();
  const resources = all.filter(book => (!q || `${book.title} ${book.description} ${book.author}`.toLowerCase().includes(q)) && (!category || book.category.toLowerCase() === category));
  const page = Number(params.get('page')), limit = Number(params.get('limit'));
  return { resources: resources.slice((page - 1) * limit, page * limit).map(book => ({ ...book, details_url: `${baseUrl}/books/${book.id}` })), pagination: { page, limit, total: resources.length, total_pages: Math.ceil(resources.length / limit) } };
}
export async function libraryFetch(url, options) {
  const target = new URL(url);
  assert.equal(target.origin, 'https://library.test'); assert.equal(target.pathname, '/api/integrations/catalog');
  assert.equal(options.method, 'GET'); assert.equal(options.headers.Authorization, 'Bearer isolated-library-key');
  if (target.searchParams.get('q') === 'unavailable') return new Response('private provider details', { status: 503 });
  if (target.searchParams.get('q') === 'malformed') return new Response('{broken');
  return new Response(JSON.stringify(libraryCatalog(target.searchParams)));
}
export async function libraryAiFetch(url, options) {
  assert.equal(url, 'https://api.aimlapi.com/v1/chat/completions');
  const input = JSON.parse(JSON.parse(options.body).messages[1].content);
  assert.deepEqual(Object.keys(input).sort(), ['description', 'title']);
  if (input.title.toLowerCase().includes('fallback')) throw new DOMException('Synthetic AI timeout', 'TimeoutError');
  const relevant = /Python/i.test(input.title) && /workshop|learning|library|rate-limit/i.test(input.title);
  return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ relevant, query: relevant ? 'Python' : '', evidence: relevant ? input.title : '' }) } }] }));
}
