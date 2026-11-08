import { useEffect, useRef, useState } from 'react'
import type { LibraryResources } from '../../models'
import { api, ApiError } from '../../lib/api'
import { useRemote } from '../../hooks/useRemote'
import { Button, EmptyState, ErrorNotice, Field, Icon, Input, OperationNotice } from '../../components/ui'

type Action = { kind: 'AI' } | { kind: 'MANUAL'; query: string; page: string }
export function LearningResources({ id }: { id: string }) {
  const relevance = useRemote(`library-relevance/${id}`, () => api.libraryRelevance(id))
  const [query, setQuery] = useState(''), [result, setResult] = useState<LibraryResources | null>(null)
  const [busy, setBusy] = useState<Action['kind'] | null>(null), [error, setError] = useState('')
  const requestId = useRef(0), lastAction = useRef<Action>({ kind: 'AI' })
  useEffect(() => () => { requestId.current++ }, [])
  const run = async (action: Action) => {
    if (action.kind === 'AI' && !relevance.value?.eligible) return
    const current = ++requestId.current
    lastAction.current = action
    setBusy(action.kind); setError(''); setResult(null)
    try {
      const response = action.kind === 'AI' ? await api.suggestLibraryResources(id) : await api.libraryResources(id, action.query, action.page)
      if (current === requestId.current) { setResult(response); setQuery(response.search.query) }
    } catch (cause) {
      if (current === requestId.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load Library resources. Please try again.')
        if (cause instanceof ApiError && ['LIBRARY_NOT_RELEVANT', 'LIBRARY_RELEVANCE_UNAVAILABLE'].includes(cause.code)) relevance.refresh()
      }
    }
    finally { if (current === requestId.current) setBusy(null) }
  }
  return <section aria-labelledby="learning-resources-heading" className="mt-8 border-t border-slate-100 pt-7">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon name="spark" className="size-5" /></span><div><h2 id="learning-resources-heading" className="text-lg font-bold text-slate-950">Learning resources</h2><p className="mt-1 text-sm leading-6 text-slate-600">Find books to explore this activity’s topic before or after you attend.</p></div></div>
    {relevance.loading && !relevance.value && <p role="status" className="mt-4 text-xs text-slate-500">Checking for related reading…</p>}
    {relevance.value?.eligible && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><Button icon="spark" busy={busy === 'AI'} disabled={Boolean(busy)} busyFeedback="notice" onClick={() => void run({ kind: 'AI' })}>Find learning resources</Button><p className="mt-2 text-xs leading-5 text-slate-500">Find Library books related to this activity with AI, or search by keyword below.</p></div>}
    <form className="mt-5" onSubmit={event => { event.preventDefault(); void run({ kind: 'MANUAL', query: query.trim(), page: '1' }) }}>
      <Field label="Search Library manually"><Input type="search" maxLength={100} placeholder="Try Python, design or entrepreneurship" value={query} disabled={Boolean(busy)} onChange={event => setQuery(event.target.value)} /></Field>
      <Button variant="secondary" size="sm" type="submit" icon="search" className="mt-3" disabled={Boolean(busy)} busy={busy === 'MANUAL'} busyFeedback="notice">Search Library</Button>
    </form>
    {busy && <OperationNotice title={busy === 'AI' ? 'Finding learning resources' : 'Searching the Library catalog'} description={busy === 'AI' ? 'Choosing a subject keyword, then checking actual books and availability.' : 'Checking the latest catalog results.'} />}
    {error && <ErrorNotice message={error} onRetry={lastAction.current.kind === 'AI' && !relevance.value?.eligible ? undefined : () => void run(lastAction.current)} />}
    {result && <div className="mt-5" aria-live="polite">
      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{result.search.source === 'AI' ? 'AI-assisted search' : result.search.source === 'ACTIVITY_KEYWORD' ? 'AI is unavailable. Searched using an activity keyword' : 'Library search'}{result.search.query ? <>: <strong className="break-words text-slate-800">{result.search.query}</strong></> : ': all resources'}. {result.search.source === 'ACTIVITY_KEYWORD' && 'You can edit the search above. '}{result.pagination.total} {result.pagination.total === 1 ? 'resource' : 'resources'} found.</p>
      {result.resources.length ? <div className="motion-list mt-3 space-y-3">{result.resources.map(book => <article key={book.id} className="min-w-0 rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="max-w-full break-words text-xs font-semibold text-blue-700">{book.category}</span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{book.available_copies > 0 ? `${book.available_copies} available` : 'No copies available'}</span></div>
        <h3 className="mt-2 break-words font-semibold text-slate-950">{book.title}</h3><p className="mt-1 break-words text-xs text-slate-500">{book.author}</p><p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{book.description}</p>
        <a href={book.details_url} target="_blank" rel="noopener noreferrer" className="motion-press mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 hover:text-blue-900">View in Library<span className="sr-only"> — {book.title}, opens a new tab</span><Icon name="arrow-right" className="size-4" /></a>
      </article>)}</div> : <div className="mt-3"><EmptyState icon="search" title="No Library resources found" description="Try a broader subject or another keyword above. AI suggestions do not guarantee a catalog match." /></div>}
      {result.pagination.total_pages > 1 && <nav aria-label="Library resource pages" className="mt-4 flex flex-wrap items-center justify-between gap-2"><Button variant="secondary" size="sm" disabled={result.pagination.page <= 1} onClick={() => void run({ kind: 'MANUAL', query: result.search.query, page: String(result.pagination.page - 1) })}>Previous resources</Button><span className="text-xs text-slate-500">Page {result.pagination.page} of {result.pagination.total_pages}</span><Button variant="secondary" size="sm" disabled={!result.pagination.has_next} onClick={() => void run({ kind: 'MANUAL', query: result.search.query, page: String(result.pagination.page + 1) })}>Next resources</Button></nav>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Source: Campus Library · Availability was checked for this search and may change. Borrowing and reservations stay with the Library.</p>
    </div>}
  </section>
}
