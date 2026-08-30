/**
 * INT-3's verify: the four brand resources against the DEPLOYED API through
 * the real UI — tones under the adapter (name + description stored, rule
 * editors honestly absent), voice rules as a flat list, sources with the
 * scheme restored on write, topics as replace-semantics tags — plus the
 * server-side cascade: deleting a tone drops it from schedules (proved via a
 * harness-created schedule, since the schedule UI goes live in INT-4).
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { signUpAndEnter } from './live-setup'
import { ONE_CALL, SCREEN_SYNC } from './live-clocks'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}b@alphapromena.com`
const ORG_NAME = `QA Brand Org ${RUN}`
const MESSAGE_REACHES_GENERATION = 'Saved changes reach the next generation automatically.'

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

/**
 * This file had no cap, so every test in it ran under the suite's 30 s default
 * — and the signup -> wizard -> Finish walk alone measures 27-29 s door to door
 * against today's API (Docs/api/live-red-2026-08-23.md). It could not pass at
 * any wait value. Aligned with the 150 s `live-country` set when Finish became
 * idempotent (E2E-0820 B7); no wait value and no assertion here changed.
 */
test.beforeEach(() => {
  test.setTimeout(150_000)
})

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

async function openSettingsTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  await signUpAndEnter(page, {
    name: 'QA Brand Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('a custom tone: created under the adapter, edited, and it survives a reload', async ({
  page,
}) => {
  await login(page, owner, PASSWORD)
  await openSettingsTab(page, 'Tones')
  // A fresh org has no tones since ONB-0827 (D-ONB-B), so the way in is the
  // empty state's CTA rather than the header button.
  await page.getByRole('link', { name: 'Create your first tone' }).click()

  // INT-7: rules landed on the wire, so both editors are real now; only the
  // example line is still absent, and the note says so by name.
  await expect(page.getByText(/Example lines arrive with a later backend phase/)).toBeVisible()
  await expect(page.getByLabel('Do', { exact: true })).toHaveCount(1)

  await page.getByLabel('Tone name').fill('Roastery floor')
  await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  await page.getByRole('button', { name: 'Create tone' }).click()
  // A save and its toast: the ONE_CALL rung, not the suite's 5 s default.
  // Brand mutations are the SLOWEST saves the app makes — every committed
  // voice/source/topic write re-pushes the org's context bundle server-side
  // (api.md, "Context sync"), documented as ~1–2 s longer than a read. These
  // sat at 5 s and passed only while the API happened to answer inside it.
  await expect(page.getByText('Tone created')).toBeVisible({ timeout: ONE_CALL })
  await expect(page.getByText('Roastery floor')).toBeVisible()

  // A reload re-reads the server: the tone is real.
  await page.goto('/settings/tones')
  // First wait after a reload — the whole brand sync — live-red-2026-08-23.
  await expect(page.getByText('Roastery floor')).toBeVisible({ timeout: SCREEN_SYNC })
})

test('voice rules: the flat live list persists through the API', async ({ page }) => {
  await login(page, owner, PASSWORD)
  await openSettingsTab(page, 'Brand voice')

  // Live mode now has BOTH lists; only examples are explained as absent.
  await expect(page.getByText(/Example lines arrive with a later backend phase/)).toBeVisible()
  await expect(page.getByText(MESSAGE_REACHES_GENERATION)).toBeVisible()

  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.locator('input[id^="voice-do"]').last().fill('Name the farm when it matters')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: ONE_CALL })

  await page.goto('/settings/brand-voice')
  await expect(page.locator('input[id^="voice-do"]').first()).toHaveValue(
    'Name the farm when it matters',
  )
})

test('sources and topics: scheme-less display, real persistence', async ({ page }) => {
  await login(page, owner, PASSWORD)
  await openSettingsTab(page, 'Sources & topics')

  await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  await page.getByRole('button', { name: 'Add source' }).click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText('Source added')).toBeVisible({ timeout: ONE_CALL })
  await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible()

  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  // The tag chip is optimistic; give its POST the round trip before the
  // reload aborts in-flight requests.
  await expect(page.getByText('single origin')).toBeVisible()
  await page.waitForTimeout(1500)

  // Reload: both live on the server; the source renders scheme-less by law.
  // A reload plus the whole brand sync — the rung this file already uses for
  // its other post-reload reads.
  await page.goto('/settings/sources')
  await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByText('single origin')).toBeVisible()

  await page.getByRole('button', { name: /Remove Perfectdailygrind/ }).click()
  await page.goto('/settings/sources')
  await expect(page.getByText('perfectdailygrind.com/feed')).toHaveCount(0)
})

test('deleting a tone reflects in the schedules that referenced it', async ({
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
  const tones = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/brand/tones`, { headers: auth })
  ).json()) as { items: { id: string; name: string }[] }
  const tone = tones.items.find((entry) => entry.name === 'Roastery floor')!

  // A schedule referencing the tone (the schedule UI goes live in INT-4).
  const schedule = (await (
    await request.post(`${API_BASE}/orgs/${orgId}/schedules`, {
      headers: auth,
      data: {
        timezone: 'Asia/Amman',
        days: ['mon', 'wed'],
        generateAt: '07:00',
        toneIds: [tone.id],
      },
    })
  ).json()) as { id: string; toneIds: string[] }
  expect(schedule.toneIds).toEqual([tone.id])

  // Delete the tone through the UI…
  await openSettingsTab(page, 'Tones')
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Roastery floor' })
    .getByRole('button', { name: /Delete/ })
    .click()
  await page.getByRole('button', { name: 'Delete tone' }).click()
  await expect(page.getByText('Tone deleted')).toBeVisible()

  // …and the schedule no longer references it: the documented cascade.
  const after = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/schedules/${schedule.id}`, { headers: auth })
  ).json()) as { toneIds: string[] }
  expect(after.toneIds).toEqual([])
})