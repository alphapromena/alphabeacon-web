/**
 * The billing seam (ORDER BIL-0902, decisions.md 2026-09-02).
 *
 * THE MODEL, in one line: subscriptions belong to the ORG; two monthly plans
 * (and Enterprise, which has no checkout — sales-assisted, a card with one
 * action); payment happens on a Stripe-hosted page the browser is sent to; every paid
 * invoice credits the org's wallet with exactly what was paid; the wallet is
 * the ONLY funding — a fresh org sits at zero and answers
 * `402 wallet_insufficient` to every generation until it subscribes.
 *
 * Four laws shape this file:
 * - **Wire is the record.** Plan names and prices are rendered from
 *   `GET /plans`, never from a constant here. The demo below mirrors the
 *   rows the sandbox delivered — keys, names, cents, interval — so the static
 *   page reads exactly like the product; nothing on it is the demo's own.
 * - **Single-shot POSTs, no retry.** `createCheckout` and `createPortal` are
 *   one click → one call → the caller assigns `window.location` to the url.
 *   A failure is returned, never retried; only a fresh click sends again.
 * - **The envelope is switched on `code`**, never on `message`. The caller
 *   maps `conflict` (already subscribed → Manage billing), `forbidden` (not
 *   an owner) and the rest.
 * - **The wallet read is the EXISTING one** (`src/data/wallet.ts` /
 *   `live-sync.ts`) — nothing here reads the wallet a second way.
 *
 * Features may not import `@/api/*`; every shape they need travels under the
 * data layer's name from here.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type {
  ApiBillingPlan,
  ApiBillingPlanId,
  ApiSubscription,
  ApiWalletCredit,
  CheckoutReceipt,
  CheckoutRequest,
  Paginated,
  PortalReceipt,
} from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import { useDataDispatch, useLiveOrgs, useOrg } from '@/data/provider'
import { useTeamPermissions } from '@/data/team'
import { useEffect, useMemo } from 'react'

export type {
  ApiBillingPlan as BillingPlan,
  ApiBillingPlanId as BillingPlanId,
  ApiSubscription as Subscription,
  ApiSubscriptionStatus as SubscriptionStatus,
  ApiWalletCredit as WalletCredit,
} from '@/api/types'

// ---------------------------------------------------------------------------
// The static demo — the wire's shape, zero network
// ---------------------------------------------------------------------------

/**
 * Two demo plans mirroring the sandbox EXACTLY as `GET /billing/plans`
 * delivered it on Ward's corrected contract (BIL-0902/R, org 1745,
 * 2026-09-02): the keys `base` / `pro` — unchanged by the correction — the
 * names as Stripe spells them, 59900 / 89900 usd per `month`. In live mode
 * the wire's own rows render, whatever they say; the demo only mirrors.
 */
export const DEMO_BILLING_PLANS: readonly ApiBillingPlan[] = [
  { plan: 'base', name: 'Malaky Business', amountCents: 59900, currency: 'usd', interval: 'month' },
  { plan: 'pro', name: 'Malaky Scale', amountCents: 89900, currency: 'usd', interval: 'month' },
]

/** The demo has never subscribed — the field set is the wire's at `none`. */
export function demoSubscription(): ApiSubscription {
  return {
    plan: null,
    status: 'none',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    updatedAt: null,
  }
}

/**
 * Where the demo's Subscribe lands. The product assigns `window.location` to
 * Stripe's url; the demo assigns it to the SAME route Stripe would return to,
 * so one code path walks both — and the success page then says, honestly,
 * that nothing was paid. `session_id=demo` is display-only, like the real one.
 */
export function demoCheckoutUrl(orgId: string): string {
  return `/billing/success?orgId=${encodeURIComponent(orgId)}&session_id=demo`
}

/** The portal's return route, which is also where the demo's Manage lands. */
export function demoPortalUrl(orgId: string): string {
  return `/billing?orgId=${encodeURIComponent(orgId)}`
}

// ---------------------------------------------------------------------------
// Results — one failure shape, switched on `code`
// ---------------------------------------------------------------------------

export type BillingFailure = Extract<AuthActionResult, { ok: false }>
export type BillingRead<T> = { ok: true; value: T } | BillingFailure
export type CheckoutResult = { ok: true; url: string; sessionId: string } | BillingFailure
export type PortalResult = { ok: true; url: string } | BillingFailure

function toFailure(error: unknown): BillingFailure {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      reason: error.reason,
      retryAfterSeconds: error.retryAfterSeconds,
      requestId: error.requestId,
    }
  }
  throw error
}

/** The default page of billing history — newest first, per the guide. */
export const CREDITS_PAGE_SIZE = 50

// ---------------------------------------------------------------------------
// The actions — scoped to an EXPLICIT org id, because the two billing routes
// carry the org in their query and that id is authoritative there
// ---------------------------------------------------------------------------

/** The hook: one stable object per mount, so effects may depend on it. */
export function useBillingActions(): BillingActions {
  const live = isLiveMode()
  return useMemo(() => createBillingActions(live), [live])
}

export type BillingActions = ReturnType<typeof createBillingActions>

/**
 * The actions themselves, mode in hand. A plain factory so the seam is
 * testable without a provider: `createBillingActions(false)` must never
 * touch `api`, and `createBillingActions(true)` must call each path exactly
 * once per invocation.
 */
export function createBillingActions(live: boolean) {
  const path = (orgId: string, suffix: string) => `/orgs/${orgId}/billing${suffix}`

  return {
    live,

    async listPlans(orgId: string): Promise<BillingRead<ApiBillingPlan[]>> {
      if (!live) return { ok: true, value: [...DEMO_BILLING_PLANS] }
      try {
        const page = await api<Paginated<ApiBillingPlan>>('GET', path(orgId, '/plans'))
        return { ok: true, value: page.items }
      } catch (error) {
        return toFailure(error)
      }
    },

    async getSubscription(orgId: string): Promise<BillingRead<ApiSubscription>> {
      if (!live) return { ok: true, value: demoSubscription() }
      try {
        const subscription = await api<ApiSubscription>('GET', path(orgId, '/subscription'))
        return { ok: true, value: subscription }
      } catch (error) {
        return toFailure(error)
      }
    },

    async listCredits(
      orgId: string,
      page: { limit: number; offset: number } = { limit: CREDITS_PAGE_SIZE, offset: 0 },
    ): Promise<BillingRead<Paginated<ApiWalletCredit>>> {
      if (!live) return { ok: true, value: { items: [], total: 0 } }
      try {
        const list = await api<Paginated<ApiWalletCredit>>('GET', path(orgId, '/credits'), {
          query: { limit: page.limit, offset: page.offset },
        })
        return { ok: true, value: list }
      } catch (error) {
        return toFailure(error)
      }
    },

    /**
     * ONE call. The caller sends the browser to `url` on success and shows
     * the failure otherwise — nothing here retries, and a second click is a
     * second, deliberate call. The demo answers its own success route.
     */
    async createCheckout(orgId: string, plan: ApiBillingPlanId): Promise<CheckoutResult> {
      if (!live) return { ok: true, url: demoCheckoutUrl(orgId), sessionId: 'demo' }
      const body: CheckoutRequest = { plan }
      try {
        const receipt = await api<CheckoutReceipt>('POST', path(orgId, '/checkout'), { body })
        return { ok: true, url: receipt.url, sessionId: receipt.sessionId }
      } catch (error) {
        return toFailure(error)
      }
    },

    /** ONE call, no body. Same law as checkout. */
    async createPortal(orgId: string): Promise<PortalResult> {
      if (!live) return { ok: true, url: demoPortalUrl(orgId) }
      try {
        const receipt = await api<PortalReceipt>('POST', path(orgId, '/portal'))
        return { ok: true, url: receipt.url }
      } catch (error) {
        return toFailure(error)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Who may subscribe or manage
// ---------------------------------------------------------------------------

/**
 * Owners subscribe and manage; any member reads. The demo has no owner tier
 * (its top tier is admin, `useTeamPermissions().protectedTier`), so the same
 * rule reads "the workspace's protected tier" in both modes — a rule
 * constant per mode, not an inference from the members list.
 */
export function useBillingPermissions(): { canManageBilling: boolean; viewerRole: string } {
  const perms = useTeamPermissions()
  return {
    viewerRole: perms.viewerRole,
    canManageBilling: perms.viewerRole === perms.protectedTier,
  }
}

// ---------------------------------------------------------------------------
// The org a billing page is FOR — the query's `orgId` is authoritative
// ---------------------------------------------------------------------------

export interface BillingScope {
  /** The org every call on the page is scoped to; null when there is none to call for. */
  orgId: string | null
  orgName: string
  /**
   * The query named an org this account belongs to that is NOT the one the
   * session was working in: the app switched to it (D-ONB-F mechanics — the
   * same `org/setActive` the rail's switcher dispatches) and the page says so.
   */
  switched: boolean
  /** The query named an org this account is not a member of: no call is made. */
  foreign: boolean
}

/**
 * Stripe returns to `/billing/success?orgId=…` and `/billing?orgId=…`; the
 * rail's own link carries no `orgId`. The interpretation on record
 * (decisions.md, BIL-0902): no query → the active org; the active org → as
 * is; another org this session belongs to → switch to it (the user came back
 * from paying for THAT workspace, and the app should be standing in it);
 * anything else → foreign, and the page renders an honest refusal instead of
 * reading a workspace the account cannot see.
 */
export function useBillingScope(requestedOrgId: string | null): BillingScope {
  const org = useOrg()
  const { orgs, activeOrgId } = useLiveOrgs()
  const dispatch = useDataDispatch()
  const live = isLiveMode()

  const current = org.id
  const requested = requestedOrgId && requestedOrgId.trim() !== '' ? requestedOrgId : null
  const member = live && requested ? orgs.find((entry) => entry.id === requested) : undefined
  const needsSwitch = Boolean(member && member.id !== activeOrgId)

  useEffect(() => {
    if (needsSwitch && member) dispatch({ type: 'org/setActive', orgId: member.id })
  }, [needsSwitch, member, dispatch])

  if (!requested || requested === current) {
    return { orgId: current, orgName: org.name, switched: false, foreign: false }
  }
  if (member) {
    return { orgId: member.id, orgName: member.name, switched: true, foreign: false }
  }
  return { orgId: null, orgName: '', switched: false, foreign: true }
}
