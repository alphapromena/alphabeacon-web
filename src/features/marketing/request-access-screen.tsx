/**
 * M-series — Request early access · `/request-access` (public).
 *
 * Malaky launches on an early-access model (production pass 2026-08-11;
 * Phase 2 §24): the marketing CTAs land here, not in the app's signup.
 * Real fields, real validation through the one form layer, and a
 * confirmation that reads like an invitation — "You're on the list." —
 * not a toast.
 *
 * Where the request goes: nowhere over the network, by law — this app is
 * fully static without `VITE_API_BASE_URL`, and no vendor is approved.
 * Submission is buffered through the same seam as every marketing event
 * (`analytics.ts` → `window.dataLayer`) plus localStorage, so an approved
 * form vendor or the future API plugs in without touching this screen's
 * call sites. The form promises a reply, so open-items.md carries a manual
 * gate: do not launch the page without wiring a real destination.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { Form, FormActions, FormField, TextAreaField, TextField } from '@/components/ab/form'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MESSAGES } from '@/lib/messages'
import { track } from './analytics'

const ROLES = [
  'Founder / CEO',
  'Marketing lead',
  'Agency / consultant',
  'Operations',
  'Other',
] as const

const requestSchema = z.object({
  name: z.string().min(1, MESSAGES.errors.nameRequired),
  email: z
    .string()
    .min(1, MESSAGES.errors.emailRequired)
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), MESSAGES.errors.emailInvalid),
  company: z.string().min(1, MESSAGES.errors.requestCompanyRequired),
  country: z.string().min(1, MESSAGES.errors.requestCountryRequired),
  website: z.string().optional(),
  role: z.string().min(1, MESSAGES.errors.requestRoleRequired),
  handleFirst: z.string().optional(),
})

type RequestValues = z.infer<typeof requestSchema>

export function RequestAccessScreen() {
  const [submitted, setSubmitted] = useState<RequestValues | null>(null)

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      country: '',
      website: '',
      role: '',
      handleFirst: '',
    },
  })

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-18 max-w-6xl items-center px-6">
          <Link
            to="/"
            className="flex items-center rounded-md py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <img src="/brand/malaky-logo-charcoal.png" alt="Malaky" className="h-10 w-auto dark:hidden" />
            <img src="/brand/malaky-logo-white.png" alt="" aria-hidden className="hidden h-10 w-auto dark:block" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-16">
        {submitted ? (
          <div aria-live="polite" className="flex flex-col items-start gap-5">
            <span className="grid size-12 place-items-center rounded-full bg-success/10">
              <Check aria-hidden className="size-6 text-success" />
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              You&apos;re on the list.
            </h1>
            <p className="max-w-[48ch] text-muted-foreground">
              Thank you, {submitted.name.split(' ')[0]}. We onboard a small number of businesses
              at a time so every workspace gets set up properly. We&apos;ll write to you at{' '}
              <span className="font-medium text-foreground">{submitted.email}</span> when it&apos;s{' '}
              {submitted.company}&apos;s turn.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to Malaky</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">
              Request early access
            </h1>
            <p className="mt-3 max-w-[52ch] text-muted-foreground">
              Malaky is onboarding businesses in small groups. Tell us about yours, and we&apos;ll
              be in touch when your workspace is ready.
            </p>

            <Form
              form={form}
              className="mt-10"
              onSubmit={(values) => {
                track('request_access_submitted', { role: values.role, country: values.country })
                try {
                  localStorage.setItem('malaky:request-access', JSON.stringify(values))
                } catch {
                  // Storage may be unavailable (private mode); the event
                  // buffer above still carries the submission.
                }
                setSubmitted(values)
              }}
            >
              <TextField name="name" label="Full name" placeholder="Maya Haddad" />
              <TextField name="email" label="Work email" type="email" placeholder="you@company.com" />
              <TextField name="company" label="Company" placeholder="Falak Logistics" />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField name="country" label="Country" placeholder="Saudi Arabia" />
                <TextField name="website" label="Website (optional)" placeholder="yourcompany.com" />
              </div>

              <FormField name="role" label="Your role">
                {({ invalid, value, onChange, ref, ...field }) => (
                  <Select value={value || undefined} onValueChange={onChange}>
                    <SelectTrigger
                      id={field.id}
                      aria-invalid={field['aria-invalid']}
                      aria-describedby={field['aria-describedby']}
                      className="w-full"
                    >
                      <SelectValue placeholder="Pick the closest" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <TextAreaField
                name="handleFirst"
                label="What should Malaky handle first? (optional)"
                placeholder="The weekly Instagram posts nobody has time for, our launch in October…"
                rows={3}
              />

              <FormActions className="flex-col items-stretch">
                <Button type="submit" size="lg">
                  Request access
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  No card details, no commitment — this is a request, not a signup.
                </p>
              </FormActions>
            </Form>
          </>
        )}
      </main>
    </div>
  )
}
