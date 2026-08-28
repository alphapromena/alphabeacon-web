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
import { createFirstTone, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
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
  await signUpAndEnter(page, {
    name: 'QA Generate Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  // Nothing is seeded any more (ORDER ONB-0827, D-ONB-B): a run needs a tone,
  // so the org writes its first one before there is anything to generate with.
  await createFirstTone(page, {
    name: 'Roastery floor',
    description: 'Warm, specific, smells of coffee.',
    doRule: 'Name the roast date',
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
  // These results are read-only, and the footer now POINTS at where they can
  // be acted on — approve/decline went live on Today with the proposals
  // ledger (INT-12), so the old "arrives when the drafts backend does" was a
  // promise about something already shipped (E2E-0820 F10). The link is the
  // structural half of that claim; the copy is checked loosely.
  await expect(page.getByText(/read-only here/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open Today' })).toHaveAttribute('href', '/today')

  // The ledger is the only route back to a result — there is no list-runs
  // endpoint — so the reload has to happen HERE, in the same browser context
  // that made the run. A separate test would start with empty storage and
  // prove nothing.
  await page.reload()
  // INT-12 renamed this section when the ledger replaced the localStorage
  // cache; this assertion kept the old name and had been failing on `main`
  // ever since, unnoticed because the live spec was not re-run (E2E-0820).
  await expect(page.getByRole('heading', { name: 'Waiting for review' })).toBeVisible()
  await page.getByRole('button', { name: /run_/ }).first().click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('article').first()).toContainText('Why it wrote this:')
})
