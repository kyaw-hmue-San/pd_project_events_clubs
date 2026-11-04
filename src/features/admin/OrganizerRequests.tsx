import { useState } from "react"
import { Button, EmptyState, ErrorNotice, Field, Loading, Modal, PageHeader, Textarea, Toast } from "../../components/ui"
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
    <PageHeader eyebrow="Admin review" title="Organizer requests" description="Review each applicant's identity, organization and reason before granting Organizer access." actions={<Button variant="secondary" onClick={() => setVersion(value => value + 1)}>Refresh requests</Button>} />
    <div className="mt-7 flex flex-wrap gap-2">{(["PENDING", "APPROVED", "REJECTED"] as const).map(item => <Button key={item} variant={status === item ? "primary" : "secondary"} onClick={() => setStatus(item)}>{item === "PENDING" ? "Pending" : item === "APPROVED" ? "Approved" : "Rejected"}</Button>)}</div>
    {page.error && <ErrorNotice message={page.error} onRetry={page.retry} />}
    <div className="mt-5 space-y-4">{page.items.map(request => <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-lg font-bold text-slate-950">{request.organization}</h2><p className="mt-1 text-sm text-slate-600">{request.name || "Name unavailable"}</p><p className="mt-1 break-all text-sm text-slate-600">{request.email}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{request.status}</span></div>
      <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{request.reason}</p>
      {request.decisionReason && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Decision reason: {request.decisionReason}</p>}
      {request.status === "PENDING" && <div className="mt-5 flex gap-3"><Button onClick={() => openReview(request, "APPROVE")}>Approve</Button><Button variant="secondary" onClick={() => openReview(request, "REJECT")}>Reject</Button></div>}
    </article>)}</div>
    {page.loading && <Loading text="Loading requests…" />}
    {!page.loading && !page.error && !page.items.length && <div className="mt-6"><EmptyState icon="users" title="No requests to review" description="Requests matching this status will appear here." /></div>}
    {page.nextCursor && !page.loading && <Button variant="secondary" className="mt-5" onClick={page.more}>Load more requests</Button>}
    <Modal open={Boolean(review)} title={review?.decision === "APPROVE" ? "Approve Organizer access?" : "Reject this request?"} onClose={() => !busy && setReview(null)}>
      <form onSubmit={decide} className="space-y-5"><p className="break-all text-sm leading-6 text-slate-600">{review?.decision === "APPROVE" ? `This will let ${review.request.email} create and publish activities for ${review.request.organization}.` : `Explain why ${review?.request.email}'s request is not approved.`}</p>
        {review?.decision === "REJECT" && <Field label="Reason for rejection"><Textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></Field>}
        {error && <ErrorNotice message={error} />}
        <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={busy} onClick={() => setReview(null)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : review?.decision === "APPROVE" ? "Confirm approval" : "Confirm rejection"}</Button></div>
      </form>
    </Modal>
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </div>
}
