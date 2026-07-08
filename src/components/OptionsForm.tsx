import type { OptionField, OptionValues } from '@/types/tool'

interface Props {
  fields: OptionField[]
  values: OptionValues
  onChange: (key: string, value: string | number | boolean) => void
  disabled?: boolean
}

export default function OptionsForm({ fields, values, onChange, disabled }: Props) {
  if (fields.length === 0) return null
  return (
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Tool options</legend>
      {fields.map((field) => {
        const id = `opt-${field.key}`
        if (field.kind === 'checkbox') {
          return (
            <label
              key={field.key}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2"
            >
              <input
                id={id}
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => onChange(field.key, e.target.checked)}
                className="h-4 w-4 rounded accent-brand-600"
              />
              <span>{field.label}</span>
              {field.help && <span className="text-xs text-neutral-400">— {field.help}</span>}
            </label>
          )
        }
        return (
          <div key={field.key} className={field.kind === 'text' ? 'sm:col-span-2' : ''}>
            <label htmlFor={id} className="label-base">
              {field.label}
            </label>
            {field.kind === 'select' ? (
              <select
                id={id}
                className="input-base"
                value={String(values[field.key] ?? field.default)}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {field.choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : field.kind === 'number' ? (
              <input
                id={id}
                type="number"
                className="input-base"
                value={Number(values[field.key] ?? field.default)}
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                onChange={(e) => onChange(field.key, Number(e.target.value))}
              />
            ) : (
              <input
                id={id}
                type={field.kind === 'password' ? 'password' : 'text'}
                className="input-base"
                value={String(values[field.key] ?? field.default)}
                placeholder={field.placeholder}
                autoComplete={field.kind === 'password' ? 'new-password' : 'off'}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
            {field.help && <p className="mt-1 text-xs text-neutral-400">{field.help}</p>}
          </div>
        )
      })}
    </fieldset>
  )
}
