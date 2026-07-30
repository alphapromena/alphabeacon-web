/**
 * A2 — Sign in · `/login`.
 *
 * Two states carry the design law here. The failure message is deliberately
 * vague ("Incorrect email or password") because naming which half was wrong
 * tells an attacker which emails exist. The lockout is the opposite: once it
 * trips it says exactly how long, counts down in mono, and re-enables itself —
 * a wall you can see the end of is not the same as being stuck.
 *
 * Any password works for a known address: this world has no credentials, and
 * pretending otherwise would make the screen untestable rather than secure.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, FormField, TextField } from '@/components/ab/form'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthActions } from '@/data/auth'
import { useSession } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { AuthErrorAlert, type AuthFailure } from './auth-error'
import { AuthLayout } from './auth-layout'
import { formatCountdown, useCountdown } from './use-countdown'

const signInSchema = z.object({
  email: z.string().min(1, MESSAGES.errors.emailRequired),
  password: z.string().min(1, MESSAGES.errors.passwordTooShort),
  rememberMe: z.boolean(),
})

type SignInValues = z.infer<typeof signInSchema>

export function SignInScreen() {
  const auth = useAuthActions()
  const session = useSession()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const [failure, setFailure] = useState<AuthFailure | null>(null)

  const secondsLeft = useCountdown(session.lockedUntil)
  const lockedOut = secondsLeft > 0

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up where your queue left off."
      aside={{
        heading: 'Nothing waiting on you goes unnoticed.',
        body: 'The beacon only pulses when something genuinely needs review — so an empty queue means you are actually done.',
      }}
      footer={
        <>
          New here?{' '}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            to="/signup"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Form
        form={form}
        onSubmit={async (values) => {
          if (lockedOut) return
          setFailed(false)
          setFailure(null)
          const result = await auth.signIn({
            email: values.email,
            password: values.password,
            rememberMe: values.rememberMe,
          })
          if (!result.ok) {
            // Correct password, unverified address: A3 owns the rest — the
            // seam has already remembered which email is pending.
            if (result.reason === 'email_not_verified') {
              navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
              return
            }
            if (result.code === 'unauthorized') {
              setFailed(true)
              return
            }
            setFailure(result)
            return
          }
          navigate('/')
        }}
      >
        {lockedOut ? (
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            <span className="font-medium">
              {MESSAGES.errors.signInLockedOut} <MonoNumber value={formatCountdown(secondsLeft)} />
            </span>
            <span className="text-muted-foreground">
              This protects the account after repeated attempts. Nothing is lost.
            </span>
          </div>
        ) : (
          failed && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {MESSAGES.errors.signInIncorrect}
            </div>
          )
        )}
        <AuthErrorAlert failure={failure} />

        <TextField name="email" label="Work email" type="email" placeholder="you@company.com" />
        <TextField name="password" label="Password" type="password" />

        {/* Mirrors the API's own rememberMe: 30-day sliding session instead
            of 12-hour, localStorage instead of tab-scoped. */}
        <FormField name="rememberMe" label="Keep me signed in on this device" orientation="horizontal">
          {({ invalid: _invalid, value, onChange, ...field }) => (
            <Checkbox {...field} checked={Boolean(value)} onCheckedChange={onChange} />
          )}
        </FormField>

        <div className="-mt-2 text-right text-sm">
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            to="/reset-password"
          >
            Forgot password?
          </Link>
        </div>

        <FormActions className="flex-col items-stretch">
          <Button type="submit" size="lg" disabled={lockedOut}>
            {lockedOut ? 'Locked' : 'Sign in'}
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}
