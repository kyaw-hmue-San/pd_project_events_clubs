import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { auth } from "../lib/firebase"
import { api, ApiError } from "../lib/api"
import type { Profile } from "../models"

export function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(Boolean(auth))
  const [error, setError] = useState("")
  const [needsProfile, setNeedsProfile] = useState(false)
  const [needsOrganizerApproval, setNeedsOrganizerApproval] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!auth) return
    let sequence = 0
    const unsubscribe = onAuthStateChanged(auth, async next => {
      const ticket = ++sequence
      setUser(next); setProfile(null); setError(""); setNeedsProfile(false); setNeedsOrganizerApproval(false); setLoading(Boolean(next))
      if (!next) { setLoading(false); return }
      try {
        const result = await api.me()
        if (!["STUDENT", "ORGANIZER", "ADMIN"].includes(result.role)) throw new Error("This account has no supported campus role.")
        if (ticket === sequence) setProfile(result)
      } catch (cause) {
        if (ticket === sequence) {
          setNeedsProfile(cause instanceof ApiError && cause.code === "PROFILE_SETUP_REQUIRED")
          setNeedsOrganizerApproval(cause instanceof ApiError && ["ORGANIZER_APPROVAL_REQUIRED", "SCHOOL_ACCOUNT_REQUIRED"].includes(cause.code))
          setError(cause instanceof Error ? cause.message : "Unable to load your account.")
        }
      } finally { if (ticket === sequence) setLoading(false) }
    })
    return () => { sequence++; unsubscribe() }
  }, [revision])
  return { user, profile, loading, error, needsProfile, needsOrganizerApproval, retry: () => setRevision(value => value + 1), logout: () => auth ? signOut(auth) : Promise.resolve() }
}
