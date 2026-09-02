/**
 * ORDER BIL-0902 against the DEPLOYED sandbox — ZERO payment, by the order.
 *
 * On one fresh QA org, made through the product:
 * - the five billing endpoints answer the shapes the UI is built on — plans,
 *   subscription `none` (full field set), credits empty, wallet zeros, and
 *   ONE checkout answering `201 { url, sessionId }` whose url is asserted and
 *   NEVER opened (the session is abandoned; test mode; nothing to clean up);
 * - `/billing` renders the plans FROM THE WIRE — the card names, cents and
 *   interval are compared against the API's own values in the same test,
 *   whatever Stripe calls them (BIL-0902/R: the keys `base`/`pro` unchanged,
 *   the names "Malaky Business"/"Malaky Scale", monthly) — with Subscribe for
 *   the owner, the Enterprise card beside them, and the honest empty history;
 * - the chip and the dashboard say "no balance yet" over a zero wallet, not
 *   "funding pending";
 * - the success route, arrived at by hand with the org id and a made-up
 *   session id, polls and gives up honestly (the org never paid);
 * - the abandoned-checkout return shows the plans plus the note;
 * - a member's checkout is 403 `forbidden` (arranged through the API, cheap);
 * - a generation on the unfunded org is refused with 402 and the refusal
 *   points at Billing — Phase 3's reaction, proven on the wire at zero spend.
 *
 * No test here drives the Stripe page. The paid path is manual gate M-BIL-1.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { completeBrandSetup, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}bl@alphapromena.com`
const member = `qa+${RUN}blm@alphapromena.com`
const ORG_NAME = `QA Billing Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

let orgId = ''

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  return (JSON.parse(raw!) as { token: string }).token
}

test('a fresh owner + org, made through the product', async ({ page, request }) => {
  test.setTimeout(180_000)
  await signUpAndEnter(page, {
    name: 'QA Billing Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
  const token = await sessionToken(page)
  const orgs = (await (
    await request.get(`${API_BASE}/me/orgs`, { headers: { authorization: `Bearer ${token}` } })
  ).json()) as { items: { id: string }[] }
  orgId = orgs.items[0].id
  expect(orgId).toMatch(/^\d+$/)
})

test('the five endpoints answer the shapes the UI is built on — and the checkout url is never opened', async ({
  page,
  request,
}) => {
  await login(page)
  const auth = { authorization: `Bearer ${await sessionToken(page)}` }
  const billing = (path: string) => `${API_BASE}/orgs/${orgId}/billing${path}`

  const plans = (await (await request.get(billing('/plans'), { headers: auth })).json()) as {
    items: { plan: string; name: string; amountCents: number; currency: string; interval: string }[]
    total: number
  }
  expect(plans.items.length).toBeGreaterThanOrEqual(1)
  for (const item of plans.items) {
    expect(Object.keys(item).sort()).toEqual(
      ['amountCents', 'currency', 'interval', 'name', 'plan'].sort(),
    )
    // BIL-0902/R: Ward's correction kept the KEYS and changed the rest — the
    // client's plan union is still exactly these two (org 1745, 2026-09-02).
    expect(['base', 'pro']).toContain(item.plan)
    expect(Number.isInteger(item.amountCents)).toBe(true)
  }
  // The checkout below uses the FIRST DELIVERED key, never a literal.
  const deliveredKey = plans.items[0].plan

  const subscription = (await (
    await request.get(billing('/subscription'), { headers: auth })
  ).json()) as Record<string, unknown>
  expect(subscription).toEqual({
    plan: null,
    status: 'none',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    updatedAt: null,
  })

  const credits = (await (await request.get(billing('/credits'), { headers: auth })).json()) as {
    items: unknown[]
    total: number
  }
  expect(credits).toEqual({ items: [], total: 0 })

  // The plan is the only funding: a fresh org starts at zero (org 1670 measured
  // the same on 2026-09-02 — no starter funding any more).
  const wallet = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/alphastudio/wallet`, { headers: auth })
  ).json()) as { cents: number; heldCents: number; availableCents: number }
  expect(wallet).toEqual({ cents: 0, heldCents: 0, availableCents: 0 })

  // ONE checkout. The url is asserted and abandoned — never opened.
  const checkout = await request.post(billing('/checkout'), {
    headers: auth,
    data: { plan: deliveredKey },
  })
  expect(checkout.status()).toBe(201)
  const receipt = (await checkout.json()) as { url: string; sessionId: string }
  expect(Object.keys(receipt).sort()).toEqual(['sessionId', 'url'])
  expect(new URL(receipt.url).host).toBe('checkout.stripe.com')
  expect(receipt.sessionId).toMatch(/^cs_/)

  // A bad plan is refused by our API's own validation.
  const bad = await request.post(billing('/checkout'), { headers: auth, data: { plan: 'gold' } })
  expect(bad.status()).toBe(400)
  expect(((await bad.json()) as { error: { code: string } }).error.code).toBe('validation_failed')

  // Nothing moved: an unopened checkout is not a subscription.
  const after = (await (await request.get(billing('/subscription'), { headers: auth })).json()) as {
    status: string
  }
  expect(after.status).toBe('none')
})

test('/billing renders the plans FROM THE WIRE, Subscribe for the owner, and the honest empty history', async ({
  page,
  request,
}) => {
  await login(page)
  const auth = { authorization: `Bearer ${await sessionToken(page)}` }
  const plans = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/billing/plans`, { headers: auth })
  ).json()) as {
    items: { plan: string; name: string; amountCents: number; interval: string }[]
  }

  // The chip over a zero wallet: the instruction, not "funding pending".
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'No balance yet — subscribe' }),
  ).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByRole('link', { name: 'Available balance $0.00' })).toBeVisible()
  await expect(page.getByText(/funding pending/i)).toHaveCount(0)

  await page.getByRole('link', { name: 'Billing', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
  const region = page.getByRole('region', { name: 'Plans' })
  await expect(region).toBeVisible({ timeout: SCREEN_SYNC })

  // Wire is the record: every card's heading is the API's own `name`, its
  // price the API's own cents, and its interval the API's own word —
  // whatever Stripe calls the plan and however often it bills.
  for (const plan of plans.items) {
    const card = region.locator(`[data-plan="${plan.plan}"]`)
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(plan.name)
    const dollars = `$${Math.floor(plan.amountCents / 100)}.${String(plan.amountCents % 100).padStart(2, '0')}`
    await expect(card.getByText(`${dollars} / ${plan.interval}`)).toBeVisible()
    await expect(card.getByRole('button', { name: 'Subscribe' })).toBeVisible()
  }
  // BIL-0902/R: Enterprise beside the wire's plans — "Custom", no Subscribe,
  // the demo request as its only action; the same card the demo shows.
  const enterprise = region.locator('[data-plan="enterprise"]')
  await expect(enterprise.getByRole('heading', { name: 'Enterprise', level: 3 })).toBeVisible()
  await expect(enterprise.getByText('Custom', { exact: true })).toBeVisible()
  await expect(enterprise.getByRole('button', { name: 'Subscribe' })).toHaveCount(0)
  await expect(enterprise.getByRole('link', { name: 'Request a demo' })).toHaveAttribute(
    'href',
    '/request-demo',
  )
  await expect(region.getByText(/\/ year/)).toHaveCount(0)
  await expect(region.getByText('none', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Billing history' }).getByText(/No payments yet/),
  ).toBeVisible()
  await expect(page.getByRole('main').getByText(/\bcredits\b/i)).toHaveCount(0)
})

test('the abandoned-checkout return shows the plans plus the note', async ({ page }) => {
  await login(page)
  await page.goto(`/billing?orgId=${orgId}&checkout=cancelled`)
  await expect(page.getByText(/Payment cancelled — nothing was charged/)).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByRole('region', { name: 'Plans' })).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByRole('button', { name: 'Subscribe' }).first()).toBeVisible()
})

test('the success route polls, shows the wire’s status every tick, and gives up honestly on an unpaid org', async ({
  page,
}) => {
  // The 60 s give-up plus the sync in front of it.
  test.setTimeout(150_000)
  await login(page)
  // The client logs every call; on a red, the poll's cadence is the evidence.
  const calls: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (text.includes('billing/subscription')) calls.push(`${new Date().toISOString()} ${text}`)
  })
  await page.goto(`/billing/success?orgId=${orgId}&session_id=cs_test_made_up_by_hand`)
  await expect(page.getByRole('heading', { name: 'Confirming your payment…' })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  // Nothing is assumed: the wire's word is shown while it polls.
  await expect(page.getByText(/Subscription status right now: none/)).toBeVisible({
    timeout: 20_000,
  })
  // The session id is displayed for reference — and, by the fixture's
  // network assert plus the seam's design, never sent to our backend.
  await expect(page.getByText('Checkout session')).toBeVisible()

  try {
    await expect(page.getByRole('heading', { name: 'Still processing' })).toBeVisible({
      timeout: 90_000,
    })
  } catch (error) {
    console.log(`[live-billing] poll cadence before the red:\n${calls.join('\n')}`)
    throw error
  }
  await expect(page.getByText(/If you completed the payment/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check again' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to billing' }).click()
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
})

test('a member cannot start checkout: 403 forbidden, and any member reads', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await login(page)
  const ownerAuth = { authorization: `Bearer ${await sessionToken(page)}` }

  // A second account, added at once as a member (existing user, D-ONB-F).
  const signup = await request.post(`${API_BASE}/auth/signup`, {
    data: { name: 'QA Billing Member', email: member, password: PASSWORD },
  })
  expect(signup.status()).toBe(201)
  const verified = (await (
    await request.post(`${API_BASE}/auth/verify-email`, { data: { email: member, code: '000000' } })
  ).json()) as { token: string }
  const invited = await request.post(`${API_BASE}/orgs/${orgId}/members/invite`, {
    headers: ownerAuth,
    data: { email: member, role: 'member' },
  })
  expect(invited.status()).toBe(201)
  const memberAuth = { authorization: `Bearer ${verified.token}` }

  const read = await request.get(`${API_BASE}/orgs/${orgId}/billing/plans`, {
    headers: memberAuth,
  })
  expect(read.status()).toBe(200)
  // A real, delivered key — so the 403 is the owner rule, not a plan check.
  const deliveredKey = ((await read.json()) as { items: { plan: string }[] }).items[0].plan
  const forbidden = await request.post(`${API_BASE}/orgs/${orgId}/billing/checkout`, {
    headers: memberAuth,
    data: { plan: deliveredKey },
  })
  expect(forbidden.status()).toBe(403)
  expect(((await forbidden.json()) as { error: { code: string } }).error.code).toBe('forbidden')
})

test('a generation on the unfunded org is refused with 402, and the refusal points at Billing', async ({
  page,
}) => {
  test.setTimeout(300_000)
  await login(page)
  // The readiness gate stands in front of every generation (D-ONB-D).
  await completeBrandSetup(page, {
    toneName: 'Roastery floor',
    toneDescription: 'Warm, specific, smells of coffee.',
    doRule: 'Name the roast date',
  })
  await page.goto('/generate')
  await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled({
    timeout: SCREEN_SYNC,
  })
  await page.getByRole('button', { name: 'Generate' }).click()

  // 402 wallet_insufficient → the state, not a toast: the balance, the
  // instruction, and the way to Billing. Nothing ran, nothing was charged.
  const refusal = page.getByRole('status').filter({ hasText: /Your wallet is empty or too low/ })
  await expect(refusal).toBeVisible({ timeout: 60_000 })
  await expect(refusal.getByText('$0.00')).toBeVisible()
  await refusal.getByRole('link', { name: 'Go to billing' }).click()
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Subscribe' }).first()).toBeVisible({
    timeout: SCREEN_SYNC,
  })
})
