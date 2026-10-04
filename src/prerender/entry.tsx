/**
 * Build-time only: loaded by scripts/prerender.mjs through Vite's SSR loader
 * (never imported by the app). Renders the same React components the SPA shows,
 * so the static HTML crawlers read matches what users see after hydration.
 */
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import PrivacyContent from '@/components/PrivacyContent'
import ToolGuide from '@/components/ToolGuide'
import { toolFaqs } from '@/data/content'
import { toolBySlug } from '@/data/tools'
import { About, Contact, Faq, Privacy, Terms } from '@/pages/StaticPages'

const STATIC_PAGES: Record<string, () => ReactNode> = {
  '/about': () => <About />,
  '/privacy': () => <Privacy />,
  '/terms': () => <Terms />,
  '/contact': () => <Contact />,
  '/faq': () => <Faq />,
}

function render(path: string, node: ReactNode): string {
  return renderToStaticMarkup(<StaticRouter location={path}>{node}</StaticRouter>)
}

export function renderToolGuide(slug: string): string {
  const tool = toolBySlug(slug)
  if (!tool) throw new Error(`prerender: unknown tool slug "${slug}"`)
  return render(`/tool/${slug}`, <ToolGuide tool={tool} />)
}

/** The homepage's long-form "why private" section, rendered by the SPA below the catalog. */
export function renderHomeContent(): string {
  return render('/', <PrivacyContent />)
}

export function renderStaticPage(path: string): string {
  const page = STATIC_PAGES[path]
  if (!page) throw new Error(`prerender: no static page registered for "${path}"`)
  return render(path, page())
}

/** schema.org FAQPage for a tool, built from the same Q&A ToolGuide renders. */
export function toolFaqJsonLd(slug: string): object {
  const tool = toolBySlug(slug)
  if (!tool) throw new Error(`prerender: unknown tool slug "${slug}"`)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: toolFaqs(tool).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}
