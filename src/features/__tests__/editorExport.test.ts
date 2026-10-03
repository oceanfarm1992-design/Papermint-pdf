import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFRawStream, decodePDFRawStream, PDFArray } from '@cantoo/pdf-lib'
import { applyAnnotations } from '../editorExport'
import type { Anno } from '../annotations'

async function samplePdf(): Promise<File> {
  const doc = await PDFDocument.create()
  doc.addPage([595, 842])
  doc.addPage([595, 842])
  const bytes = await doc.save()
  return new File([new Uint8Array(bytes)], 'sample.pdf', { type: 'application/pdf' })
}

/** Decoded content-stream operators for one page of a saved PDF. */
async function pageOps(blob: Blob, pageIndex: number): Promise<string> {
  const doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))
  const node = doc.getPage(pageIndex).node
  const contents = node.Contents()
  const refs = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : []
  let ops = ''
  for (const ref of refs) {
    const stream = doc.context.lookup(ref)
    if (stream instanceof PDFRawStream)
      ops += new TextDecoder().decode(decodePDFRawStream(stream).decode())
  }
  return ops
}

describe('applyAnnotations', () => {
  it('burns a rectangle into the page content', async () => {
    const annos: Anno[] = [
      { id: 'a', page: 0, kind: 'rect', color: '#ff0000', x: 50, y: 50, w: 100, h: 40, strokeWidth: 2 },
    ]
    const ops = await pageOps(await applyAnnotations(await samplePdf(), annos), 0)
    // pdf-lib draws rectangles as a closed, stroked path (… h S)
    expect(ops).toMatch(/\bh\s+S\b/)
  })

  it('burns pen strokes into the page content', async () => {
    const annos: Anno[] = [
      {
        id: 'p',
        page: 0,
        kind: 'pen',
        color: '#000000',
        points: [10, 10, 60, 40, 120, 80],
        strokeWidth: 3,
      },
    ]
    const ops = await pageOps(await applyAnnotations(await samplePdf(), annos), 0)
    expect(ops).toMatch(/\bl\b/)
    expect(ops).toMatch(/\bS\b/)
  })

  it('writes added text', async () => {
    const annos: Anno[] = [
      {
        id: 't',
        page: 1,
        kind: 'text',
        color: '#000000',
        x: 40,
        y: 40,
        w: 200,
        h: 30,
        text: 'Hello',
        fontSize: 14,
      },
    ]
    const ops = await pageOps(await applyAnnotations(await samplePdf(), annos), 1)
    expect(ops).toMatch(/Tj/)
  })
})
