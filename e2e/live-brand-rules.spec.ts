/**
 * INT-7's verify: the two things the 2026-08-17 contract unblocked, against
 * the DEPLOYED API through the real UI.
 *
 * 1. Tone rules are real (D-INT-C) - created with the tone, read back after a
 *    reload, REPLACED wholesale by a PATCH, and clearable to empty. The
 *    replace semantics are the part worth pinning: `PATCH { rules }` swaps the
 *    whole list, so an edit that drops a rule must actually drop it server
 *    side rather than leave an orphan behind.
 * 2. The brand voice is ONE canonical row (D-INT-B) - written once, edited in
 *    place, read back flattened. INT-3 wrote a row per rule and an edited line
 *    jumped to the top on refetch (open-items 12); the assertion on ORDER
 *    below is what proves that is gone.
 * 3. "Preview this tone" runs the real capability and comes back with a
 *    non-empty sample, with `brandVoice` omitted so the platform grounds on
 *    the org's pushed bundle - the same thing generation uses.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}r@alphapromena.com`
const ORG_NAME = `QA Rules Org ${RUN}`

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

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
}

async function openSettingsTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
  // The tab's whole sync — live-red-2026-08-23.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
}

/** Custom tones are edited from their card; that link is named "Edit". */
async function editTone(page: Page, name: string) {
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: name })
    .getByRole('link', { name: 'Edit' })
    .click()
  await expect(page.getByLabel('Tone name')).toHaveValue(name)
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Rules Owner')
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
  await expect(page.getByText('finish setting up your workspace')).toBeVisible({ timeout: 20_000 })

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
  // Org + schedule: a burst of writes. No tones are planted any more
  // (ORDER ONB-0827, D-ONB-B) — the next test is what proves that.
  // Downstream of PUT /orgs/:id/country — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: AFTER_COUNTRY,
  })
})

/**
 * The INVERSE of the test that used to stand here (ORDER ONB-0827, D-ONB-B).
 *
 * Until this cycle, Finish planted five preset tones and this file asserted
 * they arrived carrying their rules. Presets are no longer planted: a fresh
 * live org starts with ZERO tones and its owner writes the first one. So the
 * thing worth proving flipped — not "the five are here with their rules" but
 * "there are none, the screen says so honestly, and it says why it matters".
 */
test('a fresh org has no tones at all, and the screen says what that costs', async ({ page }) => {
  await login(page)
  await openSettingsTab(page, 'Tones')

  // Nothing was planted: no preset card, and no "Presets" section claiming a
  // floor that is not there.
  await expect(page.locator('[data-slot="card"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Presets' })).toHaveCount(0)

  // The honest empty state, naming the consequence rather than just the gap.
  await expect(page.getByText('No tones yet', { exact: true })).toBeVisible()
  await expect(
    page.getByText(/Nothing generates until this workspace has at least one tone/),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create your first tone' })).toBeVisible()
})

test('a tone keeps its rules, and a PATCH replaces the whole list', async ({ page }) => {
  await login(page)
  await openSettingsTab(page, 'Tones')
  // The org has no tones yet, so the entry point is the empty state's CTA.
  await page.getByRole('link', { name: 'Create your first tone' }).click()

  await page.getByLabel('Tone name').fill('Roastery floor')
  await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  await page.getByLabel('Do', { exact: true }).fill('Name the farm\nName the roast date')
  await page.getByLabel("Don't", { exact: true }).fill('Say artisanal')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible()

  // A reload re-reads the server: the rules are really stored.
  await page.goto('/settings/tones')
  await editTone(page, 'Roastery floor')
  await expect(page.getByLabel('Do', { exact: true })).toHaveValue(
    'Name the farm\nName the roast date',
  )
  await expect(page.getByLabel("Don't", { exact: true })).toHaveValue('Say artisanal')

  // Replace, not append: one do-rule survives and the don't is gone.
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  await page.getByLabel("Don't", { exact: true }).fill('')
  // The routed editor labels its submit by intent: "Create tone" when new,
  // "Save changes" when editing the tone that already exists.
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Tone saved')).toBeVisible({ timeout: 20_000 })

  await page.goto('/settings/tones')
  await editTone(page, 'Roastery floor')
  await expect(page.getByLabel('Do', { exact: true })).toHaveValue('Name the roast date')
  await expect(page.getByLabel("Don't", { exact: true })).toHaveValue('')
})

test('the brand voice writes to one row, and an edit does not reorder it', async ({ page }) => {
  await login(page)
  await openSettingsTab(page, 'Brand voice')

  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.locator('input[id^="voice-do"]').last().fill('Name the farm when it matters')
  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.locator('input[id^="voice-do"]').last().fill('Say what changed this week')
  await page.getByRole('button', { name: "Add don't", exact: true }).click()
  await page.locator('input[id^="voice-dont"]').last().fill('Call anything artisanal')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: 20_000 })

  await page.goto('/settings/brand-voice')
  // First wait after a reload — the whole brand sync — live-red-2026-08-23.
  await expect(page.locator('input[id^="voice-do"]').first()).toHaveValue(
    'Name the farm when it matters',
    { timeout: SCREEN_SYNC },
  )
  await expect(page.locator('input[id^="voice-dont"]').first()).toHaveValue(
    'Call anything artisanal',
  )

  // Edit the FIRST rule. Under INT-3 this deleted and re-created the row, so
  // it came back at the top of a newest-first list - the list reordered itself
  // under the user. One canonical row cannot do that.
  await page.locator('input[id^="voice-do"]').first().fill('Name the farm, always')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: 20_000 })

  await page.goto('/settings/brand-voice')
  // First wait after a reload — the whole brand sync — live-red-2026-08-23.
  await expect(page.locator('input[id^="voice-do"]').first()).toHaveValue('Name the farm, always', {
    timeout: SCREEN_SYNC,
  })
  await expect(page.locator('input[id^="voice-do"]').nth(1)).toHaveValue(
    'Say what changed this week',
  )
})

test('Preview this tone returns a real sample from the platform', async ({ page }) => {
  await login(page)
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create custom tone' }).first().click()

  await page.getByLabel('Tone name').fill('Counter service')
  await page
    .getByLabel('What this tone sounds like')
    .fill('Plain and warm, the way you would say it across the counter.')
  await page.getByLabel('Do', { exact: true }).fill('Name one concrete detail')

  await page.getByRole('button', { name: 'Preview this tone' }).click()
  // A sync run: a few seconds upstream.
  await expect(page.getByText('A real sample, written in this tone just now.')).toBeVisible({
    timeout: 45_000,
  })
  // The sample is real prose, not an echo of what was typed, and the rules
  // that shaped it are listed beside it. Length rather than a pattern: no
  // English sentence has twenty consecutive word characters, and asserting on
  // wording would pin a model's output.
  const card = page.locator('div').filter({ hasText: 'Shaped by:' }).last()
  const sample = card.locator('p').first()
  const text = ((await sample.textContent()) ?? '').trim()
  expect(text.length).toBeGreaterThan(20)
  expect(text).not.toContain('Plain and warm, the way you would say it')
  await expect(card).toContainText('Name one concrete detail')
})
