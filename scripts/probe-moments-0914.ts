/**
 * ORDER MOTION-0914/B — the two measurements the order demands.
 *
 * 1. APPROVE, timed. "This one must not add perceptible time to the click."
 *    Measured the way A2 measured navigation: `performance.now()` on the line
 *    before `element.click()` and again the moment the card reports its new
 *    state, both inside the page, so no CDP round trip is counted as product
 *    latency.
 *
 * 2. AXE, on every screen this order touches, INCLUDING the transient ones.
 *    Phase A shipped a 58-violation contrast hazard inside an opacity fade
 *    that the suite's own scans could not see because it had ended by the time
 *    they ran. So these scans are taken deliberately DURING each moment —
 *    while first light is on screen, while a card is mid-approve, while a run
 *    is mid-stage — which is the only way the same class of fault shows up.
 *
 * Usage:
 *   pnpm exec tsx scripts/probe-moments-0914.ts --base <url> --out <dir> --label after
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'
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
const LABEL = arg('label')
const RUNS = Number.parseInt(arg('runs', '8'), 10)

const WCAG = ['wcag2a', 'wcag2aa']

const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, '0')}`

async function go(page: Page, path: string, settle = 800) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  await page.waitForTimeout(settle)
}

/**
 * One Approve click, timed from inside the page.
 *
 * "Content" for this action is the card's own answer: the Approve button is
 * gone and the approved action row has replaced it. That is the moment the
 * person's decision is visibly theirs, and it is what must not get slower.
 */
async function timeApprove(page: Page): Promise<number> {
  return page.evaluate(`
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
  `) as Promise<number>
}

interface Scan {
  where: string
  violations: number
  detail: string[]
}

async function scan(page: Page, where: string): Promise<Scan> {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  return {
    where,
    violations: result.violations.length,
    detail: result.violations.map(
      (v) => `${v.id} (${v.impact}, ${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`,
    ),
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  const browser = await chromium.launch()
  // A CONTEXT, not `browser.newPage()`: axe-core/playwright refuses a page
  // that was not created from an explicit context.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const scans: Scan[] = []

  await page.goto(`${BASE}/dev/datasets`, { waitUntil: 'domcontentloaded' })
  const visitor = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Visitor (signed out)' })
    .getByRole('button', { name: 'Activate' })
  await visitor.waitFor({ state: 'visible', timeout: 60_000 })
  await visitor.click()
  await page.waitForTimeout(400)

  await go(page, '/signup')
  await page.getByLabel('Full name').fill('Dana Saif')
  await page.getByLabel('Work email').fill(`qa+${stamp}moments@alphapromena.com`)
  await page.getByLabel('Password', { exact: true }).fill('Probe-Moments-0914!')
  await page.getByLabel('Organization name').fill(`Moments Co ${stamp}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: /I've verified my email/ }).click()

  // MOMENT 2, scanned WHILE it is on screen.
  const firstLight = page.locator('[data-slot="first-light"]')
  const sawFirstLight = await firstLight
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false)
  if (sawFirstLight) {
    await page.waitForTimeout(600) // past the beacon, with the words up
    scans.push(await scan(page, 'moment 2 — first light, mid-animation'))
  }
  await firstLight.waitFor({ state: 'detached', timeout: 8_000 }).catch(() => {})
  await page.waitForTimeout(800)

  // MOMENT 1 — the tone picker, then the sample after a rewrite.
  await go(page, '/calendar/settings', 1_200)
  scans.push(await scan(page, 'moment 1 — schedule, tone sample at rest'))
  const toneButtons = page
    .locator('fieldset', { hasText: 'Drafts rotate through' })
    .locator('button[aria-pressed]')
  const toneCount = await toneButtons.count()
  let rewrote = false
  if (toneCount > 1) {
    // Turn one off then another on, so the sample is forced to rewrite.
    await toneButtons.nth(1).click()
    await page.waitForTimeout(120)
    await toneButtons.nth(1).click()
    await page.waitForTimeout(90) // mid-sweep, deliberately
    scans.push(await scan(page, 'moment 1 — mid-rewrite'))
    rewrote = (await page.locator('[data-slot="tone-sample"]').count()) > 0
    await page.waitForTimeout(400)
  }

  // MOMENT 4 — a real run, scanned mid-stage.
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
    await page.waitForTimeout(2_500)
  }

  // MOMENT 3 — Approve, timed, and scanned mid-animation.
  const timings: number[] = []
  for (let run = 0; run < RUNS; run++) {
    await go(page, '/today', 900)
    const ms = await timeApprove(page)
    if (ms >= 0) timings.push(ms)
    if (run === 0) {
      await page.waitForTimeout(80) // inside the settle + sweep
      scans.push(await scan(page, 'moment 3 — approve, mid-animation'))
    }
    await page.waitForTimeout(250)
  }

  mkdirSync(OUT, { recursive: true })
  const doc = [
    `# The four moments — measured (${LABEL})`,
    '',
    `- base: \`${BASE}\` · seeded DEMO-0914 workspace`,
    `- at: ${new Date().toISOString()}`,
    '',
    '## Moment 3 — Approve, click to settled state',
    '',
    timings.length
      ? `| n | median ms | min | max |\n| --- | --- | --- | --- |\n| ${timings.length} | **${Math.round(median(timings))}** | ${Math.round(Math.min(...timings))} | ${Math.round(Math.max(...timings))} |`
      : '_no approvable draft found_',
    '',
    '## axe — WCAG 2 A + AA, scanned DURING each moment',
    '',
    '| Where | Violations | Detail |',
    '| --- | --- | --- |',
    ...scans.map(
      (s) =>
        `| ${s.where} | ${s.violations === 0 ? '**0**' : `**${s.violations}**`} | ${s.detail.join('; ') || '—'} |`,
    ),
    '',
    '## Observed',
    '',
    `- first light reached: ${sawFirstLight ? 'yes' : 'NO'}`,
    `- tone sample present after a rewrite: ${rewrote ? 'yes' : 'NO'}`,
    `- generating stage line on screen: ${stageLine ? `\`${stageLine.trim()}\`` : 'NONE'}`,
    '',
  ].join('\n')
  writeFileSync(`${OUT}/moments-${LABEL}.md`, doc, 'utf8')
  console.log(doc)
  await browser.close()
}

void main()
