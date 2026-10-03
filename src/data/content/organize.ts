import type { ToolContent } from './types'

/** Organize category + page-level edits (numbers, watermark, header/footer, crop). */
export const ORGANIZE_CONTENT: Record<string, ToolContent> = {
  'merge-pdf': {
    intro:
      'Merge PDF combines two or more PDF files into a single document. It is the quickest way to join scanned pages, put a cover letter in front of a report, or bundle invoices and receipts into one file you can send or archive.',
    steps: [
      'Drop two or more PDF files onto the page, or click to choose them.',
      'Use the ↑ and ↓ arrows to put the files in the order you want.',
      'Click “Merge PDF” and download the combined document.',
    ],
    faqs: [
      {
        q: 'Is there a limit on how many PDFs I can merge?',
        a: 'There is no fixed limit. Because merging happens in your browser, the practical limit is your device’s memory — dozens of ordinary documents merge in seconds.',
      },
      {
        q: 'Does merging reduce quality?',
        a: 'No. Pages are copied as-is into the new document, so text stays selectable and images keep their original resolution.',
      },
      {
        q: 'Can I merge only some pages of a file?',
        a: 'Merge whole files first, then use Delete Pages or Rearrange Pages on the result — or run Extract Pages on each source file before merging.',
      },
    ],
  },
  'split-pdf': {
    intro:
      'Split PDF breaks one document into several smaller ones. Split by custom page ranges such as 1-3, 4, 7-9, cut the file into equal chunks of N pages, or save every page as its own PDF.',
    steps: [
      'Choose the PDF you want to split.',
      'Pick a split mode: custom ranges, every N pages, or every page separately.',
      'Enter your ranges or chunk size, then click “Split PDF”.',
      'Download the parts individually or all together as a ZIP.',
    ],
    faqs: [
      {
        q: 'How do I write page ranges?',
        a: 'Separate ranges with commas and use a dash for spans — for example “1-3, 4, 7-9” creates three files: pages 1–3, page 4, and pages 7–9.',
      },
      {
        q: 'Will the split files be smaller?',
        a: 'Usually, yes. Each output only contains its own pages, though shared resources such as embedded fonts may be included in each part.',
      },
      {
        q: 'Can I split a password-protected PDF?',
        a: 'Remove the password first with Unlock PDF (you need to know it), then split the unlocked file.',
      },
    ],
  },
  'organize-pdf': {
    intro:
      'Rearrange Pages shows every page of your PDF as a thumbnail so you can reorganize the document visually. Drag pages into a new order, rotate the ones that are sideways, duplicate or delete pages, then save the result.',
    steps: [
      'Open your PDF — every page appears as a thumbnail.',
      'Drag thumbnails to reorder them; use the page buttons to rotate, duplicate or delete.',
      'Check the preview, then download the reorganized PDF.',
    ],
    faqs: [
      {
        q: 'Can I undo a change before downloading?',
        a: 'Nothing is written to your file until you download, so you can keep adjusting the order and rotation — or reload the file to start over.',
      },
      {
        q: 'Does rearranging change the page content?',
        a: 'No. Pages are moved, rotated or copied as whole pages; their text, images and links are left untouched.',
      },
    ],
  },
  'extract-pages': {
    intro:
      'Extract Pages pulls the pages you need out of a larger PDF and saves them as a new file. It is ideal for sharing a single chapter, a signed page, or just the relevant part of a long contract.',
    steps: [
      'Choose your PDF and click the page thumbnails you want, or type a range such as 2-5, 9.',
      'Optionally tick “Save each page as a separate PDF”.',
      'Click “Extract Pages” and download the new file (or ZIP).',
    ],
    faqs: [
      {
        q: 'Does extracting change the original file?',
        a: 'No. Your original PDF is never modified — the extracted pages are saved as a brand-new document.',
      },
      {
        q: 'What is the difference between Extract Pages and Split PDF?',
        a: 'Extract Pages keeps only the pages you pick. Split PDF divides the whole document into several parts so that every page ends up somewhere.',
      },
    ],
  },
  'delete-pages': {
    intro:
      'Delete Pages removes blank, duplicate or unwanted pages from a PDF and saves a clean copy. Select pages visually from the thumbnails or type the page numbers you want gone.',
    steps: [
      'Choose your PDF.',
      'Click the pages to remove, or enter numbers and ranges such as 1, 4-6.',
      'Click “Delete Pages” and download the trimmed PDF.',
    ],
    faqs: [
      {
        q: 'Can I recover a deleted page?',
        a: 'Your original file is never changed, so the deleted pages are still in it. Only the downloaded copy has them removed.',
      },
      {
        q: 'Is deleted page content really removed?',
        a: 'Yes. Removed pages are not copied into the new file at all, so their text and images are not hidden inside it.',
      },
    ],
  },
  'rotate-pdf': {
    intro:
      'Rotate Pages fixes sideways or upside-down pages — common with scanned documents and phone photos. See every page, turn individual pages 90° at a time, or rotate the whole document in one click.',
    steps: [
      'Open the PDF to see a thumbnail of every page.',
      'Click the rotate button on any page, or use “Rotate all”.',
      'Check the live preview, then download the corrected PDF.',
    ],
    faqs: [
      {
        q: 'Is rotation permanent?',
        a: 'Yes. The new orientation is saved into the downloaded PDF, so it opens correctly in every viewer.',
      },
      {
        q: 'Does rotating reduce quality?',
        a: 'No. Rotation only changes the page’s orientation setting; text and images are not re-compressed.',
      },
    ],
  },
  'duplicate-pages': {
    intro:
      'Duplicate Pages repeats selected pages directly after the originals. Use it to make extra copies of a form page, repeat a template sheet, or prepare a document for double-sided printing.',
    steps: [
      'Choose your PDF.',
      'Select the pages to duplicate — leave it empty to duplicate every page.',
      'Click “Duplicate Pages” and download the result.',
    ],
    faqs: [
      {
        q: 'Where are the copies placed?',
        a: 'Each copy is inserted immediately after its original page. Use Rearrange Pages afterwards if you want them somewhere else.',
      },
      {
        q: 'Can I make more than one copy of a page?',
        a: 'Run the tool again on the downloaded file to add another copy, or click a page’s Duplicate button more than once in Rearrange Pages.',
      },
    ],
  },
  'reverse-pages': {
    intro:
      'Reverse Pages flips the page order of a PDF so the last page comes first. It fixes documents scanned back-to-front by a sheet feeder, and also lets you drag pages into any custom order.',
    steps: [
      'Open your PDF to see all pages.',
      'Click “Reverse order”, or drag individual pages to rearrange them.',
      'Download the reordered PDF.',
    ],
    faqs: [
      {
        q: 'Why are my scanned pages in reverse order?',
        a: 'Many document feeders scan the top sheet of a face-up stack first, which produces a back-to-front PDF. One click on “Reverse order” fixes it.',
      },
    ],
  },
  'crop-pdf': {
    intro:
      'Crop PDF trims white margins or cuts pages down to a selected area. Use it to remove scanner borders, focus on a figure, or make pages easier to read on a phone or e-reader.',
    steps: [
      'Open your PDF.',
      'Drag a crop box over the area you want to keep.',
      'Apply the crop and download the trimmed document.',
    ],
    faqs: [
      {
        q: 'Is cropped content deleted?',
        a: 'Cropping hides the area outside the box in every viewer, but the underlying content can remain in the file. To remove sensitive content permanently, use Redact instead.',
      },
      {
        q: 'Does cropping lower image quality?',
        a: 'No. The page is not re-rendered, so text stays sharp and selectable.',
      },
    ],
  },
  'page-numbers': {
    intro:
      'Add Page Numbers stamps numbers on every page of a PDF. Choose one of six positions, a format such as “1”, “Page 1 of N” or “- 1 -”, the starting number and the font size.',
    steps: [
      'Choose your PDF.',
      'Pick the position, number format, starting number and font size.',
      'Click “Add Page Numbers” and download the numbered PDF.',
    ],
    faqs: [
      {
        q: 'Can numbering start at a number other than 1?',
        a: 'Yes. Set “Start at” to any number — handy when the PDF is one part of a longer document.',
      },
      {
        q: 'Can I skip numbering the cover page?',
        a: 'Extract the cover with Extract Pages, number the remaining pages, then merge the two files back together with Merge PDF.',
      },
    ],
  },
  'watermark-pdf': {
    intro:
      'Watermark adds a text stamp such as CONFIDENTIAL, DRAFT or your company name across every page. Control the font size, opacity, color, and whether the text runs straight or diagonally at 45°.',
    steps: [
      'Choose your PDF.',
      'Type the watermark text and adjust size, opacity, color and angle.',
      'Click “Watermark” and download the stamped document.',
    ],
    faqs: [
      {
        q: 'Can a watermark be removed later?',
        a: 'A text watermark is drawn onto each page, so it is not removable in normal PDF viewers. Keep your original file if you may need an unwatermarked copy.',
      },
      {
        q: 'Will the watermark hide my content?',
        a: 'Use a low opacity (for example 15–30%) so the text underneath stays readable.',
      },
    ],
  },
  'header-footer': {
    intro:
      'Header / Footer adds repeating text to the top and bottom of every page — a document title, a confidentiality notice, or page numbers. Placeholders insert the page number, total pages and today’s date automatically.',
    steps: [
      'Choose your PDF.',
      'Type header and/or footer text, using {page}, {total} and {date} where needed.',
      'Choose the alignment and font size, then apply and download.',
    ],
    faqs: [
      {
        q: 'Which placeholders can I use?',
        a: '{page} becomes the current page number, {total} the number of pages, and {date} today’s date — for example “Page {page} of {total}”.',
      },
      {
        q: 'Can I add only a footer?',
        a: 'Yes. Leave the header field empty and only the footer is added (and vice versa).',
      },
    ],
  },
}
