import { useState } from 'react'
import type { ActivityInput, PlanSuggestion } from '../../models'
import { api } from '../../lib/api'
import { Button, ErrorNotice, Field, Icon, Input, Modal, OperationNotice, Textarea } from '../../components/ui'

type TextFields = Pick<ActivityInput, 'title' | 'description' | 'facilitiesNotes'>
type Section = 'title' | 'description' | 'agenda' | 'checklist' | 'facilities'
const durationLabel = (minutes: number) => [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} ${minutes >= 120 ? 'hours' : 'hour'}` : '', minutes % 60 ? `${minutes % 60} ${minutes % 60 === 1 ? 'minute' : 'minutes'}` : ''].filter(Boolean).join(' ')
const fallbackMessage = (reason?: string) => ({
  TIMEOUT: 'AI is taking longer than expected. Try again or use this starter plan.',
  NOT_CONFIGURED: 'AI is unavailable right now. You can use this starter plan.',
  PROVIDER_UNAVAILABLE: 'AI is unavailable right now. Try again or use this starter plan.',
  INVALID_RESPONSE: 'We couldn’t create an AI plan this time. You can use this starter plan.',
}[reason || ''] || 'AI is unavailable right now. You can use this starter plan.')
export function DraftAssistant({ disabled, current, activityType, onApply }: { disabled: boolean; current: TextFields; activityType: ActivityInput['activityType']; onApply: (draft: Partial<TextFields>) => void }) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState(''), [audience, setAudience] = useState(''), [purpose, setPurpose] = useState('')
  const [hours, setHours] = useState('2'), [minutes, setMinutes] = useState('0'), [participants, setParticipants] = useState('50')
  const duration = Number(hours) * 60 + Number(minutes)
  const durationValid = hours.trim() !== '' && minutes.trim() !== '' && Number.isInteger(Number(hours)) && Number.isInteger(Number(minutes)) && Number(hours) >= 0 && Number(hours) <= 8 && Number(minutes) >= 0 && Number(minutes) <= 59 && duration >= 15 && duration <= 480
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState<PlanSuggestion | null>(null)
  const [selected, setSelected] = useState<Section[]>(['title', 'description', 'agenda', 'checklist'])
  const [confirmed, setConfirmed] = useState(false)
  const generate = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy || !durationValid) return
    setBusy(true); setError(''); setSuggestion(null); setConfirmed(false)
    try { setSuggestion(await api.generatePlan({ topic: topic.trim(), audience: audience.trim(), purpose: purpose.trim(), activityType, durationMinutes: duration, participants: Number(participants) })) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The plan could not be generated. Your activity form is preserved.') }
    finally { setBusy(false) }
  }
  const plan = suggestion?.plan
  const updates: Partial<TextFields> = {}
  if (plan) {
    if (selected.includes('title')) updates.title = plan.title
    const sections: string[] = []
    if (selected.includes('description')) sections.push(plan.description)
    if (selected.includes('agenda')) sections.push(`Suggested agenda (${suggestion.brief.durationMinutes} minutes)\n${plan.agenda.map(item => `${item.startMinute}–${item.endMinute} min: ${item.title}`).join('\n')}`)
    if (selected.includes('checklist')) sections.push(`Preparation checklist\n${Object.entries(plan.checklist).map(([stage, items]) => `${stage.toUpperCase()}\n${items.map(item => `• ${item}`).join('\n')}`).join('\n\n')}`)
    if (sections.length) updates.description = [!selected.includes('description') ? current.description : '', ...sections].filter(Boolean).join('\n\n')
    if (selected.includes('facilities')) updates.facilitiesNotes = plan.draft.facilitiesNotes
  }
  const replace = (updates.title !== undefined && Boolean(current.title.trim())) || (updates.description !== undefined && selected.includes('description') && Boolean(current.description.trim())) || (updates.facilitiesNotes !== undefined && Boolean(current.facilitiesNotes?.trim()))
  const tooLong = (updates.description?.length || 0) > 5000
  const choose = (section: Section) => { setSelected(value => value.includes(section) ? value.filter(item => item !== section) : [...value, section]); setConfirmed(false) }
  return <>
    <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 ring-1 ring-blue-100"><Icon name="spark" /></span><div><h2 className="text-base font-semibold text-blue-950">AI Event Planning Copilot</h2><p className="mt-1 text-sm leading-6 text-slate-600">Turn an idea into a timed agenda, preparation checklist and facilities suggestions.</p></div></div>
      <Button className="mt-4 shrink-0 sm:mt-0" icon="spark" disabled={disabled} onClick={() => { setConfirmed(false); setOpen(true) }}>Plan with AI</Button>
    </div>
    <Modal open={open} size="wide" busy={busy} title="AI Event Planning Copilot" onClose={() => !busy && setOpen(false)}>
      {suggestion && plan ? <div className="motion-plan">
        <div className={`rounded-xl p-4 text-sm ${suggestion.source === 'AI' ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 text-amber-900'}`}><p className="font-semibold">{suggestion.source === 'AI' ? 'AI-generated event plan' : 'Starter plan'}</p><p className="mt-1 text-xs leading-5">{suggestion.source === 'AI' ? 'Review the plan and confirm equipment, availability and costs before applying.' : fallbackMessage(suggestion.fallbackReason)}</p></div>
        <h3 className="mt-5 break-words text-xl font-bold">{plan.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{plan.description}</p>
        <section className="mt-5"><h4 className="text-sm font-semibold">Timed agenda · {durationLabel(suggestion.brief.durationMinutes)}</h4><p className="mt-1 text-xs text-slate-500">Relative minutes from the start; your actual event schedule stays unchanged.</p><ol className="mt-3 space-y-2">{plan.agenda.map((item, index) => <li key={index} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span className="shrink-0 font-mono text-xs text-blue-700">{item.startMinute}–{item.endMinute} min</span><span>{item.title}</span></li>)}</ol></section>
        <section className="mt-5"><h4 className="text-sm font-semibold">Preparation checklist</h4><div className="mt-3 grid gap-3 sm:grid-cols-3">{Object.entries(plan.checklist).map(([stage, items]) => <div key={stage} className="rounded-xl border border-slate-200 p-3"><h5 className="text-xs font-semibold capitalize text-blue-700">{stage}</h5><ul className="mt-2 list-disc space-y-2 pl-4 text-xs leading-5 text-slate-600">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>)}</div></section>
        <section className="mt-5"><h4 className="text-sm font-semibold">Suggested facilities</h4><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-slate-600">{plan.facilities.map((item, index) => <li key={index}>{item}</li>)}</ul><p className="mt-2 text-xs text-slate-500">Applying these notes does not send a maintenance request or reserve equipment.</p></section>
        <section className="mt-5 rounded-xl bg-amber-50 p-4"><h4 className="text-xs font-semibold text-amber-900">Assumptions to confirm</h4><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">{plan.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
        <fieldset className="mt-5 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Choose sections to apply</legend><div className="grid gap-2 sm:grid-cols-2">{([['title', 'Title'], ['description', 'Description'], ['agenda', 'Timed agenda'], ['checklist', 'Preparation checklist'], ['facilities', 'Facilities notes']] as [Section, string][]).map(([section, label]) => <label key={section} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-blue-600" checked={selected.includes(section)} onChange={() => choose(section)} />{label}</label>)}</div><p className="mt-2 text-xs leading-5 text-slate-500">Agenda/checklist append to your existing description unless Description is also selected. Other form fields remain unchanged.</p></fieldset>
        {replace && <label className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-blue-600" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I reviewed replacing my existing text in the selected fields.</label>}
        {tooLong && <ErrorNotice message="These sections exceed the 5,000-character description limit. Deselect sections or shorten your existing text." />}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => setSuggestion(null)}>Edit brief</Button><Button icon="check" disabled={!selected.length || tooLong || (replace && !confirmed)} onClick={() => { onApply(updates); setOpen(false); setSuggestion(null); setConfirmed(false) }}>Apply selected sections</Button></div>
      </div> : <form onSubmit={generate} className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">Describe your idea to get an agenda, preparation checklist and facilities suggestions. Review the plan before adding it to your activity. AI uses the brief you submit; leave out personal or sensitive information.</p>
        <fieldset disabled={busy} className="space-y-4">
          <Field label="Activity idea"><Input required minLength={3} maxLength={160} value={topic} onChange={event => setTopic(event.target.value)} placeholder="Beginner Python workshop" /></Field>
          <Field label="Who is it for?"><Input required minLength={3} maxLength={160} value={audience} onChange={event => setAudience(event.target.value)} placeholder="MFU students new to coding" /></Field>
          <Field label="Purpose and goals"><Textarea required minLength={10} maxLength={600} value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="What should participants learn or experience?" /></Field>
          <div className="grid items-start gap-4 sm:grid-cols-[2fr_1fr]">
            <section aria-labelledby="planning-duration-heading" className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 id="planning-duration-heading" className="mb-3 text-sm font-semibold text-slate-800">Planned duration</h3>
              <div className="grid grid-cols-2 gap-3"><Field label="Hours"><Input type="number" required min={0} max={8} step={1} value={hours} onChange={event => setHours(event.target.value)} /></Field><Field label="Minutes"><Input type="number" required min={0} max={59} step={1} value={minutes} onChange={event => setMinutes(event.target.value)} /></Field></div>
              <div role="group" aria-label="Common durations" className="mt-3 flex flex-wrap gap-1.5">{[30, 60, 90, 120, 180].map(value => <button type="button" key={value} aria-label={`Set duration to ${durationLabel(value)}`} aria-pressed={durationValid && duration === value} onClick={() => { setHours(String(Math.floor(value / 60))); setMinutes(String(value % 60)) }} className={`min-h-11 rounded-lg border sm:min-h-9 px-2.5 text-xs font-medium transition-colors ${durationValid && duration === value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>{value < 60 ? `${value} min` : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}m` : ''}`}</button>)}</div>
              <p aria-live="polite" className={`mt-3 text-xs ${durationValid ? 'text-slate-600' : 'text-amber-800'}`}>{durationValid ? `Total: ${durationLabel(duration)}` : 'Choose a duration between 15 minutes and 8 hours.'}</p>
            </section>
            <Field label="Estimated participants" hint="Planning estimate only; your event capacity stays unchanged."><Input type="number" required min={1} max={100000} step={1} value={participants} onChange={event => setParticipants(event.target.value)} /></Field>
          </div>
        </fieldset>
        {busy && <OperationNotice title="Building your event plan" description="Writing the agenda, checklist and facilities suggestions. This can take up to 45 seconds. Your form is preserved." />}
        {error && <ErrorNotice message={error} />}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" icon="spark" disabled={!durationValid} busy={busy} busyFeedback="notice">Generate event plan</Button></div>
      </form>}
    </Modal>
  </>
}
