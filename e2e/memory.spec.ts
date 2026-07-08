import { test, expect } from '@playwright/test'
import { makePdf, asUpload } from './helpers/pdf'

/**
 * Memory-leak canary (Chromium only — uses performance.memory).
 * Processes a large PDF batch and asserts the JS heap stays under a generous
 * ceiling and the page remains responsive. It will not catch slow leaks, but
 * it fails loudly if a dependency update makes PDF processing balloon.
 */
test.describe('memory & large files', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'performance.memory is Chromium-only')

  test('large merge stays within memory budget and the UI survives', async ({ page }) => {
    test.setTimeout(180_000)
    const [big1, big2] = await Promise.all([makePdf(120, 'Big A'), makePdf(120, 'Big B')])

    await page.goto('/tool/merge-pdf')
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([asUpload('big-a.pdf', big1), asUpload('big-b.pdf', big2)])
    await page.getByRole('button', { name: 'Merge PDF', exact: true }).click()
    await expect(page.getByRole('button', { name: /download/i }).first()).toBeVisible({
      timeout: 120_000,
    })

    const heapMb = await page.evaluate(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      return mem ? mem.usedJSHeapSize / 1024 / 1024 : 0
    })
    expect(heapMb, `JS heap after large merge was ${heapMb.toFixed(0)} MB`).toBeLessThan(1024)

    // Page must still respond to interaction after heavy processing
    await page.getByRole('link', { name: 'All tools' }).click()
    await expect(page.getByRole('main')).toBeVisible()
  })
})
