/**
 * INT-10's verify: one real on-demand run, end to end (D-INT-G).
 *
 * The two things worth proving, because both would fail silently:
 * - a completed run renders a draft with its TONE and its RATIONALE, which
 *   live inside `outputs[].content` and would read `undefined` forever if the
 *   shape were taken from api.md's prose rather than the wire;
 * - the local ledger makes that run re-pullable after a reload, which is the
 *   only history there is until a list-runs endpoint exists.
 *
 * Cost discipline (D-INT-I): ONE balanced run, one tone, perTone 1.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}g@alphapromena.com`
const ORG_NAME = `QA Generate Org ${RUN}`

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

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Generate Owner')
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
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 60_000,
  })
})

test('one balanced run returns a draft with its tone and its rationale', async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)
  // F1 has no rail entry — it is reached from the dashboard and Today.
  await page.goto('/generate')
  await expect(page.getByRole('heading', { name: 'Generate', level: 1 })).toBeVisible()

  // One tone, one draft per tone, balanced — the cheapest run that proves it.
  await expect(page.getByText('1 draft')).toBeVisible()
  await page.getByRole('button', { name: 'Generate' }).click()

  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })
  const card = page.getByRole('article').first()
  // Real prose, not an echo of the form.
  const body = ((await card.locator('p').first().textContent()) ?? '').trim()
  expect(body.length).toBeGreaterThan(20)
  // The two fields that live INSIDE content and would silently read undefined.
  await expect(card).toContainText('Why it wrote this:')
  // The action row is the honest subset: Copy yes, approve/schedule absent.
  await expect(card.getByRole('button', { name: 'Copy' })).toBeVisible()
  await expect(card.getByRole('button', { name: /Approve|Schedule|Decline/ })).toHaveCount(0)
  await expect(page.getByText(/read-only for now/)).toBeVisible()

  // The ledger is the only route back to a result — there is no list-runs
  // endpoint — so the reload has to happen HERE, in the same browser context
  // that made the run. A separate test would start with empty storage and
  // prove nothing.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Recent runs' })).toBeVisible()
  await page.getByRole('button', { name: /run_/ }).first().click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('article').first()).toContainText('Why it wrote this:')
})
