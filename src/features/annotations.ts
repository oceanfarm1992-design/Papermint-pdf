/**
 * Editor annotation model. All coordinates are in *display points* — the
 * pdf.js viewport at scale 1, origin at the top-left of the displayed page.
 */

export type AnnoKind =
  | 'text'
  | 'edittext'
  | 'note'
  | 'pen'
  | 'highlight'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'whiteout'
  | 'image'

export type FontFamily = 'sans' | 'serif' | 'mono'

interface Common {
  id: string
  page: number
  color: string
}

export interface BoxAnno extends Common {
  kind: 'text' | 'edittext' | 'note' | 'whiteout' | 'image' | 'rect' | 'ellipse'
  x: number
  y: number
  w: number
  h: number
  text?: string
  fontSize?: number
  dataUrl?: string
  strokeWidth?: number
  /** for edittext: font matched from the original PDF span */
  fontFamily?: FontFamily
  bold?: boolean
  italic?: boolean
  /** for edittext: the color to paint the cover box (defaults to white) */
  coverColor?: string
}

export interface StrokeAnno extends Common {
  kind: 'pen' | 'highlight'
  /** [x0, y0, x1, y1, ...] */
  points: number[]
  strokeWidth: number
}

export interface SegmentAnno extends Common {
  kind: 'line' | 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  strokeWidth: number
}

export type Anno = BoxAnno | StrokeAnno | SegmentAnno

export function isBox(a: Anno): a is BoxAnno {
  return ['text', 'edittext', 'note', 'whiteout', 'image', 'rect', 'ellipse'].includes(a.kind)
}

export function isStroke(a: Anno): a is StrokeAnno {
  return a.kind === 'pen' || a.kind === 'highlight'
}

export function isSegment(a: Anno): a is SegmentAnno {
  return a.kind === 'line' || a.kind === 'arrow'
}

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m || !m[1]) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

let counter = 0
export function annoId(): string {
  return `a${Date.now().toString(36)}-${counter++}`
}
