import { useEffect, useState } from "react"
import { auth, configurationError } from "../../lib/firebase"
import { continueWithGoogle, continueWithGoogleRedirect, finishGoogleRedirect, signInError } from "../../lib/google-signin"
import { Button, Icon, OperationNotice } from "../../components/ui"
import { BrandLogo } from '../../components/BrandLogo'

export function AuthView() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [redirectAvailable, setRedirectAvailable] = useState(false)
  useEffect(() => {
    let active = true
    finishGoogleRedirect().catch(cause => { if (active) setError(signInError(cause)) })
    return () => { active = false }
  }, [])
  const submit = async () => {
    if (!auth || loading) return
    setLoading(true); setError(""); setRedirectAvailable(false)
    try { await continueWithGoogle() }
    catch (cause) {
      setError(signInError(cause))
      setRedirectAvailable((cause as { code?: string }).code === "auth/popup-blocked")
    } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#12376F] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 bottom-[-100px] size-[430px] rounded-full border border-white/10" />
        <div className="absolute -left-3 bottom-[-5px] size-60 rounded-full border border-white/10" />
        <BrandLogo tone="dark" height={64} className="relative" />
        <div className="relative max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-blue-200">
            One campus. Countless possibilities.
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">
            Make campus feel a little more connected.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Find events, join club activities and keep your campus plans in one
            calm, useful place.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          Campus Events & Clubs · Team 12
        </p>
      </section>
      <main className="flex min-h-screen items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandLogo height={64} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
            Your campus starts here
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Sign in to Campus Events & Clubs
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choose the Google account you use for Campus Events & Clubs. Campus access and your role are managed by the school.
          </p>
          {(configurationError || error) && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{configurationError || error}</p>}
          <Button type="button" variant="secondary" className="mt-7 w-full bg-white" busy={loading} busyFeedback="notice" disabled={Boolean(configurationError)} onClick={() => void submit()}>
            <GoogleMark />Continue with Google
          </Button>
          {loading && <OperationNotice title="Connecting to Google" description="Complete sign-in in the Google account chooser to continue." />}
          {redirectAvailable && <Button variant="ghost" className="mt-3 w-full" onClick={() => { setError(""); setLoading(true); void continueWithGoogleRedirect().catch(cause => { setLoading(false); setError(signInError(cause)) }) }}>Open Google sign-in in this tab</Button>}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <Icon
              name="lock"
              className="mt-0.5 size-4 shrink-0 text-slate-400"
            />
            <p className="text-xs leading-5 text-slate-500">
              Google confirms your identity. Campus Events & Clubs checks your membership and assigned role before opening your dashboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.01v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.34Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.41 13.91a6 6 0 0 1 0-3.82V7.5H3.07a10 10 0 0 0 0 9l3.34-2.59Z" />
    <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.82 1.52l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.5l3.34 2.59A5.99 5.99 0 0 1 12 5.97Z" />
  </svg>
}
