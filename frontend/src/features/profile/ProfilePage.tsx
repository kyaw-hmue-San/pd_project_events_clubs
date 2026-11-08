import { useState } from "react"
import type { Profile } from "../../models"
import { Button, ErrorNotice, Field, Icon, Input, Loading, OperationNotice, PageHeader } from "../../components/ui"
import { useRemote } from "../../hooks/useRemote"
import { api, ApiError } from "../../lib/api"

export function ProfilePage({ onSaved }: { onSaved: () => void }) {
  const remote = useRemote("my-profile", api.me)
  return <div className="page-wrap">
    <PageHeader eyebrow="Account settings" title="My profile" description="Your personal information and campus access, in one place." />
    {remote.loading ? <Loading text="Loading your campus profile" variant="section" layout="profile" /> : remote.error || !remote.value
      ? <ErrorNotice message={remote.error || "Your profile is unavailable."} onRetry={remote.refresh} />
      : <ProfileForm profile={remote.value} onSaved={onSaved} />}
  </div>
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [name, setName] = useState(profile.name || "")
  const [savedName, setSavedName] = useState(profile.name || "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const changed = name.trim() !== savedName
  const access = profile.role === "ADMIN" ? "Admin" : [profile.capabilities.student && "Student", profile.capabilities.organizer && "Organizer"].filter(Boolean).join(" + ")
  const initials = savedName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join("").toUpperCase()
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !changed) return
    setBusy(true); setError(""); setFieldError(undefined)
    try {
      const saved = await api.updateProfile(name.trim())
      setName(saved.name || ""); setSavedName(saved.name || "")
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your username could not be saved.")
      if (cause instanceof ApiError) setFieldError(cause.fieldErrors?.name)
    } finally { setBusy(false) }
  }
  return <div className="mt-6 grid items-start gap-5 lg:grid-cols-3 lg:gap-6">
    <form onSubmit={submit} className="surface-card overflow-hidden lg:col-span-2">
      <div className="flex min-w-0 items-center gap-4 border-b border-slate-100 p-5 sm:p-6">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-100">{initials || <Icon name="user" className="size-5" />}</span>
        <div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-950">{savedName || "Your campus profile"}</h2><p className="mt-1 text-xs text-slate-500">{access} account</p></div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div><h3 className="text-sm font-semibold text-slate-900">Personal information</h3><p className="mt-1 text-sm leading-6 text-slate-500">Choose the name people see on your activities and participant lists.</p></div>
        <Field label="Username" hint="1–80 characters. This display name does not need to be unique." error={fieldError}><Input required autoComplete="nickname" maxLength={80} value={name} disabled={busy} onChange={event => { setName(event.target.value); setFieldError(undefined) }} /></Field>
        {error && <ErrorNotice message={error} />}
        {busy && <OperationNotice title="Saving your username" description="Updating your campus display name. Your account access stays the same." />}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
        <Button type="button" variant="secondary" disabled={busy || name === savedName} onClick={() => { setName(savedName); setError(""); setFieldError(undefined) }}>Reset</Button>
        <Button type="submit" busy={busy} busyFeedback="notice" disabled={!changed} icon="check">Save changes</Button>
      </div>
    </form>
    <section className="surface-card overflow-hidden" aria-labelledby="account-details-heading">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 id="account-details-heading" className="text-sm font-semibold text-slate-900">Account details</h2></div>
      <dl className="space-y-5 p-5 text-sm sm:p-6">
        <div><dt className="text-xs font-medium text-slate-500">Google email</dt><dd className="mt-1.5 break-all leading-6 text-slate-800">{profile.email || "Unavailable"}</dd></div>
        <div><dt className="text-xs font-medium text-slate-500">University ID</dt><dd className="mt-1.5 break-all text-slate-800">{profile.universityId || "Not applicable"}</dd></div>
        <div><dt className="text-xs font-medium text-slate-500">Campus access</dt><dd className="mt-2 flex flex-wrap gap-2">{access.split(" + ").map(item => <span key={item} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">{item}</span>)}</dd></div>
      </dl>
      <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6"><Icon name="lock" className="mt-0.5 size-3.5 shrink-0" /><p>Email, university ID and access are managed by the school.</p></div>
    </section>
  </div>
}
