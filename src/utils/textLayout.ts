import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from '@cantoo/pdf-lib'

/** One inline span of a paragraph with its own styling. */
export interface Run {
  text: string
  bold?: boolean
  italic?: boolean
  mono?: boolean
  /** overrides the paragraph size for this span only */
  size?: number
  /** text colour; defaults to the paragraph/body colour */
  color?: RGB
}

export interface Paragraph {
  /** plain text; ignored when `runs` is set */
  text?: string
  /** styled inline spans — takes precedence over `text` */
  runs?: Run[]
  /** font size in points */
  size?: number
  bold?: boolean
  italic?: boolean
  mono?: boolean
  align?: 'left' | 'center' | 'right'
  /** extra space before, in points */
  spaceBefore?: number
  /** starts a new page before this block */
  pageBreak?: boolean
}

/** A bordered table. Cells are plain text; the first row is bold when `header`. */
export interface TableBlock {
  rows: string[][]
  header?: boolean
  spaceBefore?: number
  pageBreak?: boolean
}

export type Block = Paragraph | TableBlock

function isTable(b: Block): b is TableBlock {
  return 'rows' in b
}

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 56
const BODY = rgb(0.1, 0.11, 0.13)
const BORDER = rgb(0.73, 0.73, 0.73)

interface FontSet {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
  boldItalic: PDFFont
  mono: PDFFont
}

function pickFont(f: FontSet, s: { bold?: boolean; italic?: boolean; mono?: boolean }): PDFFont {
  if (s.mono) return f.mono
  if (s.bold && s.italic) return f.boldItalic
  if (s.bold) return f.bold
  if (s.italic) return f.italic
  return f.regular
}

/**
 * Standard PDF fonts only support WinAnsi. Replace anything the font cannot
 * encode so drawText never throws mid-conversion. Every non-ASCII character is
 * written as a \u escape so the source can't be corrupted into an accidental
 * regex range that swallows ordinary letters.
 */
export function winAnsiSafe(font: PDFFont, text: string): string {
  const cleaned = text
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    // Collapse assorted Unicode spaces (nbsp, en/em spaces, zero-width, BOM, tab).
    .replace(/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
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

interface Piece {
  text: string
  font: PDFFont
  size: number
  color: RGB
  /** rendered width of `text` at `size` */
  w: number
  /** width of the space that precedes this piece on its line */
  lead: number
}

interface VisualLine {
  pieces: Piece[]
  width: number
  height: number
}

/** Break a paragraph's runs into wrapped visual lines that fit `maxWidth`. */
function wrapRuns(runs: Run[], fonts: FontSet, defaultSize: number, maxWidth: number): VisualLine[] {
  interface Atom {
    text: string
    font: PDFFont
    size: number
    color: RGB
    w: number
    spaceBefore: boolean
  }
  const atoms: Atom[] = []
  let pendingSpace = false
  for (const run of runs) {
    const font = pickFont(fonts, run)
    const size = run.size ?? defaultSize
    const color = run.color ?? BODY
    const safe = winAnsiSafe(font, run.text)
    for (const part of safe.split(/(\s+)/)) {
      if (part === '') continue
      if (/^\s+$/.test(part)) {
        pendingSpace = true
        continue
      }
      atoms.push({
        text: part,
        font,
        size,
        color,
        w: font.widthOfTextAtSize(part, size),
        spaceBefore: pendingSpace,
      })
      pendingSpace = false
    }
  }

  const lines: VisualLine[] = []
  let cur: Piece[] = []
  let curW = 0
  const flush = () => {
    if (cur.length === 0) return
    const height = Math.max(...cur.map((p) => p.size)) * 1.45
    lines.push({ pieces: cur, width: curW, height })
    cur = []
    curW = 0
  }
  const spaceWidth = (a: Atom) => a.font.widthOfTextAtSize(' ', a.size)

  for (const atom of atoms) {
    const lead = cur.length > 0 && atom.spaceBefore ? spaceWidth(atom) : 0
    // A single atom wider than the line: hard-break it across character chunks.
    if (atom.w > maxWidth) {
      flush()
      let chunk = ''
      for (const ch of atom.text) {
        const cw = atom.font.widthOfTextAtSize(chunk + ch, atom.size)
        if (chunk && cw > maxWidth) {
          const w = atom.font.widthOfTextAtSize(chunk, atom.size)
          lines.push({
            pieces: [{ text: chunk, font: atom.font, size: atom.size, color: atom.color, w, lead: 0 }],
            width: w,
            height: atom.size * 1.45,
          })
          chunk = ch
        } else {
          chunk += ch
        }
      }
      if (chunk) {
        cur = [
          {
            text: chunk,
            font: atom.font,
            size: atom.size,
            color: atom.color,
            w: atom.font.widthOfTextAtSize(chunk, atom.size),
            lead: 0,
          },
        ]
        curW = cur[0]!.w
      }
      continue
    }
    if (cur.length > 0 && curW + lead + atom.w > maxWidth) flush()
    const effLead = cur.length > 0 && atom.spaceBefore ? spaceWidth(atom) : 0
    cur.push({
      text: atom.text,
      font: atom.font,
      size: atom.size,
      color: atom.color,
      w: atom.w,
      lead: effLead,
    })
    curW += effLead + atom.w
  }
  flush()
  return lines.length > 0 ? lines : [{ pieces: [], width: 0, height: defaultSize * 1.45 }]
}

/** Running page/cursor state shared while laying out a stream of blocks. */
class Layout {
  page: PDFPage
  y: number
  doc: PDFDocument
  fonts: FontSet
  constructor(doc: PDFDocument, fonts: FontSet) {
    this.doc = doc
    this.fonts = fonts
    this.page = doc.addPage(A4)
    this.y = A4[1] - MARGIN
  }
  get maxWidth(): number {
    return A4[0] - MARGIN * 2
  }
  newPage(): void {
    this.page = this.doc.addPage(A4)
    this.y = A4[1] - MARGIN
  }
  atPageTop(): boolean {
    return this.y >= A4[1] - MARGIN - 0.01
  }
}

function drawParagraph(L: Layout, para: Paragraph): void {
  const size = para.size ?? 11
  const runs: Run[] =
    para.runs && para.runs.length > 0
      ? para.runs
      : [{ text: para.text ?? '', bold: para.bold, italic: para.italic, mono: para.mono }]
  const lines = wrapRuns(runs, L.fonts, size, L.maxWidth)

  if (para.pageBreak && !L.atPageTop()) L.newPage()
  L.y -= para.spaceBefore ?? 0

  for (const line of lines) {
    if (L.y - line.height < MARGIN) L.newPage()
    L.y -= line.height
    const align = para.align ?? 'left'
    let x =
      align === 'center'
        ? MARGIN + (L.maxWidth - line.width) / 2
        : align === 'right'
          ? MARGIN + (L.maxWidth - line.width)
          : MARGIN
    for (const p of line.pieces) {
      x += p.lead
      if (p.text) L.page.drawText(p.text, { x, y: L.y, size: p.size, font: p.font, color: p.color })
      x += p.w
    }
  }
}

const CELL_PAD = 4

function drawTable(L: Layout, table: TableBlock): void {
  const rows = table.rows
  if (rows.length === 0) return
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 1)
  const colW = L.maxWidth / cols
  const innerW = colW - CELL_PAD * 2

  if (table.pageBreak && !L.atPageTop()) L.newPage()
  L.y -= table.spaceBefore ?? 0

  const cellSize = 10
  const drawRow = (cells: string[], bold: boolean) => {
    // Wrap every cell, then size the row to the tallest.
    const wrapped = Array.from({ length: cols }, (_, c) =>
      wrapRuns([{ text: cells[c] ?? '', bold }], L.fonts, cellSize, innerW),
    )
    const rowH = Math.max(...wrapped.map((w) => w.reduce((s, l) => s + l.height, 0))) + CELL_PAD * 2
    if (L.y - rowH < MARGIN) L.newPage()
    const top = L.y
    for (let c = 0; c < cols; c++) {
      const x = MARGIN + c * colW
      L.page.drawRectangle({
        x,
        y: top - rowH,
        width: colW,
        height: rowH,
        borderColor: BORDER,
        borderWidth: 0.75,
      })
      let ty = top - CELL_PAD
      for (const line of wrapped[c]!) {
        ty -= line.height
        let tx = x + CELL_PAD
        for (const p of line.pieces) {
          tx += p.lead
          if (p.text)
            L.page.drawText(p.text, { x: tx, y: ty, size: p.size, font: p.font, color: p.color })
          tx += p.w
        }
      }
    }
    L.y = top - rowH
  }

  rows.forEach((cells, r) => drawRow(cells, Boolean(table.header) && r === 0))
}

async function loadFonts(doc: PDFDocument): Promise<FontSet> {
  const [regular, bold, italic, boldItalic, mono] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaOblique),
    doc.embedFont(StandardFonts.HelveticaBoldOblique),
    doc.embedFont(StandardFonts.Courier),
  ])
  return { regular, bold, italic, boldItalic, mono }
}

/** Lay out a mixed stream of paragraphs and tables onto A4 pages. */
export async function blocksToPdf(blocks: Block[], title?: string): Promise<PDFDocument> {
  const doc = await PDFDocument.create()
  if (title) doc.setTitle(title)
  doc.setProducer('Privacy PDF Tools — privacypdftools.com')
  const fonts = await loadFonts(doc)
  const L = new Layout(doc, fonts)
  for (const block of blocks) {
    if (isTable(block)) drawTable(L, block)
    else drawParagraph(L, block)
  }
  return doc
}

/** Lay out styled paragraphs onto A4 pages. Returns the finished document. */
export async function paragraphsToPdf(paras: Paragraph[], title?: string): Promise<PDFDocument> {
  return blocksToPdf(paras, title)
}

/** Plain text → PDF (used by TXT/MD conversion and OCR output helpers). */
export async function textToPdfDoc(text: string, title?: string): Promise<PDFDocument> {
  const paras: Paragraph[] = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => ({ text: line || ' ', size: 11 }))
  return paragraphsToPdf(paras, title)
}
