/**
 * I4 — Create / edit a custom tone. ONE implementation, three entry points
 * (onboarding step 4, C1's schedule config, and I3's tones library), because
 * screens4.md is explicit that these must be the same component rather than
 * three forms that drift.
 *
 * `ToneEditorForm` is the whole screen; the sheet and the routed page below are
 * only frames around it. Saving from a sheet returns the caller a tone and
 * leaves their progress untouched — the wizard must not lose a step because
 * someone paused to write a tone.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormActions, TextAreaField, TextField } from '@/components/ab/form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Tone } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { useOrg } from '@/data/provider'
import { composePreview } from './tone-preview'

const toneSchema = z
  .object({
    name: z.string().min(1, MESSAGES.errors.toneNameRequired),
    description: z.string().min(1, MESSAGES.errors.toneRuleRequired),
    dos: z.string(),
    donts: z.string(),
    example: z.string(),
  })
  .refine((values) => values.dos.trim().length > 0 || values.donts.trim().length > 0, {
    message: MESSAGES.errors.toneRuleRequired,
    path: ['dos'],
  })

type ToneValues = z.infer<typeof toneSchema>

const toLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const toText = (values: string[]) => values.join('\n')

/** A stable id from the name, so editing a tone keeps the one it already has. */
function toneIdFor(name: string, existing?: string): string {
  if (existing) return existing
  return `tone_${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')}`
}

export function ToneEditorForm({
  initial,
  onSave,
  onCancel,
  submitLabel = 'Save tone',
}: {
  /** Present when editing; absent when creating. */
  initial?: Tone
  onSave: (tone: Tone) => void
  onCancel: () => void
  submitLabel?: string
}) {
  const org = useOrg()
  const [preview, setPreview] = useState<ReturnType<typeof composePreview> | null>(null)

  const form = useForm<ToneValues>({
    resolver: zodResolver(toneSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      dos: toText(initial?.rules.do ?? []),
      donts: toText(initial?.rules.dont ?? []),
      example: initial?.example ?? '',
    },
  })

  return (
    <Form
      form={form}
      onSubmit={(values) =>
        onSave({
          id: toneIdFor(values.name, initial?.id),
          name: values.name,
          kind: 'custom',
          description: values.description,
          rules: { do: toLines(values.dos), dont: toLines(values.donts) },
          example: values.example.trim() || undefined,
        })
      }
    >
      <TextField
        name="name"
        label="Tone name"
        placeholder="Founder's voice"
        description="How it will appear wherever tones are picked."
      />
      <TextAreaField
        name="description"
        label="What this tone sounds like"
        placeholder="First-person, workshop-floor honesty from the founder."
        rows={2}
      />
      <TextAreaField
        name="dos"
        label="Do"
        description="One per line."
        placeholder={'Write in first person\nMention what we tried and changed'}
        rows={3}
      />
      <TextAreaField
        name="donts"
        label="Don't"
        description="One per line."
        placeholder={'Corporate we-speak\nHide the rough edges'}
        rows={3}
      />
      <TextAreaField
        name="example"
        label="Example line (optional)"
        description="A sample sentence in this tone, used to steer generation."
        rows={2}
      />

      {/* The point of Preview is the INTERACTION: brand voice and tone are in
          force at the same time, and seeing both lists side by side is what
          stops someone writing a tone that quietly contradicts the voice. */}
      {preview && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3">
          <p className="text-sm">{preview.line}</p>
          <p className="text-xs text-muted-foreground">Shaped by:</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {preview.applied.map((entry, index) => (
              <li key={`${entry.source}-${index}`}>
                <span className="font-medium text-foreground">{entry.source}</span> — {entry.rule}
              </li>
            ))}
          </ul>
          {preview.applied.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nothing shapes it yet — add a rule above, or a brand-voice rule in Settings.
            </p>
          )}
        </div>
      )}

      <FormActions className="justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const values = form.getValues()
            setPreview(
              composePreview(
                { offer: org.offer, brandVoice: org.brandVoice },
                {
                  name: values.name,
                  description: values.description,
                  example: values.example,
                  rules: { do: toLines(values.dos), dont: toLines(values.donts) },
                },
              ),
            )
          }}
        >
          <Eye aria-hidden />
          Preview
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X aria-hidden />
            Cancel
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </FormActions>
    </Form>
  )
}

export function ToneEditorSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Receives the finished tone; the caller decides what to do with it. */
  onSave: (tone: Tone) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create a custom tone</SheetTitle>
          <SheetDescription>
            Brand voice always applies underneath — a tone shapes the style on top of it.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {/* Remounted per opening so a cancelled draft never haunts the next one. */}
          {open && <ToneEditorForm onSave={onSave} onCancel={() => onOpenChange(false)} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
