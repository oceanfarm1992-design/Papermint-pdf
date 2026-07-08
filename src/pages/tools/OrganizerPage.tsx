import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Copy, Download, Loader2, RotateCw, Trash2, Undo2 } from 'lucide-react'
import { PDFDocument, degrees } from '@cantoo/pdf-lib'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import { openWithPdfJs, openWithPdfLib, renderPageToCanvas, savePdfBlob } from '@/utils/pdf'
import { downloadBlob } from '@/utils/download'
import { friendlyError } from '@/utils/errors'
import { baseName } from '@/utils/format'

interface PageItem {
  /** index in the source document */
  srcIndex: number
  /** extra rotation applied by the user (degrees clockwise) */
  rotation: number
  /** unique id (srcIndex can repeat after duplication) */
  id: number
}

export default function OrganizerPage({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const [items, setItems] = useState<PageItem[]>([])
  const [history, setHistory] = useState<PageItem[][]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const idRef = useRef(0)

  const loadFile = useCallback(async (f: File) => {
    setError(null)
    setFile(f)
    try {
      const doc = await openWithPdfJs(f)
      const initial: PageItem[] = []
      for (let i = 0; i < doc.numPages; i++)
        initial.push({ srcIndex: i, rotation: 0, id: idRef.current++ })
      setItems(initial)
      const list: string[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const canvas = await renderPageToCanvas(page, 0.35)
        list.push(canvas.toDataURL('image/jpeg', 0.7))
        canvas.width = 0
        page.cleanup()
        setThumbs([...list])
      }
      await doc.loadingTask.destroy()
    } catch (err) {
      setError(friendlyError(err))
      setFile(null)
    }
  }, [])

  const mutate = (fn: (prev: PageItem[]) => PageItem[]) => {
    setItems((prev) => {
      setHistory((h) => [...h.slice(-30), prev])
      return fn(prev)
    })
  }

  const undo = () => {
    setHistory((h) => {
      const last = h[h.length - 1]
      if (last) setItems(last)
      return h.slice(0, -1)
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const exportPdf = async () => {
    if (!file || items.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const src = await openWithPdfLib(file)
      const out = await PDFDocument.create()
      const copied = await out.copyPages(
        src,
        items.map((it) => it.srcIndex),
      )
      copied.forEach((page, i) => {
        const item = items[i]
        if (!item) return
        if (item.rotation !== 0) {
          const current = ((page.getRotation().angle % 360) + 360) % 360
          page.setRotation(degrees((current + item.rotation) % 360))
        }
        out.addPage(page)
      })
      downloadBlob(await savePdfBlob(out), `${baseName(file.name)} (organized).pdf`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
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
          {items.length} page{items.length === 1 ? '' : 's'} — drag to reorder, use the buttons to
          rotate, duplicate or delete.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            mutate((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })))
          }
          disabled={items.length === 0}
        >
          <RotateCw className="h-4 w-4" aria-hidden /> Rotate all
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => mutate((prev) => [...prev].reverse())}
          disabled={items.length < 2}
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden /> Reverse order
        </button>
        <button type="button" className="btn-secondary" onClick={undo} disabled={history.length === 0}>
          <Undo2 className="h-4 w-4" aria-hidden /> Undo
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void exportPdf()}
          disabled={busy || items.length === 0}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Download PDF
        </button>
      </div>

      <ul
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        aria-label="Pages"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex === null || dragIndex === i) return
              mutate((prev) => {
                const next = [...prev]
                const [moved] = next.splice(dragIndex, 1)
                if (moved) next.splice(i, 0, moved)
                return next
              })
              setDragIndex(null)
            }}
            className={`card group cursor-grab overflow-hidden transition-shadow active:cursor-grabbing ${
              dragIndex === i ? 'opacity-50' : ''
            }`}
          >
            <div className="relative bg-neutral-100 dark:bg-neutral-800">
              {thumbs[item.srcIndex] ? (
                <img
                  src={thumbs[item.srcIndex]}
                  alt={`Page ${item.srcIndex + 1}`}
                  draggable={false}
                  className="mx-auto max-h-44 w-full object-contain transition-transform"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                />
              ) : (
                <div className="flex h-44 items-center justify-center text-neutral-400">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {i + 1}
              </span>
            </div>
            <div className="flex justify-center gap-1 p-1.5">
              <button
                type="button"
                className="btn-ghost px-2"
                aria-label={`Rotate page ${i + 1}`}
                onClick={() =>
                  mutate((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, rotation: (p.rotation + 90) % 360 } : p)),
                  )
                }
              >
                <RotateCw className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="btn-ghost px-2"
                aria-label={`Duplicate page ${i + 1}`}
                onClick={() =>
                  mutate((prev) => {
                    const next = [...prev]
                    const cur = next[i]
                    if (cur) next.splice(i + 1, 0, { ...cur, id: idRef.current++ })
                    return next
                  })
                }
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="btn-ghost px-2 text-rose-500"
                aria-label={`Delete page ${i + 1}`}
                onClick={() => mutate((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </ToolShell>
  )
}
