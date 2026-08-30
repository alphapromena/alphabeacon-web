/**
 * I4 — Create / edit a custom tone. ONE implementation, three entry points
 * (C1's schedule config, I3's tones library, and I4's routed page), because
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
import { Form, FormActions, SelectField, TextAreaField, TextField } from '@/components/ab/form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Tone, ToneLanguage } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { useBrandActions } from '@/data/brand'
import { useLiveMode } from '@/data/provider'
import { errorReference } from '@/lib/error-reference'
import type { TonePreview } from '@/lib/tone-preview'
import { TONE_LANGUAGE_OPTIONS, TONE_LENGTH_OPTIONS } from './tone-fields'

const toneSchema = z
  .object({
    name: z.string().min(1, MESSAGES.errors.toneNameRequired),
    description: z.string().min(1, MESSAGES.errors.toneRuleRequired),
    // HSN-03: REQUIRED with NO default. An old tone opens with nothing chosen
    // and cannot be saved until its owner says which language it writes in.
    // A boolean predicate, NOT a type guard (TS 5.5 infers one from a bare
    // `===` comparison): the form's value type must stay `string` so `''` is
    // a legal starting value, and the save narrows it after the check.
    language: z
      .string()
      .refine((value) => TONE_LANGUAGE_OPTIONS.some((option) => option.value === value), {
        message: MESSAGES.errors.toneLanguageRequired,
      }),
    // HSN-03: `medium` is a FORM default only — the model never assumes it.
    length: z.enum(['short', 'medium', 'long']),
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
  const live = useLiveMode()
  const brand = useBrandActions()
  const [preview, setPreview] = useState<TonePreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<{
    message: string
    reference?: string
  } | null>(null)

  const form = useForm<ToneValues>({
    // One schema in both modes now: rules have a wire home, so requiring at
    // least one no longer demands a field with nowhere to go (D-INT-C).
    resolver: zodResolver(toneSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      language: initial?.language ?? '',
      length: initial?.length ?? 'medium',
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
          // The schema proved `language` is one of the two; the cast only
          // narrows the string the resolver already checked.
          language: values.language as ToneLanguage,
          length: values.length,
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
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          name="language"
          label="Language"
          description="What this tone writes in. Drafts in this tone are generated in it."
          placeholder="Choose a language"
          options={TONE_LANGUAGE_OPTIONS}
        />
        <SelectField
          name="length"
          label="Length"
          description="How long a post in this tone runs."
          options={TONE_LENGTH_OPTIONS}
        />
      </div>
      {/* HSN-03: the interim, stated where the fields are (decisions.md). */}
      {live && <p className="text-sm text-muted-foreground">{MESSAGES.notices.toneFieldsLocal}</p>}
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
      {live ? (
        // Rules landed on the wire in the 2026-08-17 contract, so both lists
        // above are real now. The example line still has nowhere to be stored
        // between runs, so its editor stays absent with the reason stated -
        // never smuggled into the description (open-items 7).
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.brandExamplesPending}</p>
      ) : (
        <TextAreaField
          name="example"
          label="Example line (optional)"
          description="A sample sentence in this tone, used to steer generation."
          rows={2}
        />
      )}

      {/* The point of Preview is the INTERACTION: brand voice and tone are in
          force at the same time, and seeing both lists side by side is what
          stops someone writing a tone that quietly contradicts the voice.
          In live mode the line above the list is a REAL sample, written by the
          same capability generation uses and grounded on the same context
          bundle - so the card labels which of the two it is showing. */}
      {/* Friendly copy says what happened; the reference is what makes a bug
          report actionable — the envelope's requestId where the server sent
          one, else the contract code (open-items 3). */}
      {previewError && (
        <p className="text-sm text-destructive">
          {previewError.message}
          {previewError.reference && (
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({previewError.reference})
            </span>
          )}
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3">
          <p className="text-sm">{preview.line}</p>
          <p className="text-xs text-muted-foreground">
            {preview.generated
              ? 'A real sample, written in this tone just now.'
              : 'Composed from what you have typed — not generated.'}
          </p>
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
          disabled={previewing}
          onClick={async () => {
            const values = form.getValues()
            setPreviewing(true)
            setPreviewError(null)
            const result = await brand.previewTone({
              name: values.name,
              description: values.description,
              example: values.example.trim() || undefined,
              rules: { do: toLines(values.dos), dont: toLines(values.donts) },
            })
            setPreviewing(false)
            if (result.ok) {
              setPreview(result.preview)
              return
            }
            setPreview(null)
            // A 502 here means the org has no pushed context bundle yet, which
            // is a thing the user can actually fix - so say which thing.
            setPreviewError({
              message:
                result.code === 'bad_gateway'
                  ? MESSAGES.errors.previewNeedsBrandVoice
                  : result.code === 'rate_limited'
                    ? MESSAGES.errors.previewRateLimited
                    : MESSAGES.errors.previewFailed,
              reference: errorReference(result),
            })
          }}
        >
          <Eye aria-hidden />
          {previewing ? 'Previewing…' : live ? 'Preview this tone' : 'Preview'}
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
