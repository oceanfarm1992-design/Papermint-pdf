import type { ToolContentExtras } from './types'

/**
 * Deeper copy for the most-searched tools: real use cases, practical notes and
 * extra questions, so each page carries substantially more text of its own than
 * the shared template. Merged into the base content by ./index.ts.
 *
 * Same rule as the base copy: only describe what the tool actually does.
 */
export const TOOL_EXTRAS: Record<string, ToolContentExtras> = {
  'merge-pdf': {
    useCases: [
      'Put a cover letter, CV and certificates into one application PDF.',
      'Combine monthly invoices or receipts into a single file for your accountant.',
      'Join pages that a scanner saved as separate files back into one document.',
      'Bundle contract, annexes and signature page before sending them for review.',
    ],
    details: [
      {
        heading: 'What is kept when you merge',
        text: 'Every page is copied exactly as it is — text stays selectable, images keep their resolution, and page sizes and orientation are preserved, so an A4 report and a US Letter form can live in the same file. Bookmarks (the outline panel) from the source files are not carried over; add a fresh outline afterwards if you need one.',
      },
      {
        heading: 'Merging confidential documents',
        text: 'Contracts, medical records and bank statements are exactly the files you should not upload to a stranger’s server. Here the files are read and combined by your own browser, and the merged PDF is created on your device — you can disconnect from the internet after the page loads and merging still works.',
      },
    ],
    faqs: [
      {
        q: 'Can I merge password-protected PDFs?',
        a: 'Remove the password first with Unlock PDF (you need to know it), then merge the unlocked files.',
      },
      {
        q: 'Can I merge PDFs on my phone?',
        a: 'Yes. The tool runs in mobile browsers on iPhone and Android — pick files from your Files app or downloads and the merged PDF is saved back to your device.',
      },
    ],
  },
  'compress-pdf': {
    useCases: [
      'Get a PDF under an email attachment limit (often 10–25 MB).',
      'Meet the file size cap on job, visa or university application portals.',
      'Shrink phone-scanned documents, which are often several MB per page.',
      'Make large reports faster to download and share in chat apps.',
    ],
    details: [
      {
        heading: 'How the three levels differ',
        text: 'Standard compression redraws each page as an optimized JPEG image. High quality renders pages at 2× and saves at 85% JPEG quality, Medium at 1.5× and 72%, and Maximum at 1.1× and 50% — each step trades sharpness for size. Because pages become images, text is no longer selectable in the result.',
      },
      {
        heading: 'When to use lossless mode',
        text: 'Lossless mode rewrites the PDF’s internal structure without touching page content, so text stays selectable and searchable. It saves less, but it is the right choice for text documents, forms and anything you still need to copy text from.',
      },
      {
        heading: 'You never get a bigger file',
        text: 'If a compressed result would be larger than the original — common for PDFs that are already optimized — the tool returns your original file instead (in standard mode it is labelled “already optimal”).',
      },
    ],
    faqs: [
      {
        q: 'Can I compress several PDFs at once?',
        a: 'Yes. Select multiple files and each one is compressed with the same settings; download them individually or together.',
      },
      {
        q: 'Why is my compressed PDF blurry?',
        a: 'Maximum compression lowers resolution and JPEG quality. Try Medium or High quality, or use lossless mode to keep text perfectly sharp.',
      },
    ],
  },
  'pdf-to-word': {
    useCases: [
      'Update an old CV or cover letter when you only have the PDF.',
      'Reuse clauses from a contract or policy without retyping them.',
      'Edit a report someone sent as PDF, then export it again.',
      'Copy long passages of text into a document with clean paragraphs.',
    ],
    details: [
      {
        heading: 'What the conversion recognizes',
        text: 'The converter reads the text layer of the PDF and rebuilds it as Word paragraphs in reading order. Larger lines are detected as headings (Heading 1 and Heading 2), and rows of text separated by wide gaps — typical of tables and form fields — are turned into Word tables where possible. A blank line separates the content of each PDF page.',
      },
      {
        heading: 'What it does not do',
        text: 'Images, multi-column magazine layouts and exact positioning are not reproduced; the goal is editable text, not a visual copy. If the result says no selectable text was found, the PDF is a scan — run OCR PDF first.',
      },
    ],
    faqs: [
      {
        q: 'Does it work with Google Docs and LibreOffice?',
        a: 'Yes. The output is a standard .docx file that opens in Microsoft Word, Google Docs, LibreOffice Writer and Apple Pages.',
      },
      {
        q: 'Is it safe for a CV or contract?',
        a: 'The PDF is converted inside your browser; neither the PDF nor the Word file is uploaded anywhere, which matters for documents with personal data.',
      },
    ],
  },
  'split-pdf': {
    useCases: [
      'Send only the chapter or section someone actually needs.',
      'Break a large scanned batch into one PDF per document.',
      'Cut a long file into parts that fit an upload size limit.',
      'Separate each page of a multi-page form into its own file.',
    ],
    details: [
      {
        heading: 'Choosing a split mode',
        text: 'Use “Every page separately” to explode a document into single pages, “Every N pages” to cut it into equal chunks (for example every 2 pages for double-sided forms), and “Custom ranges” such as 1-3, 4, 7-9 when you know exactly which parts you want — each range becomes its own PDF.',
      },
      {
        heading: 'Quality and file names',
        text: 'Pages are copied, not re-rendered, so text and images are identical to the original. Output files are named after the source file plus their pages (for example “report (pages-1-3).pdf”), and you can download them one by one or as a single ZIP.',
      },
    ],
    faqs: [
      {
        q: 'Can I pick pages visually instead of typing ranges?',
        a: 'Use Extract Pages, which shows page thumbnails you can click, or Rearrange Pages to reorder and delete pages visually.',
      },
    ],
  },
  'edit-pdf': {
    useCases: [
      'Fix a typo or a date in a PDF without the original Word file.',
      'Fill in a form that has no fillable fields by typing on top of it.',
      'Highlight and comment on a document before sending it back.',
      'Add a logo, stamp or photo to a page.',
      'White out an old address or phone number and type the new one.',
    ],
    details: [
      {
        heading: 'Editing existing text',
        text: '“Edit existing text” lets you click a line that is already in the PDF and retype it. The tool covers the original with white and redraws your text in the closest matching standard font (serif, sans or mono), at the same size and position — usually indistinguishable for ordinary documents.',
      },
      {
        heading: 'Annotation tools',
        text: 'Besides text, the toolbar has freehand drawing, highlighter, rectangles, ellipses, lines and arrows, sticky notes, images and a whiteout tool. Every edit is drawn into the page when you download, so it shows up the same in every PDF viewer.',
      },
      {
        heading: 'Edits versus redaction',
        text: 'Whiteout and replaced text only cover what is underneath — the original stays in the file’s hidden text layer. To remove information for good (account numbers, names, addresses), use Redact, which re-renders the page so the content no longer exists.',
      },
    ],
    faqs: [
      {
        q: 'Do I need to install Acrobat or create an account?',
        a: 'No. The editor runs in your web browser on Windows, Mac, Linux, Chromebook, iPhone and Android, with no installation, account or watermark.',
      },
    ],
  },
  'sign-pdf': {
    useCases: [
      'Sign a rental agreement, offer letter or school form without a printer.',
      'Add initials to every page of a contract.',
      'Sign a PDF on your phone with your finger.',
      'Add your name and the date next to a signature.',
    ],
    details: [
      {
        heading: 'Three ways to create a signature',
        text: 'Draw it with a mouse, trackpad or finger in blue, black or green ink; type your name and choose one of four handwriting-style fonts; or upload a photo or scan of your real signature — a PNG with a transparent background looks most natural.',
      },
      {
        heading: 'Placing it on the page',
        text: 'Sign PDF opens the full editor in signature mode, so after placing your signature you can move and resize it, place it on other pages, and use the text tool to add your printed name or the date before downloading.',
      },
      {
        heading: 'Your signature stays on your device',
        text: 'Signature images are a sensitive piece of personal data. Here the signature is drawn, placed and flattened into the PDF entirely in your browser — it is never uploaded, stored on a server or reused.',
      },
    ],
    faqs: [
      {
        q: 'Can someone remove my signature from the signed PDF?',
        a: 'The signature is drawn into the page content when you download, so it is not a separate, movable layer in ordinary PDF viewers. It is still an image, not a cryptographic signature, so it does not prove the file was unchanged after signing.',
      },
    ],
  },
  'jpg-to-pdf': {
    useCases: [
      'Turn photos of receipts into one PDF for an expense report.',
      'Combine phone pictures of a paper document into a single file.',
      'Send ID or passport photos as the PDF an application form requires.',
      'Make a simple photo album or portfolio PDF.',
    ],
    details: [
      {
        heading: 'Page size options',
        text: '“Fit to image” makes every page exactly the size of its photo, with no borders. A4 and US Letter place each photo centered on a standard page with a small margin, scaled to fit without cropping — the best choice if the PDF will be printed. Tick “Landscape” for wide photos.',
      },
      {
        heading: 'Original quality, no re-compression',
        text: 'JPG files are embedded in the PDF as they are, so there is no extra quality loss. If the resulting file is too big for an upload form, run it through Compress PDF afterwards.',
      },
    ],
    faqs: [
      {
        q: 'Can I mix JPG and PNG images?',
        a: 'Use Image → PDF, which accepts JPG, PNG, WebP, GIF and BMP images in one document.',
      },
    ],
  },
  'pdf-to-jpg': {
    useCases: [
      'Post a page of a PDF on social media or in a chat app.',
      'Insert a PDF page into PowerPoint, Keynote or Google Slides as a picture.',
      'Create a thumbnail or preview image of a document.',
      'Share a single page with someone who has no PDF viewer.',
    ],
    details: [
      {
        heading: 'Picking the right resolution',
        text: '96 DPI matches a screen and keeps files small — fine for chat and web. 150 DPI is a good all-round default with sharp text. 300 DPI is print quality, but each image has four times as many pixels as at 150 DPI. JPG quality (10–100%) controls compression; 80–90% is visually lossless for most pages.',
      },
      {
        heading: 'JPG or PNG?',
        text: 'JPG gives much smaller files for pages with photos. For pages that are mostly text, line art or diagrams, PDF → PNG keeps edges perfectly crisp with no compression artifacts.',
      },
    ],
    faqs: [
      {
        q: 'Can I convert only one page?',
        a: 'Every page is converted. To get a single page, run Extract Pages first and convert the result, or simply keep the image you need from the download.',
      },
    ],
  },
  'word-to-pdf': {
    useCases: [
      'Send a CV or cover letter that looks the same on every device.',
      'Submit an assignment or report where PDF is required.',
      'Convert a document on a computer that has no Microsoft Word installed.',
      'Share a letter that the recipient should not edit by accident.',
    ],
    details: [
      {
        heading: 'What is converted',
        text: 'The converter reads the .docx file directly and lays out its paragraphs, headings, bold and italic text, left/center/right alignment, bullet lists and tables in a clean PDF. Content stays in document order, and the text in the PDF remains selectable and searchable.',
      },
      {
        heading: 'When to use Word’s own export instead',
        text: 'Images, text boxes, headers and footers, and exact fonts and spacing are simplified. For a pixel-perfect copy of a heavily designed document, use File → Save as PDF in Word; for everyday letters, CVs and reports this tool is quick and private.',
      },
    ],
    faqs: [
      {
        q: 'Do I need Microsoft Word installed?',
        a: 'No. The .docx file is read by the browser itself, so it works on Chromebooks, phones and computers without Office.',
      },
    ],
  },
  'redact-pdf': {
    useCases: [
      'Remove account numbers before sharing a bank statement.',
      'Hide names and addresses in documents for a court filing or FOIA request.',
      'Strip patient details from medical records before sending them on.',
      'Black out salary or ID numbers on a payslip or contract.',
    ],
    details: [
      {
        heading: 'How the redaction works',
        text: 'You drag black boxes over anything sensitive. When you apply them, every page that has a box is rendered to an image at 2× resolution with the boxes burned in, so the text, images and vector content beneath them are gone from the file — not just hidden. Pages without boxes are copied unchanged and keep their selectable text.',
      },
      {
        heading: 'Metadata is cleared too',
        text: 'Document properties such as title and author can leak names. The redacted PDF is written with fresh, empty metadata, so nothing from the original file’s properties carries over.',
      },
      {
        heading: 'Check before you share',
        text: 'Scroll through every page before applying — a missed occurrence of a name or number is the most common redaction mistake. After downloading, try searching the PDF for the redacted text to confirm it is gone.',
      },
    ],
    faqs: [
      {
        q: 'Is it safe to redact sensitive documents online?',
        a: 'With most online tools the unredacted document is uploaded first. Here it never leaves your browser, so the sensitive original is only ever on your own device.',
      },
    ],
  },
}
