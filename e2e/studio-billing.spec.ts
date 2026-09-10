/**
 * W5's verify: Creative Studio and Billing.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links. `page.goto` reloads the SPA and rebuilds the DEFAULT
 * dataset, so a deep link would silently test the wrong tenant.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

async function open(page: Page, rail: string, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: rail, exact: true }).click()
  // The shell's h1 renders during the skeleton, so wait for content.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

/**
 * Since ORDER HSN-0910 the Studio's E1 is the 13-capability grid in BOTH modes
 * (`studio-capabilities.spec.ts` covers it and the capability composers). The
 * W5 model composer survives for the draft-scoped D4 and for E4's "Generate
 * similar" on a demo model's asset — which is how it is reached here, in-app.
 */
test('the studio opens on the capability grid, and a demo asset still reaches the W5 composer', async ({
  page,
}) => {
  await open(page, 'Studio')
  await expect(page.getByRole('heading', { name: 'Studio', level: 1 })).toBeVisible()
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Generate', exact: true }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Your renders →' }).click()
  await expect(page.getByRole('heading', { name: 'My jobs', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Open' }).first().click()
  await expect(page.getByRole('heading', { name: 'Asset', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Generate similar' }).click()
  await expect(page.getByRole('heading', { name: 'New generation', level: 1 })).toBeVisible()
})

test('@golden the W5 composer renders each model’s own parameters and spends credits', async ({
  page,
}) => {
  await open(page, 'Studio')
  await page.getByRole('link', { name: 'Your renders →' }).click()
  await page.getByRole('link', { name: 'Open' }).first().click()
  await page.getByRole('link', { name: 'Generate similar' }).click()
  await expect(page.getByRole('heading', { name: 'New generation', level: 1 })).toBeVisible()

  // Prism publishes an enum and two bounded numbers — all rendered from the schema.
  await expect(page.getByLabel('Aspect ratio')).toBeVisible()
  await expect(page.getByLabel('Seed')).toBeVisible()

  // Switching to a video model swaps the whole params form for that model's.
  await page.getByRole('radio', { name: 'Video' }).click()
  await expect(page.getByLabel('Duration seconds')).toBeVisible()
  await expect(page.getByLabel('Loop seamlessly')).toBeVisible()
  await expect(page.getByLabel('Seed')).toHaveCount(0)

  await page.getByLabel('Prompt').fill('Steam rising from a fresh pour-over, macro')
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByText('Usually takes about 30 seconds.')).toBeVisible()

  // Lands on the asset it just made.
  await expect(page.getByRole('heading', { name: 'Asset', level: 1 })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText('Standalone')).toBeVisible()
})

test('a standalone asset attaches only to a draft that has earned media', async ({ page }) => {
  await open(page, 'Studio')
  await page.getByRole('link', { name: 'Your renders →' }).click()
  await expect(page.getByRole('heading', { name: 'My jobs', level: 1 })).toBeVisible()

  // The origin tag is how the two modes are told apart at a glance.
  await expect(page.getByText('Standalone').first()).toBeVisible()
  await expect(page.getByText(/For draft:/).first()).toBeVisible()

  await page.getByRole('link', { name: 'Open' }).first().click()
  await expect(page.getByRole('heading', { name: 'Asset', level: 1 })).toBeVisible()
})

/**
 * The demo's H2 (subscription + credits) since BIL-0902: `/billing` is the
 * product's plans page, and the header chip is the demo's way into its own
 * subscription — the chip's static destination has always been H2's job.
 */
async function openDemoSubscription(page: Page, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page
    .getByRole('banner')
    .getByRole('link', { name: /credits/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Subscription', level: 1 })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

test('the credits ledger explains the balance it shows', async ({ page }) => {
  await openDemoSubscription(page)
  await page.getByRole('link', { name: 'Change plan' }).click()
  await expect(page.getByRole('heading', { name: 'Plans', level: 1 })).toBeVisible()
  await expect(page.getByText('Current plan').first()).toBeVisible()
})

test('past due gates the product, not just the billing screen', async ({ page }) => {
  await open(page, 'Studio', 'Payment past due')

  // The banner is on every authenticated screen, not only Billing.
  const banner = page.getByRole('alert').filter({ hasText: 'Your payment failed' })
  await expect(banner).toBeVisible()

  // And generation is actually refused, with the reason where the button is —
  // on a capability composer too (HSN-0910), because past_due gates the
  // product, not a screen.
  await page.getByRole('link', { name: 'New logo', exact: true }).click()
  await expect(
    page.getByText('Generation is paused while your payment is unresolved.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Render' })).toBeDisabled()

  // Resolving it lifts the gate in the same session.
  await page.getByRole('link', { name: 'Update payment method' }).first().click()
  await page.getByRole('button', { name: 'Update payment method' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your payment failed' })).toHaveCount(0)
})

/**
 * The insufficient-credits state with the prompt preserved is D4's, proven in
 * `today-queue.spec.ts` ("a short balance refuses the run and keeps the
 * prompt"). The Studio's capability composers are priced in the catalog's
 * money and refuse through the wallet's 402 in live mode (`live-billing`);
 * the demo never invents an exchange rate between the two (D-INT-E).
 */

test('changing plan states its consequence and grants through the ledger', async ({ page }) => {
  await openDemoSubscription(page)
  await page.getByRole('link', { name: 'Change plan' }).click()

  await page.getByRole('button', { name: 'Upgrade' }).first().click()
  const confirm = page.getByRole('alertdialog')
  // The design law is that a destructive/paid confirm NAMES what changes; the
  // vocabulary is money, never "credits" (D-INT-E, E2E-0820 F4).
  await expect(confirm).toContainText('allowance applies straight away')
  await expect(confirm).not.toContainText('credits')
  await confirm.getByRole('button', { name: 'Upgrade' }).click()

  await expect(page.getByText('Current plan').first()).toBeVisible()
})

test('@axe studio and billing scan clean', async ({ page }) => {
  await open(page, 'Studio')
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('link', { name: 'Billing', exact: true }).click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})
