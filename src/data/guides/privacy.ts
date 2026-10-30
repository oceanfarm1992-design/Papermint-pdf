import type { Guide } from './types'

const UPDATED = '2026-10-30'

/** How-tos for searches with a privacy angle ("without uploading", "offline", "confidential"). */
export const PRIVACY_GUIDES: Guide[] = [
  {
    slug: 'sign-pdf-without-uploading',
    kind: 'how-to',
    title: 'How to Sign a PDF Without Uploading It (Free)',
    h1: 'How to sign a PDF without uploading it anywhere',
    description:
      'Sign contracts, forms and letters privately: draw, type or upload your signature and place it on a PDF in your browser — no upload, no account, free.',
    updated: UPDATED,
    relatedTools: ['sign-pdf', 'fill-forms', 'edit-pdf', 'protect-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'A signed PDF usually contains two things you would rather not hand to a stranger: the document itself (a lease, an offer letter, a medical form) and an image of your signature. Most e-signature websites upload both. Here is how to sign a PDF where neither ever leaves your device.',
      },
      { type: 'h2', text: 'Method 1: Sign in your browser with Privacy PDF Tools' },
      {
        type: 'ol',
        items: [
          'Open Sign PDF and choose your document. It is read by your browser, not uploaded.',
          'Create a signature: draw it with a mouse, trackpad or finger; type your name in a handwriting font; or upload a photo of your real signature.',
          'Click where the signature should go, then drag and resize it. Repeat on other pages for initials.',
          'Use the text tool to add your printed name or the date if the form asks for it.',
          'Download the signed PDF.',
        ],
      },
      { type: 'tools', slugs: ['sign-pdf'] },
      {
        type: 'p',
        text: 'This works on Windows, Mac, Linux, Chromebook, iPhone and Android. On a phone, drawing with your finger usually gives the most natural-looking signature.',
      },
      { type: 'h2', text: 'Method 2: macOS Preview' },
      {
        type: 'ol',
        items: [
          'Open the PDF in Preview and show the Markup toolbar.',
          'Click the Sign button and create a signature with the trackpad or camera.',
          'Place it on the page and save.',
        ],
      },
      { type: 'h2', text: 'Before you send it' },
      {
        type: 'ul',
        items: [
          'If the form has fillable fields, complete them first with Fill Forms.',
          'Add a password with Protect PDF if the signed document contains personal data.',
          'Remember that a drawn signature is a visual signature, not a certificate-based digital signature — check what the recipient requires for important legal documents.',
        ],
      },
      { type: 'tools', slugs: ['fill-forms', 'protect-pdf'] },
    ],
    faqs: [
      {
        q: 'Is my signature saved anywhere?',
        a: 'No. It is created and placed in your browser and is never uploaded or stored on a server.',
      },
      {
        q: 'Can I sign on my phone?',
        a: 'Yes. Open Sign PDF in your phone’s browser, draw your signature with your finger, and download the signed file.',
      },
    ],
  },
  {
    slug: 'convert-pdf-to-word-without-uploading',
    kind: 'how-to',
    title: 'Convert PDF to Word Without Uploading — Free',
    h1: 'How to convert a PDF to Word without uploading it',
    description:
      'Turn a PDF into an editable Word document privately. Free in-browser PDF to Word conversion, plus what to do with scanned PDFs and complex layouts.',
    updated: UPDATED,
    relatedTools: ['pdf-to-word', 'ocr-pdf', 'pdf-to-txt', 'edit-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'CVs, contracts and reports are the documents people most often need to turn back into Word — and they are full of personal or confidential details. Online converters typically upload the PDF and send back a .docx. You can do the same conversion entirely on your own device.',
      },
      { type: 'h2', text: 'Method 1: PDF → Word in your browser' },
      {
        type: 'ol',
        items: [
          'Open PDF → Word and choose your PDF.',
          'Click “PDF → Word”. Text is extracted by your browser, headings are detected, and table-like rows become Word tables where possible.',
          'Download the .docx and open it in Word, Google Docs, LibreOffice or Pages.',
        ],
      },
      { type: 'tools', slugs: ['pdf-to-word'] },
      { type: 'h2', text: 'Method 2: Open the PDF in Microsoft Word' },
      {
        type: 'p',
        text: 'Recent desktop versions of Word can open a PDF directly (File → Open) and convert it to an editable document on your computer. It handles layout well but needs a Word licence and can take a while on long files.',
      },
      { type: 'h2', text: 'If the PDF is a scan' },
      {
        type: 'p',
        text: 'A scanned PDF is just pictures of pages, so there is no text to convert. Run OCR PDF first — it recognizes the text locally in your browser — and then convert the result to Word.',
      },
      { type: 'tools', slugs: ['ocr-pdf'] },
      { type: 'h2', text: 'What to expect' },
      {
        type: 'ul',
        items: [
          'Paragraphs, reading order and headings carry over well.',
          'Images and multi-column layouts are not reproduced — the goal is editable text.',
          'If you only need the words, PDF → Text gives a plain .txt file.',
        ],
      },
      { type: 'tools', slugs: ['pdf-to-txt', 'edit-pdf'] },
    ],
    faqs: [
      {
        q: 'Do I need to install anything?',
        a: 'No. The conversion runs in any modern browser on desktop or mobile.',
      },
      {
        q: 'Can I edit the PDF without converting it?',
        a: 'Yes — Edit PDF lets you retype existing lines and add text directly to the PDF, which keeps the original layout.',
      },
    ],
  },
  {
    slug: 'edit-pdf-without-acrobat',
    kind: 'how-to',
    title: 'How to Edit a PDF Without Acrobat — Free & Private',
    h1: 'How to edit a PDF without Adobe Acrobat',
    description:
      'Change text, add notes, highlight, white out and insert images in a PDF for free — without Acrobat, without an account, and without uploading the file.',
    updated: UPDATED,
    relatedTools: ['edit-pdf', 'add-text', 'whiteout-pdf', 'highlight-pdf', 'redact-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'You do not need an Acrobat subscription to fix a typo, fill in a non-fillable form or mark up a document. A browser-based editor can do it — and if it runs locally, your document never leaves your computer.',
      },
      { type: 'h2', text: 'Edit a PDF in your browser' },
      {
        type: 'ol',
        items: [
          'Open Edit PDF and choose your file.',
          'To change existing wording, pick “Edit existing text”, click a line and retype it.',
          'To add new content, choose text, draw, highlight, shapes, sticky notes, images or whiteout from the toolbar and click on the page.',
          'Drag and resize anything you placed, then download the edited PDF.',
        ],
      },
      { type: 'tools', slugs: ['edit-pdf'] },
      { type: 'h2', text: 'Common edits and the fastest tool for each' },
      {
        type: 'table',
        caption: 'Which tool to use for common PDF edits',
        head: ['You want to…', 'Use'],
        rows: [
          ['Fix a typo or change a date', 'Edit PDF → Edit existing text'],
          ['Type on a form without fields', 'Add Text'],
          ['Hide an old address and write a new one', 'Whiteout, then Add Text'],
          ['Mark up a document for review', 'Highlight, Sticky Notes'],
          ['Remove sensitive data for good', 'Redact'],
        ],
      },
      { type: 'tools', slugs: ['add-text', 'whiteout-pdf', 'highlight-pdf', 'redact-pdf'] },
      { type: 'h2', text: 'One important caveat' },
      {
        type: 'p',
        text: 'Whiteout and replaced text cover what is underneath, but the original text can remain in the file’s hidden text layer. If you are removing something confidential, use Redact, which re-renders the page so the content is really gone.',
      },
    ],
    faqs: [
      {
        q: 'Can I edit a scanned PDF?',
        a: 'You can add text, drawings and images on top of a scan. To change the scanned words themselves, run OCR PDF first so the page has a text layer.',
      },
      {
        q: 'Will my edits show in other PDF readers?',
        a: 'Yes. Edits are drawn into the pages when you download, so they look the same in Acrobat Reader, Preview, browsers and phone apps.',
      },
    ],
  },
  {
    slug: 'photos-to-pdf-on-phone',
    kind: 'how-to',
    title: 'How to Turn Photos Into One PDF on Your Phone',
    h1: 'How to combine photos into one PDF on iPhone or Android',
    description:
      'Turn receipts, documents and ID photos into a single PDF on your phone — free, in the browser, without uploading your pictures to a website.',
    updated: UPDATED,
    relatedTools: ['jpg-to-pdf', 'image-to-pdf', 'compress-pdf', 'merge-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Expense reports, visa applications and rental applications often ask for “one PDF” when what you have is a handful of photos. Photos of IDs and bank letters are exactly what you should not upload to random converter sites, so here is how to do it on the phone itself.',
      },
      { type: 'h2', text: 'Method 1: In your phone’s browser (iPhone and Android)' },
      {
        type: 'ol',
        items: [
          'Open JPG → PDF (or Image → PDF for PNG, WebP and other formats).',
          'Tap to choose the photos from your gallery or Files app.',
          'Put them in order, choose A4 or US Letter if the PDF will be printed, and convert.',
          'Download the PDF — it is created on your phone, nothing is uploaded.',
        ],
      },
      { type: 'tools', slugs: ['jpg-to-pdf', 'image-to-pdf'] },
      { type: 'h2', text: 'Method 2: iPhone Files app' },
      {
        type: 'p',
        text: 'In the Files app, select several images, open the menu and choose Create PDF. It is quick, but you cannot choose a page size, so pages end up the size of each photo.',
      },
      { type: 'h2', text: 'Tips for documents photographed with a phone' },
      {
        type: 'ul',
        items: [
          'Shoot in good light, straight from above, with the page filling the frame.',
          'If the PDF is too big for an upload form, run it through Compress PDF.',
          'To add the photos to an existing PDF, convert them and then use Merge PDF.',
        ],
      },
      { type: 'tools', slugs: ['compress-pdf', 'merge-pdf'] },
    ],
    faqs: [
      {
        q: 'Does converting reduce photo quality?',
        a: 'No. JPG photos are placed in the PDF as they are. Only Compress PDF reduces quality, and only if you choose to run it.',
      },
      {
        q: 'Can I convert HEIC photos from an iPhone?',
        a: 'HEIC is not supported directly. Share or export the photos as JPG first. To shoot JPG from now on, set Settings → Camera → Formats to “Most Compatible”.',
      },
    ],
  },
  {
    slug: 'split-pdf-without-uploading',
    kind: 'how-to',
    title: 'How to Split a PDF Without Uploading It (Free)',
    h1: 'How to split a PDF into separate files without uploading it',
    description:
      'Split a PDF by page ranges, into equal chunks, or into single pages — free, in your browser, with no upload and no account.',
    updated: UPDATED,
    relatedTools: ['split-pdf', 'extract-pages', 'delete-pages', 'organize-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Splitting is how you send someone only the part of a document they need — one chapter, one statement, one signed page. Doing it locally means the full document, including the pages you did not want to share, stays on your device.',
      },
      { type: 'h2', text: 'Split a PDF in your browser' },
      {
        type: 'ol',
        items: [
          'Open Split PDF and choose your file.',
          'Pick a mode: every page separately, every N pages, or custom ranges such as 1-3, 4, 7-9.',
          'Click “Split PDF” and download the parts one by one or as a ZIP.',
        ],
      },
      { type: 'tools', slugs: ['split-pdf'] },
      { type: 'h2', text: 'Which tool for which job' },
      {
        type: 'table',
        caption: 'Choosing between split, extract and delete',
        head: ['You want to…', 'Use'],
        rows: [
          ['Cut one PDF into several files', 'Split PDF'],
          ['Pull out a few pages into one new file', 'Extract Pages'],
          ['Keep the document but remove some pages', 'Delete Pages'],
          ['Reorder pages visually', 'Rearrange Pages'],
        ],
      },
      { type: 'tools', slugs: ['extract-pages', 'delete-pages', 'organize-pdf'] },
      {
        type: 'p',
        text: 'Pages are copied rather than re-rendered, so every part keeps the original text and image quality.',
      },
    ],
    faqs: [
      {
        q: 'How do I write page ranges?',
        a: 'Separate ranges with commas and use a dash for spans: “1-3, 4, 7-9” creates three files.',
      },
      {
        q: 'Can I split a scanned PDF?',
        a: 'Yes. Splitting works on any PDF, scanned or not, because whole pages are copied.',
      },
    ],
  },
  {
    slug: 'remove-pdf-metadata',
    kind: 'how-to',
    title: 'How to Remove Hidden Metadata From a PDF',
    h1: 'How to remove hidden metadata from a PDF before sharing it',
    description:
      'PDFs can carry your name, company, software and editing dates. See what PDF metadata reveals and strip it for free, without uploading the file.',
    updated: UPDATED,
    relatedTools: ['remove-metadata', 'redact-pdf', 'protect-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Every PDF has document properties that most people never look at: title, author, subject, keywords, the application that created it, and when it was created and last modified. They are often filled in automatically from your user account or company name — and they travel with the file.',
      },
      { type: 'h2', text: 'What PDF metadata can reveal' },
      {
        type: 'ul',
        items: [
          'The author’s name or computer username.',
          'The organization that owns the software licence.',
          'Which program and version produced the file.',
          'Creation and modification dates and times.',
          'An old working title that differs from the final document.',
        ],
      },
      { type: 'h2', text: 'Remove it in your browser' },
      {
        type: 'ol',
        items: [
          'Open Metadata Removal and choose one or more PDFs.',
          'Run it: title, author, subject, keywords, creator and producer are cleared, dates are reset, and the embedded XMP metadata stream is removed.',
          'Download the cleaned files. Pages look exactly the same.',
        ],
      },
      { type: 'tools', slugs: ['remove-metadata'] },
      { type: 'h2', text: 'Metadata is not the only thing that leaks' },
      {
        type: 'p',
        text: 'Text hidden under black boxes or white rectangles is still in the file and can be copied or searched. If the visible content contains something sensitive, use Redact, which also writes fresh, empty metadata.',
      },
      { type: 'tools', slugs: ['redact-pdf', 'protect-pdf'] },
    ],
    faqs: [
      {
        q: 'How can I see a PDF’s metadata?',
        a: 'In most PDF readers, open the document properties — for example File → Properties in Acrobat Reader, or Tools → Show Inspector in macOS Preview.',
      },
      {
        q: 'Does removing metadata change the content?',
        a: 'No. Only the hidden document properties are cleared; text, images and pages stay the same.',
      },
    ],
  },
  {
    slug: 'offline-pdf-tools',
    kind: 'how-to',
    title: 'Offline PDF Tools: Edit and Convert PDFs Privately',
    h1: 'PDF tools that keep working offline',
    description:
      'Merge, split, compress, convert and sign PDFs with tools that run in your browser and keep working without an internet connection. Free, no install.',
    updated: UPDATED,
    relatedTools: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'sign-pdf', 'edit-pdf'],
    blocks: [
      {
        type: 'p',
        text: 'Most online PDF tools are really server software: your file goes up, the work happens elsewhere, and the result comes back down. Privacy PDF Tools works the other way round — the tool’s code is downloaded to your browser and the processing happens on your device.',
      },
      { type: 'h2', text: 'What “works offline” means here' },
      {
        type: 'ul',
        items: [
          'Once a tool’s page has loaded, it needs no connection to process files — you can switch to airplane mode and keep working.',
          'The app installs as a Progressive Web App and caches the tools you have opened, so they start again without a network.',
          'The one exception is OCR, which downloads an open-source language model the first time you use a language; after that it is cached.',
        ],
      },
      { type: 'h2', text: 'Check it yourself' },
      {
        type: 'ol',
        items: [
          'Open a tool such as Merge PDF.',
          'Open your browser’s developer tools and switch to the Network tab (or simply disconnect from the internet).',
          'Process a file — no request carries your document anywhere.',
        ],
      },
      { type: 'h2', text: 'Popular tools that run fully offline' },
      { type: 'tools', slugs: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'sign-pdf', 'edit-pdf'] },
      {
        type: 'p',
        text: 'Working offline is also why there are no upload waits: files are processed at the speed of your own device, with no size limit other than its memory.',
      },
    ],
    faqs: [
      {
        q: 'Do I need to install an app?',
        a: 'No. Everything runs in the browser. You can optionally install it as a web app from your browser’s menu for quicker access.',
      },
      {
        q: 'Is offline processing slower?',
        a: 'Usually it is faster, because there is no upload or download. Very large files depend on your device’s memory and speed.',
      },
    ],
  },
]
