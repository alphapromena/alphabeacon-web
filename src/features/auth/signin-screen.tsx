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
import { Form, FormActions, TextField } from '@/components/ab/form'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { useDataDispatch, useSession, useUsers } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { AuthLayout } from './auth-layout'
import { formatCountdown, useCountdown } from './use-countdown'

const signInSchema = z.object({
  email: z.string().min(1, MESSAGES.errors.emailRequired),
  password: z.string().min(1, MESSAGES.errors.passwordTooShort),
})

type SignInValues = z.infer<typeof signInSchema>

export function SignInScreen() {
  const dispatch = useDataDispatch()
  const session = useSession()
  const users = useUsers()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  const secondsLeft = useCountdown(session.lockedUntil)
  const lockedOut = secondsLeft > 0

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
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
        onSubmit={(values) => {
          if (lockedOut) return
          const known = users.some(
            (user) => user.email.toLowerCase() === values.email.trim().toLowerCase(),
          )
          if (!known) {
            setFailed(true)
            dispatch({ type: 'auth/signInFailed' })
            return
          }
          setFailed(false)
          dispatch({ type: 'auth/signInSucceeded' })
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

        <TextField name="email" label="Work email" type="email" placeholder="you@company.com" />
        <TextField name="password" label="Password" type="password" />

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
