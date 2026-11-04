import type { Activity, Summary } from "../../models"
import { Badge, Button, Icon, PageHeader, TypeBadge } from "../../components/ui"

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
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Icon name={stat.icon} className="size-4.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Campus
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
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(220px,1.4fr)_1fr_120px_90px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid">
          <span>Activity</span>
          <span>Organizer</span>
          <span>Status</span>
          <span className="text-right">View</span>
        </div>
        {activities.map((a) => (
          <article
            key={a.id}
            className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[minmax(220px,1.4fr)_1fr_120px_90px] md:items-center"
          >
            <div>
              <TypeBadge type={a.type} />
              <p className="mt-2 font-bold text-slate-950">{a.title}</p>
              <p className="mt-1 text-xs text-slate-500">{a.date}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {a.organizerInitials}
              </span>
              {a.organizer}
            </div>
            <div>
              <Badge status={a.status} />
            </div>
            <Button
              variant="ghost"
              className="justify-self-start md:justify-self-end"
              onClick={() => onOpen(a.id)}
            >
              Details
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
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
        <p className="mt-7 text-[15px] leading-7 text-slate-600">
          {activity.description}
        </p>
        <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Date & time
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {activity.date}
            </p>
            <p className="text-sm text-slate-600">{activity.time}</p>
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
              {activity.registered} active registrations
            </p>
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
