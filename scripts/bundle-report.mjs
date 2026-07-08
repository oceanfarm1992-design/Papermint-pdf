/**
 * Bundle analyzer for CI.
 *
 * Walks the dist/ folder, measures raw + gzip size per file, categorizes
 * assets (JS / CSS / WASM / images / fonts / HTML), figures out which assets
 * are part of the initial load (referenced from index.html), and optionally
 * compares against a baseline JSON produced by a previous run.
 *
 * Usage:
 *   node scripts/bundle-report.mjs [--dist dist] [--out report.json]
 *                                  [--baseline base.json] [--md report.md]
 *
 * Environment (quality gates, gzip KB):
 *   BUNDLE_MAX_INCREASE_KB   max allowed total gzip growth vs baseline (default 25)
 *   BUNDLE_MAX_INITIAL_KB    max allowed initial-load gzip size        (default 300)
 *   BUNDLE_FAIL_ON_THRESHOLD set to "1" to exit non-zero when a gate trips
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const DIST = opt('dist', 'dist')
const OUT = opt('out', 'bundle-report.json')
const BASELINE = opt('baseline', null)
const MD = opt('md', null)

const MAX_INCREASE_KB = Number(process.env.BUNDLE_MAX_INCREASE_KB ?? 25)
const MAX_INITIAL_KB = Number(process.env.BUNDLE_MAX_INITIAL_KB ?? 300)
const FAIL = process.env.BUNDLE_FAIL_ON_THRESHOLD === '1'

const CATEGORY_BY_EXT = {
  '.js': 'js', '.mjs': 'js', '.cjs': 'js',
  '.css': 'css',
  '.wasm': 'wasm',
  '.png': 'images', '.jpg': 'images', '.jpeg': 'images', '.webp': 'images',
  '.gif': 'images', '.svg': 'images', '.avif': 'images', '.ico': 'images',
  '.woff': 'fonts', '.woff2': 'fonts', '.ttf': 'fonts', '.otf': 'fonts', '.eot': 'fonts',
  '.html': 'html',
  '.map': 'sourcemaps',
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

if (!existsSync(DIST)) {
  console.error(`dist folder "${DIST}" not found — run the build first.`)
  process.exit(2)
}

// Assets referenced by index.html form the critical initial load.
const indexHtml = existsSync(join(DIST, 'index.html'))
  ? readFileSync(join(DIST, 'index.html'), 'utf8')
  : ''
const initialRefs = new Set(
  [...indexHtml.matchAll(/(?:src|href)="\/?([^"]+\.(?:js|css))"/g)].map((m) => m[1].replace(/^\//, '')),
)

const files = walk(DIST)
  .filter((f) => !f.endsWith('stats.html'))
  .map((full) => {
    const path = relative(DIST, full).replaceAll('\\', '/')
    const buf = readFileSync(full)
    const category = CATEGORY_BY_EXT[extname(path).toLowerCase()] ?? 'other'
    return {
      path,
      category,
      raw: statSync(full).size,
      gzip: category === 'images' || category === 'fonts' ? buf.length : gzipSync(buf, { level: 9 }).length,
      initial: initialRefs.has(path) || path === 'index.html',
    }
  })
  .sort((a, b) => b.gzip - a.gzip)

const sum = (list, key) => list.reduce((acc, f) => acc + f[key], 0)
const categories = {}
for (const f of files) {
  categories[f.category] ??= { raw: 0, gzip: 0, count: 0 }
  categories[f.category].raw += f.raw
  categories[f.category].gzip += f.gzip
  categories[f.category].count++
}

const report = {
  generatedAt: new Date().toISOString(),
  total: { raw: sum(files, 'raw'), gzip: sum(files, 'gzip'), count: files.length },
  initial: {
    raw: sum(files.filter((f) => f.initial), 'raw'),
    gzip: sum(files.filter((f) => f.initial), 'gzip'),
  },
  lazy: {
    gzip: sum(files.filter((f) => !f.initial && f.category === 'js'), 'gzip'),
  },
  categories,
  files,
}
writeFileSync(OUT, JSON.stringify(report, null, 2))

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const delta = (cur, base) => {
  const d = cur - base
  const sign = d > 0 ? '+' : ''
  const pct = base > 0 ? ` (${sign}${((d / base) * 100).toFixed(1)}%)` : ''
  return `${sign}${kb(d)}${pct}`
}

let baseline = null
if (BASELINE && existsSync(BASELINE)) baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))

const lines = []
lines.push('## 📦 Bundle analysis', '')
lines.push('| Metric | Size (gzip) | Raw |' + (baseline ? ' Change (gzip) |' : ''))
lines.push('|---|---|---|' + (baseline ? '---|' : ''))
const row = (label, cur, curRaw, base) =>
  `| ${label} | ${kb(cur)} | ${kb(curRaw)} |` + (baseline ? ` ${base != null ? delta(cur, base) : 'n/a'} |` : '')
lines.push(row('**Total**', report.total.gzip, report.total.raw, baseline?.total?.gzip))
lines.push(row('Initial load', report.initial.gzip, report.initial.raw, baseline?.initial?.gzip))
for (const [cat, v] of Object.entries(categories)) {
  lines.push(row(cat.toUpperCase(), v.gzip, v.raw, baseline?.categories?.[cat]?.gzip ?? 0))
}
lines.push('', '<details><summary>Largest 15 assets (gzip)</summary>', '', '| Asset | Category | Gzip | Raw |', '|---|---|---|---|')
for (const f of files.slice(0, 15)) {
  lines.push(`| \`${f.path}\` | ${f.category} | ${kb(f.gzip)} | ${kb(f.raw)} |`)
}
lines.push('', '</details>')

const gates = []
if (baseline) {
  const growthKb = (report.total.gzip - baseline.total.gzip) / 1024
  const changed = []
  const baseByPath = new Map(baseline.files.map((f) => [f.path.replace(/-[\w-]{8,}\./, '-*.'), f]))
  for (const f of files) {
    const norm = f.path.replace(/-[\w-]{8,}\./, '-*.')
    const b = baseByPath.get(norm)
    if (!b) changed.push(`| \`${norm}\` | added | ${kb(f.gzip)} |`)
    else if (Math.abs(f.gzip - b.gzip) > 1024) changed.push(`| \`${norm}\` | ${delta(f.gzip, b.gzip)} | ${kb(f.gzip)} |`)
  }
  for (const [norm, b] of baseByPath) {
    if (!files.some((f) => f.path.replace(/-[\w-]{8,}\./, '-*.') === norm))
      changed.push(`| \`${norm}\` | removed | −${kb(b.gzip)} |`)
  }
  if (changed.length > 0) {
    lines.push('', '<details><summary>Changed chunks (>1 KB gzip)</summary>', '', '| Chunk | Change | Size |', '|---|---|---|', ...changed, '', '</details>')
  }
  if (growthKb > MAX_INCREASE_KB) {
    gates.push(`Total gzip size grew by ${growthKb.toFixed(1)} KB — over the ${MAX_INCREASE_KB} KB budget.`)
  }
}
if (report.initial.gzip / 1024 > MAX_INITIAL_KB) {
  gates.push(`Initial load is ${kb(report.initial.gzip)} gzip — over the ${MAX_INITIAL_KB} KB budget.`)
}

if (gates.length > 0) {
  lines.push('', '### ⚠️ Budget check failed', '', ...gates.map((g) => `- ${g}`))
} else {
  lines.push('', baseline ? '✅ Within bundle budgets.' : 'ℹ️ No baseline provided — sizes recorded only.')
}

const md = lines.join('\n')
if (MD) writeFileSync(MD, md)
console.log(md)

if (gates.length > 0 && FAIL) process.exit(1)
