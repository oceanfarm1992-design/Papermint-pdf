/**
 * Long-form guide / comparison pages (/guides/<slug>). Content is structured
 * data so the SPA and scripts/prerender.mjs render identical markup.
 *
 * Claims about other products must stay general and verifiable (e.g. "processes
 * files on its servers"), never specific numbers or features we can't confirm.
 */
export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  /** A short row of links to tools, by slug */
  | { type: 'tools'; slugs: string[] }
  | { type: 'table'; caption: string; head: string[]; rows: string[][] }

export interface GuideFaq {
  q: string
  a: string
}

export interface Guide {
  slug: string
  kind: 'comparison' | 'how-to'
  /** <title>, ≤ 60 characters */
  title: string
  h1: string
  /** meta description, ≤ 160 characters */
  description: string
  /** ISO date of the last meaningful content change */
  updated: string
  /** Tool pages that link to this guide (and it to them) */
  relatedTools: string[]
  blocks: GuideBlock[]
  faqs: GuideFaq[]
}
