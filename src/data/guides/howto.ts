import type { Guide } from './types'

const UPDATED = '2026-10-04'

export const HOWTO_GUIDES: Guide[] = [
  {
    slug: 'merge-pdf-without-uploading',
    kind: 'how-to',
    title: 'How to Merge PDFs Without Uploading Them (Free)',
    h1: 'How to merge PDF files without uploading them',
    description:
      'Combine several PDFs into one file privately: three free ways to merge PDFs on Windows, Mac or phone without sending your documents to a website.',
    updated: UPDATED,
    relatedTools: ['merge-pdf', 'organize-pdf', 'delete-pages', 'compress-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Merging PDFs is one of the most common document tasks — joining scanned pages, putting a cover letter in front of a CV, or bundling receipts for an expense claim. Most “merge PDF” websites upload your files to their servers to do it. Here are three ways to merge PDFs where your files never leave your device.',
      },
      { type: 'h2', text: 'Method 1: Merge in your browser with Privacy PDF Tools (any device)' },
      {
        type: 'ol',
        items: [
          'Open Merge PDF.',
          'Drop two or more PDF files onto the page, or click to choose them. They are read by your browser — nothing is uploaded.',
          'Use the ↑ and ↓ arrows to put the files in the right order.',
          'Click “Merge PDF” and download the combined file.',
        ],
      },
      { type: 'tools', slugs: ['merge-pdf'] },
      {
        type: 'p',
        text: 'This works on Windows, macOS, Linux, Chromebooks, Android and iPhone because it only needs a modern browser. Pages are copied as they are, so text stays selectable and images keep their quality.',
      },
      { type: 'h2', text: 'Method 2: macOS Preview' },
      {
        type: 'ol',
        items: [
          'Open the first PDF in Preview and show thumbnails (View → Thumbnails).',
          'Drag the other PDF files into the thumbnail sidebar where you want them.',
          'Choose File → Export as PDF to save the merged document.',
        ],
      },
      { type: 'h2', text: 'Method 3: Print to PDF (single files only)' },
      {
        type: 'p',
        text: 'Windows and most browsers can “print” a document to PDF, but they cannot combine several PDFs into one. For merging on Windows without installing software, the browser-based method above is the simplest option.',
      },
      { type: 'h2', text: 'Tidy up the merged file' },
      {
        type: 'ul',
        items: [
          'Reorder, rotate or remove individual pages with Rearrange Pages.',
          'Delete blank pages with Delete Pages.',
          'Make the result smaller for email with Compress PDF.',
        ],
      },
      { type: 'tools', slugs: ['organize-pdf', 'delete-pages', 'compress-pdf'] },
    ],
    faqs: [
      {
        q: 'How many PDFs can I merge at once?',
        a: 'There is no fixed limit. Your device’s memory is the only constraint — dozens of ordinary documents merge in seconds.',
      },
      {
        q: 'Can I merge password-protected PDFs?',
        a: 'Remove the password first with Unlock PDF (you need to know it), then merge the unlocked files.',
      },
    ],
  },
  {
    slug: 'compress-pdf-for-email',
    kind: 'how-to',
    title: 'How to Compress a PDF for Email — Free, No Upload',
    h1: 'How to compress a PDF so it fits in an email',
    description:
      'PDF too large to attach? Shrink it below email limits in seconds — free, in your browser, without uploading the file. Which setting to pick and why.',
    updated: UPDATED,
    relatedTools: ['compress-pdf', 'split-pdf', 'compress-images', 'pdf-to-jpg'],
    blocks: [
      {
        type: 'p',
        text: 'Most email services limit attachments to around 20–25 MB, and many company mail servers allow less. Scanned documents and PDFs with photos easily exceed that. Compressing the PDF is usually the quickest fix — and you don’t need to upload a private document to a website to do it.',
      },
      { type: 'h2', text: 'Compress a PDF in your browser' },
      {
        type: 'ol',
        items: [
          'Open Compress PDF and drop your file onto the page.',
          'Pick a compression level: High quality, Medium (recommended) or Maximum compression.',
          'Click “Compress PDF” and download the smaller file. The page shows the new size.',
        ],
      },
      { type: 'tools', slugs: ['compress-pdf'] },
      { type: 'h2', text: 'Which setting should I choose?' },
      {
        type: 'table',
        caption: 'Compress PDF settings',
        head: ['Setting', 'Best for', 'Trade-off'],
        rows: [
          ['High quality', 'Documents you will print', 'Smaller savings'],
          ['Medium (recommended)', 'Email attachments, sharing', 'Good balance of size and clarity'],
          ['Maximum compression', 'Very large scans, upload limits', 'Visible quality loss'],
          [
            'Lossless mode',
            'Text documents where text must stay selectable',
            'Saves less on scans and photos',
          ],
        ],
      },
      {
        type: 'p',
        text: 'The standard levels re-encode pages as optimised images, which gives the biggest savings but means text can no longer be selected. If you need searchable, selectable text, tick “Lossless mode”.',
      },
      { type: 'h2', text: 'Still too large?' },
      {
        type: 'ul',
        items: [
          'Split the PDF into parts and send them in separate emails.',
          'Send only the pages that matter with Extract Pages.',
          'If you are attaching photos, compress the images before turning them into a PDF.',
        ],
      },
      { type: 'tools', slugs: ['split-pdf', 'extract-pages', 'compress-images'] },
    ],
    faqs: [
      {
        q: 'Why is my PDF so large?',
        a: 'Usually because it contains scanned pages or high-resolution photos. Text-only PDFs are rarely large.',
      },
      {
        q: 'Will compression make my PDF unreadable?',
        a: 'Not with “Medium” — text stays clear on screen. Use “High quality” if you will print it.',
      },
    ],
  },
  {
    slug: 'how-to-redact-pdf',
    kind: 'how-to',
    title: 'How to Redact a PDF Properly — Free, No Upload',
    h1: 'How to redact a PDF properly (not just black boxes)',
    description:
      'Drawing black boxes over text does not remove it. Learn how to permanently redact names, numbers and addresses in a PDF — free and without uploading it.',
    updated: UPDATED,
    relatedTools: ['redact-pdf', 'remove-metadata', 'protect-pdf', 'whiteout-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Redaction failures make the news regularly: someone draws black rectangles over confidential text, publishes the PDF, and readers simply copy the “hidden” text out from underneath. A black box is just another layer on top — the original text is still in the file.',
      },
      { type: 'h2', text: 'Why black boxes and highlighters don’t work' },
      {
        type: 'ul',
        items: [
          'The text underneath can still be selected, copied and searched.',
          'Screen readers and search engines read the hidden text.',
          'Some PDF viewers let people move or delete the box.',
        ],
      },
      { type: 'h2', text: 'Redact a PDF permanently' },
      {
        type: 'ol',
        items: [
          'Open Redact and choose your PDF. It stays on your device.',
          'Drag boxes over every name, number, address or passage that must be removed.',
          'Click “Redact & download”. Pages with redactions are re-rendered, so the covered content no longer exists in the file.',
          'Open the result and try to select or search the redacted text — nothing should be found.',
        ],
      },
      { type: 'tools', slugs: ['redact-pdf'] },
      { type: 'h2', text: 'Finish with these steps' },
      {
        type: 'ul',
        items: [
          'Remove document metadata (author, software, dates) with Metadata Removal.',
          'Check page headers, footers and file names for sensitive details too.',
          'Password-protect the file if it still contains confidential information.',
        ],
      },
      { type: 'tools', slugs: ['remove-metadata', 'protect-pdf'] },
      { type: 'h2', text: 'Redact vs. Whiteout' },
      {
        type: 'p',
        text: 'Whiteout covers content so you can type over it — useful for correcting a date or a typo — but the original text stays in the file. Use Redact whenever the information must truly be removed.',
      },
    ],
    faqs: [
      {
        q: 'Can redacted text be recovered?',
        a: 'Not with Redact: pages containing redactions are rebuilt as images, so the covered text is no longer stored in the PDF.',
      },
      {
        q: 'Will the rest of the page stay searchable?',
        a: 'Redacted pages become images, so their remaining text is not selectable. Run Searchable PDF afterwards to add a text layer again.',
      },
    ],
  },
]
