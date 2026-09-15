/**
 * ORDER MOTION-0914/A2 — click-to-content, measured.
 *
 * How long a routine navigation takes on the DEMO-0914 seeded world, from the
 * instant the rail link is clicked to the instant the destination's own
 * content is in the DOM.
 *
 * BOTH TIMESTAMPS ARE TAKEN INSIDE THE PAGE. `performance.now()` is read on
 * the line before `element.click()`, and a MutationObserver stamps the moment
 * the content marker appears. Driving the click from Playwright and timing it
 * from Node would fold the CDP round trip and Playwright's own polling
 * interval into the measurement — tens of milliseconds of harness, reported as
 * product latency.
 *
 * The marker is a string only the destination renders, not the shell's `h1`:
 * AppShell paints the title immediately on every route, so timing to it would
 * measure nothing at all.
 *
 * Usage:
 *   pnpm exec tsx scripts/probe-navigation-0914.ts --base <url> --out <dir> --label before
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
const OUT = arg('out')
const LABEL = arg('label')
const RUNS = Number.parseInt(arg('runs', '5'), 10)

const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, '0')}`

/** Rail label → a string only that destination's own content carries. */
const ROUTES: { rail: string; path: string; marker: string }[] = [
  { rail: 'Today', path: '/today', marker: 'ready for review' },
  { rail: 'Studio', path: '/studio', marker: 'Your renders' },
  { rail: 'Billing', path: '/billing', marker: 'Malaky Business' },
  { rail: 'Calendar', path: '/calendar', marker: 'Schedule settings' },
  { rail: 'Settings', path: '/settings', marker: 'Brand setup' },
]

interface Sample {
  route: string
  ms: number
  skeletonSeen: boolean
}

/**
 * One navigation, timed from inside the page.
 *
 * Also reports whether a skeleton was ever VISIBLE during the trip — not
 * merely mounted. "Nothing may flash a skeleton for work that is already
 * complete" is a claim about what a person sees, so it is measured as
 * rendered opacity rather than as the presence of a node.
 */
async function timeNavigation(page: Page, rail: string, marker: string): Promise<Sample> {
  /*
   * Passed as a STRING, not a function.
   *
   * tsx compiles this file with esbuild's `keepNames`, which rewrites named
   * functions to carry a `__name(...)` helper. Serialise such a function into
   * the page and the helper is not there: "ReferenceError: __name is not
   * defined", thrown inside the browser. A string is compiled by the page and
   * cannot pick up the build's helpers, so the arguments are interpolated in
   * rather than passed.
   */
  const expression = `
    new Promise((resolve) => {
      const railLabel = ${JSON.stringify(rail)}
      const markerText = ${JSON.stringify(marker)}
      const link = Array.from(document.querySelectorAll('[data-sidebar="sidebar"] a'))
        .find((a) => (a.textContent || '').trim().indexOf(railLabel) === 0)
      if (!link) { resolve({ ms: -1, skeletonSeen: false }); return }

      let skeletonSeen = false
      const watchSkeleton = () => {
        const nodes = document.querySelectorAll('[role="status"][aria-busy="true"]')
        for (const node of nodes) {
          const style = getComputedStyle(node)
          if (style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden') {
            skeletonSeen = true
          }
        }
      }
      const ticker = setInterval(watchSkeleton, 8)
      const arrived = () => ((document.querySelector('main') || {}).textContent || '').indexOf(markerText) >= 0

      let observer
      const done = (ms) => {
        clearInterval(ticker)
        if (observer) observer.disconnect()
        resolve({ ms: ms, skeletonSeen: skeletonSeen })
      }

      observer = new MutationObserver(() => {
        watchSkeleton()
        if (arrived()) done(performance.now() - t0)
      })
      setTimeout(() => done(-2), 15000)
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })

      const t0 = performance.now()
      link.click()
      // A synchronous render finishes before the observer can ever fire.
      if (arrived()) done(performance.now() - t0)
    })
  `
  const result = (await page.evaluate(expression)) as { ms: number; skeletonSeen: boolean }
  return { route: rail, ms: result.ms, skeletonSeen: result.skeletonSeen }
}

/** In-app move: a reload throws the seeded static world away. */
async function go(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  await page.waitForTimeout(700)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(`${BASE}/dev/datasets`, { waitUntil: 'domcontentloaded' })
  const visitor = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Visitor (signed out)' })
    .getByRole('button', { name: 'Activate' })
  await visitor.waitFor({ state: 'visible', timeout: 60_000 })
  await visitor.click()
  await page.waitForTimeout(400)

  await go(page, '/signup')
  await page.getByLabel('Full name').fill('Nav Probe')
  await page.getByLabel('Work email').fill(`qa+${stamp}nav@alphapromena.com`)
  await page.getByLabel('Password', { exact: true }).fill('Probe-Nav-0914!')
  await page.getByLabel('Organization name').fill(`Nav Co ${stamp}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: /I've verified my email/ }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/verify-email'), { timeout: 60_000 })
  await page.waitForTimeout(1_500)

  const samples: Sample[] = []
  for (let run = 0; run < RUNS; run++) {
    for (const route of ROUTES) {
      // Always start from the dashboard, so every sample is the same trip.
      await go(page, '/')
      await page.waitForTimeout(500)
      samples.push(await timeNavigation(page, route.rail, route.marker))
    }
  }

  const rows = ROUTES.map((route) => {
    const mine = samples.filter((s) => s.route === route.rail && s.ms >= 0).map((s) => s.ms)
    const flashed = samples.filter((s) => s.route === route.rail && s.skeletonSeen).length
    const total = samples.filter((s) => s.route === route.rail).length
    return {
      route: route.rail,
      path: route.path,
      n: mine.length,
      median: mine.length ? Math.round(median(mine)) : -1,
      min: mine.length ? Math.round(Math.min(...mine)) : -1,
      max: mine.length ? Math.round(Math.max(...mine)) : -1,
      flashed: `${flashed}/${total}`,
    }
  })

  mkdirSync(OUT, { recursive: true })
  const doc = [
    `# Click to content — ${LABEL}`,
    '',
    `- base: \`${BASE}\` · seeded DEMO-0914 workspace · ${RUNS} runs per route`,
    `- at: ${new Date().toISOString()}`,
    '- both timestamps taken inside the page; the click is dispatched from the same frame',
    '',
    '| Route | Path | n | median ms | min | max | skeleton visible |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.route} | \`${r.path}\` | ${r.n} | **${r.median}** | ${r.min} | ${r.max} | ${r.flashed} |`,
    ),
    '',
  ].join('\n')
  writeFileSync(`${OUT}/click-to-content-${LABEL}.md`, doc, 'utf8')
  console.log(doc)
  await browser.close()
}

void main()
