import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib'

/** Generate a simple multi-page PDF fixture in-memory (runs in Node). */
export async function makePdf(pages: number, label: string): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([595, 842])
    page.drawText(`${label} — page ${i} of ${pages}`, { x: 60, y: 780, size: 18, font })
    // Fill the page with paragraphs so files have realistic size and text content
    for (let line = 0; line < 30; line++) {
      page.drawText(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Line ${line + 1}.`, {
        x: 60,
        y: 720 - line * 22,
        size: 11,
        font,
      })
    }
  }
  return Buffer.from(await doc.save())
}

export function asUpload(name: string, buffer: Buffer) {
  return { name, mimeType: 'application/pdf', buffer }
}
