/**
 * Item 76's proof on the BUILT app (ORDER-FIX-0915): the Approve toast's
 * description during the toast's ENTRANCE.
 *
 * TEST-0915 proof E scanned 80 ms after the Approve click and axe failed the
 * description's contrast: sonner's own entrance — `[data-sonner-toast] {
 * opacity: 0; transition: … opacity 400ms }`, flipped to 1 once mounted —
 * composites the whole toast, text included, over the page at partial opacity
 * for the first frames. This probe measures that, and then the fix:
 *
 *   - the toast's opacity, its transition-property, the description's colour,
 *     the toast's fill and the canvas behind it, sampled IN PAGE TIME at
 *     +40 / +80 / +160 / +400 ms after the click, with the contrast AS RENDERED
 *     (text and fill each composited over the canvas at the toast's opacity)
 *     beside the contrast at rest;
 *   - axe (wcag2a/aa) started 80 ms after a second Approve — proof E's scan;
 *   - a reduced-motion pass: the end state (opacity 1, transform settled) at
 *     the first sample.
 *
 * Against a preview of a build made with `VITE_DEFAULT_DATASET=active`, so the
 * static world boots signed in (the dev routes are not in a build):
 *
 *   VITE_DEFAULT_DATASET=active VITE_API_BASE_URL='' pnpm exec vite build --outDir .gate/probe-dist
 *   pnpm exec vite preview --outDir .gate/probe-dist --port 5197 --strictPort
 *   pnpm exec tsx scripts/probe-fix-0915-toast.ts --base <preview url> --out Docs/qa/fix-0915/item-76 --label after
 *
 * It reads sonner's `[data-description]` to FIND the description; the fix
 * itself touches none of sonner's attributes (CLAUDE.md rule 3, D-FIX-0915-C).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
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
const OFFSETS = [40, 80, 160, 400]
const WCAG = ['wcag2a', 'wcag2aa']
const AA = 4.5

interface Sample {
  t: number
  present: boolean
  opacity: number | null
  transform: string | null
  transitionProperty: string | null
  text: string | null
  fill: string | null
  behind: string | null
  rendered: number | null
  atRest: number | null
}

/**
 * Page-side: click Approve on the first pending card and sample the toast at
 * the offsets, in page time. A string, evaluated as an expression, so the DOM
 * code is not typed against the scripts' tsconfig.
 */
const approveAndSample = (offsets: number[]) => `((offsets) => new Promise((resolve, reject) => {
  const parse = (c) => {
    const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c || '')
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null
  }
  const over = (top, alpha, under) => ({
    r: top.r * alpha + under.r * (1 - alpha),
    g: top.g * alpha + under.g * (1 - alpha),
    b: top.b * alpha + under.b * (1 - alpha),
  })
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b)
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100
  }
  const rgb = (c) => 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')'
  const sample = (t) => {
    const toast = document.querySelector('.cn-toast')
    if (!toast) return { t, present: false, opacity: null, transform: null, transitionProperty: null, text: null, fill: null, behind: null, rendered: null, atRest: null }
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
    let rendered = null, atRest = null
    if (text && fill) {
      const textOnFill = over(text, text.a, fill)
      atRest = ratio(textOnFill, fill)
      rendered = ratio(over(textOnFill, alpha, behind), over(fill, alpha, behind))
    }
    return { t, present: true, opacity: alpha, transform: s.transform, transitionProperty: s.transitionProperty, text: text ? rgb(text) : null, fill: fill ? rgb(fill) : null, behind: rgb(behind), rendered, atRest }
  }
  const cards = Array.from(document.querySelectorAll('[data-slot="card"]'))
  const card = cards.find((c) => Array.from(c.querySelectorAll('button')).some((b) => (b.textContent || '').trim() === 'Approve'))
  const button = card && Array.from(card.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Approve')
  if (!button) return reject(new Error('no Approve button on the queue'))
  const samples = []
  const t0 = performance.now()
  button.click()
  for (const offset of offsets) setTimeout(() => samples.push(sample(Math.round(performance.now() - t0))), offset)
  setTimeout(() => resolve(samples), offsets[offsets.length - 1] + 60)
}))(${JSON.stringify(offsets)})`

async function openToday(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 15_000 })
  await page
    .locator('[data-sidebar="sidebar"]')
    .getByRole('link', { name: /^Today/ })
    .first()
    .click()
  await page.getByRole('heading', { name: 'Today', level: 1 }).waitFor()
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Needs review' })
    .first()
    .waitFor({ timeout: 15_000 })
  // Let the screen's own entrance finish before the toast's is measured.
  await page.waitForTimeout(1200)
}

interface Pass {
  name: string
  samples: Sample[]
  axeAt80: { violations: number; detail: string } | null
}

async function entrancePass(
  browser: Browser,
  reducedMotion: 'reduce' | 'no-preference',
): Promise<Pass> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  })
  const page = await context.newPage()
  await openToday(page)
  const samples = (await page.evaluate(approveAndSample(OFFSETS))) as Sample[]
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/toast-${LABEL}-${reducedMotion}.png` })
  let axeAt80: Pass['axeAt80'] = null
  if (reducedMotion === 'no-preference') {
    // Proof E's scan: axe started 80 ms after a second Approve. The first
    // toast may still be up; the second enters in front of it.
    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Needs review' })
      .first()
      .getByRole('button', { name: 'Approve' })
      .click()
    await page.waitForTimeout(80)
    const result = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    const contrast = result.violations.filter((v) => v.id === 'color-contrast')
    axeAt80 = {
      violations: contrast.length,
      detail: contrast
        .map((v) => `${v.impact}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
        .join('; '),
    }
  }
  await context.close()
  return { name: reducedMotion === 'reduce' ? 'reduced motion' : 'motion', samples, axeAt80 }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const motion = await entrancePass(browser, 'no-preference')
  const reduced = await entrancePass(browser, 'reduce')
  await browser.close()

  const lines: string[] = []
  lines.push(
    `# Item 76 — the Approve toast's entrance, ${LABEL} (built app, ${new Date().toISOString()})`,
    '',
    `Base: ${BASE} · offsets ${OFFSETS.join(' / ')} ms after the click, sampled in page time. "Rendered" is the description over the toast's fill, both composited over the canvas behind the toast at the toast's opacity; "at rest" is the same pair at opacity 1.`,
    '',
  )
  const checks: { check: string; ok: boolean; detail: string }[] = []
  for (const pass of [motion, reduced]) {
    lines.push(`## ${pass.name}`, '')
    lines.push(
      '| t (ms) | toast | opacity | rendered | at rest | text | fill | behind | transform | transition-property |',
    )
    lines.push('|---|---|---|---|---|---|---|---|---|---|')
    for (const s of pass.samples) {
      lines.push(
        `| ${s.t} | ${s.present ? 'present' : 'absent'} | ${s.opacity ?? '—'} | ${s.rendered ?? '—'} | ${s.atRest ?? '—'} | ${s.text ?? '—'} | ${s.fill ?? '—'} | ${s.behind ?? '—'} | ${s.transform ?? '—'} | ${s.transitionProperty ?? '—'} |`,
      )
    }
    lines.push('')
    if (pass.axeAt80) {
      lines.push(
        `axe at +80 ms after a second Approve: **${pass.axeAt80.violations} color-contrast violation(s)**${pass.axeAt80.detail ? ` — ${pass.axeAt80.detail}` : ''}`,
        '',
      )
    }
    const present = pass.samples.filter((s) => s.present)
    const allAA =
      present.length === pass.samples.length && present.every((s) => (s.rendered ?? 0) >= AA)
    checks.push({
      check: `${pass.name}: the description reads ≥ ${AA}:1 as rendered at every offset`,
      ok: allAA,
      detail: pass.samples
        .map(
          (s) => `+${s.t} ms → ${s.present ? `${s.rendered} (opacity ${s.opacity})` : 'no toast'}`,
        )
        .join('; '),
    })
    const noFade =
      present.length > 0 &&
      present.every(
        (s) =>
          !(s.transitionProperty ?? '')
            .split(',')
            .map((p) => p.trim())
            .includes('opacity'),
      )
    checks.push({
      check: `${pass.name}: opacity is not a transitioned property on the toast`,
      ok: noFade,
      detail: present[0]?.transitionProperty ?? 'no toast',
    })
    if (pass.name === 'reduced motion') {
      const first = present[0]
      const settled =
        !!first &&
        first.opacity === 1 &&
        (first.transform === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(first.transform ?? ''))
      checks.push({
        check: 'reduced motion: the end state at the first sample (opacity 1, transform settled)',
        ok: settled,
        detail: first
          ? `+${first.t} ms → opacity ${first.opacity}, transform ${first.transform}`
          : 'no toast',
      })
    } else if (pass.axeAt80) {
      checks.push({
        check: 'axe at +80 ms: no color-contrast violation',
        ok: pass.axeAt80.violations === 0,
        detail: pass.axeAt80.detail || 'clean',
      })
    }
  }
  lines.push('## Checks', '', '| check | result | detail |', '|---|---|---|')
  for (const c of checks) lines.push(`| ${c.check} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail} |`)
  lines.push('')
  writeFileSync(`${OUT}/probe-${LABEL}.md`, lines.join('\n'))
  writeFileSync(
    `${OUT}/probe-${LABEL}.json`,
    JSON.stringify({ base: BASE, label: LABEL, motion, reduced, checks }, null, 2),
  )
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} · ${c.check} · ${c.detail}`)
  console.log(`wrote ${OUT}/probe-${LABEL}.md`)
  process.exitCode = checks.every((c) => c.ok) ? 0 : 1
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
