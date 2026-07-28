/**
 * A4 — Reset password · `/reset-password`. Two sub-screens in one route:
 * request (no token) and confirm (`?token=…`), with `?token=expired` reaching
 * the invalid-token recovery.
 *
 * The request result is deliberately identical whether or not the address
 * exists — a "no account found" message turns this form into a directory of
 * who has an account here. The success copy therefore says "if that email has
 * an account", which is both honest and non-enumerating.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, FormField, TextField } from '@/components/ab/form'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataDispatch } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { AuthLayout } from './auth-layout'
import { passwordScore } from './password-rules'
import { PasswordStrength } from './password-strength'

const requestSchema = z.object({
  email: z
    .string()
    .min(1, MESSAGES.errors.emailRequired)
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), MESSAGES.errors.emailInvalid),
})

const confirmSchema = z
  .object({
    password: z
      .string()
      .min(8, MESSAGES.errors.passwordTooShort)
      .refine((value) => passwordScore(value) >= 2, MESSAGES.errors.passwordTooWeak),
    confirm: z.string().min(1, MESSAGES.errors.passwordTooShort),
  })
  .refine((values) => values.password === values.confirm, {
    message: MESSAGES.errors.passwordsDoNotMatch,
    path: ['confirm'],
  })

const ASIDE = {
  heading: 'Locked out is temporary.',
  body: 'Resetting signs you out everywhere else, so a shared or forgotten session cannot keep posting as you.',
}

export function ResetPasswordScreen() {
  const [params] = useSearchParams()
  const token = params.get('token')
  return token ? <ConfirmReset expired={token === 'expired'} /> : <RequestReset />
}

function RequestReset() {
  const [sent, setSent] = useState(false)
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  })

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={MESSAGES.notices.resetLinkSent}
        aside={ASIDE}
        footer={
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MailCheck aria-hidden className="size-6" />
          </div>
          <Button variant="outline" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      aside={ASIDE}
      footer={
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <Form
        form={form}
        onSubmit={() => {
          // Identical outcome either way — see the note at the top of the file.
          setSent(true)
        }}
      >
        <TextField name="email" label="Work email" type="email" placeholder="you@company.com" />
        <FormActions className="flex-col items-stretch">
          <Button type="submit" size="lg">
            Send reset link
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}

function ConfirmReset({ expired }: { expired: boolean }) {
  const navigate = useNavigate()
  const dispatch = useDataDispatch()
  const form = useForm<z.infer<typeof confirmSchema>>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { password: '', confirm: '' },
  })
  const password = form.watch('password')

  if (expired) {
    return (
      <AuthLayout
        title="That link has expired"
        subtitle={MESSAGES.errors.resetLinkExpired}
        aside={ASIDE}
      >
        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link to="/reset-password">Request a new link</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Pick something you don't use elsewhere."
      aside={ASIDE}
    >
      <Form
        form={form}
        onSubmit={() => {
          dispatch({ type: 'auth/clearLockout' })
          toastSuccess('Password reset', { description: 'Sign in with your new password.' })
          navigate('/login')
        }}
      >
        <FormField name="password" label="New password">
          {({ invalid, ...field }) => (
            <div className="flex flex-col gap-2">
              <Input
                {...field}
                value={field.value ?? ''}
                type="password"
                autoComplete="new-password"
                aria-invalid={invalid || undefined}
              />
              <PasswordStrength value={password ?? ''} />
            </div>
          )}
        </FormField>
        <TextField name="confirm" label="Confirm new password" type="password" />
        <FormActions className="flex-col items-stretch">
          <Button type="submit" size="lg">
            Reset password
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}
