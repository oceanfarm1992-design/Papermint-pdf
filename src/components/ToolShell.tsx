import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ToolDef } from '@/types/tool'
import { CATEGORIES } from '@/data/tools'
import { seoName } from '@/data/seo'
import PrivacyNote from '@/components/PrivacyNote'
import FileDropzone from '@/components/FileDropzone'

interface Props {
  tool: ToolDef
  /** When no file is selected yet, show the dropzone; otherwise render children */
  file?: File | null
  files?: File[]
  onFiles?: (files: File[]) => void
  wide?: boolean
  children?: ReactNode
}

export default function ToolShell({ tool, file, files, onFiles, wide, children }: Props) {
  const category = CATEGORIES.find((c) => c.id === tool.category)
  const Icon = tool.icon
  const hasInput = file != null || (files != null && files.length >= tool.minFiles)

  return (
    <div className={`mx-auto px-4 py-8 ${wide && hasInput ? 'max-w-7xl' : 'max-w-3xl'}`}>
      <Link to="/" className="btn-ghost -ml-2 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All tools
      </Link>
      <div className="mb-6 flex items-start gap-4">
        <span className={`inline-flex rounded-2xl p-3 ${category?.accent ?? ''}`}>
          <Icon className="h-8 w-8" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{seoName(tool)}</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{tool.description}</p>
        </div>
      </div>
      <div className="mb-6">
        <PrivacyNote />
      </div>
      {tool.note && !hasInput && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {tool.note}
        </p>
      )}
      {!hasInput && onFiles ? (
        <FileDropzone accept={tool.accept} multiple={tool.multiple} onFiles={onFiles} />
      ) : (
        children
      )}
    </div>
  )
}
