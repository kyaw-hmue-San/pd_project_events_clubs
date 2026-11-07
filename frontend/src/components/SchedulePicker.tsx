import { useEffect, useId, useRef, useState, type SelectHTMLAttributes } from 'react'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const action = 'inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40'
const secondary = `${action} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
const primary = `${action} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`
const control = 'min-h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-2 focus:outline-offset-1 focus:outline-blue-600'
const pad = (value: number) => String(value).padStart(2, '0')

function PickerSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="relative"><select {...props} className={`${control} h-11 w-full appearance-none pr-9`} /><svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg></div>
}

function calendarDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setUTCHours(12, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}
function iso(date: Date) {
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}
function parse(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = calendarDate(year, month, day)
  return year >= 1 && iso(date) === value ? date : null
}
function monthLength(year: number, month: number) { return calendarDate(year, month + 1, 0).getUTCDate() }

export function CalendarPicker({ value, today, min, max, onSelect, onCancel }: {
  value: string; today: string; min?: string; max?: string; onSelect: (date: string) => void; onCancel: () => void
}) {
  const clamp = (date: string) => min && parse(min) && date < min ? min : max && parse(max) && date > max ? max : date
  const initial = parse(clamp(parse(value) ? value : today)) || parse(today)!
  const [month, setMonth] = useState(initial.getUTCMonth() + 1)
  const [yearText, setYearText] = useState(String(initial.getUTCFullYear()))
  const [focused, setFocused] = useState(iso(initial))
  const grid = useRef<HTMLTableElement>(null)
  const moveFocus = useRef(false)
  const monthId = useId(), yearId = useId()
  const year = Number(yearText)
  const validYear = /^\d{1,4}$/.test(yearText) && year >= 1 && year <= 9999
  const count = validYear ? monthLength(year, month) : 0
  const offset = validYear ? (calendarDate(year, month, 1).getUTCDay() + 6) % 7 : 0
  const inRange = (date: string) => (!min || !parse(min) || date >= min) && (!max || !parse(max) || date <= max)
  const monthLabel = `${months[month - 1]} ${validYear ? year : ''}`.trim()

  useEffect(() => {
    if (moveFocus.current) { grid.current?.querySelector<HTMLElement>('[data-calendar-focus]')?.focus(); moveFocus.current = false }
  }, [focused, month, yearText])

  const showMonth = (nextYear: number, nextMonth: number) => {
    const date = calendarDate(nextYear, nextMonth, 1)
    const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1
    if (y < 1 || y > 9999) return
    setMonth(m); setYearText(String(y))
    const day = parse(focused)?.getUTCDate() || 1
    setFocused(iso(calendarDate(y, m, Math.min(day, monthLength(y, m)))))
  }
  const keydown = (event: React.KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const next = new Date(date)
    const weekday = (date.getUTCDay() + 6) % 7
    if (event.key === 'ArrowLeft') next.setUTCDate(date.getUTCDate() - 1)
    else if (event.key === 'ArrowRight') next.setUTCDate(date.getUTCDate() + 1)
    else if (event.key === 'ArrowUp') next.setUTCDate(date.getUTCDate() - 7)
    else if (event.key === 'ArrowDown') next.setUTCDate(date.getUTCDate() + 7)
    else if (event.key === 'Home') next.setUTCDate(date.getUTCDate() - weekday)
    else if (event.key === 'End') next.setUTCDate(date.getUTCDate() + 6 - weekday)
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const delta = event.key === 'PageUp' ? -1 : 1
      const shifted = calendarDate(year, month + (event.shiftKey ? 0 : delta), 1)
      const y = event.shiftKey ? year + delta : shifted.getUTCFullYear(), m = shifted.getUTCMonth() + 1
      next.setTime(calendarDate(y, m, Math.min(date.getUTCDate(), monthLength(y, m))).getTime())
    } else return
    event.preventDefault()
    if (next.getUTCFullYear() < 1 || next.getUTCFullYear() > 9999) return
    const target = parse(clamp(iso(next)))!
    moveFocus.current = true
    setFocused(iso(target)); setMonth(target.getUTCMonth() + 1); setYearText(String(target.getUTCFullYear()))
  }
  return <div>
    <div className="grid grid-cols-[1fr_6rem] gap-3">
      <div><label htmlFor={monthId} className="mb-1 block text-xs font-semibold text-slate-600">Month</label><PickerSelect id={monthId} value={month} onChange={event => validYear ? showMonth(year, Number(event.target.value)) : setMonth(Number(event.target.value))}>{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</PickerSelect></div>
      <div><label htmlFor={yearId} className="mb-1 block text-xs font-semibold text-slate-600">Year</label><input id={yearId} type="number" min={1} max={9999} step={1} className={`${control} w-full`} value={yearText} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); grid.current?.querySelector<HTMLElement>('[data-calendar-focus]')?.focus() } }} onChange={event => {
        const text = event.target.value; setYearText(text)
        const nextYear = Number(text)
        if (/^\d{1,4}$/.test(text) && nextYear >= 1 && nextYear <= 9999) setFocused(iso(calendarDate(nextYear, month, Math.min(parse(focused)?.getUTCDate() || 1, monthLength(nextYear, month)))))
      }} /></div>
    </div>
    <div className="mt-3 flex items-center justify-between gap-2">
      <button type="button" className={`${secondary} w-11 px-0 text-xl`} aria-label="Previous month" disabled={!validYear || (year === 1 && month === 1)} onClick={() => showMonth(year, month - 1)}>‹</button>
      <p aria-live="polite" className="text-sm font-semibold text-slate-900">{monthLabel}</p>
      <button type="button" className={`${secondary} w-11 px-0 text-xl`} aria-label="Next month" disabled={!validYear || (year === 9999 && month === 12)} onClick={() => showMonth(year, month + 1)}>›</button>
    </div>
    {validYear ? <table ref={grid} role="grid" aria-label={`Calendar for ${monthLabel}`} className="mt-3 w-full table-fixed border-separate border-spacing-0.5 text-center text-sm">
      <thead><tr>{days.map(day => <th key={day} scope="col" aria-label={day} className="h-8 text-xs font-medium text-slate-500">{day.slice(0, 2)}</th>)}</tr></thead>
      <tbody>{Array.from({ length: Math.ceil((offset + count) / 7) }, (_, week) => <tr key={week}>{days.map((_, column) => {
        const day = week * 7 + column - offset + 1
        if (day < 1 || day > count) return <td key={column} />
        const date = calendarDate(year, month, day), code = iso(date)
        const selected = code === value
        return <td key={column} aria-selected={selected}><button type="button" tabIndex={code === focused ? 0 : -1} data-calendar-focus={code === focused || undefined} aria-label={`${day} ${months[month - 1]} ${year}`} aria-current={code === today ? 'date' : undefined} disabled={!inRange(code)} onKeyDown={event => keydown(event, date)} onClick={() => onSelect(code)} className={`grid min-h-11 w-full place-items-center rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:text-slate-300 ${selected ? 'bg-blue-600 text-white' : code === today ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100' : 'text-slate-700 hover:bg-slate-100'}`}>{day}</button></td>
      })}</tr>)}</tbody>
    </table> : <p role="status" className="my-5 text-sm text-slate-600">Enter a year from 1 to 9999.</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Choose a day. Arrow keys move by day or week; Page Up/Down changes month.</p>
    <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondary} disabled={!inRange(today)} onClick={() => onSelect(today)}>Today</button><button type="button" className={secondary} onClick={onCancel}>Cancel</button></div>
  </div>
}

export function TimePicker({ value, min, max, onSelect, onCancel }: { value: string; min?: string; max?: string; onSelect: (time: string) => void; onCancel: () => void }) {
  const valid = /^(?:[01]\d|2[0-3]):[0-5]\d/.test(value)
  const [hour, setHour] = useState(valid ? value.slice(0, 2) : '09')
  const [minute, setMinute] = useState(valid ? value.slice(3, 5) : '00')
  const hourId = useId(), minuteId = useId()
  const choice = `${hour}:${minute}`
  const allowed = min && max && min > max ? choice >= min || choice <= max : (!min || choice >= min) && (!max || choice <= max)
  return <div>
    <p className="mb-5 rounded-xl bg-slate-50 p-4 text-center font-mono text-3xl font-semibold tabular-nums text-slate-900" aria-live="polite">{choice}</p>
    <div className="grid grid-cols-2 gap-4">
      <div><label htmlFor={hourId} className="mb-2 block text-sm font-semibold text-slate-700">Hour</label><PickerSelect id={hourId} value={hour} onChange={event => setHour(event.target.value)}>{Array.from({ length: 24 }, (_, value) => <option key={value} value={pad(value)}>{pad(value)}</option>)}</PickerSelect></div>
      <div><label htmlFor={minuteId} className="mb-2 block text-sm font-semibold text-slate-700">Minute</label><PickerSelect id={minuteId} value={minute} onChange={event => setMinute(event.target.value)}>{Array.from({ length: 60 }, (_, value) => <option key={value} value={pad(value)}>{pad(value)}</option>)}</PickerSelect></div>
    </div>
    {!allowed && <p role="status" className="mt-3 text-sm text-amber-800">Choose a time within the allowed range.</p>}
    <p className="mt-4 text-xs text-slate-500">24-hour time. Your field changes only when you choose Use time.</p>
    <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondary} onClick={onCancel}>Cancel</button><button type="button" className={primary} disabled={!allowed} onClick={() => onSelect(choice)}>Use time</button></div>
  </div>
}
