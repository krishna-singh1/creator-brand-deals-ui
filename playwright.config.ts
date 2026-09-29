import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running web app AND a separately running API (ADR 0008).
 * Local: `docker compose up -d` + `./gradlew bootRun` in the API repo, then `npm run e2e` here.
 * CI: .github/workflows/ci.yml (job "E2E") starts the same stack on every PR. Staging: e2e-staging.yml runs the
 * `@smoke` subset against a deployed environment (E2E_BASE_URL + NEXT_PUBLIC_API_URL + MAILPIT_URL/MAILPIT_AUTH).
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // CI keeps an HTML report (uploaded as an artifact when a run fails).
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
