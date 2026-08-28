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
import { expect, type Page } from '@playwright/test'
import { SCREEN_SYNC } from './live-clocks'

/** Every dev verification code is `000000` (api.md, Auth). */
const CODE = '000000'

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
  tone: { name: string; description: string; doRule?: string },
) {
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create your first tone' }).click()
  await page.getByLabel('Tone name').fill(tone.name)
  await page.getByLabel('What this tone sounds like').fill(tone.description)
  if (tone.doRule) await page.getByLabel('Do', { exact: true }).fill(tone.doRule)
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible({ timeout: SCREEN_SYNC })
}
