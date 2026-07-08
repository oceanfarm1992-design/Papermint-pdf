# Privacy PDF Tools — CI/CD & Automation Platform

This document describes every automated workflow in the repository: what it
does, when it runs, which quality gates it enforces, and how to operate it.

## Design principles

1. **Nothing merges to `main` without passing every required gate.** All
   changes — human or bot — go through pull requests.
2. **Dependency updates are automated but never auto-merged.** Renovate opens
   grouped, risk-labelled PRs; the full pipeline validates them; a human
   merges.
3. **Every workflow degrades gracefully.** Jobs that need secrets
   (`ANTHROPIC_API_KEY`, Cloudflare tokens) self-skip with a notice instead of
   failing when the secret is absent.
4. **The privacy promise is tested, not just stated.** The E2E merge test
   fails if any external network request happens during PDF processing.

## Workflow inventory

| Workflow | File | Triggers | Blocking? |
|---|---|---|---|
| CI | `ci.yml` | PR, push to main | ✅ required |
| Security | `security.yml` | PR, push, weekly Mon 05:00 UTC | ✅ required |
| CodeQL | `codeql.yml` | PR, push, weekly Mon 05:30 UTC | ✅ required |
| E2E | `e2e.yml` | PR, push to main | ✅ required |
| Lighthouse | `lighthouse.yml` | PR | ✅ required |
| AI Review | `ai-review.yml` | PR opened/updated | advisory |
| Deploy | `deploy.yml` | PR (preview), push to main (prod) | prod only |
| Weekly Health | `weekly-health.yml` | Mon 06:00 UTC | report |
| Monthly Architecture | `monthly-architecture.yml` | 1st of month | report |

## The PR pipeline, step by step

Every pull request runs, in parallel:

### CI — `ci.yml`

**Job `checks`** (the core quality gate):

1. `npm ci` — install; fails if `package-lock.json` is out of sync.
2. `git diff --exit-code package-lock.json package.json` — no lockfile drift.
3. `lockfile-lint` — every lockfile URL must be https and point at the npm
   registry (supply-chain tamper check).
4. `npm ls --all` — peer-dependency conflicts and invalid/extraneous packages.
5. `tsc -b` — TypeScript strict compilation. Type errors block.
6. `oxlint` — lint errors block.
7. `prettier --check` — formatting issues block.
8. `vitest run --coverage` — unit tests block; coverage uploaded as artifact.

**Job `bundle`** (bundle-size gate):

- Builds the PR **and** its merge-base, measures both with
  `scripts/bundle-report.mjs` (raw + gzip per file, per category, initial
  load vs lazy chunks), and posts a sticky PR comment with the comparison.
- Budgets (env vars in the workflow): total gzip growth ≤ **25 KB**, initial
  load ≤ **300 KB** gzip. Exceeding either **fails the job**, flagging the PR.
- A module-level treemap (`dist/stats.html`, from rollup-plugin-visualizer)
  is attached as the `bundle-analysis` artifact — use it to find duplicate
  libraries and tree-shaking failures.

**Job `docs-lint`**: markdownlint on all markdown (config:
`.markdownlint.jsonc`).

### Security — `security.yml`

| Job | Tool | Gate |
|---|---|---|
| `npm-audit` | npm audit | fails on high/critical in **production** deps |
| `osv-scan` | OSV-Scanner (Docker) | fails on known CVEs in the lockfile |
| `trivy` | Trivy fs scan | fails on CRITICAL/HIGH vulns or embedded secrets |
| `gitleaks` | Gitleaks | fails on committed secrets (full history) |
| `dependency-review` | GitHub dependency-review | PR-only: fails on moderate+ vulns in **newly added** deps; denies GPL/AGPL/SSPL licenses |

On **scheduled** runs, any failure automatically opens a GitHub issue labelled
`security, priority-critical`.

### CodeQL — `codeql.yml`

GitHub's semantic static analysis (`security-and-quality` query pack) over
`src/`, `scripts/`, and `public/` — catches XSS sinks, prototype pollution,
weak crypto usage, and unsafe API patterns. Results appear under
**Security → Code scanning**.

### E2E — `e2e.yml`

Playwright against the **production build** (`vite preview`), in a matrix:

- **Chromium** — desktop + mobile (Pixel 7) viewports, plus the memory canary
- **Firefox** — desktop
- **WebKit** — desktop + mobile Safari (iPhone 14)

Test suites (in `e2e/`):

- `smoke.spec.ts` — app shell, routing, theme toggle, and a **real PDF merge**
  through the UI ending in a verified download. This test also records every
  network request and **fails if any non-localhost origin is contacted** —
  the zero-upload promise is a hard assertion.
- `a11y.spec.ts` — axe-core WCAG 2.1 AA scans of five routes; serious or
  critical violations block.
- `memory.spec.ts` — Chromium-only canary: merges two 120-page PDFs and
  asserts the JS heap stays under 1 GB and the UI remains responsive.

### Lighthouse — `lighthouse.yml`

Lighthouse CI (3 runs, desktop preset) against `/`, `/tool/merge-pdf`, and
`/tool/compress-pdf`. Gates (see `lighthouserc.json`):

- Performance ≥ 0.85, Accessibility ≥ 0.95, Best Practices ≥ 0.90, SEO ≥ 0.90
  (**errors** — block).
- FCP ≤ 2 s, LCP ≤ 3 s, TBT ≤ 300 ms, TTI ≤ 4 s (**warnings** — reported).

HTML reports are uploaded as artifacts and to Lighthouse temporary public
storage (links in the step log).

### AI Review — `ai-review.yml` (requires `ANTHROPIC_API_KEY`)

- **Every PR:** Claude reviews the diff for correctness, security,
  accessibility, performance, and violations of project invariants (no
  uploads, bundle discipline, pdf.js/pdf-lib gotchas), posts inline comments
  and an APPROVE / NEEDS CHANGES summary.
- **Renovate/Dependabot PRs additionally get a dependency-quality review:**
  changelog digest, breaking changes, security advisories, maintenance
  health, license changes, and concrete migration steps, ending in a
  MERGE AFTER CI / NEEDS MIGRATION WORK / DO NOT MERGE verdict.

### Deploy — `deploy.yml` (requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`)

- **PRs** get a preview via `wrangler versions upload`; the preview URL is
  posted as a sticky comment.
- **Pushes to main** run `wrangler deploy` (Workers static assets, per
  `wrangler.toml`). A failed production deploy opens a
  `deployment, priority-critical` issue automatically.

> ⚠️ If Cloudflare **Workers Builds** is already connected to this repo (it
> deploys on git push), do **not** set the Cloudflare secrets here — you would
> deploy twice. Pick one deployment path.

## Scheduled maintenance

### Weekly Health — Mondays 06:00 UTC

`scripts/dependency-health.mjs` queries the npm registry for every direct
dependency and reports:

- stack inventory (framework, build system, PDF/OCR/image libs, deployment)
- outdated packages classified **patch 🟢 / minor 🟡 / major 🔴**
- deprecation notices on installed *and* latest versions
- duplicate package versions in the lock tree
- `npm audit` summary and a license table
- a fresh bundle-size snapshot (history kept as 90-day artifacts)

The report is published as a job summary, an artifact, and a GitHub issue
labelled `maintenance, report`.

### Monthly Architecture Review — 1st of each month

Claude reads the repository, builds it, and writes an architectural
assessment (tech debt ranked by cost, scalability of the tool registry,
performance bottlenecks, bundle strategy, dependency consolidation, top-5
refactorings with effort estimates) — opened as an issue labelled
`architecture, report`.

## Dependency update policy (Renovate)

Configuration: `renovate.json`. Renovate must be installed on the repo
(GitHub App: <https://github.com/apps/renovate>). Policy:

- **Schedule:** Mondays before 08:00 (Asia/Colombo); security fixes anytime.
- **Grouping:** react ecosystem · pdf & document libraries · ocr & image ·
  ui libraries · build tools · testing libraries · dev tooling. Never one
  giant PR.
- **Risk labels:** majors are always solo PRs labelled
  `major-update, breaking-risk`; `pdfjs-dist` majors additionally wait
  14 days after release (its majors have broken worker/API contracts before).
- **Stability:** non-security updates wait 3 days after publish
  (`minimumReleaseAge`) to dodge bad releases and supply-chain attacks.
- **No automerge, ever.** Every Renovate PR runs the full pipeline plus the
  AI dependency review; a human merges.
- **Lockfile maintenance** monthly; the Dependency Dashboard issue lists
  everything pending.

## Required setup (one-time, repo admin)

1. **Branch protection** on `main` (Settings → Branches → Add rule):
   - Require a pull request before merging.
   - Require status checks: `Lint, typecheck & unit tests`,
     `Bundle analysis & budget`, `npm audit (prod, high+)`, `OSV Scanner`,
     `Trivy (vulns + secrets)`, `Secret scanning (gitleaks)`,
     `Analyze (javascript-typescript)`, `Chromium (desktop + mobile)`,
     `Firefox`, `WebKit (desktop + mobile Safari)`, `Lighthouse CI`.
   - Require branches to be up to date before merging.
2. **Install the Renovate GitHub App** and grant it this repository.
3. **Secrets** (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY` — enables AI review + monthly architecture review.
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — enables deploy/preview
     (skip if Workers Builds already deploys this repo).
4. **Enable code scanning** (Settings → Security) so CodeQL results surface.

## Local equivalents

| CI gate | Local command |
|---|---|
| typecheck | `npm run typecheck` |
| lint | `npm run lint` |
| format | `npm run format:check` |
| unit tests | `npm test` (coverage: `npm run test:coverage`) |
| bundle report | `npm run analyze && npm run bundle:report` |
| e2e | `npm run build && npm run e2e` (first time: `npx playwright install`) |
| dependency health | `npm run deps:health` |

## Tuning the gates

- **Bundle budgets:** `BUNDLE_MAX_INCREASE_KB` / `BUNDLE_MAX_INITIAL_KB` in
  `ci.yml` (`bundle` job).
- **Performance budgets:** `lighthouserc.json` assertions.
- **Audit severity:** `--audit-level` in `security.yml`.
- **License policy:** `deny-licenses` in `security.yml`.
- **Renovate cadence/groups:** `renovate.json`.
