import type { ToolContent } from './types'

/** Convert from PDF and convert to PDF. */
export const CONVERT_CONTENT: Record<string, ToolContent> = {
  'pdf-to-word': {
    intro:
      'PDF to Word extracts the text of a PDF into an editable Microsoft Word (.docx) document. Paragraphs and reading order are preserved, so you can rework a report, reuse contract wording, or edit a CV without retyping it.',
    steps: [
      'Choose the PDF you want to convert.',
      'Click “PDF → Word”.',
      'Download the .docx file and open it in Word, Google Docs or LibreOffice.',
    ],
    faqs: [
      {
        q: 'Will the Word file look exactly like the PDF?',
        a: 'Text and paragraph flow are kept, but complex layouts, multi-column pages and images are not reproduced. It is best for text-heavy documents.',
      },
      {
        q: 'Can I convert a scanned PDF to Word?',
        a: 'A scan contains only images, so there is no text to extract. Run OCR PDF first to recognize the text, then convert.',
      },
    ],
  },
  'pdf-to-excel': {
    intro:
      'PDF to Excel detects table-like rows in a PDF and exports them to an Excel spreadsheet (.xlsx) or CSV file, so you can sort, filter and calculate with data from bank statements, price lists and reports.',
    steps: [
      'Choose a PDF that contains tables.',
      'Pick the output format: Excel (.xlsx) or CSV.',
      'Convert and download the spreadsheet.',
    ],
    faqs: [
      {
        q: 'How accurate is table detection?',
        a: 'Column detection is heuristic. It works best on simple, grid-like tables with clear columns; merged cells and complex layouts may need tidying afterwards.',
      },
      {
        q: 'Should I choose XLSX or CSV?',
        a: 'Choose XLSX to open the result directly in Excel or Google Sheets. Choose CSV for importing into databases, accounting software or scripts.',
      },
    ],
  },
  'pdf-to-powerpoint': {
    intro:
      'PDF to PowerPoint turns every PDF page into a full-size slide in a .pptx presentation. It is a fast way to present a PDF report or handout in PowerPoint, Keynote or Google Slides.',
    steps: [
      'Choose your PDF.',
      'Click “PDF → PowerPoint”.',
      'Download the .pptx and open it in your presentation app.',
    ],
    faqs: [
      {
        q: 'Can I edit the text on the slides?',
        a: 'Each slide contains an image of the page, so it looks identical to the PDF but the text is not editable. Add new text boxes on top in PowerPoint if needed.',
      },
    ],
  },
  'pdf-to-jpg': {
    intro:
      'PDF to JPG renders every page of a PDF as a high-quality JPG image. Choose 96, 150 or 300 DPI and the JPG quality — ideal for sharing pages on social media, in chats, or inserting them into slides.',
    steps: [
      'Choose one or more PDF files.',
      'Pick a resolution (96, 150 or 300 DPI) and JPG quality.',
      'Convert and download the images, or all of them as a ZIP.',
    ],
    faqs: [
      {
        q: 'Which resolution should I choose?',
        a: '96 DPI is fine for screens, 150 DPI is a good all-round choice, and 300 DPI is best for printing — at the cost of larger files.',
      },
      {
        q: 'JPG or PNG?',
        a: 'JPG gives smaller files for photos and scans. PNG is lossless and keeps text and line art perfectly crisp.',
      },
    ],
  },
  'pdf-to-png': {
    intro:
      'PDF to PNG renders each page as a lossless PNG image at 96, 150 or 300 DPI. PNG keeps text, diagrams and screenshots perfectly sharp, making it the best format for documentation and presentations.',
    steps: [
      'Choose one or more PDF files.',
      'Pick a resolution: 96, 150 or 300 DPI.',
      'Convert and download each page as a PNG, or all as a ZIP.',
    ],
    faqs: [
      {
        q: 'Why are PNG files larger than JPG?',
        a: 'PNG is lossless, so it stores every pixel exactly. Use PDF to JPG if file size matters more than perfect sharpness.',
      },
    ],
  },
  'pdf-to-svg': {
    intro:
      'PDF to SVG wraps each rendered page in a scalable SVG file that can be placed in web pages and design tools such as Figma, Illustrator or Inkscape.',
    steps: ['Choose your PDF.', 'Click “PDF → SVG”.', 'Download one SVG per page.'],
    faqs: [
      {
        q: 'Are the SVGs true vector graphics?',
        a: 'No. Each page is rendered as an image and embedded inside the SVG. True vector extraction is not supported in the browser.',
      },
    ],
  },
  'pdf-to-tiff': {
    intro:
      'PDF to TIFF exports all pages into a single uncompressed multi-page TIFF file — the format many archives, fax systems and document-management tools require.',
    steps: ['Choose your PDF.', 'Click “PDF → TIFF”.', 'Download the multi-page TIFF file.'],
    faqs: [
      {
        q: 'Why is the TIFF so large?',
        a: 'The TIFF is uncompressed to maximize compatibility with archival and fax software, so it is much larger than the original PDF.',
      },
    ],
  },
  'pdf-to-html': {
    intro:
      'PDF to HTML converts the text of a PDF into a clean, simple HTML document — ready to publish on a website, paste into a CMS, or read on any device.',
    steps: ['Choose your PDF.', 'Click “PDF → HTML”.', 'Download the .html file.'],
    faqs: [
      {
        q: 'Are images and layout included?',
        a: 'The converter focuses on readable text and structure. Images and exact page layout are not reproduced.',
      },
    ],
  },
  'pdf-to-txt': {
    intro:
      'PDF to TXT extracts all text from one or more PDFs into plain .txt files. Plain text is perfect for search, note-taking apps, scripts, and pasting into AI tools without formatting noise.',
    steps: ['Choose one or more PDFs.', 'Click “PDF → TXT”.', 'Download the text files.'],
    faqs: [
      {
        q: 'Why is my text file empty?',
        a: 'The PDF is probably a scan, which contains images rather than text. Use OCR PDF to recognize the text first.',
      },
    ],
  },
  'pdf-to-markdown': {
    intro:
      'PDF to Markdown extracts the text of a PDF and detects headings, producing a .md file you can use in Obsidian, Notion, GitHub, static-site generators and documentation tools.',
    steps: ['Choose your PDF.', 'Click “PDF → Markdown”.', 'Download the .md file.'],
    faqs: [
      {
        q: 'How are headings detected?',
        a: 'Lines set noticeably larger than the body text are treated as headings. Results are best for documents with a clear heading hierarchy.',
      },
    ],
  },
  'pdf-to-epub': {
    intro:
      'PDF to EPUB builds a reflowable e-book from the text of a PDF, so it reads comfortably on Kindle, Kobo, Apple Books and phone e-readers instead of pinching and zooming fixed pages.',
    steps: [
      'Choose your PDF.',
      'Click “PDF → EPUB”.',
      'Download the .epub and open it in your e-reader app.',
    ],
    faqs: [
      {
        q: 'Can I read the EPUB on a Kindle?',
        a: 'Yes. Recent Kindles accept EPUB through Amazon’s Send to Kindle service, which converts it automatically.',
      },
    ],
  },
  'pdf-to-rtf': {
    intro:
      'PDF to RTF exports the text of a PDF as Rich Text Format, which opens in virtually every word processor — Word, WordPad, TextEdit, LibreOffice and Pages.',
    steps: ['Choose your PDF.', 'Click “PDF → RTF”.', 'Download the .rtf file.'],
    faqs: [
      {
        q: 'When should I use RTF instead of Word?',
        a: 'Choose RTF for maximum compatibility with older or simpler editors. Choose PDF to Word if you will edit in Microsoft Word or Google Docs.',
      },
    ],
  },
  'jpg-to-pdf': {
    intro:
      'JPG to PDF combines JPG photos into a single PDF document — receipts, scanned pages, ID photos or a photo album. Choose “fit to image”, A4 or US Letter pages and portrait or landscape orientation.',
    steps: [
      'Choose one or more JPG images.',
      'Arrange them in order with the arrows.',
      'Pick the page size and orientation, then convert and download.',
    ],
    faqs: [
      {
        q: 'Are my photos compressed?',
        a: 'No. JPGs are embedded as they are, so the PDF keeps your original image quality. Use Compress PDF afterwards if you need a smaller file.',
      },
      {
        q: 'Can I convert iPhone HEIC photos?',
        a: 'HEIC is not supported directly. Export the photos as JPG first (most phones can share as JPG), then convert them.',
      },
    ],
  },
  'png-to-pdf': {
    intro:
      'PNG to PDF combines PNG images — screenshots, diagrams, scans — into a single PDF. Transparent areas are placed on a white background so they print and display correctly.',
    steps: [
      'Choose one or more PNG files.',
      'Arrange them in order.',
      'Pick the page size and orientation, then convert and download.',
    ],
    faqs: [
      {
        q: 'What happens to transparency?',
        a: 'Transparent areas are shown on white, which matches how the PDF will look when printed.',
      },
    ],
  },
  'image-to-pdf': {
    intro:
      'Image to PDF turns any mix of PNG, JPG, WebP, GIF and BMP images into one PDF. It is the easiest way to bundle mixed screenshots and photos into a single shareable document.',
    steps: [
      'Choose your images — formats can be mixed.',
      'Put them in order with the arrows.',
      'Pick the page size and orientation, then convert and download.',
    ],
    faqs: [
      {
        q: 'Which formats can I mix?',
        a: 'PNG, JPG, WebP, GIF (first frame) and BMP can all be combined into the same PDF.',
      },
    ],
  },
  'svg-to-pdf': {
    intro:
      'SVG to PDF converts SVG files — logos, icons, charts and illustrations — into PDF pages that can be printed, shared and opened anywhere.',
    steps: ['Choose one or more SVG files.', 'Click “SVG → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Does the PDF stay vector?',
        a: 'No. SVGs are rasterized (rendered to pixels) before being placed in the PDF.',
      },
    ],
  },
  'word-to-pdf': {
    intro:
      'Word to PDF converts .docx documents into PDF so they look the same on every device and can’t be accidentally edited. Paragraphs, headings, bold text and lists convert well.',
    steps: ['Choose a .docx file.', 'Click “Word → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Are images and tables converted?',
        a: 'Images, tables and exact layout are simplified. For a pixel-perfect copy of a complex document, use Word’s own File → Save as PDF.',
      },
      {
        q: 'Can I convert old .doc files?',
        a: 'Only the modern .docx format is supported. Re-save a .doc file as .docx in Word or LibreOffice first.',
      },
    ],
  },
  'excel-to-pdf': {
    intro:
      'Excel to PDF turns .xlsx spreadsheets and .csv files into neat PDF tables that are easy to print, email and archive.',
    steps: ['Choose an .xlsx or .csv file.', 'Click “Excel → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Are formulas and charts included?',
        a: 'Cell values are converted into tables. Charts, images and formatting such as colors are not reproduced.',
      },
    ],
  },
  'powerpoint-to-pdf': {
    intro:
      'PowerPoint to PDF converts the text of .pptx slides into PDF pages — handy for handouts, speaker notes and sharing slide content with people who don’t have PowerPoint.',
    steps: ['Choose a .pptx file.', 'Click “PowerPoint → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Will my slide design be kept?',
        a: 'Slide text is preserved, but images, themes and exact layout are simplified. Use PowerPoint’s Export to PDF for a design-faithful copy.',
      },
    ],
  },
  'html-to-pdf': {
    intro:
      'HTML to PDF converts the readable content of an .html file into a tidy PDF — useful for saving articles, documentation or exported web pages for offline reading.',
    steps: ['Choose an .html or .htm file.', 'Click “HTML → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Why doesn’t the PDF look like the web page?',
        a: 'The tool converts the text content, not the styling. For a pixel-perfect copy, open the page in your browser and use Print → Save as PDF.',
      },
    ],
  },
  'text-to-pdf': {
    intro:
      'Text to PDF turns plain .txt and Markdown (.md) files into clean, readable PDF documents — notes, logs, README files and drafts that you want to print or share.',
    steps: ['Choose one or more .txt or .md files.', 'Click “Text → PDF”.', 'Download the PDF.'],
    faqs: [
      {
        q: 'Is Markdown formatting applied?',
        a: 'Yes. In .md files, headings, bullet lists, **bold**, *italic* and `code` are styled. Long lines are wrapped automatically to fit the page.',
      },
    ],
  },
}
