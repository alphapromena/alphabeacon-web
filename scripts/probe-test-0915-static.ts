/**
 * TEST-0915 · Phase 3 proofs E, F (the static half) and G — measured in the
 * MOVING state on a STATIC dev server (no API, zero network), on the
 * DEMO-0914 seeded review world a fresh account lands in.
 *
 *   E · axe during every moment and with the Approve toast up; the toast
 *       description's contrast, computed; an entrance-window scan of every app
 *       screen; first light once per account, never on reload, under the
 *       2000 ms ceiling, recorded before it ends, a throwing storage → seen,
 *       reduced motion → not mounted; the skeleton threshold; the reduced-
 *       motion collapse with no control lost.
 *   F · the seeded world's Connections and Analytics copy, and what the
 *       Connect flow does.
 *   G · the press state's token and its ratio; `--c-accent-lo` absent from
 *       the app's own root; the gold nav indicator is one element that travels.
 *
 * Every check writes PASS/FAIL/NOTE with the measured value into
 * `<out>/proofs-static.md`. In-page code that declares inner functions is
 * passed as a STRING (tsx's keepNames helper is not in the page).
 *
 * Usage:
 *   pnpm exec tsx scripts/probe-test-0915-static.ts --base <static dev server> --out Docs/qa/test-0915/proofs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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
const OUT = arg('out')
const PROOFS = arg('proofs', 'firstlight,moving,reduced').split(',')
const LABEL = arg('label', 'static')
const WCAG = ['wcag2a', 'wcag2aa']

interface Row {
  proof: string
  check: string
  result: 'PASS' | 'FAIL' | 'NOTE'
  detail: string
}
const rows: Row[] = []
const record = (proof: string, check: string, ok: boolean, detail: string) => {
  rows.push({ proof, check, result: ok ? 'PASS' : 'FAIL', detail })
  console.log(`[${proof}] ${ok ? 'PASS' : 'FAIL'} · ${check} · ${detail}`)
}
const note = (proof: string, check: string, detail: string) => {
  rows.push({ proof, check, result: 'NOTE', detail })
  console.log(`[${proof}] NOTE · ${check} · ${detail}`)
}

const stampOf = () =>
  `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`

async function go(page: Page, path: string, settle = 700) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  if (settle > 0) await page.waitForTimeout(settle)
}

async function activateVisitor(page: Page) {
  await page.goto(`${BASE}/dev/datasets`, { waitUntil: 'domcontentloaded' })
  const visitor = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Visitor (signed out)' })
    .getByRole('button', { name: 'Activate' })
  await visitor.waitFor({ state: 'visible', timeout: 60_000 })
  await visitor.click()
  await page.waitForTimeout(400)
}

/** Static signup: the verify screen's "I've verified my email" creates the workspace. */
async function signUp(page: Page, email: string, beforeVerify?: () => Promise<void>) {
  await go(page, '/signup')
  await page.getByLabel('Full name').fill('Dana Saif')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Probe-Test-0915!')
  await page.getByLabel('Organization name').fill(`Proof Co ${email.slice(3, 12)}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: /I've verified my email/ }).waitFor({ timeout: 30_000 })
  if (beforeVerify) await beforeVerify()
  await page.getByRole('button', { name: /I've verified my email/ }).click()
}

async function scan(
  page: Page,
  where: string,
): Promise<{ where: string; violations: number; detail: string }> {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  return {
    where,
    violations: result.violations.length,
    detail: result.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}, ${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'}: ${v.nodes[0]?.target.join(' ') ?? ''})`,
      )
      .join('; '),
  }
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
}

/** The first-light observer: insertion, removal and the moment the flag lands, all in page time. */
const FIRST_LIGHT_OBSERVER = (email: string) => `
  (() => {
    const key = 'ab-first-light:' + ${JSON.stringify(email.toLowerCase())};
    window.__fl = { added: -1, removed: -1, keySetAt: -1, keyAtRemove: null, ticks: 0 };
    let poll = null;
    const observer = new MutationObserver(() => {
      const el = document.querySelector('[data-slot="first-light"]');
      if (el && window.__fl.added < 0) {
        window.__fl.added = performance.now();
        poll = setInterval(() => {
          window.__fl.ticks += 1;
          let v = null;
          try { v = localStorage.getItem(key); } catch (e) { v = 'threw'; }
          if (v !== null && window.__fl.keySetAt < 0) { window.__fl.keySetAt = performance.now(); clearInterval(poll); }
        }, 2);
      }
      if (!el && window.__fl.added >= 0 && window.__fl.removed < 0) {
        window.__fl.removed = performance.now();
        try { window.__fl.keyAtRemove = localStorage.getItem(key); } catch (e) { window.__fl.keyAtRemove = 'threw'; }
        if (poll) clearInterval(poll);
      }
    });
    // document itself, not documentElement: an init script runs before that element exists.
    observer.observe(document, { childList: true, subtree: true });
  })()
`

interface FirstLightRead {
  added: number
  removed: number
  keySetAt: number
  keyAtRemove: string | null
}

// ---------------------------------------------------------------- E · first light
async function proofFirstLight(browser: Browser) {
  const email = `qa+${stampOf()}fl@alphapromena.com`
  // 1 — plays once, measured in page time, scanned mid-animation, flag before the end.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.addInitScript({ content: FIRST_LIGHT_OBSERVER(email) })
    try {
      await activateVisitor(page)
      await signUp(page, email)
      const overlay = page.locator('[data-slot="first-light"]')
      const seen = await overlay
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => true)
        .catch(() => false)
      let mid = {
        where: 'moment 2 — first light, mid-animation',
        violations: -1,
        detail: 'overlay never appeared',
      }
      if (seen) {
        await page.waitForTimeout(600)
        mid = await scan(page, 'moment 2 — first light, mid-animation')
        await shot(page, 'proof-e-first-light-mid')
      }
      await overlay.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
      await page.waitForTimeout(200)
      const fl = (await page.evaluate('window.__fl')) as FirstLightRead
      const duration = fl.removed - fl.added
      record(
        'E',
        'first light plays on a fresh account and axe is clean while it is on screen',
        seen && mid.violations === 0,
        `seen: ${seen}; violations mid-animation: ${mid.violations} ${mid.detail}`,
      )
      record(
        'E',
        'first light is under the 2000 ms ceiling (page-time insertion → removal)',
        seen && duration > 0 && duration < 2000,
        `${Math.round(duration)} ms (FIRST_LIGHT_MS is 1800)`,
      )
      record(
        'E',
        'the account flag is written at the start, long before the moment ends',
        seen && fl.keySetAt >= 0 && fl.keySetAt - fl.added < 200,
        `flag landed ${Math.round(fl.keySetAt - fl.added)} ms after the overlay mounted; at removal the key read ${JSON.stringify(fl.keyAtRemove)}`,
      )
      const landed = await page.getByRole('heading', { name: 'Dashboard', level: 1 }).count()
      note(
        'E',
        'where first light resolves',
        landed
          ? 'the Dashboard (the post-verify destination, deliberate — not changed)'
          : 'not the Dashboard',
      )
    } finally {
      await context.close()
    }
  }
  // 2 — the SAME account again: never a second time (the localStorage flag survives the reload of the world).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    try {
      await activateVisitor(page)
      // Plant the flag the first run wrote: a new context has fresh storage, so the
      // once-per-account claim is tested by the flag alone, as a reload would.
      await page.evaluate(
        (k) => window.localStorage.setItem(k, '1'),
        `ab-first-light:${email.toLowerCase()}`,
      )
      await signUp(page, email)
      await page.waitForTimeout(2500)
      const count = await page.locator('[data-slot="first-light"]').count()
      const landed = await page.getByRole('heading', { name: 'Dashboard', level: 1 }).count()
      record(
        'E',
        'an account that has been welcomed is never welcomed again (flag present → no overlay, same landing)',
        count === 0 && landed === 1,
        `overlay count ${count}; Dashboard ${landed}`,
      )
      // And a reload mid-world: the world rebuilds, first light is not armed, nothing replays.
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      const afterReload = await page.locator('[data-slot="first-light"]').count()
      record(
        'E',
        'a reload never replays it',
        afterReload === 0,
        `overlay count after reload ${afterReload}`,
      )
    } finally {
      await context.close()
    }
  }
  // 3 — a storage that THROWS answers "already seen".
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    try {
      await activateVisitor(page)
      const email3 = `qa+${stampOf()}flt@alphapromena.com`
      await signUp(page, email3, async () => {
        await page.evaluate(() => {
          Object.defineProperty(window, 'localStorage', {
            configurable: true,
            get() {
              throw new Error('TEST-0915: storage blocked')
            },
          })
        })
      })
      await page.waitForTimeout(2500)
      const count = await page.locator('[data-slot="first-light"]').count()
      const landed = await page.getByRole('heading', { name: 'Dashboard', level: 1 }).count()
      record(
        'E',
        'a storage that throws counts as already seen: no overlay, and the app still lands',
        count === 0 && landed === 1,
        `overlay count ${count}; Dashboard ${landed}`,
      )
    } finally {
      await context.close()
    }
  }
  // 4 — reduced motion: not mounted at all; the end state is the landing.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      await activateVisitor(page)
      await signUp(page, `qa+${stampOf()}flr@alphapromena.com`)
      await page.waitForTimeout(2500)
      const count = await page.locator('[data-slot="first-light"]').count()
      const landed = await page.getByRole('heading', { name: 'Dashboard', level: 1 }).count()
      record(
        'E',
        'under prefers-reduced-motion first light is not mounted and the landing is the same',
        count === 0 && landed === 1,
        `overlay count ${count}; Dashboard ${landed}`,
      )
    } finally {
      await context.close()
    }
  }
}

// ---------------------------------------------------------------- E · moments, toast, every screen, skeleton, G, F
const TIME_APPROVE = `
  new Promise((resolve) => {
    const cards = Array.from(document.querySelectorAll('[data-slot="card"]'))
    const card = cards.find((c) => Array.from(c.querySelectorAll('button')).some((b) => (b.textContent || '').trim() === 'Approve'))
    if (!card) { resolve(-1); return }
    const button = Array.from(card.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Approve')
    const settled = () => !Array.from(card.querySelectorAll('button')).some((b) => (b.textContent || '').trim() === 'Approve')
    let observer
    const done = (ms) => { if (observer) observer.disconnect(); resolve(ms) }
    observer = new MutationObserver(() => { if (settled()) done(performance.now() - t0) })
    setTimeout(() => done(-2), 10000)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true })
    const t0 = performance.now()
    button.click()
    if (settled()) done(performance.now() - t0)
  })
`

const CONTRAST_OF_TOAST_DESCRIPTION = `
  (() => {
    const lum = (c) => {
      const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(c)
      if (!m) return null
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
      return 0.2126 * f(+m[1]) + 0.7152 * f(+m[2]) + 0.0722 * f(+m[3])
    }
    const toast = document.querySelector('[data-sonner-toast]')
    if (!toast) return { ratio: -1, note: 'no toast' }
    const desc = toast.querySelector('[data-description]')
    if (!desc) return { ratio: -1, note: 'no description' }
    const color = getComputedStyle(desc).color
    let node = desc, bg = 'rgba(0, 0, 0, 0)'
    while (node) {
      const b = getComputedStyle(node).backgroundColor
      if (b && !/rgba\\(\\d+,\\s*\\d+,\\s*\\d+,\\s*0\\)/.test(b) && b !== 'transparent') { bg = b; break }
      node = node.parentElement
    }
    const l1 = lum(color), l2 = lum(bg)
    if (l1 === null || l2 === null) return { ratio: -1, note: 'unparsed ' + color + ' on ' + bg }
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    return { ratio: Math.round(ratio * 100) / 100, color, bg, text: (desc.textContent || '').trim(), title: ((toast.querySelector('[data-title]') || {}).textContent || '').trim() }
  })()
`

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

const NAV_WITH_SKELETON_WATCH = (rail: string, marker: string) => `
  new Promise((resolve) => {
    const link = Array.from(document.querySelectorAll('[data-sidebar="sidebar"] a')).find((a) => (a.textContent || '').trim().indexOf(${JSON.stringify(rail)}) === 0)
    if (!link) { resolve({ ms: -1, skeletonSeen: false }); return }
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
    const done = (ms) => { clearInterval(ticker); if (observer) observer.disconnect(); resolve({ ms, skeletonSeen }) }
    observer = new MutationObserver(() => { watch(); if (arrived()) done(performance.now() - t0) })
    setTimeout(() => done(-2), 15000)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    const t0 = performance.now()
    link.click()
    if (arrived()) done(performance.now() - t0)
  })
`

const REDUCED_MOTION_READ = `
  (() => {
    const root = getComputedStyle(document.documentElement)
    const controls = 'button, a[href], input, select, textarea, [role="button"]'
    const motionEls = Array.from(document.querySelectorAll('[data-ab-motion]'))
    return {
      fast: root.getPropertyValue('--motion-fast').trim(),
      medium: root.getPropertyValue('--motion-medium').trim(),
      slow: root.getPropertyValue('--motion-slow').trim(),
      skeletonDelay: root.getPropertyValue('--skeleton-delay').trim(),
      buttonTransition: Array.from(document.querySelectorAll('main button')).slice(0, 5).map((b) => getComputedStyle(b).transitionDuration),
      motionCount: motionEls.length,
      motionHidden: motionEls.filter((el) => getComputedStyle(el).display === 'none').length,
      controlsInMotion: document.querySelectorAll('[data-ab-motion] ' + controls.split(', ').join(', [data-ab-motion] ')).length + motionEls.filter((el) => el.matches(controls)).length,
      controlCount: document.querySelectorAll(controls).length,
    }
  })()
`

const PRESS_READ = `
  (() => {
    const lum = (c) => {
      const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(c)
      if (!m) return null
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
      return 0.2126 * f(+m[1]) + 0.7152 * f(+m[2]) + 0.0722 * f(+m[3])
    }
    const ratio = (a, b) => { const x = lum(a), y = lum(b); if (x === null || y === null) return -1; return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100 }
    const el = document.querySelector('[data-test0915-press]')
    if (!el) return { note: 'no marked button' }
    const s = getComputedStyle(el)
    const root = getComputedStyle(document.documentElement)
    return { bg: s.backgroundColor, color: s.color, ratio: ratio(s.color, s.backgroundColor), primaryPressed: root.getPropertyValue('--primary-pressed').trim(), accentLo: root.getPropertyValue('--c-accent-lo').trim() }
  })()
`

async function proofMoving(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const scans: { where: string; violations: number; detail: string }[] = []
  try {
    await activateVisitor(page)
    await signUp(page, `qa+${stampOf()}mv@alphapromena.com`)
    const overlay = page.locator('[data-slot="first-light"]')
    await overlay.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {})
    await overlay.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
    await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 15_000 })

    // ---- G · the press state, on the accent button of the Dashboard/Today.
    await go(page, '/today', 900)
    const marked = (await page.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('main button'))
        const accent = buttons.find((b) => getComputedStyle(b).backgroundColor === 'rgb(255, 78, 45)')
        if (!accent) return null
        accent.setAttribute('data-test0915-press', '1')
        const r = accent.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: (accent.textContent || '').trim(), rest: getComputedStyle(accent).backgroundColor }
      })()
    `)) as { x: number; y: number; label: string; rest: string } | null
    if (marked) {
      await page.mouse.move(marked.x, marked.y)
      await page.mouse.down()
      await page.waitForTimeout(200)
      const pressed = (await page.evaluate(PRESS_READ)) as {
        bg?: string
        color?: string
        ratio?: number
        primaryPressed?: string
        accentLo?: string
        note?: string
      }
      await page.mouse.up()
      await page.waitForTimeout(300)
      record(
        'G',
        'the press state steps the accent down its own ramp (--primary-pressed #e84122) and the label still clears AA',
        pressed.bg === 'rgb(232, 65, 34)' &&
          (pressed.ratio ?? 0) >= 4.5 &&
          pressed.primaryPressed === '#e84122',
        `"${marked.label}" at rest ${marked.rest}, pressed ${pressed.bg}, label ${pressed.color}, ratio ${pressed.ratio}:1; --primary-pressed = ${pressed.primaryPressed}`,
      )
      record(
        'G',
        "the website's --c-accent-lo (4.49:1) is not defined on the app's root",
        (pressed.accentLo ?? '') === '',
        `--c-accent-lo on :root = ${JSON.stringify(pressed.accentLo)}`,
      )
    } else {
      record(
        'G',
        'an accent button exists on Today to press',
        false,
        'no button with the accent fill found',
      )
    }

    // ---- G · the gold nav indicator: one element, and it travels.
    const indicatorSel = '[data-sidebar="sidebar"] [data-slot="nav-indicator"]'
    const before = (await page.evaluate(`
      (() => {
        const els = Array.from(document.querySelectorAll('${indicatorSel}'))
        if (els[0]) els[0].setAttribute('data-test0915-indicator', '1')
        return { count: els.length, transform: els[0] ? getComputedStyle(els[0]).transform : null, active: document.querySelectorAll('[data-sidebar="sidebar"] [data-active="true"]').length }
      })()
    `)) as { count: number; transform: string | null; active: number }
    const positions: string[] = [before.transform ?? 'none']
    let sameNode = true
    for (const rail of ['Studio', 'Billing', 'Settings']) {
      await page
        .locator('[data-sidebar="sidebar"]')
        .getByRole('link', { name: new RegExp(`^${rail}`) })
        .first()
        .click()
      await page.waitForTimeout(500)
      const now = (await page.evaluate(`
        (() => {
          const els = Array.from(document.querySelectorAll('${indicatorSel}'))
          return { count: els.length, transform: els[0] ? getComputedStyle(els[0]).transform : null, same: els.length === 1 && els[0].hasAttribute('data-test0915-indicator') }
        })()
      `)) as { count: number; transform: string | null; same: boolean }
      positions.push(now.transform ?? 'none')
      if (!now.same || now.count !== 1) sameNode = false
    }
    const distinct = new Set(positions).size
    record(
      'G',
      'the gold navigation indicator is ONE element in the rail, and the same node travels between routes',
      before.count === 1 && sameNode && distinct >= 3,
      `count ${before.count}; same node across 3 moves: ${sameNode}; transforms: ${positions.join(' → ')}`,
    )

    // ---- G · the indicator's MOTION, sampled at 8 ms: the same node sliding, or a new node placed silently?
    const NAV_SAMPLE = (scope: 'rail' | 'tabs', target: string) => `
      new Promise((resolve) => {
        const inRail = (el) => !!el.closest('[data-sidebar="sidebar"]')
        const find = () => Array.from(document.querySelectorAll('[data-slot="nav-indicator"]')).find((el) => ${scope === 'rail' ? 'inRail(el)' : '!inRail(el)'})
        const before = find()
        if (before) before.setAttribute('data-test0915-node', 'before')
        const control = ${
          scope === 'rail'
            ? `Array.from(document.querySelectorAll('[data-sidebar="sidebar"] a')).find((a) => (a.textContent || '').trim().indexOf(${JSON.stringify(target)}) === 0)`
            : `Array.from(document.querySelectorAll('[role="tab"]')).find((a) => (a.textContent || '').trim() === ${JSON.stringify(target)})`
        }
        if (!control) { resolve({ error: 'no control' }); return }
        const samples = []
        const t0 = performance.now()
        const tick = () => {
          const el = find()
          const s = el ? getComputedStyle(el) : null
          samples.push({ t: Math.round(performance.now() - t0), node: el ? (el.getAttribute('data-test0915-node') || 'new') : 'none', placed: el ? el.getAttribute('data-placed') : null, opacity: s ? s.opacity : null, transform: s ? s.transform : null })
          if (performance.now() - t0 < 450) setTimeout(tick, 8); else resolve(samples)
        }
        control.click()
        tick()
      })
    `
    type NavSample = {
      t: number
      node: string
      placed: string | null
      opacity: string | null
      transform: string | null
    }
    const describeMotion = (samples: NavSample[]) => {
      const present = samples.filter((s) => s.node !== 'none')
      const sameNode = present.every((s) => s.node === 'before')
      const transforms = [...new Set(present.map((s) => s.transform))]
      const placedFalse = present.some((s) => s.placed === 'false')
      const faded = present.some((s) => Number(s.opacity) < 1)
      const firstNew = samples.find((s) => s.node === 'new')
      return {
        sameNode,
        transforms: transforms.length,
        placedFalse,
        faded,
        firstNewAt: firstNew ? firstNew.t : -1,
        summary: `same node: ${sameNode}; distinct transforms: ${transforms.length} (${transforms.slice(0, 4).join(' | ')}); placed=false seen: ${placedFalse}; opacity<1 seen: ${faded}; first new node at ${firstNew ? `${firstNew.t} ms` : 'never'}`,
      }
    }
    await go(page, '/', 500)
    const railMove = describeMotion(
      (await page.evaluate(NAV_SAMPLE('rail', 'Today'))) as NavSample[],
    )
    await page.waitForTimeout(500)
    const railMove2 = describeMotion(
      (await page.evaluate(NAV_SAMPLE('rail', 'Billing'))) as NavSample[],
    )
    record(
      'G',
      'the rail indicator SLIDES between screens (the same node, intermediate transforms) rather than re-mounting and fading in',
      railMove.sameNode &&
        railMove.transforms >= 3 &&
        railMove2.sameNode &&
        railMove2.transforms >= 3,
      `Dashboard → Today: ${railMove.summary} · Today → Billing: ${railMove2.summary}`,
    )
    await go(page, '/settings', 800)
    const tabMove = describeMotion(
      (await page.evaluate(NAV_SAMPLE('tabs', 'Brand voice'))) as NavSample[],
    )
    await page.waitForTimeout(500)
    const tabMove2 = describeMotion(
      (await page.evaluate(NAV_SAMPLE('tabs', 'Tones'))) as NavSample[],
    )
    record(
      'G',
      'the settings sub-nav indicator SLIDES between tabs (the same node, intermediate transforms)',
      tabMove.sameNode && tabMove.transforms >= 3 && tabMove2.sameNode && tabMove2.transforms >= 3,
      `Organization → Brand voice: ${tabMove.summary} · Brand voice → Tones: ${tabMove2.summary}`,
    )

    if (!PROOFS.includes('moving')) return scans

    // ---- E · moment 1: the tone sample, at rest and mid-rewrite.
    await go(page, '/calendar/settings', 1_200)
    scans.push(await scan(page, 'moment 1 — schedule, tone sample at rest'))
    const toneButtons = page
      .locator('fieldset', { hasText: 'Drafts rotate through' })
      .locator('button[aria-pressed]')
    let sampleSeen = false
    if ((await toneButtons.count()) > 1) {
      await toneButtons.nth(1).click()
      await page.waitForTimeout(120)
      await toneButtons.nth(1).click()
      await page.waitForTimeout(90)
      scans.push(await scan(page, 'moment 1 — mid-rewrite'))
      sampleSeen = (await page.locator('[data-slot="tone-sample"]').count()) > 0
      await shot(page, 'proof-e-moment-1-mid-rewrite')
    }
    record(
      'E',
      'moment 1 (tone sample) rewrites beside the picker and axe is clean at rest and mid-rewrite',
      sampleSeen && scans.slice(-2).every((s) => s.violations === 0),
      scans
        .slice(-2)
        .map((s) => `${s.where}: ${s.violations} ${s.detail}`)
        .join(' · '),
    )

    // ---- E · moment 4: generating, mid-stage.
    await go(page, '/generate', 1_000)
    const prompt = page.getByLabel('Prompt')
    let stageLine = ''
    if ((await prompt.count()) > 0) {
      await prompt.fill('A short note on how we decide what to publish')
      await page.getByRole('button', { name: 'Generate', exact: true }).click()
      await page.waitForTimeout(500)
      stageLine =
        (await page.locator('main').innerText()).split('\n').find((l) => l.includes('…')) ?? ''
      scans.push(await scan(page, 'moment 4 — generating, mid-stage'))
      await shot(page, 'proof-e-moment-4-mid-stage')
      await page.waitForTimeout(2_500)
    }
    record(
      'E',
      'moment 4 (generating) shows an honest stage line, no percentage, and axe is clean mid-stage',
      stageLine.length > 0 &&
        !/\d+\s*%/.test(stageLine) &&
        scans[scans.length - 1].violations === 0,
      `stage: "${stageLine.trim()}"; ${scans[scans.length - 1].where}: ${scans[scans.length - 1].violations} ${scans[scans.length - 1].detail}`,
    )

    // ---- E · moment 3: approve, timed, scanned mid-animation, and with the toast up.
    const timings: number[] = []
    let toastRead: {
      ratio: number
      color?: string
      bg?: string
      text?: string
      title?: string
      note?: string
    } = { ratio: -1, note: 'not read' }
    for (let run = 0; run < 3; run++) {
      await go(page, '/today', 900)
      const ms = (await page.evaluate(TIME_APPROVE)) as number
      if (ms >= 0) timings.push(ms)
      if (run === 0) {
        await page.waitForTimeout(80)
        scans.push(await scan(page, 'moment 3 — approve, mid-animation'))
        await page
          .locator('[data-sonner-toast]')
          .first()
          .waitFor({ state: 'visible', timeout: 3_000 })
          .catch(() => {})
        toastRead = (await page.evaluate(CONTRAST_OF_TOAST_DESCRIPTION)) as typeof toastRead
        scans.push(await scan(page, 'moment 3 — Approve toast up'))
        await shot(page, 'proof-e-moment-3-toast-up')
      }
      await page.waitForTimeout(400)
    }
    const median = [...timings].sort((a, b) => a - b)[Math.floor(timings.length / 2)] ?? -1
    record(
      'E',
      'moment 3 (approve) settles without costing the click, and axe is clean mid-animation',
      timings.length === 3 &&
        median < 100 &&
        scans.find((s) => s.where.startsWith('moment 3 — approve'))!.violations === 0,
      `click → settled: n=${timings.length}, median ${Math.round(median)} ms (${timings.map((t) => Math.round(t)).join(', ')}); ${scans.find((s) => s.where.startsWith('moment 3 — approve'))!.detail || 'no violations'}`,
    )
    const toastScan = scans.find((s) => s.where === 'moment 3 — Approve toast up')!
    record(
      'E',
      'with the Approve toast up axe is clean and the description clears AA (was 1.46:1 before D-MOTION-0914-L)',
      toastScan.violations === 0 && toastRead.ratio >= 4.5,
      `toast "${toastRead.title ?? ''}" / "${toastRead.text ?? ''}": ${toastRead.color} on ${toastRead.bg} = ${toastRead.ratio}:1 ${toastRead.note ?? ''}; violations ${toastScan.violations} ${toastScan.detail}`,
    )

    // ---- E · every app screen, scanned INSIDE the 220 ms content entrance.
    const routes = [
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
      '/billing/plans',
      '/billing/subscription',
      '/billing/balance',
      '/generate',
      '/analytics',
      '/settings',
      '/settings/organization',
      '/settings/brand-voice',
      '/settings/tones',
      '/settings/sources',
      '/settings/knowledge',
      '/settings/team',
    ]
    const entrance: string[] = []
    let entranceRed = 0
    for (const route of routes) {
      await go(page, '/', 300)
      await go(page, route, 0)
      const s = await scan(page, `entrance ${route}`)
      if (s.violations > 0) entranceRed += 1
      entrance.push(`${route}: ${s.violations}${s.detail ? ` (${s.detail})` : ''}`)
    }
    record(
      'E',
      `every app screen scans clean while its content entrance is in flight (${routes.length} routes)`,
      entranceRed === 0,
      entrance.join(' · '),
    )

    // ---- E · the skeleton threshold: mounted at the true start, painted only after 220 ms.
    await go(page, '/dev/states', 600)
    await page.getByRole('radio', { name: /^Loading/ }).click()
    await page.evaluate(SKELETON_WATCH_START)
    await go(page, '/today', 0)
    await page.waitForTimeout(1200)
    const sk = (await page.evaluate('window.__sk')) as {
      mountAt: number
      visibleAt: number
      busyAtMount: string | null
      samples: number
    }
    const delay = sk.visibleAt - sk.mountAt
    record(
      'E',
      'a waiting screen mounts role="status" + aria-busy at the true start and paints nothing before 220 ms',
      sk.mountAt >= 0 &&
        sk.busyAtMount === 'true' &&
        sk.visibleAt >= 0 &&
        delay >= 200 &&
        delay < 400,
      `aria-busy at mount: ${sk.busyAtMount}; first paint above 2% opacity ${Math.round(delay)} ms after mount (4 ms polling, ${sk.samples} samples)`,
    )
    await shot(page, 'proof-e-skeleton-held')
    await page.evaluate('clearInterval(window.__skTimer)')
    await go(page, '/dev/states', 600)
    await page.getByRole('radio', { name: /^Normal/ }).click()
    await go(page, '/', 600)

    // ---- F (static) · Connections and Analytics in the seeded world, and the Connect flow.
    await go(page, '/connections', 800)
    const preview = await page
      .getByText('Connecting walks the flow, but no channel is linked to a platform yet')
      .count()
    const statusesBefore = await page.locator('main [data-slot="badge"]').allInnerTexts()
    record(
      'F',
      'STATIC Connections says what is true',
      preview === 1,
      `notice present: ${preview === 1}; status badges before: ${JSON.stringify(statusesBefore)}`,
    )
    const connect = page
      .locator('button:not([disabled])')
      .filter({ hasText: /^Connect$/ })
      .first()
    if ((await connect.count()) > 0) {
      await connect.click()
      await page.waitForTimeout(600)
      const midUrl = page.url().replace(/^https?:\/\/[^/]+/, '')
      const midText = (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 200)
      await shot(page, 'proof-f-static-connect-mid')
      await page.waitForTimeout(1600)
      const toasts = await page.locator('[data-sonner-toast]').allInnerTexts()
      const badges = await page.locator('main [data-slot="badge"]').allInnerTexts()
      const afterText = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      const claimsConnected =
        toasts.some((x) => /connected/i.test(x)) ||
        /Posting and analytics are on/.test(toasts.join(' ')) ||
        badges.some((b) => /^(Connected|Active)$/i.test(b.trim()))
      record(
        'F',
        'the Connect flow never shows a success state (STATIC)',
        !claimsConnected,
        `mid-flow url ${midUrl}: "${midText}"; after 2.2 s: toasts ${JSON.stringify(toasts)}; status badges ${JSON.stringify(badges)}; "connected" in the card text: ${/connected/i.test(afterText)}`,
      )
      await shot(page, 'proof-f-static-connect-after')
    }
    await go(page, '/analytics', 800)
    const analyticsTitle = await page.getByText('Analytics arrive with publishing').count()
    const goTo = await page.getByRole('button', { name: /Go to Connections/ }).count()
    const mainButtons = await page.locator('main button').allInnerTexts()
    record(
      'F',
      'STATIC Analytics says what is true and asks for no work',
      analyticsTitle >= 1 && goTo === 0,
      `title present: ${analyticsTitle >= 1}; "Go to Connections": ${goTo}; buttons in main: ${JSON.stringify(mainButtons)}`,
    )
    await shot(page, 'proof-f-static-analytics')
  } catch (error) {
    record('E/F/G', 'the moving-state proof ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'proof-e-error').catch(() => {})
  } finally {
    await context.close()
  }
  return scans
}

// ---------------------------------------------------------------- E · reduced motion
async function proofReducedMotion(browser: Browser) {
  const normal: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const reduced: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  try {
    const setup = async (context: BrowserContext) => {
      const page = await context.newPage()
      await activateVisitor(page)
      await signUp(page, `qa+${stampOf()}rm@alphapromena.com`)
      const overlay = page.locator('[data-slot="first-light"]')
      await overlay.waitFor({ state: 'visible', timeout: 4_000 }).catch(() => {})
      await overlay.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
      await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 15_000 })
      await go(page, '/today', 900)
      return page
    }
    const pageN = await setup(normal)
    const pageR = await setup(reduced)
    type Read = {
      fast: string
      medium: string
      slow: string
      skeletonDelay: string
      buttonTransition: string[]
      motionCount: number
      motionHidden: number
      controlsInMotion: number
      controlCount: number
    }
    const n = (await pageN.evaluate(REDUCED_MOTION_READ)) as Read
    const r = (await pageR.evaluate(REDUCED_MOTION_READ)) as Read
    record(
      'E',
      'under reduced motion every duration in the scale collapses to 0ms and every transition to 0s; the skeleton threshold does not',
      r.fast === '0ms' &&
        r.medium === '0ms' &&
        r.slow === '0ms' &&
        r.buttonTransition.every((t) => t.split(',').every((x) => x.trim() === '0s')) &&
        r.skeletonDelay === n.skeletonDelay &&
        n.fast === '120ms',
      `reduced: fast ${r.fast}, medium ${r.medium}, slow ${r.slow}, skeleton-delay ${r.skeletonDelay}, button transitions ${JSON.stringify(r.buttonTransition)}; normal: fast ${n.fast}, medium ${n.medium}, slow ${n.slow}, skeleton-delay ${n.skeletonDelay}`,
    )
    record(
      'E',
      'under reduced motion every data-ab-motion element is removed, none of them is or contains a control, and no control disappears',
      r.motionHidden === r.motionCount &&
        r.controlsInMotion === 0 &&
        n.controlsInMotion === 0 &&
        r.controlCount === n.controlCount,
      `Today controls: ${n.controlCount} normal vs ${r.controlCount} reduced; data-ab-motion elements: ${r.motionCount} (hidden ${r.motionHidden}); controls inside/at data-ab-motion: ${n.controlsInMotion} / ${r.controlsInMotion}`,
    )

    // The approve settle collapses to its end state: the card reports approved at once.
    const ms = (await pageR.evaluate(TIME_APPROVE)) as number
    await pageR.waitForTimeout(150)
    const endState = (await pageR.evaluate(`
      (() => {
        const el = document.querySelector('[data-ab-approving="true"]')
        const s = el ? getComputedStyle(el) : null
        return { approving: !!el, animation: s ? s.animationDuration : null, transform: s ? s.transform : null, opacity: s ? s.opacity : null, approvedBadge: Array.from(document.querySelectorAll('main [data-slot="badge"]')).some((b) => /approved/i.test(b.textContent || '')) }
      })()
    `)) as {
      approving: boolean
      animation: string | null
      transform: string | null
      opacity: string | null
      approvedBadge: boolean
    }
    record(
      'E',
      'under reduced motion the approve settle is its end state at once (0s animation, no fade, the card still there)',
      ms >= 0 &&
        ms < 100 &&
        (!endState.approving || (endState.animation === '0s' && endState.opacity === '1')),
      `click → settled ${Math.round(ms)} ms; [data-ab-approving] present: ${endState.approving}, animation-duration ${endState.animation}, opacity ${endState.opacity}, transform ${endState.transform}; Approved badge: ${endState.approvedBadge}`,
    )
    await shot(pageR, 'proof-e-reduced-motion-approved')

    // A finished screen never flashes a skeleton — under reduced motion too.
    const routes: { rail: string; marker: string }[] = [
      { rail: 'Today', marker: 'ready for review' },
      { rail: 'Billing', marker: 'Malaky Business' },
      { rail: 'Settings', marker: 'Brand setup' },
      { rail: 'Studio', marker: 'Your renders' },
      { rail: 'Calendar', marker: 'Schedule settings' },
    ]
    const flashes: string[] = []
    let flashed = 0
    for (const route of routes) {
      await go(pageR, '/', 500)
      const result = (await pageR.evaluate(NAV_WITH_SKELETON_WATCH(route.rail, route.marker))) as {
        ms: number
        skeletonSeen: boolean
      }
      if (result.skeletonSeen) flashed += 1
      flashes.push(
        `${route.rail}: ${Math.round(result.ms)} ms, skeleton ${result.skeletonSeen ? 'SEEN' : 'not seen'}`,
      )
    }
    record(
      'E',
      'under reduced motion a finished screen never flashes a skeleton (five routes, seeded world)',
      flashed === 0,
      flashes.join(' · '),
    )
  } catch (error) {
    record('E', 'the reduced-motion proof ran to the end', false, String(error).slice(0, 300))
  } finally {
    await normal.close()
    await reduced.close()
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const startedAt = new Date().toISOString()
  let scans: { where: string; violations: number; detail: string }[] = []
  try {
    if (PROOFS.includes('firstlight')) await proofFirstLight(browser)
    if (PROOFS.includes('moving') || PROOFS.includes('nav')) scans = await proofMoving(browser)
    if (PROOFS.includes('reduced')) await proofReducedMotion(browser)
  } finally {
    await browser.close()
  }
  const doc = [
    '# TEST-0915 — proofs E, F (static) and G, measured in the moving state',
    '',
    `- app: \`${BASE}\` (a STATIC dev server; zero network) · seeded DEMO-0914 review world · started ${startedAt}`,
    '',
    '| Proof | Check | Result | Detail |',
    '| --- | --- | --- | --- |',
    ...rows.map(
      (r) => `| ${r.proof} | ${r.check} | **${r.result}** | ${r.detail.replace(/\|/g, '\\|')} |`,
    ),
    '',
    '## axe — WCAG 2 A + AA, scanned DURING each moment',
    '',
    '| Where | Violations | Detail |',
    '| --- | --- | --- |',
    ...scans
      .filter((s) => !s.where.startsWith('entrance'))
      .map((s) => `| ${s.where} | **${s.violations}** | ${s.detail || '—'} |`),
    '',
  ].join('\n')
  writeFileSync(`${OUT}/proofs-${LABEL}.md`, doc, 'utf8')
  console.log(`\nwritten ${OUT}/proofs-${LABEL}.md`)
  const failed = rows.filter((r) => r.result === 'FAIL').length
  console.log(
    `${rows.filter((r) => r.result === 'PASS').length} PASS · ${failed} FAIL · ${rows.filter((r) => r.result === 'NOTE').length} NOTE`,
  )
  process.exit(failed ? 1 : 0)
}

void main()
