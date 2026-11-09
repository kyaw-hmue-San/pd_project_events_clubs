import { useEffect, useRef } from 'react'
import { BrandLogo } from '../../components/BrandLogo'

export const privacyContactEmail = '6731503062@lamduan.mfu.ac.th'

// Open separately so reading the notice never discards an unfinished form.
export function PrivacyLink({ className = '' }: { className?: string }) {
  return <a href="#privacy" target="_blank" rel="noopener noreferrer" className={`font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${className}`} aria-label="Privacy and data use (opens in a new tab)">Privacy and data use</a>
}

const dataUses = [
  ['Google identity and profile', 'Google account ID, verified email and display name identify your account. A university ID is required separately for Student enrollment. Without these details, the corresponding workspace cannot open.'],
  ['Activities and attendance', 'Activity details, registrations, cancellations and attendance let us run events and show your history. Your ticket contains a private code; keep it and its QR image private.'],
  ['Organizer applications', 'Your organization, reason and review decisions support Organizer access checks. Avoid including identity documents, health information or other sensitive information in free-text fields.'],
  ['Facilities and technical records', 'Reviewed facilities requirements and work-order references support Maintenance coordination. API request IDs, route, role, time and result support troubleshooting; our application request logs exclude authorization headers and request bodies.'],
]

export function PrivacyPage() {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0) }, [])
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="app-container flex flex-wrap items-center justify-between gap-4 py-4"><BrandLogo height={40} /><a href="#" className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">Open application</a></div></header>
    <main className="page-wrap max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Your information</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-3xl font-bold tracking-tight outline-none sm:text-4xl">Privacy and data use</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Campus Events & Clubs · Team 12 · Updated 9 November 2026</p>
      <p className="mt-5 text-sm leading-7 text-slate-700">Team 12 operates this university mini project to help people discover activities, register, organize events and coordinate facilities. This notice describes the current application. It does not represent an official university privacy policy.</p>
      <section aria-labelledby="privacy-data" className="surface-card mt-7 p-5 sm:p-7">
        <h2 id="privacy-data" className="text-lg font-semibold">What we collect and why</h2>
        <dl className="mt-5 space-y-5">{dataUses.map(([title, description]) => <div key={title}><dt className="text-sm font-semibold">{title}</dt><dd className="mt-1 text-sm leading-7 text-slate-600">{description}</dd></div>)}</dl>
      </section>
      <section aria-labelledby="privacy-access" className="surface-card mt-5 p-5 sm:p-7">
        <h2 id="privacy-access" className="text-lg font-semibold">Who can see your information</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">You can view your profile, registrations and tickets. An activity’s owning Organizer can see its participants’ names, emails and attendance. Admin reviews Organizer applications and sees activity summaries, but has no participant-roster or ticket access. Authorized project operators maintain the service and handle data requests. Activity titles, descriptions and Organizer display names are visible to people allowed to browse those activities.</p>
      </section>
      <section aria-labelledby="privacy-sharing" className="surface-card mt-5 p-5 sm:p-7">
        <h2 id="privacy-sharing" className="text-lg font-semibold">Cloud services, AI and partner systems</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">
          <li>Google/Firebase handles sign-in, hosting and stored application data. Render runs our API. These providers may process connection metadata under their own terms, including outside Thailand; specific processing regions and transfer arrangements need operator confirmation.</li>
          <li>AI/ML API receives the planning brief you choose to submit, or the organization and reason in an Organizer application. Clear applications may receive automatic Organizer approval; uncertain cases stay with Admin, and AI never rejects an application. You can contact us to request human review.</li>
          <li>Library relevance checks can send a published activity’s title and description to AI/ML API when an eligible Student opens its details. Resource suggestions use the same public text. We do not attach your Google token, email, university ID or participant roster to these AI prompts. Free text may still contain personal information, so leave it out.</li>
          <li>Only an Organizer’s explicit reviewed facilities submission sends the activity ID, title, requirements, schedule, location and category to Team 10. Maintenance returns a work-order reference and signed status updates. Saving or publishing alone does not send the facilities request.</li>
          <li>Library and Internship connections are read-only. Our backend sends search terms and filters, without your Google identity, token or Student profile. Following a partner link opens their website, where their own privacy practices apply.</li>
        </ul>
      </section>
      <section aria-labelledby="privacy-retention" className="surface-card mt-5 p-5 sm:p-7">
        <h2 id="privacy-retention" className="text-lg font-semibold">Storage and retention</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">The application uses browser storage for Google sign-in persistence and your workspace preference. Signing out ends local access; it does not delete your records. Cancelling a registration keeps its history. Camera and ticket-image decoding happen on your device; verification sends the ticket code rather than the image.</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">Our project policy is to review routine technical logs for deletion or anonymization after 30 days, and remove or anonymize identifiable project records within 90 days after the final evaluation. Cleanup is manually reviewed by a trusted operator; automatic expiry is not implemented. Active request/retry records stay available until safely reviewed. A specific legal or security need may require limited retention, which we will explain when handling your request.</p>
      </section>
      <section aria-labelledby="privacy-rights" className="surface-card mt-5 p-5 sm:p-7">
        <h2 id="privacy-rights" className="text-lg font-semibold">Your choices and requests</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">You can edit your display name in My profile and cancel an eligible registration in My registrations. To ask for access or a copy, correction, deletion, restriction, objection, applicable portability, withdrawal of consent where consent is used, or human review of an Organizer decision, email our project contact. Requests are reviewed after proportionate identity verification and are subject to applicable requirements and exceptions. Reading this notice or signing in is not a blanket consent to unrelated uses. You may also complain to Thailand’s Personal Data Protection Committee.</p>
        <a className="mt-5 inline-block break-all font-medium text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-600" href={`mailto:${privacyContactEmail}?subject=Campus%20Events%20%26%20Clubs%20privacy%20request`}>{privacyContactEmail}</a>
        <p className="mt-3 text-xs leading-6 text-slate-500">State the type of request and how we can reply. Never send a password, sign-in token, service-account key or QR ticket. This mailbox starts a manual review; it does not automatically change or delete records.</p>
      </section>
    </main>
  </div>
}
