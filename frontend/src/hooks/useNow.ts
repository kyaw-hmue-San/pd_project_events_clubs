import { useEffect, useState } from 'react'

// Refresh time-dependent button hints without polling the API. Registration
// permission and seat allocation are always checked by the server transaction.
export function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer) }, [])
  return now
}
