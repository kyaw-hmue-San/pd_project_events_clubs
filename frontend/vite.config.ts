import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from 'node:url'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, "VITE_")
  if (env.VITE_USE_EMULATORS === "true" && mode !== "test") {
    throw new Error("Firebase emulator settings are only allowed in test mode. Start the real app with npm run dev and VITE_USE_EMULATORS=false.")
  }
  return { root: frontendRoot, envDir: frontendRoot, plugins: [react(), tailwindcss()], server: { host: "localhost", port: 5173, strictPort: true } }
})
