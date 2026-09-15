/**
 * The shell mounts once (ORDER-SHELL-0915, item 77).
 *
 * TEST-0915 proof G sampled Dashboard → Today at 8 ms and found the rail's
 * gold indicator re-created at the new row — every screen mounted its own
 * `AppShell`, so the rail, and the one indicator in it, died with the screen.
 * The frame is a layout route now and the screens render into its outlet, so
 * the indicator tagged here on the Dashboard is the SAME DOM node on Today,
 * Billing, Calendar and Settings, with one frame, one `main` and one
 * indicator at every stop. Under reduced motion too: the construction is the
 * same, only the travel collapses to its end state.
 *
 * Proven by breaking: a second frame around any screen makes two `main`s and
 * two indicators, and this walk goes red at that stop.
 */
import type { Page } from '@playwright/test'
import { activateDataset, rail } from './datasets'
import { expect, test } from './fixtures'

const TAG = 'data-shell-0915'

interface Identity {
  indicators: number
  tagged: boolean
  mains: number
  sameRail: boolean
  sameMain: boolean
  h1: string
}

/** Tag the indicator and remember the rail and the main by reference. */
async function tagShell(page: Page) {
  await page.evaluate((tag) => {
    const indicator = document.querySelector('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
    if (!indicator) throw new Error('no indicator to tag')
    indicator.setAttribute(tag, 'tagged')
    const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
    w.__shell = {
      rail: document.querySelector('[data-sidebar="sidebar"]'),
      main: document.querySelector('main'),
    }
  }, TAG)
}

async function readShell(page: Page): Promise<Identity> {
  return page.evaluate((tag) => {
    const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
    return {
      // The rail's — Settings mounts a second indicator of its own under its
      // tablist (D-MOTION-0914-C), which is not this walk's subject.
      indicators: document.querySelectorAll('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
        .length,
      tagged:
        document.querySelector(
          `[data-sidebar="sidebar"] [data-slot="nav-indicator"][${tag}="tagged"]`,
        ) !== null,
      mains: document.querySelectorAll('main').length,
      sameRail: w.__shell.rail === document.querySelector('[data-sidebar="sidebar"]'),
      sameMain: w.__shell.main === document.querySelector('main'),
      h1: document.querySelector('h1')?.textContent ?? '',
    }
  }, TAG)
}

const SAME: Partial<Identity> = {
  indicators: 1,
  tagged: true,
  mains: 1,
  sameRail: true,
  sameMain: true,
}

const WALK = [
  { rail: 'Today', heading: 'Today' },
  { rail: 'Billing', heading: 'Billing' },
  { rail: 'Calendar', heading: 'Calendar' },
  { rail: 'Settings', heading: 'Organization' },
]

async function walk(page: Page) {
  await activateDataset(page, 'Active org')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  // Tagged on the Dashboard, so Dashboard → Today — the measured re-mount —
  // is the first hop asserted.
  await tagShell(page)
  for (const stop of WALK) {
    await rail(page, stop.rail).click()
    await expect(page.getByRole('heading', { name: stop.heading, level: 1 })).toBeVisible()
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    const identity = await readShell(page)
    expect(identity, `${stop.rail}: ${JSON.stringify(identity)}`).toMatchObject(SAME)
  }
}

test('the rail, its indicator and the main are the same nodes from the Dashboard through Today, Billing, Calendar and Settings', async ({
  page,
}) => {
  await walk(page)
})

test.describe('under reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('the same walk keeps the same nodes', async ({ page }) => {
    await walk(page)
  })
})
