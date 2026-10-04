import { test, expect, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { makePdf } from '../e2e/helpers/pdf'
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from '@cantoo/pdf-lib'

/** Count painting operators (stroke/fill/image/text) added on page 1 beyond the fixture's text. */
async function paintOps(buf: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
  const c = doc.getPage(0).node.Contents()
  const refs = c instanceof PDFArray ? c.asArray() : c ? [c] : []
  let ops = ''
  for (const r of refs) {
    const st = doc.context.lookup(r)
    if (st instanceof PDFRawStream) ops += new TextDecoder().decode(decodePDFRawStream(st).decode())
  }
  // Drawn paths/images, plus the test's "Hello" text (hex-encoded by pdf-lib)
  return (ops.match(/\s(S|f|B|Do)\s/g) ?? []).length + (ops.match(/48656C6C6F/gi) ?? []).length
}

/** Exercises the interactive (custom-page) tools end-to-end and records pass/fail. */
const results: Record<string, string> = {}
test.setTimeout(400_000)

/**
 * Drag inside the visible part of `target`. Fractions are of the target's width
 * and of the *visible* height, so the pointer never leaves the viewport (mouse
 * events outside it are not delivered).
 */
async function drag(page: Page, target: Locator, from: [number, number], to: [number, number]) {
  await target.scrollIntoViewIfNeeded()
  await target.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await page.evaluate(() => window.scrollBy(0, -120))
  const box = await target.boundingBox()
  if (!box) throw new Error('target not visible')
  const vp = page.viewportSize()!
  const top = Math.max(box.y, 0)
  const visH = Math.min(box.y + box.height, vp.height) - top
  const pt = ([fx, fy]: [number, number]) => [box.x + box.width * fx, top + visH * fy] as const
  const [x1, y1] = pt(from)
  const [x2, y2] = pt(to)
  await page.mouse.move(x1, y1)
  await page.mouse.down()
  await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 5 })
  await page.mouse.move(x2, y2, { steps: 5 })
  await page.mouse.up()
}

async function expectDownload(page: Page, button: Locator, mustPaint = false): Promise<string> {
  const dl = page.waitForEvent('download', { timeout: 45_000 })
  await button.click()
  const d = await dl
  const path = await d.path()
  const size = path ? readFileSync(path).length : 0
  if (size < 100) throw new Error(`download ${d.suggestedFilename()} is only ${size} bytes`)
  const ops = mustPaint ? await paintOps(readFileSync(path!)) : -1
  if (mustPaint && ops === 0)
    throw new Error(`${d.suggestedFilename()} contains no drawn content — edits were not saved`)
  return `${d.suggestedFilename()} (${size} bytes${mustPaint ? `, ${ops} paint ops` : ''})`
}

async function check(page: Page, slug: string, fn: () => Promise<string>) {
  const errors: string[] = []
  const onErr = (e: Error) => errors.push(e.message)
  page.on('pageerror', onErr)
  try {
    const detail = await fn()
    const alert = page.getByRole('alert').first()
    const alertText = (await alert.isVisible()) ? await alert.innerText() : ''
    results[slug] = alertText
      ? `FAIL: ${alertText}`
      : `PASS ${detail}${errors.length ? ` (page errors: ${errors.join(' | ')})` : ''}`
  } catch (err) {
    const alert = page.getByRole('alert').first()
    const alertText = (await alert.isVisible().catch(() => false)) ? await alert.innerText() : ''
    results[slug] =
      `FAIL: ${(err as Error).message.split('\n')[0]}${alertText ? ` | alert: ${alertText}` : ''}${errors.length ? ` | page errors: ${errors.join(' | ')}` : ''}`
  } finally {
    page.off('pageerror', onErr)
  }
}

async function open(
  page: Page,
  slug: string,
  files: { name: string; mimeType: string; buffer: Buffer }[],
) {
  await page.goto(`/tool/${slug}`)
  await page.locator('input[type="file"]:not([webkitdirectory])').first().setInputFiles(files)
  await page.waitForTimeout(3000)
}

test('interactive tools', async ({ page }) => {
  const pdfA = { name: 'a.pdf', mimeType: 'application/pdf', buffer: await makePdf(3, 'Interactive A') }
  const pdfB = {
    name: 'b.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdf(3, 'Interactive B changed'),
  }
  let formPdf: { name: string; mimeType: string; buffer: Buffer } | null = null

  for (const slug of ['organize-pdf', 'rotate-pdf', 'reverse-pages']) {
    await check(page, slug, async () => {
      await open(page, slug, [pdfA])
      await page
        .getByRole('button', { name: slug === 'reverse-pages' ? 'Reverse order' : 'Rotate all' })
        .click()
      return expectDownload(page, page.getByRole('button', { name: 'Download PDF' }))
    })
  }

  const editorCases: [string, string][] = [
    ['edit-pdf', 'Rectangle'],
    ['add-text', 'Add text'],
    ['draw-pdf', 'Draw'],
    ['highlight-pdf', 'Highlight'],
    ['shapes-pdf', 'Arrow'],
    ['sticky-notes', 'Sticky note'],
    ['whiteout-pdf', 'Whiteout'],
  ]
  for (const [slug, toolLabel] of editorCases) {
    await check(page, slug, async () => {
      await open(page, slug, [pdfA])
      await page
        .getByRole('toolbar', { name: 'Editing tools' })
        .getByRole('button', { name: toolLabel, exact: true })
        .click()
      const layer = page.getByLabel('Page 1 annotations')
      await drag(page, layer, [0.3, 0.3], [0.6, 0.45])
      if (toolLabel === 'Add text' || toolLabel === 'Sticky note') {
        await page.keyboard.type('Hello test')
        await page.mouse.click(5, 5)
      }
      return expectDownload(page, page.getByRole('button', { name: 'Apply & download' }), true)
    })
  }

  await check(page, 'add-images', async () => {
    await open(page, 'add-images', [pdfA])
    const pngPage = await page.context().newPage()
    const png = await pngPage.evaluate(() => {
      const c = document.createElement('canvas')
      c.width = 120
      c.height = 60
      const g = c.getContext('2d')!
      g.fillStyle = '#e11d48'
      g.fillRect(0, 0, 120, 60)
      return c.toDataURL('image/png').split(',')[1]
    })
    await pngPage.close()
    await page
      .getByRole('toolbar', { name: 'Editing tools' })
      .getByRole('button', { name: 'Insert image', exact: true })
      .click()
    const chooser = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null)
    await page.getByLabel('Page 1 annotations').click({ position: { x: 150, y: 150 } })
    const fc = await chooser
    if (fc)
      await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
    else
      await page
        .locator('input[type="file"][accept*="image"]')
        .last()
        .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
    await page.waitForTimeout(800)
    // Choosing the image arms it; a second click places it on the page
    await page.getByLabel('Page 1 annotations').click({ position: { x: 150, y: 150 } })
    await page.waitForTimeout(800)
    return expectDownload(page, page.getByRole('button', { name: 'Apply & download' }), true)
  })

  await check(page, 'crop-pdf', async () => {
    await open(page, 'crop-pdf', [pdfA])
    const target = page.locator('main canvas, main img').first()
    await drag(page, target, [0.1, 0.1], [0.8, 0.6])
    return expectDownload(page, page.getByRole('button', { name: 'Crop & download' }))
  })

  await check(page, 'redact-pdf', async () => {
    await open(page, 'redact-pdf', [pdfA])
    const target = page.locator('main canvas, main img').first()
    await drag(page, target, [0.1, 0.1], [0.7, 0.2])
    return expectDownload(page, page.getByRole('button', { name: 'Redact & download' }))
  })

  await check(page, 'sign-pdf', async () => {
    await open(page, 'sign-pdf', [pdfA])
    await drag(page, page.getByLabel('Signature drawing area'), [0.2, 0.6], [0.8, 0.4])
    await page.getByRole('button', { name: 'Use signature' }).click()
    await page.waitForTimeout(800)
    const layer = page.locator('main svg[aria-label^="Page 1"], main canvas').first()
    await layer.scrollIntoViewIfNeeded()
    const box = (await layer.boundingBox())!
    // The page may be scrolled partly above the viewport (Firefox scrolls it
    // further than Chromium) — click inside its visible part.
    const y = Math.min(Math.max(box.y, 0) + 150, page.viewportSize()!.height - 40)
    await page.mouse.click(box.x + box.width / 2, y)
    await page.waitForTimeout(800)
    return expectDownload(page, page.getByRole('button', { name: 'Apply & download' }), true)
  })

  await check(page, 'create-forms', async () => {
    await open(page, 'create-forms', [pdfA])
    const target = page.locator('main canvas, main img').first()
    await drag(page, target, [0.2, 0.2], [0.6, 0.27])
    const dl = page.waitForEvent('download', { timeout: 45_000 })
    await page.getByRole('button', { name: 'Create form & download' }).click()
    const d = await dl
    const p = await d.path()
    formPdf = { name: 'form.pdf', mimeType: 'application/pdf', buffer: readFileSync(p!) }
    return `${d.suggestedFilename()} (${formPdf.buffer.length} bytes)`
  })

  await check(page, 'fill-forms', async () => {
    if (!formPdf) throw new Error('no form PDF from create-forms')
    await open(page, 'fill-forms', [formPdf])
    const field = page.locator('main .card input:not([type="checkbox"]), main .card textarea').first()
    await field.fill('Filled by test')
    const buttons = (await page.getByRole('button').allInnerTexts()).join(' / ')
    const save = page.getByRole('button', { name: /download|save|fill/i }).last()
    if (!(await save.isVisible())) throw new Error(`no save button; buttons: ${buttons}`)
    return expectDownload(page, save)
  })

  await check(page, 'compare-pdf', async () => {
    await page.goto('/tool/compare-pdf')
    const inputs = page.locator('input[type="file"]:not([webkitdirectory])')
    await inputs.nth(0).setInputFiles([pdfA])
    await page.waitForTimeout(1000)
    await page.locator('input[type="file"]:not([webkitdirectory])').last().setInputFiles([pdfB])
    await page.waitForTimeout(6000)
    const canvases = await page.locator('main canvas, main img').count()
    const text = await page.locator('main').innerText()
    if (canvases < 2)
      throw new Error(`expected rendered pages, found ${canvases}; text: ${text.slice(0, 200)}`)
    return `${canvases} rendered canvases`
  })

  for (const [k, v] of Object.entries(results))
    console.log(`${v.startsWith('PASS') ? '✔' : '✘'} ${k}: ${v}`)
  const failed = Object.entries(results).filter(([, v]) => !v.startsWith('PASS'))
  expect(failed, 'interactive tools that failed on the live site').toEqual([])
})
