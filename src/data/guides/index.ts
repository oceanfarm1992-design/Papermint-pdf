import { COMPARISON_GUIDES } from './comparisons'
import { HOWTO_GUIDES } from './howto'
import { PRIVACY_GUIDES } from './privacy'
import type { Guide } from './types'

export type { Guide, GuideBlock, GuideFaq } from './types'

export const GUIDES: Guide[] = [...HOWTO_GUIDES, ...PRIVACY_GUIDES, ...COMPARISON_GUIDES]

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

/** Guides that mention a tool, for "Related guides" links on tool pages. */
export function guidesForTool(toolSlug: string): Guide[] {
  return GUIDES.filter((g) => g.relatedTools.includes(toolSlug))
}
