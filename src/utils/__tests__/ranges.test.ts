import { describe, expect, it } from 'vitest'
import { parsePageRanges, parseRangeGroups } from '../ranges'
import { UserError } from '../errors'

describe('parsePageRanges', () => {
  it('parses single pages and ranges (1-based → 0-based)', () => {
    expect(parsePageRanges('1-3, 5', 10)).toEqual([0, 1, 2, 4])
  })
  it('returns all pages for empty input when fallback is enabled', () => {
    expect(parsePageRanges('', 3)).toEqual([0, 1, 2])
  })
  it('throws for empty input when fallback is disabled', () => {
    expect(() => parsePageRanges('', 3, false)).toThrow(UserError)
  })
  it('accepts reversed ranges', () => {
    expect(parsePageRanges('5-3', 10)).toEqual([2, 3, 4])
  })
  it('clamps ranges that run past the last page', () => {
    expect(parsePageRanges('2-99', 4)).toEqual([1, 2, 3])
  })
  it('rejects out-of-bounds single pages', () => {
    expect(() => parsePageRanges('11', 10)).toThrow(UserError)
  })
  it('rejects garbage', () => {
    expect(() => parsePageRanges('abc', 10)).toThrow(UserError)
  })
})

describe('parseRangeGroups', () => {
  it('splits comma groups into separate index lists', () => {
    expect(parseRangeGroups('1-2, 4', 5)).toEqual([[0, 1], [3]])
  })
})
