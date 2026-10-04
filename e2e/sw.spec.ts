import { test, expect } from '@playwright/test'

test('service worker never caches an HTML fallback as a JS chunk', async ({ page }) => {
  await page.goto('/')
  // Wait for the production service worker to control the page
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) =>
        navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }),
      )
    }
  })

  const result = await page.evaluate(async () => {
    const missing = '/assets/does-not-exist-123.js'
    const res = await fetch(missing)
    await new Promise((r) => setTimeout(r, 300)) // let any cache write settle
    const cached = await caches.match(missing)
    const names = await caches.keys()
    return { status: res.status, type: res.headers.get('content-type'), cached: Boolean(cached), names }
  })

  expect(result.cached, `response was ${result.status} ${result.type}`).toBe(false)
  expect(result.names).not.toContain('papermint-v1')
})
