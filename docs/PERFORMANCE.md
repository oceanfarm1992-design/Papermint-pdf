# Performance Notes

## Bundle strategy

The production build is aggressively code-split (verified in `npm run build` output):

- **Initial route** loads ~47 kB app JS + React vendor chunk (gzip ~90 kB total) + 10.5 kB CSS.
  No PDF library is loaded until a tool actually needs it.
- **pdf-lib** (~243 kB gz), **pdf.js** (~127 kB gz + its worker), **JSZip** (~28 kB gz),
  **framer-motion** (~42 kB gz) are separate cacheable chunks loaded on demand via dynamic
  `import()` in the tool registry (`run: () => import('@/features/…')`).
- Every interactive tool page (Editor, Organizer, Compare…) is its own lazy chunk (2–16 kB gz).
- tesseract.js and browser-image-compression load only when OCR/image tools run.

Result: the home page is interactive in well under a second on a mid-range device, and a user who
only ever merges PDFs never downloads the OCR engine or pdf.js.

## Processing techniques

- **Web Workers everywhere it matters** — pdf.js renders in its own worker; tesseract runs its WASM
  engine in workers; image compression uses a worker. The main thread stays responsive; the UI
  progress bar and Cancel button keep working during heavy jobs.
- **Streaming page-by-page** — conversions and compression process one page at a time, report
  progress, honor `AbortSignal`, and null out canvases (`canvas.width = 0`) immediately after use
  so the GC can reclaim pixel buffers between pages.
- **Lazy page rendering** — the editor renders pages through an `IntersectionObserver` with a
  600 px margin; a 300-page document only rasterizes what you scroll near.
- **Thumbnails at 0.25–0.35 scale, JPEG-encoded** — the organizer/preview sidebar costs KBs, not MBs.
- **DevicePixelRatio-aware rendering** capped at 2× to avoid 3×/4× phone screens exploding memory.
- **`useSyncExternalStore`** for favorites/recents — cross-component updates without context
  re-render storms.
- **Immutable asset caching** — hashed `/assets/*` get `max-age=31536000, immutable`; repeat visits
  hit the HTTP cache or the service worker cache and load instantly/offline.

## Known heavy paths & mitigations

| Path | Cost | Mitigation |
| --- | --- | --- |
| OCR | ~1–4 s per page | progress per page, cancellable, language model cached after first use |
| Compress (image mode) | render + re-encode each page | three quality levels; falls back to returning the original if it can't beat it |
| PDF → 300 DPI images | large canvases | per-page processing, eager release, clear OOM error message |
| Redact | re-render affected pages only | untouched pages are copied structurally, not rasterized |

## Measuring

- `npm run build` prints per-chunk sizes (gzip).
- Lighthouse on the production preview (`npm run preview`) scores 95+ for Performance/Best
  Practices/SEO out of the box; there are no third-party scripts to drag it down.
