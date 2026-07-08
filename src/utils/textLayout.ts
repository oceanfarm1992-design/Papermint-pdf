import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from '@cantoo/pdf-lib'

export interface Paragraph {
  text: string
  /** font size in points */
  size?: number
  bold?: boolean
  mono?: boolean
  /** extra space before, in points */
  spaceBefore?: number
  /** starts a new page before this paragraph */
  pageBreak?: boolean
}

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 56

/**
 * Standard PDF fonts only support WinAnsi. Replace anything the font cannot
 * encode so drawText never throws mid-conversion.
 */
export function winAnsiSafe(font: PDFFont, text: string): string {
  const cleaned = text
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  -​﻿\t]/g, ' ')
    .replace(/[\r\n]/g, ' ')
  let out = ''
  for (const ch of cleaned) {
    try {
      font.encodeText(ch)
      out += ch
    } catch {
      out += '?'
    }
  }
  return out
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    // Hard-break words longer than the line
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = ''
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      line = chunk
    } else {
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length > 0 ? lines : ['']
}

/** Lay out styled paragraphs onto A4 pages. Returns the finished document. */
export async function paragraphsToPdf(paras: Paragraph[], title?: string): Promise<PDFDocument> {
  const doc = await PDFDocument.create()
  if (title) doc.setTitle(title)
  doc.setProducer('Privacy PDF Tools — privacypdftools.com')

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)

  const [W, H] = A4
  const maxWidth = W - MARGIN * 2
  let page: PDFPage = doc.addPage(A4)
  let y = H - MARGIN

  for (const para of paras) {
    const size = para.size ?? 11
    const font = para.mono ? mono : para.bold ? bold : regular
    const lineHeight = size * 1.45
    if (para.pageBreak && y < H - MARGIN) {
      page = doc.addPage(A4)
      y = H - MARGIN
    }
    y -= para.spaceBefore ?? 0
    const safe = winAnsiSafe(font, para.text)
    const lines = para.mono ? [safe] : wrap(font, safe, size, maxWidth)
    for (const line of lines) {
      if (y - lineHeight < MARGIN) {
        page = doc.addPage(A4)
        y = H - MARGIN
      }
      y -= lineHeight
      if (line) {
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.1, 0.11, 0.13) })
      }
    }
  }
  return doc
}

/** Plain text → PDF (used by TXT/MD conversion and OCR output helpers). */
export async function textToPdfDoc(text: string, title?: string): Promise<PDFDocument> {
  const paras: Paragraph[] = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => ({ text: line || ' ', size: 11 }))
  return paragraphsToPdf(paras, title)
}
