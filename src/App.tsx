import { useEffect, useRef, useState } from "react"
import type { ActivityInput, ActivityStatus, RegistrationStatus, Role, Route } from "./models"
import { Button, EmptyState, ErrorNotice, Loading, Toast, Icon, type IconName } from "./components/ui"
import { AuthView } from "./features/auth/AuthView"
import { ProfileSetup } from "./features/auth/ProfileSetup"
import { OrganizerAccess } from "./features/auth/OrganizerAccess"
import { OrganizerRequests } from "./features/admin/OrganizerRequests"
import { ActivityDetails, Discover, Registrations } from "./features/student/StudentViews"
import { ActivityForm, OrganizerActivities, Roster } from "./features/organizer/OrganizerViews"
import { AdminActivity, AdminOverview } from "./features/admin/AdminViews"
import { useSession } from "./hooks/useSession"
import { usePaged, useRemote } from "./hooks/useRemote"
import { api } from "./lib/api"
import { activityView, registrationView } from "./lib/adapters"
import { campusTimeZone, useEmulators } from "./lib/firebase"

const defaultRoute: Record<Role, Route> = { student: "discover", organizer: "organizer-activities", admin: "admin-overview" }
type NavItem = { label: string; route: Route; icon: IconName }
const allowed: Record<Role, Route[]> = {
  student: ["discover", "activity", "registrations", "organizer-request"],
  organizer: ["organizer-activities", "activity", "activity-form", "roster"],
  admin: ["admin-overview", "admin-activity", "admin-requests"],
}
function readRoute() {
  const [route = "", ...parts] = window.location.hash.slice(1).split("/")
  return { route: route as Route, id: parts.join("/") }
}
function useRoute(role: Role) {
  const [location, setLocation] = useState(readRoute)
  useEffect(() => {
    const change = () => setLocation(readRoute())
    window.addEventListener("hashchange", change)
    return () => window.removeEventListener("hashchange", change)
  }, [])
  const route = allowed[role].includes(location.route) ? location.route : defaultRoute[role]
  const navigate = (next: Route, id?: string) => {
    window.location.hash = `${next}${id ? "/" + id : ""}`
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return { route, id: location.id, navigate }
}

export default function App() {
  const session = useSession()
  if (session.loading) return <Loading text="Loading your campus account…" />
  if (!session.user) return <AuthView />
  if (session.needsOrganizerApproval) return <OrganizerAccess email={session.user.email} onRefreshAccess={session.retry} onLogout={session.logout} />
  if (session.needsProfile) return <ProfileSetup email={session.user.email} onComplete={session.retry} onLogout={session.logout} />
  if (!session.profile) return <main className="page-wrap max-w-xl"><h1 className="text-2xl font-bold">Account access</h1><ErrorNotice message={session.error || "Your campus profile is unavailable."} onRetry={session.retry} /><Button variant="secondary" onClick={() => void session.logout()}>Sign out</Button></main>
  return <Workspace key={session.profile.id} role={session.profile.role.toLowerCase() as Role} onLogout={session.logout} onRefreshAccess={session.retry} />
}

function Workspace({ role, onLogout, onRefreshAccess }: { role: Role; onLogout: () => Promise<void>; onRefreshAccess: () => void }) {
  const { route, id, navigate } = useRoute(role)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState("")
  const [logoutError, setLogoutError] = useState("")
  useEffect(() => { setMobileNav(false) }, [route, id])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 5000)
    return () => clearTimeout(timer)
  }, [toast])
  return <div className="min-h-screen bg-[#f8fafc] text-slate-900">
    <a className="sr-only focus:not-sr-only focus:block focus:p-3" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById("main-content")?.focus() }}>Skip to content</a>
    {useEmulators && <div className="bg-slate-900 px-4 py-2 text-center text-xs text-white">Automated test environment · Firebase emulators</div>}
    <Header role={role} route={route} open={mobileNav} onToggle={() => setMobileNav(value => !value)} onNavigate={navigate} onSignOut={() => { void onLogout().catch(() => setLogoutError("Sign-out failed. Please try again.")) }} />
    <main id="main-content" tabIndex={-1} className="outline-none">
      {logoutError && <div className="page-wrap"><ErrorNotice message={logoutError} /></div>}
      {(route === "discover" || route === "organizer-activities" || route === "admin-overview") && <ActivityListPage key={role} role={role} navigate={navigate} notify={setToast} />}
      {(route === "activity" || route === "admin-activity") && <DetailPage key={`${role}/${id}`} id={id} role={role} back={() => navigate(defaultRoute[role])} notify={setToast} />}
      {route === "registrations" && <RegistrationPage navigate={navigate} notify={setToast} />}
      {route === "activity-form" && <FormPage key={id} id={id} back={() => navigate("organizer-activities")} notify={setToast} />}
      {route === "roster" && <RosterPage key={id} id={id} back={() => navigate("organizer-activities")} />}
      {route === "organizer-request" && <OrganizerAccess onRefreshAccess={onRefreshAccess} />}
      {route === "admin-requests" && <OrganizerRequests />}
    </main>
    <Footer />
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </div>
}

type Navigate = (route: Route, id?: string) => void
type Notify = (message: string) => void
function Paging({ page }: { page: { loading: boolean; error: string; nextCursor: string | null; retry: () => void; more: () => void } }) {
  return <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
    {page.error && <ErrorNotice message={page.error} onRetry={page.retry} />}
    {page.loading && <Loading />}
    {page.nextCursor && !page.loading && <Button variant="secondary" onClick={page.more}>Load more</Button>}
  </div>
}
function ActivityListPage({ role, navigate, notify }: { role: Role; navigate: Navigate; notify: Notify }) {
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const page = usePaged(`${role}/activities/${version}`, role === "student" ? api.activities : role === "organizer" ? api.ownActivities : api.adminActivities)
  const summary = useRemote(`summary/${role}/${version}`, () => role === "admin" ? api.summary() : Promise.resolve(null))
  const mutate = async (id: string, status?: ActivityStatus) => {
    if (busy) return
    setBusy(true)
    try {
      if (status) await api.update(id, { status }); else await api.remove(id)
      notify(status === "PUBLISHED" ? "Activity published." : status === "CLOSED" ? "Activity closed." : "Draft deleted.")
      setVersion(value => value + 1)
    } finally { setBusy(false) }
  }
  const activities = page.items.map(activityView)
  if (!page.items.length && page.loading) return <Loading text="Loading activities…" />
  if (!page.items.length && page.error) return <div className="page-wrap"><ErrorNotice message={page.error} onRetry={page.retry} /></div>
  return <>
    {role === "student" && <Discover activities={activities} onOpen={id => navigate("activity", id)} />}
    {role === "organizer" && <OrganizerActivities activities={activities} busy={busy} onForm={id => navigate("activity-form", id)} onRoster={id => navigate("roster", id)} onOpen={id => navigate("activity", id)} onStatus={(id, status) => mutate(id, status)} onDelete={id => mutate(id)} />}
    {role === "admin" && (summary.loading ? <Loading text="Loading campus totals…" /> : summary.error ? <div className="page-wrap"><ErrorNotice message={summary.error} onRetry={summary.refresh} /></div> : summary.value && <AdminOverview activities={activities} summary={summary.value} onOpen={id => navigate("admin-activity", id)} />)}
    <Paging page={page} />
    <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 sm:px-6 lg:px-8"><Button variant="ghost" onClick={() => setVersion(value => value + 1)}>Refresh activities</Button><p>Search and filters apply to loaded activities.</p></div>
  </>
}
function DetailPage({ id, role, back, notify }: { id: string; role: Role; back: () => void; notify: Notify }) {
  const remote = useRemote(`detail/${role}/${id}`, () => role === "admin" ? api.adminActivity(id) : api.activity(id))
  const [busy, setBusy] = useState(false)
  if (remote.loading) return <Loading text="Loading activity…" />
  if (remote.error || !remote.value) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to activities</Button><ErrorNotice message={remote.error || "Activity not found."} onRetry={remote.refresh} /></div>
  const record = remote.value
  if (role === "admin") return <AdminActivity activity={activityView(record)} onBack={back} />
  const register = async () => {
    if (busy) return
    setBusy(true)
    try { await api.register(id); notify("Registration confirmed."); remote.refresh() }
    catch (cause) { throw cause }
    finally { setBusy(false) }
  }
  return <ActivityDetails activity={activityView(record)} role={role} busy={busy} registered={Boolean(record.viewerRegistrationId)} onBack={back} onRegister={register} />
}
function RegistrationPage({ navigate, notify }: { navigate: Navigate; notify: Notify }) {
  const [tab, setTab] = useState<RegistrationStatus>("ACTIVE")
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const page = usePaged(`registrations/${tab}/${version}`, cursor => api.registrations(tab, cursor))
  const cancel = async (id: string) => {
    if (busy) return
    setBusy(true)
    try { await api.cancel(id); notify("Registration cancelled. It remains in your history."); setVersion(value => value + 1) }
    finally { setBusy(false) }
  }
  return <>
    <Registrations tab={tab} onTab={setTab} busy={busy} activities={page.items.flatMap(record => record.activity ? [activityView(record.activity)] : [])} registrations={page.items.map(registrationView)} onOpen={id => navigate("activity", id)} onCancel={cancel} />
    <Paging page={page} />
    <div className="mx-auto max-w-5xl px-4"><Button variant="ghost" onClick={() => setVersion(value => value + 1)}>Refresh registrations</Button></div>
  </>
}
function FormPage({ id, back, notify }: { id: string; back: () => void; notify: Notify }) {
  const remote = useRemote(`form/${id}`, () => id ? api.activity(id) : Promise.resolve(null))
  const savedId = useRef(id)
  if (remote.loading) return <Loading text="Loading activity form…" />
  if (remote.error) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to my activities</Button><ErrorNotice message={remote.error} onRetry={remote.refresh} /></div>
  if (remote.value?.status === "CLOSED") return <div className="page-wrap"><EmptyState title="This activity is closed" description="Closed activities cannot be reopened." action={<Button onClick={back}>Back to my activities</Button>} /></div>
  const save = async (mode: "draft" | "publish", input: ActivityInput) => {
    const draft = savedId.current ? await api.update(savedId.current, input) : await api.create(input)
    savedId.current = draft.id
    if (mode === "publish" && draft.status === "DRAFT") {
      try { await api.update(draft.id, { status: "PUBLISHED" }) }
      catch (cause) { throw new Error(`Draft saved. Publishing failed: ${cause instanceof Error ? cause.message : "Try publishing again."}`) }
    }
    notify(mode === "publish" ? "Activity published." : "Activity saved.")
    back()
  }
  return <ActivityForm activity={remote.value ? activityView(remote.value) : undefined} onBack={back} onSave={save} />
}
function RosterPage({ id, back }: { id: string; back: () => void }) {
  const [version, setVersion] = useState(0)
  const detail = useRemote(`roster/activity/${id}/${version}`, () => api.activity(id))
  const page = usePaged(`roster/${id}/${version}`, cursor => api.roster(id, cursor))
  if (detail.loading) return <Loading text="Loading activity…" />
  if (detail.error || !detail.value) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to my activities</Button><ErrorNotice message={detail.error || "Activity not found."} onRetry={detail.refresh} /></div>
  return <><Roster activity={activityView(detail.value)} registrations={page.items} onBack={back} /><Paging page={page} /><div className="page-wrap pt-0"><Button variant="secondary" onClick={() => setVersion(value => value + 1)}>Refresh roster</Button></div></>
}
function Header({
  role,
  route,
  open,
  onToggle,
  onNavigate,
  onSignOut,
}: {
  role: Role
  route: Route
  open: boolean
  onToggle: () => void
  onNavigate: (route: Route) => void
  onSignOut: () => void
}) {
  const nav: Record<Role, NavItem[]> = {
    student: [
      { label: "Discover", route: "discover", icon: "compass" },
      { label: "My registrations", route: "registrations", icon: "ticket" },
      { label: "Organizer access", route: "organizer-request", icon: "users" },
    ],
    organizer: [
      {
        label: "My activities",
        route: "organizer-activities",
        icon: "calendar",
      },
      { label: "Create activity", route: "activity-form", icon: "plus" },
    ],
    admin: [{ label: "Overview", route: "admin-overview", icon: "grid" }, { label: "Organizer requests", route: "admin-requests", icon: "users" }],
  }
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate(defaultRoute[role])}
          className="flex items-center gap-2.5"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-blue-700 text-white">
            <Icon name="spark" className="size-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-950">
            Campus Pulse
          </span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav[role].map((item) => (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                route === item.route
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600">
            {role}
          </span>
          <Button
            variant="ghost"
            className="px-3"
            onClick={onSignOut}
            aria-label="Sign out"
            icon="logout"
          >
            Sign out
          </Button>
        </div>
        <button
          onClick={onToggle}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white p-4 lg:hidden">
          <nav className="space-y-1">
            {nav[role].map((item) => (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold ${
                  route === item.route
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600"
                }`}
              >
                <Icon name={item.icon} className="size-5" />
                {item.label}
              </button>
            ))}
          </nav>
          <button
            onClick={onSignOut}
            className="mt-3 flex min-h-12 w-full items-center gap-3 border-t border-slate-100 px-4 pt-3 text-sm font-semibold text-slate-500"
          >
            <Icon name="logout" className="size-5" />
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return <footer className="mt-14 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8"><p>Campus Pulse · Team 12</p><p>Campus time: {campusTimeZone}</p></div></footer>
}
