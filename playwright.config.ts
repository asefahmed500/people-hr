import { defineConfig, devices } from "@playwright/test"

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001"

/**
 * End-to-end suite configuration.
 *
 * The suite deliberately runs serialized with a single worker: the asserted
 * data lives in one shared PostgreSQL workspace scope, so parallel mutation
 * tests would race on optimistic-concurrency versions.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "./tests/reports/results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  reporter: [
    ["list"],
    ["html", { outputFolder: "tests/reports/html", open: "never" }],
    ["json", { outputFile: "tests/reports/results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 12_000,
    navigationTimeout: 45_000,
    ...devices["Desktop Chrome"],
    headless: false,
    launchOptions: { args: ["--start-maximized"] },
    viewport: { width: 1440, height: 1000 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
