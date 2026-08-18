/**
 * The org's wallet and its metering read-back (INT-9, decisions.md D-INT-E).
 *
 * LIVE MODE SHOWS MONEY, NOT CREDITS. The wire has `{cents, heldCents,
 * availableCents}` and USD decimal strings; there is no credit anywhere in it,
 * and inventing an exchange rate would put a made-up number in front of a user
 * about their own money. The static demo keeps its credits ledger untouched.
 *
 * Two facts shape every screen that reads this:
 * - `availableCents` is what the next request is actually checked against, not
 *   `cents` — a wallet with everything held is a wallet that cannot spend.
 * - There is NO funding endpoint. Orgs are funded once, server-side, at
 *   creation. So a 402 cannot offer a top-up, and the honest state says so.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import type { ApiUsage, ApiUserUsageGrain, ApiWallet } from '@/api/types'
import { useDataDispatch, useLiveWallet, useLiveWorkingOrgId } from '@/data/provider'

/**
 * The shapes screens read, re-exported from the seam.
 *
 * Features may not import `@/api/*` — "no screen knows which side its data
 * came from" is a structural rule, enforced by eslint. The wallet and usage
 * shapes pass through unchanged (there is nothing to adapt: cents are cents
 * and a decimal string is a decimal string), but they travel under the data
 * layer's name so the boundary stays real.
 */
export type {
  ApiWallet as Wallet,
  ApiUsage as Usage,
  ApiUsageGroup as UsageGroup,
} from '@/api/types'
/** The two grains an end-user screen may ask for — never `tenant` (D-INT-E). */
export type { ApiUserUsageGrain as UsageGrain } from '@/api/types'

/** A never-funded tenant reads as all zeros — not a 404, and not an error. */
export function isFundingPending(wallet: ApiWallet | null): boolean {
  return (
    wallet !== null && wallet.cents === 0 && wallet.heldCents === 0 && wallet.availableCents === 0
  )
}

export function useWalletActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()

  return {
    /**
     * Re-read the balance. Called on org sync and after every generation or
     * job reaches a terminal state, because a hold is released or settled at
     * exactly that moment and a stale balance is the number a user would base
     * their next decision on.
     */
    async refresh(): Promise<void> {
      if (!live || !orgId) return
      try {
        const wallet = await api<ApiWallet>('GET', `/orgs/${orgId}/alphastudio/wallet`)
        dispatch({ type: 'live/walletRead', wallet })
      } catch {
        // A balance that cannot be read is not an error state of its own: the
        // action that needed it will report its own failure, and the chip
        // keeps whatever it last knew rather than flashing a wrong number.
      }
    },

    /**
     * The metering read-back for a window.
     *
     * `group_by=tenant` is deliberately unreachable from here: it reports
     * across EVERY org of this app (its keys are org ids), so it is a billing
     * view and must never back an end-user chart. The type makes that a
     * compile error rather than a review note.
     */
    async usage(from: string, to: string, groupBy: ApiUserUsageGrain): Promise<ApiUsage | null> {
      if (!live || !orgId) return null
      try {
        return await api<ApiUsage>('GET', `/orgs/${orgId}/alphastudio/usage`, {
          query: { from, to, group_by: groupBy },
        })
      } catch {
        return null
      }
    },
  }
}

/** The live balance, or null in static mode / before the first read. */
export function useWallet(): ApiWallet | null {
  return useLiveWallet()
}
