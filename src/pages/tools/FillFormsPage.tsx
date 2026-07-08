import { useCallback, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import {
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  type PDFDocument,
} from '@cantoo/pdf-lib'
import type { ToolDef } from '@/types/tool'
import ToolShell from '@/components/ToolShell'
import { openWithPdfLib, savePdfBlob } from '@/utils/pdf'
import { downloadBlob } from '@/utils/download'
import { friendlyError } from '@/utils/errors'
import { baseName } from '@/utils/format'
import { winAnsiSafe } from '@/utils/textLayout'
import { StandardFonts } from '@cantoo/pdf-lib'

interface FieldInfo {
  name: string
  kind: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'optionlist'
  options?: string[]
  multiline?: boolean
}

export default function FillFormsPage({ tool }: { tool: ToolDef }) {
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<FieldInfo[]>([])
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [flatten, setFlatten] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (f: File) => {
    setError(null)
    try {
      const doc = await openWithPdfLib(f)
      const form = doc.getForm()
      const list: FieldInfo[] = []
      const initial: Record<string, string | boolean> = {}
      for (const field of form.getFields()) {
        const name = field.getName()
        if (field instanceof PDFTextField) {
          list.push({ name, kind: 'text', multiline: field.isMultiline() })
          initial[name] = field.getText() ?? ''
        } else if (field instanceof PDFCheckBox) {
          list.push({ name, kind: 'checkbox' })
          initial[name] = field.isChecked()
        } else if (field instanceof PDFRadioGroup) {
          list.push({ name, kind: 'radio', options: field.getOptions() })
          initial[name] = field.getSelected() ?? ''
        } else if (field instanceof PDFDropdown) {
          list.push({ name, kind: 'dropdown', options: field.getOptions() })
          initial[name] = field.getSelected()[0] ?? ''
        } else if (field instanceof PDFOptionList) {
          list.push({ name, kind: 'optionlist', options: field.getOptions() })
          initial[name] = field.getSelected()[0] ?? ''
        }
      }
      if (list.length === 0) {
        setError(
          'This PDF has no fillable form fields. Use “Create Fillable Forms” to add some, or “Add Text” to type anywhere.',
        )
        return
      }
      setFile(f)
      setFields(list)
      setValues(initial)
    } catch (err) {
      setError(friendlyError(err))
    }
  }, [])

  const apply = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const doc: PDFDocument = await openWithPdfLib(file)
      const form = doc.getForm()
      const helv = await doc.embedFont(StandardFonts.Helvetica)
      for (const f of fields) {
        const v = values[f.name]
        try {
          if (f.kind === 'text') form.getTextField(f.name).setText(winAnsiSafe(helv, String(v ?? '')))
          else if (f.kind === 'checkbox') {
            if (v) form.getCheckBox(f.name).check()
            else form.getCheckBox(f.name).uncheck()
          } else if (f.kind === 'radio' && v) form.getRadioGroup(f.name).select(String(v))
          else if (f.kind === 'dropdown' && v) form.getDropdown(f.name).select(String(v))
          else if (f.kind === 'optionlist' && v) form.getOptionList(f.name).select(String(v))
        } catch {
          /* field vanished or option invalid — skip rather than fail the whole form */
        }
      }
      if (flatten) form.flatten()
      downloadBlob(await savePdfBlob(doc), `${baseName(file.name)} (filled).pdf`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolShell tool={tool} file={file} onFiles={(fs) => fs[0] && void loadFile(fs[0])}>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      {file && (
        <div className="space-y-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {fields.length} field{fields.length === 1 ? '' : 's'} found in <strong>{file.name}</strong>.
          </p>
          <div className="card space-y-4 p-5">
            {fields.map((f) => {
              const id = `field-${f.name}`
              if (f.kind === 'checkbox') {
                return (
                  <label
                    key={f.name}
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="h-4 w-4 rounded accent-brand-600"
                      checked={Boolean(values[f.name])}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.checked }))}
                    />
                    {f.name}
                  </label>
                )
              }
              return (
                <div key={f.name}>
                  <label htmlFor={id} className="label-base">
                    {f.name}
                  </label>
                  {f.kind === 'text' ? (
                    f.multiline ? (
                      <textarea
                        id={id}
                        rows={3}
                        className="input-base"
                        value={String(values[f.name] ?? '')}
                        onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      />
                    ) : (
                      <input
                        id={id}
                        className="input-base"
                        value={String(values[f.name] ?? '')}
                        onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      />
                    )
                  ) : (
                    <select
                      id={id}
                      className="input-base"
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    >
                      <option value="">— select —</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-brand-600"
              checked={flatten}
              onChange={(e) => setFlatten(e.target.checked)}
            />
            Flatten the form (make fields permanent and non-editable)
          </label>
          <div className="flex justify-center">
            <button
              type="button"
              className="btn-primary px-8"
              disabled={busy}
              onClick={() => void apply()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              Fill & download
            </button>
          </div>
        </div>
      )}
    </ToolShell>
  )
}
