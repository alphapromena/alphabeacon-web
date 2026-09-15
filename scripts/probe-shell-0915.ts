/**
 * Item 77's clocks (ORDER-SHELL-0915): the route arrivals TEST-0915 measured at
 * 53–90 ms — proof E on the static dev server: from `/`, click a rail link,
 * until `main` carries the screen's own text — re-measured the same way
 * before and after the shell became a layout route. Normal and reduced
 * motion, three runs per route, min / median / max per mode; and, as
 * information beside the clocks, whether the rail's indicator is the same DOM
 * node after each hop (the assertion itself is `e2e/shell-identity.spec.ts`).
 *
 *   pnpm exec tsx scripts/probe-shell-0915.ts --base <static dev server> --out Docs/qa/shell-0915 --label before
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Browser, type Page } from '@playwright/test'

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
const LABEL = arg('label', 'after')
const RUNS = Number(arg('runs', '3'))
/** The post-A2 range TEST-0915 recorded; a median above it is the hard stop. */
const RANGE = { min: 53, max: 90 }

/**
 * The five routes proof E timed, with the seeded world's own text as the arrival
 * mark. Today's is 'Needs review' rather than proof E's 'ready for review': the
 * Dashboard's notifications carry the latter, so that hop read as arrived at once.
 */
const ROUTES: { rail: string; marker: string }[] = [
  { rail: 'Today', marker: 'Needs review' },
  { rail: 'Billing', marker: 'Malaky Business' },
  { rail: 'Settings', marker: 'Brand setup' },
  { rail: 'Studio', marker: 'Your renders' },
  { rail: 'Calendar', marker: 'Schedule settings' },
]

/** proof E's clock, verbatim in shape: click → the marker in `main`, in page time. */
const navAndTime = (rail: string, marker: string) => `
  new Promise((resolve) => {
    const link = Array.from(document.querySelectorAll('[data-sidebar="sidebar"] a')).find((a) => (a.textContent || '').trim().indexOf(${JSON.stringify(rail)}) === 0)
    if (!link) { resolve({ ms: -1, sameIndicator: null }); return }
    const before = document.querySelector('[data-slot="nav-indicator"]')
    const arrived = () => ((document.querySelector('main') || {}).textContent || '').indexOf(${JSON.stringify(marker)}) >= 0
    let observer
    const done = (ms) => {
      if (observer) observer.disconnect()
      const after = document.querySelector('[data-slot="nav-indicator"]')
      resolve({ ms, sameIndicator: before !== null && before === after })
    }
    observer = new MutationObserver(() => { if (arrived()) done(performance.now() - t0) })
    setTimeout(() => done(-2), 15000)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    const t0 = performance.now()
    link.click()
    if (arrived()) done(performance.now() - t0)
  })
`

interface Hop {
  rail: string
  ms: number
  sameIndicator: boolean | null
}

/**
 * Back to the Dashboard the way proof E went: a client-side navigation
 * (pushState + popstate), never a reload — a reload re-validates every module
 * of the next screen's chunk against the dev server and measures the network,
 * not the route (≈350 ms against ≈70 warm on this machine). The first visit
 * of a context is a real load.
 */
async function home(page: Page, first: boolean) {
  if (first) await page.goto(`${BASE}/`, { waitUntil: 'load' })
  else
    await page.evaluate(() => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 15_000 })
  await page.waitForTimeout(500)
}

async function measure(browser: Browser, reducedMotion: 'reduce' | 'no-preference') {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  })
  const page = await context.newPage()
  const hops: Hop[] = []
  let first = true
  for (let run = 0; run < RUNS; run += 1) {
    for (const route of ROUTES) {
      await home(page, first)
      first = false
      const result = (await page.evaluate(navAndTime(route.rail, route.marker))) as {
        ms: number
        sameIndicator: boolean | null
      }
      hops.push({ rail: route.rail, ms: result.ms, sameIndicator: result.sameIndicator })
    }
  }
  await context.close()
  return hops
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    min: sorted[0] ?? -1,
    median: sorted[Math.floor(sorted.length / 2)] ?? -1,
    max: sorted[sorted.length - 1] ?? -1,
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const normal = await measure(browser, 'no-preference')
  const reduced = await measure(browser, 'reduce')
  await browser.close()

  const lines: string[] = [
    `# Item 77 — route arrivals, ${LABEL} (${new Date().toISOString()})`,
    '',
    `Base: ${BASE} · from \`/\` (Dashboard), click a rail link, until \`main\` carries the screen's text — proof E's clock; ${RUNS} runs per route per mode. TEST-0915's range: ${RANGE.min}–${RANGE.max} ms.`,
    '',
  ]
  const checks: { check: string; ok: boolean; detail: string }[] = []
  for (const [name, hops] of [
    ['motion', normal],
    ['reduced motion', reduced],
  ] as const) {
    lines.push(
      `## ${name}`,
      '',
      '| rail | runs (ms) | min | median | max | same indicator node |',
      '|---|---|---|---|---|---|',
    )
    const all: number[] = []
    for (const route of ROUTES) {
      const mine = hops.filter((h) => h.rail === route.rail)
      const ms = mine.map((h) => Math.round(h.ms))
      const valid = ms.filter((m) => m >= 0)
      all.push(...valid)
      const s = stats(valid)
      const same = mine
        .map((h) => (h.sameIndicator === null ? '?' : h.sameIndicator ? 'yes' : 'NO'))
        .join(' ')
      lines.push(
        `| ${route.rail} | ${ms.join(', ')} | ${s.min} | ${s.median} | ${s.max} | ${same} |`,
      )
    }
    const s = stats(all)
    lines.push(
      '',
      `All hops: min ${s.min} · median ${s.median} · max ${s.max} ms (n=${all.length})`,
      '',
    )
    checks.push({
      check: `${name}: every hop arrived (no timeout)`,
      ok: hops.every((h) => h.ms >= 0),
      detail: `${hops.filter((h) => h.ms < 0).length} timed out`,
    })
    checks.push({
      check: `${name}: the median arrival stays inside TEST-0915's ${RANGE.min}–${RANGE.max} ms (the hard stop is a regression ABOVE it)`,
      ok: s.median <= RANGE.max,
      detail: `median ${s.median} ms, max ${s.max} ms`,
    })
    checks.push({
      check: `${name}: the indicator is the same node after every hop`,
      ok: hops.every((h) => h.sameIndicator === true),
      detail: `${hops.filter((h) => h.sameIndicator !== true).length} of ${hops.length} hops re-created it`,
    })
  }
  lines.push('## Checks', '', '| check | result | detail |', '|---|---|---|')
  for (const c of checks) lines.push(`| ${c.check} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail} |`)
  lines.push('')
  writeFileSync(`${OUT}/timings-${LABEL}.md`, lines.join('\n'))
  writeFileSync(
    `${OUT}/timings-${LABEL}.json`,
    JSON.stringify({ base: BASE, label: LABEL, normal, reduced, checks }, null, 2),
  )
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} · ${c.check} · ${c.detail}`)
  console.log(`wrote ${OUT}/timings-${LABEL}.md`)
  process.exitCode = checks.every((c) => c.ok) ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
