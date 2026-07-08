import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import FileDropzone from '@/components/FileDropzone'
import { openWithPdfJs, renderPageToCanvas } from '@/utils/pdf'
import { friendlyError } from '@/utils/errors'

const RENDER_W = 900

async function renderPageUrl(
  file: File,
  pageNo: number,
): Promise<{ url: string; count: number } | null> {
  const doc = await openWithPdfJs(file)
  try {
    if (pageNo > doc.numPages) return { url: '', count: doc.numPages }
    const page = await doc.getPage(pageNo)
    const vp = page.getViewport({ scale: 1 })
    const canvas = await renderPageToCanvas(page, RENDER_W / vp.width)
    const url = canvas.toDataURL('image/png')
    canvas.width = 0
    page.cleanup()
    return { url, count: doc.numPages }
  } finally {
    await doc.loadingTask.destroy()
  }
}

function diffImages(urlA: string, urlB: string): Promise<{ url: string; changed: number }> {
  return new Promise((resolve, reject) => {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = rej
        img.src = src
      })
    void Promise.all([load(urlA), load(urlB)])
      .then(([a, b]) => {
        const w = Math.max(a.width, b.width)
        const h = Math.max(a.height, b.height)
        const make = (img: HTMLImageElement) => {
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const ctx = c.getContext('2d')!
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0)
          return ctx.getImageData(0, 0, w, h)
        }
        const da = make(a)
        const db = make(b)
        const out = document.createElement('canvas')
        out.width = w
        out.height = h
        const ctx = out.getContext('2d')!
        const result = ctx.createImageData(w, h)
        let changed = 0
        for (let i = 0; i < da.data.length; i += 4) {
          const dr = Math.abs((da.data[i] ?? 0) - (db.data[i] ?? 0))
          const dg = Math.abs((da.data[i + 1] ?? 0) - (db.data[i + 1] ?? 0))
          const dbl = Math.abs((da.data[i + 2] ?? 0) - (db.data[i + 2] ?? 0))
          const delta = dr + dg + dbl
          // grayscale base from A
          const gray =
            255 -
            Math.round(
              (255 -
                ((da.data[i] ?? 0) * 0.3 +
                  (da.data[i + 1] ?? 0) * 0.59 +
                  (da.data[i + 2] ?? 0) * 0.11)) *
                0.25,
            )
          if (delta > 40) {
            changed++
            result.data[i] = 225
            result.data[i + 1] = 29
            result.data[i + 2] = 72
            result.data[i + 3] = 255
          } else {
            result.data[i] = gray
            result.data[i + 1] = gray
            result.data[i + 2] = gray
            result.data[i + 3] = 255
          }
        }
        ctx.putImageData(result, 0, 0)
        resolve({ url: out.toDataURL('image/png'), changed: changed / (w * h) })
      })
      .catch(reject)
  })
}

export default function ComparePage({ tool }: { tool: ToolDef }) {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [maxPages, setMaxPages] = useState(1)
  const [imgA, setImgA] = useState('')
  const [imgB, setImgB] = useState('')
  const [diff, setDiff] = useState<{ url: string; changed: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(async (a: File, b: File, page: number) => {
    setBusy(true)
    setError(null)
    try {
      const [ra, rb] = await Promise.all([renderPageUrl(a, page), renderPageUrl(b, page)])
      setMaxPages(Math.max(ra?.count ?? 1, rb?.count ?? 1))
      setImgA(ra?.url ?? '')
      setImgB(rb?.url ?? '')
      if (ra?.url && rb?.url) setDiff(await diffImages(ra.url, rb.url))
      else setDiff(null)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (fileA && fileB) void compare(fileA, fileB, pageNo)
  }, [fileA, fileB, pageNo, compare])

  const bothLoaded = fileA && fileB

  return (
    <ToolShell tool={tool} files={bothLoaded ? [fileA, fileB] : []} wide>
      {!bothLoaded ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="label-base">Original PDF {fileA && `✓ ${fileA.name}`}</h2>
            <FileDropzone
              accept={tool.accept}
              multiple={false}
              onFiles={(fs) => fs[0] && setFileA(fs[0])}
              compact={Boolean(fileA)}
            />
          </div>
          <div>
            <h2 className="label-base">Modified PDF {fileB && `✓ ${fileB.name}`}</h2>
            <FileDropzone
              accept={tool.accept}
              multiple={false}
              onFiles={(fs) => fs[0] && setFileB(fs[0])}
              compact={Boolean(fileB)}
            />
          </div>
        </div>
      ) : (
        <div>
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
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Comparing…
                </span>
              ) : diff ? (
                <>
                  <strong
                    className={
                      diff.changed > 0.0005
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {(diff.changed * 100).toFixed(2)}%
                  </strong>{' '}
                  of this page differs (highlighted in red).
                </>
              ) : (
                'One document does not have this page.'
              )}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-ghost"
                aria-label="Previous page"
                disabled={pageNo <= 1 || busy}
                onClick={() => setPageNo((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="text-sm tabular-nums">
                {pageNo} / {maxPages}
              </span>
              <button
                type="button"
                className="btn-ghost"
                aria-label="Next page"
                disabled={pageNo >= maxPages || busy}
                onClick={() => setPageNo((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFileA(null)
                setFileB(null)
                setPageNo(1)
                setDiff(null)
              }}
            >
              Choose other files
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: fileA.name, src: imgA },
              { title: fileB.name, src: imgB },
              { title: 'Differences', src: diff?.url ?? '' },
            ].map(({ title, src }, i) => (
              <figure key={i} className="min-w-0">
                <figcaption
                  className="mb-1.5 truncate text-center text-xs font-medium text-neutral-500 dark:text-neutral-400"
                  title={title}
                >
                  {title}
                </figcaption>
                {src ? (
                  <img src={src} alt={title} className="w-full rounded-lg shadow ring-1 ring-black/10" />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800">
                    No page
                  </div>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  )
}
