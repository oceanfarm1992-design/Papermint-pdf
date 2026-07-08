import { useCallback, useRef, useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
import { PDFDocument } from '@cantoo/pdf-lib'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import {
  canvasToBytes,
  openWithPdfJs,
  openWithPdfLib,
  renderPageToCanvas,
  savePdfBlob,
} from '@/utils/pdf'
import { downloadBlob } from '@/utils/download'
import { friendlyError, UserError } from '@/utils/errors'
import { baseName } from '@/utils/format'

interface Box {
  page: number
  x: number
  y: number
  w: number
  h: number
}

/**
 * Redaction is destructive by design: pages containing redaction boxes are
 * re-rendered to flat images with black boxes burned in, so the text
 * underneath is truly removed from the output file — not just covered.
 */
export default function RedactPage({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<{ url: string; w: number; h: number }[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const drag = useRef<{ page: number; sx: number; sy: number } | null>(null)
  const [draft, setDraft] = useState<Box | null>(null)

  const loadFile = useCallback(async (f: File) => {
    setError(null)
    try {
      const doc = await openWithPdfJs(f)
      const list: { url: string; w: number; h: number }[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        const canvas = await renderPageToCanvas(page, Math.min(1.2, 720 / vp.width) * 1.5)
        list.push({ url: canvas.toDataURL('image/jpeg', 0.8), w: vp.width, h: vp.height })
        canvas.width = 0
        page.cleanup()
        setPages([...list])
      }
      await doc.loadingTask.destroy()
      setFile(f)
      setBoxes([])
    } catch (err) {
      setError(friendlyError(err))
    }
  }, [])

  const point = (e: React.PointerEvent<HTMLDivElement>, pageIdx: number): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    const meta = pages[pageIdx]
    return [
      ((e.clientX - rect.left) / rect.width) * (meta?.w ?? 1),
      ((e.clientY - rect.top) / rect.height) * (meta?.h ?? 1),
    ]
  }

  const apply = async () => {
    if (!file) return
    if (boxes.length === 0) {
      setError('Draw at least one redaction box first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const affected = new Set(boxes.map((b) => b.page))
      const jsDoc = await openWithPdfJs(file)
      const srcDoc = await openWithPdfLib(file)
      const out = await PDFDocument.create()
      out.setProducer('Papermint — local PDF tools')

      for (let i = 0; i < jsDoc.numPages; i++) {
        setProgress(`Processing page ${i + 1} of ${jsDoc.numPages}`)
        if (!affected.has(i)) {
          const [copied] = await out.copyPages(srcDoc, [i])
          if (copied) out.addPage(copied)
          continue
        }
        // Rasterize the page and burn in black boxes
        const page = await jsDoc.getPage(i + 1)
        const vp = page.getViewport({ scale: 1 })
        const SCALE = 2
        const canvas = await renderPageToCanvas(page, SCALE)
        const c2d = canvas.getContext('2d')
        if (!c2d) throw new UserError('Canvas is unavailable in this browser.')
        c2d.fillStyle = '#000'
        for (const b of boxes.filter((b) => b.page === i)) {
          c2d.fillRect(b.x * SCALE, b.y * SCALE, b.w * SCALE, b.h * SCALE)
        }
        const jpg = await out.embedJpg(await canvasToBytes(canvas, 'image/jpeg', 0.85))
        canvas.width = 0
        page.cleanup()
        const newPage = out.addPage([vp.width, vp.height])
        newPage.drawImage(jpg, { x: 0, y: 0, width: vp.width, height: vp.height })
      }
      await jsDoc.loadingTask.destroy()
      // Redacted output gets fresh metadata so nothing leaks from the original
      out.setTitle('')
      out.setAuthor('')
      downloadBlob(await savePdfBlob(out), `${baseName(file.name)} (redacted).pdf`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolShell tool={tool} file={file} onFiles={(fs) => fs[0] && void loadFile(fs[0])} wide>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-neutral-500 dark:text-neutral-400">
          Drag black boxes over anything sensitive. Pages with boxes are re-rendered so the content
          underneath is permanently removed.
        </p>
        <button
          type="button"
          className="btn-secondary"
          disabled={boxes.length === 0}
          onClick={() => setBoxes([])}
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Clear all ({boxes.length})
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={busy || !file}
          onClick={() => void apply()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          {busy ? progress || 'Working…' : 'Redact & download'}
        </button>
      </div>

      <div className="space-y-6">
        {pages.map((meta, i) => (
          <div
            key={i}
            className="relative mx-auto max-w-[720px] cursor-crosshair touch-none shadow-lg ring-1 ring-black/10 select-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              const [x, y] = point(e, i)
              drag.current = { page: i, sx: x, sy: y }
              setDraft({ page: i, x, y, w: 0, h: 0 })
            }}
            onPointerMove={(e) => {
              const d = drag.current
              if (!d || d.page !== i) return
              const [x, y] = point(e, i)
              setDraft({
                page: i,
                x: Math.min(d.sx, x),
                y: Math.min(d.sy, y),
                w: Math.abs(x - d.sx),
                h: Math.abs(y - d.sy),
              })
            }}
            onPointerUp={() => {
              if (draft && draft.w > 4 && draft.h > 4) setBoxes((prev) => [...prev, draft])
              drag.current = null
              setDraft(null)
            }}
          >
            <img src={meta.url} alt={`Page ${i + 1}`} className="block w-full" draggable={false} />
            {[...boxes.filter((b) => b.page === i), ...(draft && draft.page === i ? [draft] : [])].map(
              (b, k) => (
                <div
                  key={k}
                  className="group absolute bg-black"
                  style={{
                    left: `${(b.x / meta.w) * 100}%`,
                    top: `${(b.y / meta.h) * 100}%`,
                    width: `${(b.w / meta.w) * 100}%`,
                    height: `${(b.h / meta.h) * 100}%`,
                  }}
                >
                  <button
                    type="button"
                    aria-label="Remove this redaction box"
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setBoxes((prev) => prev.filter((x) => x !== b))
                    }}
                  >
                    ×
                  </button>
                </div>
              ),
            )}
            <span className="absolute -bottom-5 left-0 text-xs text-neutral-400">Page {i + 1}</span>
          </div>
        ))}
      </div>
    </ToolShell>
  )
}
