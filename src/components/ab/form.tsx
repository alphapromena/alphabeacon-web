/**
 * The one form layer: react-hook-form + zod + shadcn `Field`, tied together
 * once so every form in the product validates and speaks identically.
 *
 * Why it exists: a form is where an app most easily starts speaking in someone
 * else's voice — the browser's locale strings, a resolver's raw "Invalid
 * input", an API's field name. Everything here funnels the message the user
 * reads back to the zod schema (which quotes `lib/messages.ts`), and builds the
 * label / description / error wiring a screen reader depends on by
 * construction, so no feature can ship a field that is only visually labelled.
 */
import { useId } from 'react'
import type { ReactNode } from 'react'
import { Controller, FormProvider, useFormContext } from 'react-hook-form'
import type { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

/** So a feature builds a whole form from this module and never reaches past it. */
export { FieldGroup, FieldSet } from '@/components/ui/field'

/**
 * What a field hands its control: react-hook-form's controller props plus the
 * accessibility `FormField` already computed. Spreading it onto the control is
 * what makes the wiring impossible to forget.
 */
export type FormFieldRenderProps = ControllerRenderProps & {
  id: string
  invalid: boolean
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

/**
 * Wraps a `useForm` instance so submission runs through the schema first.
 *
 * `noValidate` is the point: the browser would otherwise interrupt with its own
 * wording ("Please fill out this field") and win the race against our
 * catalogued message.
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: {
  form: UseFormReturn<T>
  onSubmit: (values: T) => void
  children: ReactNode
  className?: string
}) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className={cn('flex flex-col gap-6', className)}
      >
        {children}
      </form>
    </FormProvider>
  )
}

/**
 * One field: label, control, description, error — related to each other in the
 * accessibility tree, not just on screen.
 *
 * The generated id links the label to the control, `aria-describedby` points at
 * the description and, once it exists, the error node, and the error text comes
 * from the schema through `FieldError` — so the message a screen reader
 * announces is the same designed sentence a sighted user reads.
 */
export function FormField({
  name,
  label,
  description,
  children,
  orientation = 'vertical',
}: {
  name: string
  label: string
  description?: string
  children: (field: FormFieldRenderProps) => ReactNode
  orientation?: 'vertical' | 'horizontal' | 'responsive'
}) {
  const { control } = useFormContext()
  const generatedId = useId()
  const controlId = `${name}-${generatedId}`
  const descriptionId = `${controlId}-description`
  const errorId = `${controlId}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = Boolean(fieldState.error)
        const describedByIds: string[] = []
        if (description) describedByIds.push(descriptionId)
        // FieldError renders nothing while the field is valid, so only point at
        // an id that is really in the document.
        if (invalid) describedByIds.push(errorId)

        const rendered = children({
          ...field,
          id: controlId,
          invalid,
          'aria-invalid': invalid || undefined,
          'aria-describedby': describedByIds.join(' ') || undefined,
        })
        const descriptionNode = description ? (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        ) : null
        const errorNode = (
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        )

        if (orientation === 'vertical') {
          return (
            <Field orientation="vertical" data-invalid={invalid || undefined}>
              <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
              {rendered}
              {descriptionNode}
              {errorNode}
            </Field>
          )
        }

        // Side-by-side rows read as one column of words next to one control,
        // so the label, description, and error travel together.
        return (
          <Field orientation={orientation} data-invalid={invalid || undefined}>
            <FieldContent>
              <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
              {descriptionNode}
              {errorNode}
            </FieldContent>
            {rendered}
          </Field>
        )
      }}
    />
  )
}

/**
 * A single-line text field — the default shape, so features stop re-deciding it.
 *
 * `value ?? ''` keeps the control controlled from the first render, so a field
 * without a default value cannot flip React between uncontrolled and controlled
 * halfway through a form.
 */
export function TextField({
  name,
  label,
  description,
  placeholder,
  type = 'text',
}: {
  name: string
  label: string
  description?: string
  placeholder?: string
  type?: string
}) {
  return (
    <FormField name={name} label={label} description={description}>
      {({ invalid, ...field }) => (
        <Input {...field} value={field.value ?? ''} type={type} placeholder={placeholder} />
      )}
    </FormField>
  )
}

/** Multi-line prose — tone rules, notes, prompts. */
export function TextAreaField({
  name,
  label,
  description,
  placeholder,
  rows,
}: {
  name: string
  label: string
  description?: string
  placeholder?: string
  rows?: number
}) {
  return (
    <FormField name={name} label={label} description={description}>
      {({ invalid, ...field }) => (
        <Textarea {...field} value={field.value ?? ''} rows={rows} placeholder={placeholder} />
      )}
    </FormField>
  )
}

/**
 * A boolean setting. Horizontal by design: the words explain the switch, and a
 * switch with its label on the line above reads as a heading instead.
 */
export function SwitchField({
  name,
  label,
  description,
}: {
  name: string
  label: string
  description?: string
}) {
  return (
    <FormField name={name} label={label} description={description} orientation="horizontal">
      {({ invalid, value, onChange, ...field }) => (
        <Switch {...field} checked={Boolean(value)} onCheckedChange={onChange} />
      )}
    </FormField>
  )
}

/**
 * The commit row. Actions live in one predictable place at the end of a form,
 * so people stop hunting for the button that finishes the job.
 */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  const classes = cn('flex flex-wrap items-center justify-end gap-2', className)
  return <div className={classes}>{children}</div>
}
