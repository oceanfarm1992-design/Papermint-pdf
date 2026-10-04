import type { Guide } from './types'

const UPDATED = '2026-10-04'

export const COMPARISON_GUIDES: Guide[] = [
  {
    slug: 'ilovepdf-alternative',
    kind: 'comparison',
    title: 'Private iLovePDF Alternative — Free, No Upload',
    h1: 'A private iLovePDF alternative that never uploads your files',
    description:
      'Looking for an iLovePDF alternative that keeps documents private? Privacy PDF Tools merges, compresses, converts and edits PDFs in your browser — no upload.',
    updated: UPDATED,
    relatedTools: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'split-pdf', 'edit-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'iLovePDF is one of the most popular online PDF toolkits, and for good reason: it is fast, polished and covers almost every PDF task. Like most online PDF services, it works by uploading your file to its servers, processing it there, and letting you download the result. For everyday documents that is fine. For contracts, bank statements, medical records, IDs or anything under an NDA, many people would rather the file never left their computer.',
      },
      {
        type: 'p',
        text: 'Privacy PDF Tools offers the same kinds of tools — merge, split, compress, convert, edit, sign, OCR, protect and redact — but every operation runs locally in your browser using JavaScript and WebAssembly. There is no server that receives your document, so there is nothing to store, leak or delete afterwards.',
      },
      { type: 'tools', slugs: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'split-pdf'] },
      { type: 'h2', text: 'How the two approaches differ' },
      {
        type: 'table',
        caption: 'iLovePDF compared with Privacy PDF Tools',
        head: ['', 'iLovePDF (web)', 'Privacy PDF Tools'],
        rows: [
          [
            'Where your file is processed',
            'On iLovePDF’s servers (upload required)',
            'In your browser, on your device',
          ],
          ['Works offline once the page is loaded', 'No', 'Yes, for almost every tool'],
          ['Account needed', 'Optional', 'None — there are no accounts'],
          ['Paid plan', 'Yes (Premium)', 'No — everything is free'],
          ['Open source', 'No', 'Yes (MIT license)'],
          ['Desktop & mobile apps, cloud integrations', 'Yes', 'No — web only'],
        ],
      },
      { type: 'h2', text: 'When Privacy PDF Tools is the better choice' },
      {
        type: 'ul',
        items: [
          'Confidential documents: contracts, HR files, tax returns, medical or legal papers.',
          'Work policies that forbid uploading company files to third-party services.',
          'Slow or metered connections — large files never need to be uploaded and downloaded again.',
          'Working offline: once the page has loaded, most tools keep working without internet.',
          'You want to verify the privacy claim yourself — the code is open source.',
        ],
      },
      { type: 'h2', text: 'When iLovePDF may suit you better' },
      {
        type: 'ul',
        items: [
          'You need direct import from Google Drive or Dropbox, or team features.',
          'You process very large batches on a low-memory phone — server processing doesn’t depend on your device.',
          'You prefer an installed desktop or mobile app.',
        ],
      },
      { type: 'h2', text: 'How to switch' },
      {
        type: 'ol',
        items: [
          'Open the matching tool on Privacy PDF Tools — the names are the same (Merge PDF, Compress PDF, PDF to Word…).',
          'Drop your files onto the page. Nothing is uploaded; you can confirm this in your browser’s developer tools (Network tab).',
          'Adjust options and download the result.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Privacy PDF Tools really free?',
        a: 'Yes. There is no premium tier, no watermark and no daily limit. The project is open source under the MIT license.',
      },
      {
        q: 'Is it as good as iLovePDF?',
        a: 'For common tasks — merging, splitting, compressing, converting to images, signing, protecting — results are comparable. Complex conversions such as PDF to Word keep text and structure but simplify intricate layouts.',
      },
      {
        q: 'How can I check that files are not uploaded?',
        a: 'Open your browser’s developer tools, switch to the Network tab and run any tool. You will see no request containing your file. Most tools even work with Wi-Fi turned off.',
      },
    ],
  },
  {
    slug: 'smallpdf-alternative',
    kind: 'comparison',
    title: 'Smallpdf Alternative That Never Uploads Your Files',
    h1: 'A Smallpdf alternative that keeps your PDFs on your device',
    description:
      'Free Smallpdf alternative with no upload, no account and no paywall. Compress, merge, convert, sign and edit PDFs privately — entirely in your browser.',
    updated: UPDATED,
    relatedTools: ['compress-pdf', 'merge-pdf', 'sign-pdf', 'pdf-to-jpg', 'edit-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Smallpdf is a well-designed online PDF suite used by millions. Like most web PDF tools, it processes documents on its own servers: you upload a file, Smallpdf works on it, and you download the result. Many features are part of a paid plan.',
      },
      {
        type: 'p',
        text: 'Privacy PDF Tools takes a different approach. Every tool runs inside your browser with WebAssembly, so your document is never sent anywhere. It is completely free, needs no account, and the source code is public so anyone can check how it works.',
      },
      { type: 'tools', slugs: ['compress-pdf', 'merge-pdf', 'sign-pdf', 'pdf-to-jpg'] },
      { type: 'h2', text: 'Side by side' },
      {
        type: 'table',
        caption: 'Smallpdf compared with Privacy PDF Tools',
        head: ['', 'Smallpdf (web)', 'Privacy PDF Tools'],
        rows: [
          [
            'Where your file is processed',
            'On Smallpdf’s servers (upload required)',
            'In your browser, on your device',
          ],
          ['Paid plan', 'Yes (Pro)', 'No — every tool is free'],
          ['Account needed', 'For some features', 'Never'],
          ['Works offline once loaded', 'No', 'Yes, for almost every tool'],
          ['Open source', 'No', 'Yes (MIT license)'],
          ['Cloud storage & team features', 'Yes', 'No'],
        ],
      },
      { type: 'h2', text: 'Why process PDFs locally?' },
      {
        type: 'ul',
        items: [
          'Privacy by design: a file that is never uploaded cannot be stored, breached or analysed by anyone else.',
          'Speed for large files: no waiting for an upload and a second download.',
          'Compliance: easier to use with GDPR-sensitive, legal or client documents.',
          'No usage limits: your own computer does the work, so there is nothing to meter.',
        ],
      },
      { type: 'h2', text: 'Popular Smallpdf tasks, done privately' },
      {
        type: 'ul',
        items: [
          'Compress PDF — three quality levels plus a lossless mode that keeps text selectable.',
          'Merge and split PDFs — reorder files, split by ranges or into single pages.',
          'Sign PDF — draw, type or upload a signature and place it anywhere.',
          'PDF to JPG / PNG — render pages at 96, 150 or 300 DPI.',
          'Edit PDF — add or retype text, highlight, draw, add images and shapes.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do I need to create an account?',
        a: 'No. Privacy PDF Tools has no accounts at all — open a tool and use it.',
      },
      {
        q: 'Are there file size limits?',
        a: 'Only your device’s memory. Files up to a few hundred megabytes generally work on a modern computer.',
      },
      {
        q: 'Does it work on phones?',
        a: 'Yes. The site works in mobile browsers; very heavy jobs such as OCR on long documents are slower on phones.',
      },
    ],
  },
  {
    slug: 'are-online-pdf-tools-safe',
    kind: 'comparison',
    title: 'Is It Safe to Upload PDFs Online? What to Know',
    h1: 'Is it safe to upload PDFs to online PDF tools?',
    description:
      'What happens when you upload a PDF to an online converter, what the real risks are, and how to merge, compress or convert PDFs without uploading them.',
    updated: UPDATED,
    relatedTools: ['merge-pdf', 'compress-pdf', 'redact-pdf', 'remove-metadata', 'protect-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Most online PDF tools work the same way: your browser uploads the file to the provider’s servers, the server processes it, and you download the result. Reputable services encrypt the transfer and delete files after a while. Even so, uploading means trusting a third party with a copy of your document — and with whatever it contains.',
      },
      { type: 'h2', text: 'What can go wrong when you upload a document' },
      {
        type: 'ul',
        items: [
          'Retention: files stay on servers for some time, and backups or logs may keep them longer than you expect.',
          'Breaches: any server holding documents is a target; you have no control over its security.',
          'Jurisdiction: your file may be processed in another country under different laws.',
          'Policy risk: company, client or legal agreements often forbid sending documents to unapproved services.',
          'Hidden data: PDFs carry metadata such as author names and software versions, and “covered” text that is still present underneath.',
        ],
      },
      { type: 'h2', text: 'Which documents should never be uploaded?' },
      {
        type: 'ul',
        items: [
          'Passports, ID cards and anything with a national ID number',
          'Bank statements, tax returns and payslips',
          'Medical records and insurance claims',
          'Contracts, NDAs and legal correspondence',
          'Client or employee data covered by GDPR or similar laws',
        ],
      },
      { type: 'h2', text: 'The safer alternative: tools that run in your browser' },
      {
        type: 'p',
        text: 'Modern browsers can run full PDF engines through WebAssembly. Tools built this way open your file directly in the page, process it on your own device, and save the result back to your computer — no server ever receives the document. Privacy PDF Tools works this way for all of its tools.',
      },
      { type: 'tools', slugs: ['merge-pdf', 'compress-pdf', 'redact-pdf', 'remove-metadata'] },
      { type: 'h2', text: 'How to check whether a tool uploads your file' },
      {
        type: 'ol',
        items: [
          'Open the tool and press F12 (or right-click → Inspect) to open developer tools.',
          'Go to the Network tab and clear it.',
          'Run the tool on a test file and watch the requests. An upload shows up as a large POST request with your file in it.',
          'Bonus test: disconnect from the internet after the page loads. If the tool still works, it is processing locally.',
        ],
      },
      { type: 'h2', text: 'Before you share any PDF' },
      {
        type: 'ul',
        items: [
          'Remove metadata (author, software, dates) with Metadata Removal.',
          'Use real redaction — not black rectangles — for sensitive text.',
          'Password-protect files you send by email, and share the password separately.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are big-name PDF websites unsafe?',
        a: 'Not necessarily — reputable providers use encryption and delete files after a period. The issue is that uploading requires trusting them with a copy. Local tools remove the need for that trust.',
      },
      {
        q: 'Is processing in the browser really private?',
        a: 'Yes, as long as the tool makes no network requests with your file. You can verify this in the browser’s Network tab, and with open-source tools you can read the code.',
      },
    ],
  },
]
