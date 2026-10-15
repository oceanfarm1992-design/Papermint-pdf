import { describe, expect, it } from 'vitest'
import { openWithPdfLib } from '../pdf'
import { UserError } from '../errors'

describe('openWithPdfLib — malformed input', () => {
  it('rejects an empty (0-byte) file with a friendly message', async () => {
    await expect(openWithPdfLib(new Uint8Array(0))).rejects.toThrow(UserError)
    await expect(openWithPdfLib(new Uint8Array(0))).rejects.toThrow(/corrupted|not a valid pdf/i)
  })

  it('rejects random bytes with no PDF header with a friendly message', async () => {
    const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    await expect(openWithPdfLib(garbage)).rejects.toThrow(UserError)
    await expect(openWithPdfLib(garbage)).rejects.toThrow(/corrupted|not a valid pdf/i)
  })

  it('rejects a plain text file with a friendly message, not a raw parser error', async () => {
    const text = new TextEncoder().encode(
      'hello world, this is plain text padded out to a non-trivial length, not a pdf at all',
    )
    await expect(openWithPdfLib(text)).rejects.toThrow(UserError)
  })

  it('rejects a truncated PDF (header only, no body/trailer) with a friendly message', async () => {
    const truncated = new TextEncoder().encode('%PDF-1.4\n')
    await expect(openWithPdfLib(truncated)).rejects.toThrow(UserError)
  })
})
