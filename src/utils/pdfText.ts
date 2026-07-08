import type { PDFPageProxy } from 'pdfjs-dist'
import { openWithPdfJs, throwIfAborted } from './pdf'

export interface TextLine {
  text: string
  /** dominant font size (PDF points) — used for heading detection */
  size: number
  /** left x of the line */
  x: number
  /** cells split on wide horizontal gaps (for table detection) */
  cells: string[]
}

interface RawItem {
  str: string
  x: number
  y: number
  w: number
  h: number
}

/** Group pdf.js text items into visual lines, sorted top-to-bottom. */
export async function getPageLines(page: PDFPageProxy): Promise<TextLine[]> {
  const tc = await page.getTextContent()
  const items: RawItem[] = []
  for (const it of tc.items) {
    if (!('str' in it) || !it.str.trim()) continue
    const t = it.transform as number[]
    items.push({
      str: it.str,
      x: t[4] ?? 0,
      y: t[5] ?? 0,
      w: it.width,
      h: Math.abs(it.height || t[3] || 10),
    })
  }
  if (items.length === 0) return []

  // Cluster by baseline y (tolerance scales with font size)
  items.sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: RawItem[][] = []
  for (const item of items) {
    const last = lines[lines.length - 1]
    const first = last?.[0]
    if (first && Math.abs(first.y - item.y) < Math.max(2, first.h * 0.45)) {
      last.push(item)
    } else {
      lines.push([item])
    }
  }

  return lines.map((group) => {
    group.sort((a, b) => a.x - b.x)
    let text = ''
    const cells: string[] = []
    let cell = ''
    let prev: RawItem | null = null
    for (const it of group) {
      if (prev) {
        const gap = it.x - (prev.x + prev.w)
        const charW = Math.max(3, prev.h * 0.45)
        if (gap > charW * 4) {
          text += '  '
          cells.push(cell.trim())
          cell = ''
        } else if (gap > charW * 0.35) {
          text += ' '
          cell += ' '
        }
      }
      text += it.str
      cell += it.str
      prev = it
    }
    cells.push(cell.trim())
    const size = Math.max(...group.map((g) => g.h))
    return { text: text.trim(), size, x: group[0]?.x ?? 0, cells: cells.filter(Boolean) }
  })
}

export interface ExtractedDoc {
  /** lines per page */
  pages: TextLine[][]
  /** median body font size across the document */
  medianSize: number
}

export async function extractLines(
  file: File,
  onProgress?: (frac: number) => void,
  signal?: AbortSignal,
): Promise<ExtractedDoc> {
  const doc = await openWithPdfJs(file)
  try {
    const pages: TextLine[][] = []
    const sizes: number[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      if (signal) throwIfAborted(signal)
      const page = await doc.getPage(i)
      const lines = await getPageLines(page)
      pages.push(lines)
      for (const l of lines) sizes.push(l.size)
      page.cleanup()
      onProgress?.(i / doc.numPages)
    }
    sizes.sort((a, b) => a - b)
    const medianSize = sizes.length > 0 ? (sizes[Math.floor(sizes.length / 2)] ?? 11) : 11
    return { pages, medianSize }
  } finally {
    await doc.loadingTask.destroy()
  }
}

export function pagesToPlainText(pages: TextLine[][]): string {
  return pages.map((lines) => lines.map((l) => l.text).join('\n')).join('\n\n')
}

/** Classify a line as heading level 1/2 or body (0) based on relative font size. */
export function headingLevel(line: TextLine, medianSize: number): 0 | 1 | 2 {
  if (line.text.length > 120) return 0
  if (line.size >= medianSize * 1.6) return 1
  if (line.size >= medianSize * 1.25) return 2
  return 0
}

export function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
