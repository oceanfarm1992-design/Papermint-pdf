import { PDFDocument } from '@cantoo/pdf-lib'
import JSZip from 'jszip'
import type { OutputFile, ProcessFn } from '@/types/tool'
import { canvasToBytes, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { paragraphsToPdf, type Paragraph } from '@/utils/textLayout'
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
            text: h[2],
            size: level === 1 ? 20 : level === 2 ? 16 : 13,
            bold: true,
            spaceBefore: 10,
          })
          continue
        }
        const bullet = /^[-*+]\s+(.*)$/.exec(line)
        if (bullet && bullet[1] !== undefined) {
          paras.push({ text: `• ${bullet[1]}` })
          continue
        }
        paras.push({
          text:
            line
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/\*(.+?)\*/g, '$1')
              .replace(/`(.+?)`/g, '$1') || ' ',
        })
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

  ctx.onProgress(0.4, 'Converting paragraphs')
  const dom = parseXml(xml)
  const paras: Paragraph[] = []
  const paragraphs = dom.getElementsByTagNameNS('*', 'p')
  for (const p of Array.from(paragraphs)) {
    const styleEl = p.getElementsByTagNameNS('*', 'pStyle')[0]
    const style = styleEl?.getAttribute('w:val') ?? styleEl?.getAttributeNS('*', 'val') ?? ''
    const isList = p.getElementsByTagNameNS('*', 'numPr').length > 0
    let text = ''
    for (const t of Array.from(p.getElementsByTagNameNS('*', 't'))) text += t.textContent ?? ''
    if (isList && text) text = `• ${text}`
    const heading = /heading\s*1|Heading1/i.test(style) ? 1 : /heading\s*2|Heading2/i.test(style) ? 2 : 0
    paras.push({
      text: text || ' ',
      size: heading === 1 ? 20 : heading === 2 ? 15 : 11,
      bold: heading > 0,
      spaceBefore: heading > 0 ? 12 : 2,
    })
  }
  if (paras.every((p) => !p.text.trim())) throw new UserError('No text found in this document.')
  ctx.onProgress(0.85, 'Laying out PDF')
  const doc = await paragraphsToPdf(paras, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

export const xlsxToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')

  // CSV path
  if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
    const text = await file.text()
    const paras: Paragraph[] = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => ({ text: line.split(',').join('   ') || ' ', mono: true, size: 9 }))
    const doc = await paragraphsToPdf(paras, baseName(file.name))
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

  const sheetPaths = Object.keys(zip.files)
    .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
    .sort()
  if (sheetPaths.length === 0) throw new UserError('No worksheets found in this file.')

  const paras: Paragraph[] = []
  for (let s = 0; s < sheetPaths.length; s++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(0.2 + (s / sheetPaths.length) * 0.6, `Converting sheet ${s + 1}`)
    const path = sheetPaths[s]
    if (!path) continue
    const xml = await readZipEntry(zip, path)
    if (!xml) continue
    const dom = parseXml(xml)
    if (s > 0) paras.push({ text: ' ', pageBreak: true })
    paras.push({ text: `Sheet ${s + 1}`, size: 15, bold: true, spaceBefore: 6 })
    for (const row of Array.from(dom.getElementsByTagNameNS('*', 'row'))) {
      const cells: string[] = []
      for (const c of Array.from(row.getElementsByTagNameNS('*', 'c'))) {
        const type = c.getAttribute('t')
        if (type === 'inlineStr') {
          cells.push(c.textContent?.trim() ?? '')
          continue
        }
        const v = c.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? ''
        if (type === 's') {
          const idx = Number(v)
          cells.push(shared[idx] ?? '')
        } else {
          cells.push(v)
        }
      }
      paras.push({ text: cells.join('  |  ').slice(0, 300) || ' ', mono: true, size: 9 })
    }
  }
  ctx.onProgress(0.9, 'Laying out PDF')
  const doc = await paragraphsToPdf(paras, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
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

  const paras: Paragraph[] = []
  for (let s = 0; s < slidePaths.length; s++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(0.2 + (s / slidePaths.length) * 0.6, `Converting slide ${s + 1}`)
    const path = slidePaths[s]
    if (!path) continue
    const xml = await readZipEntry(zip, path)
    if (!xml) continue
    const dom = parseXml(xml)
    paras.push({ text: `Slide ${s + 1}`, size: 18, bold: true, spaceBefore: 8, pageBreak: s > 0 })
    // Each a:p inside a shape is a paragraph of runs (a:t)
    for (const p of Array.from(dom.getElementsByTagNameNS('*', 'p'))) {
      let text = ''
      for (const t of Array.from(p.getElementsByTagNameNS('*', 't'))) text += t.textContent ?? ''
      if (text.trim()) paras.push({ text, size: 12, spaceBefore: 4 })
    }
  }
  ctx.onProgress(0.9, 'Laying out PDF')
  const doc = await paragraphsToPdf(paras, baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}

export const htmlToPdf: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.2, 'Parsing HTML')
  const html = await file.text()
  const dom = new DOMParser().parseFromString(html, 'text/html')
  dom.querySelectorAll('script,style,noscript,iframe,svg,nav,footer').forEach((el) => el.remove())

  const paras: Paragraph[] = []
  const title = dom.querySelector('title')?.textContent?.trim()
  if (title) paras.push({ text: title, size: 22, bold: true })

  const walk = (el: Element): void => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      const text = (child as HTMLElement).innerText?.trim() ?? child.textContent?.trim() ?? ''
      if (!text) continue
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1])
        paras.push({ text, size: Math.max(13, 22 - level * 2), bold: true, spaceBefore: 10 })
      } else if (tag === 'p' || tag === 'blockquote' || tag === 'pre') {
        paras.push({ text, size: 11, spaceBefore: 4, mono: tag === 'pre' })
      } else if (tag === 'li') {
        paras.push({ text: `• ${text}`, size: 11 })
      } else if (
        ['div', 'main', 'article', 'section', 'body', 'ul', 'ol', 'table', 'tbody', 'tr'].includes(tag)
      ) {
        walk(child)
      }
    }
  }
  walk(dom.body)

  if (paras.length === 0) {
    const text = dom.body?.textContent?.trim()
    if (!text) throw new UserError('No readable text found in this HTML file.')
    paras.push({ text })
  }
  ctx.onProgress(0.8, 'Laying out PDF')
  const doc = await paragraphsToPdf(paras, title ?? baseName(file.name))
  return [{ name: `${baseName(file.name)}.pdf`, blob: await savePdfBlob(doc) }]
}
