# 🍃 Privacy PDF Tools

**Every PDF tool you need. Zero uploads.**

Privacy PDF Tools is a complete, production-ready PDF toolkit that runs **entirely in the browser**.
50+ tools — merge, split, compress, convert, edit, sign, OCR, redact and more — with **no backend,
no accounts, no tracking and no cookies**. Files never leave the user's device.

> 🔒 Your files never leave your device. Everything is processed locally inside your browser.

Live at **[privacypdftools.com](https://privacypdftools.com)**.

## Features

| Category | Tools |
| --- | --- |
| **Organize** | Merge, Split (ranges / every N / single pages), visual Rearrange, Extract, Delete, Rotate, Duplicate, Reverse |
| **Edit** | Add text, Draw, Highlight, Shapes (rect/ellipse/line/arrow), Sticky notes, Whiteout, Insert images, Crop, Page numbers, Watermark, Header/Footer |
| **Convert from PDF** | Word (.docx), Excel (.xlsx/.csv), PowerPoint (.pptx), JPG, PNG, SVG, TIFF, HTML, TXT, Markdown, EPUB, RTF |
| **Convert to PDF** | JPG, PNG, WebP/GIF/BMP, SVG, Word (.docx), Excel (.xlsx/.csv), PowerPoint (.pptx), HTML, TXT/Markdown |
| **OCR** | OCR PDF (20 languages), OCR images, Searchable PDF (invisible text layer) |
| **Security** | Protect (AES encryption + permissions), Unlock/Remove password, Redact (true rasterizing redaction), Metadata removal |
| **Compression** | Compress PDF (3 levels + lossless mode), Compress images |
| **Forms & Signing** | Fill AcroForms, Create fillable forms, Sign (draw / type / upload) |
| **Images** | Extract embedded images, Enhance scans (brightness/contrast/sharpen/grayscale) |
| **Compare** | Side-by-side with pixel-level difference highlighting |
| **Smart tools** | Local summarization, keyword extraction, outline/TOC builder — no cloud AI |

Plus: dark/light/system theme, favorites, recent tools, keyboard shortcuts, drag & drop
(files, folders, paste), batch processing, ZIP export, rename before download, PDF preview with
thumbnails/zoom/search, undo/redo in editors, PWA offline support, WCAG-minded accessibility.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production bundle in dist/ (also regenerates sitemap.xml)
npm run preview    # serve the production build locally
npm test           # vitest unit + PDF round-trip tests
npm run lint       # oxlint
npm run format     # prettier
```

## Deploy to Cloudflare

The build output (`dist/`) is 100% static files. This project deploys as a Cloudflare **Worker
serving static assets** (see [`wrangler.toml`](wrangler.toml)).

```bash
npm run deploy     # builds, then `wrangler deploy`
```

The repo ships with everything the deploy needs:

- [`wrangler.toml`](wrangler.toml) — serves `./dist` as static assets; every route is prerendered to
  its own HTML file, and unknown URLs get `404.html` with a real 404 status
- [`public/_headers`](public/_headers) — security headers + immutable caching for hashed assets
- `robots.txt`, `sitemap.xml` (auto-generated from the tool registry at build time), OpenGraph/Twitter
  meta, JSON-LD structured data, `manifest.webmanifest` + service worker for PWA/offline

The custom domain (`privacypdftools.com`) is attached to the Worker from the Cloudflare dashboard
(**Workers & Pages → the Worker → Settings → Domains & Routes**). See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full guide, and
[docs/AUTOMATION.md](docs/AUTOMATION.md) for the CI/CD pipeline.

## Tech stack

- **React 19 + TypeScript (strict)** on Vite 8, React Router, TailwindCSS 4, Framer Motion
- **[@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib)** — PDF structure editing, forms, AES encryption/decryption
- **[pdf.js](https://mozilla.github.io/pdf.js/)** — rendering, text extraction (runs in its own Web Worker)
- **[tesseract.js](https://tesseract.projectnaptha.com/)** — WASM OCR (runs in Web Workers)
- **JSZip** — ZIP export and hand-built DOCX/XLSX/PPTX/EPUB writers
- **browser-image-compression** — image compression in a Web Worker

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — project structure, tool registry pattern, data flow
- [Automation & CI/CD](docs/AUTOMATION.md) — every workflow, quality gate and maintenance policy
- [Security review](docs/SECURITY.md) — proof that no file data leaves the browser
- [Browser compatibility](docs/BROWSER_COMPAT.md)
- [Performance notes](docs/PERFORMANCE.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## Honest limitations

- **Edit existing text**: true in-place text editing of arbitrary PDFs is not reliably possible in a
  browser; the editor provides the whiteout + retype workflow instead.
- **Office conversions** are text-focused: headings, paragraphs and lists convert well; exact layout,
  themes, images-in-docx and complex tables are simplified.
- **PDF → SVG** embeds a raster render (true vector extraction isn't feasible in-browser).
- **OCR language packs** (a few MB, open-source Tesseract models) are fetched once from a CDN and
  cached — the only network request any tool ever makes, and it never contains user data.
- **Standard-font text stamping** (watermarks, page numbers, searchable-PDF layer) supports
  Latin-based (WinAnsi) characters; unsupported characters are substituted.

## License

MIT
