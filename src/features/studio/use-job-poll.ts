/**
 * The Studio media-job poller — ONE machinery, every consumer. INT-11 built it
 * inside E3's list; HSN-02 lifted it here so the Create-visual dialog follows
 * its job through the same schedule instead of growing a second poller.
 *
 * Polling uses the MEDIA JOB vocabulary (`succeeded`), never a run's
 * (`completed`). Sharing one predicate between them would poll forever.
 *
 * The contract with a consumer: hand it the jobs it is watching and a
 * `refresh` that re-reads them (and stores what it read). The hook ticks on
 * the schedule below while anything is in flight, refreshes the wallet the
 * moment the set settles — a hold is released or settled exactly there — and
 * stops at the ceiling with `timedOut` set, because "still rendering" is not
 * "failed" and the consumer has to say which.
 */
import { useEffect, useRef, useState } from 'react'
import { isJobTerminal, type MediaJob } from '@/data/studio'
import { useWalletActions } from '@/data/wallet'

/** 2s, 5s, 10s and up, stopping at five minutes (the order's schedule). */
export const POLL_DELAYS = [2000, 5000, 10_000, 10_000, 15_000, 20_000, 30_000]
export const POLL_CEILING_MS = 300_000

export function useJobPolling(
  jobs: MediaJob[] | null,
  refresh: () => Promise<MediaJob[]>,
): { timedOut: boolean } {
  const walletActions = useWalletActions()
  const [timedOut, setTimedOut] = useState(false)
  const cancelled = useRef(false)

  // The unmount guard is its own dependency-free effect - sharing it with a
  // data effect latches it on the first dependency change (INT-10's bug).
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const statusKey = (jobs ?? []).map((job) => job.status).join(',')

  // Poll only while something is genuinely in flight.
  useEffect(() => {
    setTimedOut(false)
    if (!jobs || jobs.every((job) => isJobTerminal(job))) return
    // A status change restarts this effect with a fresh schedule; a tick that
    // was mid-read when that happened must not schedule a sibling loop.
    let active = true
    let attempt = 0
    const startedAt = Date.now()
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      const list = await refresh()
      if (cancelled.current) return
      if (list.every((job) => isJobTerminal(job))) {
        // A hold is released or settled exactly here, so the balance moves.
        void walletActions.refresh()
        return
      }
      if (!active) return
      if (Date.now() - startedAt > POLL_CEILING_MS) {
        setTimedOut(true)
        return
      }
      attempt += 1
      timer = setTimeout(() => void tick(), POLL_DELAYS[Math.min(attempt, POLL_DELAYS.length - 1)])
    }

    timer = setTimeout(() => void tick(), POLL_DELAYS[0])
    return () => {
      active = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart when the set settles
  }, [statusKey])

  return { timedOut }
}
