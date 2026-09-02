/**
 * Shared LIVE-mode setup walks, through the real product.
 *
 * Why this exists (ORDER ONB-0827): a fresh live org used to arrive with five
 * preset tones planted by the wizard's Finish, so any spec that needed a tone
 * already had one. Nothing is seeded now — a new workspace starts empty and
 * its owner writes the first tone — which means several specs suddenly need
 * the SAME few steps before they can get to the thing they actually assert.
 *
 * Duplicating that walk across files is how a suite rots: state.md trap 18 is
 * exactly the case of one spec being updated for a rename and its neighbours
 * quietly failing for months. One place to fix beats six.
 *
 * These are PRECONDITIONS, never assertions. A spec that wants to prove
 * something about tone creation writes it out itself; a spec that just needs a
 * tone to exist calls in here.
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { SCREEN_SYNC } from './live-clocks'

/** Every dev verification code is `000000` (api.md, Auth). */
const CODE = '000000'

const API_BASE = process.env.VITE_API_BASE_URL

/**
 * The session token the app stored (`src/api/session.ts`, tab-scoped first,
 * remembered second) — for a spec's OWN reads with the same Bearer. It is
 * used, never printed.
 */
export async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  if (!raw) throw new Error('no live session in storage — log in first')
  return (JSON.parse(raw) as { token: string }).token
}

export interface WalletRead {
  orgId: string
  token: string
  availableCents: number
}

/** The working org and its wallet, straight from the wire. */
export async function readWallet(page: Page, request: APIRequestContext): Promise<WalletRead> {
  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const orgId = orgs.items[0].id
  const wallet = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/alphastudio/wallet`, { headers: auth })
  ).json()) as { availableCents: number }
  return { orgId, token, availableCents: wallet.availableCents }
}

/**
 * THE 402 RULE for the live gate (founder, ORDER HSN-0902, 2026-09-02).
 *
 * A fresh org's wallet is ZERO — the plan is the only funding (Ward's model,
 * measured 2026-09-02; open-item 46) — so every generation answers
 * `402 wallet_insufficient` at intake, before any spend. ONE spec asserts
 * that refusal (`live-generate`); every OTHER generating spec calls this
 * first and self-skips with the honest reason, the way `live-create-visual`
 * self-skips on `LIVE_MEDIA`. "No red that is only no funding."
 *
 * The wallet is read BEFORE any body is sent: a funded org still runs the
 * real thing, and an unfunded one never sends a body it knows the wire will
 * refuse. A precondition, never an assertion.
 */
export async function skipUnlessFunded(
  page: Page,
  request: APIRequestContext,
  what: string,
): Promise<WalletRead> {
  const wallet = await readWallet(page, request)
  test.skip(
    wallet.availableCents === 0,
    `402 wallet_insufficient would refuse ${what}: the org's wallet is $0.00 — the plan is the only funding (open-item 46), not a product failure`,
  )
  return wallet
}

/**
 * Signup → verify → THE APP, which since ONB-0827 (D-ONB-C) is the whole
 * journey: verifying creates the workspace from the org name typed at signup
 * and lands on the dashboard. Every live file used to inline this walk plus
 * five wizard steps; the wizard is deleted and the walk is one call.
 *
 * `WORKSPACE_READY` is the wait it needs: signup, verify, `POST /orgs` and the
 * resync that follows, back to back. It is the same class of burst the old
 * Finish was, minus the country lookup that made that one the slowest thing in
 * the suite.
 */
export async function signUpAndEnter(
  page: Page,
  account: { name: string; email: string; password: string; orgName: string },
) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(account.name)
  await page.getByLabel('Work email').fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByLabel('Organization name').fill(account.orgName)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
    timeout: 20_000,
  })

  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)

  // No wizard in between: the next thing on screen is the product.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: WORKSPACE_READY,
  })
}

/** Signup + verify + `POST /orgs` + the resync, back to back. */
export const WORKSPACE_READY = 60_000

/** Settings is a tablist above one outlet; every section is reached this way. */
export async function openSettingsTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
  // The tab's whole sync — live-red-2026-08-23.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
}

/**
 * The org's FIRST tone, written the way a new owner writes it: from the empty
 * state on I3, whose CTA is "Create your first tone" rather than the header's
 * "Create custom tone" (which only exists once there is a list to add to).
 */
export async function createFirstTone(
  page: Page,
  tone: { name: string; description: string; doRule: string },
) {
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create your first tone' }).click()
  await page.getByLabel('Tone name').fill(tone.name)
  // HSN-03: a tone's language is required, with no default.
  await page.getByLabel('Language').selectOption('en')
  await page.getByLabel('What this tone sounds like').fill(tone.description)
  // NOT optional: the editor refuses a tone with no do and no dont
  // (`toneSchema`'s refine, MESSAGES.errors.toneRuleRequired). A helper that
  // let a caller omit it would build an invalid tone and fail forty seconds
  // later on a missing toast, which is how it first went wrong.
  await page.getByLabel('Do', { exact: true }).fill(tone.doRule)
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible({ timeout: SCREEN_SYNC })
}

/**
 * CUT-0831 interim: a tone's language lives in a per-browser SIDECAR until
 * the backend persists it, so a fresh context — which every Playwright test
 * is — sees the org's tones as "Needs a language" and the Generate page has
 * nothing selectable. This performs the documented backfill gesture (open
 * the tone, pick its language, save) in THIS context, exactly the re-save
 * the founder does by hand on production after the deploy.
 */
export async function ensureToneLanguage(page: Page, toneName: string) {
  await openSettingsTab(page, 'Tones')
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: toneName })
    .getByRole('link', { name: 'Edit' })
    .click()
  await page.getByLabel('Tone name').waitFor()
  await page.getByLabel('Language').selectOption('en')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Tone saved')).toBeVisible({ timeout: SCREEN_SYNC })
}

/**
 * The four brand entities, through the real screens — everything the readiness
 * gate asks for (D-ONB-D), and nothing it does not.
 *
 * A tone alone stopped being enough the moment the gate landed: any spec that
 * reaches a generation now needs a voice, a tone, a source and a topic first.
 * The country and the posting rhythm are deliberately NOT here — the Phase-0
 * probe proved a run does not need them (request
 * `60c06fd5-acb7-4060-81d5-4a7b8113ebeb`), so a helper that set them would be
 * quietly asserting a stricter gate than the product has.
 */
export async function completeBrandSetup(
  page: Page,
  brand: { toneName: string; toneDescription: string; doRule: string },
) {
  await openSettingsTab(page, 'Brand voice')
  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.locator('input[id^="voice-do"]').last().fill(brand.doRule)
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: SCREEN_SYNC })

  await createFirstTone(page, {
    name: brand.toneName,
    description: brand.toneDescription,
    doRule: brand.doRule,
  })

  await openSettingsTab(page, 'Sources & topics')
  await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  await page.getByRole('button', { name: 'Add source' }).click()
  await expect(page.getByText('Source added')).toBeVisible({ timeout: SCREEN_SYNC })
  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  await expect(page.getByText('single origin')).toBeVisible()
  // The topic chip is optimistic; let its POST land before navigating away.
  await page.waitForTimeout(2000)
}
