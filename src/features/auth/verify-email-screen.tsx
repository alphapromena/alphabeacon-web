/**
 * A3 — Verify email · `/verify-email`.
 *
 * The screen a real product leaves people stranded on, so it carries three
 * exits: resend (rate-limited by a visible mono countdown rather than a silent
 * refusal), correct the address (back to A1 with it prefilled), and the
 * expired-link recovery. `?state=expired` reaches that last one directly —
 * every designed state has to be walkable without a mail server.
 */
import { MailCheck, MailWarning } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useDataDispatch, useSession } from '@/data/provider'
import { VERIFY_RESEND_COOLDOWN_MS } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { AuthLayout } from './auth-layout'
import { formatCountdown, useCountdown } from './use-countdown'

export function VerifyEmailScreen() {
  const session = useSession()
  const dispatch = useDataDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const expired = params.get('state') === 'expired'

  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(undefined)
  const secondsLeft = useCountdown(cooldownUntil)
  const email = session.pendingEmail ?? session.user?.email ?? 'your email'

  return (
    <AuthLayout
      title={expired ? 'That link has expired' : 'Check your inbox'}
      subtitle={
        expired ? MESSAGES.errors.verifyLinkExpired : `We sent a verification link to ${email}.`
      }
      aside={{
        heading: 'One click and your workspace is yours.',
        body: 'Verifying proves the address can receive the drafts, reports, and billing notices this account will send.',
      }}
      footer={
        <>
          Wrong address?{' '}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            to="/signup"
          >
            Change it and sign up again
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div
          className={
            expired
              ? 'flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning'
              : 'flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'
          }
        >
          {expired ? (
            <MailWarning aria-hidden className="size-6" />
          ) : (
            <MailCheck aria-hidden className="size-6" />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            disabled={secondsLeft > 0}
            onClick={() => {
              setCooldownUntil(Date.now() + VERIFY_RESEND_COOLDOWN_MS)
              toastSuccess('Verification email sent', { description: `On its way to ${email}.` })
            }}
          >
            {secondsLeft > 0 ? (
              <>
                Resend in <MonoNumber value={formatCountdown(secondsLeft)} />
              </>
            ) : (
              'Resend email'
            )}
          </Button>

          {/*
           * Standing in for the click that would arrive from the inbox. A real
           * build gets here from the emailed link; this app has no mail, so the
           * same transition is offered directly rather than leaving the rest of
           * the journey unreachable.
           */}
          <Button
            size="lg"
            onClick={() => {
              dispatch({ type: 'auth/verifyEmail' })
              navigate('/onboarding')
            }}
          >
            I&apos;ve verified my email
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Links expire after 24 hours. If yours has, resend above — the new one replaces it.
        </p>
      </div>
    </AuthLayout>
  )
}
