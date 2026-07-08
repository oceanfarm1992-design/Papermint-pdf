import { useCallback, useState } from 'react'
import { CheckSquare, Download, Loader2, TextCursorInput, Trash2 } from 'lucide-react'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import { openWithPdfJs, openWithPdfLib, renderPageToCanvas, savePdfBlob } from '@/utils/pdf'
import { downloadBlob } from '@/utils/download'
import { friendlyError, UserError } from '@/utils/errors'
import { baseName } from '@/utils/format'

interface Placement {
  id: number
  page: number
  x: number
  y: number
  w: number
  h: number
  type: 'text' | 'checkbox'
  name: string
}

let nextId = 1

export default function CreateFormsPage({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<{ url: string; w: number; h: number }[]>([])
  const [placements, setPlacements] = useState<Placement[]>([])
  const [fieldType, setFieldType] = useState<'text' | 'checkbox'>('text')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setPlacements([])
    } catch (err) {
      setError(friendlyError(err))
    }
  }, [])

  const addField = (pageIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const meta = pages[pageIdx]
    if (!meta) return
    const x = ((e.clientX - rect.left) / rect.width) * meta.w
    const y = ((e.clientY - rect.top) / rect.height) * meta.h
    const isCheck = fieldType === 'checkbox'
    const w = isCheck ? 16 : 180
    const h = isCheck ? 16 : 24
    setPlacements((prev) => [
      ...prev,
      {
        id: nextId,
        page: pageIdx,
        x: Math.max(0, x - w / 2),
        y: Math.max(0, y - h / 2),
        w,
        h,
        type: fieldType,
        name: `${fieldType === 'text' ? 'text_field' : 'checkbox'}_${nextId++}`,
      },
    ])
  }

  const apply = async () => {
    if (!file) return
    if (placements.length === 0) {
      setError('Click on a page to place at least one field.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const names = new Set<string>()
      for (const p of placements) {
        if (!p.name.trim()) throw new UserError('Every field needs a name.')
        if (names.has(p.name))
          throw new UserError(`Duplicate field name “${p.name}” — names must be unique.`)
        names.add(p.name)
      }
      const doc = await openWithPdfLib(file)
      const form = doc.getForm()
      for (const p of placements) {
        const page = doc.getPage(p.page)
        const pageH = page.getHeight()
        const rect = { x: p.x, y: pageH - p.y - p.h, width: p.w, height: p.h }
        if (p.type === 'text') {
          const field = form.createTextField(p.name)
          field.addToPage(page, rect)
        } else {
          const field = form.createCheckBox(p.name)
          field.addToPage(page, rect)
        }
      }
      downloadBlob(await savePdfBlob(doc), `${baseName(file.name)} (form).pdf`)
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
        <div
          role="radiogroup"
          aria-label="Field type"
          className="mr-auto flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
        >
          <button
            type="button"
            role="radio"
            aria-checked={fieldType === 'text'}
            onClick={() => setFieldType('text')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${fieldType === 'text' ? 'bg-white shadow-sm dark:bg-neutral-700' : 'text-neutral-500'}`}
          >
            <TextCursorInput className="h-4 w-4" aria-hidden /> Text field
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={fieldType === 'checkbox'}
            onClick={() => setFieldType('checkbox')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${fieldType === 'checkbox' ? 'bg-white shadow-sm dark:bg-neutral-700' : 'text-neutral-500'}`}
          >
            <CheckSquare className="h-4 w-4" aria-hidden /> Checkbox
          </button>
        </div>
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
          Create form & download
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {pages.map((meta, i) => (
            <div
              key={i}
              className="relative mx-auto max-w-[720px] cursor-copy shadow-lg ring-1 ring-black/10 select-none"
              onClick={(e) => addField(i, e)}
            >
              <img src={meta.url} alt={`Page ${i + 1}`} className="block w-full" draggable={false} />
              {placements
                .filter((p) => p.page === i)
                .map((p) => (
                  <div
                    key={p.id}
                    className="absolute flex items-center justify-center border-2 border-indigo-500 bg-indigo-200/40 text-[10px] font-medium text-indigo-800"
                    style={{
                      left: `${(p.x / meta.w) * 100}%`,
                      top: `${(p.y / meta.h) * 100}%`,
                      width: `${(p.w / meta.w) * 100}%`,
                      height: `${(p.h / meta.h) * 100}%`,
                    }}
                    title={p.name}
                  >
                    {p.type === 'text' ? 'ab|' : '✓'}
                  </div>
                ))}
              <span className="absolute -bottom-5 left-0 text-xs text-neutral-400">Page {i + 1}</span>
            </div>
          ))}
        </div>

        <aside className="card h-fit p-4 lg:sticky lg:top-20" aria-label="Placed fields">
          <h2 className="mb-3 font-semibold">Fields ({placements.length})</h2>
          {placements.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Click anywhere on a page to place a {fieldType === 'text' ? 'text field' : 'checkbox'}.
            </p>
          ) : (
            <ul className="space-y-2">
              {placements.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <input
                    className="input-base flex-1 py-1 text-xs"
                    value={p.name}
                    aria-label="Field name"
                    onChange={(e) =>
                      setPlacements((prev) =>
                        prev.map((q) => (q.id === p.id ? { ...q, name: e.target.value } : q)),
                      )
                    }
                  />
                  <span className="text-[10px] text-neutral-400">p.{p.page + 1}</span>
                  <button
                    type="button"
                    className="btn-ghost px-1.5 text-rose-500"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => setPlacements((prev) => prev.filter((q) => q.id !== p.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </ToolShell>
  )
}
