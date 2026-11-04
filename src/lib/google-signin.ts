import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect } from "firebase/auth"
import { auth } from "./firebase"

function provider() {
  const google = new GoogleAuthProvider()
  // Google shows the current browser profile's account chooser. Campus membership
  // and roles are checked separately by our API after authentication.
  google.setCustomParameters({ prompt: "select_account" })
  return google
}
export async function continueWithGoogle() {
  if (!auth) throw new Error("Sign-in is not configured. Contact the project administrator.")
  await signInWithPopup(auth, provider())
}
export async function continueWithGoogleRedirect() {
  if (!auth) throw new Error("Sign-in is not configured. Contact the project administrator.")
  await signInWithRedirect(auth, provider())
}
let redirectResult: Promise<unknown> | undefined
export function finishGoogleRedirect() {
  return auth ? (redirectResult ||= getRedirectResult(auth)) : Promise.resolve(null)
}
export function signInError(cause: unknown): string {
  const code = (cause as { code?: string })?.code
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "Google sign-in was cancelled. You can try again."
    case "auth/popup-blocked": return "Your browser blocked the sign-in window. Allow popups or use the option below."
    case "auth/network-request-failed": return "Cannot reach Google sign-in. Check your connection and try again."
    case "auth/unauthorized-domain": return "Google sign-in is not enabled for this app address. Contact the project administrator."
    case "auth/operation-not-allowed": return "Google sign-in needs to be enabled for Campus Pulse. Contact the project administrator."
    case "auth/account-exists-with-different-credential": return "Your existing campus account needs to be linked to Google. Contact the project administrator so your existing registrations can be preserved."
    case "auth/user-disabled": return "This account has been disabled. Contact the project administrator."
    case "auth/too-many-requests": return "Too many sign-in attempts. Please wait and try again."
    default: return "Google sign-in could not be completed. Please try again."
  }
}
