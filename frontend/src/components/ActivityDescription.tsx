import { Icon } from './ui'

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string; level: 3 | 4 }
  | { kind: 'list'; ordered: boolean; items: { text: string; number?: number }[] }
  | { kind: 'agenda'; items: { range: string; text: string }[] }

// A small plain-text renderer for the existing stored description contract.
// Recognize full-line planning headings only; never interpret HTML or rewrite data.
function blocks(lines: string[], checklist = false): Block[] {
  const result: Block[] = []
  let paragraph: string[] = []
  const flush = () => { if (paragraph.length) { result.push({ kind: 'paragraph', text: paragraph.join('\n') }); paragraph = [] } }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (/^Suggested agenda(?:\s*\([^\n]{1,80}\))?:?$/i.test(line)) {
      flush(); result.push({ kind: 'heading', text: line.replace(/:$/, ''), level: 3 }); continue
    }
    if (checklist && /^(BEFORE|DURING|AFTER):?$/i.test(line)) {
      flush(); result.push({ kind: 'heading', text: line.replace(/:$/, '').toLowerCase(), level: 4 }); continue
    }
    const agenda = /^(\d{1,3}\s*[–—-]\s*\d{1,3}\s*min(?:utes)?):\s*(.+)$/i.exec(line)
    if (agenda) {
      flush()
      const previous = result.at(-1)
      const item = { range: agenda[1], text: agenda[2] }
      if (previous?.kind === 'agenda') previous.items.push(item)
      else result.push({ kind: 'agenda', items: [item] })
      continue
    }
    const bullet = /^(?:[•*-]\s+|(?<number>\d+)[.)]\s+)(.+)$/u.exec(line)
    if (bullet) {
      flush()
      const ordered = Boolean(bullet.groups?.number), previous = result.at(-1)
      const item = { text: bullet[2], ...(ordered ? { number: Number(bullet.groups!.number) } : {}) }
      if (previous?.kind === 'list' && previous.ordered === ordered) previous.items.push(item)
      else result.push({ kind: 'list', ordered, items: [item] })
      continue
    }
    paragraph.push(raw.trimEnd())
  }
  flush()
  return result
}
function TextBlocks({ content }: { content: Block[] }) {
  return <>{content.map((block, index) => {
    if (block.kind === 'paragraph') return <p key={index} className="whitespace-pre-line break-words">{block.text}</p>
    if (block.kind === 'heading') return block.level === 3
      ? <h3 key={index} className="pt-2 text-base font-semibold text-slate-900">{block.text}</h3>
      : <h4 key={index} className="pt-1 text-xs font-semibold uppercase tracking-wide text-blue-700">{block.text}</h4>
    if (block.kind === 'agenda') return <ol key={index} aria-label="Activity agenda" className="space-y-2">{block.items.map((item, itemIndex) => <li key={itemIndex} className="grid gap-1 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:grid-cols-[6.5rem_1fr] sm:gap-3"><span className="font-mono text-xs font-medium leading-6 text-blue-700">{item.range}</span><span className="min-w-0 break-words text-sm leading-6 text-slate-700">{item.text}</span></li>)}</ol>
    const List = block.ordered ? 'ol' : 'ul'
    return <List key={index} {...(block.ordered ? { start: block.items[0].number } : {})} className={`space-y-2 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-blue-500`}>{block.items.map((item, itemIndex) => <li key={itemIndex} value={item.number} className="break-words pl-1 text-sm leading-6">{item.text}</li>)}</List>
  })}</>
}
export function ActivityDescription({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const checklist = lines.findIndex(line => /^Preparation checklist:?$/i.test(line.trim()))
  return <div className="mt-3 min-w-0 max-w-2xl space-y-4 text-[15px] leading-7 text-slate-600">
    <TextBlocks content={blocks(checklist < 0 ? lines : lines.slice(0, checklist))} />
    {checklist >= 0 && <details className="group rounded-xl border border-slate-200 bg-slate-50/50">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">Preparation checklist<Icon name="chevron-down" className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" /></summary>
      <div className="space-y-3 border-t border-slate-200/70 px-4 py-4"><TextBlocks content={blocks(lines.slice(checklist + 1), true)} /></div>
    </details>}
  </div>
}
