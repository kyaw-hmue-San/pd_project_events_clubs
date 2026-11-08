import { useEffect, useState } from "react"
import type { Activity, ActivityInput, ActivityStatus, RegistrationRecord } from "../../models"
import { Badge, Button, DateTimeInput, EmptyState, ErrorNotice, Field, Icon, Input, Modal, OperationNotice, PageHeader, SegmentedControl, Select, Textarea, TypeBadge } from "../../components/ui"
import { DraftAssistant } from './DraftAssistant'
import { campusInput, campusToISO, formatDate, participantCount } from "../../lib/adapters"
import { campusTimeZone } from "../../lib/firebase"
import { ApiError } from "../../lib/api"

export function OrganizerActivities({ activities, onForm, onRoster, onOpen, onStatus, onDelete, busy, busyId, progress }: {
  activities: Activity[]; onForm: (id?: string) => void; onRoster: (id: string) => void;
  onOpen: (id: string) => void; onStatus: (id: string, status: ActivityStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>; busy: boolean; busyId?: string; progress?: string;
}) {
  const [confirmation, setConfirmation] = useState<{ id: string; action: "close" | "delete" } | null>(null)
  const [error, setError] = useState("")
  const act = async (operation: () => Promise<void>) => {
    setError("")
    try { await operation(); setConfirmation(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The change could not be confirmed.") }
  }
  return <div className="page-wrap">
    <PageHeader eyebrow="Organizer workspace" title="My activities" description="Create, publish and manage your campus activities."
      actions={<Button icon="plus" onClick={() => onForm()}>Create activity</Button>} />
    {!confirmation && error && <ErrorNotice message={error} />}
    {busy && progress && !confirmation && <OperationNotice title={progress} description="Please wait while we save your change." />}
    {activities.length ? <div className="motion-list surface-card mt-6 overflow-hidden">
      {activities.map(activity => <article key={activity.id} className="flex flex-col gap-4 border-b border-slate-100 p-5 last:border-0 md:flex-row md:items-center">
        <div className="min-w-0 flex-1"><div className="flex gap-2"><TypeBadge type={activity.type} /><Badge status={activity.status} /></div>
          <button className="mt-3 text-left font-bold text-slate-950 hover:text-blue-700" onClick={() => onOpen(activity.id)}>{activity.title}</button>
          <p className="mt-1 text-sm text-slate-500">{activity.date} · {activity.time}</p>
          <p className="mt-1 text-sm text-slate-500">{activity.location} · {participantCount(activity)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.status !== "CLOSED" && <Button variant="secondary" disabled={busy} onClick={() => onForm(activity.id)}>Edit</Button>}
          {activity.status === "DRAFT" ? <>
            <Button busy={busy && busyId === activity.id} busyFeedback="notice" disabled={busy} onClick={() => void act(() => onStatus(activity.id, "PUBLISHED"))}>Publish</Button>
            <Button variant="danger-ghost" disabled={busy} onClick={() => { setError(""); setConfirmation({ id: activity.id, action: "delete" }) }}>Delete</Button>
          </> : <Button variant="secondary" onClick={() => onRoster(activity.id)}>Roster</Button>}
          {activity.status === "PUBLISHED" && <Button variant="danger-ghost" disabled={busy} onClick={() => { setError(""); setConfirmation({ id: activity.id, action: "close" }) }}>Close</Button>}
        </div>
      </article>)}
    </div> : <div className="mt-8"><EmptyState title="No activities yet" description="Create your first campus activity and save it as a draft." /></div>}
    <Modal open={Boolean(confirmation)} busy={busy} onClose={() => !busy && setConfirmation(null)} title={confirmation?.action === "delete" ? "Delete this draft?" : "Close this activity?"}>
      <p className="text-sm leading-6 text-slate-600">{confirmation?.action === "delete" ? "This unused draft will be permanently removed." : "Registration will close immediately. Closed activities cannot be reopened."}</p>
      {error && <ErrorNotice message={error} />}
      {busy && <OperationNotice title={progress || "Updating your activity"} description="Please wait while we confirm your change." />}
      <div className="mt-6 flex gap-3"><Button variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>Keep activity</Button>
        <Button variant="danger" busy={busy} busyFeedback="notice" onClick={() => confirmation && void act(() => confirmation.action === "delete" ? onDelete(confirmation.id) : onStatus(confirmation.id, "CLOSED"))}>{confirmation?.action === "delete" ? "Delete draft" : "Close activity"}</Button></div>
    </Modal>
  </div>
}

export function ActivityForm({ activity, onBack, onSave, progress }: {
  activity?: Activity; onBack: () => void;
  onSave: (mode: "draft" | "publish", input: ActivityInput) => Promise<void>;
  progress?: string;
}) {
  const initial = activity?.dateTime ? campusInput(activity.dateTime) : { date: "", time: "" }
  const [title, setTitle] = useState(activity?.title || "")
  const [description, setDescription] = useState(activity?.description || "")
  const [activityType, setType] = useState<ActivityInput["activityType"]>(activity?.type || "EVENT")
  const [location, setLocation] = useState(activity?.location || "")
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const initialEnd = activity?.endDateTime ? campusInput(activity.endDateTime) : { date: '', time: '' }
  const initialDeadline = activity?.registrationDeadline ? campusInput(activity.registrationDeadline) : { date: '', time: '' }
  const [hasEnd, setHasEnd] = useState(Boolean(activity?.endDateTime))
  const [endDate, setEndDate] = useState(initialEnd.date)
  const [endTime, setEndTime] = useState(initialEnd.time)
  const [limited, setLimited] = useState(activity?.maxParticipants != null)
  const [capacity, setCapacity] = useState(activity?.maxParticipants?.toString() || '')
  const [hasDeadline, setHasDeadline] = useState(Boolean(activity?.registrationDeadline))
  const [deadlineDate, setDeadlineDate] = useState(initialDeadline.date)
  const [deadlineTime, setDeadlineTime] = useState(initialDeadline.time)
  const [needsFacilities, setNeedsFacilities] = useState(Boolean(activity?.facilitiesNotes))
  const [facilitiesNotes, setFacilitiesNotes] = useState(activity?.facilitiesNotes || '')
  const [busy, setBusy] = useState(false)
  const [intent, setIntent] = useState<'draft' | 'publish'>('draft')
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  useEffect(() => { setError(''); setFieldErrors({}) }, [title, description, activityType, location, date, time, hasEnd, endDate, endTime, limited, capacity, hasDeadline, deadlineDate, deadlineTime, needsFacilities, facilitiesNotes])
  let schedule = ""
  let endSchedule = '', deadlineSummary = ''
  if (date && time) {
    try { schedule = `${formatDate(campusToISO(date, time), { day: 'numeric', month: 'short', year: 'numeric' })} · ${time}` } catch { /* The form reports incomplete/invalid times on submission. */ }
  }
  if (hasEnd && (endDate || date) && endTime) {
    try { endSchedule = `${formatDate(campusToISO(endDate || date, endTime), { day: 'numeric', month: 'short', year: 'numeric' })} · ${endTime}` } catch { /* Incomplete input is reported when saving. */ }
  }
  if (hasDeadline && (deadlineDate || date) && deadlineTime) {
    try { deadlineSummary = `${formatDate(campusToISO(deadlineDate || date, deadlineTime), { day: 'numeric', month: 'short', year: 'numeric' })} · ${deadlineTime}` } catch { /* Incomplete input is reported when saving. */ }
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const mode = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "publish" ? "publish" : "draft"
    if (busy) return
    setError(""); setFieldErrors({}); setIntent(mode); setBusy(true)
    try {
      const start = campusToISO(date, time)
      const end = hasEnd ? campusToISO(endDate || date, endTime) : null
      const deadline = hasDeadline ? campusToISO(deadlineDate || date, deadlineTime) : null
      if (end && Date.parse(end) <= Date.parse(start)) throw new Error('The end date and time must be after the start.')
      if (deadline && Date.parse(deadline) > Date.parse(start)) throw new Error('The registration deadline must be at or before the activity start.')
      if (limited && (!Number.isInteger(Number(capacity)) || Number(capacity) < 1 || Number(capacity) > 100000)) throw new Error('Enter a whole-number participant limit from 1 to 100,000.')
      await onSave(mode, { title: title.trim(), description: description.trim(), activityType, location: location.trim(), dateTime: start,
        endDateTime: end, registrationDeadline: deadline, maxParticipants: limited ? Number(capacity) : null,
        facilitiesNotes: needsFacilities ? facilitiesNotes.trim() : null })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The activity could not be saved.")
      if (cause instanceof ApiError) setFieldErrors(cause.fieldErrors || {})
    } finally { setBusy(false) }
  }
  return <div className="page-wrap max-w-4xl">
    <Button variant="ghost" icon="arrow-left" disabled={busy} onClick={onBack}>Back to my activities</Button>
    <div className="mt-5"><PageHeader eyebrow={activity ? "Edit activity" : "New activity"} title={activity ? "Edit activity" : "Create an activity"} description="Complete the activity details, then save or publish." /></div>
    {!activity && <DraftAssistant disabled={busy} activityType={activityType} current={{ title, description, facilitiesNotes: needsFacilities ? facilitiesNotes : null }} onApply={draft => { if (draft.title !== undefined) setTitle(draft.title); if (draft.description !== undefined) setDescription(draft.description); if (draft.facilitiesNotes !== undefined) { setFacilitiesNotes(draft.facilitiesNotes || ''); setNeedsFacilities(Boolean(draft.facilitiesNotes)); } setFieldErrors({}); setError('') }} />}
    <form onSubmit={submit} className="surface-card mt-6 p-5 sm:p-6">
      <fieldset disabled={busy} className="grid gap-6">
        <h2 className="text-base font-semibold text-slate-900">Activity details</h2>
        <Field label="Activity title" error={fieldErrors.title}><Input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. International Film Night" /></Field>
        <Field label="Description" hint={`${description.length}/5000 characters`} error={fieldErrors.description}><Textarea required maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Activity type" error={fieldErrors.activityType}><Select value={activityType} onChange={event => setType(event.target.value as ActivityInput["activityType"])}><option value="EVENT">Event</option><option value="CLUB_ACTIVITY">Club activity</option></Select></Field>
          <Field label="Location" error={fieldErrors.location}><Input required maxLength={200} value={location} onChange={event => setLocation(event.target.value)} placeholder="Building and room" /></Field>
        </div>
        <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5" aria-labelledby="activity-schedule-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="activity-schedule-heading" className="text-sm font-semibold text-slate-900">Date & time</h2><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Icon name="clock" className="size-3.5" />{campusTimeZone}</span></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" hint="Choose a date using the calendar."><DateTimeInput required type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
            <Field label="Start time" hint="24-hour time, for example 12:30."><DateTimeInput required type="time" step={60} value={time} onChange={event => setTime(event.target.value)} /></Field>
          </div>
          <label className="mt-5 flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={hasEnd} onChange={event => setHasEnd(event.target.checked)} />Add an end time</label>
          {hasEnd && <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <Field label="End date" error={fieldErrors.endDateTime}><DateTimeInput required type="date" value={endDate || date} onChange={event => setEndDate(event.target.value)} /></Field>
            <Field label="End time" hint="Must be after the activity start."><DateTimeInput required type="time" step={60} value={endTime} onChange={event => setEndTime(event.target.value)} /></Field>
          </div>}
          {schedule && <p className="mt-4 border-t border-slate-200/80 pt-3 text-sm text-slate-600"><span className="font-medium text-slate-900">Selected schedule: </span>{schedule}{endSchedule && ` → ${endSchedule}`}</p>}
          {fieldErrors.dateTime && <p role="alert" className="mt-3 text-sm text-red-700">{fieldErrors.dateTime}</p>}
        </section>
        <section aria-labelledby="activity-registration-heading" className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 id="activity-registration-heading" className="text-sm font-semibold text-slate-900">Registration</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Choose a seat limit and closing time, or keep registration unlimited.</p>
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={limited} onChange={event => setLimited(event.target.checked)} />Limit participant numbers</label>
          {limited && <div className="mt-2 max-w-sm"><Field label="Maximum participants" hint={activity ? `${activity.registered} currently registered. You cannot set a lower limit.` : 'A cancellation frees a seat. Checked-in attendees still count.'} error={fieldErrors.maxParticipants}><Input required type="number" min={Math.max(1, activity?.registered || 0)} max={100000} step={1} inputMode="numeric" value={capacity} onChange={event => setCapacity(event.target.value)} placeholder="e.g. 100" /></Field></div>}
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={hasDeadline} onChange={event => setHasDeadline(event.target.checked)} />Set a registration deadline</label>
          {hasDeadline && <div className="mt-2 grid gap-5 sm:grid-cols-2">
            <Field label="Deadline date" error={fieldErrors.registrationDeadline}><DateTimeInput required type="date" value={deadlineDate || date} onChange={event => setDeadlineDate(event.target.value)} /></Field>
            <Field label="Deadline time" hint={`At or before the activity start · ${campusTimeZone}`}><DateTimeInput required type="time" step={60} value={deadlineTime} onChange={event => setDeadlineTime(event.target.value)} /></Field>
          </div>}
        </section>
        <section aria-labelledby="activity-facilities-heading" className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 id="activity-facilities-heading" className="text-sm font-semibold text-slate-900">Facilities support <span className="font-normal text-slate-500">(optional)</span></h2>
          <label className="mt-2 flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={needsFacilities} onChange={event => setNeedsFacilities(event.target.checked)} />Add facilities requirements</label>
          {needsFacilities && <div className="mt-2"><Field label="Facilities notes" hint={`${facilitiesNotes.length}/2000 characters · visible only to this activity’s Organizer`} error={fieldErrors.facilitiesNotes}><Textarea required maxLength={2000} value={facilitiesNotes} onChange={event => setFacilitiesNotes(event.target.value)} placeholder="e.g. Projector, two microphones and room setup before 09:00" /></Field></div>}
          <p className="mt-2 text-xs leading-5 text-slate-500">These notes are saved in Campus Events & Clubs. They do not automatically create a maintenance request or reserve a room. A linked work order’s received updates appear on the activity page.</p>
        </section>
        <section aria-label="Activity review summary" className="rounded-xl bg-blue-50/60 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">Before you {activity?.status === 'PUBLISHED' ? 'save' : 'publish'}</h2>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div><dt className="text-slate-500">Participants</dt><dd className="mt-1 font-medium text-slate-800">{limited ? capacity ? `${capacity} ${Number(capacity) === 1 ? 'seat' : 'seats'}` : 'Choose a limit' : 'Unlimited'}</dd></div>
            <div><dt className="text-slate-500">Schedule</dt><dd className="mt-1 font-medium text-slate-800">{schedule || 'Choose a date and start time'}{endSchedule && ` → ${endSchedule}`}</dd></div>
            <div><dt className="text-slate-500">Registration deadline</dt><dd className="mt-1 font-medium text-slate-800">{hasDeadline ? deadlineSummary || 'Choose a deadline date and time' : 'No separate deadline'}</dd></div>
            <div><dt className="text-slate-500">Facilities</dt><dd className="mt-1 font-medium text-slate-800">{needsFacilities ? 'Notes saved only; no request sent' : 'No facilities requirements'}</dd></div>
          </dl>
        </section>
        {error && <ErrorNotice message={error} />}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
          <Button type="submit" busy={busy && intent === 'draft'} busyFeedback="notice" variant={activity?.status === "PUBLISHED" ? "primary" : "secondary"} name="intent" value="draft">{activity?.status === "PUBLISHED" ? "Save changes" : "Save draft"}</Button>
          {activity?.status !== "PUBLISHED" && <Button type="submit" busy={busy && intent === 'publish'} busyFeedback="notice" name="intent" value="publish">Publish activity</Button>}
        </div>
      </fieldset>
      {busy && <OperationNotice title={progress || "Saving your activity"} description="Keep this page open while we confirm the activity details." />}
    </form>
  </div>
}

export function Roster({ activity, registrations, onBack, onScan, onCheckIn }: { activity: Activity; registrations: RegistrationRecord[]; onBack: () => void; onScan: () => void; onCheckIn: (id: string) => Promise<void> }) {
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<RegistrationRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const visible = registrations.filter(record => (filter === "ALL" || record.status === filter) && `${record.participant?.displayName || ''} ${record.participant?.email || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const confirm = async () => {
    if (!selected || busy) return
    setBusy(true); setError('')
    try { await onCheckIn(selected.id); setSelected(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Check-in could not be confirmed. Refresh the roster and try again.') }
    finally { setBusy(false) }
  }
  return <div className="page-wrap">
    <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to my activities</Button>
    <div className="mt-5"><PageHeader eyebrow="Registration roster" title={activity.title} description={`${activity.registered} active registrations · ${activity.checkedInCount || 0} checked in`} actions={<Button icon="ticket" disabled={activity.status === 'DRAFT'} onClick={onScan}>Scan tickets</Button>} /></div>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><SegmentedControl label="Roster status" value={filter} items={[{ value: "ALL", label: "All", ariaLabel: "All loaded registrations" }, { value: "ACTIVE", label: "Active" }, { value: "CANCELLED", label: "Cancelled" }]} onChange={setFilter} /><div className="sm:w-72"><Input aria-label="Search attendees" placeholder="Search loaded attendees" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
    <div className="motion-list mt-5 space-y-3">{visible.map(person => <article key={person.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-slate-950">{person.participant?.displayName || "Name unavailable"}</p><p className="break-all text-sm text-slate-500">{person.participant?.email || "Email unavailable"}</p></div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500"><p>{formatDate(person.registeredAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p><Badge status={person.status} />{person.checkedInAt ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Checked in</span> : person.status === 'ACTIVE' && <Button variant="secondary" disabled={activity.status === 'DRAFT'} onClick={() => { setError(''); setSelected(person) }}>Check in</Button>}</div>
    </article>)}</div>
    {!visible.length && <div className="mt-5"><EmptyState icon="users" title="No registrations to show" description="Registrations matching this filter will appear here. Load more below if available." /></div>}
    <p className="mt-5 text-xs text-slate-500">Search and filters apply to loaded registrations. Load more to find other attendees. Only participant details needed for your activity are shown.</p>
    <Modal open={Boolean(selected)} busy={busy} title="Confirm attendee check-in" onClose={() => !busy && setSelected(null)}>
      <p className="text-sm leading-6 text-slate-600">Confirm that <strong>{selected?.participant?.displayName || selected?.participant?.email || 'this attendee'}</strong> has arrived for {activity.title}. Attendance is counted once.</p>
      {error && <ErrorNotice message={error} />}
      {busy && <OperationNotice title="Recording attendance" description="Checking the registration and updating the event count." />}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Cancel</Button><Button busy={busy} busyFeedback="notice" onClick={() => void confirm()}>Confirm check-in</Button></div>
    </Modal>
  </div>
}
