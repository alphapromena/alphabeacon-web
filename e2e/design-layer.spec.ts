import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

const KITCHEN_SINK = '/dev/kitchen-sink'

// Signature motion opts in through this attribute and globals.css removes it
// wholesale under prefers-reduced-motion. Sweeping the attribute rather than
// one known dot is the point: a new animation cannot quietly skip the promise.
const MOTION_SELECTOR = '[data-ab-motion]'

// Deep enough to leave the rail, cross the top bar, and land in main; short
// enough that a focus trap fails fast instead of hanging the run.
const MAX_TAB_PRESSES = 25

// Rail order per screens4.md §0.4. Names only — the shell is being rebuilt on
// the shadcn sidebar, and a walk that knew its markup would break with it.
const RAIL_LINKS: readonly string[] = [
  'Dashboard',
  'Today',
  'Calendar',
  'Studio',
  'Analytics',
  'Connections',
  'Billing',
  'Settings',
]

// The kitchen-sink demo form is written in parallel with this spec, so these
// two constants are the contract it has to honour: the submit label, and the
// catalogue sentence (MESSAGES.errors.toneRequired) its zod schema quotes. The
// copy is spelled out rather than imported because e2e/ compiles under
// tsconfig.node.json, which carries no '@/' alias — smoke.spec.ts does the same.
const FORM_SUBMIT_LABEL = 'Save schedule'
const FORM_VALIDATION_MESSAGE = 'Pick a timezone so posts go out at the right local time.'

/** Every element currently opted into signature motion, by computed animation. */
async function motionAnimationNames(page: Page): Promise<string[]> {
  return page.evaluate(
    (selector) =>
      Array.from(document.querySelectorAll(selector)).map(
        (element) => getComputedStyle(element).animationName,
      ),
    MOTION_SELECTOR,
  )
}

type FocusStop = {
  /** Identity for spotting a trap: the same key answering press after press. */
  key: string
  tag: string
  label: string
  href: string | null
  inMain: boolean
  hasFocusIndicator: boolean
}

/**
 * Describes wherever the keyboard currently is, or null once focus has left the
 * document — Chromium parks on <body> after the last tab stop, which is the
 * walk ending rather than a failure.
 */
async function readFocusStop(page: Page): Promise<FocusStop | null> {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body || element === document.documentElement) return null

    const style = getComputedStyle(element)
    const label = (
      element.getAttribute('aria-label') ||
      element.textContent ||
      element.getAttribute('title') ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim()
    const href = element.getAttribute('href')
    const tag = element.tagName.toLowerCase()

    return {
      key: `${tag}|${element.getAttribute('role') ?? ''}|${label}|${href ?? ''}`,
      tag,
      label,
      href,
      inMain: element.closest('main') !== null,
      // Focus may be restyled but never erased: an outline or a ring (which
      // Tailwind renders as a box-shadow) has to survive.
      hasFocusIndicator: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
    }
  })
}

test('kitchen sink is clean in light and dark', { tag: '@axe' }, async ({ page }) => {
  await page.goto(KITCHEN_SINK)

  const toDark = page.getByRole('button', { name: 'Switch to dark theme' })
  await expect(toDark).toBeVisible()

  const lightScan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(lightScan.violations).toEqual([])

  await toDark.click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

  const darkScan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(darkScan.violations).toEqual([])
})

test(
  'reduced motion removes every signature animation',
  { tag: '@reduced-motion' },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(KITCHEN_SINK)
    await expect(page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeVisible()

    const reduced = await motionAnimationNames(page)
    // Without this the sweep below would pass on a page that animates nothing —
    // a green test proving only that the selector matched nobody.
    expect(
      reduced.length,
      `${KITCHEN_SINK} renders no ${MOTION_SELECTOR} element — this test would assert nothing`,
    ).toBeGreaterThan(0)
    expect(
      reduced.filter((name) => name !== 'none'),
      'signature motion must be removed under prefers-reduced-motion, not slowed',
    ).toEqual([])

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.reload()
    await expect(page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeVisible()

    // The same page with motion allowed must animate, which is what proves the
    // assertion above measured a live selector rather than an inert one.
    await expect
      .poll(async () => (await motionAnimationNames(page)).filter((name) => name !== 'none'), {
        message: `${MOTION_SELECTOR} elements must animate when motion is allowed`,
      })
      .not.toEqual([])
  },
)

test('form surfaces the named validation message from the schema', async ({ page }) => {
  await page.goto(KITCHEN_SINK)

  await page.getByRole('button', { name: FORM_SUBMIT_LABEL }).click()

  // Announced, not merely drawn: FieldError carries role="alert".
  const alert = page.getByRole('alert').filter({ hasText: FORM_VALIDATION_MESSAGE })
  await expect(alert).toBeVisible()

  const invalidControl = page.locator('[aria-invalid="true"]').first()
  await expect(invalidControl).toHaveAttribute('aria-invalid', 'true')

  // The control must point at the message, so the sentence a screen reader
  // announces is the same designed sentence on screen.
  const describedBy = await invalidControl.evaluate((element) => {
    const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
    return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
  })
  expect(describedBy).toContain(FORM_VALIDATION_MESSAGE)
})

test('keyboard-only walk of the app shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()

  const stops: FocusStop[] = []
  for (let press = 1; press <= MAX_TAB_PRESSES; press += 1) {
    await page.keyboard.press('Tab')
    const stop = await readFocusStop(page)
    if (!stop) break
    stops.push(stop)

    const where = `tab stop ${press} (<${stop.tag}> "${stop.label}")`
    await expect(
      page.locator(':focus'),
      `${where} must expose an accessible name`,
    ).toHaveAccessibleName(/\S/)
    expect(stop.hasFocusIndicator, `${where} must keep a visible focus indicator`).toBe(true)
  }

  expect(stops.length, 'the shell must offer keyboard stops').toBeGreaterThan(4)

  // A trap reads as the same element answering three presses in a row.
  for (let index = 2; index < stops.length; index += 1) {
    const trio = stops.slice(index - 2, index + 1)
    expect(
      new Set(trio.map((stop) => stop.key)).size,
      `focus is trapped on "${trio[2].label}" — three presses, one element`,
    ).toBeGreaterThan(1)
  }

  expect(
    new Set(stops.map((stop) => stop.key)).size,
    'the walk must keep reaching new elements',
  ).toBeGreaterThan(4)
  expect(
    stops.some((stop) => stop.inMain),
    'the walk must reach the main content, not circle the chrome',
  ).toBe(true)

  // Enter has to activate what Tab reached. Dashboard is skipped: it points at
  // the page we start on, so following it would prove nothing.
  await page.goto('/')
  // Wait for the shell to render before tabbing: on a freshly navigated page
  // the first Tab lands on <body>, which reads as "the walk ended" and would
  // end this loop before it ever reached the rail.
  await expect(page.getByRole('banner')).toBeVisible()
  let railHref = ''
  let railLabel = ''
  for (let press = 1; press <= MAX_TAB_PRESSES; press += 1) {
    await page.keyboard.press('Tab')
    const stop = await readFocusStop(page)
    if (!stop) break
    // Matched by name and destination, never by markup: the rail is mid-rewrite
    // onto the shadcn sidebar, which wraps its menu in divs and a <ul>.
    const isRailLink =
      stop.tag === 'a' &&
      stop.href !== null &&
      stop.href.startsWith('/') &&
      stop.href !== '/' &&
      RAIL_LINKS.some((name) => stop.label.startsWith(name))
    if (isRailLink && stop.href) {
      railHref = stop.href
      railLabel = stop.label
      break
    }
  }
  expect(
    railHref,
    `a rail link (${RAIL_LINKS.join(', ')}) must be reachable with Tab alone`,
  ).not.toBe('')

  await page.keyboard.press('Enter')
  await expect
    .poll(() => new URL(page.url()).pathname, {
      message: `Enter on the focused rail link "${railLabel}" must navigate to ${railHref}`,
    })
    .toBe(railHref)
  await expect(page.getByRole('main')).toBeVisible()
})
