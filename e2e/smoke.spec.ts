import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const STAT_LABELS = [
  'Drafts awaiting review',
  'Scheduled this week',
  'Credits balance',
  'Connections needing attention',
] as const

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

async function expectDashboardStats(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  for (const label of STAT_LABELS) {
    await expect(page.getByText(label)).toBeVisible()
  }
}

// After switching dataset or state on a dev page, return to the app via the
// in-app '← App' link: client-side routing keeps provider state, while a
// page.goto() would remount the providers and reset the switch.
function appLink(page: Page) {
  return page.getByRole('link', { name: '← App' })
}

test('boots on the seeded dashboard in both themes', async ({ page }) => {
  await page.goto('/')
  await expectDashboardStats(page)

  const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(fontFamily).toContain('Geist Variable')

  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
})

test('dataset switcher swaps the world in-session', async ({ page }) => {
  await page.goto('/dev/datasets')

  // Innermost container holding both the 'Fresh org' title and an Activate
  // button — i.e. the Fresh org card, however the markup nests it.
  const freshCard = page
    .locator('*')
    .filter({ hasText: 'Fresh org' })
    .filter({ has: page.getByRole('button', { name: 'Activate' }) })
    .last()
  await freshCard.getByRole('button', { name: 'Activate' }).click()

  await appLink(page).click()
  await expect(page.getByText('finish setting up your workspace')).toBeVisible()
})

test('state switcher forces loading and error presentations', async ({ page }) => {
  await page.goto('/dev/states')
  await page.getByRole('radio', { name: 'Error' }).click()
  await appLink(page).click()

  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/We couldn['’]t load this screen\./)

  await page.getByRole('button', { name: 'Try again' }).click()
  await expectDashboardStats(page)

  await page.goBack()
  await page.getByRole('radio', { name: 'Loading' }).click()
  await appLink(page).click()

  // The forced skeleton must be present as soon as the dashboard mounts —
  // assert immediately with a short window rather than a fixed sleep.
  await expect(page.getByLabel('Loading dashboard')).toBeVisible({ timeout: 2000 })
  await expect(page.getByText(STAT_LABELS[0])).toHaveCount(0)
})

test('reduced motion removes the beacon pulse', { tag: '@reduced-motion' }, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expectDashboardStats(page)

  const railDot = page.getByLabel(/drafts awaiting review/i)
  await expect(railDot).toBeVisible()
  const animationName = await railDot.evaluate((el) => getComputedStyle(el).animationName)
  expect(animationName).toBe('none')
})

test('dashboard and dev pages scan clean', { tag: '@axe' }, async ({ page }) => {
  await page.goto('/')
  await expectDashboardStats(page)
  const dashboardScan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(dashboardScan.violations).toEqual([])

  await page.goto('/dev/datasets')
  await expect(appLink(page)).toBeVisible()
  const devScan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(devScan.violations).toEqual([])
})

// Marketing routes are not built yet — unskip and scan them when they land.
test.skip('marketing pages scan clean', { tag: '@axe' }, async () => {})
