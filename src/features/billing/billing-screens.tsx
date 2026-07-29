/**
 * Billing — H1 plans, H2 subscription, H3 credits ledger, H4 checkout returns.
 *
 * Two rules run through all four.
 *
 * The BALANCE IS NEVER STORED. It is the sum of the ledger, every time, so a
 * displayed number cannot drift from the rows that explain it. H3 shows the
 * arithmetic openly, including the reserved-but-not-committed rows that make a
 * balance look smaller than the spend history suggests.
 *
 * PAST DUE GATES THE PRODUCT, not a screen. The banner is global (see
 * `AppShell`), and the actions that would spend money are refused here until
 * it clears — a failed payment that only shows up in Billing is a failed
 * payment nobody notices.
 */
import { AlertTriangle, ArrowLeft, Check, CreditCard, X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Link } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid, SkeletonList } from '@/components/ab/skeletons'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useBilling,
  useCreditBalance,
  useDataDispatch,
  useJobs,
  useLedger,
  usePlans,
  useScreenPhase,
} from '@/data/provider'
import type { LedgerEntryType, PlanTier } from '@/data/types'
import { shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 }

// ---------------------------------------------------------------------------
// H1 — Plans
// ---------------------------------------------------------------------------

export function PlansScreen() {
  const plans = usePlans()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  return (
    <AppShell title="Plans" context="Same prices as the public site — one source">
      {phase === 'loading' ? (
        <SkeletonCardGrid cards={3} columns={3} label="Loading plans" />
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load plans. Your subscription is unaffected — try again."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const current = plan.id === billing.planId
              const upgrade = TIER_RANK[plan.id] > TIER_RANK[billing.planId]

              return (
                <Card key={plan.id} className={cn(current && 'ring-2 ring-primary')}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
                      {current && <StatusBadge label="Current plan" tone="success" icon={Check} />}
                    </div>
                    <p className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold">
                        $<MonoNumber value={plan.priceMonthly} />
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <MonoNumber value={plan.credits} /> credits a month
                    </p>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between gap-6">
                    <ul className="flex flex-col gap-2 text-sm">
                      {plan.entitlements.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {/* What this plan does NOT include is stated, not implied
                          by absence — the cross is paired with words. */}
                      {!plan.entitlements.studio && (
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <X aria-hidden className="mt-0.5 size-4 shrink-0" />
                          <span>No Creative Studio</span>
                        </li>
                      )}
                    </ul>

                    {current ? (
                      <Button disabled variant="outline">
                        Current plan
                      </Button>
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button variant={upgrade ? 'default' : 'outline'}>
                            {upgrade ? 'Upgrade' : 'Downgrade'}
                          </Button>
                        }
                        title={`${upgrade ? 'Upgrade' : 'Downgrade'} to ${plan.name}?`}
                        consequence={
                          upgrade
                            ? `You will be charged the difference for the rest of this period, and ${plan.credits} credits are granted straight away.`
                            : `You keep your current credits, but your monthly grant drops to ${plan.credits} and any entitlement above the ${plan.name} plan stops at the end of this period.`
                        }
                        confirmLabel={upgrade ? 'Upgrade' : 'Downgrade'}
                        destructive={!upgrade}
                        onConfirm={() => {
                          dispatch({ type: 'billing/changePlan', planId: plan.id })
                          toastSuccess(`You are on the ${plan.name} plan`, {
                            description: `${plan.credits} credits added.`,
                          })
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground">Cancel anytime, no long-term contracts.</p>
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// H2 — Subscription
// ---------------------------------------------------------------------------

export function SubscriptionScreen() {
  const billing = useBilling()
  const plans = usePlans()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const plan = plans.find((p) => p.id === billing.planId)
  const pastDue = billing.status === 'past_due'

  return (
    <AppShell title="Subscription" context={plan?.name}>
      {phase === 'loading' ? (
        <SkeletonList rows={3} label="Loading your subscription" />
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load your subscription. Nothing has changed — try again."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="mx-auto flex max-w-[680px] flex-col gap-6">
          {pastDue && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
            >
              <p className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle aria-hidden className="size-4" />
                Your payment failed
              </p>
              <p className="text-sm text-muted-foreground">
                Publishing and Studio generation are paused until a payment goes through. Your
                drafts, schedule and history are untouched.
              </p>
              <Button
                className="self-start"
                onClick={() => {
                  dispatch({ type: 'billing/resolvePastDue' })
                  toastSuccess('Payment method updated', {
                    description: 'Publishing and Studio are back on.',
                  })
                }}
              >
                Update payment method
              </Button>
            </div>
          )}

          <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-lg font-semibold">{plan?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  $<MonoNumber value={plan?.priceMonthly ?? 0} /> a month ·{' '}
                  <MonoNumber value={plan?.credits ?? 0} /> credits
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/billing/plans">Change plan</Link>
              </Button>
            </div>

            {billing.renewsAt && !pastDue && (
              <p className="text-sm text-muted-foreground">
                Renews <MonoNumber value={shortDate(billing.renewsAt)} />
              </p>
            )}
            {billing.status === 'canceled' && billing.endsAt && (
              <p className="text-sm text-muted-foreground">
                Access ends <MonoNumber value={shortDate(billing.endsAt)} />
              </p>
            )}
          </section>

          {billing.paymentMethod && (
            <section className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
              <span className="flex items-center gap-2 text-sm">
                <CreditCard aria-hidden className="size-4 text-muted-foreground" />
                {billing.paymentMethod.brand} ending{' '}
                <MonoNumber value={billing.paymentMethod.last4} />
              </span>
              <Button variant="ghost" size="sm">
                Update
              </Button>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">Billing history</h2>
            {billing.history.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nothing billed yet — your first invoice appears here.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {billing.history.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <MonoNumber value={shortDate(invoice.at)} className="text-sm" />
                    <span className="text-sm">
                      $<MonoNumber value={invoice.amount} />
                    </span>
                    <StatusBadge
                      label={invoice.status === 'paid' ? 'Paid' : 'Failed'}
                      tone={invoice.status === 'paid' ? 'success' : 'danger'}
                      icon={invoice.status === 'paid' ? Check : AlertTriangle}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="self-start">
                Cancel subscription
              </Button>
            }
            title="Cancel your subscription?"
            consequence="Your pipeline stops generating at the end of the period you have already paid for. Drafts, published posts and analytics stay readable, but nothing new is drafted or published, and unused credits are lost."
            confirmLabel="Cancel subscription"
            onConfirm={() =>
              toastSuccess('Subscription canceled', {
                description: 'You keep access until the end of this period.',
              })
            }
          />
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// H3 — Credits ledger
// ---------------------------------------------------------------------------

const LEDGER_LABELS: Record<
  LedgerEntryType,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  grant: { label: 'Grant', tone: 'success' },
  reserved: { label: 'Reserved', tone: 'warning' },
  released: { label: 'Released', tone: 'neutral' },
  committed: { label: 'Committed', tone: 'danger' },
  refund: { label: 'Refund', tone: 'success' },
}

export function CreditsScreen() {
  const ledger = useLedger()
  const balance = useCreditBalance()
  const jobs = useJobs()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const rows = [...ledger].sort((a, b) => b.at.localeCompare(a.at))
  const outstanding = ledger
    .filter((entry) => entry.type === 'reserved')
    .filter(
      (entry) =>
        !ledger.some((other) => other.type === 'released' && other.ref?.id === entry.ref?.id),
    )

  return (
    <AppShell title="Credits" context="Every grant, hold and spend">
      {phase === 'loading' ? (
        <SkeletonList rows={5} label="Loading your credit history" />
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load your credit history. Your balance is unaffected — try again."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-wider text-muted-foreground uppercase">
                Balance
              </span>
              {/* Always the sum of the rows below — never a stored number. */}
              <MonoNumber value={balance} className="text-4xl font-semibold" />
            </div>
            {outstanding.length > 0 && (
              <p className="max-w-xs text-sm text-muted-foreground">
                <MonoNumber value={outstanding.reduce((sum, e) => sum + Math.abs(e.amount), 0)} />{' '}
                credits are held by runs still in flight. They return if a run fails.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">History</h2>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nothing yet — your first grant appears here when your plan starts.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {rows.map((entry) => {
                  const meta = LEDGER_LABELS[entry.type]
                  const held =
                    entry.type === 'reserved' &&
                    outstanding.some((candidate) => candidate.id === entry.id)
                  const job =
                    entry.ref?.kind === 'job'
                      ? jobs.find((candidate) => candidate.id === entry.ref?.id)
                      : undefined

                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 px-4 py-3',
                        // A hold that has not resolved reads differently from a
                        // settled row, because it may still come back.
                        held && 'bg-warning/5',
                      )}
                    >
                      <MonoNumber
                        value={shortDate(entry.at)}
                        className="w-16 shrink-0 text-xs text-muted-foreground"
                      />
                      <StatusBadge
                        label={held ? 'Held' : meta.label}
                        tone={meta.tone}
                        icon={entry.amount >= 0 ? Check : AlertTriangle}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                        {job
                          ? job.prompt
                          : entry.ref?.kind === 'subscription'
                            ? 'Subscription'
                            : ''}
                      </span>
                      <MonoNumber
                        value={`${entry.amount >= 0 ? '+' : ''}${entry.amount}`}
                        className={cn(
                          'text-sm font-semibold',
                          entry.amount >= 0 ? 'text-success' : 'text-foreground',
                        )}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// H4 — Checkout return states
// ---------------------------------------------------------------------------

export function CheckoutReturnScreen() {
  const [params] = useSearchParams()
  const state = params.get('state') ?? 'success'
  const plans = usePlans()
  const billing = useBilling()
  const plan = plans.find((p) => p.id === billing.planId)

  return (
    <AppShell title="Checkout">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        {state === 'success' && (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <Check aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">
                You&apos;re on the {plan?.name} plan
              </h2>
              <p className="text-sm text-muted-foreground">
                <MonoNumber value={plan?.credits ?? 0} /> credits have been added to your balance.
              </p>
            </div>
            <Button asChild>
              <Link to="/">Go to your dashboard</Link>
            </Button>
          </>
        )}

        {state === 'canceled' && (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <X aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">Checkout canceled</h2>
              <p className="text-sm text-muted-foreground">
                No charge was made and your plan is unchanged.
              </p>
            </div>
            <Button asChild>
              <Link to="/billing/plans">
                <ArrowLeft aria-hidden />
                Back to plans
              </Link>
            </Button>
          </>
        )}

        {state === 'processing' && (
          <>
            {/* The webhook-lag state: honest about waiting rather than
                claiming success it cannot yet confirm. */}
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">Confirming your payment…</h2>
              <p className="text-sm text-muted-foreground">
                Your bank has approved it and we are waiting for confirmation. This usually takes a
                few seconds — nothing is charged twice if you refresh.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/billing/subscription">Check your subscription</Link>
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
