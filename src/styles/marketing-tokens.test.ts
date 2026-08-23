/**
 * The contrast guard for the VISITOR world (M2 — concept-v2).
 *
 * `tokens.test.ts` does this job for the app's OKLCH palette; the marketing
 * world arrived with its own, in hex, from the prototype — and it arrived
 * failing. Three findings, all fixed in `marketing.css` and all recorded here
 * so they cannot come back:
 *
 *  1. `--c-text-4` was `#5d5a57`: 2.63–2.93:1 against the surfaces it is used
 *     on, across roughly forty elements on five pages.
 *  2. The filled CTA set `color: #fff` on `--c-accent`: 3.29:1 at 14–15px.
 *     The accent itself is unchanged; the ink on it is `--c-on-accent`.
 *  3. The approval preview was held at `opacity: 0.3` — 1.43:1 — which this
 *     test cannot see. That one is asserted structurally in verify:w02 and
 *     behaviourally in `e2e/marketing.spec.ts`.
 *
 * Like its app-side sibling this parses the REAL stylesheet rather than a copy
 * of the values, so editing a token without editing this file fails here.
 * axe covers what a rendered page shows; this covers the palette itself,
 * including pairs no single screenshot puts side by side.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Rgb = [number, number, number]

const AA_TEXT = 4.5
/** WCAG 1.4.11: boundaries and glyphs that identify a control. */
const AA_NON_TEXT = 3

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

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

function hexToRgb(hex: string): Rgb {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? [...v].map((c) => c + c).join('') : v
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/* ------------------------------------------------------------------ *
 * Read the real stylesheet
 * ------------------------------------------------------------------ */

const css = readFileSync(resolve(__dirname, 'marketing.css'), 'utf8')

/** The token block the marketing layout's document attribute switches on. */
function worldBlock(): string {
  const start = css.indexOf('html[data-mk-world] {')
  expect(start, 'marketing.css must declare its tokens on html[data-mk-world]').toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

function token(name: string): Rgb {
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(worldBlock())
  expect(match, `marketing.css is missing an opaque hex for ${name}`).not.toBeNull()
  return hexToRgb(match![1])
}

/**
 * The grounds a page sets text on. Every text tier lands on all four, so all
 * four are asserted against all four.
 */
const PAGE_SURFACES = {
  '--c-void': token('--c-void'),
  '--c-bg': token('--c-bg'),
  '--c-surface-1': token('--c-surface-1'),
  '--c-surface-2': token('--c-surface-2'),
}

/**
 * Component fills — icon tiles, chips, the customer monogram. Lighter, so the
 * quiet tiers do not reach AA on them and the port does not use them there
 * (`BrandMark.module.css` was the one place that did; it moved up a tier).
 * `--c-surface-4` is declared by the prototype and used nowhere, so nothing is
 * asserted about it beyond its place in the ramp.
 */
const COMPONENT_SURFACES = {
  '--c-surface-3': token('--c-surface-3'),
}

const SURFACES = {
  ...PAGE_SURFACES,
  ...COMPONENT_SURFACES,
  '--c-surface-4': token('--c-surface-4'),
}

const TEXT = {
  '--c-text': token('--c-text'),
  '--c-text-2': token('--c-text-2'),
  '--c-text-3': token('--c-text-3'),
  '--c-text-4': token('--c-text-4'),
}

describe('the visitor world meets WCAG AA', () => {
  /**
   * Every text tier on every surface. The prototype used `--c-text-4` on the
   * footer, on eyebrows, on section numbers and on the pricing page's
   * planned-capability list — all of them over `--c-bg` or darker — so the
   * whole matrix is asserted rather than the pairs that happened to be caught.
   */
  for (const [textName, fg] of Object.entries(TEXT)) {
    for (const [surfaceName, bg] of Object.entries(PAGE_SURFACES)) {
      it(`${textName} on ${surfaceName} clears AA for normal text`, () => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT)
      })
    }
  }

  // Component fills carry the two loud tiers only.
  for (const textName of ['--c-text', '--c-text-2'] as const) {
    for (const [surfaceName, bg] of Object.entries(COMPONENT_SURFACES)) {
      it(`${textName} on ${surfaceName} clears AA for normal text`, () => {
        expect(contrast(TEXT[textName], bg)).toBeGreaterThanOrEqual(AA_TEXT)
      })
    }
  }

  it('the quiet tiers are kept OFF the component fills, because they cannot clear AA there', () => {
    // Stated as a fact about the palette rather than left implicit: if a
    // future edit puts --c-text-3 back on --c-surface-3, verify:w02's source
    // sweep is what catches it, and this records why it must.
    expect(contrast(TEXT['--c-text-3'], COMPONENT_SURFACES['--c-surface-3'])).toBeLessThan(AA_TEXT)
  })

  it('the filled CTA is legible on the accent it is filled with', () => {
    // The accent is the identity and is untouched; the ink is what changed.
    expect(token('--c-accent')).toEqual(hexToRgb('#ff4e2d'))
    expect(contrast(token('--c-on-accent'), token('--c-accent'))).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('the CTA stays legible in its hover state', () => {
    // Hover brightens the fill, so the dark ink only gets easier to read —
    // but a future hover that darkened instead would fail here first.
    expect(contrast(token('--c-on-accent'), token('--c-accent-hi'))).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('the gold tier is legible on its own fill', () => {
    // Gold is pricing-only and never an action (design.md Part 7), but where
    // it fills a surface it carries words.
    expect(contrast(hexToRgb('#1a1206'), token('--c-gold'))).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('accent glyphs on the page ground clear the non-text bar', () => {
    // The orange full stop, the timeline dot, the rules: decoration that
    // identifies, so 3:1 rather than 4.5:1.
    expect(contrast(token('--c-accent'), token('--c-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT)
    expect(contrast(token('--c-ok'), token('--c-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT)
    expect(contrast(token('--c-gold'), token('--c-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })

  it('the focus ring is visible against every surface', () => {
    for (const [name, bg] of Object.entries(SURFACES)) {
      expect(contrast(token('--c-accent-hi'), bg), `focus ring on ${name}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })
})

describe('the palette keeps its shape', () => {
  it('reads darker from --c-void up through --c-surface-4', () => {
    const ordered = Object.values(SURFACES).map(luminance)
    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i], `surface ${i} should be lighter than ${i - 1}`).toBeGreaterThan(
        ordered[i - 1],
      )
    }
  })

  it('reads lighter from the quietest text tier up to the loudest', () => {
    // `--c-text-4` currently ALIASES `--c-text-3` — the fourth tier cannot
    // exist above the AA floor while the third sits where it does, and
    // inventing a new third would change text that already passes. So this
    // asserts non-increasing rather than strictly decreasing: a future
    // compliant fourth tier is welcome, an inverted ramp is not.
    const [t1, t2, t3, t4] = [
      luminance(TEXT['--c-text']),
      luminance(TEXT['--c-text-2']),
      luminance(TEXT['--c-text-3']),
      luminance(TEXT['--c-text-4']),
    ]
    expect(t1).toBeGreaterThan(t2)
    expect(t2).toBeGreaterThan(t3)
    expect(t3).toBeGreaterThanOrEqual(t4)
  })
})
