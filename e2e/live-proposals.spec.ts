/**
 * INT-12's verify: Today is the ledger (D-INT-J), against the live API.
 *
 * THE RELOAD IS THE POINT. Everything else could pass on local state; only a
 * reload proves the queue is derived from the platform's own ledger rather
 * than from what this browser happens to remember. That is the difference
 * between a review screen and a scratchpad — and it is what makes a draft
 * written by a scheduled run (once those land) appear here at all.
 *
 * Cost discipline (D-INT-I): ONE balanced text run, one tone.
 *
 * THE 402 RULE (ORDER HSN-0902): every test that needs a run — the run
 * itself and everything the ledger shows after it — reads the wallet first
 * and self-skips on a zero one with the honest reason (`skipUnlessFunded`);
 * `live-generate` is the one spec that asserts the refusal.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import {
  completeBrandSetup,
  ensureToneLanguage,
  signUpAndEnter,
  skipUnlessFunded,
} from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
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

test('a fresh owner + org, with its brand set up', async ({ page }) => {
  test.setTimeout(240_000)
  await signUpAndEnter(page, {
    name: 'QA Proposals Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  // Nothing is seeded any more (D-ONB-B) and the readiness gate refuses a run
  // until the four brand entities exist (D-ONB-D), so the org sets itself up
  // before the run below can produce the proposals under test.
  await completeBrandSetup(page, {
    toneName: 'Roastery floor',
    toneDescription: 'Warm, specific, smells of coffee.',
    doRule: 'Name the roast date',
  })
})

test('one balanced run — the drafts it produces become the proposals under test', async ({
  page,
  request,
}) => {
  test.setTimeout(240_000)
  await login(page)
  await skipUnlessFunded(page, request, 'the balanced run')
  // CUT-0831: a fresh browser needs the tone's language re-saved (sidecar).
  await ensureToneLanguage(page, 'Roastery floor')
  await page.goto('/generate')
  await expect(page.getByText('1 draft')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })
})

test('after a RELOAD, Today shows the draft from the ledger', async ({ page, request }) => {
  test.setTimeout(120_000)
  await login(page)
  await skipUnlessFunded(page, request, 'the run this ledger read depends on')
  // A different browser context from the run: nothing local survives, so
  // anything on screen came from the platform.
  await page.goto('/today')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  await expect(page.getByText(/1 needs review/)).toBeVisible({ timeout: 60_000 })
  // Scoped to main: the sidebar is a list of listitems too.
  const card = page.getByRole('main').getByRole('listitem').first()
  await expect(card).toContainText('Why it wrote this:')
  // The honest subset: no Edit, and Approve says what it really does.
  await expect(card.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(card).toContainText(/records this as posted/)
})

test('approving records it as posted, and the decision survives a reload', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await login(page)
  await skipUnlessFunded(page, request, 'the run this approval depends on')
  await page.goto('/today')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
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
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Approved', exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText(
    'Recorded as posted',
  )
})

test('declining asks why, keeps the row, and is reversible', async ({ page, request }) => {
  test.setTimeout(240_000)
  await login(page)
  await skipUnlessFunded(page, request, 'the second run this decline depends on')

  // CUT-0831: a fresh browser needs the tone's language re-saved (sidecar).
  await ensureToneLanguage(page, 'Roastery floor')
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

  /**
   * The row STAYS — it is the no-repeat instruction, not a deletion.
   *
   * A NAMED BUDGET, taken on purpose and with the numbers behind it. This
   * assertion covers MORE than one screen sync: a decline POST, a tab switch,
   * and a keyset-paged re-read of the proposals ledger. Measured across eleven
   * observations on 2026-08-28 it passed eight times — the whole test taking
   * 20.6 s and 28.6 s in two of them — and failed three: twice at the suite's
   * 5 s default, and once at `SCREEN_SYNC` (40 s), which is the measurement
   * that matters. 40 s is the right order of magnitude with no headroom, so
   * this one wait gets double, explicitly, rather than the suite being told
   * that a chain of three calls is one screen's sync.
   *
   * The latency itself is open-item 41: a user watching their own decision
   * take half a minute to appear is a product fact, not only a test one, and
   * this wait does not fix it.
   */
  await page.getByRole('button', { name: 'Declined', exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText('Declined ·', {
    timeout: SCREEN_SYNC * 2,
  })

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
