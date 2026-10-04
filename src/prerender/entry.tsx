/**
 * Build-time only: loaded by scripts/prerender.mjs through Vite's SSR loader
 * (never imported by the app). Renders the same React components the SPA shows,
 * so the static HTML crawlers read matches what users see after hydration.
 */
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import GuideArticle, { GuidesList } from '@/components/GuideArticle'
import PrivacyContent from '@/components/PrivacyContent'
import ToolGuide from '@/components/ToolGuide'
import { toolFaqs } from '@/data/content'
import { GUIDES, guideBySlug } from '@/data/guides'
import { SITE_URL } from '@/data/meta'
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

export const GUIDE_SLUGS: string[] = GUIDES.map((g) => g.slug)

export function guideMeta(slug: string): { title: string; description: string } {
  const guide = guideBySlug(slug)
  if (!guide) throw new Error(`prerender: unknown guide "${slug}"`)
  return { title: guide.title, description: guide.description }
}

export function renderGuide(slug: string): string {
  const guide = guideBySlug(slug)
  if (!guide) throw new Error(`prerender: unknown guide "${slug}"`)
  return render(`/guides/${slug}`, <GuideArticle guide={guide} />)
}

export function renderGuidesIndex(): string {
  return render('/guides', <GuidesList />)
}

/** schema.org Article (+ FAQPage when the guide has FAQs) for a guide. */
export function guideJsonLd(slug: string): object[] {
  const guide = guideBySlug(slug)
  if (!guide) throw new Error(`prerender: unknown guide "${slug}"`)
  const url = `${SITE_URL}/guides/${slug}`
  const publisher = { '@type': 'Organization', name: 'Privacy PDF Tools', url: `${SITE_URL}/` }
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    url,
    mainEntityOfPage: url,
    dateModified: guide.updated,
    datePublished: guide.updated,
    author: publisher,
    publisher,
    image: `${SITE_URL}/og.png`,
  }
  if (guide.faqs.length === 0) return [article]
  return [
    article,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
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
