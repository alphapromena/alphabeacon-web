/**
 * INT-11's knowledge verify (I6), against the DEPLOYED API in a real browser.
 *
 * This spec IS the answer to open-item 24 (S3 CORS for a browser PUT). The
 * presigned upload was proven from Node during the smoke run, but a browser
 * additionally needs the bucket's own CORS to allow PUT from the app origin,
 * and nothing outside a browser can test that. Chromium here is the browser.
 * If this fails on CORS, the surface is hidden and the exact error is logged
 * against that item — the founder's amendment 7.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}k@alphapromena.com`
const ORG_NAME = `QA Knowledge Org ${RUN}`

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
  await page.getByLabel('Full name').fill('QA Knowledge Owner')
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

test('pasted text becomes a Ready source, and removing it removes it', async ({ page }) => {
  test.setTimeout(150_000)
  await login(page)
  await page.goto('/settings/knowledge')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  await page.getByLabel('Or paste some text').fill('Roasting notes')
  await page.getByLabel('Text to add').fill('Ethiopia Guji, washed. Roast date matters most.')
  await page.getByRole('button', { name: 'Add text' }).click()

  // Ingestion is asynchronous: the list settles on its own.
  await expect(page.getByText('Roasting notes')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Ready')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/passages/)).toBeVisible()

  await page.getByRole('button', { name: 'Remove' }).first().click()
  await page.getByRole('button', { name: 'Remove', exact: true }).last().click()
  await expect(page.getByText('Roasting notes')).toHaveCount(0, { timeout: 30_000 })
})

test('a FILE uploads straight to storage from the browser (open-item 24)', async ({ page }) => {
  test.setTimeout(150_000)
  await login(page)
  await page.goto('/settings/knowledge')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  // The collection is created lazily, so wait until the surface is ready.
  // `setInputFiles` bypasses the disabled BUTTON, so the button's state is the
  // only readiness signal available here.
  await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled({
    timeout: 30_000,
  })

  // The presign is our API's; the PUT goes to storage directly, from Chromium.
  // A CORS refusal shows up as the seam's network_error, not a 4xx.
  await page.locator('#kn-file').setInputFiles({
    name: 'roasting.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Roast dates, not origins. Guji lot landed Tuesday.\n'),
  })

  // A presigned source may carry no title, so the row is identified by its
  // state rather than its name: Uploading, then Ready once the bytes land and
  // ingestion finishes on its own.
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: /Uploading|Processing|Ready/ })
      .first(),
  ).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText('Ready').first()).toBeVisible({ timeout: 90_000 })
})
