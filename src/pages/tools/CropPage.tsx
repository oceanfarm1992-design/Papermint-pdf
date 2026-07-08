import { useCallback, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import { openWithPdfJs, openWithPdfLib, renderPageToCanvas, savePdfBlob } from '@/utils/pdf'
import { displaySize, visualToContent } from '@/utils/stamp'
import { downloadBlob } from '@/utils/download'
import { friendlyError, UserError } from '@/utils/errors'
import { baseName } from '@/utils/format'

interface Sel {
  x: number
  y: number
  w: number
  h: number
}

export default function CropPage({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [pageDims, setPageDims] = useState<{ w: number; h: number }>({ w: 612, h: 792 })
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [sel, setSel] = useState<Sel | null>(null)
  const [applyTo, setApplyTo] = useState<'all' | 'current'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragStart = useRef<[number, number] | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const renderPage = useCallback(async (f: File, n: number) => {
    const doc = await openWithPdfJs(f)
    try {
      const page = await doc.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      setPageDims({ w: vp.width, h: vp.height })
      const canvas = await renderPageToCanvas(page, Math.min(1.4, 780 / vp.width) * 2)
      setImgUrl(canvas.toDataURL('image/jpeg', 0.85))
      canvas.width = 0
      setNumPages(doc.numPages)
      page.cleanup()
    } finally {
      await doc.loadingTask.destroy()
    }
  }, [])

  const loadFile = useCallback(
    async (f: File) => {
      setError(null)
      try {
        await renderPage(f, 1)
        setFile(f)
        setPageNo(1)
        setSel(null)
      } catch (err) {
        setError(friendlyError(err))
      }
    },
    [renderPage],
  )

  const goto = async (n: number) => {
    if (!file) return
    setPageNo(n)
    setSel(null)
    await renderPage(file, n)
  }

  const point = (e: React.PointerEvent): [number, number] => {
    const rect = overlayRef.current!.getBoundingClientRect()
    return [
      ((e.clientX - rect.left) / rect.width) * pageDims.w,
      ((e.clientY - rect.top) / rect.height) * pageDims.h,
    ]
  }

  const apply = async () => {
    if (!file || !sel || sel.w < 10 || sel.h < 10) {
      setError('Drag a selection over the page first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const doc = await openWithPdfLib(file)
      const targets = applyTo === 'all' ? doc.getPageIndices() : [pageNo - 1]
      for (const idx of targets) {
        const page = doc.getPage(idx)
        const { h: DH } = displaySize(page)
        // selection is in display top-origin coords; convert two corners
        const p1 = visualToContent(page, sel.x, DH - sel.y)
        const p2 = visualToContent(page, sel.x + sel.w, DH - (sel.y + sel.h))
        const x = Math.min(p1.x, p2.x)
        const y = Math.min(p1.y, p2.y)
        const w = Math.abs(p2.x - p1.x)
        const h = Math.abs(p2.y - p1.y)
        if (w < 5 || h < 5) throw new UserError('The crop area is too small for this page.')
        page.setCropBox(x, y, w, h)
        page.setMediaBox(x, y, w, h)
      }
      downloadBlob(await savePdfBlob(doc), `${baseName(file.name)} (cropped).pdf`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolShell tool={tool} file={file} onFiles={(fs) => fs[0] && void loadFile(fs[0])} wide>
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-neutral-500 dark:text-neutral-400">
          Drag over the page to select the area to keep.
        </p>
        <label className="flex items-center gap-2 text-sm">
          Apply to
          <select className="input-base w-auto py-1.5" value={applyTo} onChange={(e) => setApplyTo(e.target.value as 'all' | 'current')} aria-label="Apply crop to">
            <option value="all">All pages</option>
            <option value="current">This page only</option>
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost" aria-label="Previous page" disabled={pageNo <= 1} onClick={() => void goto(pageNo - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm tabular-nums">{pageNo} / {numPages}</span>
          <button type="button" className="btn-ghost" aria-label="Next page" disabled={pageNo >= numPages} onClick={() => void goto(pageNo + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <button type="button" className="btn-primary" disabled={busy || !sel} onClick={() => void apply()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          Crop & download
        </button>
      </div>

      {imgUrl && (
        <div
          ref={overlayRef}
          className="relative mx-auto max-w-[780px] cursor-crosshair touch-none shadow-lg ring-1 ring-black/10 select-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            const [x, y] = point(e)
            dragStart.current = [x, y]
            setSel({ x, y, w: 0, h: 0 })
          }}
          onPointerMove={(e) => {
            if (!dragStart.current) return
            const [sx, sy] = dragStart.current
            const [x, y] = point(e)
            setSel({ x: Math.min(sx, x), y: Math.min(sy, y), w: Math.abs(x - sx), h: Math.abs(y - sy) })
          }}
          onPointerUp={() => {
            dragStart.current = null
          }}
        >
          <img src={imgUrl} alt={`Page ${pageNo}`} className="block w-full" draggable={false} />
          {sel && (
            <>
              {/* dim everything outside the selection */}
              <div className="pointer-events-none absolute inset-0" style={{
                background: 'rgba(0,0,0,0.45)',
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${(sel.y / pageDims.h) * 100}%, ${(sel.x / pageDims.w) * 100}% ${(sel.y / pageDims.h) * 100}%, ${(sel.x / pageDims.w) * 100}% ${((sel.y + sel.h) / pageDims.h) * 100}%, ${((sel.x + sel.w) / pageDims.w) * 100}% ${((sel.y + sel.h) / pageDims.h) * 100}%, ${((sel.x + sel.w) / pageDims.w) * 100}% ${(sel.y / pageDims.h) * 100}%, 0 ${(sel.y / pageDims.h) * 100}%)`,
              }} />
              <div
                className="pointer-events-none absolute border-2 border-brand-400"
                style={{
                  left: `${(sel.x / pageDims.w) * 100}%`,
                  top: `${(sel.y / pageDims.h) * 100}%`,
                  width: `${(sel.w / pageDims.w) * 100}%`,
                  height: `${(sel.h / pageDims.h) * 100}%`,
                }}
              />
            </>
          )}
        </div>
      )}
    </ToolShell>
  )
}
