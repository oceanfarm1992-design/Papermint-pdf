# Browser Compatibility

## Supported (fully tested feature set)

| Browser | Minimum | Notes |
| --- | --- | --- |
| Chrome / Edge / Chromium | 100+ | Full support, best performance. Folder drop + folder picker supported. |
| Firefox | 100+ | Full support. Folder *picker* (`webkitdirectory`) works; folder drag-drop works. |
| Safari (macOS/iOS) | 16+ | Full support. `createImageBitmap`, pointer events and WASM all available. |
| Android Chrome | 100+ | Full support; heavy jobs (OCR, big compressions) are slower on low-RAM devices. |

## Key platform APIs used and their baselines

| API | Used for | Baseline |
| --- | --- | --- |
| WebAssembly | OCR engine (tesseract), pdf.js internals | universal since 2017 |
| Web Workers / module workers | pdf.js rendering, tesseract, image compression | universal |
| `File.arrayBuffer()` | reading inputs | Chrome 76 / FF 69 / Safari 14 |
| `createImageBitmap` | image decode (WebP/GIF/BMP → PDF, enhancement) | Chrome 50 / FF 42 / Safari 15 |
| Pointer Events | drawing, signatures, crop/redact selections | universal |
| `IntersectionObserver` | lazy page rendering in the editor | universal |
| `structuredClone` | editor drag snapshots | Chrome 98 / FF 94 / Safari 15.4 |
| CSS `clip-path` polygon | crop overlay dimming | universal |
| Service Worker | offline PWA shell | universal (skipped gracefully if unavailable) |
| `webkitGetAsEntry` (folder drop) | dropping folders | Chromium & WebKit; Firefox partial — regular multi-file selection always works |

## Graceful degradation

- If `localStorage` is blocked (private mode policies), theme/favorites simply don't persist; all
  tools still work.
- If the service worker can't register, the app works online exactly the same.
- If a canvas is too large for the device (`canvas.toBlob` fails), the user gets a clear
  "page too large" error instead of a crash — try a lower DPI/quality setting.
- OCR needs one online session per language to fetch its model; afterwards the browser cache
  usually allows offline OCR too.

## Memory guidance

Processing is memory-bound. Rules of thumb (per file):

| Device | Comfortable | Upper bound |
| --- | --- | --- |
| Desktop 16 GB | ≤ 200 MB PDF | ~512 MB (app warns above this) |
| Laptop 8 GB | ≤ 100 MB | ~250 MB |
| Phone | ≤ 30 MB | ~100 MB |

High-DPI conversions (300 DPI PDF→PNG) multiply memory usage ~17× vs 72 DPI; the app streams
page-by-page and releases canvases eagerly to keep peaks low.
