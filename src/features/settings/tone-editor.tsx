/**
 * I4 — Create / edit a custom tone. One implementation, three entry points
 * (onboarding step 4, C1's schedule config, and I3's tones library), because
 * screens4.md is explicit that these must be the same component rather than
 * three forms that drift.
 *
 * Rendered as a sheet when it opens over another flow: saving returns the
 * caller a tone and leaves their progress untouched — the wizard must not lose
 * a step because someone paused to write a tone.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
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
  const form = useForm<ToneValues>({
    resolver: zodResolver(toneSchema),
    defaultValues: { name: '', description: '', dos: '', donts: '', example: '' },
  })

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
          <Form
            form={form}
            onSubmit={(values) => {
              onSave({
                id: `tone_${values.name.toLowerCase().replace(/\s+/g, '_')}_${form.formState.submitCount}`,
                name: values.name,
                kind: 'custom',
                description: values.description,
                rules: { do: toLines(values.dos), dont: toLines(values.donts) },
                example: values.example.trim() || undefined,
              })
              form.reset()
            }}
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
            <FormActions>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                <X aria-hidden />
                Cancel
              </Button>
              <Button type="submit">Save tone</Button>
            </FormActions>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
