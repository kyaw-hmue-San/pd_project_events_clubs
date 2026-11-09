import { useState } from 'react'
import { Button, EmptyState, ErrorNotice, Field, Icon, Input, Loading, OperationNotice, PageHeader, Select } from '../../components/ui'
import { useRemote } from '../../hooks/useRemote'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/adapters'

const workModes = { remote: 'Remote', hybrid: 'Hybrid', 'on-site': 'On-site' }
export function InternshipsPage() {
  const [search, setSearch] = useState(''), [location, setLocation] = useState(''), [mode, setMode] = useState('')
  const [query, setQuery] = useState({ q: '', location: '', work_mode: '', page: '1' })
  const remote = useRemote(`internships/${JSON.stringify(query)}`, () => api.internships(query))
  const result = remote.value
  const apply = (event: React.FormEvent) => { event.preventDefault(); setQuery({ q: search.trim(), location: location.trim(), work_mode: mode, page: '1' }) }
  const clear = () => { setSearch(''); setLocation(''); setMode(''); setQuery({ q: '', location: '', work_mode: '', page: '1' }) }
  return <div className="page-wrap">
    <PageHeader eyebrow="Career opportunities · Team 17" title="Internships" description="Explore internship opportunities from the Internship team. Details and applications are managed on their website." actions={<Button variant="secondary" size="sm" icon="refresh" busy={remote.loading} busyFeedback="notice" onClick={remote.refresh}>Refresh opportunities</Button>} />
    <form onSubmit={apply} className="surface-card mt-6 space-y-4 p-4 sm:p-5">
      <div className="grid items-start gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <Field label="Search internships"><Input type="search" maxLength={100} placeholder="Title, company or skill" value={search} onChange={event => setSearch(event.target.value)} /></Field>
        <Field label="Location"><Input maxLength={100} placeholder="City or remote" value={location} onChange={event => setLocation(event.target.value)} /></Field>
        <Field label="Work arrangement"><Select value={mode} onChange={event => setMode(event.target.value)}><option value="">All arrangements</option>{Object.entries(workModes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      </div>
      <div className="flex gap-2"><Button type="submit" icon="search" disabled={remote.loading}>Search</Button><Button variant="ghost" disabled={remote.loading} onClick={clear}>Clear filters</Button></div>
    </form>
    {remote.loading && !result ? <Loading text="Finding internship opportunities" variant="section" layout="cards" /> : remote.error ? <ErrorNotice message={remote.error} onRetry={remote.refresh} /> : result && <>
      {remote.loading && <OperationNotice title="Refreshing internship opportunities" description="Showing the previous results until the latest response arrives." />}
      {result.data.some(item => item.is_demo) && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Listings marked <strong>Demo listing</strong> are fictional examples supplied by Team 17, not genuine vacancies.</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold text-slate-950">Available opportunities</h2><p role="status" className="text-sm text-slate-500">{result.pagination.total} {result.pagination.total === 1 ? 'opportunity' : 'opportunities'}</p></div>
      {result.data.length ? <div className="motion-list mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.data.map(item => <article key={item.id} className="surface-card flex min-w-0 flex-col p-5">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{workModes[item.work_mode]}</span>{item.is_demo && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Demo listing</span>}</div>
        <h3 className="mt-4 break-words text-lg font-semibold leading-6 text-slate-950">{item.title}</h3><p className="mt-1 break-words text-sm font-medium text-slate-600">{item.company}</p>
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><Icon name="location" className="mt-0.5 size-3.5 shrink-0" /><span className="min-w-0 break-words">{item.location}</span></p>
        <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{item.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{item.skills.slice(0, 4).map((skill, index) => <span key={index} className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{skill}</span>)}</div>
        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs leading-5"><div><dt className="text-slate-500">Application deadline · Thailand</dt><dd className="font-semibold text-slate-800">{formatDate(`${item.application_deadline}T00:00:00+07:00`, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div><div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600"><dt className="sr-only">Duration and allowance</dt><dd>{item.duration_weeks} weeks</dd><dd>{item.allowance_thb === null ? 'Allowance not specified' : `${new Intl.NumberFormat('en-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(item.allowance_thb)}/month`}</dd></div></dl>
        <a href={item.details_url} target="_blank" rel="noopener noreferrer" className="motion-press mt-5 inline-flex min-h-11 items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50">View on Internship site<span className="sr-only"> — {item.title}, opens a new tab</span><Icon name="arrow-right" className="size-4 shrink-0" /></a>
      </article>)}</div> : <div className="mt-4"><EmptyState icon="search" title="No internships found" description="Try a different keyword, location or work arrangement. Availability is provided by Team 17." action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} /></div>}
      <nav aria-label="Internship pages" className="mt-6 flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" disabled={remote.loading || result.pagination.page <= 1} onClick={() => setQuery(value => ({ ...value, page: String(Number(value.page) - 1) }))}>Previous page</Button><p className="text-xs text-slate-500">Page {result.pagination.page}{result.pagination.total_pages >= result.pagination.page ? ` of ${result.pagination.total_pages}` : ''}</p><Button variant="secondary" disabled={remote.loading || !result.pagination.has_next} onClick={() => setQuery(value => ({ ...value, page: String(Number(value.page) + 1) }))}>Next page</Button></nav>
      <p className="mt-4 text-xs leading-5 text-slate-500">Source: Team 17 Internship Management · Refresh to check current availability.</p>
    </>}
  </div>
}
