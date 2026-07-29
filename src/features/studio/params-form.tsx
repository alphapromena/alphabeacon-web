/**
 * Renders a model's parameters from its capability schema.
 *
 * There is no per-model UI anywhere in this file — every control comes from
 * `fieldsFromSchema`, so a model that publishes a new knob gets a working
 * control without a code change. That is the property W5 verifies, and the
 * reason the generator is tested against the real catalog.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { fieldsFromSchema, type ParamValues } from '@/lib/params-schema'

export function ParamsForm({
  schema,
  values,
  onChange,
  idPrefix = 'param',
}: {
  schema: Record<string, unknown> | undefined
  values: ParamValues
  onChange: (next: ParamValues) => void
  /** Keeps ids unique when two composers are mounted at once. */
  idPrefix?: string
}) {
  const fields = fieldsFromSchema(schema)
  if (fields.length === 0) return null

  const set = (name: string, value: string | number | boolean) =>
    onChange({ ...values, [name]: value })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.name}`
        const value = values[field.name]

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label htmlFor={id}>
              {field.label}
              {field.required && (
                <span aria-hidden className="text-muted-foreground">
                  *
                </span>
              )}
              {field.required && <span className="sr-only">(required)</span>}
            </Label>

            {field.kind === 'select' && (
              <select
                id={id}
                value={value === undefined ? '' : String(value)}
                onChange={(event) => set(field.name, event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {!field.required && <option value="">Any</option>}
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.kind === 'number' && (
              <Input
                id={id}
                type="number"
                inputMode={field.integer ? 'numeric' : 'decimal'}
                min={field.min}
                max={field.max}
                step={field.integer ? 1 : 0.1}
                value={value === undefined ? '' : String(value)}
                onChange={(event) =>
                  set(field.name, event.target.value === '' ? '' : Number(event.target.value))
                }
              />
            )}

            {field.kind === 'text' && (
              <Input
                id={id}
                value={value === undefined ? '' : String(value)}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}

            {field.kind === 'boolean' && (
              <Switch
                id={id}
                checked={Boolean(value)}
                onCheckedChange={(next) => set(field.name, next)}
              />
            )}

            {field.kind === 'number' && (field.min !== undefined || field.max !== undefined) && (
              <p className="text-xs text-muted-foreground">
                {field.min !== undefined && field.max !== undefined
                  ? `Between ${field.min} and ${field.max}`
                  : field.min !== undefined
                    ? `At least ${field.min}`
                    : `At most ${field.max}`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
