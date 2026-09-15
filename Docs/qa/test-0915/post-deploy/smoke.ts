/**
 * TEST-0915 · Phase 5.6 — the post-deploy smoke on production (2.malaky.ai), in
 * a real browser. On disk only, never committed (a docs commit would redeploy).
 *
 * Login renders the theme · a fresh qa+<timestamp>@alphapromena.com signs up
 * with code 000000 · first light plays once · Dashboard, Today, Studio,
 * Settings, Billing load with no console errors · one 401 path lands on login.
 *
 * Usage: pnpm exec tsx Docs/qa/test-0915/post-deploy/smoke.ts --base https://2.malaky.ai --out Docs/qa/test-0915/post-deploy
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const arg = (name: string, fallback?: string): string => {
  const i = args.indexOf(`--${name}`)
  const v = i >= 0 ? args[i + 1] : undefined
  if (v === undefined) {
    if (fallback === undefined) throw new Error(`missing --${name}`)
    return fallback
  }
  return v
}
const BASE = arg('base').replace(/\/+$/, '')
const OUT = arg('out')
const rows: string[] = []
const say = (line: string) => {
  rows.push(line)
  console.log(line)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200))
  })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`))

  const stamp = Date.now()
  const email = `qa+${stamp}@alphapromena.com`
  const password = 'Roasted2Order!'

  // 1 — login renders the theme.
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Sign in' }).waitFor({ timeout: 30_000 })
  const theme = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      htmlClass: document.documentElement.className,
      background: root.getPropertyValue('--background').trim(),
      primary: root.getPropertyValue('--primary').trim(),
      font: getComputedStyle(document.body).fontFamily.slice(0, 40),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }
  })
  const entry = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('script[src]'))
        .map((s) => (s as HTMLScriptElement).src)
        .find((s) => /assets\/index-/.test(s)) ?? '',
  )
  say(
    `login: html.class="${theme.htmlClass}" --background=${theme.background} --primary=${theme.primary} body bg=${theme.bodyBg} font="${theme.font}" entry=${entry.replace(/^https?:\/\/[^/]+\//, '')}`,
  )
  await page.screenshot({ path: `${OUT}/1-login.png`, fullPage: true })

  // 2 — a fresh account signs up with code 000000; first light plays once.
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Full name').fill('QA Smoke Owner')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Organization name').fill(`QA Smoke Org ${stamp}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor({ timeout: 30_000 })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type('000000')
  const firstLight = page.locator('[data-slot="first-light"]')
  const t0 = Date.now()
  const seen = await firstLight
    .waitFor({ state: 'visible', timeout: 60_000 })
    .then(() => true)
    .catch(() => false)
  if (seen) await page.screenshot({ path: `${OUT}/2-first-light.png` })
  await firstLight.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {})
  const flMs = Date.now() - t0
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  say(
    `signup ${email}: verified with 000000 → Dashboard; first light ${seen ? `played (visible→gone in ~${flMs} ms incl. verify)` : 'NOT seen'}`,
  )
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  await page.waitForTimeout(2500)
  say(`after reload: first light overlay count ${await firstLight.count()} (must be 0)`)

  // 3 — the five screens, no console errors.
  const screens: { rail: RegExp; name: string; marker: string }[] = [
    { rail: /^Today/, name: 'today', marker: 'main' },
    { rail: /^Studio/, name: 'studio', marker: 'main' },
    { rail: /^Settings/, name: 'settings', marker: 'main' },
    { rail: /^Billing/, name: 'billing', marker: 'main' },
  ]
  await page.screenshot({ path: `${OUT}/3-dashboard.png`, fullPage: true })
  for (const s of screens) {
    const before = consoleErrors.length
    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: s.rail })
      .first()
      .click()
    await page
      .locator('[aria-busy="true"]')
      .first()
      .waitFor({ state: 'detached', timeout: 40_000 })
      .catch(() => {})
    await page.waitForTimeout(1200)
    const h1 = await page
      .getByRole('heading', { level: 1 })
      .first()
      .innerText()
      .catch(() => '?')
    await page.screenshot({ path: `${OUT}/3-${s.name}.png`, fullPage: true })
    say(`${s.name}: h1 "${h1}", console errors during load: ${consoleErrors.length - before}`)
  }

  // 4 — one 401 path: a revoked token purges the session, toasts, lands on login.
  const token = await page.evaluate(
    () =>
      JSON.parse(
        window.sessionStorage.getItem('ab-live-session') ??
          window.localStorage.getItem('ab-live-session') ??
          '{}',
      ).token as string | undefined,
  )
  // The API base is whatever the served build inlined; the app itself makes
  // the revocation call through its own client, so we drive the same screen it
  // would use: Settings › Team's sign-out-everywhere is one click, but to keep
  // this deterministic we tamper the stored token and reload.
  await page.evaluate(() => {
    for (const store of [window.sessionStorage, window.localStorage]) {
      const raw = store.getItem('ab-live-session')
      if (!raw) continue
      const s = JSON.parse(raw) as { token: string }
      s.token = 'expired-token-test-0915-smoke'
      store.setItem('ab-live-session', JSON.stringify(s))
    }
  })
  void token
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForURL(/\/login$/, { timeout: 40_000 }).catch(() => {})
  const toast = await page.getByText('Your session ended. Sign in again to continue.').count()
  const stored = await page.evaluate(() =>
    Boolean(
      window.sessionStorage.getItem('ab-live-session') ||
      window.localStorage.getItem('ab-live-session'),
    ),
  )
  say(
    `401 path: url ${page.url().replace(/^https?:\/\/[^/]+/, '')}, toast ×${toast}, session in storage ${stored}`,
  )
  await page.screenshot({ path: `${OUT}/4-401-login.png`, fullPage: true })

  say(
    `console errors total: ${consoleErrors.length}${consoleErrors.length ? ` — ${consoleErrors.slice(0, 5).join(' | ')}` : ''}`,
  )
  writeFileSync(
    `${OUT}/smoke.md`,
    `# Post-deploy smoke — ${BASE} — ${new Date().toISOString()}\n\n${rows.map((r) => `- ${r}`).join('\n')}\n`,
  )
  await browser.close()
}

void main()
