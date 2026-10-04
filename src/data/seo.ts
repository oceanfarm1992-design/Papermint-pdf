import type { ToolDef } from '@/types/tool'

/**
 * Search-facing names and titles. Shared by the SPA (useSeo, headings) and
 * scripts/prerender.mjs so crawlers and users always see the same text.
 *
 * Titles lead with the phrase people actually search ("PDF to Word", not
 * "PDF → Word") followed by the differentiators that win clicks in results:
 * free, no upload. Google shows roughly the first 60 characters.
 */
const BRAND = 'Privacy PDF Tools'
const MAX_TITLE = 60

export const HOME_TITLE = 'Privacy PDF Tools — Merge, Compress & Edit PDFs Free, No Upload'
export const HOME_DESCRIPTION =
  'Free online PDF tools that never upload your files: merge, split, compress, convert, edit, sign and OCR PDFs 100% in your browser. No signup, no watermarks, no tracking.'

export const GUIDES_TITLE = 'PDF Guides — Private How-Tos & Comparisons'
export const GUIDES_DESCRIPTION =
  'How to merge, compress and redact PDFs without uploading them, plus honest comparisons with iLovePDF and Smallpdf.'

/**
 * Search phrases for tools whose UI name is too short or generic to rank
 * ("Draw", "Highlight"). Based on the queries Search Console shows, e.g.
 * "pdf highlighter", "pdf sticky notes", "rotate pdf pages".
 */
const SEARCH_NAMES: Record<string, string> = {
  'organize-pdf': 'Rearrange PDF Pages',
  'extract-pages': 'Extract PDF Pages',
  'delete-pages': 'Delete PDF Pages',
  'rotate-pdf': 'Rotate PDF Pages',
  'duplicate-pages': 'Duplicate PDF Pages',
  'reverse-pages': 'Reverse PDF Pages',
  'add-text': 'Add Text to PDF',
  'draw-pdf': 'Draw on PDF',
  'highlight-pdf': 'PDF Highlighter',
  'shapes-pdf': 'Add Shapes to PDF',
  'sticky-notes': 'PDF Sticky Notes',
  'whiteout-pdf': 'Whiteout PDF',
  'add-images': 'Add Image to PDF',
  'page-numbers': 'Add Page Numbers to PDF',
  'watermark-pdf': 'Add Watermark to PDF',
  'header-footer': 'PDF Header & Footer',
  'ocr-image': 'Image to Text (OCR)',
  'redact-pdf': 'Redact PDF',
  'remove-metadata': 'Remove PDF Metadata',
  'fill-forms': 'Fill PDF Forms',
  'create-forms': 'Create Fillable PDF',
  'extract-images': 'Extract Images from PDF',
  'image-enhance': 'Enhance Scanned Images',
  'compare-pdf': 'Compare PDF Files',
  'summarize-pdf': 'Summarize PDF',
  'keywords-pdf': 'PDF Keyword Extractor',
  'outline-pdf': 'PDF Outline Extractor',
}

/** Tool name as people type it in search: "PDF → Word" becomes "PDF to Word". */
export function seoName(tool: Pick<ToolDef, 'name'> & Partial<Pick<ToolDef, 'slug'>>): string {
  return (tool.slug && SEARCH_NAMES[tool.slug]) || tool.name.replace(/\s*→\s*/g, ' to ')
}

/** "<Tool> Online Free — No Upload | Privacy PDF Tools", shortened to fit ~60 chars. */
export function toolSeoTitle(tool: Pick<ToolDef, 'name'> & Partial<Pick<ToolDef, 'slug'>>): string {
  const name = seoName(tool)
  const candidates = [
    `${name} Online Free — No Upload | ${BRAND}`,
    `${name} Free — No Upload | ${BRAND}`,
    `${name} Online Free — No Upload`,
    `${name} — Free, No Upload`,
  ]
  return candidates.find((t) => t.length <= MAX_TITLE) ?? candidates[candidates.length - 1]!
}

export function toolSeoDescription(
  tool: Pick<ToolDef, 'name' | 'description'> & Partial<Pick<ToolDef, 'slug'>>,
): string {
  return `${seoName(tool)} free online: ${lowerFirst(tool.description)} Runs 100% in your browser — files are never uploaded. No signup, no watermarks.`
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
