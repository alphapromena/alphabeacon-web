/**
 * W4's verify: calendar, scheduling, event sources and connections.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links. `page.goto` reloads the SPA and rebuilds the DEFAULT
 * dataset, so a deep link would silently test the wrong tenant.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** Dashboard → a rail destination, the way a user gets there. */
async function open(page: Page, rail: string, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: rail, exact: true }).click()
  // The shell's h1 renders during the skeleton too, so it says nothing about
  // whether the screen's content has arrived. Wait for the busy state to clear.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

test('the calendar shows slots, events, and how published posts did', async ({ page }) => {
  await open(page, 'Calendar')
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible()

  // A published post carries its reach, and the legend explains the marks.
  await expect(page.getByText(/reach/).first()).toBeVisible()
  await expect(page.getByText('Needs review').first()).toBeVisible()

  // Month and week are both real views.
  await page.getByRole('radio', { name: 'Week' }).click()
  await expect(page.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
})

test('a post still waiting on analytics says Syncing, never a zero', async ({ page }) => {
  await open(page, 'Calendar', 'Connections need attention')

  // Hunt for the slot holding the published post rather than assuming which
  // chip it is — the calendar's layout is not the thing under test here.
  const chips = page.getByRole('button', { name: /:00/ })
  // `count()` does NOT auto-wait. Under parallel load the route's lazy chunk can
  // still be arriving here, and a `count()` of 0 would skip the loop and fail as
  // "no such slot" rather than waiting. Assert one chip is really on screen
  // first; that assertion retries, `count()` does not.
  await expect(chips.first()).toBeVisible()
  let found = false
  for (let index = 0; index < (await chips.count()); index += 1) {
    await chips.nth(index).click()
    const sheet = page.getByRole('dialog')
    if ((await sheet.getByText(/Syncing…/).count()) > 0) {
      found = true
      // The whole point: no fabricated zero anywhere in the performance section.
      await expect(sheet.getByText(/^0$/)).toHaveCount(0)
      await expect(sheet.getByRole('heading', { name: 'Performance' })).toBeVisible()
      break
    }
    await page.keyboard.press('Escape')
  }
  expect(found, 'expected a published post still awaiting its analytics').toBe(true)
})

test('skipping a slot is reversible today, and says so', async ({ page }) => {
  await open(page, 'Calendar')

  // A future slot with nothing drafted yet is the one that can be skipped.
  const chips = page.getByRole('button', { name: /:00/ })
  // Same reason as above: wait for the grid to be real before counting it.
  await expect(chips.first()).toBeVisible()
  const count = await chips.count()
  let opened = false
  for (let index = 0; index < count; index += 1) {
    await chips.nth(index).click()
    const sheet = page.getByRole('dialog')
    if ((await sheet.getByRole('button', { name: 'Skip this slot' }).count()) > 0) {
      opened = true
      break
    }
    await page.keyboard.press('Escape')
  }
  expect(opened, 'expected at least one skippable slot in the active world').toBe(true)

  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'Skip this slot' }).click()

  // The confirm names the consequence rather than asking "are you sure?".
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Nothing will be drafted or published at this time')
  await confirm.getByRole('button', { name: 'Skip slot' }).click()

  await expect(page.getByRole('dialog').getByRole('button', { name: 'Undo skip' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Undo skip' }).click()
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Skip this slot' }),
  ).toBeVisible()
})

test('schedule config refuses to lose unsaved changes', async ({ page }) => {
  await open(page, 'Calendar')
  await page.getByRole('link', { name: 'Schedule settings' }).click()
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()

  // Nothing is dirty yet, so no save bar is claiming otherwise.
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)

  // This world is already at the cap of 3, so the live control is the decrease.
  await page.getByRole('button', { name: 'One fewer post per day' }).click()
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()

  // Leaving with unsaved work is refused out loud, and the refusal is honest
  // about what would be lost.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  const guard = page.getByRole('dialog')
  await expect(guard).toContainText('Leave without saving?')
  await guard.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
})

test('the schedule reaches its event sources', async ({ page }) => {
  await open(page, 'Calendar')
  await page.getByRole('link', { name: 'Schedule settings' }).click()
  await page.getByRole('link', { name: 'Manage sources →' }).click()
  await expect(page.getByRole('heading', { name: 'Event sources', level: 1 })).toBeVisible()
})

test('connections show every status, and X stays coming soon', async ({ page }) => {
  await open(page, 'Connections', 'Connections need attention')
  await expect(page.getByRole('heading', { name: 'Connections', level: 1 })).toBeVisible()

  await expect(page.getByText('Revoked', { exact: true })).toBeVisible()
  await expect(page.getByText('Needs re-auth', { exact: true })).toBeVisible()
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  // Shown and explained, never hidden.
  await expect(page.getByText('Coming soon')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect' }).last()).toBeVisible()
})

test('the permission sheet lists scopes and names what disconnecting costs', async ({ page }) => {
  await open(page, 'Connections')

  await page.getByRole('button', { name: 'Manage' }).first().click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()

  await sheet.getByRole('button', { name: 'Granted scopes' }).click()
  await expect(sheet.getByText('pages_manage_posts')).toBeVisible()

  await sheet.getByRole('button', { name: 'Disconnect this account' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Scheduled posts for this channel will stop publishing')
})

test('a denied connect return is a choice, not an error', async ({ page }) => {
  await open(page, 'Connections')

  // B3 arrives by URL, the way a real callback would. Same document, so the
  // dataset survives — this is a client-side navigation, not a reload.
  await page.evaluate(() => {
    window.history.pushState({}, '', '/connections?connect=denied&platform=linkedin')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  await expect(page.getByRole('heading', { name: /did not grant access/i })).toBeVisible()
  await expect(page.getByText(/Nothing was changed/)).toBeVisible()
  await page.getByRole('button', { name: 'Back to connections' }).click()
  await expect(page.getByRole('heading', { name: 'Connections', level: 1 })).toBeVisible()
})

test('event sources keep their calendars when a token is lost', async ({ page }) => {
  await open(page, 'Calendar', 'Connections need attention')
  await page.getByRole('link', { name: 'Schedule settings' }).click()
  await page.getByRole('link', { name: 'Manage sources →' }).click()

  await expect(page.getByRole('heading', { name: 'Event sources', level: 1 })).toBeVisible()
  await expect(page.getByText('Needs re-auth')).toBeVisible()
  // The configuration survived the token.
  await expect(page.getByRole('checkbox', { name: 'Marketing' })).toBeChecked()

  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('Needs re-auth')).toHaveCount(0)
})

test('@axe calendar, connections and sources scan clean', async ({ page }) => {
  await open(page, 'Calendar')
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('link', { name: 'Connections', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Connections', level: 1 })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('a slot time names its zone, and never claims to be the audience', async ({ page }) => {
  await open(page, 'Calendar')

  // The zone is stated once for the grid, as an offset rather than "AST",
  // which means both Arabia and Atlantic Standard Time.
  await expect(page.getByText(/posting times in Asia\/Amman \(GMT\+3\)/)).toBeVisible()

  await page.getByRole('button', { name: /:00/ }).first().click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()

  // The sheet says posting time, and the false claim is gone for good.
  await expect(sheet.getByText(/Posting time, in Asia\/Amman/)).toBeVisible()
  await expect(sheet.getByText(/audience sees/i)).toHaveCount(0)
})
