/**
 * The two list editors Settings keeps needing: a tag input (differentiators in
 * I1, topics in I5) and an add/remove rule list (brand voice in I2, per-tone
 * rules in I4).
 *
 * They live together and are shared rather than re-typed per screen, because
 * "add a row, remove a row" is exactly the kind of control that quietly grows
 * four different keyboard behaviours if each screen writes its own.
 */
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TagInput({
  id,
  label,
  description,
  placeholder,
  values,
  onChange,
}: {
  id: string
  label: string
  description?: string
  placeholder?: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const [entry, setEntry] = useState('')

  const add = () => {
    const value = entry.trim()
    if (!value || values.includes(value)) return
    onChange([...values, value])
    setEntry('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pr-1 pl-3 text-sm"
            >
              {value}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((v) => v !== value))}
              >
                <X aria-hidden className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          id={id}
          value={entry}
          placeholder={placeholder}
          onChange={(event) => setEntry(event.target.value)}
          // Enter adds the tag rather than submitting whatever form is around
          // it — the surprise otherwise is losing the whole screen's edits.
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>
    </div>
  )
}

export function RuleList({
  idPrefix,
  label,
  description,
  placeholder,
  values,
  onChange,
}: {
  idPrefix: string
  label: string
  description?: string
  placeholder?: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const set = (index: number, value: string) =>
    onChange(values.map((entry, i) => (i === index ? value : entry)))

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <ul className="flex flex-col gap-2">
        {values.map((value, index) => (
          <li key={index} className="flex gap-2">
            <Input
              id={`${idPrefix}-${index}`}
              aria-label={`${label} rule ${index + 1}`}
              value={value}
              placeholder={placeholder}
              onChange={(event) => set(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label.toLowerCase()} rule ${index + 1}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <X aria-hidden />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...values, ''])}
      >
        <Plus aria-hidden />
        Add {label.toLowerCase()}
      </Button>
    </fieldset>
  )
}
