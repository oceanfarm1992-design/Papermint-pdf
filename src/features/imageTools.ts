import type { OutputFile, ProcessFn } from '@/types/tool'
import { canvasToBlob, openWithPdfJs, throwIfAborted } from '@/utils/pdf'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'

// ─────────────────── Extract images from a PDF ───────────────────

interface PdfJsImage {
  width: number
  height: number
  data?: Uint8ClampedArray | Uint8Array
  bitmap?: ImageBitmap
  kind?: number
}

function objFromPage(
  page: { objs: { get: (id: string, cb: (v: unknown) => void) => void } },
  id: string,
): Promise<PdfJsImage | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 3000)
    try {
      page.objs.get(id, (value: unknown) => {
        clearTimeout(timer)
        resolve((value as PdfJsImage) ?? null)
      })
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

async function imageToPngBlob(img: PdfJsImage): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const c2d = canvas.getContext('2d')
  if (!c2d) return null

  if (img.bitmap) {
    c2d.drawImage(img.bitmap, 0, 0)
  } else if (img.data) {
    const px = img.width * img.height
    const rgba = new Uint8ClampedArray(px * 4)
    const src = img.data
    if (src.length === px * 4) {
      rgba.set(src)
    } else if (src.length === px * 3) {
      for (let i = 0, j = 0; i < px; i++, j += 3) {
        rgba[i * 4] = src[j] ?? 0
        rgba[i * 4 + 1] = src[j + 1] ?? 0
        rgba[i * 4 + 2] = src[j + 2] ?? 0
        rgba[i * 4 + 3] = 255
      }
    } else if (src.length === px) {
      for (let i = 0; i < px; i++) {
        const v = src[i] ?? 0
        rgba[i * 4] = v
        rgba[i * 4 + 1] = v
        rgba[i * 4 + 2] = v
        rgba[i * 4 + 3] = 255
      }
    } else {
      return null
    }
    c2d.putImageData(new ImageData(rgba, img.width, img.height), 0, 0)
  } else {
    return null
  }
  return canvasToBlob(canvas, 'image/png')
}

export const extractImages: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const pdfjs = await import('pdfjs-dist')
  const doc = await openWithPdfJs(file)
  try {
    const outputs: OutputFile[] = []
    const seen = new Set<string>()
    const base = baseName(file.name)
    let counter = 0

    for (let i = 1; i <= doc.numPages; i++) {
      throwIfAborted(ctx.signal)
      ctx.onProgress((i - 1) / doc.numPages, `Scanning page ${i} of ${doc.numPages}`)
      const page = await doc.getPage(i)
      const ops = await page.getOperatorList()
      for (let k = 0; k < ops.fnArray.length; k++) {
        if (ops.fnArray[k] !== pdfjs.OPS.paintImageXObject) continue
        const id = (ops.argsArray[k] as unknown[])[0]
        if (typeof id !== 'string' || seen.has(id)) continue
        seen.add(id)
        const img = await objFromPage(page as never, id)
        if (!img || !img.width || img.width < 8 || img.height < 8) continue
        const blob = await imageToPngBlob(img)
        if (blob) {
          counter++
          outputs.push({ name: `${base}-image-${String(counter).padStart(2, '0')}.png`, blob })
        }
      }
      page.cleanup()
    }
    if (outputs.length === 0) throw new UserError('No embedded images were found in this PDF.')
    return outputs
  } finally {
    await doc.loadingTask.destroy()
  }
}

// ─────────────────── Compress images ───────────────────

const COMPRESS_LEVELS: Record<string, { maxSizeMB: number; initialQuality: number; maxDim: number }> = {
  high: { maxSizeMB: 4, initialQuality: 0.85, maxDim: 4096 },
  medium: { maxSizeMB: 1.5, initialQuality: 0.7, maxDim: 2560 },
  maximum: { maxSizeMB: 0.5, initialQuality: 0.5, maxDim: 1600 },
}

export const compressImages: ProcessFn = async (files, options, ctx) => {
  const { default: imageCompression } = await import('browser-image-compression')
  const level = COMPRESS_LEVELS[String(options.level ?? 'medium')] ?? COMPRESS_LEVELS.medium!
  const outputs: OutputFile[] = []
  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Compressing ${file.name}`)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: level.maxSizeMB,
        maxWidthOrHeight: level.maxDim,
        initialQuality: level.initialQuality,
        useWebWorker: true,
        alwaysKeepResolution: false,
      })
      const smaller = compressed.size < file.size ? compressed : file
      outputs.push({ name: `${baseName(file.name)} (compressed)${extOf(file.name)}`, blob: smaller })
    } catch {
      throw new UserError(`“${file.name}” could not be compressed — is it a valid image?`)
    }
  }
  return outputs
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i) : '.jpg'
}

// ─────────────────── Enhance images ───────────────────

function sharpenImageData(img: ImageData): ImageData {
  const { width: w, height: h, data: src } = img
  const out = new Uint8ClampedArray(src.length)
  out.set(src)
  const kernel = [0, -0.6, 0, -0.6, 3.4, -0.6, 0, -0.6, 0]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0
        let ki = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4 + c
            acc += (src[idx] ?? 0) * (kernel[ki++] ?? 0)
          }
        }
        out[(y * w + x) * 4 + c] = acc
      }
    }
  }
  return new ImageData(out, w, h)
}

export const enhanceImages: ProcessFn = async (files, options, ctx) => {
  const brightness = Number(options.brightness ?? 100)
  const contrast = Number(options.contrast ?? 110)
  const grayscale = Boolean(options.grayscale)
  const sharpen = Boolean(options.sharpen)

  const outputs: OutputFile[] = []
  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Enhancing ${file.name}`)

    const bitmap = await createImageBitmap(file).catch(() => {
      throw new UserError(`“${file.name}” could not be decoded as an image.`)
    })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const c2d = canvas.getContext('2d')
    if (!c2d) throw new UserError('Canvas is unavailable in this browser.')
    c2d.filter = `brightness(${brightness}%) contrast(${contrast}%)${grayscale ? ' grayscale(1)' : ''}`
    c2d.drawImage(bitmap, 0, 0)
    bitmap.close()

    if (sharpen) {
      const img = c2d.getImageData(0, 0, canvas.width, canvas.height)
      c2d.putImageData(sharpenImageData(img), 0, 0)
    }

    const isJpg = /\.jpe?g$/i.test(file.name)
    const blob = await canvasToBlob(canvas, isJpg ? 'image/jpeg' : 'image/png', isJpg ? 0.92 : undefined)
    outputs.push({ name: `${baseName(file.name)} (enhanced)${isJpg ? '.jpg' : '.png'}`, blob })
  }
  return outputs
}
