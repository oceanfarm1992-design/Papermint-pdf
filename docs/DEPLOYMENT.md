# Deployment Guide — Cloudflare Pages

The build output (`dist/`) is plain static files. Any static host works; Cloudflare Pages is the
first-class target.

## One-time setup (dashboard)

1. Push this repository to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Settings:
   - **Framework preset:** None (or Vite)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20+ (set `NODE_VERSION=20` env var if needed)
4. Deploy. Every push to the production branch builds and deploys automatically; other branches
   get preview URLs.

## CLI deployment (wrangler)

```bash
npm run build
npx wrangler pages deploy dist          # first run: creates the Pages project
# or simply:
npm run deploy
```

`wrangler.toml` already declares `pages_build_output_dir = "dist"` and a compatibility date.
No Workers code is required — but the project is fully compatible with Cloudflare Workers static
assets hosting too (`npx wrangler deploy` with an assets binding) if you prefer that model.

## What the repo provides out of the box

| File | Purpose |
| --- | --- |
| `public/_redirects` | SPA fallback: `/* /index.html 200` so `/tool/merge-pdf` deep links work |
| `public/_headers` | Security headers + cache policy (below) |
| `public/robots.txt` | Allows crawling, points at the sitemap |
| `public/sitemap.xml` | Regenerated on every build from the tool registry (`scripts/generate-sitemap.mjs`) |
| `public/manifest.webmanifest` + `public/sw.js` | Installable PWA + offline app shell |
| `public/og.png` | Social preview image |

## Cache strategy

| Asset | Policy | Why |
| --- | --- | --- |
| `/assets/*` (hashed JS/CSS/worker) | `public, max-age=31536000, immutable` | filenames change on every build |
| `/index.html` | `max-age=0, must-revalidate` | so new deploys are picked up immediately |
| `/icons/*` | 7 days | rarely change, not hashed |
| Service worker | network-first for navigations, cache-first for `/assets/*` | instant repeat loads + full offline |

After a deploy, clients get fresh HTML on next navigation, which references new hashed assets;
the SW cache cleans old entries on activation.

## Custom domain & production checklist

1. Pages project → Custom domains → add your domain (Cloudflare manages the cert).
2. Update the canonical URL in `index.html`, `SITE` in `scripts/generate-sitemap.mjs`,
   `public/robots.txt` and `src/data/meta.ts` to the final domain.
3. Optionally set the GitHub link in `src/components/layout/Layout.tsx` to your repo.
4. Verify security headers with `curl -I https://yourdomain/` after deploy.
