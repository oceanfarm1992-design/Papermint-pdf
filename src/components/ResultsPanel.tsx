import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, Check, Download, Pencil, RotateCcw } from 'lucide-react'
import type { OutputFile } from '@/types/tool'
import { downloadBlob, zipOutputs } from '@/utils/download'
import { formatBytes, sanitizeFileName } from '@/utils/format'

interface Props {
  outputs: OutputFile[]
  zipName: string
  onReset: () => void
}

function TextPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (open && text === null) {
      void blob.slice(0, 100_000).text().then(setText)
    }
  }, [open, text, blob])
  return (
    <div className="mt-2">
      <button type="button" className="btn-ghost text-xs" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide preview' : 'Show preview'}
      </button>
      {open && (
        <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-neutral-100 p-3 text-xs whitespace-pre-wrap dark:bg-neutral-800">
          {text ?? 'Loading…'}
        </pre>
      )}
    </div>
  )
}

export default function ResultsPanel({ outputs, zipName, onReset }: Props) {
  const [names, setNames] = useState(() => outputs.map((o) => o.name))
  const [editing, setEditing] = useState<number | null>(null)

  const nameAt = (i: number) => names[i] ?? outputs[i]?.name ?? 'output'

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        aria-hidden
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.div>
      <h2 className="text-center text-xl font-semibold">
        Done! {outputs.length === 1 ? 'Your file is ready.' : `${outputs.length} files are ready.`}
      </h2>

      <ul className="space-y-2">
        {outputs.map((out, i) => (
          <li key={i} className="card p-3">
            <div className="flex flex-wrap items-center gap-2">
              {editing === i ? (
                <input
                  autoFocus
                  className="input-base flex-1"
                  value={nameAt(i)}
                  aria-label="Rename output file"
                  onChange={(e) =>
                    setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))
                  }
                  onBlur={() => {
                    setNames((prev) => prev.map((n, j) => (j === i ? sanitizeFileName(n) : n)))
                    setEditing(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm font-medium" title={nameAt(i)}>
                  {nameAt(i)}
                </span>
              )}
              <span className="text-xs tabular-nums text-neutral-400">{formatBytes(out.blob.size)}</span>
              <button
                type="button"
                className="btn-ghost"
                aria-label={`Rename ${nameAt(i)}`}
                onClick={() => setEditing(i)}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="btn-secondary py-1.5 text-sm"
                onClick={() => downloadBlob(out.blob, nameAt(i))}
              >
                <Download className="h-4 w-4" aria-hidden /> Download
              </button>
            </div>
            {out.blob.type.startsWith('text/') && <TextPreview blob={out.blob} />}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {outputs.length > 1 && (
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              void zipOutputs(
                outputs.map((o, i) => ({ ...o, name: nameAt(i) })),
                zipName,
              )
            }
          >
            <Archive className="h-4 w-4" aria-hidden /> Download all as ZIP
          </button>
        )}
        {outputs.length === 1 && outputs[0] && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => outputs[0] && downloadBlob(outputs[0].blob, nameAt(0))}
          >
            <Download className="h-4 w-4" aria-hidden /> Download
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Start over
        </button>
      </div>
    </div>
  )
}
