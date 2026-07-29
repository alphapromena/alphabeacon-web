/**
 * Switching worlds in e2e, in one place.
 *
 * THE NAVIGATION RULE every spec here depends on: after switching datasets,
 * move only through in-app links. `page.goto` reloads the SPA, and a reload
 * rebuilds the DEFAULT dataset — correct app behaviour (nothing persists), but
 * it means a deep link silently lands in the wrong tenant. Switch, then walk.
 */
import { expect, type Page } from '@playwright/test'

/**
 * Activate a dataset by its label and return to the app.
 *
 * Handles the case that bit once already: the dataset may be active ALREADY,
 * in which case its card shows "Active" and has no button to press.
 */
export async function activateDataset(page: Page, label: string): Promise<void> {
  await page.goto('/dev/datasets')
  // Scoped to the card, not to any ancestor that happens to contain the text.
  const card = page.locator('[data-slot="card"]').filter({ hasText: label })
  await expect(card).toHaveCount(1)

  const activate = card.getByRole('button', { name: 'Activate' })
  if ((await activate.count()) > 0) await activate.click()

  await page.getByRole('link', { name: '← App' }).click()
}

/**
 * A rail link, scoped to the rail.
 *
 * Two traps it exists to avoid: Today's link carries its unread count in its
 * accessible name ("Today 5 drafts need review"), so `{ exact: true }` finds
 * nothing; and an unscoped prefix match also catches the dashboard's "Today's
 * queue" tile.
 */
export function rail(page: Page, label: string) {
  return page
    .locator('[data-sidebar="sidebar"]')
    .getByRole('link', { name: new RegExp(`^${label}`) })
    .first()
}

/** Dashboard → a rail destination, waiting for the screen to actually settle. */
export async function openFromRail(page: Page, label: string, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await rail(page, label).click()
  // The shell's h1 renders during the skeleton, so wait for content.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}
