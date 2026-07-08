import { StandardFonts, rgb } from '@cantoo/pdf-lib'
import type { OutputFile, ProcessFn } from '@/types/tool'
import { openWithPdfJs, openWithPdfLib, renderPageToCanvas, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { winAnsiSafe } from '@/utils/textLayout'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'
import type { Worker as TesseractWorker } from 'tesseract.js'

/**
 * OCR uses tesseract.js. The WASM engine ships with the app; language packs
 * (~2–15 MB) are fetched once from a CDN and cached by the browser. The
 * image/PDF being recognized never leaves the device.
 */

interface OcrWord {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

async function makeWorker(
  lang: string,
  onProgress: (frac: number, stage: string) => void,
): Promise<TesseractWorker> {
  const { createWorker } = await import('tesseract.js')
  try {
    return await createWorker(lang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') onProgress(m.progress, 'Recognizing text')
        else if (m.status?.includes('loading')) onProgress(m.progress ?? 0, 'Loading language model')
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/network|fetch|load/i.test(msg)) {
      throw new UserError(
        'The OCR language model could not be downloaded. Check your connection once — after the first download it is cached for offline use.',
      )
    }
    throw err
  }
}

function collectWords(data: { blocks?: unknown }): OcrWord[] {
  const words: OcrWord[] = []
  const blocks = (data.blocks ?? []) as {
    paragraphs?: { lines?: { words?: { text: string; bbox: OcrWord['bbox'] }[] }[] }[]
  }[]
  for (const b of blocks ?? []) {
    for (const p of b.paragraphs ?? []) {
      for (const l of p.lines ?? []) {
        for (const w of l.words ?? []) {
          if (w.text.trim()) words.push({ text: w.text, bbox: w.bbox })
        }
      }
    }
  }
  return words
}

export const ocrImage: ProcessFn = async (files, options, ctx) => {
  const lang = String(options.lang ?? 'eng')
  const worker = await makeWorker(lang, (f, s) => ctx.onProgress(f * 0.9, s))
  try {
    const outputs: OutputFile[] = []
    for (let i = 0; i < files.length; i++) {
      throwIfAborted(ctx.signal)
      const file = files[i]
      if (!file) continue
      ctx.onProgress(i / files.length, `Recognizing ${file.name}`)
      const result = await worker.recognize(file)
      const text = result.data.text.trim()
      outputs.push({
        name: `${baseName(file.name)}.txt`,
        blob: new Blob([text || '(no text recognized)'], { type: 'text/plain;charset=utf-8' }),
      })
    }
    return outputs
  } finally {
    await worker.terminate()
  }
}

export const ocrPdfToText: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const lang = String(options.lang ?? 'eng')
  const worker = await makeWorker(lang, () => undefined)
  const doc = await openWithPdfJs(file)
  try {
    const total = doc.numPages
    const parts: string[] = []
    for (let i = 1; i <= total; i++) {
      throwIfAborted(ctx.signal)
      ctx.onProgress((i - 1) / total, `OCR page ${i} of ${total}`)
      const page = await doc.getPage(i)
      const canvas = await renderPageToCanvas(page, 2)
      const result = await worker.recognize(canvas)
      parts.push(result.data.text.trim())
      canvas.width = 0
      page.cleanup()
    }
    const text = parts.join('\n\n— page break —\n\n').trim()
    return [
      {
        name: `${baseName(file.name)} (ocr).txt`,
        blob: new Blob([text || '(no text recognized)'], { type: 'text/plain;charset=utf-8' }),
      },
    ]
  } finally {
    await worker.terminate()
    await doc.loadingTask.destroy()
  }
}

export const searchablePdf: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const lang = String(options.lang ?? 'eng')
  const SCALE = 2

  const worker = await makeWorker(lang, () => undefined)
  const jsDoc = await openWithPdfJs(file)
  try {
    const libDoc = await openWithPdfLib(file)
    const font = await libDoc.embedFont(StandardFonts.Helvetica)
    const total = jsDoc.numPages

    for (let i = 1; i <= total; i++) {
      throwIfAborted(ctx.signal)
      ctx.onProgress((i - 1) / total, `OCR page ${i} of ${total}`)
      const page = await jsDoc.getPage(i)
      const canvas = await renderPageToCanvas(page, SCALE)
      const result = await worker.recognize(canvas, {}, { blocks: true, text: true })
      const words = collectWords(result.data as { blocks?: unknown })
      canvas.width = 0
      page.cleanup()

      const libPage = libDoc.getPage(i - 1)
      const pageH = libPage.getHeight()
      for (const w of words) {
        const safe = winAnsiSafe(font, w.text)
        if (!safe.trim()) continue
        const x = w.bbox.x0 / SCALE
        const yTop = w.bbox.y0 / SCALE
        const hPt = Math.max(4, (w.bbox.y1 - w.bbox.y0) / SCALE)
        const size = Math.min(72, hPt * 0.9)
        // Nearly invisible text layered over the scan makes it selectable/searchable
        libPage.drawText(safe, {
          x,
          y: pageH - yTop - hPt,
          size,
          font,
          color: rgb(0, 0, 0),
          opacity: 0.02,
        })
      }
    }
    ctx.onProgress(0.97, 'Saving searchable PDF')
    return [{ name: `${baseName(file.name)} (searchable).pdf`, blob: await savePdfBlob(libDoc) }]
  } finally {
    await worker.terminate()
    await jsDoc.loadingTask.destroy()
  }
}
