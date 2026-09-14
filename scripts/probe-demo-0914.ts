/**
 * ORDER DEMO-0914 §1 — the first-run probe.
 *
 * Signs up a FRESH account against a running build and records, verbatim,
 * what every screen of the product shows that account. It asserts nothing:
 * the point is the transcript, which is what decides the rest of the order.
 *
 * It is a probe, not a spec — it lives in `scripts/` beside the other
 * `probe-*.ts` for the same reason they do: Playwright's `testDir` is `e2e/`
 * and everything there runs in the static suite, and this must never join it.
 *
 * Usage:
 *   pnpm exec tsx scripts/probe-demo-0914.ts --base <url> --mode static|live \
 *     --out Docs/qa/demo-0914/probe/<name>
 *
 * `--mode live` types the dev verification code (000000) on the OTP screen;
 * `--mode static` presses the stand-in button, because the static world has
 * no mail. Nothing here publishes, pays or renders media.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'

const args = process.argv.slice(2)
function arg(name: string, fallback?: string): string {
  const index = args.indexOf(`--${name}`)
  const value = index >= 0 ? args[index + 1] : undefined
  if (value === undefined) {
    if (fallback === undefined) throw new Error(`missing --${name}`)
    return fallback
  }
  return value
}

const BASE = arg('base').replace(/\/+$/, '')
const MODE = arg('mode') as 'static' | 'live'
const OUT = arg('out')

/** The dev tenant's verification code (Docs/api/api.md, Auth). */
const CODE = '000000'

const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, '0')}`

const ACCOUNT = {
  name: 'Demo Probe',
  email: `qa+${stamp}demo@alphapromena.com`,
  password: 'Probe-Demo-0914!',
  orgName: `Probe Co ${stamp}`,
}

/** The eight screens the order names, plus the landing the walk starts on. */
const SCREENS: { label: string; path: string }[] = [
  { label: 'Dashboard (landing)', path: '/' },
  { label: 'Today', path: '/today' },
  { label: 'Studio', path: '/studio' },
  { label: 'Studio — your renders', path: '/studio/jobs' },
  { label: 'Brand — brand voice', path: '/settings/brand-voice' },
  { label: 'Brand — tones', path: '/settings/tones' },
  { label: 'Brand — sources & topics', path: '/settings/sources' },
  { label: 'Schedule — calendar', path: '/calendar' },
  { label: 'Schedule — settings', path: '/calendar/settings' },
  { label: 'Connections', path: '/connections' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Billing', path: '/billing' },
  { label: 'Settings — organization', path: '/settings/organization' },
]

/**
 * Wait for the screen to stop syncing, then read it as a person would.
 *
 * A first pass waited 1.2 s and caught the live Studio mid-skeleton — it
 * probes thirteen catalog endpoints on mount — which would have been recorded
 * as an empty screen and is not one. So: give the sync a moment to START
 * (a screen that has not begun loading has no `aria-busy` to wait for yet),
 * then wait for every busy region to go quiet, then let the paint land.
 */
async function settle(page: Page) {
  await page.waitForTimeout(1_000)
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    const busy = await page.locator('[aria-busy="true"]').count()
    if (busy === 0) break
    await page.waitForTimeout(500)
  }
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(1_500)
}

/**
 * Move WITHOUT a page load.
 *
 * A `page.goto` reloads the SPA, and in static mode the whole world — the
 * signup included — is in memory, so a reload throws the fresh account away
 * and lands back on the marketing page. That is itself a probe finding; it is
 * not a way to read the product. React Router's browser history listens to
 * `popstate`, so pushing and announcing is exactly the in-app move a click on
 * the rail would make.
 */
async function capture(page: Page, path: string): Promise<string> {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  await settle(page)
  const text = await page.evaluate(() => document.body.innerText)
  const url = page.url().replace(/^https?:\/\/[^/]+/, '')
  return `URL AFTER LOAD: ${url}\n\n${text.trim()}`
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const sections: string[] = []

  const requests: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith(BASE)) requests.push(`${r.method()} ${r.url()}`)
  })

  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Full name').fill(ACCOUNT.name)
  await page.getByLabel('Work email').fill(ACCOUNT.email)
  await page.getByLabel('Password', { exact: true }).fill(ACCOUNT.password)
  await page.getByLabel('Organization name').fill(ACCOUNT.orgName)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor({ timeout: 30_000 })
  sections.push(
    `## Signup — verify screen\n\n${(await page.evaluate(() => document.body.innerText)).trim()}`,
  )

  if (MODE === 'live') {
    await page.locator('[data-input-otp]').click()
    await page.keyboard.type(CODE)
  } else {
    await page.getByRole('button', { name: /I've verified my email/ }).click()
  }
  await page.waitForURL((url) => !url.pathname.startsWith('/verify-email'), { timeout: 60_000 })
  await settle(page)

  for (const screen of SCREENS) {
    sections.push(`## ${screen.label} — \`${screen.path}\`\n\n${await capture(page, screen.path)}`)
  }

  mkdirSync(OUT, { recursive: true })
  const header = [
    `# DEMO-0914 first-run probe — ${MODE} mode`,
    '',
    `- base: \`${BASE}\``,
    `- account: \`${ACCOUNT.email}\` / org \`${ACCOUNT.orgName}\``,
    `- at: ${new Date().toISOString()}`,
    `- off-origin requests observed: ${requests.length}`,
    '',
  ].join('\n')
  writeFileSync(`${OUT}/transcript.md`, `${header}${sections.join('\n\n---\n\n')}\n`, 'utf8')
  writeFileSync(`${OUT}/requests.txt`, `${requests.join('\n')}\n`, 'utf8')
  console.log(`probe written to ${OUT}/transcript.md (${sections.length} sections)`)
  await browser.close()
}

void main()
