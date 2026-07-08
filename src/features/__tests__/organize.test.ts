import { describe, expect, it } from 'vitest'
import { PDFDocument } from '@cantoo/pdf-lib'
import { merge, split, reversePages } from '../organize'
import { protectPdf, removeMetadata } from '../security'
import type { ProcessContext } from '@/types/tool'

async function makePdf(pages: number, title = 'Test'): Promise<File> {
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setAuthor('Unit Test Author')
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([300, 400])
    page.drawRectangle({ x: 10 + i * 5, y: 10, width: 50, height: 50 })
  }
  const bytes = await doc.save()
  return new File([new Uint8Array(bytes)], `${title}.pdf`, { type: 'application/pdf' })
}

function ctx(): ProcessContext {
  return { onProgress: () => undefined, signal: new AbortController().signal }
}

async function pageCount(blob: Blob): Promise<number> {
  const doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))
  return doc.getPageCount()
}

describe('organize features (real pdf-lib round-trips)', () => {
  it('merges two PDFs into one', async () => {
    const out = await merge([await makePdf(2, 'a'), await makePdf(3, 'b')], {}, ctx())
    expect(out).toHaveLength(1)
    expect(await pageCount(out[0]!.blob)).toBe(5)
  })

  it('splits by custom ranges', async () => {
    const out = await split([await makePdf(6)], { mode: 'ranges', ranges: '1-2, 4-6' }, ctx())
    expect(out).toHaveLength(2)
    expect(await pageCount(out[0]!.blob)).toBe(2)
    expect(await pageCount(out[1]!.blob)).toBe(3)
  })

  it('splits every N pages', async () => {
    const out = await split([await makePdf(5)], { mode: 'every', every: 2 }, ctx())
    expect(out.map((o) => o.name.includes('pages') || o.name.includes('page'))).toEqual([
      true,
      true,
      true,
    ])
  })

  it('reverses page order', async () => {
    const out = await reversePages([await makePdf(3)], {}, ctx())
    expect(await pageCount(out[0]!.blob)).toBe(3)
  })
})

describe('security features', () => {
  it('encrypts with a password and the result is unreadable without it', async () => {
    const out = await protectPdf(
      [await makePdf(1)],
      { password: 'secret123', allowPrinting: true },
      ctx(),
    )
    const bytes = new Uint8Array(await out[0]!.blob.arrayBuffer())
    const loaded = await PDFDocument.load(bytes, { ignoreEncryption: true })
    expect(loaded.isEncrypted).toBe(true)
  })

  it('strips document metadata', async () => {
    const out = await removeMetadata([await makePdf(1, 'Secret Title')], {}, ctx())
    const doc = await PDFDocument.load(new Uint8Array(await out[0]!.blob.arrayBuffer()), {
      updateMetadata: false,
    })
    expect(doc.getTitle() ?? '').toBe('')
    expect(doc.getAuthor() ?? '').toBe('')
  })
})
