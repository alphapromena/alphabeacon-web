/**
 * The contrast guard for the VISITOR world (M2 — concept-v2).
 *
 * `tokens.test.ts` does this job for the app's OKLCH palette; the marketing
 * world arrived with its own, in hex, from the prototype — and it arrived
 * failing in four places.
 *
 * **D-M2-F-r: those four failures are now ALLOWLISTED, not fixed.** The
 * review preview has to be Abdullah's verbatim design, so the prototype's
 * values are restored and the four findings are named, measured and PINNED
 * below. That is the whole point of the allowlist: an allowlist that only
 * says "ignore contrast here" rots (state.md traps 15 and 18), so each entry
 * asserts the ratio it actually measures. Improve a value and this test tells
 * you to move it out of the allowlist; worsen one and it fails.
 *
 * Everything NOT in `ALLOWED` is still held to AA. Findings 1, 2 and 4 are
 * pairs of declared tokens and live here. Finding 3 — the approval preview at
 * `opacity: 0.3` — is not a token pair, so it is held in the two places that
 * can see it: `e2e/marketing.spec.ts`, where axe composites the opacity and
 * reports 1.43:1, and verify:w02, which reads the declaration itself.
 *
 * **None of this may reach `main`.** The AA pass is D-M2-F, reverted by
 * D-M2-F-r for review only; open-items 21 carries the gate.
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

/**
 * D-M2-F-r — the known AA failures Abdullah's palette carries, allowed BY
 * NAME and PINNED to the ratio each one actually measures (±0.05).
 *
 * Three of the four deviations are colour pairs and appear here. Finding 3,
 * the approval preview at `opacity: 0.3`, cannot be expressed as a pair —
 * verify:w02 holds it structurally instead.
 */
const ALLOWED: Record<string, number> = {
  // 1 of 4 — the fourth text tier, ~40 elements across the five pages.
  '--c-text-4 on --c-void': 2.93,
  '--c-text-4 on --c-bg': 2.85,
  '--c-text-4 on --c-surface-1': 2.75,
  '--c-text-4 on --c-surface-2': 2.64,
  // 2 of 4 — white ink on the filled CTA, in both its states.
  '--c-on-accent on --c-accent': 3.29,
  '--c-on-accent on --c-accent-hi': 2.83,
  // 4 of 4 — the customer monogram's initials on the lightest surface.
  '--c-text-3 on --c-surface-3': 4.22,
}

/** Pinned, so a regression cannot hide inside an allowlisted pair. */
function expectPinned(key: string, ratio: number) {
  expect(ratio, `${key} is allowlisted at ${ALLOWED[key]}:1`).toBeCloseTo(ALLOWED[key], 1)
  expect(ratio, `${key} is allowlisted as a FAILURE — if it now passes, remove it`).toBeLessThan(
    AA_TEXT,
  )
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
      const key = `${textName} on ${surfaceName}`
      const allowed = key in ALLOWED
      it(allowed ? `${key} is an ALLOWLISTED failure (D-M2-F-r)` : `${key} clears AA`, () => {
        if (allowed) expectPinned(key, contrast(fg, bg))
        else expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT)
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

  it('the customer monogram is an ALLOWLISTED failure on the light fill (D-M2-F-r)', () => {
    // `BrandMark.module.css` is the one place the port puts a quiet tier on a
    // component fill, and D-M2-F-r restored it. verify:w02's source sweep
    // names that file as its single exception; this pins the ratio.
    expectPinned(
      '--c-text-3 on --c-surface-3',
      contrast(TEXT['--c-text-3'], COMPONENT_SURFACES['--c-surface-3']),
    )
  })

  it('the filled CTA is an ALLOWLISTED failure, and the accent itself is untouched', () => {
    // The accent is the identity and was never changed by either decision.
    // The INK is what D-M2-F darkened and D-M2-F-r put back to the
    // prototype's #fff. This is the most visible of the four.
    expect(token('--c-accent')).toEqual(hexToRgb('#ff4e2d'))
    expectPinned('--c-on-accent on --c-accent', contrast(token('--c-on-accent'), token('--c-accent')))
  })

  it('the CTA hover state is allowlisted too, and is the worse of the two', () => {
    // Hover brightens the fill, so white ink gets HARDER to read, not easier.
    const hover = contrast(token('--c-on-accent'), token('--c-accent-hi'))
    expectPinned('--c-on-accent on --c-accent-hi', hover)
    expect(hover).toBeLessThan(contrast(token('--c-on-accent'), token('--c-accent')))
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
    // Under D-M2-F-r `--c-text-4` is the prototype's own #5d5a57, so the ramp
    // is strictly decreasing again. It is asserted as non-increasing anyway,
    // because D-M2-F's fix aliased the fourth tier to the third and that is
    // the shape to restore before this branch can reach `main`: a compliant
    // fourth tier — distinct or aliased — is welcome, an inverted ramp is not.
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
