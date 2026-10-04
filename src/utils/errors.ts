import { isStaleChunkError } from './staleChunk'

/** Error with a message that is safe and useful to show to the user. */
export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserError'
  }
}

export function isAbort(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  )
}

/** Map raw library errors to human-readable messages. */
export function friendlyError(err: unknown): string {
  if (err instanceof UserError) return err.message
  if (isStaleChunkError(err)) {
    return 'The site was just updated. Please reload the page (Ctrl+F5 / ⌘+Shift+R) and try again.'
  }
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (lower.includes('password') && (lower.includes('incorrect') || lower.includes('invalid'))) {
    return 'The password is incorrect. Please check it and try again.'
  }
  if (lower.includes('encrypted') || lower.includes('password')) {
    return 'This PDF is password-protected. Use “Unlock PDF” first, or enter the password if the tool asks for one.'
  }
  if (
    lower.includes('invalid pdf') ||
    lower.includes('failed to parse') ||
    lower.includes('no pdf header') ||
    lower.includes('trailer')
  ) {
    return 'This file appears to be corrupted or is not a valid PDF.'
  }
  if (
    lower.includes('out of memory') ||
    lower.includes('allocation') ||
    lower.includes('array buffer')
  ) {
    return 'The browser ran out of memory processing this file. Try a smaller file, fewer pages, or a lower quality setting.'
  }
  if (lower.includes('unsupported')) {
    return 'This file format is not supported by this tool.'
  }
  return `Something went wrong: ${msg}`
}

/** Throws if a very large file is about to be processed, so we fail with a clear message. */
export function assertReasonableSize(file: File, maxMB = 512): void {
  if (file.size > maxMB * 1024 * 1024) {
    throw new UserError(
      `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(0)} MB. Files over ${maxMB} MB are likely to exhaust browser memory.`,
    )
  }
}
