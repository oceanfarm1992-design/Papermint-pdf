import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makePdf } from '../e2e/helpers/pdf'

/**
 * Runs every generic tool against a deployed site (npm run e2e:live; LIVE_URL
 * overrides the target) with real inputs and records
 * pass/fail. Office/image inputs are produced by the site's own converters.
 */
const OUT = join(dirname(fileURLToPath(import.meta.url)), '.out')
mkdirSync(OUT, { recursive: true })
const results: Record<string, string> = {}
const files: Record<string, string> = {}

type Input = { name: string; mimeType: string; buffer: Buffer }
const load = (key: string, name: string, mimeType: string): Input => {
  const path = files[key]
  if (!path) throw new Error(`fixture ${key} was not produced`)
  return { name, mimeType, buffer: readFileSync(path) }
}

async function runTool(
  page: Page,
  slug: string,
  buttonName: string,
  inputs: Input[],
  opts: { fill?: Record<string, string>; save?: string; timeout?: number } = {},
) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`/tool/${slug}`)
  await page.locator('input[type="file"]').first().setInputFiles(inputs)
  for (const [label, value] of Object.entries(opts.fill ?? {})) {
    await page.getByLabel(label, { exact: false }).first().fill(value)
  }
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  const download = page.getByRole('button', { name: /download/i }).first()
  const alert = page.getByRole('alert').first()
  await expect(download.or(alert)).toBeVisible({ timeout: opts.timeout ?? 90_000 })
  if (await alert.isVisible()) {
    results[slug] = `FAIL: ${(await alert.innerText()).trim()}`
    return
  }
  if (opts.save) {
    const dl = page.waitForEvent('download')
    await download.click()
    const d = await dl
    const path = join(OUT, `${opts.save}-${d.suggestedFilename()}`)
    await d.saveAs(path)
    files[opts.save] = path
  }
  results[slug] = errors.length ? `PASS (page errors: ${errors.join(' | ')})` : 'PASS'
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

let pdf3: Input
let pdf2: Input
test.beforeAll(async () => {
  pdf3 = { name: 'a.pdf', mimeType: 'application/pdf', buffer: await makePdf(3, 'Fixture A') }
  pdf2 = { name: 'b.pdf', mimeType: 'application/pdf', buffer: await makePdf(2, 'Fixture B') }
})

const safe = (slug: string, fn: () => Promise<void>) =>
  test(slug, async () => {
    try {
      await fn()
    } catch (err) {
      results[slug] = `FAIL: ${(err as Error).message.split('\n')[0]}`
    }
  })

let page: Page
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ acceptDownloads: true })
})

// ── Producers first (their outputs feed later tools) ──
safe('pdf-to-word', () => runTool(page, 'pdf-to-word', 'PDF → Word', [pdf3], { save: 'docx' }))
safe('pdf-to-excel', () => runTool(page, 'pdf-to-excel', 'PDF → Excel', [pdf3], { save: 'xlsx' }))
safe('pdf-to-powerpoint', () =>
  runTool(page, 'pdf-to-powerpoint', 'PDF → PowerPoint', [pdf2], { save: 'pptx' }),
)
safe('pdf-to-jpg', () => runTool(page, 'pdf-to-jpg', 'PDF → JPG', [pdf2], { save: 'jpg' }))
safe('pdf-to-png', () => runTool(page, 'pdf-to-png', 'PDF → PNG', [pdf2], { save: 'png' }))
safe('pdf-to-svg', () => runTool(page, 'pdf-to-svg', 'PDF → SVG', [pdf2], { save: 'svg' }))
safe('pdf-to-html', () => runTool(page, 'pdf-to-html', 'PDF → HTML', [pdf3], { save: 'html' }))
safe('pdf-to-txt', () => runTool(page, 'pdf-to-txt', 'PDF → TXT', [pdf3], { save: 'txt' }))
safe('protect-pdf', () =>
  runTool(page, 'protect-pdf', 'Protect PDF', [pdf3], {
    fill: { Password: 'test1234' },
    save: 'locked',
  }),
)

// ── Organize / edit ──
safe('merge-pdf', () => runTool(page, 'merge-pdf', 'Merge PDF', [pdf3, pdf2]))
safe('split-pdf', () => runTool(page, 'split-pdf', 'Split PDF', [pdf3]))
safe('extract-pages', () =>
  runTool(page, 'extract-pages', 'Extract Pages', [pdf3], { fill: { 'Pages to extract': '1-2' } }),
)
safe('delete-pages', () =>
  runTool(page, 'delete-pages', 'Delete Pages', [pdf3], { fill: { 'Pages to delete': '2' } }),
)
safe('duplicate-pages', () => runTool(page, 'duplicate-pages', 'Duplicate Pages', [pdf3]))
safe('page-numbers', () => runTool(page, 'page-numbers', 'Add Page Numbers', [pdf3]))
safe('watermark-pdf', () => runTool(page, 'watermark-pdf', 'Watermark', [pdf3]))
safe('header-footer', () =>
  runTool(page, 'header-footer', 'Header / Footer', [pdf3], {
    fill: { 'Footer text': 'Page {page} of {total}' },
  }),
)

// ── Convert from PDF (non-producers) ──
safe('pdf-to-tiff', () => runTool(page, 'pdf-to-tiff', 'PDF → TIFF', [pdf2]))
safe('pdf-to-markdown', () => runTool(page, 'pdf-to-markdown', 'PDF → Markdown', [pdf3]))
safe('pdf-to-epub', () => runTool(page, 'pdf-to-epub', 'PDF → EPUB', [pdf3]))
safe('pdf-to-rtf', () => runTool(page, 'pdf-to-rtf', 'PDF → RTF', [pdf3]))

// ── Convert to PDF (consume producer outputs) ──
safe('jpg-to-pdf', () =>
  runTool(page, 'jpg-to-pdf', 'JPG → PDF', [load('jpg', 'p.jpg', 'image/jpeg')], { save: 'jpg2pdf' }),
)
safe('png-to-pdf', () => runTool(page, 'png-to-pdf', 'PNG → PDF', [load('png', 'p.png', 'image/png')]))
safe('image-to-pdf', () =>
  runTool(page, 'image-to-pdf', 'Image → PDF', [
    load('png', 'p.png', 'image/png'),
    load('jpg', 'p.jpg', 'image/jpeg'),
  ]),
)
safe('svg-to-pdf', () =>
  runTool(page, 'svg-to-pdf', 'SVG → PDF', [load('svg', 'p.svg', 'image/svg+xml')]),
)
safe('word-to-pdf', () =>
  runTool(page, 'word-to-pdf', 'Word → PDF', [
    load('docx', 'd.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
  ]),
)
safe('excel-to-pdf', () =>
  runTool(page, 'excel-to-pdf', 'Excel → PDF', [
    load('xlsx', 'x.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  ]),
)
safe('powerpoint-to-pdf', () =>
  runTool(page, 'powerpoint-to-pdf', 'PowerPoint → PDF', [
    load('pptx', 'p.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
  ]),
)
safe('html-to-pdf', () =>
  runTool(page, 'html-to-pdf', 'HTML → PDF', [load('html', 'h.html', 'text/html')]),
)
safe('text-to-pdf', () =>
  runTool(page, 'text-to-pdf', 'Text → PDF', [load('txt', 't.txt', 'text/plain')]),
)

// ── OCR ──
safe('ocr-pdf', () => runTool(page, 'ocr-pdf', 'OCR PDF', [pdf2], { timeout: 170_000 }))
safe('ocr-image', () =>
  runTool(page, 'ocr-image', 'OCR Image', [load('png', 'p.png', 'image/png')], { timeout: 170_000 }),
)
safe('searchable-pdf', () =>
  runTool(page, 'searchable-pdf', 'Searchable PDF', [pdf2], { timeout: 170_000 }),
)

// ── Security ──
safe('unlock-pdf', () =>
  runTool(page, 'unlock-pdf', 'Unlock PDF', [load('locked', 'l.pdf', 'application/pdf')], {
    fill: { 'Current password': 'test1234' },
  }),
)
safe('remove-password', () =>
  runTool(page, 'remove-password', 'Remove Password', [load('locked', 'l.pdf', 'application/pdf')], {
    fill: { 'Current password': 'test1234' },
  }),
)
safe('remove-metadata', () => runTool(page, 'remove-metadata', 'Metadata Removal', [pdf3]))

// ── Compression / images / smart ──
safe('compress-pdf', () => runTool(page, 'compress-pdf', 'Compress PDF', [pdf3]))
safe('compress-images', () =>
  runTool(page, 'compress-images', 'Compress Images', [load('jpg', 'p.jpg', 'image/jpeg')]),
)
safe('extract-images', () =>
  runTool(page, 'extract-images', 'Extract Images', [load('jpg2pdf', 'x.pdf', 'application/pdf')]),
)
safe('image-enhance', () =>
  runTool(page, 'image-enhance', 'Image Enhancement', [load('png', 'p.png', 'image/png')]),
)
safe('summarize-pdf', () => runTool(page, 'summarize-pdf', 'Summarize Text', [pdf3]))
safe('keywords-pdf', () => runTool(page, 'keywords-pdf', 'Keyword Extraction', [pdf3]))
safe('outline-pdf', () => runTool(page, 'outline-pdf', 'Document Outline', [pdf3]))

// Last in the serial run: print the report and fail if any tool failed.
test('every tool passed', () => {
  writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2))
  for (const [k, v] of Object.entries(results))
    console.log(`${v.startsWith('PASS') ? '✔' : '✘'} ${k}: ${v}`)
  const failed = Object.entries(results).filter(([, v]) => !v.startsWith('PASS'))
  expect(failed, 'tools that failed on the live site').toEqual([])
})
