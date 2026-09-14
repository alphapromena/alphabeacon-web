/**
 * The contrast guard: proves `tokens.css` meets WCAG AA, and keeps proving it.
 *
 * REWRITTEN for ORDER THEME-0913. The previous file's premises are all void:
 * it read a `.dark` block that no longer exists, matched `oklch()` only (the
 * palette is hex now, so it can be diffed against `marketing.css` by eye), and
 * defended a light-surface `--brand` / `--primary` split for a "signature
 * pink" that has not been in the palette for two orders.
 *
 * What this asserts instead is the system ORDER THEME-0913 approved:
 *   - the four-step graphite ladder is strictly monotonic in lightness,
 *     because elevation IS lightness here (D-THEME-0913-E);
 *   - every text pair clears AA on every surface it may appear on;
 *   - `--subtle-foreground` is BARRED from `--popover` and below — enforced
 *     here rather than in review, which is where it would rot;
 *   - the `bg-X/10 text-X` badge pattern, historically where this palette
 *     broke three separate times;
 *   - `--input` and `--ring` clear the 3:1 non-text bar (WCAG 1.4.11);
 *   - the chart ramp is legible and contains no invented hue;
 *   - accent-to-error hue distance, measured as CIRCULAR distance. The old
 *     file used raw subtraction, which is wrong across the 0°/360° wrap and
 *     would have reported 348° as 348 rather than 12. That bug is fixed here,
 *     not carried forward.
 *
 * axe covers what it can see on a rendered page; this covers the palette
 * itself, including states and surfaces no single screenshot puts side by side.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Rgb = [number, number, number]

const AA_TEXT = 4.5
/** WCAG 1.4.11: boundaries that identify a control, not decorative dividers. */
const AA_NON_TEXT = 3

// --- color math (sRGB <-> OKLCH), matching what the browser computes ---------

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '').trim()
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function luminance([r, g, b]: Rgb) {
  return (
    0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255)
  )
}

function contrast(fg: Rgb, bg: Rgb) {
  const a = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/** Tailwind's `/10` composites in gamma-encoded sRGB, exactly like the browser. */
function composite(color: Rgb, over: Rgb, alpha: number): Rgb {
  return [
    color[0] * alpha + over[0] * (1 - alpha),
    color[1] * alpha + over[1] * (1 - alpha),
    color[2] * alpha + over[2] * (1 - alpha),
  ]
}

/** OKLCH lightness — the axis the whole surface ladder is built on. */
function oklabL([r, g, b]: Rgb) {
  const R = srgbToLinear(r / 255)
  const G = srgbToLinear(g / 255)
  const B = srgbToLinear(b / 255)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

/** OKLCH hue in degrees, normalised to [0, 360). */
function hue([r, g, b]: Rgb) {
  const R = srgbToLinear(r / 255)
  const G = srgbToLinear(g / 255)
  const B = srgbToLinear(b / 255)
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const deg = (Math.atan2(Bb, A) * 180) / Math.PI
  return deg < 0 ? deg + 360 : deg
}

/**
 * Circular hue distance, 0–180. The previous file subtracted raw angles, which
 * is wrong wherever a pair straddles 0°/360° — it would call a 12° gap a 348°
 * one and pass a palette that had silently collapsed.
 */
function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// --- read the real tokens ----------------------------------------------------

// Resolved from the project root: under jsdom `import.meta.url` is not a
// file: URL, so it cannot locate a sibling file.
const CSS = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/**
 * Pulls the `:root` block's hex custom properties. Alpha-carrying values
 * (`--border`, `--scrim`, the line tiers) are skipped on purpose: they have no
 * fixed rendered colour, and the pairs asserted below never need one — where a
 * wash matters it is composited explicitly.
 */
function readTokens(): Record<string, Rgb> {
  const body = CSS.slice(CSS.indexOf(':root'))
  const tokens: Record<string, Rgb> = {}
  const pattern = /--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    tokens[match[1]] = hexToRgb(match[2])
  }
  return tokens
}

const t = readTokens()

/** The ladder, darkest first. Every step is a marketing.css value. */
const LADDER = ['sunken', 'background', 'card', 'muted', 'popover', 'accent'] as const
/** The surfaces a body/label may legitimately sit on. */
const TEXT_SURFACES = ['background', 'card', 'muted', 'popover', 'accent'] as const

describe('the token file parsed', () => {
  it('found the palette', () => {
    // A typo in the selector or a switch back to oklch() would otherwise make
    // every assertion below vacuous.
    expect(Object.keys(t).length).toBeGreaterThan(25)
    for (const required of [
      'background',
      'foreground',
      'primary',
      'card',
      'popover',
      'sunken',
      'muted-foreground',
      'subtle-foreground',
      'destructive',
      'warning',
      'success',
      'brand',
    ]) {
      expect(t[required], `missing --${required}`).toBeDefined()
    }
  })

  it('contains neither pure black nor pure white', () => {
    // Design law: neither appears in the token set.
    for (const [name, rgb] of Object.entries(t)) {
      expect(rgb.join(','), `--${name} is pure black`).not.toBe('0,0,0')
      expect(rgb.join(','), `--${name} is pure white`).not.toBe('255,255,255')
    }
  })
})

describe('elevation is lightness (D-THEME-0913-E)', () => {
  it('the graphite ladder is strictly monotonic', () => {
    const steps = LADDER.map((name) => [name, oklabL(t[name])] as const)
    for (let i = 1; i < steps.length; i++) {
      expect(
        steps[i][1],
        `--${steps[i][0]} (${steps[i][1].toFixed(4)}) must be lighter than --${steps[i - 1][0]} (${steps[i - 1][1].toFixed(4)})`,
      ).toBeGreaterThan(steps[i - 1][1])
    }
  })

  it('keeps one graphite hue across the whole ladder', () => {
    // Taken from the reference AS MEASURED (hue ~242°, not the "warm-leaning"
    // that Part 7's prose claimed — see D-THEME-0913-A). The warmth is in the
    // ink, and this asserts the ground stays one consistent hue.
    const hues = LADDER.map((name) => hue(t[name]))
    for (const h of hues) {
      expect(
        Math.abs(h - hues[0]),
        `ladder hue drift: ${hues.map((x) => x.toFixed(1)).join(', ')}`,
      ).toBeLessThan(8)
    }
  })
})

describe('text meets WCAG AA', () => {
  it.each(
    (
      [
        ['foreground', 'foreground'],
        ['card-foreground', 'card-foreground'],
        ['popover-foreground', 'popover-foreground'],
        ['muted-foreground', 'muted-foreground'],
      ] as const
    ).flatMap(([label, token]) =>
      TEXT_SURFACES.map((surface) => [`${label} on ${surface}`, token, surface] as const),
    ),
  )('%s clears 4.5:1', (_label, fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each(
    (['primary', 'brand', 'success', 'destructive', 'warning'] as const).flatMap((token) =>
      TEXT_SURFACES.map((surface) => [`${token} as text on ${surface}`, token, surface] as const),
    ),
  )('%s clears 4.5:1', (_label, fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each(['primary', 'destructive', 'warning', 'success'] as const)(
    '%s-foreground reads on its own fill',
    (token) => {
      expect(contrast(t[`${token}-foreground`], t[token])).toBeGreaterThanOrEqual(AA_TEXT)
    },
  )
})

describe('--subtle-foreground stays above its floor', () => {
  // The quiet tier clears AA on the page and on a card, and does NOT on the
  // overlay steps. Both halves are asserted: the first is the guarantee, the
  // second is the BAR — if a future edit lifted this tier until it passed
  // everywhere, the ladder would have flattened and that is worth failing on.
  it.each(['background', 'card'] as const)('reads on %s', (surface) => {
    expect(contrast(t['subtle-foreground'], t[surface])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each(['popover', 'accent'] as const)('is barred from %s, and the bar is real', (surface) => {
    expect(
      contrast(t['subtle-foreground'], t[surface]),
      `--subtle-foreground now clears AA on --${surface}; either the ladder flattened or this tier was lifted. Re-derive the system, do not delete this test.`,
    ).toBeLessThan(AA_TEXT)
  })
})

describe('the badge pattern (bg-X/10 text-X)', () => {
  // Stricter than text on the page, and historically where this palette broke
  // three separate times. `ab/status-badge.tsx` uses it for every tone.
  it.each(['primary', 'destructive', 'warning', 'success', 'brand'] as const)(
    '%s reads on its own 10%% tint over every surface',
    (token) => {
      for (const surface of ['background', 'card', 'popover'] as const) {
        const tinted = composite(t[token], t[surface], 0.1)
        expect(
          contrast(t[token], tinted),
          `--${token} on ${token}/10 over --${surface}`,
        ).toBeGreaterThanOrEqual(AA_TEXT)
      }
    },
  )

  it('holds the destructive plate on every surface a destructive control sits on', () => {
    // Including --sunken and --muted, which the five-tone sweep above does not
    // cover: a destructive control appears in a well and on a hovered row too.
    for (const surface of ['sunken', 'background', 'card', 'muted', 'popover'] as const) {
      const tinted = composite(t.destructive, t[surface], 0.1)
      expect(
        contrast(t.destructive, tinted),
        `--destructive on destructive/10 over --${surface}`,
      ).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it("keeps shadcn's dark /20 bump neutralised", () => {
    // ui/button.tsx, badge.tsx and dropdown-menu.tsx all ship
    // `dark:bg-destructive/20`. On this palette that plate measures 4.06:1 over
    // --popover and 4.43:1 over --muted — both under AA — because the overlay
    // step is already light. globals.css pins the plate back to 10%; if that
    // override is ever dropped, the numbers below come back and this fails.
    const globals = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')
    expect(globals).toContain("[data-variant='destructive']")
    expect(globals).toContain('color-mix(in oklab, var(--destructive) 10%, transparent)')

    const overshoots = (['muted', 'popover'] as const).map((surface) =>
      contrast(t.destructive, composite(t.destructive, t[surface], 0.2)),
    )
    for (const ratio of overshoots) expect(ratio).toBeLessThan(AA_TEXT)
  })
})

describe('non-text contrast (WCAG 1.4.11)', () => {
  it('keeps form-control boundaries visible on every surface a control sits on', () => {
    for (const surface of LADDER) {
      expect(contrast(t.input, t[surface]), `--input against --${surface}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })

  it('keeps the focus ring visible against every surface it lands on', () => {
    for (const surface of LADDER) {
      expect(contrast(t.ring, t[surface]), `--ring against --${surface}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })
})

describe('the colour roles stay distinguishable', () => {
  /**
   * D-THEME-0913-D. The accent is a red-orange; an error in the same family
   * makes confirm and delete look alike. 20.6° is a DELIBERATE COMPROMISE,
   * accepted because the error hue is markedly lighter and cooler, because
   * error is never signalled by colour alone, and because no wider hue exists
   * that still sits inside this palette. Do not "fix" this by widening it —
   * read the decision first.
   */
  it('keeps error clear of the accent in hue', () => {
    const d = hueDistance(hue(t.primary), hue(t.destructive))
    expect(
      d,
      `accent ${hue(t.primary).toFixed(1)}° vs error ${hue(t.destructive).toFixed(1)}°`,
    ).toBeGreaterThanOrEqual(15)
  })

  it('keeps warning clear of both the accent and error', () => {
    expect(hueDistance(hue(t.primary), hue(t.warning))).toBeGreaterThanOrEqual(15)
    expect(hueDistance(hue(t.destructive), hue(t.warning))).toBeGreaterThanOrEqual(15)
  })

  it('keeps the gold off the action colour', () => {
    // Gold is quiet metal, never an action. If it ever drifted to the accent's
    // hue the two would read as one signal.
    expect(hueDistance(hue(t.primary), hue(t.brand))).toBeGreaterThanOrEqual(30)
  })

  it('never lets the gold become the interactive colour', () => {
    // The failure mode that killed the previous palette attempt (D-UX-0913-C):
    // --primary = gold. It is forbidden by the design law, so it is asserted.
    expect(t.primary.join(','), '--primary must not be the gold').not.toBe(t.brand.join(','))
    expect(t.ring.join(','), '--ring must not be the gold').not.toBe(t.brand.join(','))
  })
})

describe('the chart ramp', () => {
  it('keeps every series legible on the surfaces a chart sits on', () => {
    for (const series of ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const) {
      for (const surface of ['background', 'card'] as const) {
        expect(
          contrast(t[series], t[surface]),
          `--${series} on --${surface}`,
        ).toBeGreaterThanOrEqual(AA_NON_TEXT)
      }
    }
  })

  it('contains no hue the palette does not already own', () => {
    // D-THEME-0913-G: the app draws ONE chart with ONE series. A categorical-5
    // of invented hues is what a template produces; this ramp is built from
    // gold, gold-dimmed, success, warning and the neutral text tier.
    const owned = [t.brand, t.success, t.warning, t['muted-foreground']].map(hue)
    for (const series of ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const) {
      const h = hue(t[series])
      const nearest = Math.min(...owned.map((o) => hueDistance(h, o)))
      expect(
        nearest,
        `--${series} (h ${h.toFixed(1)}°) is not a hue this palette owns`,
      ).toBeLessThan(6)
    }
  })

  it('separates the two gold series by lightness, since they share a hue', () => {
    expect(Math.abs(oklabL(t['chart-1']) - oklabL(t['chart-2']))).toBeGreaterThan(0.1)
  })
})
