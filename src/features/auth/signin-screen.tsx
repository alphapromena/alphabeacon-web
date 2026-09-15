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
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, TextField } from '@/components/ab/form'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAuthActions } from '@/data/auth'
import { useSession } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { takeReturnTo } from '@/lib/return-to'
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
          {/* Not the accent: the one accent element on this screen is Sign in
              (NIGHT-0916 order 6, finding 2; D-NIGHT-0916-F). */}
          <Link
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            to="/signup"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Form
        form={form}
        // The inputs' radius is the small step (8 px), and the button below
        // takes the same — one shape for the field and its action, not a pill
        // beside a rounded box (NIGHT-0916 order 6, finding 4).
        className="[&_input]:rounded-[var(--radius-sm)]"
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
          // Back to where the person was — the app path the guard or the 401
          // handler remembered — or today's landing (NIGHT-0916 order 3;
          // D-NIGHT-0916-C). Read once and cleared.
          navigate(takeReturnTo() ?? '/')
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
            of 12-hour, localStorage instead of tab-scoped. The box sits BESIDE
            its words, on the start side, not across the row from them
            (NIGHT-0916 order 6, finding 3). */}
        <Controller
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                name={field.name}
                ref={field.ref}
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
              />
              <Label htmlFor="remember-me" className="font-normal">
                Keep me signed in on this device
              </Label>
            </div>
          )}
        />

        <div className="-mt-2 text-end text-sm">
          <Link
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            to="/reset-password"
          >
            Forgot password?
          </Link>
        </div>

        <FormActions className="flex-col items-stretch">
          <Button
            type="submit"
            size="lg"
            className="rounded-[var(--radius-sm)]"
            disabled={lockedOut}
          >
            {lockedOut ? 'Locked' : 'Sign in'}
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}
