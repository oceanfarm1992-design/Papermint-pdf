import { CONTACT_EMAIL } from '@/data/meta'
import { TOOLS } from '@/data/tools'
import { useSeo, useJsonLd } from '@/hooks/useSeo'

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1>
      <div className="space-y-4 leading-relaxed text-neutral-700 dark:text-neutral-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </div>
  )
}

export function About() {
  useSeo({
    title: 'About — Privacy PDF Tools',
    description:
      'Privacy PDF Tools runs every PDF operation locally in your browser using WebAssembly — no uploads, no backend, no tracking. Learn how and why.',
    path: '/about',
  })
  return (
    <Page title="About Privacy PDF Tools">
      <p>
        Privacy PDF Tools is a complete PDF toolkit that runs <strong>entirely in your browser</strong>.
        All {TOOLS.length} tools — merging, splitting, compressing, converting, editing, signing, OCR and
        more — are powered by WebAssembly and modern browser APIs. There is no server-side processing at
        all.
      </p>
      <h2>Why local processing matters</h2>
      <ul>
        <li>
          <strong>Privacy</strong> — your documents never leave your device. There is nothing to leak,
          sell or subpoena.
        </li>
        <li>
          <strong>Speed</strong> — no upload/download round-trips. A 100-page merge takes milliseconds.
        </li>
        <li>
          <strong>Reliability</strong> — most tools keep working even when you’re offline.
        </li>
      </ul>
      <h2>Technology</h2>
      <p>
        Built with React, TypeScript and TailwindCSS. PDFs are processed with pdf-lib and Mozilla’s
        PDF.js; OCR uses the Tesseract engine compiled to WebAssembly. The whole site is static and
        served from a CDN — there is no backend, no database and no analytics.
      </p>
    </Page>
  )
}

export function Privacy() {
  useSeo({
    title: 'Privacy Policy — Privacy PDF Tools',
    description:
      'Our privacy policy: no uploads, no accounts, no tracking, no cookies. Your PDF files never leave your device — everything runs locally in your browser.',
    path: '/privacy',
  })
  return (
    <Page title="Privacy Policy">
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        The short version: your files never leave your device, and we collect nothing. Not “nothing
        except…” — nothing.
      </p>
      <h2>No uploads</h2>
      <p>
        Every tool runs locally in your browser using JavaScript and WebAssembly. Your PDFs and images
        are read directly into your browser’s memory, processed there, and saved back to your device. No
        file content, file name or metadata is ever transmitted to us or anyone else.
      </p>
      <h2>No accounts</h2>
      <p>There is no signup, no login, and no way for us to identify you.</p>
      <h2>No tracking</h2>
      <ul>
        <li>No analytics (no Google Analytics, Clarity, Pixel, Mixpanel or similar).</li>
        <li>No error-reporting beacons.</li>
        <li>No fingerprinting.</li>
        <li>No third-party embeds on tool pages.</li>
      </ul>
      <h2>No cookies</h2>
      <p>
        Privacy PDF Tools sets no cookies. Your browser’s <em>localStorage</em> is used only for optional
        preferences: your theme choice and your favorite/recent tool names. It never contains files, file
        names or document content. Clear your browser data at any time to remove it.
      </p>
      <h2>The one network exception</h2>
      <p>
        The OCR tools download a language pack (a public, open-source Tesseract model of a few MB) from a
        CDN the first time you use them, and cache it locally. This request contains no information about
        your document. Every other tool makes zero network requests while processing.
      </p>
      <h2>Hosting</h2>
      <p>
        The static site is delivered by Cloudflare, which may log standard web requests (IP, URL, user
        agent) to operate its network, like any website host. Your documents are never part of any
        request.
      </p>
    </Page>
  )
}

export function Terms() {
  useSeo({
    title: 'Terms of Use — Privacy PDF Tools',
    description:
      'Terms of use for Privacy PDF Tools — free, provided as-is, MIT-licensed PDF tools that run entirely in your browser.',
    path: '/terms',
  })
  return (
    <Page title="Terms of Use">
      <p>Privacy PDF Tools is provided free of charge, as is, in the hope that it is useful.</p>
      <h2>Use</h2>
      <ul>
        <li>You may use the tools for any lawful personal or commercial purpose.</li>
        <li>Only unlock or redact documents you have the right to modify.</li>
        <li>Removing passwords requires knowing the password — the tools do not break encryption.</li>
      </ul>
      <h2>No warranty</h2>
      <p>
        The software is provided “as is”, without warranty of any kind. Always keep your original files;
        verify results before deleting sources. In no event shall the authors be liable for any claim or
        damages arising from the use of the software.
      </p>
      <h2>License</h2>
      <p>The source code is available under the MIT License.</p>
    </Page>
  )
}

export function Contact() {
  useSeo({
    title: 'Contact — Privacy PDF Tools',
    description:
      'Questions, bug reports or ideas about Privacy PDF Tools? Reach us by email — no forms, no accounts.',
    path: '/contact',
  })
  return (
    <Page title="Contact">
      <p>
        Questions, bug reports or ideas? Email us — that’s the only channel, because there are no forms
        and no accounts:
      </p>
      <p className="text-lg">
        <a
          className="font-medium text-brand-600 underline dark:text-brand-400"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </Page>
  )
}

const FAQS: [string, string][] = [
  [
    'Are my files really not uploaded anywhere?',
    'Correct. Open your browser’s developer tools (Network tab) while using any tool — you will see no requests carrying your file. Processing happens in JavaScript/WebAssembly inside the page. Most tools work with Wi-Fi turned off.',
  ],
  [
    'Is there a file size limit?',
    'Only your device’s memory. As a rule of thumb, files up to a few hundred MB work fine on a modern laptop. Very large scans may need the compression tool’s “maximum” level or splitting first.',
  ],
  [
    'Why does OCR need a download?',
    'The OCR engine (Tesseract WASM) needs a trained language model (2–15 MB). It is fetched once from a public CDN and cached. Your document itself is never sent anywhere.',
  ],
  [
    'Can I edit the existing text of a PDF?',
    'Yes, for most documents. In Edit PDF, choose “Edit existing text”, click a line and retype it — the original is covered and redrawn in a matching standard font, size and position. The old text stays in the hidden text layer, so use Redact when the change is sensitive.',
  ],
  [
    'How good is PDF → Word?',
    'Text, reading order and headings convert well. Complex multi-column layouts, tables and embedded images are simplified. For pixel-perfect needs, keep the PDF.',
  ],
  [
    'Does compression reduce quality?',
    'The standard mode re-encodes pages as optimized images: much smaller, but text is no longer selectable. Choose “lossless mode” to keep text and structure with more modest savings.',
  ],
  [
    'Is Protect PDF real encryption?',
    'Yes — files are encrypted with the standard PDF AES scheme via pdf-lib. Anyone opening the file needs the password. Don’t lose it; nobody can recover it.',
  ],
  [
    'Does it work on my phone?',
    'Yes, the interface is fully responsive. Heavy operations (OCR, big compressions) are slower on phones due to memory and CPU limits.',
  ],
]

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
}

export function Faq() {
  useSeo({
    title: 'FAQ — Privacy PDF Tools',
    description:
      'Answers about privacy, file size limits, OCR downloads, PDF encryption and mobile support for Privacy PDF Tools.',
    path: '/faq',
  })
  useJsonLd(FAQ_SCHEMA)
  return (
    <Page title="Frequently Asked Questions">
      <div className="space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="card group px-5 py-4">
            <summary className="cursor-pointer font-medium text-neutral-900 select-none dark:text-white">
              {q}
            </summary>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{a}</p>
          </details>
        ))}
      </div>
    </Page>
  )
}
