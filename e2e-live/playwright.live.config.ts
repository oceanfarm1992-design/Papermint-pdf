import { defineConfig, devices } from '@playwright/test'

/** Runs e2e-live specs against a deployed site: LIVE_URL=https://... (default production). */
export default defineConfig({
  testDir: '.',
  workers: 1,
  reporter: 'line',
  timeout: 180_000,
  use: { baseURL: process.env.LIVE_URL ?? 'https://privacypdftools.com', acceptDownloads: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
