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
      'Privacy PDF Tools runs every PDF operation locally in your browser using WebAssembly — no uploads, no backend, nothing stored on our servers. Learn how and why.',
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
      <h2>How the site is funded</h2>
      <p>
        The tools are free and stay free. To pay for running and improving the site, our guide articles
        may show ads from Google AdSense, and you can also support us with a donation. The tool pages
        never show ads, and ads never see your documents — your files are processed on your device and
        are never uploaded or stored on our servers.{' '}
        <a className="text-brand-700 underline dark:text-brand-400" href="/privacy#advertising">
          How ads work here
        </a>
        .
      </p>
    </Page>
  )
}

export function Privacy() {
  useSeo({
    title: 'Privacy Policy — Privacy PDF Tools',
    description:
      'Our privacy policy: your PDF files never leave your device and are never stored on our servers. No accounts, and no ads, tracking or cookies on tool pages.',
    path: '/privacy',
  })
  return (
    <Page title="Privacy Policy">
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        The short version: your files never leave your device, and they are never uploaded to or stored
        on our servers. The PDF tools have no ads, no analytics and no cookies. To keep the tools free,
        our guide articles may show Google ads — those ads never see your documents.
      </p>
      <h2>No uploads, nothing stored</h2>
      <p>
        Every tool runs locally in your browser using JavaScript and WebAssembly. Your PDFs and images
        are read directly into your browser’s memory, processed there, and saved back to your device. No
        file content, file name or metadata is ever transmitted to us, to advertisers, or to anyone else,
        and nothing is stored on our servers.
      </p>
      <h2>No accounts</h2>
      <p>There is no signup, no login, and no way for us to identify you.</p>
      <h2>No tracking on tool pages</h2>
      <ul>
        <li>
          No analytics (no Google Analytics, Clarity, Pixel, Mixpanel or similar) anywhere on the site.
        </li>
        <li>No error-reporting beacons.</li>
        <li>No fingerprinting.</li>
        <li>
          No ads and no third-party scripts on tool pages. The site’s security settings block them there,
          and if you go from a guide article to a tool, the page reloads so no ad code is running while
          you work with your files.
        </li>
      </ul>
      <h2 id="advertising">Advertising (guide articles only)</h2>
      <p>
        Running and improving this site costs money, and ads are how we keep the tools free. Our guide
        and comparison articles may show ads from Google AdSense. Your documents are never shared with
        Google or any advertiser: files are processed only on your device and never uploaded.
      </p>
      <p>
        Google and its partners use cookies to show ads based on your visits to this and other websites.
        Google’s use of advertising cookies enables it and its partners to serve ads to you based on your
        visit to this site and/or other sites on the Internet. You can opt out of personalized
        advertising by visiting{' '}
        <a className="underline" href="https://adssettings.google.com" rel="noopener">
          Google Ads Settings
        </a>
        , or opt out of some third-party vendors’ use of cookies for personalized advertising at{' '}
        <a className="underline" href="https://www.aboutads.info" rel="noopener">
          www.aboutads.info
        </a>
        . Learn more in{' '}
        <a
          className="underline"
          href="https://policies.google.com/technologies/partner-sites"
          rel="noopener"
        >
          how Google uses information from sites that use its services
        </a>
        .
      </p>
      <p>
        Visitors in the European Economic Area, the UK and Switzerland are asked for consent before any
        advertising cookies are used, and can choose non-personalized ads.
      </p>
      <h2>Cookies and local storage</h2>
      <p>
        Privacy PDF Tools itself sets no cookies. Advertising cookies may be set by Google only on guide
        articles that show ads, as described above. Your browser’s <em>localStorage</em> is used only for
        optional preferences: your theme choice and your favorite/recent tool names. It never contains
        files, file names or document content. Clear your browser data at any time to remove it.
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
    'Why do some pages show ads?',
    'Running and improving the site costs money, and ads keep the tools free. Our guide articles may show ads from Google AdSense; the tool pages never show ads. Ads never see your documents — your files are processed on your device and are never uploaded or stored on our servers. If you prefer, you can support us with a donation instead.',
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
