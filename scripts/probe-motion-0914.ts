/**
 * ORDER MOTION-0914/A §1 — the motion baseline probe.
 *
 * Measures, in a real browser against the built app, what every interactive
 * surface actually does at rest, under the cursor, and while held down. It
 * asserts nothing; the table it writes is what decides the rest of the order.
 *
 * Measured rather than grepped, deliberately. A Tailwind `transition-all` in a
 * primitive says a transition is DECLARED, not that anything CHANGES — a
 * surface can carry `transition-all` and still be visually identical on hover,
 * which is the exact defect this order exists for. And an unset `duration-*`
 * computes to Tailwind's 150ms default, which no source file says anywhere.
 *
 * Press is measured with the mouse genuinely held down (`mouse.down()` between
 * reads), because `:active` cannot be inferred from source.
 *
 * It runs against the DEV SERVER, not the production build, for one reason:
 * `/dev/states` and `/dev/datasets` are stripped from a PROD bundle
 * (`routes.tsx`), and the skeleton is only reachable through the state
 * switcher. The CSS cascade is identical either way — Tailwind emits the same
 * utilities and production only minifies them — so nothing measured here is a
 * property of the dev build. The world is still the DEMO-0914 seeded one: the
 * probe switches to `visitor`, signs up, and walks the workspace that creates.
 *
 * Usage:
 *   pnpm exec tsx scripts/probe-motion-0914.ts --base <url> --out <dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Locator, type Page } from '@playwright/test'

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

const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, '0')}`

/** The properties that decide whether a surface responds at all. */
const READ = [
  'transitionProperty',
  'transitionDuration',
  'transitionTimingFunction',
  'animationName',
  'animationDuration',
  'backgroundColor',
  'borderColor',
  'color',
  'transform',
  'opacity',
  'boxShadow',
] as const

type Read = Record<(typeof READ)[number], string>

async function readStyles(locator: Locator): Promise<Read> {
  return locator.evaluate(
    (element, props) => {
      const computed = getComputedStyle(element as Element)
      const out: Record<string, string> = {}
      for (const prop of props as string[]) out[prop] = computed[prop as never] as string
      return out as never
    },
    READ as unknown as string[],
  )
}

/** The same read, on a pseudo-element — where both gold nav indicators live. */
async function readPseudo(locator: Locator, which: 'before' | 'after'): Promise<Read> {
  return locator.evaluate(
    (element, payload) => {
      const computed = getComputedStyle(element as Element, `::${payload.which}`)
      const out: Record<string, string> = {}
      for (const prop of payload.props) out[prop] = computed[prop as never] as string
      return out as never
    },
    { which, props: READ as unknown as string[] },
  )
}

interface Surface {
  label: string
  selector: string
  /** Read a pseudo-element instead of the element — where nav indicators live. */
  pseudo?: 'before' | 'after'
  /** Run before measuring — open a menu, force a loading state, navigate. */
  setup?: (page: Page) => Promise<void>
  /** Pressing this one would navigate or submit; measure hover only. */
  hoverOnly?: boolean
}

const SURFACES: Surface[] = [
  { label: 'Button — primary', selector: '[data-slot="button"]' },
  {
    label: 'Button — outline',
    selector: '[data-slot="button"][data-variant="outline"], button.border',
  },
  { label: 'Nav row (rail)', selector: '[data-slot="sidebar-menu-button"]', hoverOnly: true },
  {
    label: 'Nav row — ACTIVE gold rule',
    selector: '[data-slot="sidebar-menu-button"][data-active="true"]',
    pseudo: 'before',
    hoverOnly: true,
  },
  { label: 'Sidebar (the rail itself)', selector: '[data-slot="sidebar"]', hoverOnly: true },
  { label: 'Card', selector: '[data-slot="card"]', hoverOnly: true },
  { label: 'Badge', selector: '[data-slot="badge"]', hoverOnly: true },
  {
    label: 'Input',
    selector: '[data-slot="input"]',
    setup: async (page) => {
      await go(page, '/settings/organization')
    },
  },
  {
    label: 'Textarea',
    selector: '[data-slot="textarea"]',
    setup: async (page) => {
      await go(page, '/settings/organization')
    },
  },
  {
    label: 'Settings sub-nav tab',
    selector: '[role="tab"]',
    setup: async (page) => {
      await go(page, '/settings/organization')
    },
    hoverOnly: true,
  },
  {
    // The `table` primitive is styled by globals.css (zebra, sticky header,
    // tabular figures) and rendered by NO feature — grep says `ui/table.tsx`
    // is imported nowhere. Measured anyway, so the record says so rather than
    // implying the row was missed.
    label: 'Table row',
    selector: '[data-slot="table-body"] tr',
    setup: async (page) => {
      await go(page, '/billing/balance')
    },
    hoverOnly: true,
  },
  {
    label: 'Settings sub-nav — SELECTED gold rule',
    selector: '[role="tab"][aria-selected="true"]',
    pseudo: 'after',
    setup: async (page) => {
      await go(page, '/settings/organization')
    },
    hoverOnly: true,
  },
  {
    label: 'Checkbox',
    selector: '[data-slot="checkbox"]',
    setup: async (page) => {
      await go(page, '/calendar/settings')
    },
  },
  {
    label: 'Switch',
    selector: '[data-slot="switch"]',
    setup: async (page) => {
      await go(page, '/calendar/settings')
    },
  },
  {
    label: 'Draft card (Today)',
    selector: '[data-slot="card"]',
    setup: async (page) => {
      await go(page, '/today')
    },
    hoverOnly: true,
  },
  {
    label: 'Skeleton',
    selector: '[data-slot="skeleton"]',
    setup: async (page) => {
      await go(page, '/dev/states')
      await page
        .getByRole('radio', { name: /loading/i })
        .first()
        .click()
      await go(page, '/today')
    },
    hoverOnly: true,
  },
  {
    label: 'Menu item (account menu)',
    selector: '[data-slot="dropdown-menu-item"]',
    setup: async (page) => {
      await go(page, '/today')
      await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
      await page.waitForTimeout(500)
    },
    hoverOnly: true,
  },
]

/** In-app navigation: a reload throws the seeded static world away. */
async function go(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  await page.waitForTimeout(900)
}

function changed(a: Read, b: Read): string[] {
  return (READ as readonly string[]).filter((key) => a[key as keyof Read] !== b[key as keyof Read])
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // A seeded workspace, because an empty queue has nothing to measure. The dev
  // server boots signed-in on the `active` demo, so the visitor world has to be
  // selected before /signup is even reachable (`SignedOutOnly` redirects).
  await page.goto(`${BASE}/dev/datasets`, { waitUntil: 'domcontentloaded' })
  const visitor = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Visitor (signed out)' })
    .getByRole('button', { name: 'Activate' })
  // WAIT for it rather than counting it. A cold dev server spends seconds in
  // Vite's first transform, and a bare `count()` on an unrendered page reads 0,
  // silently skips the switch and leaves the probe signed into the `active`
  // demo — where /signup redirects away and the run dies somewhere else.
  await visitor.waitFor({ state: 'visible', timeout: 60_000 })
  await visitor.click()
  await page.waitForTimeout(500)
  await go(page, '/signup')
  await page.getByLabel('Full name').fill('Motion Probe')
  await page.getByLabel('Work email').fill(`qa+${stamp}motion@alphapromena.com`)
  await page.getByLabel('Password', { exact: true }).fill('Probe-Motion-0914!')
  await page.getByLabel('Organization name').fill(`Motion Co ${stamp}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: /I've verified my email/ }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/verify-email'), { timeout: 60_000 })
  await page.waitForTimeout(1_500)

  const rows: string[] = []
  for (const surface of SURFACES) {
    await go(page, '/today')
    // A surface that cannot be reached is reported as unreachable, never
    // allowed to end the run and lose every row measured before it.
    if (surface.setup) {
      try {
        await surface.setup(page)
      } catch {
        rows.push(`| ${surface.label} | SETUP FAILED — not reached | — | — | — |`)
        continue
      }
    }

    const locator = page.locator(surface.selector).first()
    if ((await locator.count()) === 0) {
      rows.push(`| ${surface.label} | NOT FOUND (\`${surface.selector}\`) | — | — | — |`)
      continue
    }

    const read = surface.pseudo
      ? (l: Locator) => readPseudo(l, surface.pseudo as 'before' | 'after')
      : readStyles
    const rest = await read(locator)
    await locator.hover({ force: true }).catch(() => {})
    await page.waitForTimeout(400)
    const hover = await read(locator)

    let press: Read | null = null
    if (!surface.hoverOnly) {
      const box = await locator.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(400)
        press = await read(locator)
        await page.mouse.up()
      }
    } else {
      // Held down even on hover-only surfaces — it navigates on RELEASE, and
      // the read happens while the button is still down.
      const box = await locator.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(400)
        press = await read(locator)
        await page.mouse.up()
        await page.waitForTimeout(400)
      }
    }

    const hoverDelta = changed(rest, hover)
    const pressDelta = press ? changed(hover, press) : null
    rows.push(
      [
        `| ${surface.label}`,
        `\`${rest.transitionProperty}\` / \`${rest.transitionDuration}\` / \`${rest.transitionTimingFunction}\``,
        rest.animationName === 'none' ? '—' : `\`${rest.animationName} ${rest.animationDuration}\``,
        hoverDelta.length ? hoverDelta.join(', ') : '**nothing**',
        pressDelta === null
          ? 'not measured'
          : pressDelta.length
            ? pressDelta.join(', ')
            : '**nothing**',
        '|',
      ].join(' | '),
    )
  }

  mkdirSync(OUT, { recursive: true })
  const doc = [
    '# MOTION-0914/A §1 — measured motion baseline',
    '',
    `- base: \`${BASE}\` (the dev server — it is the only build carrying /dev/states; seeded workspace)`,
    `- at: ${new Date().toISOString()}`,
    '',
    'Every row is a browser read, not a source grep. **Hover changes** and',
    '**Press changes** list the computed properties that actually differ —',
    'an empty cell means the surface does not respond at all.',
    '',
    '| Surface | transition-property / duration / timing | animation | Hover changes | Press changes (vs hover) |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
  writeFileSync(`${OUT}/baseline.md`, doc, 'utf8')
  console.log(doc)
  await browser.close()
}

void main()
