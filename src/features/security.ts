import { PDFName } from '@cantoo/pdf-lib'
import type { ProcessFn } from '@/types/tool'
import { openWithPdfLib, savePdfBlob, throwIfAborted } from '@/utils/pdf'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'

export const protectPdf: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const password = String(options.password ?? '')
  if (password.length < 4) throw new UserError('Please choose a password of at least 4 characters.')

  ctx.onProgress(0.2, 'Loading document')
  const doc = await openWithPdfLib(file)
  ctx.onProgress(0.5, 'Encrypting')
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: options.allowPrinting ? 'highResolution' : false,
      copying: Boolean(options.allowCopying),
      modifying: false,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  })
  ctx.onProgress(0.8, 'Saving')
  return [{ name: `${baseName(file.name)} (protected).pdf`, blob: await savePdfBlob(doc) }]
}

export const unlockPdf: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  const password = String(options.password ?? '')

  ctx.onProgress(0.2, 'Decrypting')
  const doc = await openWithPdfLib(file, password || undefined)
  // Saving without calling encrypt() produces an unencrypted document
  ctx.onProgress(0.7, 'Saving unlocked copy')
  return [{ name: `${baseName(file.name)} (unlocked).pdf`, blob: await savePdfBlob(doc) }]
}

export const removeMetadata: ProcessFn = async (files, _options, ctx) => {
  const outputs = []
  for (let i = 0; i < files.length; i++) {
    throwIfAborted(ctx.signal)
    const file = files[i]
    if (!file) continue
    ctx.onProgress(i / files.length, `Cleaning ${file.name}`)
    const doc = await openWithPdfLib(file)
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setProducer('')
    doc.setCreator('')
    const epoch = new Date(0)
    doc.setCreationDate(epoch)
    doc.setModificationDate(epoch)
    // Drop the XMP metadata stream if present
    try {
      doc.catalog.delete(PDFName.of('Metadata'))
    } catch {
      /* no XMP stream */
    }
    outputs.push({ name: `${baseName(file.name)} (clean).pdf`, blob: await savePdfBlob(doc) })
  }
  return outputs
}
