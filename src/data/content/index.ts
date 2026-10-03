import { TOOLS } from '@/data/tools'
import type { ToolDef } from '@/types/tool'
import { CONVERT_CONTENT } from './convert'
import { EDIT_CONTENT } from './edit'
import { ORGANIZE_CONTENT } from './organize'
import { OTHER_CONTENT } from './other'
import type { ToolContent, ToolFaq } from './types'

export type { ToolContent, ToolFaq } from './types'

const CONTENT: Record<string, ToolContent> = {
  ...ORGANIZE_CONTENT,
  ...EDIT_CONTENT,
  ...CONVERT_CONTENT,
  ...OTHER_CONTENT,
}

const RELATED_LIMIT = 6

/** The privacy answer every tool shares, phrased for that tool. */
function privacyFaq(tool: ToolDef): ToolFaq {
  const network = tool.offline
    ? 'It makes no network requests while processing and keeps working offline once the page has loaded.'
    : 'The only download is the open-source OCR language model, fetched once and cached — it contains nothing about your document.'
  return {
    q: `Is ${tool.name} safe for confidential files?`,
    a: `Yes. ${tool.name} runs entirely in your browser using JavaScript and WebAssembly — your files are never uploaded to a server. ${network}`,
  }
}

const COST_FAQ: ToolFaq = {
  q: 'Is it really free?',
  a: 'Yes — free with no signup, no watermarks, no daily limits and no ads. Privacy PDF Tools is open source under the MIT license.',
}

export function toolContent(slug: string): ToolContent | undefined {
  return CONTENT[slug]
}

/** Tool-specific FAQs followed by the shared privacy and cost answers. */
export function toolFaqs(tool: ToolDef): ToolFaq[] {
  return [...(CONTENT[tool.slug]?.faqs ?? []), privacyFaq(tool), COST_FAQ]
}

/** Other tools in the same category, for internal linking. */
export function relatedTools(tool: ToolDef): ToolDef[] {
  return TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(
    0,
    RELATED_LIMIT,
  )
}
