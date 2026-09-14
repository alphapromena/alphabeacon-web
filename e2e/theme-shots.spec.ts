/**
 * THEME-0913 review screenshots — Today in all four states, for Abdallah.
 *
 * NOT a gate. This file is tagged `@shots`, asserts nothing about appearance,
 * and is skipped by every ordinary run: it exists only to put the re-themed
 * Today in front of a human. It runs in STATIC mode, so it costs nothing and
 * needs no API.
 *
 * THE OUTPUT DIRECTORY IS DELIBERATE. Shots go under `Docs/qa/theme-0913/`,
 * never under `test-results/` — Playwright's `outputDir` is wiped at the start
 * of every run, and a review record has already been lost that way once
 * (state.md trap 24).
 *
 * EVERY SHOT WAITS FOR ITS OWN CONTENT, not for a generic readiness signal.
 * The first draft of this file waited on `aria-busy` and `role="alert"`, and
 * captured a skeleton for the populated state and a bare route spinner for the
 * error state — screenshots that would have wasted a design review. A shot is
 * only worth taking once the thing it is meant to show is on screen.
 *
 * English only: the product has no Arabic UI locale and no `dir` mechanism at
 * all (open-items 68), so an "Arabic screenshot" would be an English screen
 * with a misleading filename.
 */
import { mkdirSync } from 'node:fs'
import { activateDataset, rail } from './datasets'
import { expect, test } from './fixtures'

const DIR = 'Docs/qa/theme-0913'
const DESKTOP = { width: 1440, height: 960 }
const MOBILE = { width: 390, height: 844 }

test.skip(!process.env.THEME_SHOTS, 'review artefact — run with THEME_SHOTS=1')

/**
 * Force a screen phase through /dev/states, then walk back into the app.
 *
 * The controls are `role="radio"`, not buttons, and their accessible name is
 * the label PLUS its explanatory note ("Loading Every screen stays on its
 * skeleton state."), so this anchors on the label rather than matching exactly.
 */
async function forcePhase(page: import('@playwright/test').Page, label: string) {
  await page.goto('/dev/states')
  await page.getByRole('radio', { name: new RegExp('^' + label) }).click()
  await page.getByRole('link', { name: '← App' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
}

/**
 * Both viewports of one state, once the state is actually on screen.
 *
 * `marker` is re-asserted immediately before each capture. The assertion that
 * selected the state is not enough on its own: a lazily-loaded route can still
 * be swapping chunks when the shot is taken, and that produced two review
 * screenshots of a bare route spinner. Re-checking at the shutter means the
 * frame contains what the filename claims.
 */
async function shoot(
  page: import('@playwright/test').Page,
  name: string,
  marker: import('@playwright/test').Locator,
) {
  // The route chunk can still be settling when the marker first appears, which
  // put a bare route spinner into two review frames. Idle + a re-check is what
  // makes the shutter honest.
  await expect(marker).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(marker).toBeVisible()
  await page.screenshot({ path: `${DIR}/${name}-desktop.png`, fullPage: true })
  await page.setViewportSize(MOBILE)
  await expect(marker).toBeVisible()
  await page.screenshot({ path: `${DIR}/${name}-mobile.png`, fullPage: true })
  await page.setViewportSize(DESKTOP)
}

test('@shots Today in four states, desktop and mobile', async ({ page }) => {
  mkdirSync(DIR, { recursive: true })
  await page.setViewportSize(DESKTOP)

  // 1 — DEFAULT: a populated queue. Waits for a real draft card, not for the
  // skeleton to merely stop announcing itself.
  await activateDataset(page, 'Active org')
  await rail(page, 'Today').click()
  await page.waitForURL('**/today')
  await expect(
    page.getByRole('heading', { name: /drafts? ready for review|queue is clear/ }),
  ).toBeVisible()
  await shoot(page, 'today-1-default', page.getByRole('button', { name: 'Approve' }).first())

  // 2 — EMPTY: the fresh world, where Today has no slots at all. This is the
  // state ORDER THEME-0913 §5.1 rewrote, so it is the one to look at hardest.
  await activateDataset(page, 'Fresh org')
  await rail(page, 'Today').click()
  await page.waitForURL('**/today')
  // EmptyTitle is not a heading role — it is styled text inside the Empty
  // primitive — so this matches the words, not the role.
  await shoot(
    page,
    'today-2-empty',
    page.getByText(/brand voice first|drafts are on the way|when to post/),
  )

  // 3 — LOADING: the skeleton, held. Captured before the 10s long-wait line
  // appears, which is the ordinary case a reviewer sees.
  await forcePhase(page, 'Loading')
  await rail(page, 'Today').click()
  await page.waitForURL('**/today')
  // NOT a bare [aria-busy] — the route-level Suspense fallback carries that
  // too, so the shutter caught the chunk spinner instead of Today's skeleton.
  // SkeletonList names itself, and the name is what makes this the right frame.
  await shoot(page, 'today-3-loading', page.getByRole('status', { name: "Loading today's queue" }))

  // 4 — ERROR: the designed error surface, carrying the non-apologetic title
  // §5.5 gave it.
  await forcePhase(page, 'Error')
  await rail(page, 'Today').click()
  await page.waitForURL('**/today')
  await shoot(page, 'today-4-error', page.getByText("This didn't load"))
})
