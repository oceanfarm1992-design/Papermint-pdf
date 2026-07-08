import { useEffect } from 'react'
import { SITE_URL } from '@/data/meta'

/**
 * Per-route document metadata for this SPA.
 *
 * index.html ships static <title>/description/canonical/OG tags as the baseline
 * (what non-JS crawlers and social scrapers see first). This hook updates them
 * imperatively on navigation so every route reports its OWN canonical URL and
 * description — rather than every tool page inheriting the homepage canonical,
 * which would tell Google not to index them separately.
 *
 * Tags are updated in place (never duplicated): there must be exactly one
 * <link rel="canonical"> and one <meta name="description"> per page.
 */
interface Seo {
  /** Full document <title>. */
  title: string
  /** Meta description — aim for <=160 characters. */
  description?: string
  /** Path only (e.g. '/tool/merge-pdf' or '/'); becomes the canonical + og:url. */
  path?: string
  /** Adds <meta name="robots" content="noindex,follow"> (e.g. for 404s). */
  noindex?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

export function useSeo({ title, description, path, noindex }: Seo): void {
  useEffect(() => {
    document.title = title
    upsertMeta('property', 'og:title', title)
    upsertMeta('name', 'twitter:title', title)

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }

    if (path) {
      const url = `${SITE_URL}${path}`
      upsertCanonical(url)
      upsertMeta('property', 'og:url', url)
    }

    // Explicit each time so navigating away from a noindex page restores indexing.
    upsertMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow')
  }, [title, description, path, noindex])
}

/**
 * Inject a JSON-LD structured-data block into <head> for the current route.
 * Uses textContent (not innerHTML) so it is never an HTML injection sink.
 * Pass a stable object (defined at module scope) to avoid re-injecting.
 */
export function useJsonLd(data: object): void {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => script.remove()
  }, [data])
}
