import { useEffect, useId, useRef, useState } from 'react'
import type { Role } from '../models'
import { Icon } from './ui'
import { useMotionPresence } from '../hooks/useMotionPresence'

const workspaces = [
  { role: 'student', label: 'Student', description: 'Discover and join activities', icon: 'compass' },
  { role: 'organizer', label: 'Organizer', description: 'Plan and manage your activities', icon: 'calendar' },
] as const

export function WorkspaceSwitcher({ role, route, onChange }: { role: Role; route: string; onChange: (role: Role) => void }) {
  const [open, setOpen] = useState(false)
  const present = useMotionPresence(open)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const current = workspaces.find(workspace => workspace.role === role) || workspaces[0]
  useEffect(() => { setOpen(false) }, [role, route])
  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
    const dismiss = (event: Event) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const choices = [...(root.current?.querySelectorAll<HTMLButtonElement>('[aria-pressed]') || [])]
      const index = choices.indexOf(document.activeElement as HTMLButtonElement)
      if (index < 0) return
      event.preventDefault()
      choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length]?.focus()
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('focusin', dismiss)
    document.addEventListener('keydown', keyboard)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('focusin', dismiss)
      document.removeEventListener('keydown', keyboard)
    }
  }, [open])
  return <div ref={root} className="relative shrink-0">
    <button ref={trigger} type="button" aria-label={`Switch workspace, current ${current.label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}
      className={`motion-press flex h-10 items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${open ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
      <Icon name={current.icon} className="hidden size-4 text-blue-600 sm:block" />
      {current.label}<Icon name="chevron-down" className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {present && <div id={id} role="group" aria-label="Workspace selection" inert={!open} aria-hidden={!open || undefined} data-state={open ? 'open' : 'closed'} className="motion-popover absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-5rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
      <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Switch workspace</p>
      {workspaces.map(workspace => <button key={workspace.role} type="button" aria-label={`${workspace.label} workspace`} aria-pressed={role === workspace.role}
        onClick={() => { setOpen(false); onChange(workspace.role); trigger.current?.focus() }}
        className={`motion-press flex min-h-16 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${role === workspace.role ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
        <Icon name={workspace.icon} className="size-4 shrink-0" />
        <span className="flex-1"><span className="block text-sm font-semibold">{workspace.label}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{workspace.description}</span></span>
        {role === workspace.role && <Icon name="check" className="size-4 shrink-0" />}
      </button>)}
    </div>}
  </div>
}
