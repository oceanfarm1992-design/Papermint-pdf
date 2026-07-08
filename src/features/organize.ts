import { PDFDocument, StandardFonts, degrees, rgb } from '@cantoo/pdf-lib'
import type { ProcessFn } from '@/types/tool'
import { openWithPdfLib, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { parsePageRanges, parseRangeGroups } from '@/utils/ranges'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'
import { stampCenteredText, stampText, winAnsiStamp, type StampPosition } from './stampHelpers'

export const merge: ProcessFn = async (files, _options, ctx) => {
  const out = await PDFDocument.create()
  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Adding ${file.name}`)
    const src = await openWithPdfLib(file)
    const pages = await out.copyPages(src, src.getPageIndices())
    for (const p of pages) out.addPage(p)
  }
  ctx.onProgress(0.95, 'Saving')
  return [{ name: 'merged.pdf', blob: await savePdfBlob(out) }]
}

async function subsetPdf(src: PDFDocument, indices: number[]): Promise<Blob> {
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  for (const p of pages) out.addPage(p)
  return savePdfBlob(out)
}

export const split: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const src = await openWithPdfLib(file)
  const total = src.getPageCount()
  const base = baseName(file.name)
  const mode = String(options.mode ?? 'ranges')

  let groups: { label: string; indices: number[] }[] = []
  if (mode === 'single') {
    groups = Array.from({ length: total }, (_, i) => ({ label: `page-${i + 1}`, indices: [i] }))
  } else if (mode === 'every') {
    const n = Math.max(1, Number(options.every ?? 2))
    for (let start = 0; start < total; start += n) {
      const end = Math.min(start + n, total)
      groups.push({
        label: end - start === 1 ? `page-${start + 1}` : `pages-${start + 1}-${end}`,
        indices: Array.from({ length: end - start }, (_, k) => start + k),
      })
    }
  } else {
    const parsed = parseRangeGroups(String(options.ranges ?? ''), total)
    groups = parsed.map((indices) => {
      const first = (indices[0] ?? 0) + 1
      const last = (indices[indices.length - 1] ?? 0) + 1
      return { label: first === last ? `page-${first}` : `pages-${first}-${last}`, indices }
    })
  }

  const outputs = []
  for (let i = 0; i < groups.length; i++) {
    throwIfAborted(ctx.signal)
    const g = groups[i]
    if (!g) continue
    ctx.onProgress(i / groups.length, `Creating part ${i + 1} of ${groups.length}`)
    outputs.push({ name: `${base} (${g.label}).pdf`, blob: await subsetPdf(src, g.indices) })
  }
  return outputs
}

export const extractPages: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const src = await openWithPdfLib(file)
  const indices = parsePageRanges(String(options.pages ?? ''), src.getPageCount(), false)
  const base = baseName(file.name)

  if (options.separate) {
    const outputs = []
    for (let i = 0; i < indices.length; i++) {
      throwIfAborted(ctx.signal)
      const idx = indices[i]
      if (idx === undefined) continue
      ctx.onProgress(i / indices.length)
      outputs.push({ name: `${base} (page ${idx + 1}).pdf`, blob: await subsetPdf(src, [idx]) })
    }
    return outputs
  }
  ctx.onProgress(0.5, 'Extracting pages')
  return [{ name: `${base} (extracted).pdf`, blob: await subsetPdf(src, indices) }]
}

export const deletePages: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const src = await openWithPdfLib(file)
  const total = src.getPageCount()
  const toDelete = new Set(parsePageRanges(String(options.pages ?? ''), total, false))
  if (toDelete.size >= total) throw new UserError('You cannot delete every page — the PDF would be empty.')
  const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !toDelete.has(i))
  ctx.onProgress(0.5, 'Rebuilding document')
  return [{ name: `${baseName(file.name)} (pages removed).pdf`, blob: await subsetPdf(src, keep) }]
}

export const rotate: ProcessFn = async (files, options, ctx) => {
  const angle = Number(options.angle ?? 90)
  const outputs = []
  for (let f = 0; f < files.length; f++) {
    throwIfAborted(ctx.signal)
    const file = files[f]
    if (!file) continue
    ctx.onProgress(f / files.length, `Rotating ${file.name}`)
    const doc = await openWithPdfLib(file)
    const indices = parsePageRanges(String(options.pages ?? ''), doc.getPageCount(), true)
    for (const i of indices) {
      const page = doc.getPage(i)
      const current = ((page.getRotation().angle % 360) + 360) % 360
      page.setRotation(degrees((current + angle) % 360))
    }
    outputs.push({ name: `${baseName(file.name)} (rotated).pdf`, blob: await savePdfBlob(doc) })
  }
  return outputs
}

export const duplicatePages: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const src = await openWithPdfLib(file)
  const total = src.getPageCount()
  const selected = new Set(parsePageRanges(String(options.pages ?? ''), total, true))
  const order: number[] = []
  for (let i = 0; i < total; i++) {
    order.push(i)
    if (selected.has(i)) order.push(i)
  }
  ctx.onProgress(0.5, 'Duplicating pages')
  return [{ name: `${baseName(file.name)} (duplicated).pdf`, blob: await subsetPdf(src, order) }]
}

export const reversePages: ProcessFn = async (files, _options, ctx) => {
  const outputs = []
  for (let f = 0; f < files.length; f++) {
    throwIfAborted(ctx.signal)
    const file = files[f]
    if (!file) continue
    ctx.onProgress(f / files.length, `Reversing ${file.name}`)
    const src = await openWithPdfLib(file)
    const order = src.getPageIndices().reverse()
    outputs.push({ name: `${baseName(file.name)} (reversed).pdf`, blob: await subsetPdf(src, order) })
  }
  return outputs
}

export const pageNumbers: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const doc = await openWithPdfLib(file)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const total = doc.getPageCount()
  const start = Math.max(1, Number(options.start ?? 1))
  const size = Number(options.size ?? 11)
  const position = String(options.position ?? 'bottom-center') as StampPosition
  const format = String(options.format ?? 'n')

  for (let i = 0; i < total; i++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(i / total, `Numbering page ${i + 1}`)
    const n = start + i
    const label =
      format === 'n-of-total' ? `Page ${n} of ${total + start - 1}` : format === 'dash' ? `- ${n} -` : String(n)
    stampText(doc.getPage(i), font, label, size, position)
  }
  return [{ name: `${baseName(file.name)} (numbered).pdf`, blob: await savePdfBlob(doc) }]
}

const WATERMARK_COLORS = {
  gray: rgb(0.45, 0.47, 0.5),
  red: rgb(0.8, 0.15, 0.15),
  blue: rgb(0.15, 0.3, 0.75),
  black: rgb(0.05, 0.05, 0.05),
} as const

export const watermark: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const text = String(options.text ?? '').trim()
  if (!text) throw new UserError('Please enter watermark text.')
  const doc = await openWithPdfLib(file)
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const safe = winAnsiStamp(font, text)
  const size = Number(options.size ?? 48)
  const opacity = Math.min(1, Math.max(0.02, Number(options.opacity ?? 15) / 100))
  const colorKey = String(options.color ?? 'gray') as keyof typeof WATERMARK_COLORS
  const color = WATERMARK_COLORS[colorKey] ?? WATERMARK_COLORS.gray
  const diagonal = Boolean(options.diagonal ?? true)

  const total = doc.getPageCount()
  for (let i = 0; i < total; i++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(i / total, `Stamping page ${i + 1}`)
    stampCenteredText(doc.getPage(i), font, safe, size, { diagonal, color, opacity })
  }
  return [{ name: `${baseName(file.name)} (watermarked).pdf`, blob: await savePdfBlob(doc) }]
}

export const headerFooter: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const headerTpl = String(options.header ?? '').trim()
  const footerTpl = String(options.footer ?? '').trim()
  if (!headerTpl && !footerTpl) throw new UserError('Enter header text, footer text, or both.')

  const doc = await openWithPdfLib(file)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const size = Number(options.size ?? 10)
  const align = String(options.align ?? 'center') as 'left' | 'center' | 'right'
  const total = doc.getPageCount()
  const today = new Date().toLocaleDateString()

  const fill = (tpl: string, page: number) =>
    tpl.replaceAll('{page}', String(page)).replaceAll('{total}', String(total)).replaceAll('{date}', today)

  for (let i = 0; i < total; i++) {
    throwIfAborted(ctx.signal)
    ctx.onProgress(i / total, `Processing page ${i + 1}`)
    const page = doc.getPage(i)
    if (headerTpl) {
      stampText(page, font, winAnsiStamp(font, fill(headerTpl, i + 1)), size, `top-${align}` as StampPosition)
    }
    if (footerTpl) {
      stampText(page, font, winAnsiStamp(font, fill(footerTpl, i + 1)), size, `bottom-${align}` as StampPosition)
    }
  }
  return [{ name: `${baseName(file.name)} (header-footer).pdf`, blob: await savePdfBlob(doc) }]
}
