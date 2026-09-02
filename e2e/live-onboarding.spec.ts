/**
 * ONB-0827's verify: the whole new first run against the DEPLOYED API, through
 * the real UI (decisions.md D-ONB-B, D-ONB-C, D-ONB-D).
 *
 * One walk, in the order a real person meets it:
 *   1. signup → verify → **the app**, with no wizard anywhere in between;
 *   2. the tones screen is honestly empty — nothing was seeded (D-ONB-B);
 *   3. generation is LOCKED, and the checklist names all four brand entities;
 *   4. the four are completed from Settings, each on its own screen;
 *   5. generation unlocks, and a real run comes back.
 *
 * Why this file exists rather than more assertions in `live-brand`: the thing
 * under test is the JOURNEY, and the journey is what the wizard's deletion
 * changed. A workspace that is half set up is only reachable by walking it.
 *
 * Cost discipline (D-INT-I): ONE balanced run, one tone — the same
 * budget `live-generate` keeps, and the cheapest run that can prove the gate
 * really opened rather than merely looking open.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { ensureToneLanguage, openSettingsTab, signUpAndEnter, skipUnlessFunded } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}o@alphapromena.com`
const ORG_NAME = `QA Onboarding Org ${RUN}`
const TONE_NAME = 'Roastery floor'

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

test.beforeEach(() => {
  test.setTimeout(180_000)
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
}

test('signup → verify → the app: no wizard, and the workspace is real', async ({ page }) => {
  await signUpAndEnter(page, {
    name: 'QA Onboarding Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })

  // The wizard's landmarks must be absent, not merely unvisited.
  await expect(page.getByRole('link', { name: /Resume setup/ })).toHaveCount(0)
  await expect(page.getByText(/step \d of 5/i)).toHaveCount(0)
})

test('a fresh live org has no tones, and the screen says what that costs', async ({ page }) => {
  await login(page)
  await openSettingsTab(page, 'Tones')

  // D-ONB-B: nothing is seeded any more. No preset card, no "Presets" heading
  // promising a floor that is not there.
  await expect(page.locator('[data-slot="card"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Presets' })).toHaveCount(0)
  await expect(page.getByText('No tones yet', { exact: true })).toBeVisible()
  await expect(
    // Case-insensitive on the first word: the sentence was reworded during
    // ONB-0827's close-out (the empty state used to repeat its own title),
    // and a capital N is not the part worth asserting. The CLAIM is.
    page.getByText(/nothing generates until this workspace has at least one tone/i),
  ).toBeVisible()

  // A review artefact, inert unless asked for: this state exists only in live
  // mode, because every demo world carries the five presets.
  if (process.env.ONB_SHOTS) {
    await page.screenshot({
      path: 'test-results/onb-0827-shots/5-tones-empty-live.png',
      fullPage: true,
    })
  }
})

test('generation is locked, and the checklist names all four', async ({ page }) => {
  await login(page)
  await page.goto('/generate')

  // The route renders the checklist state, not a dead form (D-ONB-D).
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByRole('button', { name: 'Generate' })).toHaveCount(0)

  const checklist = page.getByRole('region', { name: 'Brand setup' })
  for (const label of ['Brand voice', 'At least one tone', 'Sources', 'Topics']) {
    await expect(checklist.getByRole('link', { name: `Set up ${label}` })).toBeVisible()
  }

  // The Phase-0 ruling, on screen: the country and the posting rhythm are
  // listed as setup but never as blockers (probe 60c06fd5-… ran without both).
  await expect(checklist.getByText(/optional for generating/).first()).toBeVisible()

  if (process.env.ONB_SHOTS) {
    await page.screenshot({
      path: 'test-results/onb-0827-shots/6-generate-blocked-live.png',
      fullPage: true,
    })
  }
})

test('the Studio composer is locked by the same gate', async ({ page }) => {
  await login(page)
  await page.goto('/studio/new')
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
})

test('completing the four brand entities unlocks generation', async ({ page }) => {
  await login(page)

  // 1 — the brand voice, from the checklist's own link.
  await page.goto('/generate')
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await page
    .getByRole('region', { name: 'Brand setup' })
    .getByRole('link', { name: 'Set up Brand voice' })
    .click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.locator('input[id^="voice-do"]').last().fill('Name the roast date')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: SCREEN_SYNC })

  // 2 — the first tone, written from the empty state.
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create your first tone' }).click()
  await page.getByLabel('Tone name').fill(TONE_NAME)
  // HSN-03: a tone's language is required, with no default.
  await page.getByLabel('Language').selectOption('en')
  await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  // A tone needs at least one do or dont, or the editor refuses it.
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible({ timeout: SCREEN_SYNC })

  // 3 and 4 — a source and a topic share one screen.
  await openSettingsTab(page, 'Sources & topics')
  await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  await page.getByRole('button', { name: 'Add source' }).click()
  await expect(page.getByText('Source added')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  await expect(page.getByText('single origin')).toBeVisible()
  // The topic POST is optimistic on screen; let it land before navigating.
  await page.waitForTimeout(2000)

  // THE GATE OPENS. A reload proves it opened on the server's answer rather
  // than on this session's optimistic state.
  await page.goto('/generate')
  await expect(page.getByRole('heading', { name: 'Generate', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled({
    timeout: SCREEN_SYNC,
  })

  // And the dashboard stops nagging, because there is nothing left to nag about.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.getByRole('heading', { name: 'Finish setting up' })).toHaveCount(0)
})

test('the unlocked run really runs — one balanced draft', async ({ page, request }) => {
  test.setTimeout(180_000)
  await login(page)
  // The 402 rule (HSN-0902): the gate being OPEN is proved above; whether
  // the run is PAID for is the wallet's business — on a zero wallet the
  // wire refuses it at intake, and `live-generate` is the spec that
  // asserts that refusal. This one self-skips rather than reading a
  // funding refusal as a closed gate.
  await skipUnlessFunded(page, request, 'the balanced run that proves the unlocked gate')
  // CUT-0831: a fresh browser needs the tone's language re-saved (sidecar).
  await ensureToneLanguage(page, TONE_NAME)
  await page.goto('/generate')
  await expect(page.getByRole('heading', { name: 'Generate', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  // One tone, balanced — the cheapest proof the gate did
  // not just look open (D-INT-I).
  await expect(page.getByText('1 draft')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /^1 draft$/ })).toBeVisible({ timeout: 120_000 })

  const card = page.getByRole('article').first()
  const body = ((await card.locator('p').first().textContent()) ?? '').trim()
  expect(body.length).toBeGreaterThan(20)
})
