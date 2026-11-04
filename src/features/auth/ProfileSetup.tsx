import { useState } from "react"
import { api, ApiError } from "../../lib/api"
import { Button, ErrorNotice, Field, Icon, Input } from "../../components/ui"

export function ProfileSetup({ email, onComplete, onLogout }: { email: string | null; onComplete: () => void; onLogout: () => Promise<void> }) {
  const [universityId, setUniversityId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(""); setFieldError(undefined)
    try { await api.completeProfile(universityId.trim()); onComplete() }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.")
      if (cause instanceof ApiError) setFieldError(cause.fieldErrors?.universityId)
    } finally { setBusy(false) }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-xl bg-blue-700 text-white"><Icon name="spark" /></span>
      <h1 className="mt-6 text-2xl font-bold text-slate-950">Complete your campus profile</h1>
      <p className="mt-3 break-all text-sm text-slate-600">Signed in as {email}.</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">Enter your university ID once to start using Campus Pulse as a Student.</p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="University ID" error={fieldError}><Input required autoComplete="off" maxLength={40} pattern={"[A-Za-z0-9\\-]{1,40}"} value={universityId} onChange={event => setUniversityId(event.target.value)} disabled={busy} /></Field>
        {error && <ErrorNotice message={error} />}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving profile…" : "Continue to campus"}</Button>
      </form>
      <Button variant="ghost" className="mt-4 w-full" disabled={busy} onClick={() => void onLogout().catch(() => setError("Sign-out failed. Please try again."))}>Use another Google account</Button>
    </section>
  </main>
}
