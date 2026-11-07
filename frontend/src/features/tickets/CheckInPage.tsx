import { useRef, useState } from 'react'
import type { CheckInResult } from '../../models'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/adapters'
import { useRemote } from '../../hooks/useRemote'
import { Button, EmptyState, ErrorNotice, Field, Icon, Input, Loading, OperationNotice, PageHeader } from '../../components/ui'
import { TicketScanner } from './TicketScanner'
import { isTicketQr } from './readTicketImage'

export function CheckInPage({ id, userId, onBack }: { id: string; userId: string; onBack: () => void }) {
  const activity = useRemote(`check-in/${id}`, () => api.activity(id))
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState<(CheckInResult & { code: string }) | null>(null)
  const [busy, setBusy] = useState<'verify' | 'check-in' | null>(null)
  const inFlight = useRef(false)
  const codeForm = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const verify = async (value: string) => {
    if (inFlight.current) return
    if (!isTicketQr(value)) { setCode(value); setError('This is not a Campus Events & Clubs ticket code. Use the QR or code from My registrations → View ticket.'); return }
    inFlight.current = true; setBusy('verify'); setError(''); setVerified(null); setConfirmed(false); setCode(value)
    try { const result = await api.verifyTicket(id, value); setVerified({ ...result, code: value }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ticket verification failed. Try the code or use the roster.') }
    finally { inFlight.current = false; setBusy(null) }
  }
  const checkIn = async () => {
    if (inFlight.current || !verified || verified.alreadyCheckedIn) return
    inFlight.current = true; setBusy('check-in'); setError('')
    try { const result = await api.checkIn(id, { code: verified.code }); setVerified({ ...result, code: verified.code }); setConfirmed(true) }
    catch (cause) { setVerified(null); setError(cause instanceof Error ? cause.message : 'Check-in could not be confirmed. Verify the ticket again.') }
    finally { inFlight.current = false; setBusy(null) }
  }
  if (activity.loading) return <Loading text="Opening event check-in" />
  if (activity.error || !activity.value) return <div className="page-wrap"><Button variant="ghost" onClick={onBack}>Back to roster</Button><ErrorNotice message={activity.error || 'Activity unavailable.'} onRetry={activity.refresh} /></div>
  if (activity.value.organizerId !== userId || !['PUBLISHED', 'CLOSED'].includes(activity.value.status)) return <div className="page-wrap"><EmptyState title="Check-in is unavailable" description="You can check in attendees only for your own published or closed activities." action={<Button onClick={onBack}>Back to roster</Button>} /></div>
  return <div className="page-wrap max-w-4xl">
    <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to roster</Button>
    <div className="mt-5"><PageHeader eyebrow="Organizer attendance" title="Check in attendees" description={activity.value.title} /></div>
    <ol aria-label="Check-in steps" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">
      <li aria-current={!verified ? 'step' : undefined} className={`flex items-center gap-2 ${!verified ? 'text-blue-700' : 'text-slate-500'}`}><span className={`grid size-6 place-items-center rounded-full ${!verified ? 'bg-blue-100' : 'bg-slate-100'}`}>{verified ? <Icon name="check" className="size-3.5" /> : '1'}</span>Read ticket</li>
      <li aria-current={verified ? 'step' : undefined} className={`flex items-center gap-2 ${verified ? 'text-blue-700' : 'text-slate-500'}`}><span className={`grid size-6 place-items-center rounded-full ${verified ? 'bg-blue-100' : 'bg-slate-100'}`}>{confirmed || verified?.alreadyCheckedIn ? <Icon name="check" className="size-3.5" /> : '2'}</span>Confirm attendee</li>
    </ol>
    <div className="surface-card mt-5 p-5 sm:p-6">
      {!verified && <>
        <TicketScanner disabled={Boolean(busy)} onDetected={value => void verify(value)} onEnterCode={() => { codeForm.current?.querySelector('input')?.focus() }} />
        <form ref={codeForm} className="mt-6 space-y-4 border-t border-slate-100 pt-5" onSubmit={event => { event.preventDefault(); void verify(code.trim()) }}>
          <h2 className="text-sm font-semibold text-slate-900">Or enter a ticket code</h2>
          <Field label="Ticket code" hint="Copy the code from the attendee’s ticket. Spaces and hyphens are accepted."><Input data-ticket-secret autoComplete="off" spellCheck={false} autoCapitalize="characters" placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" className="font-mono" maxLength={128} value={code} onChange={event => { setCode(event.target.value); setError('') }} disabled={Boolean(busy)} required /></Field>
          <div className="flex flex-wrap gap-2"><Button type="submit" busy={busy === 'verify'} busyLabel="Verifying…" disabled={!code.trim()}>Verify ticket</Button>{code && <Button variant="ghost" disabled={Boolean(busy)} onClick={() => { setCode(''); setError(''); codeForm.current?.querySelector('input')?.focus() }}>Clear</Button>}</div>
        </form>
      </>}
      {busy && <OperationNotice title={busy === 'verify' ? 'Verifying the ticket' : 'Recording attendance'} description="Checking the selected event and current registration status." />}
      {error && <ErrorNotice message={error} />}
      {verified && <section aria-label="Verified attendee">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${confirmed || verified.alreadyCheckedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}><span key={confirmed ? 'confirmed' : 'verified'} className={confirmed ? 'motion-success-icon inline-flex' : 'inline-flex'}><Icon name="check" className="size-3.5" /></span>{confirmed ? 'Attendance recorded' : verified.alreadyCheckedIn ? 'Already checked in' : 'Valid registration'}</span>
        <h2 className="mt-4 break-words text-xl font-semibold">{verified.participant.displayName || 'Campus member'}</h2>
        <p className="mt-1 break-all text-sm text-slate-500">{verified.participant.email || 'Email unavailable'}</p>
        {verified.registration.checkedInAt ? <p className="mt-4 text-sm text-slate-600">Checked in {formatDate(verified.registration.checkedInAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}. This attendee is counted once.</p> : <p className="mt-4 text-sm leading-6 text-slate-600">Confirm this is the person attending before recording their arrival.</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {!confirmed && !verified.alreadyCheckedIn && <Button busy={busy === 'check-in'} busyLabel="Checking in…" onClick={() => void checkIn()}>Confirm check-in</Button>}
          <Button variant="secondary" disabled={Boolean(busy)} onClick={() => { setVerified(null); setConfirmed(false); setCode(''); setError('') }}>{confirmed || verified.alreadyCheckedIn ? 'Scan next ticket' : 'Use another ticket'}</Button>
        </div>
      </section>}
    </div>
    <p className="mt-4 text-xs leading-5 text-slate-500">No ticket available? Return to the roster to find the attendee and check them in manually.</p>
  </div>
}
