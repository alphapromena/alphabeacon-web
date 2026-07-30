/**
 * Accept invite · `/accept-invite?email=…&code=…` — the documented deep link
 * from an org invitation email (docs/api/api.md).
 *
 * This screen exists for NEW users only: an existing user's membership is
 * added the moment they are invited, with no code to redeem. Redeeming sets
 * the password (and optionally the name), verifies the email, and LOGS THE
 * USER IN — the response is a full auth session, so success lands straight
 * in the workspace that invited them.
 *
 * Arriving without both params is a designed dead end with exits, not a
 * crash: invites are minted by an admin, so "ask for a fresh one" is the
 * only honest recovery.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { MailWarning } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormActions, FormField, TextField } from '@/components/ab/form'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/data/auth'
import { MESSAGES } from '@/lib/messages'
import { AuthErrorAlert, type AuthFailure } from './auth-error'
import { AuthLayout } from './auth-layout'
import { passwordScore } from './password-rules'
import { PasswordStrength } from './password-strength'

const acceptSchema = z
  .object({
    name: z.string(),
    password: z
      .string()
      .min(8, MESSAGES.errors.passwordTooShort)
      .refine((value) => passwordScore(value) >= 2, MESSAGES.errors.passwordTooWeak),
    confirm: z.string().min(1, MESSAGES.errors.passwordTooShort),
    rememberMe: z.boolean(),
  })
  .refine((values) => values.password === values.confirm, {
    message: MESSAGES.errors.passwordsDoNotMatch,
    path: ['confirm'],
  })

const ASIDE = {
  heading: 'Your team saved you a seat.',
  body: 'Set a password and you land in their workspace — drafts, calendar, and all. Approvals you make are attributed to you from the first one.',
}

export function AcceptInviteScreen() {
  const auth = useAuthActions()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email')
  const code = params.get('code')

  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<z.infer<typeof acceptSchema>>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { name: '', password: '', confirm: '', rememberMe: false },
  })
  const password = form.watch('password')

  if (!email || !code) {
    return (
      <AuthLayout
        title="This invite link is incomplete"
        subtitle="It should have arrived by email with your address and a code in it. Ask whoever invited you to resend it."
        aside={ASIDE}
      >
        <div className="flex flex-col gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <MailWarning aria-hidden className="size-6" />
          </div>
          <Button asChild variant="ghost">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // A dead code cannot succeed, so it does not look like it might.
  if (failure && (failure.code === 'bad_request' || failure.code === 'conflict')) {
    return (
      <AuthLayout
        title="That invite has expired"
        subtitle="Invite codes last 10 minutes. Ask whoever invited you to resend it — the new email replaces this one."
        aside={ASIDE}
      >
        <Button asChild variant="ghost">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Join your team"
      subtitle={`You're accepting an invitation as ${email}.`}
      aside={ASIDE}
      footer={
        <>
          Already have an account here?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <Form
        form={form}
        onSubmit={async (values) => {
          setSubmitting(true)
          setFailure(null)
          const result = await auth.acceptInvite({
            email,
            code,
            password: values.password,
            name: values.name.trim() || undefined,
            rememberMe: values.rememberMe,
          })
          setSubmitting(false)
          if (!result.ok) {
            setFailure(result)
            return
          }
          toastSuccess('Welcome aboard', { description: 'Your workspace is ready.' })
          navigate('/')
        }}
      >
        <AuthErrorAlert failure={failure} />

        <TextField
          name="name"
          label="Your name"
          description="Optional — how approvals and drafts attribute you."
          placeholder="Maya Haddad"
        />

        <FormField name="password" label="Password">
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
        <TextField name="confirm" label="Confirm password" type="password" />

        <FormField
          name="rememberMe"
          label="Keep me signed in on this device"
          orientation="horizontal"
        >
          {({ invalid: _invalid, value, onChange, ...field }) => (
            <Checkbox {...field} checked={Boolean(value)} onCheckedChange={onChange} />
          )}
        </FormField>

        <FormActions className="flex-col items-stretch">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Joining…' : 'Join the workspace'}
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}
