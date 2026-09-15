/**
 * TEST-0915-2 · Phase 4 — the persistent shell's first LIVE exercise, against
 * the deployed dev API through the built app served on a local port. Zero paid
 * paths: signup, brand setup, one text generation per fresh org (its own dev
 * wallet), approvals, reads.
 *
 *   A  frame boundaries — signed-out `/` and the marketing paths wear the
 *      marketing layout and no app frame; the auth pages wear neither; every
 *      app route renders inside ONE frame (one rail, one main)
 *   B  identity live — the tagged rail indicator, the rail and the main are the
 *      same nodes across Dashboard → Today → Billing → Calendar → Settings,
 *      normal and reduced motion; route arrivals timed as Docs/qa/shell-0915
 *      (warm hops after a client-side return, three runs per route)
 *   C  moments inside the frame — first light once per account and not on
 *      reload, under 2000 ms; Generating's stage lines; Approve settle + sweep;
 *      §5.7 finishing the queue; the tone sample rewrite; the skeleton at the
 *      true start with role="status" + aria-busy and painted after ~220 ms; no
 *      skeleton flash on finished screens, reduced motion too
 *   D  contrast in motion — axe (wcag2a/aa) on every app route right after a
 *      client-side arrival, during each moment, with the Approve toast up; the
 *      toast description at +40/+80/+160/+400 ms ≥ 4.5:1; reduced motion → end
 *      state
 *   E  item 75 by eye — expired at boot, revoked mid-session, dead token on a
 *      direct load of Billing: login + the toast, screenshots
 *   H  three fresh orgs, every wire at 0
 *
 * Every check writes PASS/FAIL/NOTE with the measured value into
 * `<out>/phase4-<label>.md`; a failing check never stops the next.
 *
 *   E2E_API_ENV=dev VITE_API_BASE_URL=<dev base> pnpm exec tsx scripts/probe-test-0915-2-live.ts \
 *     --base <served app> --out Docs/qa/test-0915-2/phase4 [--sections A,B,C,D,E,H] [--label live]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import {
  chromium,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'

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
if (process.env.E2E_API_ENV !== 'dev') {
  console.error('refusing: E2E_API_ENV must be "dev" (HSN-0910/D)')
  process.exit(2)
}
const API = (process.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
if (!API) {
  console.error('refusing: VITE_API_BASE_URL is not set')
  process.exit(2)
}
const HOST = API.replace(/^https?:\/\//, '').split('/')[0]
const redact = (s: string) => s.split(HOST).join('<api-host>')

const BASE = arg('base').replace(/\/+$/, '')
const OUT = arg('out')
const SECTIONS = arg('sections', 'A,B,C,D,E,H').split(',')
const LABEL = arg('label', 'live')
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const SCREEN_SYNC = 40_000
const WCAG = ['wcag2a', 'wcag2aa']
const AA = 4.5
const SESSION_ENDED = 'Your session ended. Sign in again to continue.'

const APP_ROUTES = [
  '/',
  '/today',
  '/calendar',
  '/calendar/settings',
  '/calendar/sources',
  '/connections',
  '/studio',
  '/studio/new',
  '/studio/jobs',
  '/billing',
  '/billing/balance',
  '/generate',
  '/analytics',
  '/settings/organization',
  '/settings/brand-voice',
  '/settings/tones',
  '/settings/sources',
  '/settings/knowledge',
  '/settings/team',
]
const MARKETING = ['/', '/pricing', '/request-demo', '/privacy', '/terms']
const AUTH = ['/login', '/signup', '/reset-password']

interface Row {
  section: string
  check: string
  result: 'PASS' | 'FAIL' | 'NOTE'
  detail: string
}
const rows: Row[] = []
const record = (section: string, check: string, ok: boolean, detail: string) => {
  rows.push({ section, check, result: ok ? 'PASS' : 'FAIL', detail: redact(detail) })
  console.log(`[${section}] ${ok ? 'PASS' : 'FAIL'} · ${check} · ${redact(detail)}`)
}
const note = (section: string, check: string, detail: string) => {
  rows.push({ section, check, result: 'NOTE', detail: redact(detail) })
  console.log(`[${section}] NOTE · ${check} · ${redact(detail)}`)
}

const stampOf = () =>
  `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`

interface Wire {
  status: number
  rid: string
  json: unknown
}
async function api(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token?: string,
  body?: unknown,
): Promise<Wire> {
  const res = await request.fetch(`${API}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    data: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json: unknown
  try {
    json = await res.json()
  } catch {
    json = await res.text()
  }
  const rid =
    res.headers()['x-request-id'] ??
    (json as { error?: { requestId?: string } })?.error?.requestId ??
    '(unexposed)'
  return { status: res.status(), rid, json }
}

const FIRST_LIGHT_WATCH = `
  (() => {
    window.__fl = { mounted: false, at: -1, removedAt: -1 };
    new MutationObserver(() => {
      const el = document.querySelector('[data-slot="first-light"]');
      if (el && !window.__fl.mounted) { window.__fl.mounted = true; window.__fl.at = performance.now(); }
      if (!el && window.__fl.mounted && window.__fl.removedAt < 0) window.__fl.removedAt = performance.now();
    }).observe(document, { childList: true, subtree: true });
  })()
`
interface FirstLight {
  mounted: boolean
  at: number
  removedAt: number
}

/** The skeleton's true start and first paint, polled at 4 ms (proof E's watch). */
const SKELETON_WATCH_START = `
  (() => {
    window.__sk = { mountAt: -1, visibleAt: -1, busyAtMount: null, samples: 0 }
    window.__skTimer = setInterval(() => {
      window.__sk.samples += 1
      const el = document.querySelector('[role="status"][aria-busy="true"]')
      if (!el) return
      const now = performance.now()
      if (window.__sk.mountAt < 0) { window.__sk.mountAt = now; window.__sk.busyAtMount = el.getAttribute('aria-busy') }
      const op = parseFloat(getComputedStyle(el).opacity)
      if (window.__sk.visibleAt < 0 && op > 0.02) { window.__sk.visibleAt = now; clearInterval(window.__skTimer) }
    }, 4)
  })()
`

/** Click a rail link, watch for any painted skeleton, resolve when the marker text is in main. */
const navWithSkeletonWatch = (rail: string, marker: string) => `
  new Promise((resolve) => {
    const link = Array.from(document.querySelectorAll('[data-sidebar="sidebar"] a')).find((a) => (a.textContent || '').trim().indexOf(${JSON.stringify(rail)}) === 0)
    if (!link) { resolve({ ms: -1, skeletonSeen: false, sameIndicator: null }); return }
    const before = document.querySelector('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
    let skeletonSeen = false
    const watch = () => {
      for (const node of document.querySelectorAll('[role="status"][aria-busy="true"]')) {
        const s = getComputedStyle(node)
        if (s.opacity !== '0' && s.display !== 'none' && s.visibility !== 'hidden') skeletonSeen = true
      }
    }
    const ticker = setInterval(watch, 8)
    const arrived = () => ((document.querySelector('main') || {}).textContent || '').indexOf(${JSON.stringify(marker)}) >= 0
    let observer
    const done = (ms) => {
      clearInterval(ticker); if (observer) observer.disconnect()
      const after = document.querySelector('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
      // The wire's share of the hop: the API responses that started after the
      // click, measured to the last one's end (resource timing, page time).
      const api = performance.getEntriesByType('resource').filter((e) => e.startTime >= t0 && /\\/(orgs|me)\\b/.test(e.name))
      const wire = api.length ? Math.max(...api.map((e) => e.responseEnd)) - t0 : 0
      resolve({ ms, skeletonSeen, sameIndicator: before !== null && before === after, wire: Math.round(wire), calls: api.length })
    }
    observer = new MutationObserver(() => { watch(); if (arrived()) done(performance.now() - t0) })
    setTimeout(() => done(-2), 15000)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    const t0 = performance.now()
    link.click()
    if (arrived()) done(performance.now() - t0)
  })
`

/**
 * Click the named button and sample the toast it raises in page time (item
 * 76's probe): opacity, the description's contrast AS RENDERED, the transform.
 * Offsets count from the click, as the built-app measurement did.
 */
const clickAndSample = (
  buttonText: string,
  offsets: number[],
) => `((offsets) => new Promise((resolve, reject) => {
  const wanted = ${JSON.stringify(buttonText)}
  const parse = (c) => { const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null }
  const over = (top, alpha, under) => ({ r: top.r * alpha + under.r * (1 - alpha), g: top.g * alpha + under.g * (1 - alpha), b: top.b * alpha + under.b * (1 - alpha) })
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100 }
  const sample = (t) => {
    const toast = document.querySelector('.cn-toast')
    if (!toast) return { t, present: false }
    const desc = toast.querySelector('[data-description]')
    const s = getComputedStyle(toast)
    const alpha = parseFloat(s.opacity)
    const text = parse(desc ? getComputedStyle(desc).color : null)
    const fill = parse(s.backgroundColor)
    const rect = toast.getBoundingClientRect()
    let behind = null
    for (const el of document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)) {
      if (toast.contains(el) || el.closest('.toaster')) continue
      const b = parse(getComputedStyle(el).backgroundColor)
      if (b && b.a > 0) { behind = b; break }
    }
    if (!behind) behind = parse(getComputedStyle(document.body).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 }
    let rendered = null
    if (text && fill) { const textOnFill = over(text, text.a, fill); rendered = ratio(over(textOnFill, alpha, behind), over(fill, alpha, behind)) }
    return { t, present: true, opacity: alpha, rendered, transform: s.transform, hasDescription: !!desc }
  }
  const button = Array.from(document.querySelectorAll('main button')).find((b) => (b.textContent || '').trim() === wanted)
  if (!button) return reject(new Error('no "' + wanted + '" button in main'))
  const samples = []
  const t0 = performance.now()
  button.click()
  // Live, the toast follows the wire's answer, so the offsets count from the
  // toast's MOUNT (polled at 5 ms) — earlier than the built-app probe's
  // click-relative samples, never later.
  const poll = setInterval(() => {
    if (!document.querySelector('.cn-toast')) return
    clearInterval(poll)
    const t1 = performance.now()
    for (const offset of offsets) setTimeout(() => samples.push(sample(Math.round(performance.now() - t1))), offset)
    setTimeout(() => resolve({ samples, toastAt: Math.round(t1 - t0) }), offsets[offsets.length - 1] + 60)
  }, 5)
  setTimeout(() => { clearInterval(poll); resolve({ samples, toastAt: -1 }) }, 30000)
}))(${JSON.stringify(offsets)})`

interface ToastSample {
  t: number
  present: boolean
  opacity?: number
  rendered?: number | null
  transform?: string
  hasDescription?: boolean
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }).catch(() => {})
}

async function scan(page: Page, where: string) {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  return {
    where,
    violations: result.violations.length,
    detail: result.violations
      .map((v) => `${v.id} (${v.impact}, ${v.nodes.length}: ${v.nodes[0]?.target.join(' ') ?? ''})`)
      .join('; '),
  }
}

/** Client-side navigation, the way the app's own links move (no reload). */
async function go(page: Page, path: string, settle = 700) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  if (settle > 0) await page.waitForTimeout(settle)
}

async function busyGone(page: Page, timeout = SCREEN_SYNC) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if ((await page.locator('[aria-busy="true"]').count()) === 0) return true
    await page.waitForTimeout(100)
  }
  return false
}

interface Account {
  email: string
  orgName: string
  orgId: string
  token: string
}

/** Signup through the product: the form, the code, the Dashboard. */
async function signUp(page: Page, tag: string): Promise<Account> {
  const stamp = stampOf()
  const email = `qa+${stamp}${tag}@alphapromena.com`
  const orgName = `QA T2 ${tag.toUpperCase()} ${stamp}`
  await page.goto(`${BASE}/signup`, { waitUntil: 'load' })
  const form = await page
    .getByRole('heading', { name: 'Create your account' })
    .waitFor({ timeout: 20_000 })
    .then(() => true)
    .catch(() => false)
  if (!form) {
    await shot(page, `signup-not-rendered-${tag}`)
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Create your account' }).waitFor({ timeout: 20_000 })
  }
  await page.getByLabel('Full name').fill(`QA T2 ${tag}`)
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill(orgName)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor({ timeout: 20_000 })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  const token = await sessionToken(page)
  return { email, orgName, orgId: '', token }
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: SCREEN_SYNC })
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC }).catch(() => {})
}

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  if (!raw) throw new Error('no live session in storage')
  return (JSON.parse(raw) as { token: string }).token
}

async function orgIdOf(request: APIRequestContext, token: string): Promise<string> {
  const r = await api(request, 'GET', '/me/orgs', token)
  return ((r.json as { items: { id: string }[] }).items[0] ?? { id: '' }).id
}

async function openSettingsTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
  await busyGone(page)
}

/** The four brand entities through the screens — what the readiness gate asks (D-ONB-D). */
async function completeBrandSetup(page: Page) {
  await openSettingsTab(page, 'Brand voice')
  await page.getByRole('button', { name: 'Add do', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Do rule 1', exact: true })
    .fill('Name the roast date when it matters')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByText('Brand voice saved').waitFor({ timeout: SCREEN_SYNC })
  await openSettingsTab(page, 'Tones')
  await page.getByRole('link', { name: 'Create your first tone' }).click()
  await page.getByLabel('Tone name').fill('Roastery floor')
  await page.getByLabel('Language').selectOption('en')
  await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await page.getByText('Tone created').waitFor({ timeout: SCREEN_SYNC })
  await openSettingsTab(page, 'Sources & topics')
  await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  await page.getByRole('button', { name: 'Add source' }).click()
  await page.getByText('Source added').waitFor({ timeout: SCREEN_SYNC })
  await page.getByLabel('Add a topic').fill('single origin')
  await page.keyboard.press('Enter')
  await page.getByText('single origin').waitFor()
  await page.waitForTimeout(2000)
}

const frameShape = (page: Page) =>
  page.evaluate(() => ({
    mains: document.querySelectorAll('main').length,
    rails: document.querySelectorAll('[data-sidebar="sidebar"]').length,
    indicators: document.querySelectorAll('[data-sidebar="sidebar"] [data-slot="nav-indicator"]')
      .length,
    marketing: document.querySelectorAll('.mk-world').length,
    mkWorldAttr: document.documentElement.hasAttribute('data-mk-world'),
    banner: document.querySelectorAll('header').length,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    path: location.pathname,
  }))

// ------------------------------------------------------------------ A
async function sectionA(browser: Browser, account: Account) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    // Signed out: the marketing paths, the auth pages.
    const out: string[] = []
    let okOut = true
    for (const path of [...MARKETING, ...AUTH]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(800)
      const s = await frameShape(page)
      const marketingExpected = MARKETING.includes(path)
      const ok = marketingExpected
        ? s.marketing === 1 && s.rails === 0
        : s.marketing === 0 && s.rails === 0
      okOut &&= ok
      out.push(
        `${path}: mk-world ${s.marketing}, rails ${s.rails}, mains ${s.mains}${ok ? '' : ' ✗'}`,
      )
    }
    record(
      'A',
      'signed out: `/` and the four marketing paths wear the marketing layout and no app frame; the auth pages wear neither',
      okOut,
      out.join(' · '),
    )
    await shot(page, 'a-signed-out-login')
    // Signed in: every app route inside ONE frame, and the marketing paths still marketing.
    await login(page, account.email)
    const inApp: string[] = []
    let okIn = true
    for (const route of APP_ROUTES) {
      await go(page, route, 0)
      await busyGone(page)
      await page.waitForTimeout(300)
      const s = await frameShape(page)
      const ok =
        s.mains === 1 && s.rails === 1 && s.indicators === 1 && s.marketing === 0 && !s.mkWorldAttr
      okIn &&= ok
      inApp.push(
        `${route}: mains ${s.mains}, rails ${s.rails}, indicators ${s.indicators}, mk ${s.marketing}${ok ? '' : ' ✗'}`,
      )
    }
    record(
      'A',
      `signed in: every app route renders inside one frame (${APP_ROUTES.length} routes: one main, one rail, one rail indicator, no marketing world)`,
      okIn,
      inApp.join(' · '),
    )
    const mk: string[] = []
    let okMk = true
    for (const path of ['/pricing', '/privacy']) {
      await go(page, path, 800)
      const s = await frameShape(page)
      const ok = s.marketing === 1 && s.rails === 0
      okMk &&= ok
      mk.push(`${path}: mk-world ${s.marketing}, rails ${s.rails}${ok ? '' : ' ✗'}`)
    }
    record(
      'A',
      'signed in: a marketing path still wears the marketing layout, no app frame',
      okMk,
      mk.join(' · '),
    )
    await shot(page, 'a-signed-in-pricing')
  } catch (error) {
    record('A', 'section ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'a-error')
  } finally {
    await context.close()
  }
}

// ------------------------------------------------------------------ B
async function sectionB(browser: Browser, account: Account) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const label = reducedMotion === 'reduce' ? 'reduced motion' : 'motion'
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion,
    })
    const page = await context.newPage()
    try {
      await login(page, account.email)
      // Identity walk: tag on the Dashboard, hop, read.
      await page.evaluate(() => {
        const indicator = document.querySelector(
          '[data-sidebar="sidebar"] [data-slot="nav-indicator"]',
        )
        if (!indicator) throw new Error('no indicator to tag')
        indicator.setAttribute('data-t2', 'tagged')
        const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
        w.__shell = {
          rail: document.querySelector('[data-sidebar="sidebar"]'),
          main: document.querySelector('main'),
        }
      })
      const walk = [
        { rail: 'Today', heading: 'Today' },
        { rail: 'Billing', heading: 'Billing' },
        { rail: 'Calendar', heading: 'Calendar' },
        { rail: 'Settings', heading: 'Organization' },
      ]
      const stops: string[] = []
      let okWalk = true
      for (const stop of walk) {
        await page
          .locator('[data-sidebar="sidebar"]')
          .getByRole('link', { name: new RegExp(`^${stop.rail}`) })
          .first()
          .click()
        await page
          .getByRole('heading', { name: stop.heading, level: 1 })
          .waitFor({ timeout: SCREEN_SYNC })
        await busyGone(page)
        const id = await page.evaluate(() => {
          const w = window as unknown as { __shell: { rail: Element | null; main: Element | null } }
          return {
            tagged:
              document.querySelector(
                '[data-sidebar="sidebar"] [data-slot="nav-indicator"][data-t2="tagged"]',
              ) !== null,
            indicators: document.querySelectorAll(
              '[data-sidebar="sidebar"] [data-slot="nav-indicator"]',
            ).length,
            mains: document.querySelectorAll('main').length,
            sameRail: w.__shell.rail === document.querySelector('[data-sidebar="sidebar"]'),
            sameMain: w.__shell.main === document.querySelector('main'),
          }
        })
        const ok = id.tagged && id.indicators === 1 && id.mains === 1 && id.sameRail && id.sameMain
        okWalk &&= ok
        stops.push(`${stop.rail}: ${JSON.stringify(id)}`)
      }
      record(
        'B',
        `${label}: the tagged indicator, the rail and the main are the same nodes through Today, Billing, Calendar, Settings`,
        okWalk,
        stops.join(' · '),
      )
      await shot(page, `b-walk-${reducedMotion}`)

      // Route arrivals: first visit learns each route's own marker (the head of its
      // main text, which the Dashboard does not carry), then three timed warm hops.
      const routes = ['Today', 'Billing', 'Settings', 'Studio', 'Calendar']
      // Each screen's own words on a fresh live org (the first present in its
      // main after the busy marker clears, and absent from the Dashboard).
      const candidates: Record<string, string[]> = {
        Today: ['Nothing waiting on you right now', 'Needs review'],
        Billing: ['Malaky Business', 'Malaky Scale', 'Subscribe'],
        Settings: ['Sources & topics', 'Organization name', 'Choose a country'],
        Studio: [
          'Open the gallery',
          'Your renders',
          'Images and video',
          'Create a visual',
          'Nothing here',
        ],
        Calendar: ['Nothing scheduled yet', 'Schedule settings'],
      }
      const dashboardText = await page.evaluate(() =>
        (document.querySelector('main')?.textContent || '').replace(/\s+/g, ' '),
      )
      const markers: Record<string, string> = {}
      await go(page, '/', 500)
      for (const rail of routes) {
        await page
          .locator('[data-sidebar="sidebar"]')
          .getByRole('link', { name: new RegExp(`^${rail}`) })
          .first()
          .click()
        await busyGone(page)
        // Live screens that read on mount paint after the wire; give them it.
        for (let i = 0; i < 25; i += 1) {
          const t = await page.evaluate(
            () => (document.querySelector('main')?.textContent || '').trim().length,
          )
          if (t > 0) break
          await page.waitForTimeout(200)
        }
        await page.waitForTimeout(800)
        const text = await page.evaluate(() =>
          (document.querySelector('main')?.textContent || '').replace(/\s+/g, ' '),
        )
        markers[rail] =
          candidates[rail].find((c) => text.includes(c) && !dashboardText.includes(c)) ?? ''
        if (!markers[rail])
          note('B', `${label}: no marker for ${rail}`, `main reads "${text.slice(0, 160)}"`)
        await go(page, '/', 500)
      }
      note(
        'B',
        `${label}: arrival markers`,
        Object.entries(markers)
          .map(([k, v]) => `${k}: "${v}"`)
          .join(' · '),
      )
      const hops: {
        rail: string
        ms: number
        wire: number
        calls: number
        skeleton: boolean
        same: boolean | null
      }[] = []
      for (let run = 0; run < 3; run += 1) {
        for (const rail of routes) {
          await go(page, '/', 500)
          await page
            .getByRole('heading', { name: 'Dashboard', level: 1 })
            .waitFor({ timeout: SCREEN_SYNC })
          const r = (await page.evaluate(
            navWithSkeletonWatch(rail, markers[rail] || 'zzz-no-marker'),
          )) as {
            ms: number
            skeletonSeen: boolean
            sameIndicator: boolean | null
            wire: number
            calls: number
          }
          hops.push({
            rail,
            ms: r.ms,
            wire: r.wire,
            calls: r.calls,
            skeleton: r.skeletonSeen,
            same: r.sameIndicator,
          })
          await busyGone(page)
        }
      }
      const shellOf = (h: { ms: number; wire: number }) =>
        h.ms >= 0 ? Math.max(0, Math.round(h.ms - h.wire)) : -1
      const perRoute = routes.map((rail) => {
        const mine = hops
          .filter((h) => h.rail === rail)
          .map(
            (h) =>
              `${Math.round(h.ms)}${h.calls ? ` (wire ${h.wire}, ${h.calls} call${h.calls === 1 ? '' : 's'} → shell ${shellOf(h)})` : ''}${h.skeleton ? '†' : ''}`,
          )
        return `${rail} ${mine.join(' / ')}`
      })
      const warm = hops.filter((_, i) => i >= routes.length)
      const warmShell = warm.map(shellOf).filter((m) => m >= 0)
      const warmShellMax = Math.max(...warmShell)
      record(
        'B',
        `${label}: route arrivals live — the shell's own share (arrival minus the wire) of every warm hop stays inside the static 22–67 ms range`,
        hops.every((h) => h.ms >= 0) && hops.every((h) => h.same === true) && warmShellMax <= 67,
        `${perRoute.join(' · ')}; warm shell max ${warmShellMax} ms; indicator the same node on ${hops.filter((h) => h.same).length}/${hops.length} hops`,
      )
      // A screen that reads on mount is not finished until the wire answers:
      // its skeleton after the 220 ms threshold is the rule working. A skeleton
      // on a hop with no wire in it, or a wire under the threshold, is a flash.
      const flashes = warm.filter((h) => h.skeleton && h.wire < 200)
      record(
        'B',
        `${label}: no skeleton flash on a finished screen's warm hop (a skeleton only where the wire took ≥ 200 ms)`,
        flashes.length === 0,
        `${warm.filter((h) => h.skeleton).length} of ${warm.length} warm hops painted a skeleton, ${flashes.length} without a wire wait behind it`,
      )
    } catch (error) {
      record('B', `${label}: section ran to the end`, false, String(error).slice(0, 300))
      await shot(page, `b-error-${reducedMotion}`)
    } finally {
      await context.close()
    }
  }
}

// ------------------------------------------------------------------ C + D (the moments, scanned)
async function sectionCD(browser: Browser, request: APIRequestContext) {
  const scans: { where: string; violations: number; detail: string }[] = []
  // 1 — first light on a fresh account, once; not on reload.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript({ content: FIRST_LIGHT_WATCH })
  let account: Account | null = null
  try {
    account = await signUp(page, 'c')
    account.orgId = await orgIdOf(request, account.token)
    note('C', 'the fresh org for the moments', `org ${account.orgId}, ${account.email}`)
    const overlay = page.locator('[data-slot="first-light"]')
    const seen = await overlay
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false)
    if (seen) {
      await page.waitForTimeout(500)
      scans.push(await scan(page, 'moment 2 — first light, mid'))
      await shot(page, 'c-first-light-mid')
    }
    await overlay.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
    await page.waitForTimeout(200)
    const fl = (await page.evaluate('window.__fl')) as FirstLight
    const duration = fl.removedAt - fl.at
    record(
      'C',
      'first light plays once on a fresh account, under the 2000 ms ceiling (page-time mount → removal)',
      seen && duration > 0 && duration < 2000,
      `seen ${seen}; ${Math.round(duration)} ms`,
    )
    record(
      'D',
      'axe clean while first light is on screen',
      seen && scans[scans.length - 1]?.violations === 0,
      scans[scans.length - 1]
        ? `${scans[scans.length - 1].violations} ${scans[scans.length - 1].detail}`
        : 'no scan',
    )
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page
      .getByRole('heading', { name: 'Dashboard', level: 1 })
      .waitFor({ timeout: SCREEN_SYNC })
    await page.waitForTimeout(2500)
    const again = (await page.evaluate('window.__fl')) as FirstLight
    record(
      'C',
      'first light never plays on a reload of the same account',
      !again.mounted,
      `mounted after reload: ${again.mounted}`,
    )

    // 2 — brand setup, then the Generate composer: on a fresh live org the wallet
    // is empty ("No balance yet — subscribe"), so a run is refused with 402 and no
    // draft can exist at zero spend. The generation-dependent moments (the
    // stage lines, the approve settle + sweep, §5.7, the toast samples) stay
    // proven on the built app in static mode and by the gate's live-generate on
    // the funded org; here the composer and the honest refusal are read.
    await completeBrandSetup(page)

    // A toast at zero spend, live: "Brand voice saved" carries a description.
    // Item 76's rule on the live app — the description ≥ 4.5:1 as rendered at
    // +40/+80/+160/+400 ms from the toast's mount; axe with it up.
    await openSettingsTab(page, 'Brand voice')
    await page.getByRole('button', { name: 'Add do', exact: true }).click()
    const doCount = await page.getByRole('textbox', { name: /^Do rule \d+$/ }).count()
    await page
      .getByRole('textbox', { name: `Do rule ${doCount}`, exact: true })
      .fill('Say the roast date, never "fresh"')
    const saved = (await page.evaluate(clickAndSample('Save changes', [40, 80, 160, 400]))) as {
      samples: ToastSample[]
      toastAt: number
    }
    const present = saved.samples.filter((s) => s.present)
    record(
      'D',
      'live: the "Brand voice saved" toast description reads ≥ 4.5:1 as rendered at +40/+80/+160/+400 ms from its mount',
      saved.toastAt >= 0 &&
        present.length === saved.samples.length &&
        present.every((s) => (s.rendered ?? 0) >= AA),
      `toast mounted ${saved.toastAt} ms after Save; ${saved.samples.map((s) => `+${s.t} ms → ${s.present ? `${s.rendered} (opacity ${s.opacity}${s.hasDescription ? '' : ', no description node'})` : 'no toast'}`).join('; ')}`,
    )
    scans.push(await scan(page, 'settings — toast up'))
    record(
      'D',
      'axe clean with a toast up',
      scans[scans.length - 1].violations === 0,
      `${scans[scans.length - 1].violations} ${scans[scans.length - 1].detail}`,
    )
    await shot(page, 'c-toast-live')

    await go(page, '/generate', 1000)
    await busyGone(page)
    const generateButton = page.getByRole('button', { name: 'Generate', exact: true })
    const composerShown = await generateButton
      .waitFor({ timeout: SCREEN_SYNC })
      .then(() => true)
      .catch(() => false)
    const chip = await page
      .locator('header')
      .innerText()
      .catch(() => '')
    note(
      'C',
      'the live composer and the wallet chip',
      `composer with a Generate button: ${composerShown}; top bar: "${chip.replace(/\s+/g, ' ').slice(0, 120)}"`,
    )
    if (composerShown) {
      await generateButton.click()
      const t0 = Date.now()
      let outcome = ''
      while (Date.now() - t0 < 60_000) {
        const text = await page
          .locator('main')
          .innerText()
          .catch(() => '')
        if (text.includes('Draft ready for review.')) {
          outcome = 'Draft ready for review.'
          break
        }
        if (text.includes('This run was refused.') || text.includes('refused')) {
          outcome = 'refused'
          break
        }
        if (text.includes('did not finish')) {
          outcome = 'did not finish'
          break
        }
        await page.waitForTimeout(200)
      }
      await shot(page, 'c-generate-outcome')
      const text = await page
        .locator('main')
        .innerText()
        .catch(() => '')
      note(
        'C',
        'a generation on the unfunded fresh org',
        `outcome: ${outcome || 'no terminal line in 60 s'}; main reads "${text.replace(/\s+/g, ' ').slice(0, 200)}"`,
      )
      scans.push(await scan(page, 'generate — after the run'))
      record(
        'D',
        'axe clean on the Generate screen after the run',
        scans[scans.length - 1].violations === 0,
        `${scans[scans.length - 1].violations} ${scans[scans.length - 1].detail}`,
      )
    }
    note(
      'C',
      'moments that need a draft (Generating stages, Approve settle + sweep, §5.7, the toast samples)',
      'not reachable at zero spend on a fresh live org — the wallet is empty by construction and a run is refused with 402; proven on the built app in static mode (Docs/qa/fix-0915/item-76, Docs/qa/test-0915/proofs) and exercised live by the gate on the funded org',
    )

    // 4 — the tone sample rewrite beside the picker (needs ≥ 2 tones: add one more).
    await openSettingsTab(page, 'Tones')
    await page
      .getByRole('link', { name: /Create (custom|your first) tone/ })
      .first()
      .click()
    await page.getByLabel('Tone name').fill('Quiet counter')
    await page.getByLabel('Language').selectOption('en')
    await page.getByLabel('What this tone sounds like').fill('Plain, short, no exclamation marks.')
    await page.getByLabel('Do', { exact: true }).fill('Keep it under two lines')
    await page.getByRole('button', { name: 'Create tone' }).click()
    await page.getByText('Tone created').waitFor({ timeout: SCREEN_SYNC })
    await go(page, '/calendar/settings', 1200)
    await busyGone(page)
    scans.push(await scan(page, 'moment 1 — schedule, tone sample at rest'))
    const toneButtons = page
      .locator('fieldset', { hasText: 'Drafts rotate through' })
      .locator('button[aria-pressed]')
    let sampleSeen = false
    const toneCount = await toneButtons.count()
    if (toneCount > 1) {
      // Select the first tone (the sample appears), then the second: the
      // sample REWRITES for the tone picked most recently.
      await toneButtons.nth(0).click()
      await page.waitForTimeout(400)
      const afterFirst = (await page.locator('[data-slot="tone-sample"]').count()) > 0
      await toneButtons.nth(1).click()
      await page.waitForTimeout(90)
      scans.push(await scan(page, 'moment 1 — mid-rewrite'))
      sampleSeen = afterFirst && (await page.locator('[data-slot="tone-sample"]').count()) > 0
      await shot(page, 'c-tone-sample-mid')
    }
    record(
      'C',
      'moment 1 — the tone sample rewrites beside the picker (data-slot="tone-sample")',
      sampleSeen,
      `${toneCount} tone buttons in the picker; sample present: ${sampleSeen}`,
    )
    record(
      'D',
      'axe clean at rest and mid-rewrite on the schedule screen',
      scans.slice(-2).every((s) => s.violations === 0),
      scans
        .slice(-2)
        .map((s) => `${s.where}: ${s.violations} ${s.detail}`)
        .join(' · '),
    )

    // 5 — the skeleton at the true start of a reload (live: the sync is a real wait).
    await page.addInitScript({ content: SKELETON_WATCH_START })
    await page.goto(`${BASE}/today`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Today', level: 1 }).waitFor({ timeout: SCREEN_SYNC })
    await busyGone(page)
    await page.waitForTimeout(300)
    const sk = (await page.evaluate('window.__sk')) as {
      mountAt: number
      visibleAt: number
      busyAtMount: string | null
      samples: number
    }
    const delay = sk.visibleAt - sk.mountAt
    record(
      'C',
      'a waiting screen mounts role="status" + aria-busy at the true start and paints it after the 220 ms threshold',
      sk.mountAt >= 0 &&
        sk.busyAtMount === 'true' &&
        sk.visibleAt >= 0 &&
        delay >= 200 &&
        delay < 400,
      `aria-busy at mount: ${sk.busyAtMount}; first paint ${Math.round(delay)} ms after mount (${sk.samples} samples at 4 ms)`,
    )

    // D — every app route scanned right after a client-side arrival (the entrance in flight).
    const entrance: string[] = []
    let entranceRed = 0
    for (const route of APP_ROUTES) {
      await go(page, '/', 300)
      await go(page, route, 0)
      const s = await scan(page, `entrance ${route}`)
      if (s.violations > 0) entranceRed += 1
      entrance.push(`${route}: ${s.violations}${s.detail ? ` (${s.detail})` : ''}`)
    }
    record(
      'D',
      `every app route scans clean inside the frame while its entrance is in flight (${APP_ROUTES.length} routes)`,
      entranceRed === 0,
      entrance.join(' · '),
    )
  } catch (error) {
    record('C', 'section ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'c-error')
  } finally {
    await context.close()
  }

  // D, reduced motion: a toast is sampled where one can be raised at zero spend —
  // "Brand voice saved" on the settings screen — in its end state at the first sample.
  if (account) {
    const reduced = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const rpage = await reduced.newPage()
    try {
      await login(rpage, account.email)
      await openSettingsTab(rpage, 'Brand voice')
      await rpage.getByRole('button', { name: 'Add do', exact: true }).click()
      const count = await rpage.getByRole('textbox', { name: /^Do rule \d+$/ }).count()
      await rpage
        .getByRole('textbox', { name: `Do rule ${count}`, exact: true })
        .fill('Say the roast date, never "fresh"')
      const samples = (await rpage.evaluate(`((offsets) => new Promise((resolve, reject) => {
        const button = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Save changes')
        if (!button) return reject(new Error('no Save changes button'))
        const samples = []
        const sample = (t) => { const toast = document.querySelector('.cn-toast'); if (!toast) return { t, present: false }; const s = getComputedStyle(toast); return { t, present: true, opacity: parseFloat(s.opacity), transform: s.transform, hasDescription: !!toast.querySelector('[data-description]') } }
        const t0 = performance.now()
        button.click()
        const poll = setInterval(() => { if (document.querySelector('.cn-toast')) { clearInterval(poll); const t1 = performance.now(); for (const offset of offsets) setTimeout(() => samples.push(sample(Math.round(performance.now() - t1))), offset); setTimeout(() => resolve({ samples, toastAt: Math.round(t1 - t0) }), offsets[offsets.length - 1] + 60) } }, 5)
        setTimeout(() => { clearInterval(poll); resolve({ samples, toastAt: -1 }) }, 30000)
      }))(${JSON.stringify([40, 80, 160, 400])})`)) as { samples: ToastSample[]; toastAt: number }
      const first = samples.samples.find((s) => s.present)
      record(
        'D',
        'reduced motion: a toast ("Brand voice saved") is in its end state at the first sample (opacity 1, transform settled)',
        !!first &&
          first.opacity === 1 &&
          (first.transform === 'none' ||
            /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(first.transform ?? '')),
        `toast mounted ${samples.toastAt} ms after Save; ${samples.samples.map((s) => `+${s.t} ms → ${s.present ? `opacity ${s.opacity}, ${s.transform}` : 'no toast'}`).join('; ')}`,
      )
      await shot(rpage, 'd-reduced-toast')
    } catch (error) {
      record('D', 'reduced-motion pass ran to the end', false, String(error).slice(0, 300))
      await shot(rpage, 'd-reduced-error')
    } finally {
      await reduced.close()
    }
  }
}

// ------------------------------------------------------------------ E
async function sectionE(browser: Browser, request: APIRequestContext, account: Account) {
  const tamper = (page: Page) =>
    page.evaluate(() => {
      for (const store of [window.sessionStorage, window.localStorage]) {
        const raw = store.getItem('ab-live-session')
        if (!raw) continue
        const s = JSON.parse(raw) as { token: string }
        s.token = 'expired-token-test-0915-2'
        store.setItem('ab-live-session', JSON.stringify(s))
      }
    })
  const install = (page: Page) =>
    page.evaluate(() => {
      const seen: string[] = []
      ;(window as unknown as { __toasts: string[] }).__toasts = seen
      new MutationObserver(() => {
        for (const t of Array.from(document.querySelectorAll('.cn-toast'))) {
          const text = t.textContent ?? ''
          if (text && !seen.includes(text)) seen.push(text)
        }
      }).observe(document, { childList: true, subtree: true, characterData: true })
    })
  const landed = async (page: Page) => {
    const start = Date.now()
    let toastSeen = false
    while (Date.now() - start < SCREEN_SYNC) {
      const path = new URL(page.url()).pathname
      const visible = (await page.getByText(SESSION_ENDED).count()) > 0
      const recorded = await page
        .evaluate(() =>
          ((window as unknown as { __toasts?: string[] }).__toasts ?? []).some((t) =>
            t.includes('Your session ended'),
          ),
        )
        .catch(() => false)
      toastSeen ||= visible || recorded
      if (path === '/login' && toastSeen) break
      await page.waitForTimeout(150)
    }
    const stored = await page.evaluate(() =>
      Boolean(
        window.sessionStorage.getItem('ab-live-session') ||
        window.localStorage.getItem('ab-live-session'),
      ),
    )
    // The login screen is a lazy chunk: give its button the moment it needs.
    const signIn = await page
      .getByRole('button', { name: 'Sign in' })
      .waitFor({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false)
    return { path: new URL(page.url()).pathname, toastSeen, stored, signIn }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    // 1 · expired at boot on `/`
    await login(page, account.email)
    await tamper(page)
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await install(page)
    let r = await landed(page)
    await shot(page, 'e-1-expired-at-boot')
    record(
      'E',
      '1 · a token expired at boot on `/` lands on login with the toast, the session purged',
      r.path === '/login' && r.toastSeen && !r.stored && r.signIn,
      JSON.stringify(r),
    )
    // 2 · revoked mid-session on Settings
    await login(page, account.email)
    await page.getByRole('link', { name: 'Settings' }).first().click()
    await page.getByRole('tab', { name: 'Team' }).waitFor({ timeout: SCREEN_SYNC })
    await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC }).catch(() => {})
    await install(page)
    const token = await sessionToken(page)
    const revoke = await api(request, 'POST', '/auth/logout', token)
    note(
      'E',
      'the revocation from outside',
      `POST /auth/logout → ${revoke.status} (request ${revoke.rid})`,
    )
    const billing = page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: /^Billing/ })
      .first()
    if (await billing.isVisible())
      await billing.dispatchEvent('click', undefined, { timeout: 2000 }).catch(() => undefined)
    r = await landed(page)
    await shot(page, 'e-2-revoked-mid-session')
    record(
      'E',
      '2 · a token revoked mid-session on an authed route lands on login with the toast, not on the website',
      r.path === '/login' && r.toastSeen && !r.stored && r.signIn,
      JSON.stringify(r),
    )
    // 3 · dead token on a direct load of Billing
    await login(page, account.email)
    await tamper(page)
    await page.goto(`${BASE}/billing`, { waitUntil: 'domcontentloaded' })
    await install(page)
    r = await landed(page)
    await shot(page, 'e-3-dead-token-billing')
    record(
      'E',
      '3 · a dead token on a direct load of Billing lands on login with the toast',
      r.path === '/login' && r.toastSeen && !r.stored && r.signIn,
      JSON.stringify(r),
    )
  } catch (error) {
    record('E', 'section ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'e-error')
  } finally {
    await context.close()
  }
}

// ------------------------------------------------------------------ H
async function sectionH(browser: Browser, request: APIRequestContext, accounts: Account[]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    while (accounts.length < 3) {
      // A fresh context per account: `/signup` on a signed-in page bounces to
      // the Dashboard (SignedOutOnly), which is right, and not a signup.
      const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const freshPage = await fresh.newPage()
      try {
        const a = await signUp(freshPage, `h${accounts.length}`)
        a.orgId = await orgIdOf(request, a.token)
        accounts.push(a)
      } finally {
        await fresh.close()
      }
    }
    const out: string[] = []
    let ok = true
    for (const a of accounts) {
      const counts: string[] = []
      for (const res of [
        'brand/voices',
        'brand/tones',
        'brand/sources',
        'brand/topics',
        'schedules',
      ]) {
        const r = await api(request, 'GET', `/orgs/${a.orgId}/${res}`, a.token)
        const n = ((r.json as { items?: unknown[] }).items ?? []).length
        if (n !== 0) ok = false
        counts.push(`${res} ${n}`)
      }
      out.push(`org ${a.orgId}: ${counts.join(', ')}`)
    }
    record(
      'H',
      'three fresh live orgs with every wire at 0 (voices, tones, sources, topics, schedules)',
      ok,
      out.join(' · '),
    )
  } catch (error) {
    record('H', 'section ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'h-error')
  } finally {
    await context.close()
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const request = await playwrightRequest.newContext()
  const startedAt = new Date().toISOString()
  const fresh: Account[] = []
  try {
    // One fresh org for A, B, E (a plain account, no first-light claims on it).
    const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const p = await ctx.newPage()
    const base = await signUp(p, 'ab')
    base.orgId = await orgIdOf(request, base.token)
    await ctx.close()
    fresh.push(base)
    note('setup', 'the fresh org for A, B, E', `org ${base.orgId}, ${base.email}`)
    if (SECTIONS.includes('A')) await sectionA(browser, base)
    if (SECTIONS.includes('B')) await sectionB(browser, base)
    if (SECTIONS.includes('C') || SECTIONS.includes('D')) await sectionCD(browser, request)
    if (SECTIONS.includes('E')) await sectionE(browser, request, base)
    if (SECTIONS.includes('H')) await sectionH(browser, request, fresh)
  } finally {
    await request.dispose()
    await browser.close()
  }
  const lines = [
    `# TEST-0915-2 — Phase 4 on the live app (${LABEL}, ${startedAt})`,
    '',
    `Base: ${BASE} · API: <api-host> · sections ${SECTIONS.join(', ')}`,
    '',
    '| section | result | check | detail |',
    '|---|---|---|---|',
    ...rows.map(
      (r) => `| ${r.section} | ${r.result} | ${r.check} | ${r.detail.replace(/\|/g, '\\|')} |`,
    ),
    '',
  ]
  writeFileSync(`${OUT}/phase4-${LABEL}.md`, lines.join('\n'))
  const failed = rows.filter((r) => r.result === 'FAIL').length
  console.log(
    `\n${rows.filter((r) => r.result === 'PASS').length} PASS · ${failed} FAIL · ${rows.filter((r) => r.result === 'NOTE').length} NOTE → ${OUT}/phase4-${LABEL}.md`,
  )
  process.exitCode = failed === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
