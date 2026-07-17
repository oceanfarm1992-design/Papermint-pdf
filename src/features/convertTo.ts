import { PDFDocument, rgb, type RGB } from '@cantoo/pdf-lib'
import JSZip from 'jszip'
import type { OutputFile, ProcessFn } from '@/types/tool'
import { canvasToBytes, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { blocksToPdf, paragraphsToPdf, type Block, type Paragraph, type Run } from '@/utils/textLayout'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
}

async function fileToImageBytes(
  file: File,
): Promise<{ bytes: Uint8Array; kind: 'png' | 'jpg'; w: number; h: number }> {
  const isJpg = file.type === 'image/jpeg'
  const isPng = file.type === 'image/png'
  if (isJpg || isPng) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const dims = await imageDims(file)
    return { bytes, kind: isJpg ? 'jpg' : 'png', ...dims }
  }
  // WebP / GIF / BMP / anything else: rasterize via canvas to PNG
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new UserError(`“${file.name}” could not be decoded as an image.`)
  })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const c2d = canvas.getContext('2d')
  if (!c2d) throw new UserError('Canvas is unavailable in this browser.')
  c2d.drawImage(bitmap, 0, 0)
  bitmap.close()
  const bytes = await canvasToBytes(canvas, 'image/png')
  return { bytes, kind: 'png', w: canvas.width, h: canvas.height }
}

function imageDims(file: File): Promise<{ w: number; h: number }> {
  return createImageBitmap(file).then((b) => {
    const d = { w: b.width, h: b.height }
    b.close()
    return d
  })
}

export const imagesToPdf: ProcessFn = async (files, options, ctx) => {
  const doc = await PDFDocument.create()
  doc.setProducer('Privacy PDF Tools — privacypdftools.com')
  const pageSize = String(options.pageSize ?? 'fit')
  const landscape = Boolean(options.landscape)

  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Adding ${file.name}`)
    const { bytes, kind, w, h } = await fileToImageBytes(file)
    const image = kind === 'jpg' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes)

    if (pageSize === 'fit') {
      // 1 px = 0.75 pt so images print at 96 dpi
      const pw = w * 0.75
      const ph = h * 0.75
      const page = doc.addPage([pw, ph])
      page.drawImage(image, { x: 0, y: 0, width: pw, height: ph })
    } else {
      let [pw, ph] = PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4!
      if (landscape) [pw, ph] = [ph, pw]
      const page = doc.addPage([pw, ph])
      const margin = 24
      const scale = Math.min((pw - margin * 2) / w, (ph - margin * 2) / h)
      const dw = w * scale
      const dh = h * scale
      page.drawImage(image, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh })
    }
  }
  ctx.onProgress(0.95, 'Saving PDF')
  const name = files.length === 1 && files[0] ? `${baseName(files[0].name)}.pdf` : 'images.pdf'
  return [{ name, blob: await savePdfBlob(doc) }]
}

export const svgToPdf: ProcessFn = async (files, _options, ctx) => {
  const doc = await PDFDocument.create()
  doc.setProducer('Privacy PDF Tools — privacypdftools.com')

  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Rasterizing ${file.name}`)
    const text = await file.text()
    const svgBlob = new Blob([text], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new UserError(`“${file.name}” is not a valid SVG file.`))
        el.src = url
      })
      const w = img.naturalWidth || 1024
      const h = img.naturalHeight || 1024
      const scale = 2 // rasterize at 2x for crispness
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
      const c2d = canvas.getContext('2d')
      if (!c2d) throw new UserError('Canvas is unavailable in this browser.')
      c2d.scale(scale, scale)
      c2d.drawImage(img, 0, 0, w, h)
      const png = await doc.embedPng(await canvasToBytes(canvas, 'image/png'))
      const page = doc.addPage([w * 0.75, h * 0.75])
      page.drawImage(png, { x: 0, y: 0, width: w * 0.75, height: h * 0.75 })
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  ctx.onProgress(0.95, 'Saving PDF')
  const name = files.length === 1 && files[0] ? `${baseName(files[0].name)}.pdf` : 'vector.pdf'
  return [{ name, blob: await savePdfBlob(doc) }]
}

/** Split a line of Markdown into styled runs (**bold**, *italic*, `code`). */
function mdInlineRuns(text: string): Run[] {
  const runs: Run[] = []
  const re = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`(.+?)`/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) })
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true })
    else if (m[4] !== undefined) runs.push({ text: m[4], italic: true })
    else if (m[5] !== undefined) runs.push({ text: m[5], mono: true })
    last = re.lastIndex
  }
  if (last < text.length) runs.push({ text: text.slice(last) })
  return runs.length > 0 ? runs : [{ text: text || ' ' }]
}

export const textToPdf: ProcessFn = async (files, _options, ctx) => {
  const outputs: OutputFile[] = []
  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Converting ${file.name}`)
    const text = await file.text()
    const isMd = /\.(md|markdown)$/i.test(file.name)
    const paras: Paragraph[] = []
    for (const rawLine of text.replace(/\r\n/g, '\n').split('\n')) {
      const line = rawLine.trimEnd()
      if (isMd) {
        const h = /^(#{1,6})\s+(.*)$/.exec(line)
        if (h && h[1] && h[2] !== undefined) {
          const level = h[1].length
          paras.push({
            runs: mdInlineRuns(h[2]).map((r) => ({ ...r, bold: true })),
            size: level === 1 ? 20 : level === 2 ? 16 : 13,
            spaceBefore: 10,
          })
          continue
        }
        const bullet = /^[-*+]\s+(.*)$/.exec(line)
        if (bullet && bullet[1] !== undefined) {
          paras.push({ runs: [{ text: '•  ' }, ...mdInlineRuns(bullet[1])] })
          continue
        }
        paras.push({ runs: mdInlineRuns(line || ' ') })
      } else {
        paras.push({ text: line || ' ' })
      }
    }
    const doc = await paragraphsToPdf(paras, baseName(file.name))
    outputs.push({ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) })
  }
  return outputs
}

// ─────────────────── Office formats → PDF ───────────────────

async function readZipEntry(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path)
  return entry ? entry.async('string') : null
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror'))
    throw new UserError('The document XML could not be parsed — the file may be corrupted.')
  return doc
}

/** Read a WordprocessingML `w:val` attribute regardless of prefix handling. */
function wVal(el: Element | null | undefined): string | null {
  return el ? (el.getAttribute('w:val') ?? el.getAttributeNS('*', 'val')) : null
}

function childNS(parent: Element, name: string): Element | null {
  return parent.getElementsByTagNameNS('*', name)[0] ?? null
}

/** A WordprocessingML on/off toggle (`<w:b/>`, `<w:b w:val="false"/>`). */
function toggleOn(rPr: Element | null, name: string): boolean {
  const el = rPr ? childNS(rPr, name) : null
  if (!el) return false
  const val = wVal(el)
  return val !== '0' && val !== 'false' && val !== 'off'
}

function hexToRgb(hex: string | null): RGB | undefined {
  if (!hex || hex.toLowerCase() === 'auto' || !/^[0-9a-fA-F]{6}$/.test(hex)) return undefined
  const n = parseInt(hex, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Convert a single `w:r` run into a styled Run, or null if it has no text. */
function parseDocxRun(r: Element, forceBold: boolean): Run | null {
  let text = ''
  for (const node of Array.from(r.childNodes)) {
    if (node.nodeType !== 1) continue
    const local = (node as Element).localName
    if (local === 't') text += node.textContent ?? ''
    else if (local === 'tab') text += '  '
    else if (local === 'br' || local === 'cr') text += ' '
  }
  if (!text) return null
  const rPr = childNS(r, 'rPr')
  const szHalf = Number(wVal(rPr ? childNS(rPr, 'sz') : null))
  const size = Number.isFinite(szHalf) && szHalf > 0 ? szHalf / 2 : undefined
  const color = hexToRgb(wVal(rPr ? childNS(rPr, 'color') : null))
  return {
    text,
    bold: forceBold || toggleOn(rPr, 'b'),
    italic: toggleOn(rPr, 'i'),
    ...(size ? { size } : {}),
    ...(color ? { color } : {}),
  }
}

const headingSize = (level: number): number =>
  level <= 1 ? 22 : level === 2 ? 17 : level === 3 ? 14 : 12

function parseDocxParagraph(p: Element): Paragraph {
  const pPr = childNS(p, 'pPr')
  const styleVal = wVal(pPr ? childNS(pPr, 'pStyle') : null) ?? ''
  const headingMatch = /heading\s*([1-6])/i.exec(styleVal)
  const isTitle = /^title$/i.test(styleVal)
  const level = headingMatch ? Number(headingMatch[1]) : isTitle ? 1 : 0
  const isList = (pPr ? childNS(pPr, 'numPr') : null) !== null
  const jc = wVal(pPr ? childNS(pPr, 'jc') : null)
  const align: Paragraph['align'] =
    jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : 'left'

  const runs: Run[] = []
  for (const r of Array.from(p.getElementsByTagNameNS('*', 'r'))) {
    const run = parseDocxRun(r, level > 0)
    if (run) runs.push(run)
  }
  if (isList && runs[0]) runs[0] = { ...runs[0], text: `•  ${runs[0].text}` }

  return {
    runs: runs.length > 0 ? runs : [{ text: ' ' }],
    size: level > 0 ? headingSize(level) : 11,
    align,
    spaceBefore: level > 0 ? 12 : 3,
  }
}

function parseDocxTable(tbl: Element): Block {
  const rows: string[][] = []
  for (const tr of Array.from(tbl.getElementsByTagNameNS('*', 'tr'))) {
    const cells: string[] = []
    for (const tc of Array.from(tr.getElementsByTagNameNS('*', 'tc'))) {
      let text = ''
      for (const t of Array.from(tc.getElementsByTagNameNS('*', 't'))) text += t.textContent ?? ''
      cells.push(text.trim())
    }
    if (cells.length > 0) rows.push(cells)
  }
  const firstTr = tbl.getElementsByTagNameNS('*', 'tr')[0]
  const header = firstTr ? childNS(firstTr, 'tblHeader') !== null : false
  return { rows, header, spaceBefore: 6 }
}

export const docxToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Reading document')
  const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => {
    throw new UserError('This is not a valid .docx file.')
  })
  const xml = await readZipEntry(zip, 'word/document.xml')
  if (!xml)
    throw new UserError(
      'This is not a valid .docx file (missing document.xml). Legacy .doc files are not supported.',
    )

  ctx.onProgress(0.4, 'Converting content')
  const dom = parseXml(xml)
  const body = childNS(dom.documentElement, 'body')
  if (!body) throw new UserError('No text found in this document.')

  // Walk the body in document order so paragraphs and tables stay interleaved.
  const blocks: Block[] = []
  for (const child of Array.from(body.children)) {
    if (child.localName === 'p') blocks.push(parseDocxParagraph(child))
    else if (child.localName === 'tbl') blocks.push(parseDocxTable(child))
  }

  const hasText = blocks.some((b) =>
    'rows' in b
      ? b.rows.some((r) => r.some((c) => c.trim()))
      : (b.runs ?? []).some((r) => r.text.trim()),
  )
  if (!hasText) throw new UserError('No text found in this document.')

  ctx.onProgress(0.85, 'Laying out PDF')
  const doc = await blocksToPdf(blocks, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

/** Beyond this many columns a grid becomes unreadable, so fall back to text. */
const MAX_TABLE_COLS = 12

/** Turn a matrix of cell strings into a table block, or mono text if too wide. */
function rowsToBlocks(rows: string[][], header: boolean, spaceBefore?: number): Block[] {
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0)
  if (maxCols === 0) return []
  if (maxCols <= MAX_TABLE_COLS) return [{ rows, header, spaceBefore }]
  return rows.map((r) => ({ text: r.join('   ') || ' ', mono: true, size: 9 }))
}

/** Zero-based column index from an A1-style cell reference (e.g. "AB12" → 27). */
function colIndexFromRef(ref: string): number {
  const m = /^([A-Z]+)/.exec(ref)
  if (!m?.[1]) return 0
  let n = 0
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Quote-aware CSV parser (handles commas and newlines inside quoted fields). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const t = text.replace(/\r\n?/g, '\n')
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  row.push(field)
  rows.push(row)
  const last = rows[rows.length - 1]
  if (last && last.length === 1 && last[0] === '') rows.pop()
  return rows
}

export const xlsxToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')

  // CSV path — render as a real grid with the first row as a header.
  if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
    const rows = parseCsv(await file.text())
    const doc = await blocksToPdf(rowsToBlocks(rows, true), baseName(file.name))
    return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
  }

  ctx.onProgress(0.1, 'Reading workbook')
  const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => {
    throw new UserError('This is not a valid .xlsx file.')
  })

  // Shared strings
  const sharedXml = await readZipEntry(zip, 'xl/sharedStrings.xml')
  const shared: string[] = []
  if (sharedXml) {
    const dom = parseXml(sharedXml)
    for (const si of Array.from(dom.getElementsByTagNameNS('*', 'si'))) {
      let s = ''
      for (const t of Array.from(si.getElementsByTagNameNS('*', 't'))) s += t.textContent ?? ''
      shared.push(s)
    }
  }

  // Sheet display names, in workbook order
  const wbXml = await readZipEntry(zip, 'xl/workbook.xml')
  const sheetNames: string[] = []
  if (wbXml) {
    const d = parseXml(wbXml)
    for (const sh of Array.from(d.getElementsByTagNameNS('*', 'sheet')))
      sheetNames.push(sh.getAttribute('name') ?? '')
  }

  const sheetPaths = Object.keys(zip.files)
    .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0))
  if (sheetPaths.length === 0) throw new UserError('No worksheets found in this file.')

  const blocks: Block[] = []
  for (let s = 0; s < sheetPaths.length; s++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(0.2 + (s / sheetPaths.length) * 0.6, `Converting sheet ${s + 1}`)
    const path = sheetPaths[s]
    if (!path) continue
    const xml = await readZipEntry(zip, path)
    if (!xml) continue
    const dom = parseXml(xml)
    blocks.push({
      text: sheetNames[s] || `Sheet ${s + 1}`,
      size: 15,
      bold: true,
      spaceBefore: 6,
      pageBreak: s > 0,
    })
    const rows: string[][] = []
    for (const row of Array.from(dom.getElementsByTagNameNS('*', 'row'))) {
      const cells: string[] = []
      for (const c of Array.from(row.getElementsByTagNameNS('*', 'c'))) {
        const ci = colIndexFromRef(c.getAttribute('r') ?? '')
        const type = c.getAttribute('t')
        let value = ''
        if (type === 'inlineStr') {
          value = c.textContent?.trim() ?? ''
        } else {
          const v = c.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? ''
          value = type === 's' ? (shared[Number(v)] ?? '') : v
        }
        cells[ci] = value
      }
      // Fill gaps left by omitted empty cells so columns stay aligned.
      rows.push(Array.from({ length: cells.length }, (_, i) => cells[i] ?? ''))
    }
    blocks.push(...rowsToBlocks(rows, false))
  }
  ctx.onProgress(0.9, 'Laying out PDF')
  const doc = await blocksToPdf(blocks, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

/** Parse a DrawingML run (`a:r`) with its inline styling, or null if empty. */
function parsePptxRun(r: Element, baseSize: number): Run | null {
  let text = ''
  for (const t of Array.from(r.getElementsByTagNameNS('*', 't'))) text += t.textContent ?? ''
  if (!text) return null
  const rPr = childNS(r, 'rPr')
  const b = rPr?.getAttribute('b')
  const i = rPr?.getAttribute('i')
  const szAttr = rPr?.getAttribute('sz')
  const size = szAttr && Number(szAttr) > 0 ? Number(szAttr) / 100 : baseSize
  return {
    text,
    bold: b === '1' || b === 'true',
    italic: i === '1' || i === 'true',
    size,
  }
}

export const pptxToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.1, 'Reading presentation')
  const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => {
    throw new UserError('This is not a valid .pptx file.')
  })
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0))
  if (slidePaths.length === 0)
    throw new UserError('No slides found in this file. Legacy .ppt files are not supported.')

  const blocks: Block[] = []
  for (let s = 0; s < slidePaths.length; s++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(0.2 + (s / slidePaths.length) * 0.6, `Converting slide ${s + 1}`)
    const path = slidePaths[s]
    if (!path) continue
    const xml = await readZipEntry(zip, path)
    if (!xml) continue
    const dom = parseXml(xml)
    blocks.push({ text: `Slide ${s + 1}`, size: 18, bold: true, spaceBefore: 8, pageBreak: s > 0 })
    // Each a:p inside a shape is a paragraph of styled runs (a:r → a:t)
    for (const p of Array.from(dom.getElementsByTagNameNS('*', 'p'))) {
      const runs: Run[] = []
      for (const r of Array.from(p.getElementsByTagNameNS('*', 'r'))) {
        const run = parsePptxRun(r, 12)
        if (run) runs.push(run)
      }
      if (runs.some((r) => r.text.trim())) blocks.push({ runs, size: 12, spaceBefore: 4 })
    }
  }
  ctx.onProgress(0.9, 'Laying out PDF')
  const doc = await blocksToPdf(blocks, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

export const htmlToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.2, 'Parsing HTML')
  const html = await file.text()
  const dom = new DOMParser().parseFromString(html, 'text/html')
  dom.querySelectorAll('script,style,noscript,iframe,svg,nav,footer').forEach((el) => el.remove())

  const blocks: Block[] = []
  const title = dom.querySelector('title')?.textContent?.trim()
  if (title) blocks.push({ runs: [{ text: title, bold: true }], size: 22 })

  const collapse = (n: Node) => (n.textContent ?? '').replace(/\s+/g, ' ').trim()

  // Trim the outer whitespace off a run list and drop it if nothing remains.
  const finishRuns = (runs: Run[], extra: Partial<Paragraph>): void => {
    const kept = runs.filter((r) => r.text !== '')
    if (kept[0]) kept[0] = { ...kept[0], text: kept[0].text.replace(/^\s+/, '') }
    const last = kept[kept.length - 1]
    if (last) kept[kept.length - 1] = { ...last, text: last.text.replace(/\s+$/, '') }
    const final = kept.filter((r) => r.text !== '')
    if (final.some((r) => r.text.trim())) blocks.push({ runs: final, ...extra })
  }

  const walk = (el: Element): void => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1])
        const runs = htmlInlineRuns(child, true, false)
        finishRuns(runs, { size: Math.max(13, 22 - level * 2), spaceBefore: 10 })
      } else if (tag === 'p' || tag === 'blockquote') {
        finishRuns(htmlInlineRuns(child, false, false), { size: 11, spaceBefore: 4 })
      } else if (tag === 'pre') {
        for (const l of (child.textContent ?? '').replace(/\r\n/g, '\n').split('\n'))
          blocks.push({ text: l || ' ', mono: true, size: 9.5 })
      } else if (tag === 'li') {
        finishRuns([{ text: '•  ' }, ...htmlInlineRuns(child, false, false)], { size: 11 })
      } else if (tag === 'table') {
        const rows: string[][] = []
        for (const tr of Array.from(child.querySelectorAll('tr'))) {
          const cells = Array.from(tr.querySelectorAll('th,td')).map(collapse)
          if (cells.length > 0) rows.push(cells)
        }
        const header = child.querySelector('tr')?.querySelector('th') != null
        blocks.push(...rowsToBlocks(rows, header, 4))
      } else if (['div', 'main', 'article', 'section', 'body', 'ul', 'ol'].includes(tag)) {
        walk(child)
      }
    }
  }
  walk(dom.body)

  if (blocks.length === 0) {
    const text = dom.body?.textContent?.trim()
    if (!text) throw new UserError('No readable text found in this HTML file.')
    blocks.push({ text })
  }
  ctx.onProgress(0.8, 'Laying out PDF')
  const doc = await blocksToPdf(blocks, title ?? baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

/** Collect inline text as styled runs, honouring <strong>/<b>, <em>/<i>, <code>. */
function htmlInlineRuns(node: Node, bold: boolean, italic: boolean): Run[] {
  const out: Run[] = []
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      const t = (child.textContent ?? '').replace(/\s+/g, ' ')
      if (t) out.push({ text: t, bold, italic })
    } else if (child.nodeType === 1) {
      const tag = (child as Element).tagName.toLowerCase()
      if (tag === 'br') {
        out.push({ text: ' ', bold, italic })
        continue
      }
      const b = bold || tag === 'strong' || tag === 'b'
      const it = italic || tag === 'em' || tag === 'i'
      if (tag === 'code') {
        const t = (child.textContent ?? '').replace(/\s+/g, ' ')
        if (t) out.push({ text: t, bold: b, italic: it, mono: true })
      } else {
        out.push(...htmlInlineRuns(child, b, it))
      }
    }
  }
  return out
}
