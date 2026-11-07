import { ActivityDescription } from "../../components/ActivityDescription"
import type { Activity, Summary } from "../../models"
import { Badge, Button, Icon, PageHeader, TypeBadge } from "../../components/ui"
import { formatDate, participantCount } from '../../lib/adapters'

export function AdminOverview({
  activities,
  summary,
  onOpen,
}: {
  activities: Activity[]
  summary: Summary
  onOpen: (id: string) => void
}) {
  const stats = [
    {
      label: "Total activities",
      value: summary.totalActivities,
      icon: "calendar" as const,
    },
    {
      label: "Published",
      value: summary.published,
      icon: "check" as const,
    },
    {
      label: "Drafts",
      value: summary.draft,
      icon: "file" as const,
    },
    {
      label: "Closed",
      value: summary.closed,
      icon: "lock" as const,
    },
  ]
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Campus administration"
        title="Campus activity overview"
        description="View campus activities and review Organizer access requests."
      />
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span className="flex items-start gap-2">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Event oversight:</strong> Activities are read-only here. Organizer access is reviewed in the Organizer requests queue.
          </span>
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="surface-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Icon name={stat.icon} className="size-4.5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-9 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            All organizer activities
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Includes draft, published and closed activities.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {activities.length} loaded
        </span>
      </div>
      <div className="motion-list surface-card mt-4 overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,200px)_130px] gap-6 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 lg:grid">
          <span>Activity</span>
          <span>Organizer</span>
          <span className="text-right">View</span>
        </div>
        {activities.map((a) => (
          <article
            key={a.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-b border-slate-200/70 p-4 transition-colors last:border-0 hover:bg-slate-50/60 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)_130px] lg:gap-6"
          >
            <div className="col-span-2 min-w-0 lg:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-base font-semibold leading-6 text-slate-950">{a.title}</h3>
                <span className="shrink-0"><Badge status={a.status} /></span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-5 text-slate-500">
                <span className="font-medium text-blue-700">{a.type === 'EVENT' ? 'Event' : 'Club activity'}</span>
                <span className="inline-flex items-center gap-1.5"><Icon name="calendar" className="size-3.5 shrink-0" />{a.date} · {a.time}</span>
              </div>
              {a.location && <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><Icon name="location" className="mt-0.5 size-3.5 shrink-0" /><span className="min-w-0 break-words">{a.location}</span></p>}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600 lg:text-sm">
              <Icon name="user" className="size-4 shrink-0 text-slate-400" />
              <span className="min-w-0 break-words">{a.organizer}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-end text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              onClick={() => onOpen(a.id)}
            >
              View details <Icon name="arrow-right" className="size-4" />
            </Button>
          </article>
        ))}
      </div>
    </div>
  )
}

export function AdminActivity({
  activity,
  onBack,
}: {
  activity: Activity
  onBack: () => void
}) {
  return (
    <div className="page-wrap max-w-4xl">
      <button
        onClick={onBack}
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600"
      >
        <Icon name="arrow-left" className="size-4" />
        Back to overview
      </button>
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <TypeBadge type={activity.type} />
          <Badge status={activity.status} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            READ ONLY
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          {activity.title}
        </h1>
        <p className="mt-2 text-sm font-semibold text-blue-700">
          {activity.organizer}
        </p>
        <section className="mt-7 border-t border-slate-100 pt-6"><h2 className="text-lg font-bold text-slate-950">About this activity</h2><ActivityDescription text={activity.description} /></section>
        <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Date & time
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {activity.date}
            </p>
            <p className="text-sm text-slate-600">{activity.time}</p>
            {activity.endDateTime && <p className="mt-1 text-xs text-slate-500">Ends {formatDate(activity.endDateTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Location
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {activity.location}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aggregate registration
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {participantCount(activity)}
            </p>
            {activity.registrationDeadline && <p className="mt-1 text-xs leading-5 text-slate-500">Register by {formatDate(activity.registrationDeadline, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} · campus time</p>}
            <p className="text-xs text-slate-500">
              No participant details available
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <Icon name="lock" className="mt-0.5 size-5 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Admin access is read-only
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              You cannot edit, publish, close, delete, or view the registration
              roster for this activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
