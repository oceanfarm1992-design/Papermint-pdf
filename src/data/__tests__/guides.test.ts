import { describe, expect, it } from 'vitest'
import { GUIDES, guidesForTool } from '../guides'
import { toolBySlug } from '../tools'

describe('guides', () => {
  it('have unique slugs', () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length)
  })

  it.each(GUIDES.map((g) => [g.slug, g] as const))('%s fits search-result limits', (_slug, g) => {
    expect(g.title.length).toBeLessThanOrEqual(60)
    expect(g.description.length).toBeLessThanOrEqual(160)
    expect(g.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it.each(GUIDES.map((g) => [g.slug, g] as const))('%s only links to tools that exist', (_slug, g) => {
    const linked = [...g.relatedTools, ...g.blocks.flatMap((b) => (b.type === 'tools' ? b.slugs : []))]
    for (const slug of linked) expect(toolBySlug(slug), slug).toBeDefined()
  })

  it('are linked from the tools they cover', () => {
    expect(guidesForTool('merge-pdf').map((g) => g.slug)).toContain('merge-pdf-without-uploading')
    expect(guidesForTool('redact-pdf').map((g) => g.slug)).toContain('how-to-redact-pdf')
  })
})
