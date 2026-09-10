/**
 * The `guidance` list: 0 to 6 items, each a role and a line of text (1–2000
 * characters). The role says what the text IS and the platform writes the
 * sentence around it — so the control shows the role as a choice, never as a
 * prefix the user has to type.
 */
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  GUIDANCE_ROLES,
  GUIDANCE_TEXT_MAX,
  type GuidanceItem,
  type GuidanceRole,
} from '@/data/media-capabilities'

const ROLE_LABEL: Record<GuidanceRole, string> = {
  headline: 'Headline — rendered exactly as written',
  palette: 'Palette',
  style: 'Style',
  subject: 'Subject',
  scene: 'Setting',
  edit: 'Edit — changing nothing else',
  motion: 'Motion — how the shot moves',
  audio: 'Audio — what is heard',
  instruction: 'Instruction',
}

export function GuidanceEditor({
  id,
  label,
  hint,
  items,
  min,
  max,
  disabled,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  items: GuidanceItem[]
  min: number
  max: number
  disabled?: boolean
  onChange: (next: GuidanceItem[]) => void
}) {
  const update = (index: number, patch: Partial<GuidanceItem>) =>
    onChange(items.map((item, at) => (at === index ? { ...item, ...patch } : item)))

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="text-sm font-medium">
        {label}
        {min > 0 && <span className="sr-only">(required)</span>}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={`${id}-${index}-role`} className="sr-only">
                Direction {index + 1} role
              </Label>
              <select
                id={`${id}-${index}-role`}
                value={item.role}
                disabled={disabled}
                onChange={(event) => update(index, { role: event.target.value as GuidanceRole })}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {GUIDANCE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(items.filter((_, at) => at !== index))}
                aria-label={`Remove direction ${index + 1}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
            <Label htmlFor={`${id}-${index}-text`} className="sr-only">
              Direction {index + 1}
            </Label>
            <Textarea
              id={`${id}-${index}-text`}
              rows={2}
              value={item.text}
              maxLength={GUIDANCE_TEXT_MAX}
              disabled={disabled}
              onChange={(event) => update(index, { text: event.target.value })}
            />
          </li>
        ))}
      </ul>
      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={() =>
            onChange([...items, { role: items.length === 0 ? 'subject' : 'style', text: '' }])
          }
        >
          <Plus aria-hidden />
          Add direction
        </Button>
      )}
    </fieldset>
  )
}
