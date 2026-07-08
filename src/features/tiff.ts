/**
 * Minimal baseline TIFF encoder (uncompressed RGB, little-endian, multi-page).
 * Small files only make sense for archival/fax workflows — no compression keeps
 * this dependency-free and fully local.
 */

interface TiffPage {
  width: number
  height: number
  /** RGBA pixel data (canvas ImageData) */
  rgba: Uint8ClampedArray
}

const TAG = {
  ImageWidth: 256,
  ImageLength: 257,
  BitsPerSample: 258,
  Compression: 259,
  Photometric: 262,
  StripOffsets: 273,
  SamplesPerPixel: 277,
  RowsPerStrip: 278,
  StripByteCounts: 279,
  XResolution: 282,
  YResolution: 283,
  ResolutionUnit: 296,
} as const

const TYPE_SHORT = 3
const TYPE_LONG = 4
const TYPE_RATIONAL = 5

export function encodeTiff(pages: TiffPage[]): Blob {
  const ENTRIES_PER_IFD = 12
  const ifdSize = 2 + ENTRIES_PER_IFD * 12 + 4

  // Layout: header (8) | per page: [pixels][bits-array(6)][2 rationals(16)][IFD]
  let offset = 8
  const even = (n: number) => n + (n % 2)
  const pageLayouts = pages.map((p) => {
    const pixelBytes = p.width * p.height * 3
    const bits = even(offset + pixelBytes)
    const xres = bits + 6
    const yres = xres + 8
    const ifd = yres + 8
    const layout = { pixels: offset, bits, xres, yres, ifd }
    offset = ifd + ifdSize
    return layout
  })

  const buf = new ArrayBuffer(offset)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // Header
  view.setUint8(0, 0x49) // 'I'
  view.setUint8(1, 0x49)
  view.setUint16(2, 42, true)
  view.setUint32(4, pageLayouts[0]?.ifd ?? 8, true)

  pages.forEach((page, i) => {
    const layout = pageLayouts[i]
    if (!layout) return
    // Pixels RGBA -> RGB
    let dst = layout.pixels
    const src = page.rgba
    for (let s = 0; s < src.length; s += 4) {
      bytes[dst++] = src[s] ?? 0
      bytes[dst++] = src[s + 1] ?? 0
      bytes[dst++] = src[s + 2] ?? 0
    }
    // BitsPerSample array [8,8,8]
    view.setUint16(layout.bits, 8, true)
    view.setUint16(layout.bits + 2, 8, true)
    view.setUint16(layout.bits + 4, 8, true)
    // Resolutions 72/1
    view.setUint32(layout.xres, 72, true)
    view.setUint32(layout.xres + 4, 1, true)
    view.setUint32(layout.yres, 72, true)
    view.setUint32(layout.yres + 4, 1, true)

    // IFD
    let p = layout.ifd
    view.setUint16(p, ENTRIES_PER_IFD, true)
    p += 2
    const entry = (tag: number, type: number, count: number, value: number) => {
      view.setUint16(p, tag, true)
      view.setUint16(p + 2, type, true)
      view.setUint32(p + 4, count, true)
      if (type === TYPE_SHORT && count === 1) {
        view.setUint16(p + 8, value, true)
      } else {
        view.setUint32(p + 8, value, true)
      }
      p += 12
    }
    entry(TAG.ImageWidth, TYPE_LONG, 1, page.width)
    entry(TAG.ImageLength, TYPE_LONG, 1, page.height)
    entry(TAG.BitsPerSample, TYPE_SHORT, 3, layout.bits)
    entry(TAG.Compression, TYPE_SHORT, 1, 1)
    entry(TAG.Photometric, TYPE_SHORT, 1, 2)
    entry(TAG.StripOffsets, TYPE_LONG, 1, layout.pixels)
    entry(TAG.SamplesPerPixel, TYPE_SHORT, 1, 3)
    entry(TAG.RowsPerStrip, TYPE_LONG, 1, page.height)
    entry(TAG.StripByteCounts, TYPE_LONG, 1, page.width * page.height * 3)
    entry(TAG.XResolution, TYPE_RATIONAL, 1, layout.xres)
    entry(TAG.YResolution, TYPE_RATIONAL, 1, layout.yres)
    entry(TAG.ResolutionUnit, TYPE_SHORT, 1, 2)
    // Next IFD pointer
    view.setUint32(p, pageLayouts[i + 1]?.ifd ?? 0, true)
  })

  return new Blob([buf], { type: 'image/tiff' })
}
