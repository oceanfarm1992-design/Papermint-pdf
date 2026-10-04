import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from '@cantoo/pdf-lib'
import { makePdf, asUpload } from './helpers/pdf'

/** Decoded content-stream operators of page 1 of a saved PDF. */
async function pageOps(buf: Buffer): Promise<string> {
  const doc = await PDFDocument.load(buf)
  const contents = doc.getPage(0).node.Contents()
  const refs = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : []
  let ops = ''
  for (const ref of refs) {
    const stream = doc.context.lookup(ref)
    if (stream instanceof PDFRawStream)
      ops += new TextDecoder().decode(decodePDFRawStream(stream).decode())
  }
  return ops
}

/** pdf-lib writes standard-font text as hex strings. */
const hex = (s: string) => Buffer.from(s, 'latin1').toString('hex').toUpperCase()

async function openEditor(page: Page, slug: string) {
  await page.goto(`/tool/${slug}`)
  await page
    .locator('input[type="file"]:not([webkitdirectory])')
    .first()
    .setInputFiles(asUpload('a.pdf', await makePdf(1, 'Editor')))
  await expect(page.getByLabel('Page 1 annotations')).toBeVisible({ timeout: 15_000 })
}

async function downloadOps(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Apply & download' }).click()
  const download = await downloadPromise
  return pageOps(readFileSync((await download.path())!))
}

for (const slug of ['add-text', 'sticky-notes']) {
  test(`${slug}: clicking the page opens a focused text box and typed text is saved`, async ({
    page,
  }) => {
    await openEditor(page, slug)

    await page.getByLabel('Page 1 annotations').click({ position: { x: 120, y: 120 } })
    const box = page.getByLabel('Annotation text')
    await expect(box).toBeFocused()
    await page.keyboard.type('Typed note')
    await box.blur()

    expect(await downloadOps(page)).toContain(hex('Typed note'))
  })
}

test('edit-pdf opens in "Edit existing text" mode and saves a retyped line', async ({ page }) => {
  await openEditor(page, 'edit-pdf')
  const toolbar = page.getByRole('toolbar', { name: 'Editing tools' })
  await expect(toolbar.getByRole('button', { name: 'Edit existing text' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('Click any highlighted line of text to retype it.')).toBeVisible()

  // The title line drawn by makePdf: "Editor — page 1 of 1"
  await page.locator('rect.cursor-text').first().dispatchEvent('pointerdown')
  const box = page.getByLabel('Annotation text')
  await expect(box).toBeFocused()
  await expect(box).toHaveValue(/Editor/)
  await box.fill('Retyped title')
  await box.blur()

  expect(await downloadOps(page)).toContain(hex('Retyped title'))
})

test('edit-pdf explains when a PDF has no editable text (scanned)', async ({ page }) => {
  const doc = await PDFDocument.create()
  doc.addPage([595, 842]).drawRectangle({ x: 50, y: 50, width: 200, height: 100 })
  const scanned = Buffer.from(await doc.save())

  await page.goto('/tool/edit-pdf')
  await page
    .locator('input[type="file"]:not([webkitdirectory])')
    .first()
    .setInputFiles(asUpload('scan.pdf', scanned))
  await expect(page.getByText(/No editable text was found in this PDF/)).toBeVisible({
    timeout: 15_000,
  })
})
