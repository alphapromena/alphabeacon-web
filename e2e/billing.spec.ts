/**
 * ORDER BIL-0902, the static half: the product's billing page and the Stripe
 * return routes, rendered from the demo with ZERO network (the fixture's
 * assert is the proof).
 *
 * - `/billing` renders the two demo plans in the wire's shape (base $500.00,
 *   pro $800.00, per year), the subscription status word, the empty history,
 *   and — for the demo's top tier — a Subscribe on each plan.
 * - The demo's Subscribe walks the SAME return route Stripe would use, and the
 *   success page says, plainly, that nothing was paid.
 * - `?checkout=cancelled` shows the plans again plus the one-line note.
 * - `?orgId=` naming a workspace this account is not in is refused, honestly.
 * - Both routes scan axe-clean.
 *
 * The member view (plans, no button, the honest line) is covered at the unit
 * level: no static dataset signs in as a member. The two return routes are
 * DEEP LINKS by design — Stripe lands on them — so `page.goto` is the honest
 * way to reach them here; the default dataset is the signed-in demo.
 */
import AxeBuilder from '@axe-core/playwright'
import { openFromRail as open } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

test('the plans render from the demo in the wire’s shape, with Subscribe for the top tier', async ({
  page,
}) => {
  await open(page, 'Billing')
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()

  const plans = page.getByRole('region', { name: 'Plans' })
  await expect(plans.getByRole('heading', { name: 'Base', level: 3 })).toBeVisible()
  await expect(plans.getByRole('heading', { name: 'Pro', level: 3 })).toBeVisible()
  await expect(plans.getByText('$500.00 / year')).toBeVisible()
  await expect(plans.getByText('$800.00 / year')).toBeVisible()
  // Prices are yearly and in dollars — never a monthly figure, never "credits".
  await expect(plans.getByText(/\/month/)).toHaveCount(0)
  await expect(page.getByRole('main').getByText(/\bcredits\b/i)).toHaveCount(0)

  // The wire's status word, worn openly.
  await expect(plans.getByText('none', { exact: true })).toBeVisible()
  // Maya is the demo's top tier (admin — the demo has no owner tier), so she
  // may subscribe: one Subscribe per plan.
  await expect(plans.getByRole('button', { name: 'Subscribe' })).toHaveCount(2)

  const history = page.getByRole('region', { name: 'Billing history' })
  await expect(history.getByText(/No payments yet/)).toBeVisible()
})

test('the demo’s Subscribe lands on the success route, which says nothing was paid', async ({
  page,
}) => {
  await open(page, 'Billing')
  await page
    .getByRole('region', { name: 'Plans' })
    .locator('[data-plan="base"]')
    .getByRole('button', { name: 'Subscribe' })
    .click()

  // window.location.assign → the same route Stripe returns to.
  await expect(page).toHaveURL(/\/billing\/success\?orgId=org_atlas&session_id=demo/)
  await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nothing was paid' })).toBeVisible()
  await expect(page.getByText(/This is the demo/)).toBeVisible()
  // The session id is shown for reference, never sent anywhere (zero network).
  await expect(page.getByText('Checkout session')).toBeVisible()
  await expect(page.getByText('demo', { exact: true })).toBeVisible()

  const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(scan.violations).toEqual([])

  await page.getByRole('link', { name: 'Back to billing' }).click()
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
})

test('an abandoned checkout shows the plans again, plus the one-line note', async ({ page }) => {
  await page.goto('/billing?orgId=org_atlas&checkout=cancelled')
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
  await expect(page.getByText(/Payment cancelled — nothing was charged/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Plans' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Subscribe' })).toHaveCount(2)
})

test('a billing link for a workspace this account is not in is refused, not read', async ({
  page,
}) => {
  await page.goto('/billing?orgId=org_somebody_else')
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
  const refusal = page.getByRole('alert').filter({ hasText: 'Not your workspace' })
  await expect(refusal).toBeVisible()
  await expect(page.getByRole('button', { name: 'Subscribe' })).toHaveCount(0)

  await page.goto('/billing/success?orgId=org_somebody_else&session_id=cs_test_x')
  await expect(page.getByRole('alert').filter({ hasText: 'Not your workspace' })).toBeVisible()
})

test('@axe the billing page scans clean, populated', async ({ page }) => {
  await open(page, 'Billing')
  await expect(page.getByRole('region', { name: 'Plans' })).toBeVisible()
  const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(scan.violations).toEqual([])
})
