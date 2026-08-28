/**
 * INT-9's verify: money, not credits (decisions.md D-INT-E).
 *
 * What is worth proving against the live API:
 * - a fresh org reads back the documented starter funding, and the chip shows
 *   AVAILABLE rather than total — the number the next request is checked
 *   against, not the more comforting one;
 * - H3 in live mode is a balance plus a real metering read-back, with no
 *   credits anywhere and no invented exchange rate;
 * - both end-user grains round-trip, and `tenant` is unreachable from the UI
 *   by construction (the seam's type forbids it, so this asserts the two that
 *   ARE offered);
 * - a malformed window is refused locally by the API, which is why the view
 *   can render its answer without defending against nonsense.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'
import { signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}w@alphapromena.com`
const ORG_NAME = `QA Wallet Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

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

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(180_000)
  await signUpAndEnter(page, {
    name: 'QA Wallet Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  // METERED USAGE, deliberately produced. H3 below reads real metering back,
  // and its rows used to come from the country lookup the WIZARD performed on
  // the way in. The wizard is gone (ONB-0827, D-ONB-C), so a fresh org now has
  // no usage at all and the table is honestly absent. Setting the country from
  // I1 — the surface that owns it now — restores exactly the precondition the
  // test was written around: `holidays.lookup` is metered, and it spends
  // nothing from the wallet, so the balance assertions above stay true.
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await page.locator('#i1-country').selectOption('JO')
  await page.getByRole('button', { name: 'Save country' }).click()
  await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
    timeout: AFTER_COUNTRY,
  })
})

test('the balance chip shows money, and it is the AVAILABLE money', async ({ page }) => {
  await login(page)
  // Documented starter funding: 5000 cents, nothing held. The chip lives in
  // the header; the dashboard tile shows the same number, so scope to one.
  const chip = page.getByRole('banner').getByRole('link', { name: '$50.00', exact: true })
  await expect(chip).toBeVisible({ timeout: 20_000 })
  // Nothing is held on a fresh org, so no reserved clause is shown.
  await expect(page.getByText(/reserved/)).toHaveCount(0)
  // The dashboard says the same thing in the same currency.
  await expect(page.getByRole('link', { name: 'Available balance $50.00' })).toBeVisible()
  // And no credits vocabulary survives into live mode.
  await expect(page.getByText(/\bcredits\b/i)).toHaveCount(0)
})

test('H3 is a balance and a real usage read-back, in both allowed grains', async ({ page }) => {
  await login(page)
  await page.goto('/billing/balance')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  await expect(page.getByRole('heading', { name: 'Available' })).toBeVisible()
  // Scoped to main: the header chip carries the same figure.
  await expect(page.getByRole('main').getByText('$50.00')).toBeVisible()
  // The 402's instruction lives here too, because there is nowhere to top up.
  await expect(page.getByText(/no self-serve top-up yet/i)).toBeVisible()

  // Both end-user grains round-trip against real metering. The wizard's
  // country lookup is itself metered (`holidays.lookup`), so a fresh org has
  // rows here — which is a better proof than an empty state would be.
  await expect(page.getByRole('group', { name: 'Group usage by' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('columnheader', { name: 'capability' })).toBeVisible()
  // Costs render as trimmed decimal strings, never as floats.
  await expect(page.getByRole('cell', { name: /^\$0\.\d+/ }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Total, estimated' })).toBeVisible()

  await page.getByRole('button', { name: 'model' }).click()
  await expect(page.getByRole('button', { name: 'model' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('columnheader', { name: 'model' })).toBeVisible({ timeout: 20_000 })

  // `tenant` is a cross-org billing view and must never be offered here.
  await expect(page.getByRole('button', { name: 'tenant' })).toHaveCount(0)
})

test('the wallet and usage endpoints answer the shapes the UI is built on', async ({
  page,
  request,
}) => {
  await login(page)
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const orgId = orgs.items[0].id

  const wallet = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/alphastudio/wallet`, { headers: auth })
  ).json()) as { cents: number; heldCents: number; availableCents: number }
  expect(wallet).toEqual({ cents: 5000, heldCents: 0, availableCents: 5000 })
  // The invariant every screen leans on.
  expect(wallet.availableCents).toBe(wallet.cents - wallet.heldCents)

  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const usage = (await (
    await request.get(
      `${API_BASE}/orgs/${orgId}/alphastudio/usage?from=${from}&to=${to}&group_by=capability`,
      { headers: auth },
    )
  ).json()) as { groupBy: string; groups: unknown[]; days: unknown[] }
  expect(usage.groupBy).toBe('capability')
  expect(Array.isArray(usage.groups)).toBe(true)
  expect(Array.isArray(usage.days)).toBe(true)

  // A malformed window never reaches the upstream — it is our API's own 400,
  // which is why the view does not have to defend against nonsense.
  const bad = await request.get(
    `${API_BASE}/orgs/${orgId}/alphastudio/usage?from=yesterday&to=${to}&group_by=model`,
    { headers: auth },
  )
  expect(bad.status()).toBe(400)
})
