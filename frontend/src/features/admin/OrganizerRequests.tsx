import { AdmissionAnalysis } from "../auth/AdmissionAnalysis"
import { useState } from "react"
import { Badge, Button, EmptyState, ErrorNotice, Field, Loading, Modal, OperationNotice, PageHeader, SegmentedControl, Textarea, Toast } from "../../components/ui"
import { usePaged } from "../../hooks/useRemote"
import { api } from "../../lib/api"
import type { OrganizerRequest, RequestStatus } from "../../models"

export function OrganizerRequests() {
  const [status, setStatus] = useState<RequestStatus>("PENDING")
  const [version, setVersion] = useState(0)
  const page = usePaged(`admin-organizer-requests/${status}/${version}`, cursor => api.adminOrganizerRequests(status, cursor))
  const [review, setReview] = useState<{ request: OrganizerRequest; decision: "APPROVE" | "REJECT" } | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const openReview = (request: OrganizerRequest, decision: "APPROVE" | "REJECT") => { setError(""); setReason(""); setReview({ request, decision }) }
  const decide = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!review || busy) return
    setBusy(true); setError("")
    try {
      await api.reviewOrganizerRequest(review.request.id, { decision: review.decision, revision: review.request.revision,
        ...(review.decision === "REJECT" ? { reason: reason.trim() } : {}) })
      setToast(review.decision === "APPROVE" ? "Organizer access approved." : "Request rejected.")
      setReview(null); setVersion(value => value + 1)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The review could not be saved.") }
    finally { setBusy(false) }
  }
  return <div className="page-wrap">
    <PageHeader eyebrow="Admin review" title="Organizer requests" description="Review applicants and manage access to campus event tools." actions={<Button variant="secondary" size="sm" icon="refresh" busy={page.loading} busyLabel="Refreshing…" onClick={page.refresh}>Refresh requests</Button>} />
    <div className="mt-6"><SegmentedControl<RequestStatus> label="Request status" value={status} items={[{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} onChange={setStatus} /></div>
    {page.error && <ErrorNotice message={page.error} onRetry={page.retry} />}
    <div className="motion-list mt-5 space-y-4">{page.items.map(request => <article key={request.id} className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-base font-semibold text-slate-950">{request.organization}</h2><p className="mt-1 text-sm text-slate-600">{request.name || "Name unavailable"}</p><p className="mt-1 break-all text-sm text-slate-500">{request.email}</p></div><Badge status={request.status} /></div>
      <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{request.reason}</p>
      {request.status !== 'PENDING' && <p className="mt-3 text-xs font-semibold text-slate-500">{request.decisionSource === 'AI' ? 'Approved automatically by AI' : 'Reviewed by Admin'}</p>}
      <AdmissionAnalysis review={request.aiReview} />
      {request.decisionReason && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Decision reason: {request.decisionReason}</p>}
      {request.status === "PENDING" && <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><Button icon="check" onClick={() => openReview(request, "APPROVE")}>Approve</Button><Button variant="danger-ghost" icon="close" onClick={() => openReview(request, "REJECT")}>Reject</Button></div>}
    </article>)}</div>
    {page.loading && <Loading text={page.items.length ? "Updating the review queue" : "Loading Organizer requests"} variant={page.items.length ? "inline" : "section"} />}
    {!page.loading && !page.error && !page.items.length && <div className="mt-6"><EmptyState icon="users" title="No requests to review" description="Requests matching this status will appear here." /></div>}
    {page.nextCursor && !page.loading && <Button variant="secondary" className="mt-5" onClick={page.more}>Load more requests</Button>}
    <Modal open={Boolean(review)} busy={busy} title={review?.decision === "APPROVE" ? "Approve Organizer access?" : "Reject this request?"} onClose={() => !busy && setReview(null)}>
      <form onSubmit={decide} className="space-y-5"><p className="break-all text-sm leading-6 text-slate-600">{review?.decision === "APPROVE" ? `This will let ${review.request.email} create and publish activities for ${review.request.organization}.` : `Explain why ${review?.request.email}'s request is not approved.`}</p>
        {review?.decision === "REJECT" && <Field label="Reason for rejection"><Textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></Field>}
        {error && <ErrorNotice message={error} />}
        {busy && <OperationNotice title={review?.decision === "APPROVE" ? "Approving Organizer access" : "Saving your review decision"} description="Checking the applicant and confirming this request version." />}
        <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={busy} onClick={() => setReview(null)}>Cancel</Button><Button type="submit" variant={review?.decision === "REJECT" ? "danger" : "primary"} busy={busy} busyLabel="Saving decision…">{review?.decision === "APPROVE" ? "Confirm approval" : "Confirm rejection"}</Button></div>
      </form>
    </Modal>
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </div>
}
