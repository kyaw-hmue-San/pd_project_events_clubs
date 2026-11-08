import { ActivityDescription } from "../../components/ActivityDescription"
import { BrandLogo } from '../../components/BrandLogo'
import { useMemo, useState, type ReactNode } from "react"
import { availability, participantCount, formatDate } from '../../lib/adapters'
import { useNow } from '../../hooks/useNow'
import type { Activity, Registration, RegistrationStatus, Role } from "../../models"
import {
  Badge,
  Button,
  EmptyState,
  ErrorNotice,
  Icon,
  Modal,
  OperationNotice,
  PageHeader,
  SegmentedControl,
  TypeBadge,
} from "../../components/ui"

const accentStyles = {
  blue: "from-blue-700 to-blue-500",
  teal: "from-teal-700 to-teal-500",
  amber: "from-amber-600 to-amber-400",
  violet: "from-violet-700 to-indigo-500",
}

function EventCard({
  activity,
  onOpen,
  now,
}: {
  activity: Activity
  onOpen: () => void
  now: number
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5">
      <div
        className={`relative h-32 overflow-hidden bg-gradient-to-br ${accentStyles[activity.accent]}`}
      >
        <div className="absolute -right-7 -top-12 size-36 rounded-full border border-white/15" />
        <div className="absolute -right-2 -top-2 size-24 rounded-full border border-white/15" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
              {activity.date.split(",")[0]}
            </p>
            <p className="text-3xl font-bold">
              {activity.date.match(/\d+/)?.[0]}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <TypeBadge type={activity.type} />
          {activity.status === "CLOSED" && <Badge status="CLOSED" />}
          {activity.status === 'PUBLISHED' && availability(activity, now) && <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">{availability(activity, now) === 'Activity full' ? 'Full' : 'Registration closed'}</span>}
        </div>
        <h3 className="mt-3 break-words text-lg font-bold leading-snug text-slate-950">
          {activity.title}
        </h3>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <Icon name="clock" className="size-4 text-slate-400" />
            {activity.date} · {activity.time}
          </p>
          <p className="flex items-center gap-2">
            <Icon name="location" className="size-4 text-slate-400" />
            <span className="truncate">{activity.location}</span>
          </p>
          <p className="flex items-start gap-2 text-xs"><Icon name="users" className="size-4 shrink-0 text-slate-400" />{participantCount(activity)}</p>
        </div>
        <div className="mt-auto pt-5"><Button variant="secondary"
          onClick={onOpen}
          className="w-full"
        >
          View details{" "}
          <Icon
            name="arrow-right"
            className="size-4 transition group-hover:translate-x-1"
          />
        </Button></div>
      </div>
    </article>
  )
}

export function Discover({
  activities,
  onOpen,
}: {
  activities: Activity[]
  onOpen: (id: string) => void
}) {
  const now = useNow()
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const categories = ["All", "Events", "Clubs"]
  const visible = activities.filter(
    (a) =>
      a.status !== "DRAFT" &&
      (category === "All" ||
        (category === "Events" && a.type === "EVENT") ||
        (category === "Clubs" && a.type === "CLUB_ACTIVITY") ||
        a.category === category) &&
      a.title.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <div className="page-wrap">
      <section className="relative overflow-hidden rounded-2xl bg-campus-navy px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute right-[-70px] top-[-100px] size-72 rounded-full border border-white/10" />
        <div className="absolute right-10 top-12 size-40 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-200">
            <BrandLogo compact tone="dark" height={20} decorative /> Your campus, connected
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Find your next campus moment.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Discover talks, workshops, club meetups and experiences made for our
            university community.
          </p>
          <label className="mt-7 flex min-h-12 max-w-xl items-center gap-3 rounded-xl bg-white px-4 text-slate-900 shadow-xl shadow-slate-950/20">
            <Icon name="search" className="size-5 text-slate-400" />
            <span className="sr-only">Search activities</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Search events and clubs"
            />
          </label>
        </div>
      </section>
      <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">
            Explore campus
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Campus activities</h2>
        </div>
        <SegmentedControl label="Activity type" value={category} items={categories.map(item => ({ value: item, label: item }))} onChange={setCategory} />
      </div>
      {visible.length ? (
        <div className="motion-list mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((activity) => (
            <EventCard
              key={activity.id}
              activity={activity}
              now={now}
              onOpen={() => onOpen(activity.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon="search"
            title="No activities found"
            description="Try another search or activity type. Filters apply to loaded activities."
          />
        </div>
      )}
    </div>
  )
}

export function ActivityDetails({
  role,
  busy = false,
  activity,
  registered,
  onBack,
  onRegister,
  onTicket,
  maintenance,
  learningResources,
}: {
  activity: Activity
  registered: boolean
  onBack: () => void
  role: Role
  busy?: boolean
  onRegister: () => Promise<void>
  onTicket: () => void
  maintenance?: ReactNode
  learningResources?: ReactNode
}) {
  const now = useNow()
  const unavailable = availability(activity, now)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState("")
  return (
    <div className="page-wrap max-w-5xl">
      <button
        onClick={onBack}
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <Icon name="arrow-left" className="size-4" />
        Back to activities
      </button>
      <div className="surface-card overflow-hidden">
        <div
          className={`relative h-48 bg-gradient-to-br sm:h-64 ${accentStyles[activity.accent]}`}
        >
          <div className="absolute -right-12 -top-20 size-80 rounded-full border border-white/15" />
          <div className="absolute bottom-6 left-6 flex gap-2 sm:left-9">
            <TypeBadge type={activity.type} />
            <Badge status={activity.status} />
          </div>
        </div>
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_300px]">
          <main className="min-w-0">
            <p className="text-sm font-semibold text-blue-700">
              {activity.organizer}
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {activity.title}
            </h1>
            <div className="mt-7 border-t border-slate-100 pt-7">
              <h2 className="text-lg font-bold text-slate-950">
                About this activity
              </h2>
              <ActivityDescription text={activity.description} />
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="grid size-11 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {activity.organizerInitials}
              </span>
              <div>
                <p className="text-xs text-slate-500">Organized by</p>
                <p className="font-semibold text-slate-900">
                  {activity.organizer}
                </p>
              </div>
            </div>
            {learningResources}
          </main>
          <aside>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="space-y-5">
                <div className="flex gap-3">
                  <Icon
                    name="calendar"
                    className="mt-0.5 size-5 text-blue-600"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Date & time
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {activity.date}
                    </p>
                    <p className="text-sm text-slate-600">{activity.time}</p>
                    {activity.endDateTime && <p className="mt-1 text-sm text-slate-600">Ends {formatDate(activity.endDateTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">
                      Campus local time
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon
                    name="location"
                    className="mt-0.5 size-5 text-blue-600"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {activity.location}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="users" className="mt-0.5 size-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Availability
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {participantCount(activity)}
                    </p>
                    {activity.registrationDeadline && <p className="mt-2 text-xs leading-5 text-slate-500">Register by {formatDate(activity.registrationDeadline, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} · campus time</p>}
                  </div>
                </div>
              </div>
              {role !== "student" ? <p className="mt-6 text-sm text-slate-500">Registration is available to Student accounts.</p> : registered ? (
                <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  <span className="flex items-center gap-2">
                    <Icon name="check" className="size-4" />
                    You’re registered
                  </span>
                  <p className="mt-1 pl-6 text-xs font-normal text-emerald-700">
                    Find this in My registrations.
                  </p>
                  <Button className="mt-4 w-full" variant="secondary" icon="ticket" onClick={onTicket} disabled={busy}>View ticket</Button>
                </div>
              ) : (
                <Button
                  className="mt-6 w-full"
                  disabled={busy || Boolean(unavailable)}
                  onClick={() => { setError(""); setConfirm(true) }}
                >
                  {unavailable || 'Register now'}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
      {maintenance}
      <Modal
        open={confirm}
        busy={busy}
        onClose={() => !busy && setConfirm(false)}
        title="Confirm your registration"
      >
        <p className="text-sm leading-6 text-slate-600">
          You’re registering for{" "}
          <strong className="text-slate-900">{activity.title}</strong> on{" "}
          {activity.date}. You can cancel later from My registrations.
        </p>
        {error && <ErrorNotice message={error} />}
        {busy && <OperationNotice title="Confirming your registration" description="Checking availability and reserving your place." />}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            Not now
          </Button>
          <Button
            className="flex-1"
            busy={busy}
            disabled={Boolean(unavailable)}
            busyFeedback="notice"
            onClick={async () => {
              setError("")
              try { await onRegister(); setConfirm(false) }
              catch (cause) { setError(cause instanceof Error ? cause.message : "Registration could not be confirmed.") }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function Registrations({
  tab,
  onTab,
  busy = false,
  activities,
  registrations,
  onOpen,
  onCancel,
  onTicket,
}: {
  activities: Activity[]
  registrations: Registration[]
  onOpen: (id: string) => void
  tab: RegistrationStatus
  onTab: (tab: RegistrationStatus) => void
  busy?: boolean
  onCancel: (id: string) => Promise<void>
  onTicket: (id: string) => void
}) {
  const [error, setError] = useState("")
  const [cancelId, setCancelId] = useState<string | null>(null)
  const visible = useMemo(
    () => registrations.filter((r) => r.status === tab),
    [registrations, tab],
  )
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your plans"
        title="My registrations"
        description="Keep track of upcoming activities and your registration history."
      />
      <div className="mt-6"><SegmentedControl<RegistrationStatus> label="Registration status" value={tab} items={[{ value: "ACTIVE", label: "Active" }, { value: "CANCELLED", label: "Cancelled" }]} onChange={onTab} /></div>
      <div className="motion-list mt-5 space-y-3">
        {visible.length ? (
          visible.map((reg) => {
            const activity = activities.find((a) => a.id === reg.activityId)
            if (!activity) return <article key={reg.id} className="rounded-xl border bg-white p-5"><p>Activity details are unavailable.</p><p className="mt-1 text-sm text-slate-500">{reg.status} · {reg.registeredOn}{reg.checkedInAt ? ' · Checked in' : ''}</p>{reg.status === "ACTIVE" && !reg.checkedInAt && <Button variant="secondary" onClick={() => setCancelId(reg.id)}>Cancel registration</Button>}</article>
            return (
              <article
                key={reg.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div
                  className={`grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ${accentStyles[activity.accent]}`}
                >
                  <Icon name="ticket" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={activity.type} />
                    <Badge status={reg.status} />
                    {reg.checkedInAt && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Checked in</span>}
                  </div>
                  <h3 className="mt-2 font-bold text-slate-950">
                    {activity.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activity.date} · {activity.time}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {reg.registeredOn}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onOpen(activity.id)}
                  >
                    Details
                  </Button>
                  {reg.status === 'ACTIVE' && <Button variant="secondary" icon="ticket" className="flex-1" onClick={() => onTicket(reg.id)}>View ticket</Button>}
                  {reg.status === "ACTIVE" && !reg.checkedInAt && (
                    <Button
                      variant="danger-ghost"
                      className="flex-1"
                      onClick={() => setCancelId(reg.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <EmptyState
            icon="ticket"
            title={`No ${tab.toLowerCase()} registrations`}
            description={
              tab === "ACTIVE"
                ? "When you register for an activity, it will appear here."
                : "You have no cancelled registrations."
            }
          />
        )}
      </div>
      <Modal
        open={!!cancelId}
        busy={busy}
        onClose={() => !busy && setCancelId(null)}
        title="Cancel this registration?"
      >
        <p className="text-sm leading-6 text-slate-600">
          Your place will be released. The cancelled registration will remain in
          your history.
        </p>
        {error && <ErrorNotice message={error} />}
        {busy && <OperationNotice title="Cancelling your registration" description="Releasing your place and preserving your registration history." />}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => setCancelId(null)}
          >
            Keep place
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            busy={busy}
            busyFeedback="notice"
            onClick={async () => {
              setError("")
              try { await onCancel(cancelId!); setCancelId(null) }
              catch (cause) { setError(cause instanceof Error ? cause.message : "Cancellation could not be confirmed.") }
            }}
          >
            Cancel registration
          </Button>
        </div>
      </Modal>
    </div>
  )
}
