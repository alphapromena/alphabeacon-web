/**
 * INT-4's verify: schedules, event sources (+ the countries reference) and
 * slot decisions against the DEPLOYED API through the real UI.
 *
 * The wizard's Finish now carries its collected schedule + holiday sources
 * into the org creation (they could not exist server-side before the org
 * did); C1's save PATCHes with toneIds replace-semantics; the countries
 * endpoint feeds the picker; one source per country (409, told honestly);
 * slots — written by ingestion, never created here — are exercised only if
 * ingestion produced any, and `approved` stays unreachable by construction.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}s@alphapromena.com`
const ORG_NAME = `QA Sched Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  return (JSON.parse(raw!) as { token: string }).token
}

test('the wizard finish creates org + schedule + holiday source together', async ({
  page,
  request,
}) => {
  // Signup + verify + the whole wizard + Finish + three wire reads does not
  // fit the suite's 30 s default, and Finish itself got three round-trips
  // longer when it became idempotent (it reads /me/orgs, the org's tones and
  // its schedules before writing anything). Same headroom as live-country.
  test.setTimeout(150_000)
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Sched Owner')
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
  await expect(page.getByText('finish setting up your workspace')).toBeVisible({
    timeout: 20_000,
  })

  await page.getByRole('link', { name: /Resume setup/ }).click()
  await page.getByLabel('Company name').fill(ORG_NAME)
  await page.getByLabel('What you offer, in one line').fill('Coffee, roasted to order.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  // Step 3: commit the default country (Jordan) so Finish has one to send.
  // INT-8 turned this step from an event-source list into the country picker
  // and its button reads 'Choose' in live mode ({live ? 'Choose' : 'Add'});
  // this spec kept clicking INT-4's 'Add' and had been failing on `main` ever
  // since, unrun. Same rot as trap 18 — hence the full-live-suite merge rule.
  await page.getByRole('button', { name: 'Choose', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  // Finish is org + preset tones + schedule + sources + the resync — a real
  // burst of wire calls; give it headroom.
  // Downstream of PUT /orgs/:id/country — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: AFTER_COUNTRY,
  })

  // The wire agrees: one schedule, and the org's country is JO.
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const orgId = orgs.items[0].id
  const schedules = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth })
  ).json()) as { total: number }
  expect(schedules.total).toBe(1)
  // INT-8 replaced the holiday EVENT-SOURCE with the org's own country
  // (D-INT-F, and Ward confirmed event-sources are superseded — open-items
  // 21). The wizard sets `PUT /orgs/:id/country`, so that is where the choice
  // lands now; this assertion still read the retired surface and had been
  // failing on `main`, unrun, since INT-8.
  const org = (await (
    await request.get(`${API_BASE}/orgs/${orgId}`, { headers: auth })
  ).json()) as { org: { country: string | null } }
  expect(org.org.country).toBe('JO')
})

test('C1 saves through PATCH — days, model and tones survive a reload', async ({ page }) => {
  await login(page, owner, PASSWORD)
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  // TRAP 2: that h1 belongs to the shell and renders THROUGH the loading
  // skeleton, so it is not a readiness signal. Without this wait the form is
  // dirtied against the pre-sync (static) world and the live sync then
  // replaces it underneath, leaving the save bar stuck on "unsaved changes"
  // over seven demo tones the org does not have.
  // The screen's whole sync — live-red-2026-08-23.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  // The wizard seeded the five preset tones (product law: always present);
  // pick one so the schedule is valid, then change the cadence.
  await page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: 'Provocative' }).click()
  await page.getByRole('button', { name: 'One fewer post per day' }).click()
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)

  // The reload reads the server back through the sync.
  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()
  // The same sync, read back after the reload — live-red-2026-08-23.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
})

/**
 * RETIRED 2026-08-20 (E2E-0820 B9): "event sources: the countries endpoint
 * feeds the picker; one per country".
 *
 * It asserted the INT-4 event-source surface — a "Jordan public holidays"
 * row, an "Add source" button, a duplicate-country 409 — all of which INT-8
 * superseded when the org's own country became the single holiday control
 * (D-INT-F; Ward confirmed event-sources are superseded, open-items 21). The
 * screen it drove now says so in `MESSAGES.notices.eventSourcesSuperseded`
 * and offers nothing to add, so the test could only ever fail from INT-8 on;
 * it had simply never been run since INT-4.
 *
 * What replaced it, all green in `live-country.spec.ts`: the wizard sets ONE
 * country and finishing loads its calendar · the calendar carries real
 * holidays with each day's rules · re-saving the same country is a quiet
 * no-op rather than a fake reload · and, standing in for this test directly,
 * "C2 no longer offers an event source it cannot create".
 */
test('slots, if ingestion produced any, honour skip/un-skip and never offer approve', async ({
  page,
  request,
}) => {
  await login(page, owner, PASSWORD)
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const orgId = orgs.items[0].id
  const slots = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/slots`, { headers: auth })
  ).json()) as { items: { id: string; status: string }[]; total: number }

  test.skip(slots.total === 0, 'ingestion has not produced slots for this org yet')

  const target = slots.items.find((slot) => slot.status === 'review')!
  const skipped = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
    headers: auth,
    data: { skip: true },
  })
  expect(((await skipped.json()) as { status: string }).status).toBe('skipped')
  const restored = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
    headers: auth,
    data: { skip: false },
  })
  expect(((await restored.json()) as { status: string }).status).toBe('review')
})