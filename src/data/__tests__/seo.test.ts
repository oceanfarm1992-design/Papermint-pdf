import { describe, expect, it } from 'vitest'
import { TOOLS } from '../tools'
import { HOME_DESCRIPTION, HOME_TITLE, seoName, toolSeoDescription, toolSeoTitle } from '../seo'

describe('seo titles', () => {
  it('spells arrows the way people search', () => {
    expect(seoName({ name: 'PDF → Word' })).toBe('PDF to Word')
    expect(seoName({ name: 'Merge PDF' })).toBe('Merge PDF')
  })

  it('leads with the tool name and the no-upload promise', () => {
    expect(toolSeoTitle({ name: 'Merge PDF' })).toBe(
      'Merge PDF Online Free — No Upload | Privacy PDF Tools',
    )
  })

  it.each(TOOLS.map((t) => [t.slug, t] as const))('%s: title ≤ 60 chars and unique', (_slug, tool) => {
    const title = toolSeoTitle(tool)
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title.startsWith(seoName(tool))).toBe(true)
  })

  it('gives every tool a unique title and description', () => {
    const titles = new Set(TOOLS.map(toolSeoTitle))
    const descriptions = new Set(TOOLS.map(toolSeoDescription))
    expect(titles.size).toBe(TOOLS.length)
    expect(descriptions.size).toBe(TOOLS.length)
  })

  it('keeps the homepage title and description within result-snippet length', () => {
    expect(HOME_TITLE.length).toBeLessThanOrEqual(65)
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(170)
  })
})
