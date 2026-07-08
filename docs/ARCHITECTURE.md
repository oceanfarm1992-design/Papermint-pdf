# Architecture

## Guiding principle

Privacy PDF Tools is a **static single-page application**. There is no backend, no API, no database.
Every byte of PDF processing happens in the browser tab via JavaScript, Web Workers and WebAssembly.

```text
Browser tab
├── React UI (routing, tool pages, progress, results)
├── pdf-lib (WASM-free JS)      → structural edits: merge, split, forms, encryption…
├── pdf.js  (own Web Worker)    → rendering pages, text extraction
├── tesseract.js (Web Workers)  → OCR (WASM engine)
├── JSZip                       → ZIP output + DOCX/XLSX/PPTX/EPUB writers
└── Canvas / OffscreenCanvas    → rasterization, compression, image tools
```

## Directory layout

```text
src/
├── components/          # Reusable UI (dropzone, progress, results, preview modal, editor toolbar…)
│   └── layout/          # Header, footer, theme toggle
├── data/
│   ├── tools.ts         # ★ The tool registry — single source of truth for all 50+ tools
│   └── meta.ts          # App name/version/contact
├── features/            # Pure processing logic, one module per category (lazy-loaded)
│   ├── organize.ts        merge/split/rotate/numbers/watermark/header-footer…
│   ├── convertFrom.ts     PDF → images/office/text formats
│   ├── convertTo.ts       images/office/text → PDF
│   ├── security.ts        protect/unlock/metadata
│   ├── compress.ts        page re-encoding compression
│   ├── ocr.ts             tesseract wiring + searchable PDF
│   ├── imageTools.ts      extract/compress/enhance images
│   ├── ai.ts              local summarize/keywords/outline
│   ├── officeBuilders.ts  minimal DOCX/XLSX/PPTX/EPUB writers (JSZip)
│   ├── tiff.ts            baseline TIFF encoder
│   ├── annotations.ts     editor annotation model
│   └── editorExport.ts    burns annotations into the PDF via pdf-lib
├── hooks/               # useTheme, useLocalList (favorites/recents)
├── pages/               # Home, generic ToolPage, static pages
│   └── tools/           # Interactive tools: Organizer, Editor, Sign, Crop, Redact, Forms, Compare
├── styles/              # Tailwind 4 theme + utility classes
├── types/               # ToolDef, OptionField, ProcessFn…
└── utils/               # pdf.js/pdf-lib loaders, ranges parser, text layout, stamping, download
```

Web Workers and WASM are provided by the libraries themselves (pdf.js ships its worker bundle,
tesseract.js spawns its own workers, browser-image-compression uses one internally) — there is no
hand-rolled worker code to maintain.

## The tool registry pattern

`src/data/tools.ts` declares every tool as data:

```ts
{
  slug: 'split-pdf',
  name: 'Split PDF',
  category: 'organize',
  icon: Scissors,
  accept: ['application/pdf', '.pdf'],
  multiple: false,
  minFiles: 1,
  options: [ /* declarative form fields */ ],
  run: () => import('@/features/organize').then((m) => m.split),  // lazy!
}
```

- **Generic tools** declare `options` (rendered by `OptionsForm`) and a lazily imported `run`
  function with the uniform signature
  `(files, options, { onProgress, signal }) => Promise<OutputFile[]>`.
  `ToolPage` provides the complete UX for free: dropzone → file list → options → progress with
  cancel → results with rename/download/ZIP.
- **Interactive tools** (`customPage: 'editor' | 'organizer' | …`) get a dedicated page component
  but share `ToolShell` (header, privacy note, dropzone) and all utilities.

Adding a tool = one registry entry + one exported function. The home page grid, search index,
sitemap and routing all derive from the registry automatically.

## Data flow of a typical run

1. User drops files → validated against `accept` (drag/drop, paste, browse, folder walk).
2. `ToolPage.run()` creates an `AbortController`, dynamic-imports the feature module.
3. The feature reports `onProgress(fraction, stage)` and checks `signal` between pages.
4. Output `Blob`s are held in memory only; download uses a temporary `blob:` URL that is revoked
   afterwards. Multiple outputs can be zipped client-side.
5. Errors are mapped to human messages in `utils/errors.ts` (corrupt file, wrong password,
   encrypted file, out of memory, unsupported format).

## Coordinate systems (editor/crop/redact)

Annotations are stored in **display points**: the pdf.js viewport at scale 1 with a top-left
origin. Export maps them to PDF content coordinates (bottom-left origin, `/Rotate`-aware) via
`utils/stamp.ts::visualToContent`. Axis-aligned boxes survive 90° rotations exactly; text and
images are drawn with a matching `rotate` so they appear upright on rotated pages.

## State & storage

- All document state is in-memory React state — gone on refresh, by design.
- `localStorage` holds exactly three keys: `pm-theme`, `pm-favorites`, `pm-recents`
  (theme + tool slugs, never file data).
- The service worker caches only same-origin static assets for offline use.
