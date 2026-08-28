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
