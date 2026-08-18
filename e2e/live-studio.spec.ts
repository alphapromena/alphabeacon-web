/**
 * INT-11's studio verify (E1–E4) against the DEPLOYED API.
 *
 * The gallery is the part worth proving: every card is read from
 * `GET catalog/capabilities/:c`, so a regression that hardcoded a model list
 * would still render — and would be wrong the moment the grant changes. These
 * assertions therefore check that what is on screen came from the WIRE:
 * the wire's own `displayHint`, its decimal-string price, its plan grades.
 *
 * A real render costs money, so it runs only under LIVE_MEDIA=1 (D-INT-I).
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const WITH_MEDIA = process.env.LIVE_MEDIA === '1'
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}s@alphapromena.com`
const ORG_NAME = `QA Studio Org ${RUN}`

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
  await page.getByLabel('Full name').fill('QA Studio Owner')
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

test('E1 is built from the catalog: friendly names, real prices, no vendors', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)
  await page.getByRole('link', { name: 'Studio', exact: true }).first().click()
  await expect(page.getByText('media.generate')).toBeVisible({ timeout: 30_000 })

  // The wire's own display label, which no static table could have supplied.
  await expect(page.getByText('Balanced image').first()).toBeVisible()
  // A real decimal-string price, rendered as money.
  await expect(page.getByText(/\$0\.03 per image/).first()).toBeVisible()

  // Composable capabilities get a Create; the rest say so honestly.
  await expect(page.getByRole('link', { name: 'Create' }).first()).toBeVisible()
  await expect(page.getByText(/arrives in a later phase/).first()).toBeVisible()

  // No vendor name may ever appear — the catalog speaks only in app aliases.
  const body = (await page.getByRole('main').textContent()) ?? ''
  for (const vendor of ['openai', 'gpt', 'bedrock', 'replicate', 'fal', 'runware', 'nano banana']) {
    expect(body.toLowerCase()).not.toContain(vendor)
  }

  // The kind filter is driven by the models the catalog reported.
  await page.getByRole('button', { name: 'video' }).click()
  await expect(page.getByText('video-ads.generate')).toBeVisible()
})

test('E3 lists renders, and is honest when there are none', async ({ page }) => {
  await login(page)
  await page.goto('/studio/jobs')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  if (WITH_MEDIA) {
    await expect(page.getByRole('listitem').first()).toBeVisible({ timeout: 30_000 })
  } else {
    await expect(page.getByText(/Nothing rendered yet/).first()).toBeVisible({ timeout: 30_000 })
  }
})

test('E2 renders for real, and E4 opens the asset it made', async ({ page }) => {
  // A render costs money, so it is gated (D-INT-I). Everything above is free.
  test.skip(!WITH_MEDIA, 'set LIVE_MEDIA=1 to spend on one real render')
  test.setTimeout(400_000)
  await login(page)
  await page.goto('/studio/new?capability=media.generate')

  // The params come from the model's own capabilitySchema.
  await expect(page.getByLabel('Aspect ratio')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByLabel('Aspect ratio')).toContainText('1:1')
  await page
    .getByLabel('What should it show?')
    .fill('a flat-vector graphic of coffee beans in one clean row on warm ivory, no text')
  await page.getByRole('button', { name: 'Render' }).click()

  // Lands on E3 watching the job it just queued.
  await expect(page.getByRole('heading', { name: 'Your renders', level: 1 })).toBeVisible({
    timeout: 30_000,
  })
  // The job settles through the MEDIA vocabulary, then its asset opens.
  await expect(page.getByText('succeeded').first()).toBeVisible({ timeout: 300_000 })
  // Arriving from the composer, the job is already open: its asset url is
  // minted as soon as it settles, so there is nothing left to click.
  await expect(page.getByRole('img').last()).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('link', { name: 'Download' }).first()).toBeVisible()
})
