import { Util } from 'pdfjs-dist'
import type { PDFPageProxy } from 'pdfjs-dist'

export type FontFamily = 'sans' | 'serif' | 'mono'

/** One editable run of existing PDF text, in display coordinates (top-left origin, scale 1). */
export interface EditSpan {
  id: string
  page: number
  /** top-left of the covering box */
  x: number
  y: number
  w: number
  h: number
  text: string
  /** font size in points */
  size: number
  family: FontFamily
  bold: boolean
  italic: boolean
}

function classifyFamily(fontFamily: string | undefined, fontName: string): FontFamily {
  const s = `${fontFamily ?? ''} ${fontName}`.toLowerCase()
  if (/mono|courier|consol|typewriter/.test(s)) return 'mono'
  if (/serif/.test(s) && !/sans/.test(s)) return 'serif'
  if (/times|georgia|garamond|roman|minion|book antiqua/.test(s)) return 'serif'
  return 'sans'
}

/**
 * Extract editable text spans from a page. Coordinates are in the pdf.js
 * scale-1 viewport space (top-left origin) so they line up with the editor's
 * annotation overlay. Rotated pages are skipped for editing (returns []).
 */
export async function extractEditableSpans(page: PDFPageProxy, pageIndex: number): Promise<EditSpan[]> {
  const rotation = ((page.rotate % 360) + 360) % 360
  if (rotation !== 0) return [] // in-place editing only supported on upright pages
  const viewport = page.getViewport({ scale: 1 })
  const tc = await page.getTextContent()
  const styles = tc.styles as Record<string, { fontFamily?: string; ascent?: number; descent?: number }>
  const spans: EditSpan[] = []
  let n = 0

  for (const item of tc.items) {
    if (!('str' in item) || !item.str.trim()) continue
    const fontName = item.fontName ?? ''
    const style = styles[fontName]
    // Map the item's text-space transform into viewport (top-left) space.
    const tx = Util.transform(viewport.transform, item.transform)
    const size = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 10
    const baselineX = tx[4]
    const baselineY = tx[5]
    const width = item.width || size * item.str.length * 0.5
    const ascent = (style?.ascent ?? 0.8) * size
    const descent = Math.abs(style?.descent ?? 0.2) * size
    const bold = /bold|black|heavy|semibold|-bd|,bold/i.test(fontName)
    const italic = /italic|oblique|-it|,italic/i.test(fontName)

    spans.push({
      id: `s${pageIndex}_${n++}`,
      page: pageIndex,
      x: baselineX,
      y: baselineY - ascent,
      w: width,
      h: ascent + descent,
      text: item.str,
      size,
      family: classifyFamily(style?.fontFamily, fontName),
      bold,
      italic,
    })
  }
  return spans
}
