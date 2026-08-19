/**
 * INT-12's verify: Today is the ledger (D-INT-J), against the live API.
 *
 * THE RELOAD IS THE POINT. Everything else could pass on local state; only a
 * reload proves the queue is derived from the platform's own ledger rather
 * than from what this browser happens to remember. That is the difference
 * between a review screen and a scratchpad — and it is what makes a draft
 * written by a scheduled run (once those land) appear here at all.
 *
 * Cost discipline (D-INT-I): ONE balanced text run, perTone 1.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}pr@alphapromena.com`
const ORG_NAME = `QA Proposals Org ${RUN}`

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

test('a fresh owner + org, then one balanced run', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Proposals Owner')
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

  // One run — the drafts it produces become the proposals under test.
  await page.goto('/generate')
  await expect(page.getByText('1 draft')).toBeVisible()
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })
})

test('after a RELOAD, Today shows the draft from the ledger', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)
  // A different browser context from the run: nothing local survives, so
  // anything on screen came from the platform.
  await page.goto('/today')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  await expect(page.getByText(/1 needs review/)).toBeVisible({ timeout: 60_000 })
  // Scoped to main: the sidebar is a list of listitems too.
  const card = page.getByRole('main').getByRole('listitem').first()
  await expect(card).toContainText('Why it wrote this:')
  // The honest subset: no Edit, and Approve says what it really does.
  await expect(card.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(card).toContainText(/records this as posted/)
})

test('approving records it as posted, and the decision survives a reload', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)
  await page.goto('/today')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible({
    timeout: 60_000,
  })

  // A confirm precedes it, because the published record is permanent.
  // `exact` matters: getByRole name matching is SUBSTRING, so a plain
  // 'Approve' also matches the 'Approved' TAB — which renders first, so the
  // click silently switched tabs instead of opening anything (state.md trap 9,
  // now proven to apply to getByRole as well as getByText). The confirm is a
  // shadcn AlertDialog, so its role is `alertdialog`, and it is modal — every
  // control behind it is aria-hidden while it is open (trap 10).
  await page
    .getByRole('main')
    .getByRole('listitem')
    .first()
    .getByRole('button', { name: 'Approve', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toContainText('permanent record')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText('Recorded as posted').first()).toBeVisible({ timeout: 30_000 })

  // The queue empties, and the Approved tab carries it with its date.
  await expect(page.getByText(/0 need review/)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Approved', exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText(
    'Recorded as posted',
  )

  // The decision is the LEDGER's, not this page's: prove it across a reload.
  await page.reload()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Approved', exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText(
    'Recorded as posted',
  )
})

test('declining asks why, keeps the row, and is reversible', async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)

  // A second run, so there is something pending to decline.
  await page.goto('/generate')
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })

  await page.goto('/today')
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible({
    timeout: 60_000,
  })
  await page
    .getByRole('main')
    .getByRole('listitem')
    .first()
    .getByRole('button', { name: 'Decline', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toContainText('avoid this, because')
  await page.getByLabel('Why are you declining this?').fill('Too promotional for a Tuesday.')
  await page.getByRole('dialog').getByRole('button', { name: 'Decline', exact: true }).click()

  // The row STAYS — it is the no-repeat instruction, not a deletion.
  await page.getByRole('button', { name: 'Declined', exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText('Declined ·')

  // And a declined draft can still be approved later: latest wins.
  await page
    .getByRole('main')
    .getByRole('listitem')
    .first()
    .getByRole('button', { name: 'Approve', exact: true })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText('Recorded as posted').first()).toBeVisible({ timeout: 30_000 })
})
