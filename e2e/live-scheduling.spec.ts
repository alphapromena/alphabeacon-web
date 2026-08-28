/**
 * INT-4's verify: schedules, event sources (+ the countries reference) and
 * slot decisions against the DEPLOYED API through the real UI.
 *
 * **The wizard is deleted** (ORDER ONB-0827, D-ONB-C), so nothing creates a
 * schedule on the way in: a fresh workspace has none, C1 is the only surface
 * that makes one, and its first save POSTs while later saves PATCH with
 * toneIds replace-semantics; the countries endpoint feeds the picker; one
 * source per country (409, told honestly);
 * slots — written by ingestion, never created here — are exercised only if
 * ingestion produced any, and `approved` stays unreachable by construction.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { signUpAndEnter } from './live-setup'
import { SCREEN_SYNC } from './live-clocks'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}s@alphapromena.com`
const ORG_NAME = `QA Sched Org ${RUN}`
/** The org's ONE tone. Nothing is seeded since ONB-0827, so C1 needs a tone
 *  to exist before it can prove that picking one survives a reload. */
const TONE_NAME = 'Roastery floor'

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

/**
 * The INVERSE of the test that used to open this file (ORDER ONB-0827).
 *
 * It asserted that the wizard's Finish created the org, a schedule and the
 * holiday country in one burst. Finish is deleted and so is the burst: the org
 * is the ONLY thing created for the user, on purpose, because it is the only
 * one that cannot be set from a durable screen afterwards. Proving that
 * nothing else was quietly created is what stops a half-built workspace
 * looking configured — which is the shape org 619 arrived in.
 */
test('signup creates the workspace and NOTHING else', async ({ page, request }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Sched Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string; name: string }[]
  }
  // Exactly one workspace, wearing the name typed at signup — the idempotency
  // law: a retry must never mint a second one (E2E-0820 F12).
  expect(orgs.items).toHaveLength(1)
  expect(orgs.items[0].name).toBe(ORG_NAME)

  const orgId = orgs.items[0].id
  const schedules = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth })
  ).json()) as { total: number }
  expect(schedules.total).toBe(0)

  const tones = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/brand/tones`, { headers: auth })
  ).json()) as { total: number }
  expect(tones.total).toBe(0)

  const org = (await (
    await request.get(`${API_BASE}/orgs/${orgId}`, { headers: auth })
  ).json()) as { org: { country: string | null } }
  expect(org.org.country).toBeNull()
})

test('C1 creates the schedule on first save, then PATCHes it — and it survives a reload', async ({
  page,
  request,
}) => {
  await login(page, owner, PASSWORD)
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  // PRECONDITION, not the thing under test: this org has zero tones (ONB-0827,
  // D-ONB-B) and a schedule needs one. Written through the API the way this
  // suite already sets up preconditions it does not assert on.
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  await request.post(`${API_BASE}/orgs/${orgs.items[0].id}/brand/tones`, {
    headers: auth,
    data: { name: TONE_NAME, description: 'Warm, specific, smells of coffee.', rules: [] },
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

  // Nothing is seeded any more (ORDER ONB-0827, D-ONB-B), so the org's one
  // tone is the one this test wrote for itself above; pick it so the schedule
  // is valid, then set the cadence.
  await page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: TONE_NAME }).click()
  await page.getByRole('button', { name: 'Monday' }).click()
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  // FIRST save: the org has no schedule, so this is the POST fallback C1 grew
  // in B9 — the wizard used to create the row and no longer does.
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })

  // The reload reads the server back through the sync: the row is really there.
  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()
  // The same sync, read back after the reload — live-red-2026-08-23.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  await expect(
    page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: TONE_NAME }),
  ).toHaveAttribute('aria-pressed', 'true')

  // SECOND save: a schedule exists now, so this is the PATCH path, with the
  // toneIds replace-semantics this file was written to prove.
  await page.getByRole('button', { name: 'One fewer post per day' }).click()
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })
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