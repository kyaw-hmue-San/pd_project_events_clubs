import type { AdmissionReview } from '../../models'
import { Icon, OperationNotice } from '../../components/ui'
const labels: Record<string, string> = { campusActivity: 'Specific campus activity', purposeAndAudience: 'Purpose and audience', organizerIdentity: 'Organizer identity', responsibility: 'Organizing responsibility' }
export function AdmissionAnalysis({ review }: { review?: AdmissionReview | null }) {
  if (!review) return null
  if (review.status === 'PROCESSING') return <OperationNotice title="Reviewing your Organizer application" description="Checking your application against the approval criteria. Refresh status for the latest decision." />
  return <section aria-label="Application assessment" className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-950"><Icon name={review.source === 'AI' ? 'spark' : 'info'} className="size-4" />{review.source === 'AI' ? 'AI application assessment' : 'Manual review required'}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-700">{review.summary}</p>
    {review.reason === 'AUTO_APPROVAL_DISABLED' && <p className="mt-2 text-xs text-slate-600">The criteria appear complete, but automatic approval is disabled. Admin will decide.</p>}
    {review.criteria && <ul className="mt-3 space-y-2">{Object.entries(review.criteria).map(([key, criterion]) => <li key={key} className="text-xs leading-5 text-slate-600"><span className={`font-semibold ${criterion.met ? 'text-emerald-700' : 'text-amber-800'}`}>{criterion.met ? 'Clear' : 'Needs clarification'} · {labels[key] || key}</span>{criterion.evidence && <p className="mt-0.5 break-words">“{criterion.evidence}”</p>}</li>)}</ul>}
    {review.concerns && review.concerns.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">{review.concerns.map((item, index) => <li key={index}>{item}</li>)}</ul>}
    {review.source === 'AI' && <p className="mt-3 text-xs leading-5 text-slate-500">Assesses the supplied application text; it does not verify club membership or institutional endorsement.</p>}
  </section>
}
