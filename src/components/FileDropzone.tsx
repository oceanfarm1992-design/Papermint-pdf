import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderOpen, Upload } from 'lucide-react'
import { formatBytes } from '@/utils/format'

interface Props {
  accept: string[]
  multiple: boolean
  onFiles: (files: File[]) => void
  /** Compact style used when files are already selected */
  compact?: boolean
}

function matchesAccept(file: File, accept: string[]): boolean {
  if (accept.length === 0) return true
  const name = file.name.toLowerCase()
  return accept.some((a) => {
    if (a.startsWith('.')) return name.endsWith(a.toLowerCase())
    if (a.endsWith('/*')) return file.type.startsWith(a.slice(0, -1))
    return file.type === a
  })
}

async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  // Prefer webkitGetAsEntry so dropped folders are walked recursively
  const entries = Array.from(dt.items ?? [])
    .map((item) => (item.kind === 'file' ? item.webkitGetAsEntry?.() : null))
    .filter((e): e is FileSystemEntry => e != null)

  if (entries.length === 0) return Array.from(dt.files ?? [])

  const out: File[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) =>
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null)),
      )
      if (file) out.push(file)
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries returns results in batches until empty
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve) =>
          reader.readEntries(resolve, () => resolve([])),
        )
        if (batch.length === 0) break
        for (const child of batch) await walk(child)
      }
    }
  }
  await Promise.all(entries.map(walk))
  return out
}

export default function FileDropzone({ accept, multiple, onFiles, compact }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [rejected, setRejected] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)

  const deliver = useCallback(
    (list: File[]) => {
      const good = list.filter((f) => matchesAccept(f, accept))
      const bad = list.length - good.length
      setRejected(
        bad > 0 ? `${bad} file${bad === 1 ? ' was' : 's were'} skipped (unsupported format).` : null,
      )
      if (good.length > 0) onFiles(multiple ? good : good.slice(0, 1))
    },
    [accept, multiple, onFiles],
  )

  // Paste support (Ctrl+V a copied file)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length > 0) {
        e.preventDefault()
        deliver(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [deliver])

  const acceptAttr = accept.join(',')

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose files or drag and drop"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void filesFromDataTransfer(e.dataTransfer).then(deliver)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
          compact ? 'gap-1 px-4 py-4' : 'gap-3 px-6 py-14'
        } ${
          dragOver
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
            : 'border-neutral-300 bg-neutral-50/60 hover:border-brand-400 hover:bg-brand-50/40 dark:border-neutral-700 dark:bg-neutral-900/40 dark:hover:border-brand-500/60 dark:hover:bg-brand-500/5'
        }`}
      >
        <span
          className={`inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 ${compact ? 'hidden' : ''}`}
        >
          <Upload className="h-7 w-7" aria-hidden />
        </span>
        <p className={`font-medium ${compact ? 'text-sm' : 'text-lg'}`}>
          {dragOver ? 'Drop to add files' : compact ? 'Add more files' : 'Drag & drop files here'}
        </p>
        {!compact && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            or <span className="font-medium text-brand-600 dark:text-brand-400">browse files</span> · paste
            with Ctrl+V {multiple && '· folders supported'}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {rejected ? (
          <p role="alert" className="text-xs text-amber-600 dark:text-amber-400">
            {rejected}
          </p>
        ) : (
          <span className="text-xs text-neutral-400">Max recommended size: {formatBytes(512 * 1024 * 1024)}</span>
        )}
        {multiple && (
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => folderRef.current?.click()}
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden /> Select a folder
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          deliver(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      {/* Folder picker (Chromium/WebKit) */}
      <input
        ref={folderRef}
        type="file"
        multiple
        className="hidden"
        // @ts-expect-error non-standard but widely supported
        webkitdirectory=""
        onChange={(e) => {
          deliver(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </div>
  )
}
