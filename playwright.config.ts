import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  /**
   * LIVE RUNS ONLY: wake the API before any test budget starts.
   *
   * The gate is the environment variable, not a project — `e2e/global-setup.ts`
   * returns immediately and makes no request when `VITE_API_BASE_URL` is unset,
   * so the static suite stays the zero-network test bed it has always been.
   * Why it exists: Docs/api/live-red-2026-08-23.md.
   */
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // The default e2e run is STATIC MODE, pinned: vite would otherwise load
    // .env.local and flip the app live under the suite. An explicit empty
    // value overrides the file (decisions.md 2026-07-30 — static mode is the
    // test bed). A live-mode run must opt in deliberately by exporting
    // VITE_API_BASE_URL to BOTH this server and the Playwright process (the
    // fixture allows the API origin only when it sees the variable too).
    env: { VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? '' },
  },
})
