// Synthetic partner data for isolated tests only. Never imported by application code.
import { randomUUID } from 'node:crypto';

export function internshipFeed(params, baseUrl = 'https://team17.test') {
  const rows = Array.from({ length: 8 }, (_, index) => {
    const id = `70000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    return { id, title: `Demo ${index % 2 ? 'Design' : 'Software'} Internship ${index + 1}`, company: 'Fictional Campus Studio',
      description: 'Synthetic internship opportunity for isolated integration tests.', location: index % 2 ? 'Bangkok' : 'Chiang Rai',
      category: index % 2 ? 'Design' : 'Engineering', work_mode: index % 2 ? 'hybrid' : 'remote', skills: index % 2 ? ['Figma'] : ['React', 'TypeScript'],
      allowance_thb: index % 2 ? null : 0, duration_weeks: 12, application_deadline: '2027-02-05', status: 'open', is_demo: true,
      published_at: '2026-11-07T00:00:00.000Z', updated_at: '2026-11-07T00:00:00.000Z', details_url: `${baseUrl}/opportunities/${id}` };
  });
  const q = (params.get('q') || '').toLowerCase(), location = (params.get('location') || '').toLowerCase(), category = (params.get('category') || '').toLowerCase();
  const filtered = rows.filter(item => [item.title, item.company, item.description, ...item.skills].join(' ').toLowerCase().includes(q) && item.location.toLowerCase().includes(location) && (!category || item.category.toLowerCase() === category) && (!params.get('work_mode') || item.work_mode === params.get('work_mode')));
  const page = Number(params.get('page') || 1), limit = Number(params.get('limit') || 6), total_pages = Math.ceil(filtered.length / limit);
  return { success: true, data: filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: filtered.length, total_pages, has_next: page < total_pages },
    meta: { api_version: '1.0', request_id: randomUUID(), timestamp: new Date().toISOString(), data_source: 'postgresql' } };
}

export async function internshipFetch(url, options) {
  const target = new URL(url);
  if (target.origin !== 'https://team17.test' || target.pathname !== '/api/placements' || options.method !== 'GET') throw new Error('Unexpected test provider request');
  if (target.searchParams.get('q') === 'unavailable') return new Response('private partner error must not escape', { status: 503 });
  if (target.searchParams.get('q') === 'timeout') throw new DOMException('synthetic timeout', 'TimeoutError');
  if (target.searchParams.get('q') === 'malformed') return new Response('not json');
  return new Response(JSON.stringify(internshipFeed(target.searchParams)), { headers: { 'Content-Type': 'application/json' } });
}
