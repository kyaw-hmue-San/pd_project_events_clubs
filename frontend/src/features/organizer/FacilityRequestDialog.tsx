import { useEffect, useState } from 'react'
import { Button, ErrorNotice, Field, Modal, OperationNotice, Select } from '../../components/ui'
import { useRemote } from '../../hooks/useRemote'
import { api } from '../../lib/api'

export const facilityError = (code?: string | null) => ({
  FACILITIES_PARTNER_AUTH: 'Maintenance could not authenticate this request. Ask the coordinator to check the connection before retrying.',
  FACILITIES_PARTNER_NOT_FOUND: 'The maintenance request endpoint was not found (HTTP 404). Ask the coordinator to confirm Team 10’s deployed creation URL before retrying.',
  FACILITIES_PARTNER_REJECTED: 'Maintenance rejected the request details. Contact the coordinator to resolve it before sending again.',
  FACILITIES_PARTNER_BUSY: 'Maintenance is busy. Wait a moment, then retry the original request.',
  FACILITIES_PARTNER_UNAVAILABLE: 'Maintenance did not confirm the request. Retry uses the same details and request identity.',
  FACILITIES_INVALID_RESPONSE: 'The maintenance response could not be verified. Contact the coordinator or retry the same request.',
  FACILITIES_RESULT_UNCERTAIN: 'The result could not be confirmed. Retrying reuses the same request to avoid creating a duplicate.',
  FACILITIES_LINK_CONFLICT: 'The returned work order is already associated with another activity. Contact the coordinator.',
}[code || ''] || 'The request needs confirmation. Refresh its status before trying again.')

export function FacilityRequestDialog({ id, onClose, onFinished }: { id: string; onClose: () => void; onFinished: () => void }) {
  const [category, setCategory] = useState('Electrical')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const preview = useRemote(`facilities-preview/${id}/${category}`, () => api.facilityPreview(id, category))
  useEffect(() => { if (preview.value?.previousAttempt) setCategory(preview.value.payload.category) }, [preview.value])
  const send = async () => {
    if (busy || !preview.value || preview.loading) return
    setBusy(true); setError('')
    try {
      await api.sendFacilityRequest(id, { category: preview.value.payload.category, revision: preview.value.revision })
      onFinished()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The request could not be confirmed. Refresh before trying again.') }
    finally { setBusy(false) }
  }
  return <Modal open title="Review facilities request" busy={busy} onClose={() => !busy && onClose()}>
    <p className="text-sm leading-6 text-slate-600">The details below will be sent to Team 10 Maintenance and appear in their staff work-order panel.</p>
    <div className="mt-4"><Field label="Maintenance category"><Select disabled={busy || preview.value?.previousAttempt} value={category} onChange={event => { setCategory(event.target.value); setError('') }}>{['Electrical', 'Plumbing', 'HVAC', 'Safety'].map(value => <option key={value}>{value}</option>)}</Select></Field></div>
    {preview.loading ? <OperationNotice title="Preparing the request preview" /> : preview.error || !preview.value ? <ErrorNotice message={preview.error || 'Preview unavailable.'} onRetry={preview.refresh} /> : <>
      <dl className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
        {[['Activity', preview.value.payload.title], ['Requirements', preview.value.payload.description], ['Location', preview.value.payload.location], ['Schedule', preview.value.payload.schedule]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-6 text-slate-800">{value}</dd></div>)}
      </dl>
      {preview.value.previousAttempt && <p className="mt-3 text-xs leading-5 text-amber-800">This retry uses the originally reviewed details and the same request identity. Later activity edits do not change this submission.</p>}
      {!preview.value.requestsEnabled && <p className="mt-3 text-xs text-amber-800">Request submission is disabled in this environment.</p>}
    </>}
    {error && <ErrorNotice message={error} />}
    {busy && <OperationNotice title="Sending the facilities request" description="Waiting for a verified work-order receipt. Please keep this dialog open." />}
    <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button busy={busy} busyLabel="Sending…" disabled={preview.loading || !preview.value?.requestsEnabled || Boolean(preview.error)} onClick={() => void send()}>{preview.value?.previousAttempt ? 'Retry original request' : 'Send facilities request'}</Button></div>
  </Modal>
}
