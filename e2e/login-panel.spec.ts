/**
 * The login screen's right panel and form (NIGHT-0916 order 6; licensed by
 * D-NIGHT-0916-F) — static mode, the shipped markup on the dev server.
 *
 *   - the beacon at rest: static gold rings, one accent core always present,
 *     one breathing layer on the ambient period;
 *   - under prefers-reduced-motion the breathing layer does not exist (the
 *     \`data-ab-motion\` collapse) and the rings and core stand still;
 *   - axe clean with the panel at rest and mid-breath, on both halves;
 *   - the auth page wears no app frame;
 *   - one accent element in the form: Sign in. The panel's full stop is the
 *     website's idiom (D-THEME-0913-C) and the core is the beacon's own
 *     (D-NIGHT-0916-F) — neither is a control;
 *   - the checkbox sits beside its label; the button's radius is the inputs'.
 */
import AxeBuilder from '@axe-core/playwright'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']
const ACCENT = 'rgb(255, 78, 45)'

test.use({ viewport: { width: 1440, height: 900 } })

test('the panel: rings, an accent core, one breathing layer on the ambient period; axe clean at rest and mid-breath', async ({
  page,
}) => {
  await activateDataset(page, 'Visitor (signed out)')
  // Through the site's own link: a reload would rebuild the default dataset.
  await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible()

  const beacon = page.locator('[data-slot="ambient-beacon"]')
  await expect(beacon).toHaveCount(1)
  // No app frame on an auth page.
  await expect(page.getByRole('navigation', { name: 'Workspace' })).toHaveCount(0)

  const figure = await beacon.evaluate((el, accent) => {
    const rings = Array.from(el.querySelectorAll('span'))
    const core = rings.find((s) => getComputedStyle(s).backgroundColor === accent)
    const breathing = el.querySelector('[data-ab-motion="ambient-beacon"]')
    return {
      staticRings: rings.filter(
        (s) => !s.hasAttribute('data-ab-motion') && getComputedStyle(s).borderTopStyle === 'solid',
      ).length,
      core: Boolean(core),
      breathing: breathing
        ? {
            animation: getComputedStyle(breathing).animationName,
            duration: getComputedStyle(breathing).animationDuration,
            display: getComputedStyle(breathing).display,
          }
        : null,
      ringOpacities: rings
        .filter((s) => !s.hasAttribute('data-ab-motion') && s !== core)
        .map((s) => Number(getComputedStyle(s).opacity)),
    }
  }, ACCENT)
  expect(figure.staticRings).toBeGreaterThanOrEqual(3)
  expect(figure.core).toBe(true)
  expect(figure.breathing).toEqual({
    animation: 'ab-ambient-breathe',
    duration: '20s',
    display: 'block',
  })
  for (const opacity of figure.ringOpacities) {
    expect(opacity).toBeGreaterThanOrEqual(0.07)
    expect(opacity).toBeLessThanOrEqual(0.2)
  }

  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
  // Mid-breath: a few seconds in, the layer is part-way through its period.
  await page.waitForTimeout(3_000)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('the form: one accent element (Sign in), the checkbox beside its label, the button on the inputs’ radius', async ({
  page,
}) => {
  await activateDataset(page, 'Visitor (signed out)')
  // Through the site's own link: a reload would rebuild the default dataset.
  await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible()

  const form = page.locator('form')
  const accented = await form.evaluate((el, accent) => {
    return Array.from(el.querySelectorAll('*'))
      .filter((n) => {
        const cs = getComputedStyle(n)
        const r = n.getBoundingClientRect()
        return (
          r.width > 0 &&
          r.height > 0 &&
          [cs.color, cs.backgroundColor, cs.borderTopColor].includes(accent)
        )
      })
      .map((n) => `${n.tagName.toLowerCase()} ${(n.textContent ?? '').trim().slice(0, 20)}`)
  }, ACCENT)
  expect(accented).toEqual(['button Sign in'])

  const checkbox = page.getByRole('checkbox', { name: 'Keep me signed in on this device' })
  const label = page.getByText('Keep me signed in on this device')
  const [box, text] = await Promise.all([checkbox.boundingBox(), label.boundingBox()])
  expect(box && text && box.x + box.width <= text.x + 16).toBe(true)
  expect(box && text && Math.abs(box.y + box.height / 2 - (text.y + text.height / 2)) <= 4).toBe(
    true,
  )

  const radii = await page.evaluate(() => ({
    button: getComputedStyle(
      Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Sign in',
      )!,
    ).borderRadius,
    input: getComputedStyle(document.querySelector('input[type="email"]')!).borderRadius,
  }))
  expect(radii.button).toBe('8px')
  expect(radii.input).toBe('8px')
})

test.describe('under prefers-reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('the breathing layer does not exist; the rings and the core stand still; axe clean', async ({
    page,
  }) => {
    await activateDataset(page, 'Visitor (signed out)')
    await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible()
    const beacon = page.locator('[data-slot="ambient-beacon"]')
    await expect(beacon).toHaveCount(1)
    const state = await beacon.evaluate((el, accent) => {
      const breathing = el.querySelector('[data-ab-motion="ambient-beacon"]') as HTMLElement
      const spans = Array.from(el.querySelectorAll('span')).filter((s) => s !== breathing)
      return {
        breathingDisplay: getComputedStyle(breathing).display,
        breathingAnimation: getComputedStyle(breathing).animationName,
        still: spans.every((s) => getComputedStyle(s).animationName === 'none'),
        core: spans.some((s) => getComputedStyle(s).backgroundColor === accent),
      }
    }, ACCENT)
    expect(state.breathingDisplay).toBe('none')
    expect(state.breathingAnimation).toBe('none')
    expect(state.still).toBe(true)
    expect(state.core).toBe(true)
    expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
  })
})
