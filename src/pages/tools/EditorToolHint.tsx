/**
 * Editor tool ids and the one-line instruction shown under the editor toolbar,
 * including the "no editable text" warning for scanned PDFs.
 */
export type EditorTool =
  | 'select'
  | 'edittext'
  | 'text'
  | 'pen'
  | 'highlight'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'note'
  | 'whiteout'
  | 'image'

const TOOL_HINTS: Record<EditorTool, string> = {
  select: 'Click an item you added to select it, then drag to move or use the corner handle to resize.',
  edittext: 'Click any highlighted line of text to retype it. Click outside the box when you’re done.',
  text: 'Click anywhere on the page to add a text box, then type.',
  pen: 'Click and drag on the page to draw.',
  highlight: 'Click and drag over text to highlight it.',
  rect: 'Click and drag to draw a rectangle.',
  ellipse: 'Click and drag to draw an ellipse.',
  line: 'Click and drag to draw a line.',
  arrow: 'Click and drag to draw an arrow.',
  note: 'Click on the page to add a sticky note, then type.',
  whiteout: 'Click and drag to cover content with white. Use “Add text” to type on top.',
  image: 'Click on the page to choose an image, then click again to place it.',
}

export default function ToolHint({
  active,
  hasEditableText,
}: {
  active: EditorTool
  hasEditableText: boolean
}) {
  if (active === 'edittext' && !hasEditableText) {
    return (
      <p
        role="status"
        className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
      >
        No editable text was found in this PDF — it’s probably a scanned image. Run{' '}
        <a className="font-medium underline" href="/tool/searchable-pdf">
          Searchable PDF
        </a>{' '}
        first, or cover text with Whiteout and type over it with Add text.
      </p>
    )
  }
  return (
    <p role="status" className="mb-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
      {TOOL_HINTS[active]}
    </p>
  )
}
