import {
  LineCapStyle,
  StandardFonts,
  degrees,
  rgb,
  type PDFDocument,
  type PDFFont,
  type PDFPage,
} from '@cantoo/pdf-lib'
import { openWithPdfLib, savePdfBlob } from '@/utils/pdf'
import { displaySize, visualToContent } from '@/utils/stamp'
import { winAnsiSafe } from '@/utils/textLayout'
import { hexToRgb01, isBox, type Anno, type BoxAnno, type FontFamily } from './annotations'

/** Map an extracted font (family + style) to the closest standard PDF font. */
const STD_FONTS: Record<FontFamily, Record<'r' | 'b' | 'i' | 'bi', StandardFonts>> = {
  sans: {
    r: StandardFonts.Helvetica,
    b: StandardFonts.HelveticaBold,
    i: StandardFonts.HelveticaOblique,
    bi: StandardFonts.HelveticaBoldOblique,
  },
  serif: {
    r: StandardFonts.TimesRoman,
    b: StandardFonts.TimesRomanBold,
    i: StandardFonts.TimesRomanItalic,
    bi: StandardFonts.TimesRomanBoldItalic,
  },
  mono: {
    r: StandardFonts.Courier,
    b: StandardFonts.CourierBold,
    i: StandardFonts.CourierOblique,
    bi: StandardFonts.CourierBoldOblique,
  },
}

function makeFontPicker(doc: PDFDocument) {
  const cache = new Map<StandardFonts, PDFFont>()
  return async (family: FontFamily = 'sans', bold = false, italic = false): Promise<PDFFont> => {
    const variant = bold && italic ? 'bi' : bold ? 'b' : italic ? 'i' : 'r'
    const std = STD_FONTS[family][variant]
    let font = cache.get(std)
    if (!font) {
      font = await doc.embedFont(std)
      cache.set(std, font)
    }
    return font
  }
}

/**
 * Burn editor annotations into the PDF.
 * Annotation coordinates are display points with a top-left origin; pdf pages
 * use a bottom-left origin and may carry /Rotate — the mapping helpers handle both.
 */
export async function applyAnnotations(file: File, annos: Anno[]): Promise<Blob> {
  const doc = await openWithPdfLib(file)
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const pickFont = makeFontPicker(doc)
  const imageCache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>()

  for (const anno of annos) {
    const page = doc.getPage(anno.page)
    const { h: DH, rot } = displaySize(page)
    const [r, g, b] = hexToRgb01(anno.color)
    const color = rgb(r, g, b)

    /** display top-origin point -> content coords */
    const mapPt = (x: number, y: number) => visualToContent(page, x, DH - y)
    /** display top-origin rect -> axis-aligned content rect (exact for 90° multiples) */
    const mapRect = (bx: BoxAnno) => {
      const p1 = mapPt(bx.x, bx.y)
      const p2 = mapPt(bx.x + bx.w, bx.y + bx.h)
      return {
        x: Math.min(p1.x, p2.x),
        y: Math.min(p1.y, p2.y),
        w: Math.abs(p2.x - p1.x),
        h: Math.abs(p2.y - p1.y),
      }
    }

    switch (anno.kind) {
      case 'whiteout': {
        const rect = mapRect(anno)
        page.drawRectangle({ ...withXY(rect), color: rgb(1, 1, 1) })
        break
      }
      case 'rect': {
        const rect = mapRect(anno)
        page.drawRectangle({
          ...withXY(rect),
          borderColor: color,
          borderWidth: anno.strokeWidth ?? 2,
        })
        break
      }
      case 'ellipse': {
        const rect = mapRect(anno)
        page.drawEllipse({
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
          xScale: rect.w / 2,
          yScale: rect.h / 2,
          borderColor: color,
          borderWidth: anno.strokeWidth ?? 2,
        })
        break
      }
      case 'line':
      case 'arrow': {
        const s = mapPt(anno.x1, anno.y1)
        const e = mapPt(anno.x2, anno.y2)
        const thickness = anno.strokeWidth
        page.drawLine({ start: s, end: e, thickness, color, lineCap: LineCapStyle.Round })
        if (anno.kind === 'arrow') {
          const angle = Math.atan2(e.y - s.y, e.x - s.x)
          const len = Math.max(9, thickness * 4)
          for (const off of [Math.PI * 0.82, -Math.PI * 0.82]) {
            page.drawLine({
              start: e,
              end: { x: e.x + len * Math.cos(angle + off), y: e.y + len * Math.sin(angle + off) },
              thickness,
              color,
              lineCap: LineCapStyle.Round,
            })
          }
        }
        break
      }
      case 'pen':
      case 'highlight': {
        const pts = anno.points
        const opacity = anno.kind === 'highlight' ? 0.4 : 1
        for (let i = 0; i + 3 < pts.length; i += 2) {
          const s = mapPt(pts[i] ?? 0, pts[i + 1] ?? 0)
          const e = mapPt(pts[i + 2] ?? 0, pts[i + 3] ?? 0)
          page.drawLine({
            start: s,
            end: e,
            thickness: anno.strokeWidth,
            color,
            opacity,
            lineCap: LineCapStyle.Round,
          })
        }
        break
      }
      case 'note': {
        const rect = mapRect(anno)
        page.drawRectangle({
          ...withXY(rect),
          color: rgb(1, 0.95, 0.6),
          borderColor: rgb(0.85, 0.75, 0.3),
          borderWidth: 0.75,
        })
        drawTextBlock(page, helv, anno, rot, mapPt, rgb(0.25, 0.2, 0.05), 6)
        break
      }
      case 'text': {
        drawTextBlock(page, helv, anno, rot, mapPt, color, 0)
        break
      }
      case 'edittext': {
        // Cover the original text, then re-draw with the matched font.
        const rect = mapRect(anno)
        const [cr, cg, cb] = hexToRgb01(anno.coverColor ?? '#ffffff')
        page.drawRectangle({ ...withXY(rect), color: rgb(cr, cg, cb) })
        const font = await pickFont(anno.fontFamily, anno.bold, anno.italic)
        drawTextBlock(page, font, anno, rot, mapPt, color, 0)
        break
      }
      case 'image': {
        if (!anno.dataUrl) break
        let image = imageCache.get(anno.dataUrl)
        if (!image) {
          const bytes = dataUrlToBytes(anno.dataUrl)
          image = anno.dataUrl.startsWith('data:image/jpeg')
            ? await doc.embedJpg(bytes)
            : await doc.embedPng(bytes)
          imageCache.set(anno.dataUrl, image)
        }
        if (rot === 0) {
          const rect = mapRect(anno)
          page.drawImage(image, withXY(rect))
        } else {
          // Anchor at the display bottom-left corner and rotate with the page
          const p = mapPt(anno.x, anno.y + anno.h)
          page.drawImage(image, { x: p.x, y: p.y, width: anno.w, height: anno.h, rotate: degrees(rot) })
        }
        break
      }
    }
  }
  return savePdfBlob(doc)
}

function withXY(rect: { x: number; y: number; w: number; h: number }) {
  return { x: rect.x, y: rect.y, width: rect.w, height: rect.h }
}

function drawTextBlock(
  page: PDFPage,
  font: PDFFont,
  anno: BoxAnno,
  rot: number,
  mapPt: (x: number, y: number) => { x: number; y: number },
  color: ReturnType<typeof rgb>,
  padding: number,
): void {
  const size = anno.fontSize ?? 14
  const lineHeight = size * 1.25
  const lines = (anno.text ?? '').split('\n')
  lines.forEach((line, i) => {
    const safe = winAnsiSafe(font, line)
    if (!safe) return
    const baselineY = anno.y + padding + size * 0.85 + i * lineHeight
    const p = mapPt(anno.x + padding, baselineY)
    page.drawText(safe, { x: p.x, y: p.y, size, font, color, rotate: degrees(rot) })
  })
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',')
  const b64 = dataUrl.slice(comma + 1)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export { isBox }
