import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import { Button, Icon, OperationNotice } from '../../components/ui'
import { readTicketImage, TicketImageError } from './readTicketImage'

export function TicketScanner({ disabled, onDetected, onEnterCode }: { disabled: boolean; onDetected: (code: string) => void; onEnterCode: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const controls = useRef<IScannerControls | null>(null)
  const generation = useRef(0)
  const [state, setState] = useState<'idle' | 'starting' | 'scanning' | 'reading'>('idle')
  const [error, setError] = useState<{ title: string; description: string } | null>(null)
  const stopMedia = () => {
    generation.current++
    controls.current?.stop(); controls.current = null
    const stream = video.current?.srcObject
    if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop())
    if (video.current) video.current.srcObject = null
  }
  const stop = () => { stopMedia(); setState('idle') }
  useEffect(() => () => { stopMedia() }, [])
  useEffect(() => { if (disabled) stop() }, [disabled])
  const start = async () => {
    if (disabled || state !== 'idle') return
    stopMedia(); const ticket = generation.current
    setError(null); setState('starting')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'UnsupportedCamera' })
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      if (ticket !== generation.current || !video.current) return
      let found = false
      const scanning = await new BrowserQRCodeReader().decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' } } }, video.current,
        (result, _error, active) => {
          if (!result || found || ticket !== generation.current) return
          found = true; active.stop(); stop(); onDetected(result.getText())
        })
      if (ticket !== generation.current) { scanning.stop(); return }
      controls.current = scanning; setState('scanning')
    } catch (cause) {
      if (ticket !== generation.current) return
      stop()
      const name = (cause as { name?: string }).name
      setError({ title: 'The camera could not start', description: name === 'NotAllowedError' ? 'Camera access was denied. Allow it in your browser or use a ticket image or code below.'
        : name === 'NotFoundError' ? 'No camera was found. Upload a ticket image or enter its code.'
        : name === 'UnsupportedCamera' ? 'Camera scanning needs HTTPS or localhost. Upload a ticket image or enter its code instead.'
        : 'Close other camera apps and try again, or use a ticket image or code.' })
    }
  }
  const readImage = async (file?: File) => {
    if (!file || disabled || state === 'reading') return
    stopMedia(); const ticket = generation.current
    setError(null); setState('reading')
    try {
      const code = await readTicketImage(file, () => ticket === generation.current)
      if (ticket === generation.current && code) { setState('idle'); onDetected(code) }
    } catch (cause) {
      if (ticket === generation.current) setError(cause instanceof TicketImageError
        ? { title: cause.title, description: cause.message }
        : { title: 'The image reader is unavailable', description: cause instanceof Error ? cause.message : 'Try again or enter the ticket code below.' })
    } finally { if (ticket === generation.current) setState('idle') }
  }
  const cameraActive = state === 'starting' || state === 'scanning'
  return <div aria-label="Read a registration ticket">
    <div className="grid gap-3 sm:grid-cols-2">
      <section className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <span className="mb-3 grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name="ticket" className="size-5" /></span>
        <h2 className="text-sm font-semibold text-slate-900">Scan with your camera</h2>
        <p className="mb-4 mt-1 flex-1 text-xs leading-5 text-slate-500">Point at the attendee’s QR. You’ll confirm their name before check-in.</p>
        {cameraActive ? <Button variant="secondary" onClick={stop}>Stop camera</Button> : <Button onClick={() => void start()} disabled={disabled || state === 'reading'}>Start camera</Button>}
      </section>
      <section className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <span className="mb-3 grid size-9 place-items-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200"><Icon name="file" className="size-5" /></span>
        <h2 className="text-sm font-semibold text-slate-900">Use a saved ticket</h2>
        <p className="mb-4 mt-1 flex-1 text-xs leading-5 text-slate-500">Choose the downloaded QR or a clear ticket screenshot. PNG, JPEG or WebP · up to 5 MB.</p>
        <Button variant="secondary" icon="file" busy={state === 'reading'} busyLabel="Reading image…" disabled={disabled} onClick={() => fileInput.current?.click()}>Upload ticket image</Button>
        <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" aria-label="Upload ticket image" disabled={disabled || state === 'reading'} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void readImage(file) }} />
      </section>
    </div>
    <div hidden={!cameraActive} className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-900"><video ref={video} autoPlay muted playsInline className="aspect-video max-h-80 w-full object-contain" aria-label="Ticket scanner camera preview" /></div>
    {state === 'starting' && <OperationNotice title="Opening your camera" description="Allow camera access to scan an attendee’s ticket." />}
    {state === 'scanning' && <p role="status" className="mt-3 text-sm text-blue-700">Point the camera at one registration QR. Scanning stops when a ticket is found.</p>}
    {state === 'reading' && <OperationNotice title="Reading the ticket image" />}
    {error && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div role="alert" className="flex items-start gap-2.5"><Icon name="info" className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-950">{error.title}</p><p className="mt-1 text-xs leading-5 text-amber-900">{error.description}</p></div></div>
      <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={disabled} onClick={() => fileInput.current?.click()}>Try another image</Button><Button size="sm" variant="ghost" disabled={disabled} onClick={() => { stop(); setError(null); onEnterCode() }}>Enter ticket code</Button></div>
    </div>}
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><Icon name="lock" className="mt-0.5 size-3.5 shrink-0" />Images stay on this device. The ticket code is verified securely.</p>
  </div>
}
