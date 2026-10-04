/**
 * Recovery for "stale chunk" errors: each tool's code is a lazily loaded file
 * whose name changes on every deploy. A tab opened before a deploy can request
 * a file that no longer exists, and the import fails. Reloading once picks up
 * the new build.
 */
const STALE_PATTERNS = [
  'failed to fetch dynamically imported module', // Chromium
  'error loading dynamically imported module', // Firefox
  'importing a module script failed', // Safari
  'unable to preload css',
  'is not a valid javascript mime type',
  'expected a javascript-or-wasm module script but the server responded with a mime type of',
]

const RELOAD_KEY = 'pm-stale-chunk-reload'
const RELOAD_WINDOW_MS = 60_000

export function isStaleChunkError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return STALE_PATTERNS.some((p) => msg.includes(p))
}

/**
 * Reload the page to fetch the latest build, at most once per minute so a
 * genuinely missing file can't cause a reload loop. Returns true if reloading.
 */
export function reloadOnceForUpdate(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false // storage unavailable: don't risk a loop
  }
  window.location.reload()
  return true
}
