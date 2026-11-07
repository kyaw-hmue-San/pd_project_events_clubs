import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
export const useEmulators = env.VITE_USE_EMULATORS === "true"
export const schoolEmailDomain = env.VITE_SCHOOL_EMAIL_DOMAIN || "lamduan.mfu.ac.th"
const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key)
export const configurationError = missing.length
  ? "Campus Events & Clubs has not been configured. Ask the project administrator to complete the public Firebase web configuration."
  : useEmulators && !config.projectId.startsWith("demo-")
    ? "Local emulator mode requires a demo Firebase project."
    : null
export const auth = configurationError ? null : getAuth(initializeApp(config))
if (auth && useEmulators) {
  const emulatorURL = env.VITE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099"
  if (new URL(emulatorURL).hostname !== "127.0.0.1") throw new Error("Auth emulator must use the local loopback address")
  connectAuthEmulator(auth, emulatorURL, { disableWarnings: true })
}

export const campusTimeZone = env.VITE_CAMPUS_TIME_ZONE || "Asia/Bangkok"
