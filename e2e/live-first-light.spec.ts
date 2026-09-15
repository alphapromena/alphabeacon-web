/**
 * First light under the ceiling, LIVE (NIGHT-0916 order 4, item 82;
 * D-NIGHT-0916-D) — against the deployed dev API on one fresh QA org, zero
 * spend.
 *
 * The moment is measured the way it is seen: from the overlay's FIRST PAINT
 * (two animation frames after it enters the DOM) to the moment it leaves the
 * screen (hidden, or removed — whichever comes first), in page time. The
 * ceiling is 2000 ms. TEST-0915-2 measured 2196–2287 ms mount → removal on
 * three fresh accounts, and this order's probe 2587 ms paint → removal, with
 * the dismissal's re-render queued behind the workspace sync's; the overlay
 * now runs its clock from first paint and hides itself at the clock's end
 * before it tells the app. It plays once: a reload never shows it again.
 */
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { runStamp, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = runStamp()

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}fl@alphapromena.com`
const CEILING_MS = 2_000

interface FirstLightWatch {
  mountAt: number
  paintAt: number
  goneAt: number
}

const WATCH = `
  (() => {
    const T = { mountAt: -1, paintAt: -1, goneAt: -1 };
    window.__fl = T;
    const check = () => {
      const el = document.querySelector('[data-slot="first-light"]');
      if (el && T.mountAt < 0) {
        T.mountAt = performance.now();
        requestAnimationFrame(() => requestAnimationFrame(() => { T.paintAt = performance.now(); }));
      }
      if (T.mountAt >= 0 && T.goneAt < 0 && (!el || el.hidden)) T.goneAt = performance.now();
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  })()
`

test('first light plays once on a fresh account, under the 2000 ms ceiling from its first paint, and never on a reload', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await page.addInitScript({ content: WATCH })
  await signUpAndEnter(page, {
    name: 'QA First Light',
    email: owner,
    password: PASSWORD,
    orgName: `QA First Light Org ${RUN}`,
  })
  const overlay = page.locator('[data-slot="first-light"]')
  // Seen, then gone: hidden by its own hand at the clock's end, then unmounted.
  await expect
    .poll(
      () => page.evaluate(() => (window as unknown as { __fl: FirstLightWatch }).__fl.mountAt),
      {
        timeout: SCREEN_SYNC,
      },
    )
    .toBeGreaterThan(0)
  await expect(overlay).toHaveCount(0, { timeout: SCREEN_SYNC })
  const watch = (await page.evaluate('window.__fl')) as FirstLightWatch
  const seen = Math.round(watch.goneAt - watch.paintAt)
  console.log(
    `[item 82] first light: mount ${Math.round(watch.mountAt)}, paint ${Math.round(watch.paintAt)}, gone ${Math.round(watch.goneAt)} → seen for ${seen} ms`,
  )
  expect(watch.paintAt, 'the overlay painted').toBeGreaterThan(0)
  expect(watch.goneAt, 'the overlay left the screen').toBeGreaterThan(watch.paintAt)
  expect(seen, 'paint → gone, under the ceiling').toBeLessThan(CEILING_MS)
  // The app underneath is the app: the Dashboard, no overlay.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  // Once per account: a reload of the same account never plays it again.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await page.waitForTimeout(2_500)
  const again = (await page.evaluate('window.__fl')) as FirstLightWatch
  expect(again.mountAt, 'no first light on a reload').toBe(-1)
})
