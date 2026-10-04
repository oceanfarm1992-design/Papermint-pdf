/**
 * Static prerender for SEO.
 *
 * `vite build` emits a single dist/index.html whose <head> carries the HOMEPAGE
 * title/description/canonical and an empty <div id="root">. Any crawler that
 * does not execute JavaScript therefore sees the homepage's metadata — and a
 * canonical pointing at "/" — on every route, which tells search engines the
 * tool pages are duplicates of the homepage and should not be indexed.
 *
 * This runs after the build (npm "postbuild") and writes one real HTML file per
 * route carrying that route's own <title>, description, canonical, Open Graph /
 * Twitter tags, JSON-LD, and static content — tool headers plus the real
 * ToolGuide / static-page components rendered to markup. React still takes over
 * on load (createRoot replaces #root), so the app is unchanged for users.
 *
 * Output is flat (dist/tool/<slug>.html, dist/about.html, …) so Cloudflare's
 * default html_handling serves each file at its no-trailing-slash canonical URL.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')

// Load the real registry + site constants through Vite so TypeScript and the
// "@" alias resolve exactly as the app sees them. The run: () => import() thunks
// in the registry are never invoked, so no feature code executes here.
const vite = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})
let TOOLS, SITE_URL, renderToolGuide, renderStaticPage, renderHomeContent, toolFaqJsonLd
let seoName, toolSeoTitle, toolSeoDescription, GUIDES_TITLE, GUIDES_DESCRIPTION
let GUIDE_SLUGS, guideMeta, renderGuide, renderGuidesIndex, guideJsonLd
try {
  ;({ TOOLS } = await vite.ssrLoadModule('/src/data/tools.ts'))
  ;({ SITE_URL } = await vite.ssrLoadModule('/src/data/meta.ts'))
  // Real React components rendered to static markup — the same how-to, FAQ and
  // page copy users see, so crawlers get full content before any JS runs.
  ;({ seoName, toolSeoTitle, toolSeoDescription, GUIDES_TITLE, GUIDES_DESCRIPTION } =
    await vite.ssrLoadModule('/src/data/seo.ts'))
  ;({
    renderToolGuide,
    renderStaticPage,
    renderHomeContent,
    toolFaqJsonLd,
    GUIDE_SLUGS,
    guideMeta,
    renderGuide,
    renderGuidesIndex,
    guideJsonLd,
  } = await vite.ssrLoadModule(
    '/src/prerender/entry.tsx',
  ))
} finally {
  await vite.close()
}

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// ─── <head> rewriters (tolerant of the multi-line meta tags in index.html) ───
const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)

const setMeta = (html, attr, key, content) =>
  html.replace(
    new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[\\s\\S]*?(")`),
    `$1${esc(content)}$2`,
  )

const setDescription = (html, desc) =>
  html.replace(/(<meta\s+name="description"\s+content=")[\s\S]*?(")/, `$1${esc(desc)}$2`)

const setCanonical = (html, href) =>
  html.replace(/(<link\s+rel="canonical"\s+href=")[\s\S]*?(")/, `$1${esc(href)}$2`)

const injectJsonLd = (html, obj) =>
  html.replace(
    '</head>',
    `    <script type="application/ld+json">${JSON.stringify(obj)}</script>\n  </head>`,
  )

const setRootContent = (html, inner) =>
  html.replace('<div id="root"></div>', `<div id="root">${inner}</div>`)

function render({ title, description, path, jsonLd = [], skeleton }) {
  const url = `${SITE_URL}${path}`
  let html = setTitle(template, title)
  html = setDescription(html, description)
  html = setCanonical(html, url)
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', description)
  for (const obj of jsonLd) html = injectJsonLd(html, obj)
  if (skeleton) html = setRootContent(html, skeleton)
  return html
}

function writeRoute(path, html) {
  const file = join(dist, `${path.replace(/^\//, '')}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const PRIVACY_LINE =
  'Runs 100% in your browser — no uploads, no signup, your files never leave your device.'

// ─── Tool pages (mirror ToolPage.tsx useSeo + header markup) ───
let count = 0
for (const t of TOOLS) {
  const name = seoName(t)
  const title = toolSeoTitle(t)
  const description = toolSeoDescription(t)
  const path = `/tool/${t.slug}`
  const url = `${SITE_URL}${path}`
  const skeleton =
    `<div class="mx-auto max-w-3xl px-4 py-8">` +
    `<a href="/" class="text-sm text-neutral-500">← All tools</a>` +
    `<h1 class="mt-4 text-2xl font-bold tracking-tight">${esc(name)}</h1>` +
    `<p class="mt-1 text-neutral-500 dark:text-neutral-400">${esc(t.description)}</p>` +
    `<p class="mt-6 text-sm text-neutral-500 dark:text-neutral-400">${esc(PRIVACY_LINE)}</p>` +
    `</div>` +
    renderToolGuide(t.slug)
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description,
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  }
  writeRoute(path, render({ title, description, path, jsonLd: [softwareApp, breadcrumb, toolFaqJsonLd(t.slug)], skeleton }))
  count++
}

// ─── Static pages (keep titles/descriptions in sync with StaticPages.tsx) ───
const STATIC = [
  {
    path: '/about',
    title: 'About — Privacy PDF Tools',
    description:
      'Privacy PDF Tools runs every PDF operation locally in your browser using WebAssembly — no uploads, no backend, no tracking. Learn how and why.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — Privacy PDF Tools',
    description:
      'Our privacy policy: no uploads, no accounts, no tracking, no cookies. Your PDF files never leave your device — everything runs locally in your browser.',
  },
  {
    path: '/terms',
    title: 'Terms of Use — Privacy PDF Tools',
    description:
      'Terms of use for Privacy PDF Tools — free, provided as-is, MIT-licensed PDF tools that run entirely in your browser.',
  },
  {
    path: '/contact',
    title: 'Contact — Privacy PDF Tools',
    description:
      'Questions, bug reports or ideas about Privacy PDF Tools? Reach us by email — no forms, no accounts.',
  },
  {
    path: '/faq',
    title: 'FAQ — Privacy PDF Tools',
    description:
      'Answers about privacy, file size limits, OCR downloads, PDF encryption and mobile support for Privacy PDF Tools.',
  },
]
for (const s of STATIC) {
  const skeleton = renderStaticPage(s.path)
  writeRoute(s.path, render({ title: s.title, description: s.description, path: s.path, skeleton }))
  count++
}

// ─── Guides (/guides and /guides/<slug>) ───
writeRoute(
  '/guides',
  render({ title: GUIDES_TITLE, description: GUIDES_DESCRIPTION, path: '/guides', skeleton: renderGuidesIndex() }),
)
count++
for (const slug of GUIDE_SLUGS) {
  const path = `/guides/${slug}`
  const { title, description } = guideMeta(slug)
  writeRoute(path, render({ title, description, path, jsonLd: guideJsonLd(slug), skeleton: renderGuide(slug) }))
  count++
}

// ─── Homepage: enrich the existing dist/index.html with site-level JSON-LD and
// a crawlable list of every tool (internal links search engines can follow). ───
{
  const links = TOOLS.map((t) => `<li><a href="/tool/${t.slug}">${esc(seoName(t))}</a></li>`).join('')
  const skeleton =
    `<div class="mx-auto max-w-5xl px-4 py-8">` +
    `<h1 class="text-3xl font-bold tracking-tight">Free &amp; private PDF tools</h1>` +
    `<p class="mt-2 text-neutral-500 dark:text-neutral-400">Merge, split, compress, convert, edit, sign and OCR PDFs — 100% in your browser. No uploads, no accounts, no tracking.</p>` +
    `<nav aria-label="All tools" class="mt-6"><ul>${links}</ul></nav>` +
    `</div>` +
    renderHomeContent()
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Privacy PDF Tools',
    url: `${SITE_URL}/`,
  }
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Privacy PDF Tools',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/og.png`,
  }
  let html = injectJsonLd(template, website)
  html = injectJsonLd(html, organization)
  html = setRootContent(html, skeleton)
  writeFileSync(join(dist, 'index.html'), html)
}

console.log(`prerender: wrote ${count} route files + enriched homepage`)
