import { useState } from "react"
import type { Activity, ActivityInput, ActivityStatus, RegistrationRecord } from "../../models"
import { Badge, Button, EmptyState, ErrorNotice, Field, Icon, Input, Modal, PageHeader, Select, Textarea, TypeBadge } from "../../components/ui"
import { campusInput, campusToISO, formatDate } from "../../lib/adapters"
import { campusTimeZone } from "../../lib/firebase"
import { ApiError } from "../../lib/api"

export function OrganizerActivities({ activities, onForm, onRoster, onOpen, onStatus, onDelete, busy }: {
  activities: Activity[]; onForm: (id?: string) => void; onRoster: (id: string) => void;
  onOpen: (id: string) => void; onStatus: (id: string, status: ActivityStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>; busy: boolean;
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
    {activities.length ? <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {activities.map(activity => <article key={activity.id} className="flex flex-col gap-4 border-b border-slate-100 p-5 last:border-0 md:flex-row md:items-center">
        <div className="min-w-0 flex-1"><div className="flex gap-2"><TypeBadge type={activity.type} /><Badge status={activity.status} /></div>
          <button className="mt-3 text-left font-bold text-slate-950 hover:text-blue-700" onClick={() => onOpen(activity.id)}>{activity.title}</button>
          <p className="mt-1 text-sm text-slate-500">{activity.date} · {activity.time}</p>
          <p className="mt-1 text-sm text-slate-500">{activity.location} · {activity.registered} active registrations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.status !== "CLOSED" && <Button variant="secondary" disabled={busy} onClick={() => onForm(activity.id)}>Edit</Button>}
          {activity.status === "DRAFT" ? <>
            <Button disabled={busy} onClick={() => void act(() => onStatus(activity.id, "PUBLISHED"))}>Publish</Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setError(""); setConfirmation({ id: activity.id, action: "delete" }) }}>Delete</Button>
          </> : <Button variant="secondary" onClick={() => onRoster(activity.id)}>Roster</Button>}
          {activity.status === "PUBLISHED" && <Button variant="ghost" disabled={busy} onClick={() => { setError(""); setConfirmation({ id: activity.id, action: "close" }) }}>Close</Button>}
        </div>
      </article>)}
    </div> : <div className="mt-8"><EmptyState title="No activities yet" description="Create your first campus activity and save it as a draft." /></div>}
    <Modal open={Boolean(confirmation)} onClose={() => !busy && setConfirmation(null)} title={confirmation?.action === "delete" ? "Delete this draft?" : "Close this activity?"}>
      <p className="text-sm leading-6 text-slate-600">{confirmation?.action === "delete" ? "This unused draft will be permanently removed." : "Registration will close immediately. Closed activities cannot be reopened."}</p>
      {error && <ErrorNotice message={error} />}
      <div className="mt-6 flex gap-3"><Button variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>Keep activity</Button>
        <Button variant={confirmation?.action === "delete" ? "danger" : "primary"} disabled={busy} onClick={() => confirmation && void act(() => confirmation.action === "delete" ? onDelete(confirmation.id) : onStatus(confirmation.id, "CLOSED"))}>{busy ? "Saving…" : confirmation?.action === "delete" ? "Delete draft" : "Close activity"}</Button></div>
    </Modal>
  </div>
}

export function ActivityForm({ activity, onBack, onSave }: {
  activity?: Activity; onBack: () => void;
  onSave: (mode: "draft" | "publish", input: ActivityInput) => Promise<void>;
}) {
  const initial = activity?.dateTime ? campusInput(activity.dateTime) : { date: "", time: "" }
  const [title, setTitle] = useState(activity?.title || "")
  const [description, setDescription] = useState(activity?.description || "")
  const [activityType, setType] = useState<ActivityInput["activityType"]>(activity?.type || "EVENT")
  const [location, setLocation] = useState(activity?.location || "")
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const mode = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "publish" ? "publish" : "draft"
    if (busy) return
    setError(""); setFieldErrors({}); setBusy(true)
    try {
      await onSave(mode, { title: title.trim(), description: description.trim(), activityType, location: location.trim(), dateTime: campusToISO(date, time) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The activity could not be saved.")
      if (cause instanceof ApiError) setFieldErrors(cause.fieldErrors || {})
    } finally { setBusy(false) }
  }
  return <div className="page-wrap max-w-4xl">
    <Button variant="ghost" icon="arrow-left" disabled={busy} onClick={onBack}>Back to my activities</Button>
    <div className="mt-5"><PageHeader eyebrow={activity ? "Edit activity" : "New activity"} title={activity ? "Edit activity" : "Create an activity"} description="Complete the activity details, then save or publish." /></div>
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <fieldset disabled={busy} className="grid gap-6">
        <Field label="Activity title" error={fieldErrors.title}><Input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. International Film Night" /></Field>
        <Field label="Description" hint={`${description.length}/5000 characters`} error={fieldErrors.description}><Textarea required maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Activity type" error={fieldErrors.activityType}><Select value={activityType} onChange={event => setType(event.target.value as ActivityInput["activityType"])}><option value="EVENT">Event</option><option value="CLUB_ACTIVITY">Club activity</option></Select></Field>
          <Field label="Location" error={fieldErrors.location}><Input required maxLength={200} value={location} onChange={event => setLocation(event.target.value)} placeholder="Building and room" /></Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date"><Input required type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
          <Field label="Start time"><Input required type="time" value={time} onChange={event => setTime(event.target.value)} /></Field>
        </div>
        {fieldErrors.dateTime && <p role="alert" className="text-sm text-red-700">{fieldErrors.dateTime}</p>}
        <p className="flex gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-800"><Icon name="clock" />Campus time: {campusTimeZone}</p>
        {error && <ErrorNotice message={error} />}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
          <Button type="submit" variant="secondary" name="intent" value="draft">{busy ? "Saving…" : activity?.status === "PUBLISHED" ? "Save changes" : "Save draft"}</Button>
          {activity?.status !== "PUBLISHED" && <Button type="submit" name="intent" value="publish">{busy ? "Saving…" : "Publish activity"}</Button>}
        </div>
      </fieldset>
    </form>
  </div>
}

export function Roster({ activity, registrations, onBack }: { activity: Activity; registrations: RegistrationRecord[]; onBack: () => void }) {
  const [filter, setFilter] = useState("ALL")
  const visible = registrations.filter(record => filter === "ALL" || record.status === filter)
  return <div className="page-wrap">
    <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to my activities</Button>
    <div className="mt-5"><PageHeader eyebrow="Registration roster" title={activity.title} description={`${activity.registered} active registrations`} /></div>
    <div className="mt-6 flex flex-wrap gap-2">{["ALL", "ACTIVE", "CANCELLED"].map(status => <Button key={status} variant={status === filter ? "primary" : "secondary"} onClick={() => setFilter(status)}>{status === "ALL" ? "All loaded registrations" : status === "ACTIVE" ? "Active" : "Cancelled"}</Button>)}</div>
    <div className="mt-5 space-y-3">{visible.map(person => <article key={person.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-slate-950">{person.participant?.displayName || "Name unavailable"}</p><p className="break-all text-sm text-slate-500">{person.participant?.email || "Email unavailable"}</p></div>
      <div className="text-sm text-slate-500"><p>{formatDate(person.registeredAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p><p className="mt-1 font-semibold">{person.status}</p></div>
    </article>)}</div>
    {!visible.length && <div className="mt-5"><EmptyState icon="users" title="No registrations to show" description="Registrations matching this filter will appear here. Load more below if available." /></div>}
    <p className="mt-5 text-xs text-slate-500">Filters apply to loaded registrations. Only participant details needed for your activity are shown.</p>
  </div>
}
