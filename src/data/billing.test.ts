/**
 * The billing seam (ORDER BIL-0902) at the level the laws live:
 * - the static demo answers the wire's SHAPE and never touches the network;
 * - live calls exactly the guide's paths, once each, with the body as ruled;
 * - the envelope is mapped by `code` — conflict, forbidden, validation,
 *   rate limit — with the server's request id carried for the report;
 * - checkout and the portal are SINGLE-SHOT: a failure is returned after ONE
 *   call, never retried here;
 * - an all-zero wallet reads as "never subscribed" (Ward's model).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { isUnfunded } from '@/data/wallet'
import {
  CREDITS_PAGE_SIZE,
  DEMO_BILLING_PLANS,
  createBillingActions,
  demoCheckoutUrl,
  demoPortalUrl,
  demoSubscription,
} from './billing'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
import { api } from '@/api/client'
const apiMock = vi.mocked(api)

beforeEach(() => apiMock.mockReset())

const ORG = '1670'

// --- The static demo ---------------------------------------------------------

describe('the static demo (zero network)', () => {
  const demo = createBillingActions(false)

  it('offers two plans in the wire shape — base 50000, pro 80000, usd, year', async () => {
    const result = await demo.listPlans(ORG)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { plan: 'base', name: 'Base', amountCents: 50000, currency: 'usd', interval: 'year' },
      { plan: 'pro', name: 'Pro', amountCents: 80000, currency: 'usd', interval: 'year' },
    ])
    // The seam hands out a copy: a screen cannot mutate the demo's record.
    expect(result.value).not.toBe(DEMO_BILLING_PLANS)
    for (const plan of result.value) {
      expect(Object.keys(plan).sort()).toEqual(
        ['amountCents', 'currency', 'interval', 'name', 'plan'].sort(),
      )
    }
  })

  it('has never subscribed, with the full field set the wire carries at none', async () => {
    const result = await demo.getSubscription(ORG)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Observed on org 1670 (Docs/api/billing-shapes.md): every field present.
    expect(result.value).toEqual({
      plan: null,
      status: 'none',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: null,
    })
    expect(demoSubscription()).not.toBe(demoSubscription())
  })

  it('has no billing history', async () => {
    const result = await demo.listCredits(ORG)
    expect(result).toEqual({ ok: true, value: { items: [], total: 0 } })
  })

  it('walks Subscribe to the SAME return route Stripe would use, and says so', async () => {
    const checkout = await demo.createCheckout(ORG, 'base')
    expect(checkout).toEqual({ ok: true, url: demoCheckoutUrl(ORG), sessionId: 'demo' })
    expect(demoCheckoutUrl('org_atlas')).toBe('/billing/success?orgId=org_atlas&session_id=demo')
    const portal = await demo.createPortal(ORG)
    expect(portal).toEqual({ ok: true, url: demoPortalUrl(ORG) })
    expect(demoPortalUrl('org_atlas')).toBe('/billing?orgId=org_atlas')
  })

  it('never reaches the network', () => {
    expect(apiMock).not.toHaveBeenCalled()
  })
})

// --- Live: the guide's paths, once each ---------------------------------------

describe('live reads', () => {
  const live = createBillingActions(true)

  it('reads plans from GET /orgs/:id/billing/plans and unwraps the page', async () => {
    apiMock.mockResolvedValueOnce({
      items: [
        {
          plan: 'base',
          name: 'Malaki Base',
          amountCents: 50000,
          currency: 'usd',
          interval: 'year',
        },
      ],
      total: 1,
    })
    const result = await live.listPlans(ORG)
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledWith('GET', '/orgs/1670/billing/plans')
    // As delivered — "Malaki" is Stripe's spelling and it is rendered, not fixed.
    expect(result).toEqual({
      ok: true,
      value: [
        {
          plan: 'base',
          name: 'Malaki Base',
          amountCents: 50000,
          currency: 'usd',
          interval: 'year',
        },
      ],
    })
  })

  it('reads the subscription from GET /orgs/:id/billing/subscription, verbatim', async () => {
    const wire = {
      plan: 'pro',
      status: 'active',
      currentPeriodStart: '2026-09-02T10:00:00.000Z',
      currentPeriodEnd: '2027-09-02T10:00:00.000Z',
      cancelAtPeriodEnd: true,
      canceledAt: null,
      updatedAt: '2026-09-02T10:00:05.000Z',
    }
    apiMock.mockResolvedValueOnce(wire)
    const result = await live.getSubscription(ORG)
    expect(apiMock).toHaveBeenCalledWith('GET', '/orgs/1670/billing/subscription')
    expect(result).toEqual({ ok: true, value: wire })
  })

  it('reads history from GET /orgs/:id/billing/credits with limit/offset', async () => {
    apiMock.mockResolvedValueOnce({ items: [], total: 0 })
    await live.listCredits(ORG)
    expect(apiMock).toHaveBeenCalledWith('GET', '/orgs/1670/billing/credits', {
      query: { limit: CREDITS_PAGE_SIZE, offset: 0 },
    })
    apiMock.mockResolvedValueOnce({ items: [], total: 0 })
    await live.listCredits(ORG, { limit: 5, offset: 10 })
    expect(apiMock).toHaveBeenLastCalledWith('GET', '/orgs/1670/billing/credits', {
      query: { limit: 5, offset: 10 },
    })
  })

  it('reports a failed read by code, never by throwing', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(404, 'not_found', 'Not found', undefined, 'rid-1'))
    const result = await live.getSubscription(ORG)
    expect(result).toMatchObject({ ok: false, code: 'not_found', requestId: 'rid-1' })
  })
})

// --- Live: the two single-shot POSTs -----------------------------------------

describe('checkout', () => {
  const live = createBillingActions(true)

  it('POSTs exactly { plan } to /orgs/:id/billing/checkout and hands back url + sessionId', async () => {
    apiMock.mockResolvedValueOnce({ url: 'stripe-checkout:cs_test_x', sessionId: 'cs_test_x' })
    const result = await live.createCheckout(ORG, 'base')
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledWith('POST', '/orgs/1670/billing/checkout', {
      body: { plan: 'base' },
    })
    // The body is a CLOSED set: nothing rides along with the plan.
    const [, , options] = apiMock.mock.calls[0]
    expect(Object.keys((options as { body: object }).body)).toEqual(['plan'])
    expect(result).toEqual({
      ok: true,
      url: 'stripe-checkout:cs_test_x',
      sessionId: 'cs_test_x',
    })
  })

  it('maps 409 conflict — already subscribed — and calls ONCE', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(409, 'conflict', 'Org already has a subscription', undefined, 'rid-409'),
    )
    const result = await live.createCheckout(ORG, 'pro')
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: false, code: 'conflict', requestId: 'rid-409' })
  })

  it('maps 403 forbidden — not an owner (observed: request 731aa5d9-…)', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(403, 'forbidden', 'Forbidden', undefined, 'rid-403'))
    const result = await live.createCheckout(ORG, 'base')
    expect(result).toMatchObject({ ok: false, code: 'forbidden', requestId: 'rid-403' })
  })

  it('maps 400 validation_failed — a bad plan (observed: request b0446b1f-…)', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(
        400,
        'validation_failed',
        'Validation failed',
        [{ field: 'plan', message: 'Invalid enum value' }],
        'rid-400',
      ),
    )
    const result = await live.createCheckout(ORG, 'gold' as 'base')
    expect(result).toMatchObject({
      ok: false,
      code: 'validation_failed',
      fieldErrors: [{ field: 'plan', message: 'Invalid enum value' }],
    })
  })

  it('carries the 429 wait and does not retry', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(429, 'rate_limited', 'Slow down', undefined, 'rid-429', 30),
    )
    const result = await live.createCheckout(ORG, 'base')
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: false, code: 'rate_limited', retryAfterSeconds: 30 })
  })

  it('a client-side network failure is a failure too, after ONE attempt', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(0, 'network_error', 'never reached the server'))
    const result = await live.createCheckout(ORG, 'base')
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: false, code: 'network_error' })
  })

  it('rethrows anything that is not an API failure — a bug is not a designed state', async () => {
    apiMock.mockRejectedValueOnce(new TypeError('boom'))
    await expect(live.createCheckout(ORG, 'base')).rejects.toThrow('boom')
  })
})

describe('portal', () => {
  const live = createBillingActions(true)

  it('POSTs with no body to /orgs/:id/billing/portal and hands back the url', async () => {
    apiMock.mockResolvedValueOnce({ url: 'stripe-portal:session_x' })
    const result = await live.createPortal(ORG)
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledWith('POST', '/orgs/1670/billing/portal')
    expect(result).toEqual({ ok: true, url: 'stripe-portal:session_x' })
  })

  it('maps 403 forbidden and calls ONCE', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(403, 'forbidden', 'Forbidden'))
    const result = await live.createPortal(ORG)
    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: false, code: 'forbidden' })
  })
})

// --- The wallet reading under the new model ----------------------------------

describe('isUnfunded', () => {
  it('is the all-zero wallet — a workspace that has never subscribed', () => {
    expect(isUnfunded({ cents: 0, heldCents: 0, availableCents: 0 })).toBe(true)
  })
  it('is not an unread wallet, and not a funded one', () => {
    expect(isUnfunded(null)).toBe(false)
    expect(isUnfunded({ cents: 50000, heldCents: 0, availableCents: 50000 })).toBe(false)
    // Everything held is still funded — it is a wallet that cannot spend YET.
    expect(isUnfunded({ cents: 100, heldCents: 100, availableCents: 0 })).toBe(false)
  })
})
