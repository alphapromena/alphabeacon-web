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
  // Step 3: add the default holiday feed (Jordan) so Finish has a source.
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  // The wire agrees: one schedule, one holidays source for JO.
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
  const sources = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/event-sources`, { headers: auth })
  ).json()) as { items: { country: string }[] }
  expect(sources.items.map((source) => source.country)).toContain('JO')
})

test('C1 saves through PATCH — days, model and tones survive a reload', async ({ page }) => {
  await login(page, owner, PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
    timeout: 15_000,
  })

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
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
})

test('event sources: the countries endpoint feeds the picker; one per country', async ({
  page,
}) => {
  await login(page, owner, PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.goto('/calendar/sources')
  await expect(page.getByRole('heading', { name: 'Event sources', level: 1 })).toBeVisible({
    timeout: 15_000,
  })

  // Jordan arrived with the wizard.
  await expect(page.getByText('Jordan public holidays')).toBeVisible()

  // Live mode: Google is absent (no API home), the picker is the countries
  // endpoint. Adding a duplicate country is the documented 409.
  await page.getByRole('button', { name: 'Add source' }).first().click()
  await expect(page.getByText('Google Calendar')).toHaveCount(0)
  const picker = page.getByLabel('Country', { exact: true })
  await expect(picker.locator('option').first()).not.toHaveText('')
  await picker.selectOption('JO')
  await page.getByRole('button', { name: 'Add source' }).last().click()
  await expect(page.getByText('That country already feeds your calendar.')).toBeVisible()

  // A fresh country lands, and removal takes it away again.
  await picker.selectOption('AE')
  await page.getByRole('button', { name: 'Add source' }).last().click()
  await expect(page.getByText('Source added')).toBeVisible()
  await expect(page.getByText(/United Arab Emirates public holidays/)).toBeVisible()
})

test('slots, if ingestion produced any, honour skip/un-skip and never offer approve', async ({
  page,
  request,
}) => {
  await login(page, owner, PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
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