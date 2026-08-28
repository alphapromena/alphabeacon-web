/**
 * ONB-0827 review screenshots — the three states the founder asked to see.
 *
 * NOT a gate. This file is tagged `@shots` and is skipped by every ordinary
 * run: it asserts nothing and exists only to put the checklist, the blocked
 * generate state and the tones empty state in front of a human. It runs in
 * STATIC mode, from the `fresh` world, so it costs nothing and needs no API.
 *
 * Delete it, or keep it — it is a review artefact, not coverage.
 */
import { activateDataset, openFromRail as open, rail } from './datasets'
import { expect, test } from './fixtures'

const DIR = 'test-results/onb-0827-shots'

test.skip(!process.env.ONB_SHOTS, 'review artefact — run with ONB_SHOTS=1')

test('@shots the checklist, the blocked generate, and the empty tones', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })

  // 1 — the dashboard's setup checklist card.
  await open(page, 'Dashboard', 'Fresh org')
  await expect(page.getByRole('region', { name: 'Brand setup' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/1-dashboard-checklist.png`, fullPage: true })

  // 2 — generation, blocked, naming what is missing.
  await rail(page, 'Generate').click()
  await expect(page.getByRole('heading', { name: 'Finish your brand setup first' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/2-generate-blocked.png`, fullPage: true })

  // 3 — the Settings entry, on the screen every route into Settings lands on.
  await rail(page, 'Settings').click()
  await expect(page.getByRole('region', { name: 'Brand setup' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/3-settings-checklist.png`, fullPage: true })

  // 4 — signup → verify → THE APP, with no wizard in between.
  //
  // The TONES EMPTY STATE is deliberately not here: every demo world carries
  // the five presets (the order left that data alone), so a workspace with no
  // tones at all is reachable only in LIVE mode. Its shot is taken by
  // `live-onboarding.spec.ts` under the same env var.
  await activateDataset(page, 'Visitor (signed out)')
  await page.getByRole('banner').getByRole('link', { name: 'Get started' }).first().click()
  await page.getByLabel('Full name').fill('Lena Park')
  await page.getByLabel('Work email').fill('lena@novaskincare.example')
  await page.getByLabel('Password', { exact: true }).fill('Roasted2Order')
  await page.getByLabel('Organization name').fill('Nova Skincare')
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: "I've verified my email" }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.screenshot({ path: `${DIR}/4-landed-in-app-no-wizard.png`, fullPage: true })
})
