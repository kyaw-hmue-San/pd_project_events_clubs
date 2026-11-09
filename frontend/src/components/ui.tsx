import { createContext, useContext, useEffect, useId, useRef, useState } from "react"
import { CalendarPicker, TimePicker } from './SchedulePicker'
import { campusInput } from '../lib/adapters'
import { campusTimeZone } from '../lib/firebase'
import { useMotionPresence } from '../hooks/useMotionPresence'
import { BrandLogo } from './BrandLogo'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import type { ActivityStatus, ActivityType, RegistrationStatus, RequestStatus } from "../models"

export type IconName = "arrow-left" | "arrow-right" | "calendar" | "check" | "chevron-down" | "clock" | "close" | "compass" | "eye" | "eye-off" | "file" | "grid" | "info" | "list" | "location" | "lock" | "logout" | "menu" | "plus" | "search" | "spark" | "ticket" | "users" | "user" | "refresh"

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6a8 8 0 0 1 13.5 3M4.4 15A8 8 0 0 0 17.9 18" /></>,
    "arrow-left": (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h10" />
      </>
    ),
    "arrow-right": (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4M16 2v4M3 9h18" />
        <rect x="3" y="4" width="18" height="17" rx="2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    "eye-off": (
      <>
        <path d="m3 3 18 18M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2 2.7M6.5 6.5C4 8.2 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" />
        <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3v4Z" />
        <path d="M8 4v12" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-ghost"
  size?: "default" | "sm"
  busy?: boolean
  busyLabel?: string
  // Use notice when a separate Loading/OperationNotice owns progress feedback.
  busyFeedback?: 'button' | 'notice'
  icon?: IconName
}

export function Button({
  variant = "primary",
  size = "default",
  busy = false,
  busyLabel,
  busyFeedback = 'button',
  disabled,
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const showBusy = busy && busyFeedback === 'button'
  const styles = {
    primary:
      "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 shadow-sm shadow-blue-900/10",
    secondary:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm shadow-slate-900/[.02]",
    ghost: "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700",
    "danger-ghost": "border-transparent text-red-600 hover:bg-red-50 hover:text-red-700",
  }
  return (
    <button
      type="button"
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      className={`motion-press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-semibold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none ${size === "sm" ? "min-h-11 px-3 sm:min-h-9" : "min-h-11 px-4"} ${styles[variant]} ${className}`}
      {...props}
    >
      {(showBusy || icon) && <span key={showBusy ? 'busy' : icon} aria-hidden="true" className="motion-icon inline-flex size-4 shrink-0">{showBusy ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : icon && <Icon name={icon} className="size-4" />}</span>}
      {showBusy && busyLabel ? busyLabel : children}
    </button>
  )
}

export function SegmentedControl<T extends string>({ label, value, items, onChange }: {
  label: string
  value: T
  items: { value: T; label: string; ariaLabel?: string; icon?: IconName }[]
  onChange: (value: T) => void
}) {
  return <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
    {items.map(item => <button key={item.value} type="button" aria-label={item.ariaLabel} aria-pressed={value === item.value} onClick={() => onChange(item.value)} className={`motion-press inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors sm:min-h-9 sm:px-4 ${value === item.value ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70" : "text-slate-600 hover:bg-white/60 hover:text-slate-900"}`}>
      {item.icon && <Icon name={item.icon} className="size-4 shrink-0" />}{item.label}
    </button>)}
  </div>
}

export function Badge({ status }: { status: ActivityStatus | RegistrationStatus | RequestStatus }) {
  const style =
    ["PUBLISHED", "ACTIVE", "APPROVED"].includes(status)
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
      : ["DRAFT", "PENDING"].includes(status)
        ? "bg-amber-50 text-amber-700 ring-amber-600/15"
        : status === "REJECTED" ? "bg-red-50 text-red-700 ring-red-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1 ring-inset ${style}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function TypeBadge({ type }: { type: ActivityType }) {
  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-blue-700">
      {type === "EVENT" ? "EVENT" : "CLUB ACTIVITY"}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

const FieldContext = createContext<{ id: string; label: string; descriptionId?: string; invalid: boolean } | null>(null)

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <FieldContext.Provider value={{ id, label, descriptionId: hint || error ? `${id}-description` : undefined, invalid: Boolean(error) }}>
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-description`} className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      )}
      {error && (
        <span id={`${id}-description`} className="mt-1.5 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </div>
    </FieldContext.Provider>
  )
}

export const inputClass =
  "min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-400 aria-invalid:focus:ring-red-100"
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const field = useContext(FieldContext)
  return (
    <input id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined} className={`${inputClass} ${className}`} {...props} />
  )
}
export function DateTimeInput({ type, className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { type: "date" | "time" }) {
  const field = useContext(FieldContext)
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [openPicker, setOpenPicker] = useState(false)
  const pickerId = useId()
  const label = (field?.label || (type === 'date' ? 'date' : 'time')).toLowerCase()
  const open = () => {
    if (!input.current || input.current.matches(':disabled') || input.current.readOnly) return
    trigger.current?.focus()
    setOpenPicker(true)
  }
  const select = (value: string) => {
    const element = input.current
    if (!element || element.matches(':disabled') || element.readOnly) return
    // Use a native input event so React's controlled value, validity and normal
    // onChange/onInput handlers stay in sync with direct typing.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    setOpenPicker(false)
  }
  const min = props.min === undefined ? undefined : String(props.min)
  const max = props.max === undefined ? undefined : String(props.max)
  return <>
    <div className="relative">
      <input ref={input} type={type} lang="en-GB" id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined} data-enhanced-picker="true" className={`${inputClass} schedule-input tabular-nums pr-14 ${className}`} {...props} />
      <button ref={trigger} type="button" aria-label={type === 'date' ? label === 'date' ? 'Open calendar' : `Open calendar for ${label}` : `Choose ${label}`} aria-haspopup="dialog" aria-expanded={openPicker} aria-controls={openPicker ? pickerId : undefined} disabled={props.disabled || props.readOnly} onClick={open} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg border border-slate-300 border-l-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:opacity-40"><Icon name={type === 'date' ? 'calendar' : 'clock'} className="size-4" /></button>
    </div>
    <Modal id={pickerId} open={openPicker} title={`Choose ${label}`} initialFocus={type === 'date' ? '[data-calendar-focus]' : 'select'} onClose={() => setOpenPicker(false)}>
      <p className="mb-4 text-xs text-slate-500">Campus time · {campusTimeZone}</p>
      {openPicker && (type === 'date' ? <CalendarPicker value={input.current?.value || ''} today={campusInput(new Date().toISOString()).date} min={min} max={max} onSelect={select} onCancel={() => setOpenPicker(false)} /> : <TimePicker value={input.current?.value || ''} min={min} max={max} onSelect={select} onCancel={() => setOpenPicker(false)} />)}
    </Modal>
  </>
}
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const field = useContext(FieldContext)
  return (
    <div className="relative"><select
      id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined}
      className={`${inputClass} appearance-none pr-10 ${className}`}
      {...props}
    /><Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /></div>
  )
}
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const field = useContext(FieldContext)
  return (
    <textarea
      id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined}
      className={`${inputClass} min-h-28 resize-y py-3 ${className}`}
      {...props}
    />
  )
}

export function Modal({
  id,
  open,
  busy = false,
  title,
  children,
  onClose,
  initialFocus,
  size = "default",
}: {
  id?: string
  open: boolean
  busy?: boolean
  title: string
  children: ReactNode
  onClose: () => void
  initialFocus?: string
  size?: "default" | "wide"
}) {
  const titleId = useId()
  const present = useMotionPresence(open)
  const container = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusable = () => [...(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])].filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0)
    const initial = initialFocus ? container.current?.querySelector<HTMLElement>(initialFocus) : null
    ;(initial || focusable()[0])?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); return }
      if (event.key !== "Tab") return
      const elements = focusable()
      const first = elements[0], last = elements.at(-1)
      if (!first) { event.preventDefault(); container.current?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !container.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !container.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", keydown)
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; previous?.focus() }
  }, [open])
  if (!present) return null
  return (
    <div
      className="motion-dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      data-state={open ? 'open' : 'closed'}
      inert={!open}
      aria-hidden={!open || undefined}
      role={open ? 'dialog' : undefined}
      id={id}
      aria-modal="true"
      aria-labelledby={titleId}
      ref={container}
      tabIndex={-1}
      onMouseDown={(e) => open && e.target === e.currentTarget && onClose()}
    >
      <div className={`motion-dialog-panel max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl ${size === "wide" ? "sm:max-w-3xl" : "sm:max-w-md"}`}>
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-slate-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="motion-press -mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon = "calendar",
  title,
  description,
  action,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon name={icon} />
      </div>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Toast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <div role="status" className="motion-notice fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-xl">
      <span key={message} className="motion-success-icon grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500">
        <Icon name="check" className="size-4" />
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Dismiss message" className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg hover:bg-white/10">
        <Icon name="close" className="size-4 text-slate-300" />
      </button>
    </div>
  )
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="my-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <p>{message}</p>
    {onRetry && <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>}
  </div>
}

export function OperationNotice({ title, description }: { title: string; description?: string }) {
  return <div role="status" aria-live="polite" className="motion-notice my-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
    <span aria-hidden="true" className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
    <div><p className="text-sm font-semibold text-blue-950">{title}</p>{description && <p className="mt-1 text-xs leading-5 text-blue-800">{description}</p>}</div>
  </div>
}

export function LoadingScreen({ text = "Opening Campus Events & Clubs", description = "Getting your campus workspace ready." }: { text?: string; description?: string }) {
  return <main className="grid min-h-svh place-items-center bg-campus-canvas px-6 py-12">
    <div role="status" aria-live="polite" className="w-full max-w-sm text-center">
      <div aria-hidden="true" className="relative mx-auto mb-8 grid size-24 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
        <BrandLogo compact height={56} decorative />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-600">Campus Events & Clubs</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{text}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div aria-hidden="true" className="loading-track mx-auto mt-6 h-1 w-36 overflow-hidden rounded-full bg-blue-100"><span className="loading-runner block h-full w-1/3 rounded-full bg-blue-600" /></div>
    </div>
  </main>
}

export function Loading({ text = "Loading your page…", layout = "list", variant = "page" }: {
  text?: string; layout?: "list" | "cards" | "form" | "profile"; variant?: "page" | "section" | "inline"
}) {
  if (variant === "inline") return <OperationNotice title={text} description="Your current information stays visible while this finishes." />
  const line = (width: string) => <div className={`loading-shimmer h-3 rounded-md bg-slate-100 ${width}`} />
  return <div className={variant === "page" ? "page-wrap" : "mt-5"}>
    <div role="status" aria-live="polite" className="surface-card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-slate-100 p-5 sm:p-6">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><span className="size-6 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" /></span>
        <div><p className="text-base font-semibold text-slate-900">{text}</p><p className="mt-1 text-xs text-slate-500">We’re getting the latest information for you.</p></div>
      </div>
      <div aria-hidden="true" className={`grid gap-5 p-5 sm:p-6 ${layout === "cards" ? "sm:grid-cols-3" : layout === "profile" ? "sm:grid-cols-2" : ""}`}>
        {Array.from({ length: layout === "form" ? 4 : 3 }, (_, i) => <div key={i} className={`space-y-4 ${layout === "cards" ? "rounded-xl border border-slate-100 p-4" : ""}`}>
          {layout === "cards" && <div className="loading-shimmer h-24 rounded-lg bg-slate-100" />}
          {line(i % 2 ? "w-1/3" : "w-1/2")}
          {layout === "form" ? <div className="loading-shimmer h-11 rounded-lg bg-slate-100" /> : <>{line("w-full")}{line("w-2/3")}</>}
        </div>)}
      </div>
      <div aria-hidden="true" className="loading-track h-1 overflow-hidden bg-blue-50"><span className="loading-runner block h-full w-1/3 bg-blue-500" /></div>
    </div>
  </div>
}
