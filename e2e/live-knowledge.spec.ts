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
import { SCREEN_SYNC } from './live-clocks'
import { signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
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
  await signUpAndEnter(page, {
    name: 'QA Knowledge Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('pasted text becomes a Ready source, and removing it removes it', async ({ page }) => {
  test.setTimeout(150_000)
  await login(page)
  await page.goto('/settings/knowledge')
  // A reload's whole screen sync, at the SCREEN_SYNC rung (a decision taken
  // on purpose — live-clocks.ts): since MED-0831 this screen fans out two
  // more lazy reads on open — the RAG collection + its sources, and the
  // media asset list — each able to land on a cold container. The suite's
  // 5 s default failed here in BOTH rounds of the HSN-0902 gate (2026-09-02).
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  await page.getByLabel('Or paste some text').fill('Roasting notes')
  await page.getByLabel('Text to add').fill('Ethiopia Guji, washed. Roast date matters most.')
  await page.getByRole('button', { name: 'Add text' }).click()

  // Ingestion is asynchronous: the list settles on its own.
  await expect(page.getByText('Roasting notes')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Ready')).toBeVisible({ timeout: 60_000 })
  // The row REPORTS its passage count, and the noun agrees with it: a short
  // paste is exactly one passage, which used to render as "1 passages"
  // (E2E-0820 F11). The row's spans concatenate with no separator, so the
  // noun is pinned with a lookahead rather than a word boundary.
  const row = page.getByRole('listitem').filter({ hasText: 'Roasting notes' })
  await expect(row).toContainText(/1 passage(?!s)/)

  await page.getByRole('button', { name: 'Remove' }).first().click()
  await page.getByRole('button', { name: 'Remove', exact: true }).last().click()
  await expect(page.getByText('Roasting notes')).toHaveCount(0, { timeout: 30_000 })
})

test('a FILE uploads straight to storage from the browser (open-item 24)', async ({ page }) => {
  test.setTimeout(150_000)
  await login(page)
  await page.goto('/settings/knowledge')
  // A reload's whole screen sync, at the SCREEN_SYNC rung (a decision taken
  // on purpose — live-clocks.ts): since MED-0831 this screen fans out two
  // more lazy reads on open — the RAG collection + its sources, and the
  // media asset list — each able to land on a cold container. The suite's
  // 5 s default failed here in BOTH rounds of the HSN-0902 gate (2026-09-02).
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  // HSN-04: the form asks WHAT this is and for a description before any file
  // leaves the browser — the description rides on the presign as `desc`
  // (probe P2 at the HSN-FINAL gate: the RAG door answers 201 with it).
  await page.getByRole('radio', { name: 'Document' }).click()
  await page.getByLabel('What is it?', { exact: true }).fill('Roasting notes for the Guji lot')

  // The collection is created lazily, so wait until the surface is ready.
  // `setInputFiles` bypasses the disabled BUTTON, so the button's state is the
  // only readiness signal available here (it is also disabled until the type
  // and the description above are given).
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
