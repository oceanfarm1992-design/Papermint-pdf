import { test, expect } from '@playwright/test'
import { makePdf, asUpload } from './helpers/pdf'

test.describe('app shell', () => {
  test('home page renders the tool catalog', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Papermint/)
    await expect(page.getByRole('link', { name: /merge pdf/i }).first()).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('static pages load', async ({ page }) => {
    for (const path of ['/about', '/privacy', '/faq']) {
      await page.goto(path)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('unknown route falls back to the not-found page without crashing', async ({ page }) => {
    await page.goto('/tool/does-not-exist-xyz')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: 'Dark theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

test.describe('pdf processing', () => {
  test('merges two PDFs entirely in the browser and offers a download', async ({ page }) => {
    const [a, b] = await Promise.all([makePdf(3, 'Fixture A'), makePdf(2, 'Fixture B')])

    // The privacy promise is part of the contract: fail if the app calls any
    // non-local origin while processing.
    const externalRequests: string[] = []
    page.on('request', (req) => {
      const url = new URL(req.url())
      if (url.hostname !== 'localhost') externalRequests.push(req.url())
    })

    await page.goto('/tool/merge-pdf')
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([asUpload('a.pdf', a), asUpload('b.pdf', b)])

    await page.getByRole('button', { name: 'Merge PDF', exact: true }).click()

    const downloadButton = page.getByRole('button', { name: /download/i }).first()
    await expect(downloadButton).toBeVisible({ timeout: 30_000 })

    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)

    expect(externalRequests, 'processing must never contact an external origin').toEqual([])
  })
})
