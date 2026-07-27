/**
 * These tests encode the laws the form layer exists to enforce: the sentence a
 * user reads on a failed submit is the schema's named message (never the
 * browser's), it is attached to the control assistive technology is sitting on,
 * and every control carries a name of its own.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Form, FormActions, SwitchField, TextAreaField, TextField } from '@/components/ab/form'
import { Button } from '@/components/ui/button'
import { MESSAGES } from '@/lib/messages'

// jsdom ships no ResizeObserver and Radix measures the switch it renders.
// Guarded, so a global stub in src/test/setup.ts takes precedence once one exists.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub

const TIMEZONE_DESCRIPTION = 'Every slot is scheduled in this timezone.'

const scheduleSchema = z.object({
  timezone: z.string().min(1, MESSAGES.errors.timezoneRequired),
  notes: z.string(),
  eventAware: z.boolean(),
})

type ScheduleValues = z.infer<typeof scheduleSchema>

function ScheduleForm({ onSubmit = () => {} }: { onSubmit?: (values: ScheduleValues) => void }) {
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { timezone: '', notes: '', eventAware: false },
  })

  return (
    <Form form={form} onSubmit={onSubmit}>
      <TextField name="timezone" label="Timezone" description={TIMEZONE_DESCRIPTION} />
      <TextAreaField name="notes" label="Notes" rows={3} />
      <SwitchField name="eventAware" label="Generate around calendar events" />
      <FormActions>
        <Button type="submit">Save schedule</Button>
      </FormActions>
    </Form>
  )
}

describe('Form', () => {
  it('surfaces the named message from a schema violation, attached to the control', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Save schedule' }))

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent(MESSAGES.errors.timezoneRequired)
    expect(error.textContent).toBe(MESSAGES.errors.timezoneRequired)

    const timezone = screen.getByLabelText('Timezone')
    expect(timezone).toHaveAttribute('aria-invalid', 'true')
    expect(timezone.getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('leaves validation to the schema rather than the browser', () => {
    render(<ScheduleForm />)

    const submit = screen.getByRole('button', { name: 'Save schedule' })

    expect(submit.closest('form')?.noValidate).toBe(true)
  })

  it('gives every control an accessible name and its own description', () => {
    render(<ScheduleForm />)

    expect(screen.getByRole('textbox', { name: 'Timezone' })).toHaveAccessibleDescription(
      TIMEZONE_DESCRIPTION,
    )
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Generate around calendar events' })).toBeVisible()
  })

  it('submits the values once the schema is satisfied', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ScheduleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Timezone'), 'Asia/Amman')
    await user.click(screen.getByLabelText('Generate around calendar events'))
    await user.click(screen.getByRole('button', { name: 'Save schedule' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toEqual({
      timezone: 'Asia/Amman',
      notes: '',
      eventAware: true,
    })
  })

  it('drops the message and the invalid state once the field is fixed', async () => {
    const user = userEvent.setup()
    render(<ScheduleForm />)

    await user.click(screen.getByRole('button', { name: 'Save schedule' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Timezone'), 'Asia/Amman')

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Timezone')).not.toHaveAttribute('aria-invalid')
  })
})
