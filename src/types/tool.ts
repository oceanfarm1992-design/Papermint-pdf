import type { LucideIcon } from 'lucide-react'

export type CategoryId =
  | 'organize'
  | 'edit'
  | 'convert-from'
  | 'convert-to'
  | 'ocr'
  | 'security'
  | 'compress'
  | 'forms'
  | 'images'
  | 'compare'
  | 'ai'

export interface Category {
  id: CategoryId
  name: string
  description: string
  icon: LucideIcon
  /** Tailwind classes for the category accent chip */
  accent: string
}

export type ToolSpeed = 'instant' | 'fast' | 'medium' | 'heavy'

export interface OptionChoice {
  value: string
  label: string
}

export type OptionField =
  | {
      kind: 'select'
      key: string
      label: string
      choices: OptionChoice[]
      default: string
      help?: string
    }
  | { kind: 'text'; key: string; label: string; default: string; placeholder?: string; help?: string }
  | { kind: 'password'; key: string; label: string; default: string; placeholder?: string; help?: string }
  | { kind: 'number'; key: string; label: string; default: number; min?: number; max?: number; step?: number; help?: string }
  | { kind: 'checkbox'; key: string; label: string; default: boolean; help?: string }

export type OptionValues = Record<string, string | number | boolean>

export interface OutputFile {
  name: string
  blob: Blob
}

export interface ProcessContext {
  /** Report progress 0..1 plus a human-readable stage label */
  onProgress: (fraction: number, stage?: string) => void
  /** Aborts when the user presses Cancel */
  signal: AbortSignal
}

export type ProcessFn = (
  files: File[],
  options: OptionValues,
  ctx: ProcessContext,
) => Promise<OutputFile[]>

export interface ToolDef {
  slug: string
  name: string
  description: string
  category: CategoryId
  icon: LucideIcon
  keywords: string[]
  accept: string[]
  multiple: boolean
  minFiles: number
  speed: ToolSpeed
  /** True when the tool needs no network at all (OCR downloads language packs once) */
  offline: boolean
  options?: OptionField[]
  /** Generic tools declare a lazy process function; interactive tools declare a custom page */
  run?: () => Promise<ProcessFn>
  customPage?: 'organizer' | 'editor' | 'sign' | 'crop' | 'redact' | 'fill-forms' | 'create-forms' | 'compare' | 'viewer'
  /** Extra note rendered on the tool page (limitations, hints) */
  note?: string
  /** For editor aliases: which annotation tool to activate on load */
  editorTool?: string
  /**
   * When set, the tool page shows a visual thumbnail grid so the user can see
   * pages and click to select them. The selection is written back into the
   * given option key as a 1-based range string (kept in sync with the text field).
   */
  pageSelect?: { key: string; emptyMeansAll?: boolean; verb?: string }
}
