# Security & Privacy Review

**Claim:** no user file — content, name or metadata — ever leaves the browser.

## How to verify the claim yourself

1. Open the site, then open DevTools → **Network** tab.
2. Load a PDF into any tool and run it.
3. Observe: **zero requests** are made during processing (the only requests you will ever see are
   the site's own static JS/CSS on first load, and — only for OCR tools — a one-time language-model
   download from a CDN).
4. Stronger proof: load the page, switch to airplane mode / turn off Wi-Fi, and run Merge, Split,
   Compress, Watermark, etc. They work, because nothing is remote.

## Code-level audit points

| Vector | Status |
| --- | --- |
| `fetch` / `XMLHttpRequest` of user data | **None.** The app source contains no fetch of file bytes. Files are read via `File.arrayBuffer()` / `FileReader` into memory only. |
| Form submissions | **None.** No `<form action>`; the contact page is a `mailto:` link. |
| WebSockets / beacons / analytics | **None.** No analytics SDK, no `navigator.sendBeacon`, no error reporters. |
| Third-party scripts | **None** at runtime. All JS is first-party, bundled and hash-named. |
| Cookies | **None set.** Preferences use `localStorage` with three keys (`pm-theme`, `pm-favorites`, `pm-recents`) that contain only a theme string and tool slugs. |
| Where outputs go | Outputs are in-memory `Blob`s downloaded via short-lived `blob:` object URLs (revoked after download). Nothing is persisted. |
| OCR network use | tesseract.js downloads a public trained model (e.g. `eng.traineddata.gz`) from a CDN once and caches it. The request URL contains no user data; the document is processed locally against the model. |
| Service worker | Handles **same-origin GET only**; explicitly ignores cross-origin requests, so it can never cache or interfere with anything else. |

## Content security hardening (`public/_headers`)

- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer` — no URLs leak in referrers
- `Permissions-Policy` disables camera/mic/geolocation and opts out of interest cohorts
- `Cross-Origin-Opener-Policy: same-origin`

## Tool-specific security notes

- **Protect PDF** performs real standard PDF encryption (via `@cantoo/pdf-lib`'s AES support) with
  user/owner passwords and permission flags. Passwords are used in memory only.
- **Unlock PDF** requires knowing the password. It is a convenience for removing protection you are
  authorized to remove — it does not and cannot crack encryption.
- **Redact** re-renders affected pages to flat images with the black boxes burned in. The original
  text/vector content of those pages is **not present** in the output (unlike naive "draw a black
  rectangle" approaches). Output metadata is also cleared.
- **Metadata removal** clears Info-dictionary fields (title, author, subject, keywords, producer,
  creator, dates) and drops the XMP metadata stream.

## Residual considerations

- Browser memory is the working area; as with any client-side app, a compromised browser or
  machine can see what the user sees. There is no protection against local malware — and no remote
  surface to attack.
- Cloudflare, as the static host, sees standard HTTP request logs (IP, URL, UA) for page loads,
  like any website. File contents are never part of any request.
