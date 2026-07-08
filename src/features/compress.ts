import { PDFDocument } from '@cantoo/pdf-lib'
import type { OutputFile, ProcessFn } from '@/types/tool'
import { canvasToBytes, openWithPdfJs, openWithPdfLib, renderPageToCanvas, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { baseName } from '@/utils/format'

/** render scale + JPEG quality per level */
const LEVELS: Record<string, { scale: number; quality: number }> = {
  high: { scale: 2, quality: 0.85 },
  medium: { scale: 1.5, quality: 0.72 },
  maximum: { scale: 1.1, quality: 0.5 },
}

export const compressPdf: ProcessFn = async (files, options, ctx) => {
  const outputs: OutputFile[] = []
  const level = LEVELS[String(options.level ?? 'medium')] ?? LEVELS.medium!
  const structureOnly = Boolean(options.structureOnly)

  for (let f = 0; f < files.length; f++) {
    const file = files[f]
    if (!file) continue
    const fileBase = f / files.length
    const fileSpan = 1 / files.length

    if (structureOnly) {
      ctx.onProgress(fileBase + fileSpan * 0.3, `Rewriting ${file.name}`)
      const doc = await openWithPdfLib(file)
      const blob = await savePdfBlob(doc)
      outputs.push({
        name: `${baseName(file.name)} (compressed).pdf`,
        blob: blob.size < file.size ? blob : new Blob([await file.arrayBuffer()], { type: 'application/pdf' }),
      })
      continue
    }

    const src = await openWithPdfJs(file)
    try {
      const out = await PDFDocument.create()
      out.setProducer('Papermint — local PDF tools')
      const total = src.numPages
      for (let i = 1; i <= total; i++) {
        throwIfAborted(ctx.signal)
        ctx.onProgress(fileBase + fileSpan * ((i - 1) / total) * 0.95, `Compressing page ${i} of ${total}`)
        const page = await src.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const canvas = await renderPageToCanvas(page, level.scale)
        const jpg = await out.embedJpg(await canvasToBytes(canvas, 'image/jpeg', level.quality))
        canvas.width = 0
        const newPage = out.addPage([viewport.width, viewport.height])
        newPage.drawImage(jpg, { x: 0, y: 0, width: viewport.width, height: viewport.height })
        page.cleanup()
      }
      ctx.onProgress(fileBase + fileSpan * 0.97, 'Saving')
      const blob = await savePdfBlob(out)
      // Never hand back a "compressed" file that is larger than the original
      if (blob.size < file.size) {
        outputs.push({ name: `${baseName(file.name)} (compressed).pdf`, blob })
      } else {
        outputs.push({
          name: `${baseName(file.name)} (already optimal).pdf`,
          blob: new Blob([await file.arrayBuffer()], { type: 'application/pdf' }),
        })
      }
    } finally {
      await src.loadingTask.destroy()
    }
  }
  return outputs
}
