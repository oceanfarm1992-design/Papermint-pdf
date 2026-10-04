import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = [
  '/',
  '/tool/merge-pdf',
  '/tool/split-pdf',
  '/privacy',
  '/faq',
  '/guides',
  '/guides/ilovepdf-alternative',
  '/guides/compress-pdf-for-email',
]

for (const route of ROUTES) {
  test(`accessibility scan: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(
      blocking,
      blocking.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`).join('\n'),
    ).toEqual([])
  })
}
