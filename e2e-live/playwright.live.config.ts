import { defineConfig, devices } from '@playwright/test'

/**
 * Runs e2e-live specs against a deployed site: LIVE_URL=https://... (default production).
 * Chromium by default; pass --project=firefox / webkit / mobile-chrome / mobile-safari
 * (or --project='*') for other engines.
 */
export default defineConfig({
  testDir: '.',
  workers: 1,
  reporter: 'line',
  timeout: 180_000,
  use: { baseURL: process.env.LIVE_URL ?? 'https://privacypdftools.com', acceptDownloads: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
})
