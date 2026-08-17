/**
 * The six focus bugs the manual keyboard pass found — every one of them on
 * screens axe reports as clean.
 *
 * That is the point of this file. axe checks that names, roles and contrast
 * exist in the markup; it does not tab through a screen, so it cannot see focus
 * land on `document.body`, cannot see a focused control sitting underneath a
 * fixed bar, and cannot see a tab stop that renders nothing. Each test below
 * fails on the behaviour a human reported, not on a proxy for it.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links.
 */
import type { Page } from '@playwright/test'
import { openFromRail } from './datasets'
import { expect, test } from './fixtures'

/** What actually has focus, described well enough to read in a failure. */
async function focusDescriptor(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return 'BODY'
    const name =
      el.getAttribute('aria-label') ??
      el.getAttribute('id') ??
      (el.textContent ?? '').trim().slice(0, 40)
    return `${el.tagName.toLowerCase()}[${el.getAttribute('role') ?? '-'}] ${name}`
  })
}

async function openSettings(page: Page) {
  await openFromRail(page, 'Settings')
  await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible()
}

// ---------------------------------------------------------------------------
// 1 — focus survives a section change, and the guard gives it back
// ---------------------------------------------------------------------------

test('changing settings section keeps focus on the tab, never on the body', async ({ page }) => {
  await openSettings(page)

  const brandVoice = page.getByRole('tab', { name: 'Brand voice' })
  await brandVoice.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Brand voice', level: 1 })).toBeVisible()

  // The regression: the whole nav used to unmount, taking the focused tab with
  // it and dropping focus to the document.
  expect(await focusDescriptor(page)).not.toBe('BODY')
  await expect(brandVoice).toBeFocused()

  // And again on a second hop, because the first one is the easy case.
  const team = page.getByRole('tab', { name: 'Team' })
  await team.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Team', level: 1 })).toBeVisible()
  expect(await focusDescriptor(page)).not.toBe('BODY')
  await expect(team).toBeFocused()
})

test('dismissing the unsaved-changes guard returns focus to the field you were in', async ({
  page,
}) => {
  await openSettings(page)

  const cta = page.getByLabel('Standard call to action')
  await cta.fill('Order the Tuesday roast')
  await cta.focus()
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()

  await page.getByRole('tab', { name: 'Team' }).click()
  await expect(page.getByRole('heading', { name: 'Leave without saving?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep editing' }).click()

  // This dialog has no trigger, so Radix has nothing to restore to and used to
  // drop focus on the body.
  expect(await focusDescriptor(page)).not.toBe('BODY')
  await expect(cta).toBeFocused()
})

// ---------------------------------------------------------------------------
// 2 — the save bar must not cover the control you just focused (WCAG 2.2)
// ---------------------------------------------------------------------------

test('the save bar never covers the focused field', async ({ page }) => {
  await openSettings(page)

  await page.getByLabel('Organization name').fill('Atlas Roasters HQ')
  const bar = page.getByText('You have unsaved changes.')
  await expect(bar).toBeVisible()

  // The last control above the bar is the one at risk.
  const timezone = page.getByLabel('Timezone')
  await timezone.focus()

  const field = await timezone.boundingBox()
  const saveBar = await page.locator('[data-slot="save-bar"]').boundingBox()
  expect(field, 'focused field should have a box').not.toBeNull()
  expect(saveBar, 'save bar should have a box').not.toBeNull()
  if (!field || !saveBar) return

  expect(
    field.y + field.height,
    `focused field bottom (${field.y + field.height}) must clear the save bar top (${saveBar.y})`,
  ).toBeLessThanOrEqual(saveBar.y)
})

// ---------------------------------------------------------------------------
// 3 — hidden file inputs must not hold a tab stop
// ---------------------------------------------------------------------------

test('the upload inputs are not tab stops, so focus never vanishes', async ({ page }) => {
  await openSettings(page)
  await expect(page.locator('input[type="file"]')).toHaveAttribute('tabindex', '-1')

  await page.getByRole('tab', { name: 'Knowledge' }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible()
  await expect(page.locator('input[type="file"]')).toHaveAttribute('tabindex', '-1')

  // Tabbing off the visible affordance must reach something visible, not the
  // invisible input behind it.
  await page.getByRole('button', { name: 'Browse files' }).focus()
  await page.keyboard.press('Tab')
  const landed = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el) return 'none'
    return el.getAttribute('type') === 'file' ? 'FILE INPUT' : 'visible control'
  })
  expect(landed).toBe('visible control')
})

// ---------------------------------------------------------------------------
// 4 — the sections are a real tablist
// ---------------------------------------------------------------------------

test('the settings sections are one tab stop, with arrow keys between them', async ({ page }) => {
  await openSettings(page)

  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(6)

  // Roving tabindex: exactly one tab is in the document's tab order.
  const tabbable = await page.locator('[role="tab"][tabindex="0"]').count()
  expect(tabbable, 'exactly one tab may hold the tab stop').toBe(1)

  await page.getByRole('tab', { name: 'Organization' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Brand voice' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Tones' })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'Brand voice' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Team' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(page.getByRole('tab', { name: 'Organization' })).toBeFocused()

  // Manual activation: arrowing moved focus but must NOT have navigated.
  await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible()

  // Enter follows the tab you are standing on.
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Brand voice', level: 1 })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Brand voice' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

// ---------------------------------------------------------------------------
// 5 — the focus ring is not clipped, and adding a rule moves focus into it
// ---------------------------------------------------------------------------

test('an inactive tab renders its focus ring unclipped', async ({ page }) => {
  await openSettings(page)

  const tab = page.getByRole('tab', { name: 'Tones' })
  await tab.focus()

  // The scroll container clipped the ring vertically; it needs room above and
  // below the tab for the 2px ring to render whole.
  const clearance = await tab.evaluate((el) => {
    const scroller = el.closest('nav')
    if (!scroller) return null
    const t = el.getBoundingClientRect()
    const s = scroller.getBoundingClientRect()
    return { top: Math.round(t.top - s.top), bottom: Math.round(s.bottom - t.bottom) }
  })
  expect(clearance, 'tab should sit inside a scroller').not.toBeNull()
  if (!clearance) return
  expect(clearance.top, 'room above the tab for its focus ring').toBeGreaterThanOrEqual(2)
  expect(clearance.bottom, 'room below the tab for its focus ring').toBeGreaterThanOrEqual(2)
})

test('adding a brand-voice rule puts the cursor in the new row', async ({ page }) => {
  await openSettings(page)
  await page.getByRole('tab', { name: 'Brand voice' }).click()
  await expect(page.getByRole('heading', { name: 'Brand voice', level: 1 })).toBeVisible()

  // The h1 renders DURING the loading skeleton, so it is not a readiness signal
  // (state.md trap 2). Counting before the rows land read `before` as 0, and the
  // assertion below then compared 1 against the dataset's three rules plus the
  // new one — this test flaked for exactly that reason.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

  const before = await page.getByRole('textbox', { name: /^Do rule/ }).count()
  await page.getByRole('button', { name: 'Add do', exact: true }).click()

  const rows = page.getByRole('textbox', { name: /^Do rule/ })
  await expect(rows).toHaveCount(before + 1)
  // The row you asked for is the row you are standing in.
  await expect(rows.nth(before)).toBeFocused()
  await page.keyboard.type('Say what we changed')
  await expect(rows.nth(before)).toHaveValue('Say what we changed')
})
