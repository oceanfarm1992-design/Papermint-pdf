import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize,
  MoveHorizontal,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { PDFDocumentProxy } from '@/utils/pdf'
import { openWithPdfJs, renderPageToCanvas } from '@/utils/pdf'
import { friendlyError } from '@/utils/errors'

interface Props {
  file: File
  onClose: () => void
}

export default function PdfPreviewModal({ file, onClose }: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'manual'>('page')
  const [thumbs, setThumbs] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<number[] | null>(null)
  const [searching, setSearching] = useState(false)
  const canvasHost = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  // Load document
  useEffect(() => {
    let cancelled = false
    let loaded: PDFDocumentProxy | null = null
    openWithPdfJs(file)
      .then((d) => {
        if (cancelled) {
          void d.loadingTask.destroy()
          return
        }
        loaded = d
        setDoc(d)
      })
      .catch((err) => !cancelled && setError(friendlyError(err)))
    return () => {
      cancelled = true
      if (loaded) void loaded.loadingTask.destroy()
    }
  }, [file])

  // Thumbnails (sequential, low-res)
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    void (async () => {
      const list: string[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        if (cancelled) return
        try {
          const page = await doc.getPage(i)
          const canvas = await renderPageToCanvas(page, 0.25)
          list.push(canvas.toDataURL('image/jpeg', 0.6))
          canvas.width = 0
          page.cleanup()
        } catch {
          list.push('')
        }
        if (!cancelled) setThumbs([...list])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [doc])

  // Render current page
  const renderCurrent = useCallback(async () => {
    if (!doc || !canvasHost.current || !viewerRef.current) return
    const page = await doc.getPage(pageNo)
    const base = page.getViewport({ scale: 1 })
    const box = viewerRef.current
    let scale = zoom
    if (fitMode === 'width') scale = (box.clientWidth - 48) / base.width
    else if (fitMode === 'page')
      scale = Math.min((box.clientWidth - 48) / base.width, (box.clientHeight - 24) / base.height)
    scale = Math.max(0.1, Math.min(4, scale)) * (window.devicePixelRatio > 1 ? 1.5 : 1)
    const canvas = await renderPageToCanvas(page, scale)
    canvas.style.width = `${canvas.width / (window.devicePixelRatio > 1 ? 1.5 : 1)}px`
    canvas.className = 'mx-auto rounded shadow-lg'
    canvasHost.current.replaceChildren(canvas)
    page.cleanup()
  }, [doc, pageNo, zoom, fitMode])

  useEffect(() => {
    void renderCurrent()
  }, [renderCurrent])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && doc) setPageNo((p) => Math.min(doc.numPages, p + 1))
      else if (e.key === 'ArrowLeft') setPageNo((p) => Math.max(1, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc, onClose])

  const runSearch = async () => {
    if (!doc || !query.trim()) {
      setHits(null)
      return
    }
    setSearching(true)
    const q = query.trim().toLowerCase()
    const found: number[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const tc = await page.getTextContent()
      const text = tc.items
        .map((it) => ('str' in it ? it.str : ''))
        .join(' ')
        .toLowerCase()
      if (text.includes(q)) found.push(i)
      page.cleanup()
    }
    setHits(found)
    setSearching(false)
    if (found.length > 0 && found[0]) setPageNo(found[0])
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-neutral-900/95 backdrop-blur-sm"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-white">
        <p className="mr-auto min-w-0 truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center gap-1 rounded-lg bg-white/10 px-1 py-0.5">
          <button
            type="button"
            className="rounded p-1.5 hover:bg-white/15 disabled:opacity-40"
            aria-label="Previous page"
            disabled={pageNo <= 1}
            onClick={() => setPageNo((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="px-1 text-xs tabular-nums" aria-live="polite">
            {pageNo} / {doc?.numPages ?? '…'}
          </span>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-white/15 disabled:opacity-40"
            aria-label="Next page"
            disabled={!doc || pageNo >= doc.numPages}
            onClick={() => setPageNo((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/10 px-1 py-0.5">
          <button
            type="button"
            className="rounded p-1.5 hover:bg-white/15"
            aria-label="Zoom out"
            onClick={() => {
              setFitMode('manual')
              setZoom((z) => Math.max(0.25, z - 0.25))
            }}
          >
            <ZoomOut className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-white/15"
            aria-label="Zoom in"
            onClick={() => {
              setFitMode('manual')
              setZoom((z) => Math.min(4, z + 0.25))
            }}
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-white/15 ${fitMode === 'width' ? 'bg-white/20' : ''}`}
            aria-label="Fit width"
            title="Fit width"
            onClick={() => setFitMode('width')}
          >
            <MoveHorizontal className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={`rounded p-1.5 hover:bg-white/15 ${fitMode === 'page' ? 'bg-white/20' : ''}`}
            aria-label="Fit page"
            title="Fit page"
            onClick={() => setFitMode('page')}
          >
            <Maximize className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <form
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5"
          onSubmit={(e) => {
            e.preventDefault()
            void runSearch()
          }}
        >
          <Search className="h-3.5 w-3.5 opacity-60" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search text…"
            aria-label="Search in document"
            className="w-28 bg-transparent py-1 text-xs placeholder:text-white/40 focus:outline-none"
          />
          {searching && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        </form>
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-white/15"
          aria-label="Close preview"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {hits !== null && (
        <p className="border-b border-white/10 px-4 py-1.5 text-xs text-white/80" aria-live="polite">
          {hits.length === 0
            ? `No matches for “${query}”.`
            : `Found on ${hits.length} page${hits.length === 1 ? '' : 's'}: ${hits.slice(0, 15).join(', ')}${hits.length > 15 ? '…' : ''}`}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Thumbnails */}
        <aside
          className="hidden w-32 shrink-0 overflow-y-auto border-r border-white/10 p-2 sm:block"
          aria-label="Page thumbnails"
        >
          {Array.from({ length: doc?.numPages ?? 0 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPageNo(i + 1)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={pageNo === i + 1 ? 'page' : undefined}
              className={`mb-2 block w-full overflow-hidden rounded border-2 transition-colors ${
                pageNo === i + 1 ? 'border-brand-400' : 'border-transparent hover:border-white/30'
              }`}
            >
              {thumbs[i] ? (
                <img src={thumbs[i]} alt="" className="w-full" />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-white/5 text-xs text-white/40">
                  {i + 1}
                </div>
              )}
              <span className="block bg-black/40 py-0.5 text-center text-[10px] text-white/70">
                {i + 1}
              </span>
            </button>
          ))}
        </aside>

        {/* Page */}
        <div ref={viewerRef} className="flex-1 overflow-auto p-6">
          {error ? (
            <p className="mx-auto max-w-md rounded-xl bg-rose-500/15 p-4 text-center text-sm text-rose-200">
              {error}
            </p>
          ) : (
            <div ref={canvasHost} />
          )}
        </div>
      </div>
    </div>
  )
}
