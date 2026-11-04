import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: { viewport: { width: 1440, height: 900 }, baseURL: "http://127.0.0.1:5174", actionTimeout: 10000, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "node scripts/test-stack.mjs", url: "http://127.0.0.1:5174", reuseExistingServer: false, timeout: 120000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 10000 } },
})
