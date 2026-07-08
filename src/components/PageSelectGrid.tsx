import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { openWithPdfJs, renderPageToCanvas } from '@/utils/pdf'
import { friendlyError } from '@/utils/errors'
import { indicesToRangeString, parsePageRangesSafe } from '@/utils/ranges'

interface Props {
  file: File
  /** current range string (1-based), shared with the text field */
  value: string
  onChange: (rangeString: string) => void
  /** rotate/duplicate treat an empty selection as "all pages" */
  emptyMeansAll?: boolean
  /** verb shown in the summary line, e.g. "delete", "extract" */
  verb?: string
}

export default function PageSelectGrid({ file, value, onChange, emptyMeansAll, verb = 'select' }: Props) {
  const [thumbs, setThumbs] = useState<string[]>([])
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let doc: Awaited<ReturnType<typeof openWithPdfJs>> | null = null
    setThumbs([])
    setCount(0)
    setError(null)
    setLoading(true)
    void (async () => {
      try {
        doc = await openWithPdfJs(file)
        if (cancelled) return
        setCount(doc.numPages)
        const list: string[] = []
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return
          try {
            const page = await doc.getPage(i)
            const canvas = await renderPageToCanvas(page, 0.35)
            list.push(canvas.toDataURL('image/jpeg', 0.62))
            canvas.width = 0
            page.cleanup()
          } catch {
            list.push('')
          }
          if (!cancelled) setThumbs([...list])
        }
      } catch (err) {
        if (!cancelled) setError(friendlyError(err))
      } finally {
        if (!cancelled) setLoading(false)
        if (doc) await doc.loadingTask.destroy().catch(() => undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])

  const selected = parsePageRangesSafe(value, count || 100000)
  const allSelected = count > 0 && selected.size === count

  const toggle = (index: number) => {
    const next = new Set(selected)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onChange(indicesToRangeString(next))
  }

  const selectAll = () => onChange(indicesToRangeString(Array.from({ length: count }, (_, i) => i)))
  const clear = () => onChange('')

  if (error) {
    return (
      <div className="card p-4 text-sm text-rose-600 dark:text-rose-400" role="alert">
        {error}
      </div>
    )
  }

  const effectiveCount = selected.size === 0 && emptyMeansAll ? count : selected.size

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Click pages to {verb}</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" aria-hidden />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400" aria-live="polite">
            {effectiveCount} of {count || '…'} selected
            {selected.size === 0 && emptyMeansAll && count > 0 ? ' (all)' : ''}
          </span>
          <button type="button" className="btn-ghost text-xs" onClick={selectAll} disabled={allSelected || count === 0}>
            Select all
          </button>
          <button type="button" className="btn-ghost text-xs" onClick={clear} disabled={selected.size === 0}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: count }, (_, i) => {
          const isOn = selected.has(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isOn}
              aria-label={`Page ${i + 1}${isOn ? ', selected' : ''}`}
              className={`group relative overflow-hidden rounded-lg border-2 bg-white transition-all dark:bg-neutral-800 ${
                isOn
                  ? 'border-brand-500 ring-2 ring-brand-500/30'
                  : 'border-neutral-200 hover:border-brand-400 dark:border-neutral-700'
              }`}
            >
              {thumbs[i] ? (
                <img src={thumbs[i]} alt="" className="w-full" />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center text-xs text-neutral-400">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : i + 1}
                </div>
              )}
              <span
                className={`pointer-events-none absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-opacity ${
                  isOn ? 'bg-brand-500 text-white' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
                }`}
              >
                {isOn ? <Check className="h-3 w-3" aria-hidden /> : ''}
              </span>
              <span className="absolute right-0 bottom-0 rounded-tl bg-black/45 px-1.5 py-0.5 text-[10px] text-white tabular-nums">
                {i + 1}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
