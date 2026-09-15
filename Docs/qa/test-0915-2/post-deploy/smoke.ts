/**
 * TEST-0915-2 · Phase 6 step 5 — the post-deploy smoke on production
 * (2.malaky.ai), in a real browser. On disk only, never committed.
 *
 * Theme · a fresh signup with 000000 · first light once and not on reload ·
 * Dashboard, Today, Studio, Settings, Billing inside ONE frame with zero console
 * errors · the rail indicator travelling (the same node across the walk) · a
 * toast readable from its first frame (the "Brand voice saved" toast, sampled
 * from its mount — no draft exists at zero spend, so not the Approve toast) ·
 * a mid-session 401 landing on login.
 *
 * Usage: E2E_API_ENV=dev VITE_API_BASE_URL=<dev base> pnpm exec tsx <this file> --base https://2.malaky.ai --out Docs/qa/test-0915-2/post-deploy
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, request as playwrightRequest } from '@playwright/test'

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
const API = (process.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
if (process.env.E2E_API_ENV !== 'dev' || !API) throw new Error('E2E_API_ENV=dev and VITE_API_BASE_URL required')
const rows: string[] = []
const say = (line: string) => {
  rows.push(line)
  console.log(line)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const request = await playwrightRequest.newContext()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200))
  })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`))

  const stamp = Date.now()
  const email = `qa+${stamp}s2@alphapromena.com`
  const password = 'Roasted2Order!'

  // 1 — login renders the theme; the served bundle.
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
      frame: document.querySelectorAll('[data-sidebar="sidebar"]').length,
    }
  })
  const entry = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('script[src]'))
        .map((s) => (s as HTMLScriptElement).src)
        .find((s) => /assets\/index-/.test(s)) ?? '',
  )
  say(
    `login: html.class="${theme.htmlClass}" --background=${theme.background} --primary=${theme.primary} body bg=${theme.bodyBg} font="${theme.font}" frame on the auth page: ${theme.frame} (must be 0) entry=${entry.replace(/^https?:\/\/[^/]+\//, '')}`,
  )
  await page.screenshot({ path: `${OUT}/1-login.png`, fullPage: true })

  // 2 — a fresh account signs up with code 000000; first light plays once, in page time.
  await page.addInitScript({
    content: `(() => { window.__fl = { mounted: false, at: -1, removedAt: -1 }; new MutationObserver(() => { const el = document.querySelector('[data-slot="first-light"]'); if (el && !window.__fl.mounted) { window.__fl.mounted = true; window.__fl.at = performance.now() } if (!el && window.__fl.mounted && window.__fl.removedAt < 0) window.__fl.removedAt = performance.now() }).observe(document, { childList: true, subtree: true }) })()`,
  })
  await page.goto(`${BASE}/signup`, { waitUntil: 'load' })
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
  const seen = await firstLight.waitFor({ state: 'visible', timeout: 60_000 }).then(() => true).catch(() => false)
  if (seen) await page.screenshot({ path: `${OUT}/2-first-light.png` })
  await firstLight.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {})
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  const fl = (await page.evaluate('window.__fl')) as { mounted: boolean; at: number; removedAt: number }
  say(`signup ${email}: verified with 000000 → Dashboard; first light ${seen ? `played once, ${Math.round(fl.removedAt - fl.at)} ms mount → removal in page time` : 'NOT seen'}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  await page.waitForTimeout(2500)
  const again = (await page.evaluate('window.__fl')) as { mounted: boolean }
  say(`after reload: first light mounted ${again.mounted} (must be false)`)
  await page.waitForLoadState('networkidle', { timeout: 40_000 }).catch(() => {})

  // 3 — the five screens inside ONE frame, the indicator the same node, no console errors.
  // The Dashboard's full-page screenshot comes BEFORE the tag: Playwright's
  // full-page capture resizes the viewport, and shadcn's sidebar re-creates
  // its inner rail element on that (smoke runs 1 and 3 read "removed <div>,
  // added <div>" 12–23 ms after the tag, exactly at the capture) — a harness
  // artefact, not a navigation. The hops themselves are what this row reads.
  await page.screenshot({ path: `${OUT}/3-dashboard.png`, fullPage: true })
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    const indicator = document.querySelector('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
    indicator?.setAttribute('data-smoke', 'tagged')
    const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
    w.__shell = { rail: document.querySelector('[data-sidebar="sidebar"]'), main: document.querySelector('main') }
    const events: string[] = []
    ;(window as unknown as { __events: string[] }).__events = events
    const t0 = performance.now()
    new MutationObserver((records) => {
      for (const r of records) {
        for (const n of Array.from(r.removedNodes)) if (n.nodeType === 1 && ((n as Element).matches('[data-sidebar="sidebar"], main') || (n as Element).querySelector('[data-sidebar="sidebar"], main'))) events.push(`+${Math.round(performance.now() - t0)}ms removed <${(n as Element).tagName.toLowerCase()}>`)
        for (const n of Array.from(r.addedNodes)) if (n.nodeType === 1 && ((n as Element).matches('[data-sidebar="sidebar"], main') || (n as Element).querySelector('[data-sidebar="sidebar"], main'))) events.push(`+${Math.round(performance.now() - t0)}ms added <${(n as Element).tagName.toLowerCase()}>`)
      }
    }).observe(document, { childList: true, subtree: true })
  })
  const screens: { rail: RegExp; name: string }[] = [
    { rail: /^Today/, name: 'today' },
    { rail: /^Studio/, name: 'studio' },
    { rail: /^Settings/, name: 'settings' },
    { rail: /^Billing/, name: 'billing' },
  ]
  for (const s of screens) {
    const before = consoleErrors.length
    await page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: s.rail }).first().click()
    await page.locator('[aria-busy="true"]').first().waitFor({ state: 'detached', timeout: 40_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    const h1 = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '?')
    const shape = await page.evaluate(() => {
      const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
      return {
        mains: document.querySelectorAll('main').length,
        rails: document.querySelectorAll('[data-sidebar="sidebar"]').length,
        tagged: document.querySelector('[data-sidebar="sidebar"] [data-slot="nav-indicator"][data-smoke="tagged"]') !== null,
        sameRail: w.__shell.rail === document.querySelector('[data-sidebar="sidebar"]'),
        sameMain: w.__shell.main === document.querySelector('main'),
        events: ((window as unknown as { __events?: string[] }).__events ?? []).slice(0, 6).join(' '),
      }
    })
    await page.screenshot({ path: `${OUT}/3-${s.name}.png`, fullPage: true })
    say(`${s.name}: h1 "${h1}", one frame ${shape.mains === 1 && shape.rails === 1 && shape.sameRail && shape.sameMain} (rails ${shape.rails}, mains ${shape.mains}, sameRail ${shape.sameRail}, sameMain ${shape.sameMain}), indicator the tagged node ${shape.tagged}, console errors during load: ${consoleErrors.length - before}${shape.events ? `; frame events: ${shape.events}` : ""}`)
  }

  // 4 — a toast readable from its first frame: "Brand voice saved", sampled from its mount.
  await page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /^Settings/ }).first().click()
  await page.getByRole('tab', { name: 'Brand voice' }).click()
  await page.locator('[aria-busy="true"]').first().waitFor({ state: 'detached', timeout: 40_000 }).catch(() => {})
  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page.getByRole('textbox', { name: 'Do rule 1', exact: true }).fill('Name the roast date when it matters')
  const samples = (await page.evaluate(`((offsets) => new Promise((resolve, reject) => {
    const button = Array.from(document.querySelectorAll('main button')).find((b) => (b.textContent || '').trim() === 'Save changes')
    if (!button) return reject(new Error('no Save changes'))
    const parse = (c) => { const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null }
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    const over = (t, a, u) => ({ r: t.r * a + u.r * (1 - a), g: t.g * a + u.g * (1 - a), b: t.b * a + u.b * (1 - a) })
    const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100 }
    const sample = (t) => { const toast = document.querySelector('.cn-toast'); if (!toast) return { t, present: false }; const desc = toast.querySelector('[data-description]'); const s = getComputedStyle(toast); const alpha = parseFloat(s.opacity); const text = parse(desc ? getComputedStyle(desc).color : null); const fill = parse(s.backgroundColor); const behind = parse(getComputedStyle(document.body).backgroundColor) || { r: 8, g: 13, b: 17, a: 1 }; const rendered = text && fill ? ratio(over(over(text, text.a, fill), alpha, behind), over(fill, alpha, behind)) : null; return { t, present: true, opacity: alpha, rendered } }
    const samples = []
    button.click()
    const poll = setInterval(() => { if (!document.querySelector('.cn-toast')) return; clearInterval(poll); const t1 = performance.now(); for (const o of offsets) setTimeout(() => samples.push(sample(Math.round(performance.now() - t1))), o); setTimeout(() => resolve(samples), offsets[offsets.length - 1] + 60) }, 5)
    setTimeout(() => { clearInterval(poll); resolve(samples) }, 30000)
  }))([40, 80, 160, 400])`)) as { t: number; present: boolean; opacity?: number; rendered?: number | null }[]
  say(`toast from its first frame: ${samples.map((s) => `+${s.t} ms → ${s.present ? `opacity ${s.opacity}, ${s.rendered}:1` : 'no toast'}`).join('; ') || 'no toast in 30 s'}`)
  await page.screenshot({ path: `${OUT}/4-toast.png` })

  // 5 — a mid-session 401: the token revoked from outside, the next read lands on login.
  const token = (await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('ab-live-session') ?? window.localStorage.getItem('ab-live-session') ?? '{}').token as string | undefined)) ?? ''
  await page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /^Dashboard/ }).first().click()
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 40_000 })
  await page.waitForLoadState('networkidle', { timeout: 40_000 }).catch(() => {})
  await page.evaluate(() => {
    const seen: string[] = []
    ;(window as unknown as { __toasts: string[] }).__toasts = seen
    new MutationObserver(() => { for (const t of Array.from(document.querySelectorAll('.cn-toast'))) { const text = t.textContent ?? ''; if (text && !seen.includes(text)) seen.push(text) } }).observe(document, { childList: true, subtree: true, characterData: true })
  })
  const revoke = await request.post(`${API}/auth/logout`, { headers: { authorization: `Bearer ${token}` } })
  const billing = page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /^Billing/ }).first()
  if (await billing.isVisible()) await billing.dispatchEvent('click', undefined, { timeout: 2000 }).catch(() => undefined)
  await page.waitForURL(/\/login$/, { timeout: 40_000 }).catch(() => {})
  const toastSeen = await page.evaluate(() => ((window as unknown as { __toasts?: string[] }).__toasts ?? []).some((t) => t.includes('Your session ended'))).catch(() => false)
  const visible = (await page.getByText('Your session ended. Sign in again to continue.').count()) > 0
  const stored = await page.evaluate(() => Boolean(window.sessionStorage.getItem('ab-live-session') || window.localStorage.getItem('ab-live-session')))
  const signIn = await page.getByRole('button', { name: 'Sign in' }).waitFor({ timeout: 10_000 }).then(() => true).catch(() => false)
  say(`mid-session 401: revoke → ${revoke.status()}; url ${page.url().replace(/^https?:\/\/[^/]+/, '')}, toast ${visible || toastSeen}, session in storage ${stored}, Sign in button ${signIn}`)
  await page.screenshot({ path: `${OUT}/5-401-login.png`, fullPage: true })

  say(`console errors total: ${consoleErrors.length}${consoleErrors.length ? ` — ${consoleErrors.slice(0, 5).join(' | ')}` : ''}`)
  writeFileSync(`${OUT}/smoke.md`, `# Post-deploy smoke — ${BASE} — ${new Date().toISOString()}\n\n${rows.map((r) => `- ${r}`).join('\n')}\n`)
  await request.dispose()
  await browser.close()
}

void main()
