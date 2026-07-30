/**
 * M1's cinematic layer: the scrub, the HUD clock, the pinned loop, the tone
 * morph, and the two fallbacks that must not be second-class — reduced motion
 * and a 360px viewport.
 *
 * Every test here also rides the fixture's zero-external-network assert, which
 * is load-bearing for this page in particular: it proves the film ships as
 * local static assets and nothing streams from anywhere.
 *
 * NAVIGATION RULE: switch to the visitor world through the shared helper, then
 * stay in-app. `page.goto` would rebuild the default (signed-in) dataset and
 * '/' would render the Dashboard instead of marketing.
 */
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const asVisitor = (page: Page) => activateDataset(page, 'Visitor (signed out)')

/** Wheel in steps until the predicate holds — Lenis animates real wheel input,
 * so a single monster delta would outrun its easing and prove nothing. */
async function wheelUntil(page: Page, predicate: () => Promise<boolean>, maxTicks = 40) {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (await predicate()) return
    await page.mouse.wheel(0, 1200)
    await page.waitForTimeout(120)
  }
  expect(await predicate(), 'condition not reached while scrolling').toBe(true)
}

test('the hero scrub sweeps the noise into the queue as you scroll', async ({ page }) => {
  await asVisitor(page)

  // The SPA navigation from /dev/datasets keeps its scroll offset (the app
  // has no ScrollRestoration, by design), so start the film from the top the
  // way a visitor arriving at '/' does.
  await page.evaluate(() => window.scrollTo(0, 0))

  // At rest: the canvas, the clock at 06:58:00, and the invitation to scroll.
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.getByText('06:58:00')).toBeVisible()
  await expect(page.getByText('Scroll to sweep the noise')).toBeVisible()

  // Scrolling advances the clock — the scrub is progress, not playback.
  await wheelUntil(page, async () => (await page.getByText(/06:5[89]:\d\d/).count()) === 0)

  // All the way: 07:00:00, the assembled queue, and the line that lands.
  await wheelUntil(page, async () => (await page.getByText('07:00:00').count()) > 0)
  await expect(page.getByText('Your drafts are ready.')).toBeVisible()

  // The canvas actually drew the assembled queue: the card region carries the
  // signal pink, which the empty void never does.
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return false
    const context = canvas.getContext('2d')
    if (!context) return false
    const sample = context.getImageData(
      Math.floor(canvas.width * 0.55),
      Math.floor(canvas.height * 0.3),
      Math.floor(canvas.width * 0.2),
      Math.floor(canvas.height * 0.2),
    ).data
    let hot = 0
    for (let index = 0; index < sample.length; index += 4) {
      if (sample[index] > 90) hot += 1
    }
    return hot > 40
  })
})

test('the loop pins and reveals its words progressively, never regressing', async ({ page }) => {
  await asVisitor(page)
  await page.evaluate(() => window.scrollTo(0, 0))

  const words = page.locator('#the-loop [data-shown]')
  await expect(words).toHaveCount(3)

  // Sample the shown-count while scrolling the pin through. Lenis eases real
  // wheel input, so a fixed mid-scroll assertion would race its momentum —
  // what must hold is the SHAPE: the count only ever rises, and ends at 3.
  const observed: number[] = []
  await wheelUntil(page, async () => {
    observed.push(await page.locator('#the-loop [data-shown="true"]').count())
    return observed[observed.length - 1] === 3
  }, 80)

  for (let index = 1; index < observed.length; index += 1) {
    expect(observed[index], 'a revealed word un-revealed').toBeGreaterThanOrEqual(
      observed[index - 1],
    )
  }
  // …and the caption followed the last word.
  await expect(page.getByText('on schedule, art included', { exact: false })).toBeVisible()
})

test('tone chips are the five real presets and morph the sample', async ({ page }) => {
  await asVisitor(page)

  const group = page.getByRole('group', { name: 'Tones' })
  for (const name of ['Provocative', 'Data-driven', 'Educational', 'Story', 'Direct-CTA']) {
    await expect(group.getByRole('button', { name })).toBeVisible()
  }

  await group.getByRole('button', { name: 'Data-driven' }).click()
  await expect(group.getByRole('button', { name: 'Data-driven' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText(/Roasted 48 hours before dispatch/)).toBeVisible()

  await group.getByRole('button', { name: 'Story' }).click()
  await expect(group.getByRole('button', { name: 'Story' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(group.getByRole('button', { name: 'Data-driven' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByText(/roaster clicks on at 6 a\.m\./)).toBeVisible()
})

test('pricing still renders the one plan source, restyled', async ({ page }) => {
  await asVisitor(page)

  await expect(page.getByRole('heading', { name: 'Simple, predictable pricing' })).toBeVisible()
  for (const plan of ['Free', 'Pro', 'Studio']) {
    await expect(page.getByRole('heading', { name: plan, exact: true })).toBeVisible()
  }
  await expect(page.getByText('Cancel anytime, no long-term contracts.')).toBeVisible()
})

test.describe('reduced motion', () => {
  test('the film is removed, not slowed: still frame, no canvas, no ambience', async ({
    page,
  }) => {
    // Emulated before the app renders; the layer's media-query hooks are
    // reactive besides, so the preference wins however it arrives.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await asVisitor(page)

    // The scrub never mounts; the finished frame stands in.
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator(`img[src="/marketing/hero-static.webp"]`)).toBeVisible()
    await expect(page.getByText('07:00:00')).toBeVisible()
    await expect(page.getByText('Your drafts are ready.')).toBeVisible()

    // The only <video> left is the product recording — paused, with controls.
    const videos = page.locator('video')
    await expect(videos).toHaveCount(1)
    await expect(videos).toHaveAttribute('controls', '')
    expect(await videos.getAttribute('autoplay')).toBeNull()

    // The marquee track is display:none (the data-ab-motion kill switch), and
    // the static names stand in its place.
    await expect(page.locator('[data-ab-motion="marquee"]')).toBeHidden()
    await expect(
      page.locator('section[aria-label="Customers"]').getByText('Atlas Roasters').last(),
    ).toBeVisible()

    // The loop stands whole with no pin to scroll through.
    await page.getByText('DRAFT.', { exact: true }).scrollIntoViewIfNeeded()
    for (const word of ['DRAFT.', 'APPROVE.', 'PUBLISH.']) {
      await expect(page.getByText(word, { exact: true })).toBeVisible()
    }
  })
})

test.describe('a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('the scrub falls back to a loop and nothing overflows', async ({ page }) => {
    await asVisitor(page)

    // Narrow viewport: the clip plays itself; no canvas, no 420vh pin.
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('video[src="/marketing/hero-loop.mp4"]')).toHaveCount(1)
    await expect(page.getByText('Your drafts are ready.')).toBeVisible()

    // The page never scrolls sideways — the cinematic collapses, it does not clip.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, 'horizontal overflow at 360px').toBeLessThanOrEqual(0)
  })
})
