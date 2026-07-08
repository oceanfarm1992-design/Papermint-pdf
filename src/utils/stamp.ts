import { degrees, rgb, type PDFFont, type PDFPage, type RGB } from '@cantoo/pdf-lib'

export type StampPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** Displayed page size, accounting for /Rotate. */
export function displaySize(page: PDFPage): { w: number; h: number; rot: number } {
  const rot = ((page.getRotation().angle % 360) + 360) % 360
  const { width, height } = page.getSize()
  return rot % 180 === 90 ? { w: height, h: width, rot } : { w: width, h: height, rot }
}

/** Map a point in *visual* coordinates (origin bottom-left of the displayed page) to content coordinates. */
export function visualToContent(page: PDFPage, vx: number, vy: number): { x: number; y: number } {
  const rot = ((page.getRotation().angle % 360) + 360) % 360
  const { width: W, height: H } = page.getSize()
  switch (rot) {
    case 90:
      return { x: W - vy, y: vx }
    case 180:
      return { x: W - vx, y: H - vy }
    case 270:
      return { x: vy, y: H - vx }
    default:
      return { x: vx, y: vy }
  }
}

/** Draw text that appears upright at a visual position regardless of page rotation. */
export function stampText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  pos: StampPosition,
  opts: { margin?: number; color?: RGB; opacity?: number } = {},
): void {
  const margin = opts.margin ?? 28
  const { w: DW, h: DH, rot } = displaySize(page)
  const textW = font.widthOfTextAtSize(text, size)

  let vx: number
  if (pos.endsWith('left')) vx = margin
  else if (pos.endsWith('right')) vx = DW - margin - textW
  else vx = (DW - textW) / 2

  const vy = pos.startsWith('top') ? DH - margin - size * 0.8 : margin

  const { x, y } = visualToContent(page, vx, vy)
  page.drawText(text, {
    x,
    y,
    size,
    font,
    rotate: degrees(rot),
    color: opts.color ?? rgb(0.25, 0.27, 0.3),
    opacity: opts.opacity ?? 1,
  })
}

/** Draw large centered text (optionally diagonal) — used for watermarks. */
export function stampCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  opts: { diagonal?: boolean; color?: RGB; opacity?: number } = {},
): void {
  const { rot } = displaySize(page)
  const { width: W, height: H } = page.getSize()
  const angleDeg = rot + (opts.diagonal ? 45 : 0)
  const a = (angleDeg * Math.PI) / 180
  const textW = font.widthOfTextAtSize(text, size)
  const cx = W / 2
  const cy = H / 2
  // Offset the baseline-left origin so the text is centered on the page center
  const ox = cx - (textW / 2) * Math.cos(a) + size * 0.35 * Math.sin(a)
  const oy = cy - (textW / 2) * Math.sin(a) - size * 0.35 * Math.cos(a)
  page.drawText(text, {
    x: ox,
    y: oy,
    size,
    font,
    rotate: degrees(angleDeg),
    color: opts.color ?? rgb(0.4, 0.42, 0.45),
    opacity: opts.opacity ?? 0.15,
  })
}
