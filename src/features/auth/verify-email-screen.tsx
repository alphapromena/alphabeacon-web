/**
 * A3 — Verify email · `/verify-email` (`?email=` keeps the subject across a
 * refresh; `?state=expired` reaches the expired-link recovery directly).
 *
 * Two modes, one screen:
 * - **Live** (INT-1): the emailed 6-digit code is entered HERE — verifying
 *   consumes it and logs the user in (the response is a full auth session).
 *   Resend is rate-limited server-side (60 s between sends), and the button
 *   counts the wait down in mono rather than refusing silently.
 * - **Static**: the demo's link metaphor, unchanged — "I've verified my
 *   email" stands in for the click that would arrive from the inbox.
 */
import { MailCheck, MailWarning } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { useAuthActions } from '@/data/auth'
import { useLiveMode, useSession } from '@/data/provider'
import { VERIFY_RESEND_COOLDOWN_MS } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { AuthErrorAlert, type AuthFailure } from './auth-error'
import { AuthLayout } from './auth-layout'
import { formatCountdown, useCountdown } from './use-countdown'

/** The server enforces 60 s between sends; the button says so up front. */
const LIVE_RESEND_COOLDOWN_MS = 60_000

export function VerifyEmailScreen() {
  const auth = useAuthActions()
  const live = useLiveMode()
  const session = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const expired = params.get('state') === 'expired'

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(undefined)
  const secondsLeft = useCountdown(cooldownUntil)
  const email = params.get('email') ?? session.pendingEmail ?? session.user?.email ?? 'your email'

  const resend = async () => {
    setFailure(null)
    const result = await auth.resendVerification(email)
    if (!result.ok) {
      setFailure(result)
      if (result.retryAfterSeconds) {
        setCooldownUntil(Date.now() + result.retryAfterSeconds * 1000)
      }
      return
    }
    setCooldownUntil(Date.now() + (live ? LIVE_RESEND_COOLDOWN_MS : VERIFY_RESEND_COOLDOWN_MS))
    toastSuccess(live ? 'Verification code sent' : 'Verification email sent', {
      description: `On its way to ${email}.`,
    })
  }

  const verify = async () => {
    setVerifying(true)
    setFailure(null)
    const result = await auth.verifyEmail({ email, code })
    setVerifying(false)
    if (!result.ok) {
      setFailure(result)
      setCode('')
      return
    }
    // Verified AND signed in — RootGate routes by org state from here.
    navigate('/')
  }

  return (
    <AuthLayout
      title={expired ? 'That link has expired' : 'Check your inbox'}
      subtitle={
        expired
          ? MESSAGES.errors.verifyLinkExpired
          : live
            ? `We sent a 6-digit code to ${email}. Enter it below.`
            : `We sent a verification link to ${email}.`
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

        <AuthErrorAlert failure={failure} />

        {live && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="verify-code">Verification code</Label>
            <InputOTP
              id="verify-code"
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={() => void verify()}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            disabled={secondsLeft > 0}
            onClick={() => void resend()}
          >
            {secondsLeft > 0 ? (
              <>
                Resend in <MonoNumber value={formatCountdown(secondsLeft)} />
              </>
            ) : live ? (
              'Resend code'
            ) : (
              'Resend email'
            )}
          </Button>

          {live ? (
            <Button size="lg" disabled={code.length < 6 || verifying} onClick={() => void verify()}>
              {verifying ? 'Verifying…' : 'Verify email'}
            </Button>
          ) : (
            /*
             * Standing in for the click that would arrive from the inbox. The
             * static world has no mail, so the same transition is offered
             * directly rather than leaving the rest of the journey unreachable.
             */
            <Button
              size="lg"
              onClick={() => {
                void auth.verifyEmail({ email, code: '' })
                navigate('/onboarding')
              }}
            >
              I&apos;ve verified my email
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {live
            ? 'Codes expire after 10 minutes and allow 5 attempts. Resending replaces the old code.'
            : 'Links expire after 24 hours. If yours has, resend above — the new one replaces it.'}
        </p>
      </div>
    </AuthLayout>
  )
}
