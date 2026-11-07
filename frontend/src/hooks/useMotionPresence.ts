import { useEffect, useState } from 'react'

// Retain only the visual exit. Callers hide/inert closed content immediately,
// so keyboard focus and accessibility never wait for an animation.
export function useMotionPresence(open: boolean, exitMs = 160) {
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) { setPresent(true); return }
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : exitMs
    const timer = window.setTimeout(() => setPresent(false), delay)
    return () => window.clearTimeout(timer)
  }, [open, exitMs])
  return open || present
}
