import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/adapters'
import { campusTimeZone } from '../../lib/firebase'
import { useRemote } from '../../hooks/useRemote'
import { Button, ErrorNotice, Icon, Loading, OperationNotice, PageHeader } from '../../components/ui'

export function TicketPage({ id, onBack }: { id: string; onBack: () => void }) {
  const ticket = useRemote(`ticket/${id}`, () => api.ticket(id))
  const [image, setImage] = useState('')
  const [qrError, setQrError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const value = ticket.value
  useEffect(() => {
    let active = true
    setImage(''); setQrError(''); setCopyMessage('')
    if (value?.qrValue && !value.registration.checkedInAt) {
      import('qrcode').then(module => module.default.toDataURL(value.qrValue, { width: 280, margin: 4, errorCorrectionLevel: 'M' }))
        .then(url => { if (active) setImage(url) })
        .catch(() => { if (active) setQrError('The QR image could not be prepared. Your ticket code below can still be used.') })
    }
    return () => { active = false }
  }, [value?.qrValue, value?.registration.checkedInAt])
  if (ticket.loading && !value) return <Loading text="Preparing your registration ticket" layout="profile" />
  if (ticket.error || !value) return <div className="page-wrap"><Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to my registrations</Button><ErrorNotice message={ticket.error || 'Ticket unavailable.'} onRetry={ticket.refresh} /></div>
  const checkedIn = Boolean(value.registration.checkedInAt)
  return <div className="page-wrap max-w-4xl">
    <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to my registrations</Button>
    <div className="mt-5"><PageHeader eyebrow="Your event pass" title="My ticket" description="Show this ticket to the Organizer when you arrive." actions={<Button variant="secondary" icon="refresh" busy={ticket.loading} busyLabel="Refreshing…" onClick={ticket.refresh}>Refresh ticket</Button>} /></div>
    {ticket.loading && <OperationNotice title="Checking your ticket status" />}
    <section className="surface-card mt-6 grid overflow-hidden md:grid-cols-2">
      <div className="space-y-5 p-5 sm:p-7">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${checkedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}><Icon name="check" className="size-3.5" />{checkedIn ? 'Checked in' : 'Registration confirmed'}</span>
        <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">{value.activity.title}</h2>
        <dl className="space-y-4 text-sm">
          <div><dt className="text-xs font-medium text-slate-500">Attendee</dt><dd className="mt-1 break-words font-semibold">{value.holderName || 'Campus member'}</dd></div>
          <div><dt className="text-xs font-medium text-slate-500">Date & time</dt><dd className="mt-1">{formatDate(value.activity.dateTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</dd>{value.activity.endDateTime && <dd className="mt-1 text-xs text-slate-600">Ends {formatDate(value.activity.endDateTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</dd>}<dd className="mt-1 text-xs text-slate-500">{campusTimeZone}</dd></div>
          <div><dt className="text-xs font-medium text-slate-500">Location</dt><dd className="mt-1 break-words">{value.activity.location}</dd></div>
          {value.registration.checkedInAt && <div><dt className="text-xs font-medium text-slate-500">Attendance recorded</dt><dd className="mt-1">{formatDate(value.registration.checkedInAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</dd></div>}
        </dl>
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Keep your ticket private. The Organizer verifies its status and confirms your name at check-in.</p>
      </div>
      <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/60 p-5 sm:p-7 md:border-l md:border-t-0">
        {checkedIn ? <div className="py-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" className="size-8" /></span><h3 className="mt-4 text-lg font-semibold">You’re checked in</h3><p className="mt-2 text-sm text-slate-500">Enjoy your activity. Your attendance is recorded.</p></div> : <>
          {!image && !qrError && <OperationNotice title="Creating your QR image" />}
          {image && <img data-ticket-secret src={image} width={280} height={280} className="w-full max-w-[280px] rounded-xl border border-slate-200 bg-white" alt="Your registration QR ticket" />}
          {qrError && <ErrorNotice message={qrError} />}
          <p className="mt-4 text-xs font-medium text-slate-500">Ticket code</p>
          <code data-ticket-secret className="mt-2 max-w-full break-all text-center font-mono text-sm font-semibold tracking-wide text-slate-800">{value.code}</code>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {image && <a href={image} download="campus-events-clubs-ticket.png" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download QR</a>}
            <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(value.code).then(() => setCopyMessage('Ticket code copied.')).catch(() => setCopyMessage('Select and copy the ticket code above.')); if (!navigator.clipboard) setCopyMessage('Select and copy the ticket code above.') }}>Copy code</Button>
          </div>
          {copyMessage && <p role="status" className="mt-3 text-center text-xs text-slate-600">{copyMessage}</p>}
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">Refresh this page after the Organizer checks you in. Cancelled registrations cannot use their tickets.</p>
        </>}
      </div>
    </section>
  </div>
}
