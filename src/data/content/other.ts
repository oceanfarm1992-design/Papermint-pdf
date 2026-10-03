import type { ToolContent } from './types'

/** OCR, security, compression, images, compare and local-AI tools. */
export const OTHER_CONTENT: Record<string, ToolContent> = {
  'ocr-pdf': {
    intro:
      'OCR PDF recognizes the text in scanned or photographed PDFs so you can copy, search and reuse it. It supports 20 languages, including English, Spanish, French, German, Chinese, Japanese, Korean, Arabic and Hindi.',
    steps: [
      'Choose a scanned PDF.',
      'Select the document’s language.',
      'Click “OCR PDF” and wait while each page is recognized.',
      'Download the extracted text.',
    ],
    faqs: [
      {
        q: 'Why does OCR download something?',
        a: 'The first time you use a language, its recognition model (a few MB) is downloaded once and cached by your browser. Your document itself is never sent anywhere.',
      },
      {
        q: 'How can I get better OCR results?',
        a: 'Use clear, straight scans of at least 300 DPI and pick the correct language. Image Enhancement can boost contrast on faded scans first.',
      },
      {
        q: 'I want a searchable PDF, not a text file.',
        a: 'Use Searchable PDF, which keeps the original page images and adds an invisible text layer on top.',
      },
    ],
  },
  'ocr-image': {
    intro:
      'OCR Image extracts text from photos, screenshots and scanned images — receipts, whiteboards, book pages and signs. Choose from 12 languages and save the result as a plain-text file.',
    steps: [
      'Choose one or more images (PNG, JPG, WebP, GIF or BMP).',
      'Select the language of the text.',
      'Run OCR and download the recognized text as a .txt file.',
    ],
    faqs: [
      {
        q: 'Does it read handwriting?',
        a: 'OCR is designed for printed text. Neat handwriting is sometimes recognized, but results are unreliable.',
      },
      {
        q: 'Is my image uploaded to a cloud OCR service?',
        a: 'No. Recognition runs on the Tesseract engine inside your browser; only the language model is downloaded the first time.',
      },
    ],
  },
  'searchable-pdf': {
    intro:
      'Searchable PDF adds an invisible text layer to scanned PDFs. The pages look exactly the same, but you can now search with Ctrl+F, select and copy text, and let document systems index the file.',
    steps: [
      'Choose a scanned PDF.',
      'Select the document language.',
      'Run the tool and download the searchable PDF.',
    ],
    faqs: [
      {
        q: 'Which languages are supported?',
        a: 'English, Spanish, French, German, Italian and Portuguese. The invisible layer uses standard PDF fonts, which cover Latin-alphabet languages only.',
      },
      {
        q: 'Does the scan’s appearance change?',
        a: 'No. The original page images are kept; the recognized text is placed invisibly behind them.',
      },
    ],
  },
  'protect-pdf': {
    intro:
      'Protect PDF encrypts a document with a password so only people who know it can open the file. You can also choose whether readers are allowed to print it or copy its text.',
    steps: [
      'Choose the PDF to protect.',
      'Enter a strong password and set the print and copy permissions.',
      'Click “Protect PDF” and download the encrypted file.',
    ],
    faqs: [
      {
        q: 'What happens if I forget the password?',
        a: 'The password cannot be recovered — not by us, and not by this tool. Store it in a password manager and keep an unencrypted copy somewhere safe.',
      },
      {
        q: 'Is my password sent anywhere?',
        a: 'No. Encryption happens entirely in your browser, so neither the password nor the file leaves your device.',
      },
    ],
  },
  'unlock-pdf': {
    intro:
      'Unlock PDF removes the password from a PDF you are allowed to open, so you don’t have to type it every time. You need to know the current password — the tool does not crack or bypass encryption.',
    steps: [
      'Choose the password-protected PDF.',
      'Enter its current password.',
      'Click “Unlock PDF” and download the unencrypted copy.',
    ],
    faqs: [
      {
        q: 'Can it unlock a PDF if I don’t know the password?',
        a: 'No. Privacy PDF Tools never cracks passwords. Ask the document’s owner for the password or an unprotected copy.',
      },
    ],
  },
  'remove-password': {
    intro:
      'Remove Password decrypts a PDF using the password you already know and saves a copy that opens without a prompt — handy for archiving statements and payslips or merging them with other files.',
    steps: [
      'Choose the protected PDF.',
      'Type its current password.',
      'Download the copy without a password.',
    ],
    faqs: [
      {
        q: 'Is this different from Unlock PDF?',
        a: 'No — it is the same tool under a different name. Both need the current password.',
      },
    ],
  },
  'redact-pdf': {
    intro:
      'Redact permanently blacks out sensitive information such as names, account numbers and addresses. Pages are re-rendered after redaction, so the hidden text is truly gone — not just covered by a black box.',
    steps: [
      'Open your PDF.',
      'Draw boxes over everything that must be removed.',
      'Apply the redactions and download the redacted PDF.',
    ],
    faqs: [
      {
        q: 'Why not just draw a black rectangle?',
        a: 'A drawn rectangle only covers text — it can still be selected, copied or found by search underneath. Redact re-renders the page so the content no longer exists in the file.',
      },
      {
        q: 'Can I still select text after redacting?',
        a: 'Redacted pages are re-rendered as images, so text on those pages is no longer selectable. Run Searchable PDF afterwards if you need it searchable again.',
      },
    ],
  },
  'remove-metadata': {
    intro:
      'Metadata Removal strips hidden document information — author name, title, subject, keywords, creation and modification dates, and the software used to make the PDF — before you share or publish a file.',
    steps: ['Choose one or more PDFs.', 'Click “Metadata Removal”.', 'Download the cleaned files.'],
    faqs: [
      {
        q: 'Why remove metadata?',
        a: 'Metadata can reveal who wrote a document, when, and with which software — details you may not want to share with clients, publishers or the public.',
      },
      {
        q: 'Does it change the visible content?',
        a: 'No. Only the hidden document properties are removed; pages look exactly the same.',
      },
    ],
  },
  'compress-pdf': {
    intro:
      'Compress PDF reduces file size so documents fit email attachment limits and upload forms. Choose high quality, medium or maximum compression — or a lossless mode that keeps text selectable.',
    steps: [
      'Choose one or more PDF files.',
      'Pick a compression level, or tick “Lossless mode”.',
      'Click “Compress PDF” and download the smaller files.',
    ],
    faqs: [
      {
        q: 'Which mode should I use?',
        a: 'Standard modes re-encode pages as optimized images, giving the biggest savings but making text unselectable. Lossless mode keeps text and saves less — best for text documents.',
      },
      {
        q: 'How much smaller will my PDF get?',
        a: 'It depends on the content. Scans and image-heavy files often shrink a lot; text-only PDFs are usually small already.',
      },
    ],
  },
  'compress-images': {
    intro:
      'Compress Images reduces the file size of JPG, PNG and WebP pictures for faster websites, smaller email attachments and upload limits — with three quality levels to choose from.',
    steps: [
      'Choose one or more images.',
      'Pick high quality, medium or maximum compression.',
      'Download the compressed images, individually or as a ZIP.',
    ],
    faqs: [
      {
        q: 'Will my images look worse?',
        a: 'High quality keeps differences barely visible. Maximum compression produces the smallest files with some visible loss.',
      },
    ],
  },
  'extract-images': {
    intro:
      'Extract Images pulls every embedded picture out of a PDF and saves them as PNG files — photos from a brochure, figures from a paper, or logos from a document.',
    steps: [
      'Choose your PDF.',
      'Click “Extract Images”.',
      'Download the images individually or as a ZIP.',
    ],
    faqs: [
      {
        q: 'Why are some images missing?',
        a: 'Only embedded raster images are extracted. Vector drawings and charts made of lines are not images — use PDF to PNG to capture whole pages instead.',
      },
    ],
  },
  'image-enhance': {
    intro:
      'Image Enhancement improves scans and photos of documents. Adjust brightness and contrast, sharpen soft text, or convert to grayscale for cleaner prints and better OCR results.',
    steps: [
      'Choose one or more images.',
      'Adjust brightness, contrast, sharpening and grayscale.',
      'Download the enhanced images.',
    ],
    faqs: [
      {
        q: 'Can this improve OCR accuracy?',
        a: 'Often, yes. Higher contrast, grayscale and sharpening make faded or blurry text easier for OCR Image to read.',
      },
    ],
  },
  'compare-pdf': {
    intro:
      'Compare PDFs shows two versions of a document side by side and highlights the visual differences, so you can spot what changed between drafts, contracts or design proofs.',
    steps: [
      'Choose the two PDFs you want to compare.',
      'Browse the pages side by side.',
      'Review the highlighted differences.',
    ],
    faqs: [
      {
        q: 'Does it compare text or appearance?',
        a: 'It compares how the pages look, so it catches changes to text, images and layout alike.',
      },
    ],
  },
  'summarize-pdf': {
    intro:
      'Summarize Text creates a short extractive summary of a PDF by picking its most representative sentences. It runs entirely on your device — no cloud AI service ever sees your document.',
    steps: [
      'Choose your PDF.',
      'Set how many sentences the summary should contain.',
      'Run the tool and read or download the summary.',
    ],
    faqs: [
      {
        q: 'Is this ChatGPT-style AI?',
        a: 'No. It uses local statistical analysis to select key sentences from the text. Nothing is generated and nothing is sent to an AI provider.',
      },
      {
        q: 'Does it work on scanned PDFs?',
        a: 'Scans contain no text. Run OCR PDF first, then summarize the result.',
      },
    ],
  },
  'keywords-pdf': {
    intro:
      'Keyword Extraction lists the most important terms and phrases in a PDF, ranked by frequency analysis done locally in your browser. Use it to tag documents, research topics, or check SEO focus terms.',
    steps: ['Choose your PDF.', 'Click “Keyword Extraction”.', 'Review or download the ranked list.'],
    faqs: [
      {
        q: 'Are common words like “the” ignored?',
        a: 'Yes. Common stop words are filtered out so the list focuses on meaningful terms.',
      },
    ],
  },
  'outline-pdf': {
    intro:
      'Document Outline builds a table of contents for a PDF. It reads existing bookmarks or, when there are none, detects headings from the text — a quick way to see the structure of a long report.',
    steps: ['Choose your PDF.', 'Click “Document Outline”.', 'Review or download the outline.'],
    faqs: [
      {
        q: 'My PDF has no bookmarks — will it still work?',
        a: 'Yes. The tool falls back to detecting headings from text size, so most structured documents still produce a useful outline.',
      },
    ],
  },
}
