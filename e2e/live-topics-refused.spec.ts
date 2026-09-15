/**
 * A refused topic write (NIGHT-0916 order 5, item 78) — against the deployed
 * dev API on one fresh QA org, zero spend, the refusal made at the browser.
 *
 * Item 73's rule, applied to the topics seam: a refused write never resyncs,
 * the chip the person typed stays, an alert says why in the wire's words with
 * the request id; a landed write resyncs once. Measured first: before this
 * order the seam dispatched the chip optimistically, then resynced on the
 * refusal too, and the screen never looked at the result — the chip vanished
 * with nothing said (this file's first run, order-5/live-topics-refused-run1.log).
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { openSettingsTab, runStamp, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = runStamp()

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}x@alphapromena.com`
const REFUSAL = 'Topic refused by the probe'
const REQUEST_ID = 'probe-78-request'

test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Topics Owner',
    email: owner,
    password: PASSWORD,
    orgName: `QA Topics Org ${RUN}`,
  })
})

test('a refused topic write keeps the chip, says why with the request id, and does not resync; a landed one resyncs once', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await openSettingsTab(page, 'Sources & topics')
  await expect(page.getByLabel('Add a topic')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })

  // Every read after this point is counted: a resync is a burst of GETs.
  let reads = 0
  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes('/orgs/')) reads += 1
  })
  // The refusal, at the browser: the topic POST answers 400 in the contract's
  // envelope, with a request id in the header and the body.
  let refused = 0
  const topicsPost = (url: URL) => /\/topics(\?|$)/.test(url.pathname + url.search)
  await page.route(topicsPost, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    refused += 1
    await route.fulfill({
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': REQUEST_ID },
      body: JSON.stringify({
        error: { code: 'bad_request', message: REFUSAL, requestId: REQUEST_ID },
      }),
    })
  })

  const readsBefore = reads
  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  await expect.poll(() => refused, { timeout: 10_000 }).toBe(1)
  // Give a resync, if one fires, the time it needs to show.
  await page.waitForTimeout(2_500)

  const chip = page.getByText('single origin', { exact: true })
  const alert = page.getByRole('alert')
  const observed = {
    chipVisible: await chip.isVisible(),
    alertVisible: await alert.first().isVisible(),
    alertText:
      (await alert
        .first()
        .textContent()
        .catch(() => null)) ?? '',
    readsAfterRefusal: reads - readsBefore,
  }
  console.log(`[item 78] after the refusal: ${JSON.stringify(observed)}`)

  expect(observed.chipVisible, 'the chip the person typed stays').toBe(true)
  expect(observed.alertVisible, 'an alert names the refusal').toBe(true)
  expect(observed.alertText).toContain(REFUSAL)
  expect(observed.alertText).toContain(REQUEST_ID)
  expect(observed.readsAfterRefusal, 'a refused write never resyncs').toBe(0)

  // The wire again: the next topic lands, the alert clears, and the seam
  // resyncs once (its reads are the org's bundle — more than one GET, one burst).
  await page.unroute(topicsPost)
  const readsBeforeLanded = reads
  await page.getByLabel('Add a topic').fill('cold brew')
  await page.keyboard.press('Enter')
  await expect(page.getByText('cold brew', { exact: true })).toBeVisible()
  await expect.poll(() => reads - readsBeforeLanded, { timeout: 10_000 }).toBeGreaterThan(0)
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  await expect(alert).toHaveCount(0)
  // Landed on the server: a reload shows it; the refused one is gone with the reload.
  await page.goto('/settings/sources')
  await expect(page.getByText('cold brew', { exact: true })).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByText('single origin', { exact: true })).toHaveCount(0)
})
