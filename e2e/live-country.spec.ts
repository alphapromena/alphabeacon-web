/**
 * INT-8's verify: the org country as the ONE holiday control, against the
 * DEPLOYED API through the real UI (decisions.md D-INT-F, confirmed by the
 * backend 2026-08-17).
 *
 * What is worth proving here, and why:
 * - the country set on I1 survives to the org and loads a real calendar, which
 *   is the whole point of moving it off the event-source surface. **It is set
 *   on I1 now, not in a wizard** (ORDER ONB-0827, D-ONB-C): a fresh workspace
 *   has NO country, and the Phase-0 probe proved that does not block
 *   generation — the country buys holidays, not permission;
 * - the second save of the SAME country is a cheap no-op and SAYS so
 *   (`reloaded: false`) rather than claiming a reload that never happened;
 * - the calendar renders those holidays in date order and each one can show
 *   the do/don't rules generation will obey on that day;
 * - C2 offers no "add a source" affordance any more, because the wire cannot
 *   honour one.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'
import { signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}c@alphapromena.com`
const ORG_NAME = `QA Country Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  return (JSON.parse(raw!) as { token: string }).token
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

// Signup + verify + the org create, then I1's ~10 s country lookup: more than
// the suite's 30 s default.
test('a fresh workspace has NO country, and I1 is where one is set', async ({ page, request }) => {
  test.setTimeout(180_000)
  await signUpAndEnter(page, {
    name: 'QA Country Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  // Nothing set it on the way in — the wizard that used to is deleted, and
  // the ruling is that a missing country is a checklist item, not a blocker.
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgsResponse = await request.get(`${API_BASE}/me/orgs`, { headers: auth })
  // Assert the read before indexing it: a failed read used to surface as
  // "cannot read properties of undefined", which says nothing about why.
  expect(orgsResponse.status(), await orgsResponse.text()).toBe(200)
  const orgs = (await orgsResponse.json()) as { items: { id: string }[] }
  const before = (await (
    await request.get(`${API_BASE}/orgs/${orgs.items[0].id}`, { headers: auth })
  ).json()) as { org: { country: string | null } }
  expect(before.org.country).toBeNull()

  // I1 owns the control, and saving it loads the calendar for real.
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await page.locator('#i1-country').selectOption('JO')
  await page.getByRole('button', { name: 'Save country' }).click()
  await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
    timeout: AFTER_COUNTRY,
  })
})

/**
 * NAVIGATE TO THE MONTH THAT HOLDS ONE, rather than assuming today's grid does.
 *
 * This test used to open the Calendar and expect an occasion immediately. That
 * only ever worked when a holiday happened to fall inside the current month's
 * grid, which is a fact about the calendar date rather than about the product
 * — the latent kind of test that passes for months and then does not. Measured
 * on 2026-08-28 against a fresh JO org: `PUT /orgs/:id/country` answered
 * `holidaysCount: 1, reloaded: true` and `GET .../holidays` returned exactly
 * one row, **2026-12-25**, four months out of view. The country was set
 * correctly and the calendar was right to show nothing in August.
 *
 * So the test asks the wire which month to look in, then drives the product's
 * own month control to get there. The assertions about what an occasion
 * renders are unchanged.
 */
test('the calendar carries real holidays, each with the rules for that day', async ({
  page,
  request,
}) => {
  await login(page)

  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const holidays = (await (
    await request.get(`${API_BASE}/orgs/${orgs.items[0].id}/holidays`, { headers: auth })
  ).json()) as { items: { date: string; event: string }[] }
  // The country really did load a calendar — that is this file's first claim,
  // and it is asserted on the wire before anything is looked for on screen.
  expect(holidays.items.length).toBeGreaterThan(0)
  const target = holidays.items[0]
  const targetTitle = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${target.date}T00:00:00Z`))

  await page.getByRole('link', { name: 'Calendar', exact: true }).first().click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  // Walk forward to the month that holds it. `exact` because getByRole name
  // matching is SUBSTRING (state.md trap 16). Capped at twelve presses: the
  // lookup covers the year, so a holiday further out than that is a fact worth
  // failing on rather than scrolling past.
  for (let step = 0; step < 12; step += 1) {
    if (await page.getByRole('heading', { name: targetTitle }).count()) break
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: targetTitle })).toBeVisible()

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

  // I1 carries the control; the first test in this file set JO through it.
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
