import type { OutputFile, ProcessFn } from '@/types/tool'
import {
  canvasToBlob,
  canvasToBytes,
  openWithPdfJs,
  renderPageToCanvas,
  throwIfAborted,
} from '@/utils/pdf'
import { extractLines, headingLevel, pagesToPlainText, escapeHtml, type TextLine } from '@/utils/pdfText'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'
import type { DocxBlock } from './officeBuilders'

const pad = (n: number, width: number) => String(n).padStart(width, '0')

// ─────────────────── Image renders (JPG / PNG / SVG / TIFF) ───────────────────

async function renderAllPages(
  file: File,
  scale: number,
  ctx: { onProgress: (f: number, s?: string) => void; signal: AbortSignal },
  perPage: (canvas: HTMLCanvasElement, pageNo: number, total: number) => Promise<void>,
): Promise<void> {
  const doc = await openWithPdfJs(file)
  try {
    const total = doc.numPages
    for (let i = 1; i <= total; i++) {
      throwIfAborted(ctx.signal)
      ctx.onProgress((i - 1) / total, `Rendering page ${i} of ${total}`)
      const page = await doc.getPage(i)
      const canvas = await renderPageToCanvas(page, scale)
      await perPage(canvas, i, total)
      canvas.width = 0 // release memory eagerly
      page.cleanup()
    }
  } finally {
    await doc.loadingTask.destroy()
  }
}

function makeImageConverter(type: 'image/jpeg' | 'image/png'): ProcessFn {
  return async (files, options, ctx) => {
    const dpi = Number(options.dpi ?? 150)
    const quality = type === 'image/jpeg' ? Number(options.quality ?? 90) / 100 : undefined
    const ext = type === 'image/jpeg' ? 'jpg' : 'png'
    const outputs: OutputFile[] = []
    for (const file of files) {
      const base = baseName(file.name)
      await renderAllPages(file, dpi / 72, ctx, async (canvas, pageNo, total) => {
        const blob = await canvasToBlob(canvas, type, quality)
        outputs.push({ name: `${base}-page-${pad(pageNo, String(total).length)}.${ext}`, blob })
      })
    }
    return outputs
  }
}

export const pdfToJpg: ProcessFn = makeImageConverter('image/jpeg')
export const pdfToPng: ProcessFn = makeImageConverter('image/png')

export const pdfToSvg: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const base = baseName(file.name)
  const outputs: OutputFile[] = []
  await renderAllPages(file, 2, ctx, async (canvas, pageNo, total) => {
    const dataUrl = canvas.toDataURL('image/png')
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width / 2}" height="${canvas.height / 2}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`
    outputs.push({
      name: `${base}-page-${pad(pageNo, String(total).length)}.svg`,
      blob: new Blob([svg], { type: 'image/svg+xml' }),
    })
  })
  return outputs
}

export const pdfToTiff: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const { encodeTiff } = await import('./tiff')
  const pages: { width: number; height: number; rgba: Uint8ClampedArray }[] = []
  await renderAllPages(file, 150 / 72, ctx, async (canvas) => {
    const c2d = canvas.getContext('2d')
    if (!c2d) throw new UserError('Canvas is unavailable in this browser.')
    const img = c2d.getImageData(0, 0, canvas.width, canvas.height)
    pages.push({ width: canvas.width, height: canvas.height, rgba: img.data })
  })
  ctx.onProgress(0.95, 'Encoding TIFF')
  return [{ name: `${baseName(file.name)}.tiff`, blob: encodeTiff(pages) }]
}

export const pdfToPowerPoint: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const { buildPptx } = await import('./officeBuilders')
  const slides: { pngBytes: Uint8Array; width: number; height: number }[] = []
  await renderAllPages(file, 2, ctx, async (canvas) => {
    slides.push({
      pngBytes: await canvasToBytes(canvas, 'image/png'),
      width: Math.round(canvas.width / 2),
      height: Math.round(canvas.height / 2),
    })
  })
  ctx.onProgress(0.95, 'Building presentation')
  return [{ name: `${baseName(file.name)}.pptx`, blob: await buildPptx(slides) }]
}

// ─────────────────── Text-based conversions ───────────────────

export const pdfToTxt: ProcessFn = async (files, _options, ctx) => {
  const outputs: OutputFile[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Extracting text from ${file.name}`)
    const { pages } = await extractLines(file, undefined, ctx.signal)
    const text = pagesToPlainText(pages)
    if (!text.trim()) {
      throw new UserError(
        `No selectable text found in “${file.name}”. It is probably a scan — use OCR PDF instead.`,
      )
    }
    outputs.push({
      name: `${baseName(file.name)}.txt`,
      blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
    })
  }
  return outputs
}

export const pdfToMarkdown: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages, medianSize } = await extractLines(
    file,
    (f) => ctx.onProgress(0.1 + f * 0.8),
    ctx.signal,
  )
  const md: string[] = []
  for (const lines of pages) {
    for (const line of lines) {
      const level = headingLevel(line, medianSize)
      if (level === 1) md.push(`# ${line.text}`, '')
      else if (level === 2) md.push(`## ${line.text}`, '')
      else md.push(line.text)
    }
    md.push('')
  }
  const text = md.join('\n')
  if (!text.trim())
    throw new UserError('No selectable text found — this looks like a scanned PDF. Use OCR PDF instead.')
  return [
    {
      name: `${baseName(file.name)}.md`,
      blob: new Blob([text], { type: 'text/markdown;charset=utf-8' }),
    },
  ]
}

export const pdfToHtml: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages, medianSize } = await extractLines(
    file,
    (f) => ctx.onProgress(0.1 + f * 0.8),
    ctx.signal,
  )
  const body: string[] = []
  pages.forEach((lines, p) => {
    body.push(`<section data-page="${p + 1}">`)
    for (const line of lines) {
      const level = headingLevel(line, medianSize)
      if (level === 1) body.push(`  <h1>${escapeHtml(line.text)}</h1>`)
      else if (level === 2) body.push(`  <h2>${escapeHtml(line.text)}</h2>`)
      else body.push(`  <p>${escapeHtml(line.text)}</p>`)
    }
    body.push('</section>')
  })
  const title = escapeHtml(baseName(file.name))
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:Georgia,serif;line-height:1.65;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1a1a1a}
  h1,h2{font-family:system-ui,sans-serif;line-height:1.25}
  section{margin-bottom:2.5rem;border-bottom:1px solid #eee;padding-bottom:1.5rem}
  p{margin:0 0 .7em}
</style>
</head>
<body>
${body.join('\n')}
</body>
</html>`
  return [
    { name: `${baseName(file.name)}.html`, blob: new Blob([html], { type: 'text/html;charset=utf-8' }) },
  ]
}

export const pdfToWord: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const { buildDocx } = await import('./officeBuilders')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages, medianSize } = await extractLines(
    file,
    (f) => ctx.onProgress(0.1 + f * 0.7),
    ctx.signal,
  )

  const blocks: DocxBlock[] = []
  let hasText = false
  // A "column line" is one whose content split into ≥2 cells on wide gaps —
  // the hallmark of a form field pair or a table row.
  const isColumnLine = (l: TextLine) => l.cells.length >= 2

  for (let p = 0; p < pages.length; p++) {
    const lines = pages[p]
    if (!lines) continue
    if (p > 0) blocks.push({ text: '', columns: undefined })

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        continue
      }
      hasText = true
      const level = headingLevel(line, medianSize)

      // Headings stand alone
      if (level === 1 || level === 2) {
        blocks.push({ text: line.text, heading: level })
        i++
        continue
      }

      // Detect a contiguous run of column lines and treat it as a table when it
      // has enough rows/columns; otherwise keep tab-separated columns.
      if (isColumnLine(line)) {
        const run: TextLine[] = []
        let j = i
        while (
          j < lines.length &&
          lines[j] &&
          isColumnLine(lines[j]!) &&
          headingLevel(lines[j]!, medianSize) === 0
        ) {
          run.push(lines[j]!)
          j++
        }
        const maxCols = run.reduce((m, r) => Math.max(m, r.cells.length), 0)
        const looksTabular = run.length >= 2 && maxCols >= 3
        if (looksTabular) {
          blocks.push({ table: run.map((r) => r.cells) })
        } else {
          for (const r of run) blocks.push({ text: r.text, columns: r.cells })
        }
        i = j
        continue
      }

      // Plain prose line — merge with the next only when it clearly wraps
      // (this line has no terminal punctuation and the next starts lowercase).
      let text = line.text
      let k = i + 1
      while (k < lines.length) {
        const next = lines[k]
        if (!next || isColumnLine(next) || headingLevel(next, medianSize) > 0) break
        if (/[.!?:;)]$/.test(text)) break
        if (!/^[a-z(“"']/.test(next.text)) break
        text += ` ${next.text}`
        k++
      }
      blocks.push({ text })
      i = k > i + 1 ? k : i + 1
    }
  }

  if (!hasText)
    throw new UserError('No selectable text found — this looks like a scanned PDF. Use OCR PDF instead.')
  ctx.onProgress(0.9, 'Building document')
  return [{ name: `${baseName(file.name)}.docx`, blob: await buildDocx(blocks, baseName(file.name)) }]
}

function linesToRows(pages: TextLine[][]): string[][] {
  const rows: string[][] = []
  for (const lines of pages) {
    for (const line of lines) {
      rows.push(line.cells.length > 1 ? line.cells : [line.text])
    }
  }
  return rows
}

export const pdfToExcel: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages } = await extractLines(file, (f) => ctx.onProgress(0.1 + f * 0.7), ctx.signal)
  const rows = linesToRows(pages)
  if (rows.length === 0)
    throw new UserError('No selectable text found — this looks like a scanned PDF. Use OCR PDF instead.')

  if (String(options.format) === 'csv') {
    const csv = rows
      .map((cells) =>
        cells.map((c) => (/[",\n]/.test(c) ? `"${c.replaceAll('"', '""')}"` : c)).join(','),
      )
      .join('\r\n')
    // BOM so Excel opens UTF-8 correctly
    return [
      {
        name: `${baseName(file.name)}.csv`,
        blob: new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }),
      },
    ]
  }

  const { buildXlsx } = await import('./officeBuilders')
  ctx.onProgress(0.9, 'Building spreadsheet')
  return [{ name: `${baseName(file.name)}.xlsx`, blob: await buildXlsx(rows, baseName(file.name)) }]
}

export const pdfToEpub: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const { buildEpub } = await import('./officeBuilders')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages, medianSize } = await extractLines(
    file,
    (f) => ctx.onProgress(0.1 + f * 0.7),
    ctx.signal,
  )

  // Chapters: split on level-1 headings; fall back to one chapter per page block
  const chapters: { title: string; paragraphs: string[] }[] = []
  let current: { title: string; paragraphs: string[] } | null = null
  for (const lines of pages) {
    for (const line of lines) {
      if (headingLevel(line, medianSize) === 1 && line.text.length < 90) {
        current = { title: line.text, paragraphs: [] }
        chapters.push(current)
      } else {
        if (!current) {
          current = { title: baseName(file.name), paragraphs: [] }
          chapters.push(current)
        }
        current.paragraphs.push(line.text)
      }
    }
  }
  if (chapters.length === 0)
    throw new UserError('No selectable text found — this looks like a scanned PDF. Use OCR PDF instead.')
  ctx.onProgress(0.9, 'Packaging EPUB')
  return [{ name: `${baseName(file.name)}.epub`, blob: await buildEpub(chapters, baseName(file.name)) }]
}

export const pdfToRtf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Extracting text')
  const { pages, medianSize } = await extractLines(
    file,
    (f) => ctx.onProgress(0.1 + f * 0.8),
    ctx.signal,
  )

  const rtfEscape = (s: string) => {
    let out = ''
    for (const ch of s) {
      const code = ch.codePointAt(0) ?? 63
      if (ch === '\\' || ch === '{' || ch === '}') out += `\\${ch}`
      else if (code < 128) out += ch
      else out += `\\u${code > 32767 ? code - 65536 : code}?`
    }
    return out
  }

  const parts: string[] = ['{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Helvetica;}}\\f0\\fs22']
  let hasText = false
  for (const lines of pages) {
    for (const line of lines) {
      hasText = true
      const level = headingLevel(line, medianSize)
      if (level === 1) parts.push(`{\\b\\fs36 ${rtfEscape(line.text)}}\\par`)
      else if (level === 2) parts.push(`{\\b\\fs28 ${rtfEscape(line.text)}}\\par`)
      else parts.push(`${rtfEscape(line.text)}\\par`)
    }
    parts.push('\\par')
  }
  parts.push('}')
  if (!hasText)
    throw new UserError('No selectable text found — this looks like a scanned PDF. Use OCR PDF instead.')
  return [
    {
      name: `${baseName(file.name)}.rtf`,
      blob: new Blob([parts.join('\n')], { type: 'application/rtf' }),
    },
  ]
}
