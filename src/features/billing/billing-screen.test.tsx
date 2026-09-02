/**
 * The billing page's sections in isolation (ORDER BIL-0902):
 * - the owner/member split — Subscribe for the workspace's top tier, plans
 *   plus the honest line for everyone else (no static dataset signs in as a
 *   member, so the split is proven here rather than in the static e2e);
 * - the plan cards render the WIRE's name and cents, whatever they are;
 * - Subscribe is single-shot at the UI: one click, one call, and the control
 *   is disabled while the call is out;
 * - `cancelAtPeriodEnd: true` reads "ends on <currentPeriodEnd>", Resume in
 *   the portal;
 * - `useBillingPermissions` is the protected-tier rule per mode.
 */
import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { useBillingPermissions, type BillingPlan, type Subscription } from '@/data/billing'
import { DataProvider } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { PlansSection, SubscriptionSection } from './billing-screen'

// Pinned STATIC: vitest reads `.env.local`, which would boot the provider
// live (no session → role `member`) on a dev machine and static in CI. The
// permission rule below is about the demo's tiers, so the mode is fixed.
vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

const WIRE_PLANS: BillingPlan[] = [
  { plan: 'base', name: 'Malaki Base', amountCents: 50000, currency: 'usd', interval: 'year' },
  { plan: 'pro', name: 'Malaki Pro', amountCents: 80000, currency: 'usd', interval: 'year' },
]

const NONE: Subscription = {
  plan: null,
  status: 'none',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  updatedAt: null,
}

const inRouter = (node: ReactNode) => render(createElement(MemoryRouter, null, node))

describe('PlansSection — the owner/member split', () => {
  it('renders every plan from the wire, name and price as delivered, with Subscribe for the top tier', () => {
    inRouter(
      <PlansSection
        plans={WIRE_PLANS}
        subscription={NONE}
        conflict={false}
        canSubscribe
        busy={false}
        onSubscribe={() => {}}
      />,
    )
    // "Malaki" is Stripe's spelling; the page shows it, it does not fix it.
    expect(screen.getByRole('heading', { name: 'Malaki Base', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Malaki Pro', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('$500.00 / year')).toBeInTheDocument()
    expect(screen.getByText('$800.00 / year')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Subscribe' })).toHaveLength(2)
    expect(screen.queryByText(MESSAGES.notices.billingOwnerOnly)).not.toBeInTheDocument()
    // The wire's status word is worn openly.
    expect(screen.getByText('none')).toBeInTheDocument()
  })

  it('shows a member the plans, no button, and the honest line', () => {
    inRouter(
      <PlansSection
        plans={WIRE_PLANS}
        subscription={NONE}
        conflict={false}
        canSubscribe={false}
        busy={false}
        onSubscribe={() => {}}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Malaki Base', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('$500.00 / year')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(MESSAGES.notices.billingOwnerOnly)
  })

  it('Subscribe is one click → one call for THAT plan, and disabled while the call is out', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn()
    const { rerender } = inRouter(
      <PlansSection
        plans={WIRE_PLANS}
        subscription={NONE}
        conflict={false}
        canSubscribe
        busy={false}
        onSubscribe={onSubscribe}
      />,
    )
    await user.click(screen.getAllByRole('button', { name: 'Subscribe' })[1])
    expect(onSubscribe).toHaveBeenCalledTimes(1)
    expect(onSubscribe).toHaveBeenCalledWith('pro')

    rerender(
      createElement(
        MemoryRouter,
        null,
        <PlansSection
          plans={WIRE_PLANS}
          subscription={NONE}
          conflict={false}
          canSubscribe
          busy
          onSubscribe={onSubscribe}
        />,
      ),
    )
    for (const button of screen.getAllByRole('button', { name: 'Opening checkout…' })) {
      expect(button).toBeDisabled()
    }
    expect(onSubscribe).toHaveBeenCalledTimes(1)
  })

  it('says why the plans are back after a cancellation, and after a 409', () => {
    inRouter(
      <PlansSection
        plans={WIRE_PLANS}
        subscription={{
          ...NONE,
          plan: 'base',
          status: 'canceled',
          canceledAt: '2026-09-01T00:00:00Z',
        }}
        conflict
        canSubscribe
        busy={false}
        onSubscribe={() => {}}
      />,
    )
    expect(screen.getByText(MESSAGES.notices.subscriptionCanceled)).toBeInTheDocument()
    expect(screen.getByText(MESSAGES.errors.checkoutConflict)).toBeInTheDocument()
  })

  it('an empty plans list is shown as such, never filled from a constant', () => {
    inRouter(
      <PlansSection
        plans={[]}
        subscription={NONE}
        conflict={false}
        canSubscribe
        busy={false}
        onSubscribe={() => {}}
      />,
    )
    expect(screen.getByText(MESSAGES.empty.noPlans)).toBeInTheDocument()
    expect(screen.queryByText(/\$500\.00/)).not.toBeInTheDocument()
  })
})

describe('SubscriptionSection', () => {
  const ACTIVE: Subscription = {
    plan: 'pro',
    status: 'active',
    currentPeriodStart: '2026-09-02T10:00:00.000Z',
    currentPeriodEnd: '2027-09-02T10:00:00.000Z',
    cancelAtPeriodEnd: false,
    canceledAt: null,
    updatedAt: null,
  }

  it('names the plan from the wire and offers Manage billing to the top tier', async () => {
    const user = userEvent.setup()
    const onManage = vi.fn()
    inRouter(
      <SubscriptionSection
        plans={WIRE_PLANS}
        subscription={ACTIVE}
        conflict={false}
        canManage
        busy={false}
        onManage={onManage}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Malaki Pro', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText(/Current period ends/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Manage billing' }))
    expect(onManage).toHaveBeenCalledTimes(1)
  })

  it('cancelAtPeriodEnd reads "ends on <currentPeriodEnd>", with Resume in the portal', () => {
    inRouter(
      <SubscriptionSection
        plans={WIRE_PLANS}
        subscription={{ ...ACTIVE, cancelAtPeriodEnd: true }}
        conflict={false}
        canManage
        busy={false}
        onManage={() => {}}
      />,
    )
    expect(screen.getByText(new RegExp(MESSAGES.notices.planEndsOn))).toBeInTheDocument()
    expect(screen.getByText(/Sep 2, 2027/)).toBeInTheDocument()
    expect(screen.getByText(/You can resume it in the billing portal/)).toBeInTheDocument()
    expect(screen.queryByText(/Current period ends/)).not.toBeInTheDocument()
  })

  it('a member sees the subscription and the honest line, no button', () => {
    inRouter(
      <SubscriptionSection
        plans={WIRE_PLANS}
        subscription={ACTIVE}
        conflict={false}
        canManage={false}
        busy={false}
        onManage={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Manage billing' })).not.toBeInTheDocument()
    expect(screen.getByText(MESSAGES.notices.billingOwnerOnly)).toBeInTheDocument()
  })

  it('a status this build has never seen is shown as the word it is', () => {
    inRouter(
      <SubscriptionSection
        plans={WIRE_PLANS}
        subscription={{ ...ACTIVE, status: 'some_new_state' as Subscription['status'] }}
        conflict={false}
        canManage
        busy={false}
        onManage={() => {}}
      />,
    )
    expect(screen.getByText('some new state')).toBeInTheDocument()
  })
})

describe('useBillingPermissions', () => {
  it("is the workspace's protected tier: the demo's admin may subscribe", () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(DataProvider, null, children)
    const { result } = renderHook(() => useBillingPermissions(), { wrapper })
    // Maya is admin — the demo's top tier — in the default dataset.
    expect(result.current.viewerRole).toBe('admin')
    expect(result.current.canManageBilling).toBe(true)
  })
})
