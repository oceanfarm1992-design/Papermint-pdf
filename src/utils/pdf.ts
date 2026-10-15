import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { PDFDocument } from '@cantoo/pdf-lib'
import { UserError } from './errors'

export type { PDFDocumentProxy, PDFPageProxy }

/** pdf.js is loaded lazily so pdf-lib-only tools never pay for it. */
export async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

/** Open a PDF with pdf.js for rendering/text extraction. */
export async function openWithPdfJs(
  data: File | ArrayBuffer | Uint8Array,
  password?: string,
): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs()
  const bytes =
    data instanceof File
      ? new Uint8Array(await data.arrayBuffer())
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data) // copy — pdf.js transfers the buffer to its worker
  try {
    return await pdfjs.getDocument({ data: bytes, password }).promise
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'PasswordException') {
      throw new UserError(
        password
          ? 'The password is incorrect.'
          : 'This PDF is password-protected. Unlock it first (Security → Unlock PDF).',
      )
    }
    if (name === 'InvalidPDFException') {
      throw new UserError('This file is corrupted or is not a valid PDF.')
    }
    throw err
  }
}

/** Open a PDF with pdf-lib for structural edits. */
export async function openWithPdfLib(file: File | Uint8Array, password?: string): Promise<PDFDocument> {
  const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
      ...(password ? { password } : {}),
    } as Parameters<typeof PDFDocument.load>[1])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/password/i.test(msg)) {
      throw new UserError(password ? 'The password is incorrect.' : 'This PDF is password-protected.')
    }
    if (/parse|header|trailer|xref/i.test(msg)) {
      throw new UserError('This file is corrupted or is not a valid PDF.')
    }
    throw err
  }
  if (doc.isEncrypted && !password) {
    throw new UserError(
      'This PDF is password-protected. Unlock it first (Security → Unlock PDF), or use a tool that asks for the password.',
    )
  }
  try {
    // pdf-lib accepts some truncated files (e.g. header-only) without a usable
    // page tree; catch that here so every tool sees one friendly error instead
    // of a raw "Cannot read properties of undefined" deeper in its own logic.
    doc.getPageCount()
  } catch {
    throw new UserError('This file is corrupted or is not a valid PDF.')
  }
  return doc
}

export async function savePdfBlob(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save({ useObjectStreams: true })
  // Copy into a plain ArrayBuffer-backed view for the Blob constructor
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}

/** Render a pdf.js page into a canvas at the given scale (1 = 72 dpi). */
export async function renderPageToCanvas(page: PDFPageProxy, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  await page.render({ canvas, viewport }).promise
  return canvas
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new UserError('The browser could not encode the image — the page may be too large.')),
      type,
      quality,
    )
  })
}

export async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, type, quality)
  return new Uint8Array(await blob.arrayBuffer())
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
}
