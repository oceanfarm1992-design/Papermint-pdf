import { UserError } from './errors'

/**
 * Parse a page-range expression like "1-3, 5, 8-10" into a list of 0-based indices.
 * @param expr user input (1-based)
 * @param total total number of pages
 * @param fallbackAll when the expression is empty, return all pages
 */
export function parsePageRanges(expr: string, total: number, fallbackAll = true): number[] {
  const trimmed = expr.trim()
  if (!trimmed) {
    if (fallbackAll) return Array.from({ length: total }, (_, i) => i)
    throw new UserError('Please enter at least one page or range (e.g. “1-3, 5”).')
  }
  const out: number[] = []
  for (const part of trimmed.split(',')) {
    const p = part.trim()
    if (!p) continue
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(p)
    if (m) {
      const a = Number(m[1])
      const b = Number(m[2])
      if (a < 1 || b < 1) throw new UserError(`Invalid range “${p}” — pages start at 1.`)
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      if (lo > total) throw new UserError(`Range “${p}” is beyond the last page (${total}).`)
      for (let i = lo; i <= Math.min(hi, total); i++) out.push(i - 1)
    } else if (/^\d+$/.test(p)) {
      const n = Number(p)
      if (n < 1 || n > total) throw new UserError(`Page ${n} does not exist — the document has ${total} page${total === 1 ? '' : 's'}.`)
      out.push(n - 1)
    } else {
      throw new UserError(`Could not understand “${p}”. Use numbers and ranges like “1-3, 5”.`)
    }
  }
  if (out.length === 0) throw new UserError('No pages matched your selection.')
  return out
}

/** Forgiving variant for live UI highlighting: never throws, returns a Set of 0-based indices. */
export function parsePageRangesSafe(expr: string, total: number): Set<number> {
  try {
    return new Set(parsePageRanges(expr, total, false))
  } catch {
    return new Set()
  }
}

/** Compact a set of 0-based indices into a 1-based range string: {0,1,2,4} -> "1-3, 5". */
export function indicesToRangeString(indices: Iterable<number>): string {
  const sorted = [...new Set(indices)].sort((a, b) => a - b)
  const parts: string[] = []
  let start = -2
  let prev = -2
  const flush = () => {
    if (start < 0) return
    parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`)
  }
  for (const n of sorted) {
    if (n === prev + 1) {
      prev = n
      continue
    }
    flush()
    start = n
    prev = n
  }
  flush()
  return parts.join(', ')
}

/** Parse into groups: "1-3, 5" -> [[0,1,2],[4]] — used by Split. */
export function parseRangeGroups(expr: string, total: number): number[][] {
  const trimmed = expr.trim()
  if (!trimmed) throw new UserError('Please enter ranges like “1-3, 4-6”.')
  return trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => parsePageRanges(p, total, false))
}
