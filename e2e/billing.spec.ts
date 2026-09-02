/**
 * ORDER BIL-0902, the static half: the product's billing page and the Stripe
 * return routes, rendered from the demo with ZERO network (the fixture's
 * assert is the proof).
 *
 * - `/billing` renders the two demo plans in the wire's shape (BIL-0902/R:
 *   base "Malaky Business" $599.00, pro "Malaky Scale" $899.00, per month —
 *   the keys unchanged, the names and prices as the sandbox delivers them),
 *   the Enterprise card beside them, the subscription status word, the
 *   empty history, and — for the demo's top tier — a Subscribe on each plan.
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
  await expect(plans.getByRole('heading', { name: 'Malaky Business', level: 3 })).toBeVisible()
  await expect(plans.getByRole('heading', { name: 'Malaky Scale', level: 3 })).toBeVisible()
  await expect(plans.getByText('$599.00 / month')).toBeVisible()
  await expect(plans.getByText('$899.00 / month')).toBeVisible()
  // Prices are monthly and in dollars — the interval is the wire's word, so
  // no "/ year" survives anywhere on the page, and never "credits".
  await expect(plans.getByText(/\/ year/)).toHaveCount(0)
  await expect(page.getByRole('main').getByText(/\bcredits\b/i)).toHaveCount(0)

  // The wire's status word, worn openly.
  await expect(plans.getByText('none', { exact: true })).toBeVisible()
  // Maya is the demo's top tier (admin — the demo has no owner tier), so she
  // may subscribe: one Subscribe per plan.
  await expect(plans.getByRole('button', { name: 'Subscribe' })).toHaveCount(2)

  // BIL-0902/R: Enterprise beside the two — "Custom", no price, no Subscribe,
  // the demo request as its only action (identical in live mode).
  const enterprise = plans.locator('[data-plan="enterprise"]')
  await expect(enterprise.getByRole('heading', { name: 'Enterprise', level: 3 })).toBeVisible()
  await expect(enterprise.getByText('Custom', { exact: true })).toBeVisible()
  await expect(enterprise.getByRole('button', { name: 'Subscribe' })).toHaveCount(0)
  await expect(enterprise.getByRole('link', { name: 'Request a demo' })).toHaveAttribute(
    'href',
    '/request-demo',
  )

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
