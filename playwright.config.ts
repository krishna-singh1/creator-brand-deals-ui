import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running web app AND a separately running API (ADR 0008).
 * Local: `docker compose up -d` + `./gradlew bootRun` in the API repo, then `npm run e2e` here.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
