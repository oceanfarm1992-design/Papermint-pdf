import type { ToolContent } from './types'

/** Editor-based tools and forms / signatures. */
export const EDIT_CONTENT: Record<string, ToolContent> = {
  'edit-pdf': {
    intro:
      'Edit PDF is a full in-browser editor: add text, draw, highlight, insert shapes, sticky notes and images, white out content, and even retype existing lines of text. It works on any ordinary PDF without installing software or creating an account.',
    steps: [
      'Open your PDF in the editor.',
      'Pick a tool from the toolbar — text, draw, highlight, shapes, notes, image or whiteout.',
      'Click or drag on the page to place your edits; use “Edit existing text” to retype a line.',
      'Download the edited PDF.',
    ],
    faqs: [
      {
        q: 'Can I change text that is already in the PDF?',
        a: 'Yes. “Edit existing text” lets you click a line and retype it. The original is covered and redrawn in a matching standard font, size and position.',
      },
      {
        q: 'Is replaced text fully removed?',
        a: 'No — the original text stays in the hidden text layer. For confidential changes, use Redact, which removes content permanently.',
      },
      {
        q: 'Does it work with every language?',
        a: 'New text works best with Latin-script languages. Unusual embedded fonts and scripts such as Arabic are approximated with the closest standard font.',
      },
    ],
  },
  'add-text': {
    intro:
      'Add Text lets you type anywhere on a PDF page — fill in a form that has no fields, add a note to a contract, or label a diagram. Position, size and color the text, then save a new PDF.',
    steps: [
      'Open your PDF.',
      'Click where you want the text and start typing.',
      'Adjust font size and color, drag the box into place, then download.',
    ],
    faqs: [
      {
        q: 'Can I fill in a form that has no fillable fields?',
        a: 'Yes. Add Text places text anywhere, so it works on flat, scanned or printed-style forms. For real form fields, use Fill Forms.',
      },
      {
        q: 'Will the added text be searchable?',
        a: 'Yes. Text you type is written as real PDF text, so it can be selected and searched.',
      },
    ],
  },
  'draw-pdf': {
    intro:
      'Draw adds freehand pen strokes to PDF pages. Circle important figures, sketch corrections on a drawing, add initials, or mark up homework — with a mouse, trackpad, touchscreen or stylus.',
    steps: [
      'Open your PDF and select the pen.',
      'Choose a color and thickness, then draw directly on the page.',
      'Download the annotated PDF.',
    ],
    faqs: [
      {
        q: 'Does drawing work on a phone or tablet?',
        a: 'Yes. Touch and stylus input work in modern mobile browsers, so you can draw with your finger or an Apple Pencil.',
      },
      {
        q: 'Is Draw suitable for signatures?',
        a: 'You can draw initials, but Sign PDF is designed for signatures — it lets you draw, type or upload one and place it precisely.',
      },
    ],
  },
  'highlight-pdf': {
    intro:
      'Highlight adds a semi-transparent marker over text and images in a PDF, just like a highlighter pen on paper. Use it to emphasize key passages in study notes, contracts or reports before sharing them.',
    steps: [
      'Open your PDF and choose the highlighter.',
      'Drag across the content you want to emphasize.',
      'Download the highlighted PDF.',
    ],
    faqs: [
      {
        q: 'Does highlighting hide the text underneath?',
        a: 'No. The highlight is semi-transparent, so the text stays fully readable and selectable.',
      },
      {
        q: 'Can I highlight a scanned document?',
        a: 'Yes. Highlights are drawn on top of the page, so they work on scans as well as digital PDFs.',
      },
    ],
  },
  'shapes-pdf': {
    intro:
      'Shapes adds rectangles, ellipses, lines and arrows to PDF pages. Point to a detail on a plan, box a total on an invoice, or call out a change in a review.',
    steps: [
      'Open your PDF and select a shape: rectangle, ellipse, line or arrow.',
      'Drag on the page to draw it, then adjust color and stroke.',
      'Download the annotated PDF.',
    ],
    faqs: [
      {
        q: 'Can shapes be filled?',
        a: 'Shapes are drawn as outlines for marking up content. To cover something with a solid block, use Whiteout — or Redact to remove it permanently.',
      },
    ],
  },
  'sticky-notes': {
    intro:
      'Sticky Notes drops small yellow notes onto PDF pages so you can leave comments, questions or reminders for yourself or a reviewer — without changing the original content.',
    steps: [
      'Open your PDF and choose Sticky Notes.',
      'Click a spot on the page and type your note.',
      'Download the PDF with your notes attached.',
    ],
    faqs: [
      {
        q: 'Will others see my notes?',
        a: 'Yes. The notes are saved into the downloaded PDF, so anyone you send it to can read them.',
      },
    ],
  },
  'whiteout-pdf': {
    intro:
      'Whiteout covers content with solid white blocks — the digital version of correction fluid. Hide an old date or a typo, then type new text on top with the text tool.',
    steps: [
      'Open your PDF and select Whiteout.',
      'Drag a box over the content you want to cover.',
      'Optionally add new text on top, then download.',
    ],
    faqs: [
      {
        q: 'Is whited-out text deleted?',
        a: 'No. Whiteout hides content visually, but the original text can still be selected or copied from the file. For sensitive information, use Redact, which removes it permanently.',
      },
    ],
  },
  'add-images': {
    intro:
      'Add Images places PNG, JPG or WebP pictures onto PDF pages — a logo on a letterhead, a stamp on an invoice, a photo in a report. Drag to position and resize the image before saving.',
    steps: [
      'Open your PDF and choose Add Images.',
      'Pick an image from your device.',
      'Drag and resize it on the page, then download the PDF.',
    ],
    faqs: [
      {
        q: 'Which image formats are supported?',
        a: 'PNG, JPG and WebP. PNG transparency is preserved, which makes it the best choice for logos and stamps.',
      },
      {
        q: 'Is my image uploaded anywhere?',
        a: 'No. The image is read and embedded in your browser, exactly like the PDF itself.',
      },
    ],
  },
  'fill-forms': {
    intro:
      'Fill Forms completes interactive PDF forms (AcroForm fields) such as applications, tax forms and registration sheets. Type into text fields, tick checkboxes, pick options, and optionally flatten the form so answers can no longer be edited.',
    steps: [
      'Open a PDF that has fillable form fields.',
      'Fill in the fields shown on each page.',
      'Choose whether to flatten the form, then download the completed PDF.',
    ],
    faqs: [
      {
        q: 'What does “flatten” mean?',
        a: 'Flattening turns form fields into ordinary page content. The answers look the same but can no longer be changed — useful before sending a final copy.',
      },
      {
        q: 'My PDF has no fields — what should I do?',
        a: 'Use Add Text to type anywhere on the page, or Create Fillable Forms to add real fields first.',
      },
    ],
  },
  'create-forms': {
    intro:
      'Create Fillable Forms turns any PDF into an interactive form. Place text fields and checkboxes exactly where answers should go, then share a PDF others can complete in any PDF reader.',
    steps: [
      'Open the PDF you want to turn into a form.',
      'Choose a text field or checkbox and drag it onto the page.',
      'Name and size each field, then download the fillable PDF.',
    ],
    faqs: [
      {
        q: 'Will the form work in Adobe Acrobat and other readers?',
        a: 'Yes. Fields are saved as standard AcroForm fields, which Acrobat, Preview, browser PDF viewers and most mobile apps can fill in.',
      },
    ],
  },
  'sign-pdf': {
    intro:
      'Sign PDF adds your signature to a document without printing and scanning. Draw it with a mouse or finger, type it, or upload an image of your handwritten signature, then place it anywhere on any page.',
    steps: [
      'Open the PDF you need to sign.',
      'Create your signature: draw it, type it, or upload an image.',
      'Click to place it, adjust size and position, then download the signed PDF.',
    ],
    faqs: [
      {
        q: 'Is this a legally binding electronic signature?',
        a: 'This tool adds a visual signature image. In many places that is acceptable for everyday agreements, but it is not a certificate-based digital signature. Check the requirements for important legal documents.',
      },
      {
        q: 'Is my signature stored?',
        a: 'No. Your signature is created and placed in your browser and is never uploaded or saved on any server.',
      },
    ],
  },
}
