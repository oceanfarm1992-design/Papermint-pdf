import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Circle,
  Download,
  Eraser,
  Highlighter,
  ImagePlus,
  Loader2,
  Minus,
  MousePointer2,
  PenLine,
  PenTool,
  Redo2,
  Square,
  StickyNote,
  TextCursorInput,
  Type,
  Undo2,
} from 'lucide-react'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import { openWithPdfJs, renderPageToCanvas, type PDFDocumentProxy } from '@/utils/pdf'
import { extractEditableSpans, type EditSpan } from '@/utils/pdfSpans'
import { downloadBlob } from '@/utils/download'
import { friendlyError } from '@/utils/errors'
import { baseName } from '@/utils/format'
import { annoId, isBox, isSegment, isStroke, type Anno, type BoxAnno } from '@/features/annotations'

const SignatureModal = lazy(() => import('@/components/SignatureModal'))

type EditorTool =
  | 'select'
  | 'edittext'
  | 'text'
  | 'pen'
  | 'highlight'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'note'
  | 'whiteout'
  | 'image'

const TOOL_BUTTONS: { id: EditorTool; icon: typeof Type; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select / move' },
  { id: 'edittext', icon: TextCursorInput, label: 'Edit existing text' },
  { id: 'text', icon: Type, label: 'Add text' },
  { id: 'pen', icon: PenLine, label: 'Draw' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'note', icon: StickyNote, label: 'Sticky note' },
  { id: 'whiteout', icon: Eraser, label: 'Whiteout' },
  { id: 'image', icon: ImagePlus, label: 'Insert image' },
]

const PALETTE = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#f59e0b']

interface PageMeta {
  w: number
  h: number
}

interface DragState {
  kind: 'draw' | 'move' | 'resize'
  page: number
  startX: number
  startY: number
  anno?: Anno
  orig?: Anno
}

function PageCanvas({ doc, pageNo, scale }: { doc: PDFDocumentProxy; pageNo: number; scale: number }) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const rendered = useRef(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setVisible(true), {
      rootMargin: '600px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || rendered.current) return
    rendered.current = true
    let cancelled = false
    void (async () => {
      const page = await doc.getPage(pageNo)
      const canvas = await renderPageToCanvas(page, scale * Math.min(2, window.devicePixelRatio || 1))
      if (cancelled || !host.current) return
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.display = 'block'
      host.current.replaceChildren(canvas)
      page.cleanup()
    })()
    return () => {
      cancelled = true
    }
  }, [visible, doc, pageNo, scale])

  return <div ref={host} className="absolute inset-0 bg-white" aria-hidden />
}

export default function EditorPage({ tool, signatureMode }: { tool: ToolDef; signatureMode?: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageMeta[]>([])
  const [spans, setSpans] = useState<EditSpan[]>([])
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [annos, setAnnos] = useState<Anno[]>([])
  const [history, setHistory] = useState<Anno[][]>([])
  const [redoStack, setRedoStack] = useState<Anno[][]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [active, setActive] = useState<EditorTool>((tool.editorTool as EditorTool) || 'select')
  const [color, setColor] = useState(tool.editorTool === 'highlight' ? '#f59e0b' : '#111827')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fontSize, setFontSize] = useState(16)
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; aspect: number } | null>(null)
  const [sigOpen, setSigOpen] = useState(Boolean(signatureMode))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drag = useRef<DragState | null>(null)
  const [draft, setDraft] = useState<Anno | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  const scale = useMemo(() => {
    const w = pages[0]?.w ?? 612
    return Math.min(1.35, 860 / w)
  }, [pages])

  const loadFile = useCallback(async (f: File) => {
    setError(null)
    try {
      const d = await openWithPdfJs(f)
      const metas: PageMeta[] = []
      const allSpans: EditSpan[] = []
      for (let i = 1; i <= d.numPages; i++) {
        const page = await d.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        metas.push({ w: vp.width, h: vp.height })
        try {
          const pageSpans = await extractEditableSpans(page, i - 1)
          allSpans.push(...pageSpans)
        } catch {
          /* text layer unavailable on this page — skip in-place editing there */
        }
        page.cleanup()
      }
      setFile(f)
      setDoc(d)
      setPages(metas)
      setSpans(allSpans)
      setClaimed(new Set())
      setAnnos([])
      setHistory([])
      setRedoStack([])
    } catch (err) {
      setError(friendlyError(err))
    }
  }, [])

  useEffect(() => () => void doc?.loadingTask.destroy(), [doc])

  const commit = useCallback((next: Anno[] | ((prev: Anno[]) => Anno[])) => {
    setAnnos((prev) => {
      setHistory((h) => [...h.slice(-40), prev])
      setRedoStack([])
      return typeof next === 'function' ? next(prev) : next
    })
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      const last = h[h.length - 1]
      if (last !== undefined) {
        setAnnos((cur) => {
          setRedoStack((r) => [...r, cur])
          return last
        })
      }
      return h.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack((r) => {
      const last = r[r.length - 1]
      if (last !== undefined) {
        setAnnos((cur) => {
          setHistory((h) => [...h, cur])
          return last
        })
      }
      return r.slice(0, -1)
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        commit((prev) => prev.filter((a) => a.id !== selected))
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, undo, redo, commit])

  const svgPoint = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    const meta = pages[Number(e.currentTarget.dataset.page ?? 0)]
    const pw = meta?.w ?? 1
    return [
      ((e.clientX - rect.left) / rect.width) * pw,
      ((e.clientY - rect.top) / rect.height) * (meta?.h ?? 1) * (pw / pw),
    ]
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>, pageIdx: number) => {
    if (editing) return
    const [x, y] = svgPoint(e)
    e.currentTarget.setPointerCapture(e.pointerId)

    if (active === 'select') {
      setSelected(null)
      return
    }
    if (active === 'edittext') {
      // Clicks on existing text are handled by the span overlays; ignore blank clicks.
      setSelected(null)
      return
    }
    if (active === 'text' || active === 'note') {
      // The new box's textarea autofocuses during this event; without this the
      // browser's default mousedown focus handling then blurs it, which commits
      // an empty text box and deletes it before the user can type.
      e.preventDefault()
      const anno: BoxAnno = {
        id: annoId(),
        page: pageIdx,
        kind: active,
        x,
        y,
        w: active === 'note' ? 170 : 220,
        h: active === 'note' ? 110 : fontSize * 1.6,
        text: '',
        fontSize: active === 'note' ? 12 : fontSize,
        color: active === 'note' ? '#7c5c10' : color,
      }
      commit((prev) => [...prev, anno])
      setSelected(anno.id)
      setEditing(anno.id)
      setActive('select')
      return
    }
    if (active === 'image') {
      if (!pendingImage) {
        imageInput.current?.click()
        return
      }
      const w = 220
      const anno: BoxAnno = {
        id: annoId(),
        page: pageIdx,
        kind: 'image',
        x: x - w / 2,
        y: y - w / pendingImage.aspect / 2,
        w,
        h: w / pendingImage.aspect,
        dataUrl: pendingImage.dataUrl,
        color: '#000000',
      }
      commit((prev) => [...prev, anno])
      setSelected(anno.id)
      setActive('select')
      return
    }
    if (active === 'pen' || active === 'highlight') {
      const anno: Anno = {
        id: annoId(),
        page: pageIdx,
        kind: active,
        points: [x, y],
        strokeWidth: active === 'highlight' ? 14 : strokeWidth,
        color: active === 'highlight' ? '#f59e0b' : color,
      }
      drag.current = { kind: 'draw', page: pageIdx, startX: x, startY: y, anno }
      setDraft(anno)
      return
    }
    if (active === 'line' || active === 'arrow') {
      const anno: Anno = {
        id: annoId(),
        page: pageIdx,
        kind: active,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        strokeWidth,
        color,
      }
      drag.current = { kind: 'draw', page: pageIdx, startX: x, startY: y, anno }
      setDraft(anno)
      return
    }
    // rect / ellipse / whiteout
    const anno: BoxAnno = {
      id: annoId(),
      page: pageIdx,
      kind: active,
      x,
      y,
      w: 0,
      h: 0,
      strokeWidth,
      color: active === 'whiteout' ? '#ffffff' : color,
    }
    drag.current = { kind: 'draw', page: pageIdx, startX: x, startY: y, anno }
    setDraft(anno)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    const [x, y] = svgPoint(e)

    if (d.kind === 'draw' && d.anno) {
      const a = d.anno
      if (a.kind === 'pen' || a.kind === 'highlight') {
        a.points.push(x, y)
        setDraft({ ...a, points: [...a.points] })
      } else if (a.kind === 'line' || a.kind === 'arrow') {
        setDraft({ ...a, x2: x, y2: y })
        d.anno = { ...a, x2: x, y2: y }
      } else if (isBox(a)) {
        const nx = Math.min(d.startX, x)
        const ny = Math.min(d.startY, y)
        const next = { ...a, x: nx, y: ny, w: Math.abs(x - d.startX), h: Math.abs(y - d.startY) }
        setDraft(next)
        d.anno = next
      }
      return
    }

    if ((d.kind === 'move' || d.kind === 'resize') && d.orig) {
      const dx = x - d.startX
      const dy = y - d.startY
      setAnnos((prev) =>
        prev.map((a) => {
          if (a.id !== d.orig!.id) return a
          const o = d.orig!
          if (d.kind === 'move') {
            if (isBox(o)) return { ...o, x: o.x + dx, y: o.y + dy }
            if (isSegment(o)) return { ...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy }
            if (isStroke(o)) {
              const pts = [...o.points]
              for (let i = 0; i < pts.length; i += 2) {
                pts[i] = (o.points[i] ?? 0) + dx
                pts[i + 1] = (o.points[i + 1] ?? 0) + dy
              }
              return { ...o, points: pts }
            }
            return a
          }
          // resize (boxes only)
          if (isBox(o)) return { ...o, w: Math.max(12, o.w + dx), h: Math.max(12, o.h + dy) }
          return a
        }),
      )
    }
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.kind === 'draw' && d.anno) {
      const a = d.anno
      const tooSmall = isBox(a)
        ? a.w < 4 && a.h < 4
        : isSegment(a)
          ? Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 4
          : isStroke(a) && a.points.length < 4
      if (!tooSmall) {
        commit((prev) => [...prev, a])
        setSelected(a.id)
      }
      setDraft(null)
    }
    // move/resize: the pre-drag snapshot was pushed to history when the drag started
  }

  const startEditSpan = (e: React.PointerEvent, span: EditSpan) => {
    e.stopPropagation()
    e.preventDefault() // keep focus in the autofocused textarea (see onPointerDown)
    const anno: BoxAnno = {
      id: annoId(),
      page: span.page,
      kind: 'edittext',
      x: span.x,
      y: span.y,
      w: span.w,
      h: span.h,
      text: span.text,
      fontSize: span.size,
      fontFamily: span.family,
      bold: span.bold,
      italic: span.italic,
      color: '#111827',
      coverColor: '#ffffff',
    }
    commit((prev) => [...prev, anno])
    setClaimed((prev) => new Set(prev).add(span.id))
    setSelected(anno.id)
    setEditing(anno.id)
  }

  const startMove = (e: React.PointerEvent, anno: Anno) => {
    if (active !== 'select') return
    e.stopPropagation()
    const svg = (e.target as Element).closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const meta = pages[anno.page]
    const x = ((e.clientX - rect.left) / rect.width) * (meta?.w ?? 1)
    const y = ((e.clientY - rect.top) / rect.height) * (meta?.h ?? 1)
    setSelected(anno.id)
    setAnnos((cur) => {
      setHistory((h) => [...h.slice(-40), cur])
      setRedoStack([])
      return cur
    })
    drag.current = { kind: 'move', page: anno.page, startX: x, startY: y, orig: structuredClone(anno) }
  }

  const startResize = (e: React.PointerEvent, anno: Anno) => {
    e.stopPropagation()
    const svg = (e.target as Element).closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const meta = pages[anno.page]
    const x = ((e.clientX - rect.left) / rect.width) * (meta?.w ?? 1)
    const y = ((e.clientY - rect.top) / rect.height) * (meta?.h ?? 1)
    setAnnos((cur) => {
      setHistory((h) => [...h.slice(-40), cur])
      setRedoStack([])
      return cur
    })
    drag.current = { kind: 'resize', page: anno.page, startX: x, startY: y, orig: structuredClone(anno) }
  }

  const exportPdf = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { applyAnnotations } = await import('@/features/editorExport')
      const blob = await applyAnnotations(file, annos)
      downloadBlob(blob, `${baseName(file.name)} (edited).pdf`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const renderAnno = (a: Anno) => {
    const sel = a.id === selected
    const common = {
      onPointerDown: (e: React.PointerEvent) => startMove(e, a),
      style: { cursor: active === 'select' ? 'move' : undefined },
    }
    switch (a.kind) {
      case 'whiteout':
        return (
          <rect
            key={a.id}
            x={a.x}
            y={a.y}
            width={a.w}
            height={a.h}
            fill="#ffffff"
            stroke={sel ? '#10b981' : '#d4d4d8'}
            strokeDasharray={sel ? '4 3' : undefined}
            strokeWidth={1}
            {...common}
          />
        )
      case 'rect':
        return (
          <rect
            key={a.id}
            x={a.x}
            y={a.y}
            width={a.w}
            height={a.h}
            fill="none"
            stroke={a.color}
            strokeWidth={a.strokeWidth ?? 2}
            {...common}
          />
        )
      case 'ellipse':
        return (
          <ellipse
            key={a.id}
            cx={a.x + a.w / 2}
            cy={a.y + a.h / 2}
            rx={a.w / 2}
            ry={a.h / 2}
            fill="none"
            stroke={a.color}
            strokeWidth={a.strokeWidth ?? 2}
            {...common}
          />
        )
      case 'line':
      case 'arrow':
        return (
          <g key={a.id} {...common}>
            <line
              x1={a.x1}
              y1={a.y1}
              x2={a.x2}
              y2={a.y2}
              stroke={a.color}
              strokeWidth={a.strokeWidth}
              strokeLinecap="round"
            />
            {a.kind === 'arrow' && <ArrowHead a={a} />}
            {/* fat invisible hit area */}
            <line
              x1={a.x1}
              y1={a.y1}
              x2={a.x2}
              y2={a.y2}
              stroke="transparent"
              strokeWidth={Math.max(14, a.strokeWidth * 3)}
            />
          </g>
        )
      case 'pen':
      case 'highlight':
        return (
          <polyline
            key={a.id}
            points={pairs(a.points)}
            fill="none"
            stroke={a.color}
            strokeWidth={a.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={a.kind === 'highlight' ? 0.45 : 1}
            {...common}
          />
        )
      case 'note':
        return (
          <g key={a.id} {...common} onDoubleClick={() => setEditing(a.id)}>
            <rect
              x={a.x}
              y={a.y}
              width={a.w}
              height={a.h}
              fill="#fef3c0"
              stroke="#d9b84c"
              strokeWidth={0.8}
              rx={3}
            />
            <SvgTextBlock a={a} padding={6} />
          </g>
        )
      case 'text':
        return (
          <g key={a.id} {...common} onDoubleClick={() => setEditing(a.id)}>
            <rect
              x={a.x}
              y={a.y}
              width={a.w}
              height={a.h}
              fill="transparent"
              stroke={sel ? '#10b98188' : 'transparent'}
              strokeDasharray="4 3"
            />
            <SvgTextBlock a={a} padding={0} />
          </g>
        )
      case 'edittext':
        return (
          <g key={a.id} {...common} onDoubleClick={() => setEditing(a.id)}>
            <rect
              x={a.x}
              y={a.y}
              width={a.w}
              height={a.h}
              fill={a.coverColor ?? '#ffffff'}
              stroke={sel ? '#10b981' : 'transparent'}
              strokeWidth={sel ? 0.75 : 0}
            />
            <SvgTextBlock a={a} padding={0} />
          </g>
        )
      case 'image':
        return (
          <image
            key={a.id}
            href={a.dataUrl}
            x={a.x}
            y={a.y}
            width={a.w}
            height={a.h}
            preserveAspectRatio="none"
            {...common}
          />
        )
    }
  }

  const selectedAnno = annos.find((a) => a.id === selected)
  const editingAnno = annos.find((a) => a.id === editing)

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

      {/* Toolbar */}
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <div role="toolbar" aria-label="Editing tools" className="flex flex-wrap items-center gap-1">
          {TOOL_BUTTONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active === id}
              onClick={() => setActive(id)}
              className={`rounded-lg p-2 transition-colors ${
                active === id
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            title="Signature"
            aria-label="Add signature"
            onClick={() => setSigOpen(true)}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <PenTool className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>

        <span className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-700" aria-hidden />

        <div className="flex items-center gap-1" role="group" aria-label="Color">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              onClick={() => {
                setColor(c)
                if (selectedAnno)
                  commit((prev) => prev.map((a) => (a.id === selected ? { ...a, color: c } : a)))
              }}
              className={`h-5.5 w-5.5 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-brand-500' : 'border-white dark:border-neutral-800'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          Stroke
          <select
            className="input-base w-14 px-1.5 py-1 text-xs"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            aria-label="Stroke width"
          >
            {[1, 2, 3, 5, 8].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          Text
          <select
            className="input-base w-14 px-1.5 py-1 text-xs"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            aria-label="Font size"
          >
            {[10, 12, 14, 16, 20, 24, 32].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <span className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-700" aria-hidden />

        <button
          type="button"
          className="btn-ghost"
          onClick={undo}
          disabled={history.length === 0}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={redo}
          disabled={redoStack.length === 0}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className="btn-primary ml-auto"
          onClick={() => void exportPdf()}
          disabled={busy || !file}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Apply & download
        </button>
      </div>

      {/* Pages */}
      {doc && (
        <div className="space-y-6 overflow-x-auto pb-8">
          {pages.map((meta, i) => (
            <div
              key={i}
              className="relative mx-auto shadow-lg ring-1 ring-black/10"
              style={{ width: meta.w * scale, height: meta.h * scale }}
            >
              <PageCanvas doc={doc} pageNo={i + 1} scale={scale} />
              <svg
                data-page={i}
                viewBox={`0 0 ${meta.w} ${meta.h}`}
                className="absolute inset-0 h-full w-full touch-none"
                style={{ cursor: active === 'select' ? 'default' : 'crosshair' }}
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                aria-label={`Page ${i + 1} annotations`}
              >
                {annos.filter((a) => a.page === i).map(renderAnno)}
                {draft && draft.page === i && renderAnno(draft)}
                {active === 'edittext' &&
                  spans
                    .filter((s) => s.page === i && !claimed.has(s.id))
                    .map((s) => (
                      <rect
                        key={s.id}
                        x={s.x}
                        y={s.y}
                        width={s.w}
                        height={s.h}
                        rx={1}
                        className="cursor-text"
                        fill="#10b981"
                        fillOpacity={0.12}
                        stroke="#10b981"
                        strokeOpacity={0.5}
                        strokeWidth={0.5}
                        onPointerDown={(e) => startEditSpan(e, s)}
                      >
                        <title>Click to edit: {s.text}</title>
                      </rect>
                    ))}
                {selectedAnno && selectedAnno.page === i && isBox(selectedAnno) && (
                  <g>
                    <rect
                      x={selectedAnno.x - 2}
                      y={selectedAnno.y - 2}
                      width={selectedAnno.w + 4}
                      height={selectedAnno.h + 4}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.2}
                      strokeDasharray="5 4"
                      pointerEvents="none"
                    />
                    <circle
                      cx={selectedAnno.x + selectedAnno.w + 2}
                      cy={selectedAnno.y + selectedAnno.h + 2}
                      r={6}
                      fill="#10b981"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => startResize(e, selectedAnno)}
                    />
                  </g>
                )}
              </svg>

              {/* Inline text editing */}
              {editingAnno && editingAnno.page === i && isBox(editingAnno) && (
                <textarea
                  autoFocus
                  aria-label="Annotation text"
                  className="absolute resize-none rounded border border-brand-500 bg-white/95 p-1 text-neutral-900 shadow focus:outline-none"
                  style={{
                    left: editingAnno.x * scale,
                    top: editingAnno.y * scale,
                    width: Math.max(120, editingAnno.w * scale),
                    height: Math.max(40, editingAnno.h * scale),
                    fontSize: (editingAnno.fontSize ?? 14) * scale,
                    lineHeight: 1.25,
                  }}
                  defaultValue={editingAnno.text ?? ''}
                  onBlur={(e) => {
                    const text = e.target.value
                    commit((prev) =>
                      prev
                        .map((a) => {
                          if (a.id !== editing || !isBox(a)) return a
                          const lines = text.split('\n').length
                          return { ...a, text, h: Math.max(a.h, lines * (a.fontSize ?? 14) * 1.3 + 6) }
                        })
                        .filter((a) => !(a.id === editing && !text.trim() && a.kind === 'text')),
                    )
                    setEditing(null)
                  }}
                />
              )}

              <span className="absolute -bottom-5 left-0 text-xs text-neutral-400">Page {i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden image input */}
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          const reader = new FileReader()
          reader.onload = () => {
            const img = new Image()
            img.onload = () =>
              setPendingImage({
                dataUrl: String(reader.result),
                aspect: img.naturalWidth / img.naturalHeight,
              })
            img.src = String(reader.result)
          }
          reader.readAsDataURL(f)
        }}
      />

      {pendingImage && active === 'image' && (
        <p className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-neutral-900">
          Click on a page to place the image
        </p>
      )}

      {sigOpen && (
        <Suspense fallback={null}>
          <SignatureModal
            onClose={() => setSigOpen(false)}
            onDone={(dataUrl, aspect) => {
              setPendingImage({ dataUrl, aspect })
              setActive('image')
              setSigOpen(false)
            }}
          />
        </Suspense>
      )}
    </ToolShell>
  )
}

function pairs(points: number[]): string {
  const out: string[] = []
  for (let i = 0; i + 1 < points.length; i += 2) out.push(`${points[i]},${points[i + 1]}`)
  return out.join(' ')
}

function ArrowHead({
  a,
}: {
  a: { x1: number; y1: number; x2: number; y2: number; strokeWidth: number; color: string }
}) {
  const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1)
  const len = Math.max(9, a.strokeWidth * 4)
  return (
    <>
      {[Math.PI * 0.82, -Math.PI * 0.82].map((off, i) => (
        <line
          key={i}
          x1={a.x2}
          y1={a.y2}
          x2={a.x2 + len * Math.cos(angle + off)}
          y2={a.y2 + len * Math.sin(angle + off)}
          stroke={a.color}
          strokeWidth={a.strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </>
  )
}

const FAMILY_CSS: Record<string, string> = {
  sans: 'Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, "Courier New", Courier, monospace',
}

function SvgTextBlock({ a, padding }: { a: BoxAnno; padding: number }) {
  const size = a.fontSize ?? 14
  const lines = (a.text ?? '').split('\n')
  return (
    <text
      fill={a.color}
      fontSize={size}
      fontFamily={FAMILY_CSS[a.fontFamily ?? 'sans'] ?? FAMILY_CSS.sans}
      fontWeight={a.bold ? 700 : 400}
      fontStyle={a.italic ? 'italic' : 'normal'}
      pointerEvents="none"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={a.x + padding} y={a.y + padding + size * 0.85 + i * size * 1.25}>
          {line}
        </tspan>
      ))}
    </text>
  )
}
