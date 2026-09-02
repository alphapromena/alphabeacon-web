/**
 * Billing · `/billing` — the plans, the subscription, and the history
 * (ORDER BIL-0902; Ward's Docs/api/billing-frontend.md is the contract).
 *
 * The subscription's `status` drives the page, per the guide's table:
 * `none / canceled / incomplete / incomplete_expired` → plans with Subscribe
 * (owners only — members see the plans and an honest line); `active /
 * trialing / paused` → Manage billing; `past_due / unpaid` → the failed-
 * payment banner, then Manage billing. The raw status word is always shown,
 * so a state this build has never seen is a visible fact, not a silent one.
 *
 * WIRE IS THE RECORD: every plan name and price on this page comes from
 * `GET /plans` as delivered — nothing is hardcoded and nothing is corrected.
 *
 * Checkout and the portal are SINGLE-SHOT: one click → one call →
 * `window.location.assign(url)`. A failure is shown and the button returns;
 * a second click is the user's decision, never this code's retry.
 *
 * Stripe returns here twice — abandoned checkout (`?checkout=cancelled`: the
 * plans again plus a small note, because nothing happened) and leaving the
 * portal (`?orgId=`: the subscription is re-read with a short poll, since the
 * webhook may lag a second). `orgId` in the query is authoritative for every
 * call on this page (`useBillingScope`).
 *
 * The page reads LAZILY on open — never at bootstrap — the MED-0831 pattern.
 */
import { AlertTriangle, Check, CreditCard, Wallet } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid, SkeletonList } from '@/components/ab/skeletons'
import { StatusBadge } from '@/components/ab/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  useBillingActions,
  useBillingPermissions,
  useBillingScope,
  type BillingPlan,
  type BillingPlanId,
  type Subscription,
  type WalletCredit,
} from '@/data/billing'
import { useLiveMode, useScreenPhase } from '@/data/provider'
import { isUnfunded, useWallet } from '@/data/wallet'
import { shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  billingFailureMessage,
  billingModeFor,
  formatPlanPrice,
  planNameFor,
  subscribeNoteFor,
  type BillingMode,
} from './billing-view'
import { RETURN_POLL_CEILING_MS, useSubscriptionPoll } from './use-subscription-poll'

/** The wire's status word, worn as a badge — never colour alone. */
function SubscriptionStatusBadge({ subscription }: { subscription: Subscription }) {
  const mode = billingModeFor(subscription.status)
  return (
    <StatusBadge
      label={subscription.status.replace(/_/g, ' ')}
      tone={mode === 'manage' ? 'success' : mode === 'payment_failed' ? 'danger' : 'neutral'}
      icon={mode === 'payment_failed' ? AlertTriangle : Check}
    />
  )
}

export function BillingScreen() {
  const [params] = useSearchParams()
  const scope = useBillingScope(params.get('orgId'))
  const returnedFromStripe = params.get('orgId') !== null
  const checkoutCancelled = params.get('checkout') === 'cancelled'
  const live = useLiveMode()
  const phase = useScreenPhase()
  const billing = useBillingActions()
  const { canManageBilling } = useBillingPermissions()
  const wallet = useWallet()

  const [plans, setPlans] = useState<BillingPlan[] | null>(null)
  const [credits, setCredits] = useState<{ items: WalletCredit[]; total: number } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  // The subscription: read on open, and — coming back from the portal — kept
  // fresh with a short poll, because the webhook may still be a second behind.
  const readSubscription = useCallback((orgId: string) => billing.getSubscription(orgId), [billing])
  const poll = useSubscriptionPoll({
    orgId: scope.orgId,
    read: readSubscription,
    until: () => !returnedFromStripe,
    ceilingMs: RETURN_POLL_CEILING_MS,
  })
  const subscription = poll.subscription

  // Plans and history: lazily, once per org (and again on Try again).
  useEffect(() => {
    if (!scope.orgId) return
    const orgId = scope.orgId
    setLoadError(null)
    void (async () => {
      const [plansResult, creditsResult] = await Promise.all([
        billing.listPlans(orgId),
        billing.listCredits(orgId),
      ])
      if (cancelled.current) return
      if (!plansResult.ok || !creditsResult.ok) {
        setLoadError(MESSAGES.errors.billingLoadFailed)
        return
      }
      setPlans(plansResult.value)
      setCredits(creditsResult.value)
    })()
  }, [scope.orgId, reloadNonce, billing])

  // --- The two single-shot actions -----------------------------------------
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  /** 409 on checkout: the org is already subscribed — Manage billing instead. */
  const [conflict, setConflict] = useState(false)

  async function subscribe(plan: BillingPlanId) {
    if (busy || !scope.orgId) return
    setBusy('checkout')
    setActionError(null)
    const result = await billing.createCheckout(scope.orgId, plan)
    if (cancelled.current) return
    if (result.ok) {
      // The whole integration: Stripe renders the payment form.
      window.location.assign(result.url)
      return
    }
    setBusy(null)
    if (result.code === 'conflict') {
      setConflict(true)
      // One GET, not a retry: the subscription the 409 speaks of should read
      // back live now — and if the webhook is still behind, the page still
      // offers Manage billing, because the server said one exists.
      poll.restart()
      return
    }
    setActionError(billingFailureMessage(result, 'checkout'))
  }

  async function manage() {
    if (busy || !scope.orgId) return
    setBusy('portal')
    setActionError(null)
    const result = await billing.createPortal(scope.orgId)
    if (cancelled.current) return
    if (result.ok) {
      window.location.assign(result.url)
      return
    }
    setBusy(null)
    setActionError(billingFailureMessage(result, 'portal'))
  }

  // --- What the page shows ---------------------------------------------------
  const mode: BillingMode | null = subscription
    ? conflict && billingModeFor(subscription.status) === 'subscribe'
      ? 'manage'
      : billingModeFor(subscription.status)
    : null
  const loading = phase === 'loading' || (!loadError && (plans === null || subscription === null))
  const context =
    live && wallet && !isUnfunded(wallet)
      ? `Wallet: ${formatCents(wallet.availableCents)} available`
      : live && wallet && isUnfunded(wallet)
        ? MESSAGES.notices.balanceUnfunded
        : 'Your plan funds your wallet; your wallet funds every generation'

  return (
    <AppShell title="Billing" context={context}>
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
        {scope.foreign ? (
          <ErrorState title="Not your workspace" message={MESSAGES.errors.billingForeignOrg} />
        ) : (
          <>
            {scope.switched && (
              <p role="status" className="text-sm text-muted-foreground">
                {MESSAGES.notices.billingShowingOrg} <strong>{scope.orgName}</strong>.
              </p>
            )}
            {checkoutCancelled && (
              <p
                role="status"
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                {MESSAGES.notices.checkoutCancelled}
              </p>
            )}

            {phase === 'error' || loadError ? (
              <ErrorState
                message={loadError ?? MESSAGES.errors.billingLoadFailed}
                onRetry={() => {
                  setPlans(null)
                  setCredits(null)
                  setReloadNonce((value) => value + 1)
                  poll.restart()
                }}
              />
            ) : loading || !subscription || !plans || mode === null ? (
              <SkeletonCardGrid cards={2} columns={2} label="Loading your plans" />
            ) : (
              <>
                {mode === 'payment_failed' && (
                  <div
                    role="alert"
                    className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
                  >
                    <p className="flex items-center gap-2 font-medium text-destructive">
                      <AlertTriangle aria-hidden className="size-4" />
                      {MESSAGES.notices.paymentFailed}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {MESSAGES.notices.paymentFailedDetail}
                    </p>
                  </div>
                )}

                {mode === 'subscribe' ? (
                  <PlansSection
                    plans={plans}
                    subscription={subscription}
                    conflict={conflict}
                    canSubscribe={canManageBilling}
                    busy={busy === 'checkout'}
                    onSubscribe={subscribe}
                  />
                ) : (
                  <SubscriptionSection
                    plans={plans}
                    subscription={subscription}
                    conflict={conflict}
                    canManage={canManageBilling}
                    busy={busy === 'portal'}
                    onManage={manage}
                  />
                )}

                {actionError && (
                  <p role="alert" className="text-sm text-destructive">
                    {actionError}
                  </p>
                )}

                <HistorySection credits={credits} />

                <p className="text-sm text-muted-foreground">
                  <Link className="underline underline-offset-4" to="/billing/balance">
                    See your balance and usage
                  </Link>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// The sections, exported so the owner/member split and the cancel-at-period-
// end line can be rendered in isolation (no static dataset signs in as a member).

export function PlansSection({
  plans,
  subscription,
  conflict,
  canSubscribe,
  busy,
  onSubscribe,
}: {
  plans: BillingPlan[]
  subscription: Subscription
  conflict: boolean
  canSubscribe: boolean
  busy: boolean
  onSubscribe: (plan: BillingPlanId) => void
}) {
  const note = subscribeNoteFor(subscription)
  return (
    <section aria-labelledby="plans-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="plans-heading" className="font-display text-lg font-semibold">
          Plans
        </h2>
        <SubscriptionStatusBadge subscription={subscription} />
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      {conflict && (
        <p role="status" className="text-sm text-muted-foreground">
          {MESSAGES.errors.checkoutConflict}
        </p>
      )}

      {plans.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {MESSAGES.empty.noPlans}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.plan} data-plan={plan.plan}>
              <CardHeader>
                {/* The name as Stripe delivers it — wire is the record. */}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="flex items-baseline gap-1">
                  <MonoNumber value={formatPlanPrice(plan)} className="text-2xl font-semibold" />
                </p>
                <p className="text-sm text-muted-foreground">
                  Adds <MonoNumber value={formatCents(plan.amountCents)} /> to your wallet on every
                  paid invoice.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end">
                {canSubscribe ? (
                  <Button disabled={busy} onClick={() => onSubscribe(plan.plan)}>
                    <CreditCard aria-hidden />
                    {busy ? 'Opening checkout…' : 'Subscribe'}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!canSubscribe && (
        <p role="status" className="text-sm text-muted-foreground">
          {MESSAGES.notices.billingOwnerOnly}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{MESSAGES.notices.checkoutOnStripe}</p>
    </section>
  )
}

export function SubscriptionSection({
  plans,
  subscription,
  conflict,
  canManage,
  busy,
  onManage,
}: {
  plans: BillingPlan[]
  subscription: Subscription
  conflict: boolean
  canManage: boolean
  busy: boolean
  onManage: () => void
}) {
  const planName = planNameFor(plans, subscription.plan)
  const plan = plans.find((entry) => entry.plan === subscription.plan)
  return (
    <section
      aria-labelledby="subscription-heading"
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="subscription-heading" className="font-display text-lg font-semibold">
            {planName || 'Your subscription'}
          </h2>
          {plan && (
            <p className="text-sm text-muted-foreground">
              <MonoNumber value={formatPlanPrice(plan)} />
            </p>
          )}
        </div>
        <SubscriptionStatusBadge subscription={subscription} />
      </div>

      {conflict && (
        <p role="status" className="text-sm text-muted-foreground">
          {MESSAGES.errors.checkoutConflict}
        </p>
      )}

      {subscription.currentPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd ? (
            <>
              {MESSAGES.notices.planEndsOn}{' '}
              <MonoNumber value={shortDate(subscription.currentPeriodEnd)} />.{' '}
              {MESSAGES.notices.resumeInPortal}
            </>
          ) : (
            <>
              Current period ends <MonoNumber value={shortDate(subscription.currentPeriodEnd)} />
            </>
          )}
        </p>
      )}

      {canManage ? (
        <Button className="self-start" disabled={busy} onClick={onManage}>
          <CreditCard aria-hidden />
          {busy ? 'Opening the portal…' : 'Manage billing'}
        </Button>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {MESSAGES.notices.billingOwnerOnly}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{MESSAGES.notices.portalDoes}</p>
    </section>
  )
}

function HistorySection({ credits }: { credits: { items: WalletCredit[]; total: number } | null }) {
  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-3">
      <h2 id="history-heading" className="font-display text-lg font-semibold">
        Billing history
      </h2>
      {credits === null ? (
        <SkeletonList rows={2} label="Loading your billing history" />
      ) : credits.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {MESSAGES.empty.noCredits}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {credits.items.map((row, index) => (
            <li
              key={row.stripeInvoiceId || index}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <Wallet aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <MonoNumber
                value={shortDate(row.createdAt)}
                className="w-20 shrink-0 text-xs text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {row.plan} plan · invoice <MonoNumber value={row.stripeInvoiceId} />
              </span>
              <MonoNumber
                value={`+${formatCents(row.cents)}`}
                className={cn('text-sm font-semibold', row.cents >= 0 && 'text-success')}
              />
            </li>
          ))}
        </ul>
      )}
      {credits !== null && credits.total > credits.items.length && (
        <p className="text-xs text-muted-foreground">
          Showing <MonoNumber value={credits.items.length} /> of{' '}
          <MonoNumber value={credits.total} /> payments.
        </p>
      )}
    </section>
  )
}
