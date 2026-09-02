/**
 * Billing · `/billing/success` — where Stripe sends the browser after a
 * successful checkout (ORDER BIL-0902).
 *
 * ARRIVING HERE IS NOT PROOF OF PAYMENT. The backend learns of the payment
 * from a webhook a second or two later, so this page polls
 * `GET /subscription` every 2 s and gives up after 60 s with an honest
 * "still processing". Only `active` is success: then the plan is named, the
 * wallet is re-read through the EXISTING wallet read and shown, and the way
 * back to the workspace is offered.
 *
 * `session_id` is read for display only and NEVER sent to our backend.
 *
 * The static demo lands here from its own Subscribe and says, plainly, that
 * nothing was paid — no poll, no pretence.
 */
import { Check, CreditCard, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { useBillingActions, useBillingScope, type Subscription } from '@/data/billing'
import { useLiveMode } from '@/data/provider'
import { useWallet, useWalletActions } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'
import { formatCents } from '@/lib/money'
import { planNameFor } from './billing-view'
import { useSubscriptionPoll } from './use-subscription-poll'

const isActive = (subscription: Subscription) => subscription.status === 'active'

export function BillingSuccessScreen() {
  const [params] = useSearchParams()
  const scope = useBillingScope(params.get('orgId'))
  const sessionId = params.get('session_id')
  const live = useLiveMode()
  const billing = useBillingActions()
  const wallet = useWallet()
  const walletActions = useWalletActions()

  const read = useCallback((orgId: string) => billing.getSubscription(orgId), [billing])
  const poll = useSubscriptionPoll({
    orgId: scope.orgId,
    read,
    until: isActive,
    enabled: live && !scope.foreign,
  })

  // The plan's wire NAME, for the confirmation line — one read, once active.
  const [planName, setPlanName] = useState<string | null>(null)
  useEffect(() => {
    if (poll.phase !== 'settled' || !scope.orgId || !poll.subscription) return
    const orgId = scope.orgId
    const planId = poll.subscription.plan
    let active = true
    // The fresh balance: the existing wallet read, never a second one.
    void walletActions.refresh()
    void billing.listPlans(orgId).then((result) => {
      if (!active) return
      setPlanName(result.ok ? planNameFor(result.value, planId) : (planId ?? ''))
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when it settles
  }, [poll.phase, scope.orgId])

  return (
    <AppShell title="Checkout">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-16 text-center">
        {scope.foreign ? (
          <ErrorState title="Not your workspace" message={MESSAGES.errors.billingForeignOrg} />
        ) : !live ? (
          <DemoState />
        ) : poll.phase === 'settled' && poll.subscription ? (
          <ActiveState planName={planName} wallet={wallet} />
        ) : poll.phase === 'stopped' ? (
          <StillProcessing
            subscription={poll.subscription}
            error={poll.error}
            onCheckAgain={poll.restart}
          />
        ) : (
          <Confirming subscription={poll.subscription} ticks={poll.ticks} />
        )}

        {sessionId && !scope.foreign && (
          <p className="text-xs text-muted-foreground">
            {MESSAGES.notices.checkoutSessionRef}{' '}
            <MonoNumber value={sessionId.length > 24 ? `${sessionId.slice(0, 24)}…` : sessionId} />
          </p>
        )}
      </div>
    </AppShell>
  )
}

function Confirming({ subscription, ticks }: { subscription: Subscription | null; ticks: number }) {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <CreditCard aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <h2 className="font-display text-xl font-semibold">Confirming your payment…</h2>
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.successConfirming}</p>
        {/* The wire's word, every tick, so nothing is assumed. */}
        {subscription && ticks > 0 && (
          <p className="text-xs text-muted-foreground">
            Subscription status right now: <MonoNumber value={subscription.status} />
          </p>
        )}
      </div>
    </>
  )
}

function StillProcessing({
  subscription,
  error,
  onCheckAgain,
}: {
  subscription: Subscription | null
  error: string | null
  onCheckAgain: () => void
}) {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
        <CreditCard aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-2" role="status">
        <h2 className="font-display text-xl font-semibold">Still processing</h2>
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.successStillProcessing}</p>
        {subscription && (
          <p className="text-xs text-muted-foreground">
            Last status read: <MonoNumber value={subscription.status} />
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onCheckAgain}>Check again</Button>
        <Button asChild variant="outline">
          <Link to="/billing">Back to billing</Link>
        </Button>
      </div>
    </>
  )
}

function ActiveState({
  planName,
  wallet,
}: {
  planName: string | null
  wallet: ReturnType<typeof useWallet>
}) {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
        <Check aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-2" role="status">
        <h2 className="font-display text-xl font-semibold">
          {planName ? `You're on the ${planName} plan` : 'Your subscription is active'}
        </h2>
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.successActive}</p>
      </div>
      <p className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm">
        <Wallet aria-hidden className="size-4 text-muted-foreground" />
        {wallet ? (
          <>
            Wallet:{' '}
            <MonoNumber value={formatCents(wallet.availableCents)} className="font-semibold" />{' '}
            available
          </>
        ) : (
          <span className="text-muted-foreground">{MESSAGES.notices.balanceLoading}</span>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/">Go to your workspace</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/billing">Billing</Link>
        </Button>
      </div>
    </>
  )
}

function DemoState() {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <CreditCard aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-2" role="status">
        <h2 className="font-display text-xl font-semibold">Nothing was paid</h2>
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.successDemo}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/billing">Back to billing</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go to your workspace</Link>
        </Button>
      </div>
    </>
  )
}
