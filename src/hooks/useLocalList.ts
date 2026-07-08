import { useCallback, useSyncExternalStore } from 'react'

/**
 * A small persisted string list (favorite tool slugs, recent tool slugs).
 * The ONLY data Papermint ever writes to localStorage is the theme and these
 * two lists of tool slugs — never file names or file content.
 */

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()
const cache = new Map<string, string[]>()

function read(key: string): string[] {
  const hit = cache.get(key)
  if (hit) return hit
  let value: string[] = []
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) value = parsed.filter((x): x is string => typeof x === 'string')
    }
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  cache.set(key, value)
  return value
}

function write(key: string, value: string[]): void {
  cache.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
  listeners.get(key)?.forEach((l) => l())
}

export function useLocalList(key: string, max = 24) {
  const items = useSyncExternalStore(
    useCallback(
      (cb: Listener) => {
        let set = listeners.get(key)
        if (!set) {
          set = new Set()
          listeners.set(key, set)
        }
        set.add(cb)
        return () => set.delete(cb)
      },
      [key],
    ),
    () => read(key),
  )

  const add = useCallback(
    (slug: string) => {
      const next = [slug, ...read(key).filter((s) => s !== slug)].slice(0, max)
      write(key, next)
    },
    [key, max],
  )

  const remove = useCallback((slug: string) => write(key, read(key).filter((s) => s !== slug)), [key])

  const toggle = useCallback(
    (slug: string) => {
      const cur = read(key)
      write(key, cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur].slice(0, max))
    },
    [key, max],
  )

  return { items, add, remove, toggle }
}

export const FAVORITES_KEY = 'pm-favorites'
export const RECENTS_KEY = 'pm-recents'
