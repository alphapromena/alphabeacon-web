/**
 * TEST-0915 · Phase 4.4 — the fresh screenshot set: Login, Today, Settings,
 * Studio, Billing, desktop and mobile, on the STATIC dev server's seeded
 * review world (the theme-shots pattern: every frame waits for its own
 * content, never for a generic readiness signal).
 *
 * Usage: pnpm exec tsx Docs/qa/test-0915/screens/shots.ts --base <static dev server> --out Docs/qa/test-0915/screens
 */
import { mkdirSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'

const args = process.argv.slice(2)
const arg = (name: string): string => {
  const i = args.indexOf(`--${name}`)
  const v = i >= 0 ? args[i + 1] : undefined
  if (v === undefined) throw new Error(`missing --${name}`)
  return v
}
const BASE = arg('base').replace(/\/+$/, '')
const OUT = arg('out')
const DESKTOP = { width: 1440, height: 960 }
const MOBILE = { width: 390, height: 844 }

async function go(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

async function shoot(page: Page, name: string, marker: string) {
  await page.getByText(marker).first().waitFor({ timeout: 30_000 })
  await page.waitForTimeout(400)
  await page.setViewportSize(DESKTOP)
  await page.screenshot({ path: `${OUT}/${name}-desktop.png`, fullPage: true })
  await page.setViewportSize(MOBILE)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/${name}-mobile.png`, fullPage: true })
  await page.setViewportSize(DESKTOP)
  console.log(`shot ${name}`)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: DESKTOP })

  await page.goto(`${BASE}/dev/datasets`, { waitUntil: 'domcontentloaded' })
  const visitor = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Visitor (signed out)' })
    .getByRole('button', { name: 'Activate' })
  await visitor.waitFor({ state: 'visible', timeout: 60_000 })
  await visitor.click()
  await page.waitForTimeout(400)

  await go(page, '/login')
  await shoot(page, '1-login', 'Work email')

  const stamp = Date.now()
  await go(page, '/signup')
  await page.getByLabel('Full name').fill('Dana Saif')
  await page.getByLabel('Work email').fill(`qa+${stamp}shots@alphapromena.com`)
  await page.getByLabel('Password', { exact: true }).fill('Shots-Test-0915!')
  await page.getByLabel('Organization name').fill('Nova Skincare')
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: /I've verified my email/ }).click()
  const overlay = page.locator('[data-slot="first-light"]')
  await overlay.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
  await overlay.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 15_000 })

  const screens: { rail: RegExp; name: string; marker: string }[] = [
    { rail: /^Today/, name: '2-today', marker: 'ready for review' },
    { rail: /^Settings/, name: '3-settings', marker: 'Brand setup' },
    { rail: /^Studio/, name: '4-studio', marker: 'Your renders' },
    { rail: /^Billing/, name: '5-billing', marker: 'Malaky Business' },
  ]
  for (const s of screens) {
    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: s.rail })
      .first()
      .click()
    await shoot(page, s.name, s.marker)
  }
  await browser.close()
}

void main()
