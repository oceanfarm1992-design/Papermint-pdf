import { describe, expect, it } from 'vitest'
import { isStaleChunkError } from '../staleChunk'
import { friendlyError } from '../errors'

describe('isStaleChunkError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://privacypdftools.com/assets/compress-abc.js',
    'error loading dynamically imported module',
    'Importing a module script failed.',
    'Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".',
  ])('recognises %s', (message) => {
    expect(isStaleChunkError(new Error(message))).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isStaleChunkError(new Error('Invalid PDF structure'))).toBe(false)
  })
})

describe('friendlyError', () => {
  it('tells the user to reload after a deploy instead of showing a raw import error', () => {
    const msg = friendlyError(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))
    expect(msg).toMatch(/reload the page/i)
  })
})
