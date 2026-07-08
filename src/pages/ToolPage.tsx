import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Eye, Play, Trash2 } from 'lucide-react'
import { toolBySlug, CATEGORIES } from '@/data/tools'
import type { OptionValues, OutputFile } from '@/types/tool'
import { RECENTS_KEY, useLocalList } from '@/hooks/useLocalList'
import FileDropzone from '@/components/FileDropzone'
import OptionsForm from '@/components/OptionsForm'
import ProgressPanel from '@/components/ProgressPanel'
import ResultsPanel from '@/components/ResultsPanel'
import PrivacyNote from '@/components/PrivacyNote'
import NotFound from '@/pages/NotFound'
import { assertReasonableSize, friendlyError, isAbort } from '@/utils/errors'
import { formatBytes, baseName } from '@/utils/format'

const PdfPreviewModal = lazy(() => import('@/components/PdfPreviewModal'))
const PageSelectGrid = lazy(() => import('@/components/PageSelectGrid'))
const OrganizerPage = lazy(() => import('@/pages/tools/OrganizerPage'))
const EditorPage = lazy(() => import('@/pages/tools/EditorPage'))
const SignPage = lazy(() => import('@/pages/tools/SignPage'))
const CropPage = lazy(() => import('@/pages/tools/CropPage'))
const RedactPage = lazy(() => import('@/pages/tools/RedactPage'))
const FillFormsPage = lazy(() => import('@/pages/tools/FillFormsPage'))
const CreateFormsPage = lazy(() => import('@/pages/tools/CreateFormsPage'))
const ComparePage = lazy(() => import('@/pages/tools/ComparePage'))

type Phase =
  | { kind: 'idle' }
  | { kind: 'working'; fraction: number; stage: string; startedAt: number }
  | { kind: 'done'; outputs: OutputFile[] }
  | { kind: 'error'; message: string }

function CustomPageFallback() {
  return <div className="py-24 text-center text-sm text-neutral-400">Loading tool…</div>
}

export default function ToolPage() {
  const { slug } = useParams()
  const tool = slug ? toolBySlug(slug) : undefined
  const { add: addRecent } = useLocalList(RECENTS_KEY, 8)

  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [preview, setPreview] = useState<File | null>(null)
  const [options, setOptions] = useState<OptionValues>({})
  const abortRef = useRef<AbortController | null>(null)

  const defaults = useMemo(() => {
    const d: OptionValues = {}
    for (const f of tool?.options ?? []) d[f.key] = f.default
    return d
  }, [tool])

  useEffect(() => {
    setOptions(defaults)
    setFiles([])
    setPhase({ kind: 'idle' })
  }, [defaults, slug])

  useEffect(() => {
    if (tool) {
      addRecent(tool.slug)
      document.title = `${tool.name} — Papermint`
    }
    return () => {
      document.title = 'Papermint — Free PDF Tools That Never Upload Your Files'
    }
  }, [tool, addRecent])

  if (!tool) return <NotFound />

  // Interactive tools render their own full page
  if (tool.customPage) {
    const props = { tool }
    return (
      <Suspense fallback={<CustomPageFallback />}>
        {tool.customPage === 'organizer' && <OrganizerPage {...props} />}
        {tool.customPage === 'editor' && <EditorPage {...props} />}
        {tool.customPage === 'sign' && <SignPage {...props} />}
        {tool.customPage === 'crop' && <CropPage {...props} />}
        {tool.customPage === 'redact' && <RedactPage {...props} />}
        {tool.customPage === 'fill-forms' && <FillFormsPage {...props} />}
        {tool.customPage === 'create-forms' && <CreateFormsPage {...props} />}
        {tool.customPage === 'compare' && <ComparePage {...props} />}
      </Suspense>
    )
  }

  const category = CATEGORIES.find((c) => c.id === tool.category)
  const canRun = files.length >= tool.minFiles

  const run = async () => {
    if (!tool.run || !canRun) return
    const controller = new AbortController()
    abortRef.current = controller
    const startedAt = Date.now()
    setPhase({ kind: 'working', fraction: 0, stage: 'Starting…', startedAt })
    try {
      for (const f of files) assertReasonableSize(f)
      const fn = await tool.run()
      const outputs = await fn(files, options, {
        signal: controller.signal,
        onProgress: (fraction, stage) =>
          setPhase((prev) =>
            prev.kind === 'working' ? { ...prev, fraction, stage: stage ?? prev.stage } : prev,
          ),
      })
      if (controller.signal.aborted) return
      setPhase({ kind: 'done', outputs })
    } catch (err) {
      if (isAbort(err) || controller.signal.aborted) {
        setPhase({ kind: 'idle' })
      } else {
        console.error(err)
        setPhase({ kind: 'error', message: friendlyError(err) })
      }
    } finally {
      abortRef.current = null
    }
  }

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, j) => j !== i))
  const moveFile = (i: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const next = [...prev]
      const j = i + dir
      const a = next[i]
      const b = next[j]
      if (a === undefined || b === undefined) return prev
      next[i] = b
      next[j] = a
      return next
    })

  const Icon = tool.icon
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="btn-ghost -ml-2 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All tools
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <span className={`inline-flex rounded-2xl p-3 ${category?.accent ?? ''}`}>
          <Icon className="h-8 w-8" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{tool.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <PrivacyNote />
      </div>

      {tool.note && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {tool.note}
        </p>
      )}

      {phase.kind === 'working' ? (
        <ProgressPanel
          fraction={phase.fraction}
          stage={phase.stage}
          startedAt={phase.startedAt}
          onCancel={() => {
            abortRef.current?.abort()
            setPhase({ kind: 'idle' })
          }}
        />
      ) : phase.kind === 'done' ? (
        <ResultsPanel
          outputs={phase.outputs}
          zipName={`${tool.slug}-${baseName(files[0]?.name ?? 'output')}.zip`}
          onReset={() => {
            setFiles([])
            setPhase({ kind: 'idle' })
          }}
        />
      ) : (
        <div className="space-y-5">
          {phase.kind === 'error' && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{phase.message}</p>
            </div>
          )}

          <FileDropzone
            accept={tool.accept}
            multiple={tool.multiple}
            onFiles={(incoming) =>
              setFiles((prev) => (tool.multiple ? [...prev, ...incoming] : incoming))
            }
            compact={files.length > 0}
          />

          {files.length > 0 && (
            <ul className="space-y-2" aria-label="Selected files">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="card flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs tabular-nums text-neutral-400">{formatBytes(file.size)}</span>
                  {tool.multiple && files.length > 1 && (
                    <span className="flex gap-0.5">
                      <button
                        type="button"
                        className="btn-ghost px-1.5"
                        aria-label={`Move ${file.name} up`}
                        disabled={i === 0}
                        onClick={() => moveFile(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-1.5"
                        aria-label={`Move ${file.name} down`}
                        disabled={i === files.length - 1}
                        onClick={() => moveFile(i, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  )}
                  {file.type === 'application/pdf' && (
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label={`Preview ${file.name}`}
                      onClick={() => setPreview(file)}
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-rose-500"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(i)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tool.pageSelect && files.length === 1 && files[0]?.type === 'application/pdf' && (
            <Suspense fallback={<div className="card p-4 text-sm text-neutral-400">Loading pages…</div>}>
              <PageSelectGrid
                key={`${files[0].name}-${files[0].size}`}
                file={files[0]}
                value={String(options[tool.pageSelect.key] ?? '')}
                emptyMeansAll={tool.pageSelect.emptyMeansAll}
                verb={tool.pageSelect.verb}
                onChange={(rangeString) =>
                  setOptions((prev) => ({ ...prev, [tool.pageSelect!.key]: rangeString }))
                }
              />
            </Suspense>
          )}

          {files.length > 0 && tool.options && tool.options.length > 0 && (
            <div className="card p-4">
              <OptionsForm
                fields={tool.options}
                values={options}
                onChange={(key, value) => setOptions((prev) => ({ ...prev, [key]: value }))}
              />
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              className="btn-primary px-8 py-3 text-base"
              disabled={!canRun}
              onClick={() => void run()}
            >
              <Play className="h-5 w-5" aria-hidden />
              {tool.minFiles > files.length
                ? `Select ${tool.minFiles - files.length} more file${tool.minFiles - files.length === 1 ? '' : 's'}`
                : tool.name}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <Suspense fallback={null}>
          <PdfPreviewModal file={preview} onClose={() => setPreview(null)} />
        </Suspense>
      )}
    </div>
  )
}
