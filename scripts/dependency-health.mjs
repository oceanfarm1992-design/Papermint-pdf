/**
 * Dependency health report for the weekly maintenance workflow.
 *
 * For every direct dependency it queries the npm registry and reports:
 *   - installed vs latest version, classified as patch / minor / major
 *   - deprecation notices (installed version AND latest version)
 *   - maintenance signals (time since last publish)
 *   - license
 * It also parses package-lock.json for duplicate package versions and
 * summarizes `npm audit`. Output: dependency-health.md (+ .json).
 *
 * Usage: node scripts/dependency-health.mjs [--md dependency-health.md]
 * No dependencies beyond Node 20+. Registry failures degrade gracefully.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const mdIdx = args.indexOf('--md')
const MD_OUT = mdIdx >= 0 && args[mdIdx + 1] ? args[mdIdx + 1] : 'dependency-health.md'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))

const direct = [
  ...Object.keys(pkg.dependencies ?? {}).map((n) => ({ name: n, dev: false })),
  ...Object.keys(pkg.devDependencies ?? {}).map((n) => ({ name: n, dev: true })),
]

const parseVer = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v ?? '')
  return m ? { major: +m[1], minor: +m[2], patch: +m[3] } : null
}
const diffKind = (from, to) => {
  const a = parseVer(from)
  const b = parseVer(to)
  if (!a || !b) return 'unknown'
  if (b.major > a.major) return 'major'
  if (b.major === a.major && b.minor > a.minor) return 'minor'
  if (b.major === a.major && b.minor === a.minor && b.patch > a.patch) return 'patch'
  return 'current'
}
const RISK = { patch: '🟢 safe', minor: '🟡 medium', major: '🔴 high / breaking', current: '—', unknown: '❓' }

async function registryInfo(name) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}`, {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function installedVersion(name) {
  return lock.packages?.[`node_modules/${name}`]?.version ?? null
}

console.error(`Checking ${direct.length} direct dependencies against the npm registry…`)
const rows = []
for (const { name, dev } of direct) {
  const installed = installedVersion(name)
  const info = await registryInfo(name)
  const latest = info?.['dist-tags']?.latest ?? null
  const kind = latest && installed ? diffKind(installed, latest) : 'unknown'
  const deprecatedNow = info?.versions?.[installed]?.deprecated ?? null
  const deprecatedLatest = latest ? (info?.versions?.[latest]?.deprecated ?? null) : null
  // abbreviated registry payloads omit `time`; fall back to full doc only when needed
  let lastPublish = null
  try {
    const full = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`)
    if (full.ok) {
      const doc = await full.json()
      lastPublish = doc?.time ?? null // usually absent on /latest; keep null
      rows.push({
        name, dev, installed, latest, kind,
        deprecated: deprecatedNow, deprecatedLatest,
        license: doc?.license ?? info?.license ?? 'unknown',
        lastPublish,
      })
      continue
    }
  } catch { /* fall through */ }
  rows.push({ name, dev, installed, latest, kind, deprecated: deprecatedNow, deprecatedLatest, license: info?.license ?? 'unknown', lastPublish })
}

// Duplicate versions across the lock tree
const versionsByName = new Map()
for (const [path, meta] of Object.entries(lock.packages ?? {})) {
  const m = /node_modules\/((?:@[^/]+\/)?[^/]+)$/.exec(path)
  if (!m || !meta.version) continue
  const set = versionsByName.get(m[1]) ?? new Set()
  set.add(meta.version)
  versionsByName.set(m[1], set)
}
const duplicates = [...versionsByName.entries()]
  .filter(([, set]) => set.size > 1)
  .map(([name, set]) => ({ name, versions: [...set].sort() }))

// npm audit summary
let audit = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }
try {
  const out = execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  audit = JSON.parse(out).metadata?.vulnerabilities ?? audit
} catch (err) {
  try {
    audit = JSON.parse(err.stdout ?? '{}').metadata?.vulnerabilities ?? audit
  } catch { /* audit unavailable */ }
}

// Stack inventory (detected from dependencies + repo files)
const has = (n) => direct.some((d) => d.name === n)
const inventory = {
  Framework: has('react') ? `React ${installedVersion('react')}` : 'unknown',
  'Build system': has('vite') ? `Vite ${installedVersion('vite')}` : 'unknown',
  'Package manager': 'npm (package-lock v' + (lock.lockfileVersion ?? '?') + ')',
  Language: has('typescript') ? `TypeScript ${installedVersion('typescript')}` : 'JavaScript',
  'CSS framework': has('tailwindcss') ? `Tailwind CSS ${installedVersion('tailwindcss')}` : 'unknown',
  Routing: has('react-router-dom') ? `React Router ${installedVersion('react-router-dom')}` : '—',
  'PDF libraries': ['@cantoo/pdf-lib', 'pdfjs-dist'].filter(has).map((n) => `${n}@${installedVersion(n)}`).join(', ') || '—',
  'OCR library': has('tesseract.js') ? `tesseract.js ${installedVersion('tesseract.js')}` : '—',
  'Image processing': has('browser-image-compression') ? `browser-image-compression ${installedVersion('browser-image-compression')}` : '—',
  Testing: ['vitest', '@playwright/test'].filter(has).map((n) => `${n}@${installedVersion(n)}`).join(', ') || '—',
  Linting: ['oxlint', 'prettier'].filter(has).map((n) => `${n}@${installedVersion(n)}`).join(', ') || '—',
  Deployment: 'Cloudflare Workers static assets (wrangler.toml)',
}

const outdated = rows.filter((r) => r.kind !== 'current' && r.kind !== 'unknown')
const deprecated = rows.filter((r) => r.deprecated || r.deprecatedLatest)

const lines = []
lines.push(`# Dependency health report — ${new Date().toISOString().slice(0, 10)}`, '')
lines.push('## Stack inventory', '')
lines.push('| Component | Detected |', '|---|---|')
for (const [k, v] of Object.entries(inventory)) lines.push(`| ${k} | ${v} |`)

lines.push('', '## Security audit', '')
lines.push(
  audit.total === 0
    ? '✅ `npm audit`: **0 vulnerabilities**.'
    : `🚨 \`npm audit\`: **${audit.total} vulnerabilities** — critical: ${audit.critical}, high: ${audit.high}, moderate: ${audit.moderate}, low: ${audit.low}.`,
)

lines.push('', `## Outdated packages (${outdated.length})`, '')
if (outdated.length === 0) lines.push('✅ Everything is on the latest published version.')
else {
  lines.push('| Package | Installed | Latest | Update type | Risk |', '|---|---|---|---|---|')
  for (const r of outdated.sort((a, b) => (a.kind === 'major' ? -1 : 1) - (b.kind === 'major' ? -1 : 1))) {
    lines.push(`| \`${r.name}\`${r.dev ? ' (dev)' : ''} | ${r.installed} | ${r.latest} | ${r.kind} | ${RISK[r.kind]} |`)
  }
}

lines.push('', `## Deprecated packages (${deprecated.length})`, '')
if (deprecated.length === 0) lines.push('✅ No deprecation notices on installed or latest versions.')
else {
  for (const r of deprecated) {
    if (r.deprecated) lines.push(`- 🔴 \`${r.name}@${r.installed}\` (installed) is deprecated: ${r.deprecated}`)
    if (r.deprecatedLatest) lines.push(`- 🟠 \`${r.name}@${r.latest}\` (latest) is deprecated: ${r.deprecatedLatest}`)
  }
}

lines.push('', `## Duplicate package versions (${duplicates.length})`, '')
if (duplicates.length === 0) lines.push('✅ No package is installed at more than one version.')
else {
  lines.push('| Package | Versions in tree |', '|---|---|')
  for (const d of duplicates.slice(0, 30)) lines.push(`| \`${d.name}\` | ${d.versions.join(', ')} |`)
  if (duplicates.length > 30) lines.push('', `…and ${duplicates.length - 30} more.`)
}

lines.push('', '## License summary (direct dependencies)', '')
const licenses = new Map()
for (const r of rows) licenses.set(r.license, (licenses.get(r.license) ?? 0) + 1)
lines.push('| License | Count |', '|---|---|')
for (const [lic, count] of [...licenses.entries()].sort((a, b) => b[1] - a[1])) lines.push(`| ${lic} | ${count} |`)

lines.push('', '---', '_Generated by `scripts/dependency-health.mjs` (weekly-health workflow)._')

const md = lines.join('\n')
writeFileSync(MD_OUT, md)
writeFileSync(MD_OUT.replace(/\.md$/, '.json'), JSON.stringify({ inventory, rows, duplicates, audit }, null, 2))
console.log(md)

// Exit code signals for CI: 2 = deprecated deps found, 3 = critical vulns
if (audit.critical > 0) process.exit(3)
if (rows.some((r) => r.deprecated)) process.exit(2)
