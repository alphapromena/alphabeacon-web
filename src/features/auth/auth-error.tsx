/**
 * The one way an auth screen renders a live failure — copy from the
 * catalogue, switched on the result's `code` (never its message), with rate
 * limits counting down in mono because a wall you can see the end of is not
 * the same as being stuck.
 */
import { MonoNumber } from '@/components/ab/mono-number'
import type { AuthActionResult } from '@/data/auth'
import { MESSAGES } from '@/lib/messages'
import { formatCountdown, useCountdown } from './use-countdown'

export type AuthFailure = Extract<AuthActionResult, { ok: false }>

/** Catalogue copy for a failure the screen has no more specific answer for. */
function failureCopy(failure: AuthFailure): string {
  switch (failure.code) {
    case 'bad_request':
      return MESSAGES.errors.codeInvalid
    case 'forbidden':
      return failure.reason === 'email_not_verified'
        ? MESSAGES.errors.verifyLinkExpired
        : MESSAGES.errors.accountDisabled
    case 'unauthorized':
      return MESSAGES.errors.signInIncorrect
    case 'conflict':
      return MESSAGES.errors.emailTaken
    case 'network_error':
      return MESSAGES.notices.degraded
    default:
      return MESSAGES.errors.generic
  }
}

export function AuthErrorAlert({ failure }: { failure: AuthFailure | null }) {
  // Hooks before any return: the countdown deadline exists only for 429s.
  const deadline =
    failure?.code === 'rate_limited' && failure.retryAfterSeconds
      ? Date.now() + failure.retryAfterSeconds * 1000
      : undefined
  const secondsLeft = useCountdown(deadline)

  if (!failure) return null

  if (failure.code === 'rate_limited') {
    return (
      <div
        role="alert"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
      >
        {MESSAGES.errors.rateLimited}{' '}
        <MonoNumber value={formatCountdown(Math.max(secondsLeft, 0))} />
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {failureCopy(failure)}
    </div>
  )
}
