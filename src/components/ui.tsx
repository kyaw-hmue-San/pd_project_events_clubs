import { createContext, useContext, useEffect, useId, useRef } from "react"
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import type { ActivityStatus, ActivityType } from "../models"

export type IconName = "arrow-left" | "arrow-right" | "calendar" | "check" | "chevron-down" | "clock" | "close" | "compass" | "eye" | "eye-off" | "file" | "grid" | "info" | "list" | "location" | "lock" | "logout" | "menu" | "plus" | "search" | "spark" | "ticket" | "users"

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
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
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: IconName
}

export function Button({
  variant = "primary",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-900/10",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="size-4.5" />}
      {children}
    </button>
  )
}

export function Badge({ status }: { status: ActivityStatus }) {
  const style =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700 ring-amber-600/15"
        : "bg-slate-100 text-slate-600 ring-slate-500/15"
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
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

const FieldContext = createContext<{ id: string; descriptionId?: string; invalid: boolean } | null>(null)

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
    <FieldContext.Provider value={{ id, descriptionId: hint || error ? `${id}-description` : undefined, invalid: Boolean(error) }}>
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
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const field = useContext(FieldContext)
  return (
    <input id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined} className={`${inputClass} ${className}`} {...props} />
  )
}
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const field = useContext(FieldContext)
  return (
    <select
      id={field?.id} aria-describedby={field?.descriptionId} aria-invalid={field?.invalid || undefined}
      className={`${inputClass} appearance-none ${className}`}
      {...props}
    />
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
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const titleId = useId()
  const container = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusable = () => [...(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])]
    focusable()[0]?.focus()
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
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={container}
      tabIndex={-1}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-slate-950">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
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
    <div role="status" className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-xl">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500">
        <Icon name="check" className="size-4" />
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Dismiss message">
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

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p role="status" className="p-6 text-sm text-slate-500">{text}</p>
}
