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

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}b@alphapromena.com`
const ORG_NAME = `QA Brand Org ${RUN}`
const MESSAGE_REACHES_GENERATION = 'Saved changes reach the next generation automatically.'

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

async function openSettingsTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Brand Owner')
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
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  // Finish is org + preset tones + schedule + sources + the resync — a real
  // burst of wire calls; give it headroom.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 25_000,
  })
})

test('a custom tone: created under the adapter, edited, and it survives a reload', async ({
  page,
}) => {
  await login(page, owner, PASSWORD)
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create custom tone' }).first().click()

  // INT-7: rules landed on the wire, so both editors are real now; only the
  // example line is still absent, and the note says so by name.
  await expect(page.getByText(/Example lines arrive with a later backend phase/)).toBeVisible()
  await expect(page.getByLabel('Do', { exact: true })).toHaveCount(1)

  await page.getByLabel('Tone name').fill('Roastery floor')
  await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible()
  await expect(page.getByText('Roastery floor')).toBeVisible()

  // A reload re-reads the server: the tone is real.
  await page.goto('/settings/tones')
  await expect(page.getByText('Roastery floor')).toBeVisible()
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
  await expect(page.getByText('Brand voice saved')).toBeVisible()

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
  await expect(page.getByText('Source added')).toBeVisible()
  await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible()

  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  // The tag chip is optimistic; give its POST the round trip before the
  // reload aborts in-flight requests.
  await expect(page.getByText('single origin')).toBeVisible()
  await page.waitForTimeout(1500)

  // Reload: both live on the server; the source renders scheme-less by law.
  await page.goto('/settings/sources')
  await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
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