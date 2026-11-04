import { useState } from "react"
import { Button, ErrorNotice, Field, Input, Loading, PageHeader, Textarea } from "../../components/ui"
import { useRemote } from "../../hooks/useRemote"
import { api, ApiError } from "../../lib/api"
import type { OrganizerRequest } from "../../models"

export function OrganizerAccess({ onRefreshAccess, onLogout, email }: { onRefreshAccess: () => void; onLogout?: () => Promise<void>; email?: string | null }) {
  const remote = useRemote("own-organizer-request", api.organizerRequest)
  const [logoutError, setLogoutError] = useState("")
  const request = remote.value?.request
  return <div className="page-wrap max-w-3xl">
    <PageHeader eyebrow="Campus access" title="Request Organizer access" description="Tell the school which club or organization you represent and why you want to hold activities." />
    {email && <p className="mt-4 break-all text-sm text-slate-600">Signed in as {email}</p>}
    {onLogout && <p className="mt-3 text-sm leading-6 text-slate-600">Student access is limited to @lamduan.mfu.ac.th accounts. Other Google accounts can request Organizer access here.</p>}
    {remote.loading ? <Loading /> : remote.error ? <ErrorNotice message={remote.error} onRetry={remote.refresh} /> : <>
      {request?.status === "PENDING" && <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-6" role="status">
        <h2 className="font-bold text-amber-950">Pending Admin approval</h2><p className="mt-2 text-sm text-amber-900">Your request for {request.organization} has been submitted. Organizer permissions become available after approval.</p>
      </section>}
      {request?.status === "APPROVED" && <section className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="font-bold text-emerald-950">Organizer access approved</h2><p className="mt-2 text-sm text-emerald-900">You can now create and manage campus activities.</p>
      </section>}
      {request?.status === "REJECTED" && <section className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-bold text-red-900">Request not approved</h2><p className="mt-2 whitespace-pre-wrap text-sm text-red-800">{request.decisionReason}</p><p className="mt-2 text-sm text-red-800">You can update your details and submit a new request below.</p></section>}
      {(!request || request.status === "REJECTED") && <RequestForm key={request?.revision || 0} request={request} onSubmitted={remote.refresh} />}
    </>}
    <div className="mt-5 flex flex-wrap gap-3">
      <Button variant="secondary" onClick={remote.refresh}>Refresh request status</Button>
      {(request?.status === "PENDING" || request?.status === "APPROVED") && <Button onClick={onRefreshAccess}>{request.status === "APPROVED" ? "Continue to Organizer workspace" : "Check my access"}</Button>}
      {onLogout && <Button variant="ghost" onClick={() => void onLogout().catch(() => setLogoutError("Sign-out failed. Please try again."))}>Use another Google account</Button>}
    </div>
    {logoutError && <ErrorNotice message={logoutError} />}
  </div>
}
function RequestForm({ request, onSubmitted }: { request?: OrganizerRequest | null; onSubmitted: () => void }) {
  const [organization, setOrganization] = useState(request?.organization || "")
  const [reason, setReason] = useState(request?.reason || "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(""); setFieldErrors({})
    try { await api.submitOrganizerRequest({ organization: organization.trim(), reason: reason.trim() }); onSubmitted() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The request could not be submitted."); if (cause instanceof ApiError) setFieldErrors(cause.fieldErrors || {}) }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
    <Field label="Club or organization" error={fieldErrors.organization}><Input required maxLength={160} value={organization} onChange={event => setOrganization(event.target.value)} disabled={busy} /></Field>
    <Field label="Why do you need Organizer access?" hint="Include your school connection and the activities you plan to hold." error={fieldErrors.reason}><Textarea required minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></Field>
    {error && <ErrorNotice message={error} />}
    <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit Organizer request"}</Button>
  </form>
}
