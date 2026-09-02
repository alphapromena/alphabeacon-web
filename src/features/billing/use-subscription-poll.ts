/**
 * The subscription poll (ORDER BIL-0902).
 *
 * Arriving on `/billing/success` is NOT proof of payment: the backend learns
 * of it from a Stripe webhook that lands a second or two later. So the page
 * asks `GET /subscription` every two seconds until the status is `active`,
 * and gives up after a minute with an honest "still processing". Returning
 * from the portal (`/billing?orgId=`) uses the same machinery for a shorter
 * window with no stop condition, because the webhook may lag there too.
 *
 * This is polling a GET by design — it is not a retry (the standing law
 * forbids retrying POSTs; nothing here POSTs). The loop cleans up on unmount
 * and whenever its inputs change, so a page left early cannot keep a timer
 * alive or set state into a screen that is gone.
 */
import { useEffect, useRef, useState } from 'react'
import type { BillingRead, Subscription } from '@/data/billing'

/** The guide's numbers: every ~2 s, give up after ~60 s. */
export const SUCCESS_POLL_INTERVAL_MS = 2000
export const SUCCESS_POLL_CEILING_MS = 60_000
/** The portal return: a short poll, then stop quietly. */
export const RETURN_POLL_CEILING_MS = 10_000

export type PollPhase = 'idle' | 'polling' | 'settled' | 'stopped'

export interface SubscriptionPollOptions {
  /** The org to read; null disables the poll entirely (nothing to ask for). */
  orgId: string | null
  read: (orgId: string) => Promise<BillingRead<Subscription>>
  /** The condition that ends the poll early with `settled`. */
  until: (subscription: Subscription) => boolean
  intervalMs?: number
  ceilingMs?: number
  /** False keeps the hook inert — the static demo has nothing to confirm. */
  enabled?: boolean
}

export function useSubscriptionPoll({
  orgId,
  read,
  until,
  intervalMs = SUCCESS_POLL_INTERVAL_MS,
  ceilingMs = SUCCESS_POLL_CEILING_MS,
  enabled = true,
}: SubscriptionPollOptions): {
  subscription: Subscription | null
  /** The LAST read's failure, kept while later ticks keep trying. */
  error: string | null
  phase: PollPhase
  ticks: number
  /** Start over from a fresh clock — a user gesture, never automatic. */
  restart: () => void
} {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<PollPhase>('idle')
  const [ticks, setTicks] = useState(0)
  const [generation, setGeneration] = useState(0)
  // The latest callbacks, so a re-render never restarts the loop.
  const readRef = useRef(read)
  readRef.current = read
  const untilRef = useRef(until)
  untilRef.current = until

  useEffect(() => {
    if (!enabled || !orgId) {
      setPhase('idle')
      return
    }
    let active = true
    let finished = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()
    setPhase('polling')
    setTicks(0)

    const finish = () => {
      finished = true
      if (timer !== undefined) clearTimeout(timer)
      clearTimeout(deadline)
    }

    // THE GIVE-UP IS A WALL-CLOCK PROMISE. It fires at the ceiling whether or
    // not a read is still in flight: a slow API must not keep the page saying
    // "confirming" past the minute the guide promises. A read that lands
    // afterwards still counts if it is the answer (an `active` is good news
    // however late), but it schedules nothing more.
    const deadline = setTimeout(() => {
      if (!active || finished) return
      finish()
      setPhase('stopped')
    }, ceilingMs)

    const tick = async () => {
      const result = await readRef.current(orgId)
      if (!active) return
      setTicks((count) => count + 1)
      if (result.ok) {
        setError(null)
        setSubscription(result.value)
        if (untilRef.current(result.value)) {
          finish()
          setPhase('settled')
          return
        }
      } else {
        // A failed read is not a settled answer: keep asking until the clock
        // runs out, and keep the reason where the page can show it.
        setError(result.message)
      }
      if (finished) return
      if (Date.now() - startedAt >= ceilingMs) {
        finish()
        setPhase('stopped')
        return
      }
      timer = setTimeout(() => void tick(), intervalMs)
    }

    void tick()
    return () => {
      active = false
      finish()
    }
  }, [orgId, enabled, intervalMs, ceilingMs, generation])

  return {
    subscription,
    error,
    phase,
    ticks,
    restart: () => setGeneration((value) => value + 1),
  }
}
