/**
 * HSN-02's Create visual against the DEPLOYED API — ONE real render.
 *
 * A render costs money, and so does the generate run that makes the draft it
 * renders for, so the WHOLE file is gated on LIVE_MEDIA=1 (D-INT-I) and
 * self-skips otherwise: it is authored at the HSN-FINAL gate and deliberately
 * not exercised in the merge rounds. The wire it proves was walked by hand in
 * PROBE-INT13 (the `social-posts.media` envelope) and by the gate's presign
 * probes; this is the browser path, for the day the founder turns it on:
 *
 *   $env:VITE_API_BASE_URL="<base>"; $env:LIVE_MEDIA="1"; pnpm e2e --grep live-create-visual
 *
 * What it asserts: the popup submits ONE job for the clicked draft, follows it
 * through the Studio's poller to an asset, and attaches nothing — the draft is
 * still the same proposal on Today afterwards, with the button still there.
 * No retry is ever pressed here; a failure is a failure.
 *
 * It renders an IMAGE (the cheapest proof). The VIDEO's `params.durationS`
 * (HSN-0902) has its shape probe in `live-video-duration.spec.ts` and its
 * positive proof — the job accepts it, the clip length matches — on the
 * founder's own `LIVE_MEDIA=1` render, M-HSN-1 step 4. And the 402 rule
 * (HSN-0902): even under LIVE_MEDIA, a zero wallet self-skips the render.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { completeBrandSetup, signUpAndEnter, skipUnlessFunded } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const WITH_MEDIA = process.env.LIVE_MEDIA === '1'
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}cv@alphapromena.com`
const ORG_NAME = `QA Create Visual Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.skip(!WITH_MEDIA, 'set LIVE_MEDIA=1 to spend on one generate run and one real visual')
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

const visualDialog = (page: Page) => page.getByRole('dialog', { name: 'Create a visual' })

test('a fresh owner + org with its brand set up', async ({ page }) => {
  test.setTimeout(240_000)
  await signUpAndEnter(page, {
    name: 'QA Create Visual Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
  // The readiness gate reaches the popup too (D-ONB-D): four entities first.
  await completeBrandSetup(page, {
    toneName: 'Roastery floor',
    toneDescription: 'Warm, specific, smells of coffee.',
    doRule: 'Name the roast date',
  })
})

test('one run, then Create visual on its result renders ONE image and attaches nothing', async ({
  page,
  request,
}) => {
  test.setTimeout(600_000)
  await login(page)
  await skipUnlessFunded(page, request, 'the generate run and the render')
  await page.goto('/generate')
  await expect(page.getByText('1 draft')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })

  // The rewired legacy control on the Generate result card.
  const card = page.getByRole('article').first()
  await card.getByRole('button', { name: 'Create visual' }).click()
  const dialog = visualDialog(page)
  await expect(dialog).toBeVisible()

  // The kind is the user's choice, every time.
  await expect(dialog.getByLabel('Image or video')).toHaveValue('')
  await dialog.getByLabel('Image or video').selectOption('image')
  await dialog.getByRole('button', { name: 'Create visual' }).click()

  // Single flight: the control is gone while the request is out and while
  // the job runs. If the platform refuses, that is the result — no retry.
  await expect(dialog.getByRole('button', { name: 'Create visual' })).toHaveCount(0)
  await expect(dialog.getByRole('status')).toContainText('Rendering', { timeout: 60_000 })

  // The job settles through the MEDIA vocabulary and its asset opens here.
  await expect(dialog.getByRole('img', { name: 'The rendered visual' })).toBeVisible({
    timeout: 300_000,
  })
  await expect(dialog.getByRole('link', { name: 'Download' })).toBeVisible()
  await expect(dialog.getByText(/Attaching it to the draft arrives in a later phase/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()
})

test('Today offers the same button on the ledger row, and the Studio lists the job', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await login(page)
  await page.goto('/today')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await expect(page.getByText(/1 needs review/)).toBeVisible({ timeout: 60_000 })

  // Attached nothing: the proposal is still pending, and the second entry
  // point is there. Opened, NOT submitted — one render is the budget.
  const row = page.getByRole('main').getByRole('listitem').first()
  await row.getByRole('button', { name: 'Create visual' }).click()
  await expect(visualDialog(page)).toBeVisible()
  await visualDialog(page).getByRole('button', { name: 'Cancel' }).click()

  await page.goto('/studio/jobs')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await expect(page.getByText('succeeded').first()).toBeVisible({ timeout: 30_000 })
})
