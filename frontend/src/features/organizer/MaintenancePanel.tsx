import { Button, ErrorNotice, Icon, OperationNotice } from '../../components/ui'
import { useRemote } from '../../hooks/useRemote'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/adapters'
import { useEffect, useRef, useState } from 'react'
import { FacilityRequestDialog, facilityError } from './FacilityRequestDialog'

export function MaintenancePanel({ id }: { id: string }) {
  const remote = useRemote(`maintenance/${id}`, () => api.maintenance(id))
  const [review, setReview] = useState(false)
  const refresh = useRef(remote.refresh)
  refresh.current = remote.refresh
  const live = Boolean(remote.value?.workOrder && remote.value.workOrder.status !== 'CLOSED') || remote.value?.request?.state === 'SENDING'
  useEffect(() => {
    if (!live) return
    const update = () => { if (!document.hidden) refresh.current() }
    const timer = window.setInterval(update, 15000)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update) }
  }, [live])
  const request = remote.value?.request
  return <section aria-labelledby="facilities-status-heading" className="surface-card mt-6 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="facilities-status-heading" className="flex items-center gap-2 text-lg font-semibold"><Icon name="file" className="size-5 text-blue-600" />Facilities support</h2><p className="mt-1 text-xs leading-5 text-slate-500">Private Organizer notes and the latest update for a linked maintenance work order.</p></div><Button variant="secondary" size="sm" icon="refresh" busy={remote.loading} busyLabel="Refreshing…" onClick={remote.refresh}>Refresh maintenance status</Button></div>
    {remote.loading && !remote.value ? <OperationNotice title="Loading facilities support" /> : remote.error ? <ErrorNotice message={remote.error} onRetry={remote.refresh} /> : remote.value && <>
      {remote.loading && <OperationNotice title="Checking the latest maintenance update" />}
      <div className="mt-4 rounded-xl bg-slate-50 p-4"><h3 className="text-xs font-semibold text-slate-500">Facilities notes</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{remote.value.notes || 'No facilities requirements saved. Add them when editing this activity if needed.'}</p></div>
      <p className="mt-2 text-xs leading-5 text-slate-500">Notes stay in Campus Events & Clubs until you review and send a facilities request. Coordinate later changes with maintenance.</p>
      {request?.state === 'SENT' && <>
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{request.duplicate ? 'Existing Team 10 work order linked to this activity. Duplicate submission did not update its details.' : 'Request accepted by Team 10 and linked to this activity.'}</p>
        <details className="mt-3 rounded-xl border border-slate-200 p-4 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">View submitted request</summary><dl className="mt-3 space-y-3">{[['Requirements', request.payload.description], ['Category', request.payload.category], ['Schedule', request.payload.schedule], ['Location', request.payload.location]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-700">{value}</dd></div>)}</dl></details>
      </>}
      {request?.state === 'SENDING' && <OperationNotice title={request.canRetry ? 'The request result needs confirmation' : 'Facilities request in progress'} description="Refresh status or retry when available. The same request identity prevents duplicate work orders." />}
      {(request?.state === 'RETRYABLE' || request?.state === 'REVIEW_REQUIRED') && <ErrorNotice message={facilityError(request.error)} />}
      {!remote.value.workOrder && request?.state !== 'SENT' && request?.state !== 'REVIEW_REQUIRED' && <div className="mt-4 flex flex-wrap items-center gap-3"><Button icon="file" disabled={!remote.value.requestsEnabled || !remote.value.notes || !['PUBLISHED', 'CLOSED'].includes(remote.value.activityStatus) || (request?.state === 'SENDING' && !request.canRetry)} onClick={() => setReview(true)}>{request ? 'Review and retry request' : 'Review facilities request'}</Button>{!remote.value.requestsEnabled && <p className="text-xs text-slate-500">Request submission is disabled in this environment.</p>}</div>}
      {!remote.value.workOrder ? <div className="mt-4"><p className="text-sm font-semibold text-slate-800">No maintenance request linked</p><p className="mt-1 text-xs leading-5 text-slate-500">Review and explicitly send your saved requirements, or contact the coordinator to connect an existing work order.</p></div> : <div className="mt-4 space-y-2 text-sm">
        <p className="break-all text-slate-600">Work order: <span className="font-mono text-xs">{remote.value.workOrder.id}</span></p>
        <p className={`font-semibold ${remote.value.workOrder.needsReview ? 'text-amber-800' : 'text-blue-700'}`}>{remote.value.workOrder.needsReview ? 'Status needs confirmation' : remote.value.workOrder.status ? `Maintenance status: ${remote.value.workOrder.status.replace(/_/g, ' ')}` : 'Waiting for a maintenance update'}</p>
        {['RESOLVED', 'CLOSED'].includes(remote.value.workOrder.status || '') && <p role="status" className="rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800">Facilities support completed.{remote.value.workOrder.status === 'CLOSED' ? ' The request is closed.' : ' Maintenance has marked the work resolved.'}</p>}
        {remote.value.workOrder.occurredAt && <p className="text-xs text-slate-500">Partner update: {formatDate(remote.value.workOrder.occurredAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} · campus time</p>}
        <p className="text-xs leading-5 text-slate-500">{remote.value.workOrder.needsReview ? 'Conflicting updates arrived with the same timestamp. Confirm the current status with maintenance.' : 'This is the latest received update, not a live availability or room-booking confirmation.'}</p>
      </div>}
      {!remote.value.webhookConfigured && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Maintenance updates are disabled in this environment. Saved notes and previously received status remain available.</p>}
      {live && <p className="mt-3 text-xs text-slate-500">Status refreshes every 15 seconds while this page is visible.</p>}
    </>}
    {review && <FacilityRequestDialog id={id} onClose={() => setReview(false)} onFinished={() => { setReview(false); remote.refresh() }} />}
  </section>
}
