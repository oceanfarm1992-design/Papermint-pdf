export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let v = bytes
  let i = -1
  do {
    v /= 1024
    i++
  } while (v >= 1024 && i < units.length - 1)
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

/** "report.pdf" -> "report" */
export function baseName(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'file'
}
