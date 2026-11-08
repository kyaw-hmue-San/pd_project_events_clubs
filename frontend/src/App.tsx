import { useEffect, useRef, useState } from "react"
import { useMotionPresence } from './hooks/useMotionPresence'
import { BrandLogo } from './components/BrandLogo'
import { InternshipsPage } from './features/internships/InternshipsPage'
import { LearningResources } from './features/student/LearningResources'
import type { ActivityInput, ActivityStatus, Profile, RegistrationStatus, Role, Route } from "./models"
import { Button, EmptyState, ErrorNotice, Loading, LoadingScreen, OperationNotice, Toast, Icon, type IconName } from "./components/ui"
import { AuthView } from "./features/auth/AuthView"
import { ProfileSetup } from "./features/auth/ProfileSetup"
import { OrganizerAccess } from "./features/auth/OrganizerAccess"
import { OrganizerRequests } from "./features/admin/OrganizerRequests"
import { ActivityDetails, Discover, Registrations } from "./features/student/StudentViews"
import { ActivityForm, OrganizerActivities, Roster } from "./features/organizer/OrganizerViews"
import { AdminActivity, AdminOverview } from "./features/admin/AdminViews"
import { ProfilePage } from "./features/profile/ProfilePage"
import { TicketPage } from './features/tickets/TicketPage'
import { CheckInPage } from './features/tickets/CheckInPage'
import { MaintenancePanel } from './features/organizer/MaintenancePanel'
import { WorkspaceSwitcher } from "./components/WorkspaceSwitcher"
import { useSession } from "./hooks/useSession"
import { usePaged, useRemote } from "./hooks/useRemote"
import { api } from "./lib/api"
import { activityView, registrationView } from "./lib/adapters"
import { campusTimeZone, useEmulators } from "./lib/firebase"

const defaultRoute: Record<Role, Route> = { student: "discover", organizer: "organizer-activities", admin: "admin-overview" }
type NavItem = { label: string; route: Route; icon: IconName }
const allowed: Record<Role, Route[]> = {
  student: ["discover", "activity", "registrations", "organizer-request", "profile", "ticket", "internships"],
  organizer: ["organizer-activities", "activity", "activity-form", "roster", "profile", "check-in"],
  admin: ["admin-overview", "admin-activity", "admin-requests", "profile"],
}
function readRoute() {
  const [route = "", ...parts] = window.location.hash.slice(1).split("/")
  return { route: route as Route, id: parts.join("/") }
}
function useRoute(preferredRole: Role, dualAccess = false) {
  const [location, setLocation] = useState(readRoute)
  useEffect(() => {
    const change = () => setLocation(readRoute())
    window.addEventListener("hashchange", change)
    return () => window.removeEventListener("hashchange", change)
  }, [])
  const role = dualAccess && !["activity", "profile"].includes(location.route)
    ? allowed.student.includes(location.route) ? "student" : allowed.organizer.includes(location.route) ? "organizer" : preferredRole
    : preferredRole
  const route = allowed[role].includes(location.route) ? location.route : defaultRoute[role]
  const navigate = (next: Route, id?: string) => {
    window.location.hash = `${next}${id ? "/" + id : ""}`
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return { role, route, id: location.id, navigate }
}

export default function App() {
  const session = useSession()
  if (session.loading) return <LoadingScreen text={session.user ? "Opening your workspace" : "Checking your session"} description={session.user ? "Verifying your campus profile and access." : "Connecting to your Google sign-in session."} />
  if (!session.user) return <AuthView />
  if (session.needsOrganizerApproval) return <OrganizerAccess email={session.user.email} onRefreshAccess={session.retry} onLogout={session.logout} />
  if (session.needsProfile) return <ProfileSetup email={session.user.email} onComplete={session.retry} onLogout={session.logout} />
  if (!session.profile) return <main className="page-wrap max-w-xl"><h1 className="text-2xl font-bold">Account access</h1><ErrorNotice message={session.error || "Your campus profile is unavailable."} onRetry={session.retry} /><Button variant="secondary" onClick={() => void session.logout()}>Sign out</Button></main>
  return <Workspace key={session.profile.id} profile={session.profile} onLogout={session.logout} onRefreshAccess={session.retry} />
}

function Workspace({ profile, onLogout, onRefreshAccess }: { profile: Profile; onLogout: () => Promise<void>; onRefreshAccess: () => void }) {
  const dualAccess = profile.role !== "ADMIN" && profile.capabilities.student && profile.capabilities.organizer
  const workspaceKey = `campus-pulse:workspace:${profile.id}`
  const [preferredRole, setRole] = useState<Role>(() => {
    if (dualAccess) {
      const current = readRoute().route
      if (!["activity", "profile"].includes(current)) return allowed.organizer.includes(current) ? 'organizer' : 'student'
      try { return sessionStorage.getItem(workspaceKey) === 'organizer' ? 'organizer' : 'student' } catch { return 'student' }
    }
    return profile.role.toLowerCase() as Role
  })
  const { role, route, id, navigate } = useRoute(preferredRole, dualAccess)
  useEffect(() => { setRole(role) }, [role])
  useEffect(() => {
    if (dualAccess) { try { sessionStorage.setItem(workspaceKey, role) } catch { /* Workspace switching still works when browser storage is unavailable. */ } }
  }, [dualAccess, role, workspaceKey])
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState("")
  const [logoutError, setLogoutError] = useState("")
  const [signingOut, setSigningOut] = useState(false)
  useEffect(() => { setMobileNav(false) }, [route, id])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 5000)
    return () => clearTimeout(timer)
  }, [toast])
  if (signingOut) return <LoadingScreen text="Signing you out" description="Closing your campus session securely." />
  return <div className="flex min-h-screen flex-col bg-campus-canvas text-slate-900">
    <a className="sr-only focus:not-sr-only focus:block focus:p-3" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById("main-content")?.focus() }}>Skip to content</a>
    {useEmulators && <div className="bg-slate-900 px-4 py-2 text-center text-xs text-white">Automated test environment · Firebase emulators</div>}
    <Header role={role} dualAccess={dualAccess} onWorkspaceChange={workspace => { setRole(workspace); navigate(defaultRoute[workspace]) }} canOrganize={profile.capabilities.organizer} route={route} open={mobileNav} onToggle={() => setMobileNav(value => !value)} onClose={() => setMobileNav(false)} onNavigate={next => { setMobileNav(false); navigate(next) }} onSignOut={() => { setSigningOut(true); void onLogout().catch(() => { setSigningOut(false); setLogoutError("Sign-out failed. Please try again.") }) }} />
    <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
      {logoutError && <div className="page-wrap"><ErrorNotice message={logoutError} /></div>}
      {(route === "discover" || route === "organizer-activities" || route === "admin-overview") && <ActivityListPage key={role} role={role} navigate={navigate} notify={setToast} />}
      {(route === "activity" || route === "admin-activity") && <DetailPage key={`${role}/${id}`} id={id} userId={profile.id} role={role} onTicket={registrationId => navigate('ticket', registrationId)} back={() => navigate(defaultRoute[role])} notify={setToast} />}
      {route === "registrations" && <RegistrationPage navigate={navigate} notify={setToast} />}
      {route === "internships" && <InternshipsPage />}
      {route === "activity-form" && <FormPage key={id} id={id} back={() => navigate("organizer-activities")} notify={setToast} />}
      {route === "roster" && <RosterPage key={id} id={id} back={() => navigate("organizer-activities")} onScan={() => navigate('check-in', id)} notify={setToast} />}
      {route === 'ticket' && <TicketPage key={id} id={id} onBack={() => navigate('registrations')} />}
      {route === 'check-in' && <CheckInPage key={id} id={id} userId={profile.id} onBack={() => navigate('roster', id)} />}
      {route === "organizer-request" && <OrganizerAccess onRefreshAccess={onRefreshAccess} />}
      {route === "admin-requests" && <OrganizerRequests />}
      {route === "profile" && <ProfilePage onSaved={() => setToast("Username updated.")} />}
    </main>
    <Footer />
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </div>
}

type Navigate = (route: Route, id?: string) => void
type Notify = (message: string) => void
function Paging({ page }: { page: { loading: boolean; error: string; nextCursor: string | null; retry: () => void; more: () => void } }) {
  if (!page.error && !page.loading && !page.nextCursor) return null
  return <div className="app-container pb-5">
    {page.error && <ErrorNotice message={page.error} onRetry={page.retry} />}
    {page.loading && <Loading variant="inline" text="Updating this list…" />}
    {page.nextCursor && !page.loading && <Button variant="secondary" onClick={page.more}>Load more</Button>}
  </div>
}
function ActivityListPage({ role, navigate, notify }: { role: Role; navigate: Navigate; notify: Notify }) {
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ id: string; label: string } | null>(null)
  const page = usePaged(`${role}/activities/${version}`, role === "student" ? api.activities : role === "organizer" ? api.ownActivities : api.adminActivities)
  const summary = useRemote(`summary/${role}/${version}`, () => role === "admin" ? api.summary() : Promise.resolve(null))
  const mutate = async (id: string, status?: ActivityStatus) => {
    if (busy) return
    setBusy(true); setPending({ id, label: status === "PUBLISHED" ? "Publishing your activity" : status === "CLOSED" ? "Closing registration for this activity" : "Deleting the unused draft" })
    try {
      if (status) await api.update(id, { status }); else await api.remove(id)
      notify(status === "PUBLISHED" ? "Activity published." : status === "CLOSED" ? "Activity closed." : "Draft deleted.")
      setVersion(value => value + 1)
    } finally { setBusy(false); setPending(null) }
  }
  const activities = page.items.map(activityView)
  if (!page.items.length && page.loading) return <Loading text="Loading campus activities" layout={role === 'student' ? 'cards' : 'list'} />
  if (!page.items.length && page.error) return <div className="page-wrap"><ErrorNotice message={page.error} onRetry={page.retry} /></div>
  return <>
    {role === "student" && <Discover activities={activities} onOpen={id => navigate("activity", id)} />}
    {role === "organizer" && <OrganizerActivities activities={activities} busy={busy || page.loading} busyId={pending?.id} progress={pending?.label} onForm={id => navigate("activity-form", id)} onRoster={id => navigate("roster", id)} onOpen={id => navigate("activity", id)} onStatus={(id, status) => mutate(id, status)} onDelete={id => mutate(id)} />}
    {role === "admin" && (summary.loading && !summary.value ? <Loading text="Loading campus totals…" /> : summary.error ? <div className="page-wrap"><ErrorNotice message={summary.error} onRetry={summary.refresh} /></div> : summary.value && <AdminOverview activities={activities} summary={summary.value} onOpen={id => navigate("admin-activity", id)} />)}
    <Paging page={page} />
    <div className="app-container flex flex-wrap items-center justify-between gap-3 pb-6 text-xs text-slate-500"><p>{activities.length} activities loaded{role === "student" ? " · Search and filters apply to this list." : ""}</p><Button variant="secondary" size="sm" icon="refresh" disabled={busy} busy={page.loading} busyFeedback="notice" onClick={() => { page.refresh(); if (role === 'admin') summary.refresh() }}>Refresh activities</Button></div>
  </>
}
function DetailPage({ id, userId, role, back, notify, onTicket }: { id: string; userId: string; role: Role; back: () => void; notify: Notify; onTicket: (registrationId: string) => void }) {
  const remote = useRemote(`detail/${role}/${id}`, () => role === "admin" ? api.adminActivity(id) : api.activity(id))
  const [busy, setBusy] = useState(false)
  if (remote.loading && !remote.value) return <Loading text="Loading activity details" layout="profile" />
  if (remote.error || !remote.value) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to activities</Button><ErrorNotice message={remote.error || "Activity not found."} onRetry={remote.refresh} /></div>
  const record = remote.value
  if (role === "admin") return <AdminActivity activity={activityView(record)} onBack={back} />
  const register = async () => {
    if (busy || remote.loading) return
    setBusy(true)
    try { await api.register(id); notify("Registration confirmed."); remote.refresh() }
    catch (cause) { remote.refresh(); throw cause }
    finally { setBusy(false) }
  }
  return <>{remote.loading && <div className="app-container"><OperationNotice title="Updating your registration status" /></div>}<ActivityDetails activity={activityView(record)} role={role} busy={busy || remote.loading} registered={Boolean(record.viewerRegistrationId)} onTicket={() => { if (record.viewerRegistrationId) onTicket(record.viewerRegistrationId) }} onBack={back} onRegister={register} learningResources={role === 'student' && ['PUBLISHED', 'CLOSED'].includes(record.status) ? <LearningResources key={JSON.stringify([id, record.title, record.description])} id={id} /> : undefined} maintenance={role === 'organizer' && record.organizerId === userId ? <MaintenancePanel id={id} /> : undefined} /></>
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
  if (!page.items.length && page.loading) return <Loading text="Loading your registrations" />
  return <>
    <Registrations tab={tab} onTab={setTab} busy={busy} activities={page.items.flatMap(record => record.activity ? [activityView(record.activity)] : [])} registrations={page.items.map(registrationView)} onOpen={id => navigate("activity", id)} onTicket={id => navigate('ticket', id)} onCancel={cancel} />
    <Paging page={page} />
    <div className="app-container pb-6"><Button variant="secondary" size="sm" icon="refresh" busy={page.loading} busyFeedback="notice" onClick={page.refresh}>Refresh registrations</Button></div>
  </>
}
function FormPage({ id, back, notify }: { id: string; back: () => void; notify: Notify }) {
  const remote = useRemote(`form/${id}`, () => id ? api.activity(id) : Promise.resolve(null))
  const savedId = useRef(id)
  const [progress, setProgress] = useState('')
  if (remote.loading) return <Loading text="Preparing your activity form" layout="form" />
  if (remote.error) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to my activities</Button><ErrorNotice message={remote.error} onRetry={remote.refresh} /></div>
  if (remote.value?.status === "CLOSED") return <div className="page-wrap"><EmptyState title="This activity is closed" description="Closed activities cannot be reopened." action={<Button onClick={back}>Back to my activities</Button>} /></div>
  const save = async (mode: "draft" | "publish", input: ActivityInput) => {
    setProgress('Saving activity details')
    try {
    const draft = savedId.current ? await api.update(savedId.current, input) : await api.create(input)
    savedId.current = draft.id
    if (mode === "publish" && draft.status === "DRAFT") {
      setProgress('Publishing your activity')
      try { await api.update(draft.id, { status: "PUBLISHED" }) }
      catch (cause) { throw new Error(`Draft saved. Publishing failed: ${cause instanceof Error ? cause.message : "Try publishing again."}`) }
    }
    notify(mode === "publish" ? "Activity published." : "Activity saved.")
    back()
    } finally { setProgress('') }
  }
  return <ActivityForm activity={remote.value ? activityView(remote.value) : undefined} progress={progress} onBack={back} onSave={save} />
}
function RosterPage({ id, back, onScan, notify }: { id: string; back: () => void; onScan: () => void; notify: Notify }) {
  const detail = useRemote(`roster/activity/${id}`, () => api.activity(id))
  const page = usePaged(`roster/${id}`, cursor => api.roster(id, cursor))
  if ((detail.loading && !detail.value) || (!page.items.length && page.loading)) return <Loading text="Loading the activity and participant roster" />
  if (detail.error || !detail.value) return <div className="page-wrap"><Button variant="ghost" onClick={back}>Back to my activities</Button><ErrorNotice message={detail.error || "Activity not found."} onRetry={detail.refresh} /></div>
  const checkIn = async (registrationId: string) => {
    const result = await api.checkIn(id, { registrationId })
    notify(result.alreadyCheckedIn ? 'This attendee was already checked in.' : 'Attendance recorded.')
    page.refresh(); detail.refresh()
  }
  return <>{detail.loading && !page.loading && <div className="app-container"><OperationNotice title="Updating the activity totals" /></div>}<Roster activity={activityView(detail.value)} registrations={page.items} onBack={back} onScan={onScan} onCheckIn={checkIn} /><Paging page={page} /><div className="app-container pb-6"><Button variant="secondary" size="sm" icon="refresh" busy={page.loading || detail.loading} busyFeedback="notice" onClick={() => { page.refresh(); detail.refresh() }}>Refresh roster</Button></div></>
}
function Header({
  role,
  canOrganize,
  dualAccess,
  onWorkspaceChange,
  route,
  open,
  onToggle,
  onClose,
  onNavigate,
  onSignOut,
}: {
  role: Role
  canOrganize: boolean
  dualAccess: boolean
  onWorkspaceChange: (role: Role) => void
  route: Route
  open: boolean
  onToggle: () => void
  onClose: () => void
  onNavigate: (route: Route) => void
  onSignOut: () => void
}) {
  const nav: Record<Role, NavItem[]> = {
    student: [
      { label: "Discover", route: "discover", icon: "compass" },
      { label: "My registrations", route: "registrations", icon: "ticket" },
      { label: "Internships", route: "internships", icon: "file" },
      { label: "Organizer access", route: "organizer-request", icon: "users" },
      { label: "My profile", route: "profile", icon: "user" },
    ],
    organizer: [
      {
        label: "My activities",
        route: "organizer-activities",
        icon: "calendar",
      },
      { label: "Create activity", route: "activity-form", icon: "plus" },
      { label: "My profile", route: "profile", icon: "user" },
    ],
    admin: [{ label: "Overview", route: "admin-overview", icon: "grid" }, { label: "Organizer requests", route: "admin-requests", icon: "users" }, { label: "My profile", route: "profile", icon: "user" }],
  }
  const items = nav[role].filter(item => item.route !== "organizer-request" || !canOrganize)
  const menu = useRef<HTMLDivElement>(null)
  const menuPresent = useMotionPresence(open)
  const menuToggle = useRef<HTMLButtonElement>(null)
  const closeMenu = useRef(onClose)
  closeMenu.current = onClose
  useEffect(() => {
    if (!open) return
    const panel = menu.current
    ;(panel?.querySelector<HTMLButtonElement>('[aria-current="page"]') || panel?.querySelector<HTMLButtonElement>('nav button'))?.focus()
    const dismiss = (event: Event) => {
      if (!menu.current?.contains(event.target as Node) && !menuToggle.current?.contains(event.target as Node)) closeMenu.current()
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu.current(); menuToggle.current?.focus() }
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const resize = () => {
      if (!desktop.matches) return
      const header = panel?.closest('header')
      const destination = header?.querySelector<HTMLButtonElement>('nav [aria-current="page"]') || header?.querySelector<HTMLButtonElement>('nav button')
      closeMenu.current()
      // CSS can hide the mobile panel (and blur its focused item) before this
      // callback runs. Move focus to the visible current desktop destination.
      destination?.focus()
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('focusin', dismiss)
    document.addEventListener('keydown', keyboard)
    desktop.addEventListener('change', resize)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('focusin', dismiss)
      document.removeEventListener('keydown', keyboard)
      desktop.removeEventListener('change', resize)
    }
  }, [open])
  const descriptions: Record<string, string> = {
    internships: 'Explore opportunities from Team 17',
    discover: 'Find your next campus activity', registrations: 'Your tickets and upcoming activities',
    'organizer-request': 'Apply to host campus activities', profile: 'Manage your account details',
    'organizer-activities': 'Your events, attendees and facilities', 'activity-form': 'Bring a new idea to campus',
    'admin-overview': 'View campus events and activity totals', 'admin-requests': 'Review Organizer applications',
  }
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="app-container flex h-16 items-center justify-between gap-2 lg:gap-4">
        <button
          onClick={() => onNavigate(defaultRoute[role])}
          aria-label="Campus Events & Clubs home"
          className="flex min-h-11 shrink-0 items-center rounded-lg"
        >
          <BrandLogo compact height={44} decorative className="block sm:hidden" />
          <BrandLogo height={48} decorative className="hidden sm:block" />
        </button>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <button
              key={item.route}
              aria-current={route === item.route ? "page" : undefined}
              onClick={() => onNavigate(item.route)}
              className={`motion-press min-h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
                route === item.route
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {dualAccess ? <WorkspaceSwitcher role={role} route={route} onChange={onWorkspaceChange} /> : <span className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold capitalize text-slate-600 sm:inline-flex">{role}</span>}
          <div className="hidden border-l border-slate-200 pl-3 lg:block"><Button variant="ghost" size="sm" onClick={onSignOut} aria-label="Sign out" icon="logout">Sign out</Button></div>
          <button ref={menuToggle} type="button" onClick={onToggle} aria-label="Toggle navigation" aria-expanded={open} aria-controls="mobile-navigation"
            data-open={open} className="motion-press navigation-toggle lg:hidden">
            <span aria-hidden="true" className="navigation-glyph"><span /><span /><span /></span>
          </button>
        </div>
      </div>
      {menuPresent && (
        <div ref={menu} id="mobile-navigation" inert={!open} aria-hidden={!open || undefined} data-state={open ? 'open' : 'closed'} className="navigation-panel lg:hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 px-5 py-4">
            <span aria-hidden="true" className="absolute -right-5 -top-10 size-32 rounded-full border border-white/10" />
            <span aria-hidden="true" className="absolute right-5 top-4 size-20 rounded-full border border-blue-300/15" />
            <BrandLogo compact tone="dark" height={32} decorative className="absolute right-4 top-4" />
            <p className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">Campus menu</p>
            <p className="relative mt-1 text-base font-semibold capitalize text-white">{role} workspace</p>
          </div>
          <nav aria-label="Main navigation" className="space-y-1 p-2">
            {items.map((item) => (
              <button
                key={item.route}
                aria-label={item.label}
                aria-current={route === item.route ? "page" : undefined}
                onClick={() => { onNavigate(item.route); menuToggle.current?.focus() }}
                className={`motion-press navigation-neon group flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  route === item.route
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${route === item.route ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'}`}><Icon name={item.icon} className="size-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="mt-0.5 block text-xs font-normal leading-4 text-slate-500">{descriptions[item.route]}</span></span>
                {route === item.route && <Icon name="arrow-right" className="size-4 shrink-0" />}
              </button>
            ))}
          </nav>
          <div className="border-t border-slate-100 bg-slate-50/70 p-2"><button type="button" onClick={onSignOut} className="motion-press navigation-neon flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"><Icon name="logout" className="size-4" />Sign out</button></div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return <footer className="mt-8 border-t border-slate-200/80 bg-white"><div className="app-container flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between"><p className="font-medium">Campus Events & Clubs · Team 12</p><p>Campus time: {campusTimeZone}</p></div></footer>
}
