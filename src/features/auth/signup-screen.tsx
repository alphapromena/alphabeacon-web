/**
 * A1 — Sign up · `/signup`. Creates the account and the organization in one
 * step, then hands off to A3 to verify the email.
 *
 * The duplicate-email case is a designed state, not a generic failure: it says
 * which email, and offers the sign-in link, because "already registered" is
 * usually a person who forgot they had an account.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, FormField, TextField } from '@/components/ab/form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/data/auth'
import { useSession } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { AuthErrorAlert, type AuthFailure } from './auth-error'
import { AuthLayout } from './auth-layout'
import { passwordScore } from './password-rules'
import { PasswordStrength } from './password-strength'

const signUpSchema = z.object({
  name: z.string().min(1, MESSAGES.errors.nameRequired),
  email: z
    .string()
    .min(1, MESSAGES.errors.emailRequired)
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), MESSAGES.errors.emailInvalid),
  password: z
    .string()
    .min(8, MESSAGES.errors.passwordTooShort)
    .refine((value) => passwordScore(value) >= 2, MESSAGES.errors.passwordTooWeak),
  orgName: z.string().min(1, MESSAGES.errors.orgNameRequired),
  terms: z.boolean().refine((value) => value, MESSAGES.errors.termsRequired),
})

type SignUpValues = z.infer<typeof signUpSchema>

export function SignUpScreen() {
  const auth = useAuthActions()
  const session = useSession()
  const navigate = useNavigate()
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null)
  const [failure, setFailure] = useState<AuthFailure | null>(null)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: session.user?.name ?? '',
      email: session.user?.email ?? '',
      password: '',
      orgName: '',
      terms: false,
    },
  })
  const password = form.watch('password')

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Connect your channels, review what we draft, and publish everywhere."
      aside={{
        heading: 'Your marketing team, with a co-pilot that never misses a slot.',
        body: 'Drafts arrive every morning. You approve what fits, create the art, and publish across every channel you connect.',
      }}
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <Form
        form={form}
        onSubmit={async (values) => {
          setDuplicateEmail(null)
          setFailure(null)
          const result = await auth.signUp({
            name: values.name,
            email: values.email,
            password: values.password,
            orgName: values.orgName,
          })
          if (!result.ok) {
            // A registered email is a designed state, not a generic failure;
            // per-field validation lands under its field; the rest render as
            // the shared alert switched on code.
            if (result.code === 'conflict') {
              setDuplicateEmail(values.email)
              return
            }
            for (const detail of result.fieldErrors) {
              form.setError(detail.field as keyof SignUpValues, { message: detail.message })
            }
            if (result.fieldErrors.length === 0) setFailure(result)
            return
          }
          // The address rides the URL so a refresh on A3 keeps its subject.
          navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
        }}
      >
        {duplicateEmail && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {MESSAGES.errors.emailTaken}{' '}
            <Link className="font-medium underline underline-offset-4" to="/login">
              Sign in instead
            </Link>
          </div>
        )}
        <AuthErrorAlert failure={failure} />

        <TextField name="name" label="Full name" placeholder="Maya Haddad" />
        <TextField name="email" label="Work email" type="email" placeholder="you@company.com" />

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

        <TextField
          name="orgName"
          label="Organization name"
          description="This is what your team and your drafts are grouped under."
          placeholder="Atlas Roasters"
        />

        {/* The label IS the consent sentence — a separate "Terms" caption
            beside it would leave the checkbox labelled by the wrong words. */}
        <FormField
          name="terms"
          label="I agree to the terms of service and the privacy policy."
          orientation="horizontal"
        >
          {({ invalid, value, onChange, ...field }) => (
            <Checkbox
              {...field}
              checked={Boolean(value)}
              onCheckedChange={onChange}
              aria-invalid={invalid || undefined}
            />
          )}
        </FormField>

        <FormActions className="flex-col items-stretch">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </FormActions>
      </Form>
    </AuthLayout>
  )
}
