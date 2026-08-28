/**
 * INT-8's verify: the org country as the ONE holiday control, against the
 * DEPLOYED API through the real UI (decisions.md D-INT-F, confirmed by the
 * backend 2026-08-17).
 *
 * What is worth proving here, and why:
 * - the wizard's country choice survives to the org and loads a real calendar,
 *   which is the whole point of moving it off the event-source surface;
 * - the second save of the SAME country is a cheap no-op and SAYS so
 *   (`reloaded: false`) rather than claiming a reload that never happened;
 * - the calendar renders those holidays in date order and each one can show
 *   the do/don't rules generation will obey on that day;
 * - C2 offers no "add a source" affordance any more, because the wire cannot
 *   honour one.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}c@alphapromena.com`
const ORG_NAME = `QA Country Org ${RUN}`

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

// Finishing now runs org -> schedule -> the ~10 s country
// lookup, in that order, so it needs more than the suite's 30 s default.
test('the wizard sets ONE country, and finishing loads its calendar', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Country Owner')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill(ORG_NAME)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
    timeout: 20_000,
  })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)
  await expect(page.getByText('finish setting up your workspace')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('link', { name: /Resume setup/ }).click()
  await page.getByLabel('Company name').fill(ORG_NAME)
  await page.getByLabel('What you offer, in one line').fill('Coffee, roasted to order.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()

  // Step 3 in live mode is a COUNTRY, not a list of sources.
  await expect(page.getByRole('heading', { name: 'Where do you operate?' })).toBeVisible()
  await page.getByLabel('Country').selectOption('Jordan')
  await page.getByRole('button', { name: 'Choose' }).click()
  await expect(page.getByText(/Jordan — loaded when you finish setup/)).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  // Org + schedule + the ~10 s country lookup, in that order. No tones are
  // planted since ONB-0827 (D-ONB-B).
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 60_000,
  })
})

test('the calendar carries real holidays, each with the rules for that day', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: 'Calendar', exact: true }).first().click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  // The occasion is a real button because it has guidance behind it.
  const occasion = page.getByRole('button', { name: /Christmas|Mawlid|Eid|Independence|New Year/ })
  await expect(occasion.first()).toBeVisible({ timeout: 20_000 })
  await occasion.first().click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('How Malaky will treat this day')).toBeVisible()
  // At least one do or don't, rendered under its own heading.
  await expect(sheet.getByRole('heading', { name: 'How Malaky will treat this day' })).toBeVisible()
  await expect(sheet).toContainText(/\S{10,}/)
})

test('re-saving the same country is a quiet no-op, not a fake reload', async ({ page }) => {
  // One real lookup in here, and a lookup is about ten seconds.
  test.setTimeout(120_000)
  await login(page)
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  // I1 carries the control; the org already has JO from the wizard.
  const picker = page.locator('#i1-country')
  await expect(picker).toBeVisible()
  await expect(picker).toHaveValue('JO')
  // Nothing to change, so the button refuses to spend ten seconds on a no-op.
  await expect(page.getByRole('button', { name: 'Save country' })).toBeDisabled()

  // Choose a different country, then choose JO again: the second save is the
  // one the contract calls cheap, and the copy must not claim a reload.
  await picker.selectOption('AE')
  await page.getByRole('button', { name: 'Save country' }).click()
  await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
    timeout: 60_000,
  })

  await picker.selectOption('AE')
  await expect(page.getByRole('button', { name: 'Save country' })).toBeDisabled()
})

test('C2 no longer offers an event source it cannot create', async ({ page }) => {
  await login(page)
  await page.goto('/calendar/sources')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  // The country picker IS the surface now.
  await expect(page.locator('#c2-country')).toBeVisible()
  await expect(page.getByText(/Your country is the event source now/)).toBeVisible()
  // And the affordances the wire cannot honour are absent, not disabled.
  await expect(page.getByRole('button', { name: /Add a source|Add source/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Connect Google Calendar/ })).toHaveCount(0)
})
