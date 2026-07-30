/**
 * A4 — Reset password · `/reset-password`. Three ways in, one route:
 * - no params → request a code;
 * - `?email=…&code=…` → the documented email deep link (docs/api/api.md):
 *   the confirm form, autofilled, which in live mode calls the API — setting
 *   the password revokes EVERY session and verifies the email as a side
 *   effect of proving inbox ownership;
 * - `?token=…` → the static demo's legacy sub-screens (`token=expired`
 *   reaches the invalid-link recovery), kept so `/dev` walks stay possible
 *   without a mail server.
 *
 * The request result is deliberately identical whether or not the address
 * exists — a "no account found" message turns this form into a directory of
 * who has an account here. Requesting again IS the resend (rate-limited).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, FormField, TextField } from '@/components/ab/form'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/data/auth'
import { useDataDispatch } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { AuthErrorAlert, type AuthFailure } from './auth-error'
import { AuthLayout } from './auth-layout'
import { passwordScore } from './password-rules'
import { PasswordStrength } from './password-strength'
import { formatCountdown, useCountdown } from './use-countdown'

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

/** The server enforces 60 s between sends. */
const RESEND_COOLDOWN_MS = 60_000

export function ResetPasswordScreen() {
  const [params] = useSearchParams()
  const email = params.get('email')
  const code = params.get('code')
  const token = params.get('token')

  // The documented deep link: /reset-password?email=…&code=…
  if (email && code) return <ConfirmReset email={email} code={code} />
  // Legacy static demo path.
  if (token) return <StaticConfirmReset expired={token === 'expired'} />
  return <RequestReset />
}

function RequestReset() {
  const auth = useAuthActions()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(undefined)
  const secondsLeft = useCountdown(cooldownUntil)
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  })

  const send = async (email: string) => {
    setFailure(null)
    const result = await auth.forgotPassword(email)
    if (!result.ok) {
      setFailure(result)
      if (result.retryAfterSeconds) {
        setCooldownUntil(Date.now() + result.retryAfterSeconds * 1000)
      }
      return
    }
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS)
    setSentTo(email)
  }

  if (sentTo) {
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
          <AuthErrorAlert failure={failure} />
          <div className="flex flex-col gap-3">
            {/* Requesting again IS the resend; the server's 60 s spacing is
                shown as a countdown, never a silent refusal. */}
            <Button
              variant="outline"
              disabled={secondsLeft > 0}
              onClick={() => void send(sentTo)}
            >
              {secondsLeft > 0 ? (
                <>
                  Send again in <MonoNumber value={formatCountdown(secondsLeft)} />
                </>
              ) : (
                'Send again'
              )}
            </Button>
            <Button variant="ghost" onClick={() => setSentTo(null)}>
              Use a different email
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a code to set a new one."
      aside={ASIDE}
      footer={
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <Form form={form} onSubmit={(values) => void send(values.email)}>
        <AuthErrorAlert failure={failure} />
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

/** The deep-linked confirm: the code arrived by email, the form finishes it. */
function ConfirmReset({ email, code }: { email: string; code: string }) {
  const auth = useAuthActions()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<z.infer<typeof confirmSchema>>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { password: '', confirm: '' },
  })
  const password = form.watch('password')

  // A dead code is a full-screen state, not an inline warning: the form
  // cannot succeed, so it should not look like it might.
  if (failure && (failure.code === 'bad_request' || failure.code === 'conflict')) {
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
      subtitle={`For ${email}. Pick something you don't use elsewhere.`}
      aside={ASIDE}
    >
      <Form
        form={form}
        onSubmit={async (values) => {
          setSubmitting(true)
          setFailure(null)
          const result = await auth.resetPassword({ email, code, newPassword: values.password })
          setSubmitting(false)
          if (!result.ok) {
            setFailure(result)
            return
          }
          toastSuccess('Password reset', {
            description: 'Every session was signed out. Sign in with your new password.',
          })
          navigate('/login')
        }}
      >
        <AuthErrorAlert
          failure={failure && failure.code !== 'bad_request' && failure.code !== 'conflict' ? failure : null}
        />
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
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}

/** The static demo's legacy `?token` sub-screens, byte-compatible with W2. */
function StaticConfirmReset({ expired }: { expired: boolean }) {
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
