import { describe, expect, it } from 'vitest'
import { baseName, formatBytes, formatDuration, sanitizeFileName } from '../format'

describe('formatBytes', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
  it('handles invalid input', () => {
    expect(formatBytes(-1)).toBe('—')
  })
})

describe('formatDuration', () => {
  it('formats seconds and minutes', () => {
    expect(formatDuration(4000)).toBe('4s')
    expect(formatDuration(75_000)).toBe('1m 15s')
  })
})

describe('baseName', () => {
  it('strips the extension', () => {
    expect(baseName('report.pdf')).toBe('report')
    expect(baseName('archive.tar.gz')).toBe('archive.tar')
    expect(baseName('noext')).toBe('noext')
  })
})

describe('sanitizeFileName', () => {
  it('removes characters that are invalid on common filesystems', () => {
    expect(sanitizeFileName('a/b\\c:d.pdf')).toBe('a_b_c_d.pdf')
    expect(sanitizeFileName('   ')).toBe('file')
  })
})
