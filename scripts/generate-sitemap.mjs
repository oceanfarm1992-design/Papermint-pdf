/**
 * Generates public/sitemap.xml from the tool registry.
 * Runs automatically before `vite build` (see the "prebuild" script).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Single source of truth for the canonical origin is SITE_URL in src/data/meta.ts.
// Read it without executing TS so this script stays dependency-free.
const meta = readFileSync(join(root, 'src', 'data', 'meta.ts'), 'utf8')
const SITE = /SITE_URL\s*=\s*'([^']+)'/.exec(meta)?.[1] ?? 'https://privacypdftools.com'

// Extract slugs from the registry without executing TS: match `slug: '...'`
const source = readFileSync(join(root, 'src', 'data', 'tools.ts'), 'utf8')
const slugs = [...source.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1])

const staticPages = ['', 'about', 'privacy', 'terms', 'contact', 'faq', 'guides']

// Guide slugs, read from the guide data files without executing TS
const guideDir = join(root, 'src', 'data', 'guides')
const guideSlugs = readdirSync(guideDir)
  .filter((f) => f.endsWith('.ts'))
  .flatMap((f) =>
    [...readFileSync(join(guideDir, f), 'utf8').matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]),
  )
// lastmod = date of the last commit, not the build date: rebuilding without
// changes must not tell crawlers every page changed (Google ignores lastmod
// values that are always "today"). Falls back to today outside a git checkout.
function lastCommitDate() {
  try {
    const d = execSync('git log -1 --format=%cs', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
  } catch {
    return null
  }
}
const lastmod = lastCommitDate() ?? new Date().toISOString().slice(0, 10)

const urls = [
  ...staticPages.map((p) => `${SITE}/${p}`),
  ...slugs.map((s) => `${SITE}/tool/${s}`),
  ...guideSlugs.map((s) => `${SITE}/guides/${s}`),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml written with ${urls.length} URLs`)
