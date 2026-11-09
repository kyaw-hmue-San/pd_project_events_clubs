import { useEffect, useRef, useState } from "react"
import { Button, ErrorNotice, Field, Icon, Input, Loading, LoadingScreen, OperationNotice, PageHeader, Textarea } from "../../components/ui"
import { useRemote } from "../../hooks/useRemote"
import { api, ApiError } from "../../lib/api"
import { AdmissionAnalysis } from "./AdmissionAnalysis"
import { PrivacyLink } from '../privacy/PrivacyPage'
import type { OrganizerRequest } from "../../models"

export function OrganizerAccess({ onRefreshAccess, onLogout, email }: { onRefreshAccess: () => void; onLogout?: () => Promise<void>; email?: string | null }) {
  const remote = useRemote("own-organizer-request", api.organizerRequest)
  const [logoutError, setLogoutError] = useState("")
  const [signingOut, setSigningOut] = useState(false)
  const request = remote.value?.request
  const refresh = useRef(remote.refresh)
  refresh.current = remote.refresh
  useEffect(() => {
    if (request?.aiReview?.status !== 'PROCESSING') return
    const timer = window.setInterval(() => { if (!document.hidden) refresh.current() }, 5000)
    return () => window.clearInterval(timer)
  }, [request?.aiReview?.status])
  if (signingOut) return <LoadingScreen text="Signing you out" description="Closing your Google campus session." />
  return <div className="page-wrap max-w-3xl">
    <PageHeader eyebrow="Campus access" title="Request Organizer access" description="Describe your campus activity, intended audience and organizing responsibilities." />
    <p className="mt-3 text-xs leading-6 text-slate-500"><PrivacyLink /></p>
    {email && <p className="mt-4 break-all text-sm text-slate-600">Signed in as {email}</p>}
    {onLogout && <p className="mt-3 text-sm leading-6 text-slate-600">Student access is limited to @lamduan.mfu.ac.th accounts. Other Google accounts can request Organizer access here.</p>}
    {remote.loading && !remote.value ? <Loading text="Loading your Organizer request" variant="section" /> : remote.error ? <ErrorNotice message={remote.error} onRetry={remote.refresh} /> : <>
      {remote.loading && request?.aiReview?.status !== 'PROCESSING' && <OperationNotice title="Checking your request status" description="Getting the latest review decision." />}
      {request?.status === "PENDING" && request.aiReview?.status !== 'PROCESSING' && <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-6" role="status">
        <h2 className="font-bold text-amber-950">Pending Admin approval</h2><p className="mt-2 text-sm text-amber-900">Your request for {request.organization} has been submitted. Requests meeting every AI approval criterion can be approved automatically. Other requests stay with Admin for review.</p>
      </section>}
      {request?.status === "APPROVED" && <section className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="flex items-center gap-2 font-bold text-emerald-950"><span aria-hidden="true" className="motion-success-icon inline-flex rounded-full bg-emerald-100 p-1"><Icon name="check" className="size-4" /></span>Organizer access approved</h2><p className="mt-2 text-sm text-emerald-900">{request.decisionSource === 'AI' ? 'Approved automatically by AI under the campus approval criteria.' : 'Approved by Admin.'} You can now create and manage campus activities.</p>
      </section>}
      <AdmissionAnalysis review={request?.aiReview} />
      {request?.status === "REJECTED" && <section className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-bold text-red-900">Request not approved</h2><p className="mt-2 whitespace-pre-wrap text-sm text-red-800">{request.decisionReason}</p><p className="mt-2 text-sm text-red-800">You can update your details and submit a new request below.</p></section>}
      {(!request || request.status === "REJECTED") && <RequestForm key={request?.revision || 0} request={request} onSubmitted={remote.refresh} />}
    </>}
    <div className="mt-5 flex flex-wrap gap-3">
      <Button variant="secondary" busy={remote.loading} busyFeedback="notice" onClick={remote.refresh}>Refresh request status</Button>
      {(request?.status === "PENDING" || request?.status === "APPROVED") && <Button disabled={remote.loading} onClick={() => { if (request.status === "APPROVED") window.location.hash = "organizer-activities"; onRefreshAccess() }}>{request.status === "APPROVED" ? "Continue to Organizer workspace" : "Check my access"}</Button>}
      {onLogout && <Button variant="ghost" onClick={() => { setSigningOut(true); void onLogout().catch(() => { setSigningOut(false); setLogoutError("Sign-out failed. Please try again.") }) }}>Use another Google account</Button>}
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
    <Field label="Why do you need Organizer access?" hint="Describe a specific campus activity, its purpose/audience, and your own organizing responsibilities. Independent organizers are welcome." error={fieldErrors.reason}><Textarea required minLength={10} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></Field>
    <p className="text-xs leading-5 text-slate-500">AI helps review your application. Clear applications may be approved automatically; anything needing clarification goes to Admin. Applications are never rejected automatically.</p>
    <p className="text-xs leading-5 text-slate-500">Leave out sensitive information and identity documents. Contact the project team if you need human review.</p>
    {error && <ErrorNotice message={error} />}
    {busy && <OperationNotice title="Reviewing your Organizer application" description="Saving your request and checking the approval criteria. Uncertain results stay pending for Admin." />}
    <Button type="submit" busy={busy} busyFeedback="notice">Submit Organizer request</Button>
  </form>
}
