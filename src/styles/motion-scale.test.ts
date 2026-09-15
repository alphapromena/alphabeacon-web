/**
 * THE MOTION GUARANTEE, ASSERTED (ORDER MOTION-0914/A §4).
 *
 * §4 says every value in the scale collapses to zero under
 * `prefers-reduced-motion`. That is a sentence, and a sentence does not
 * survive a stylesheet edit — the same reasoning that produced
 * `one-theme.test.ts`. This is what makes it mechanically true.
 *
 * It reads the CSS rather than a rendered page on purpose. jsdom does not
 * evaluate `@media (prefers-reduced-motion: reduce)` and cannot resolve a
 * `var()` chain, so a DOM-based assertion here would pass on a stylesheet
 * that had been gutted. The text of the guarantee is the guarantee.
 *
 * The Playwright assertion over `[data-ab-motion]` is untouched and still
 * covers the signature animations from the browser's side; this covers the
 * baseline scale, which has no `data-ab-motion` attribute to hang off and
 * must not have one (see the block's own comment for why — that attribute
 * carries `display: none !important`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NUMBER_TRANSITION_MS } from '@/components/ab/use-number-transition'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

const TOKENS = read('src/styles/tokens.css')
const GLOBALS = read('src/styles/globals.css')

/** The scale, and nothing else may join it — §2 caps it at three. */
const SCALE = ['motion-fast', 'motion-medium', 'motion-slow'] as const

/** `--name: value;` from a stylesheet, first declaration winning. */
function declarations(css: string): Record<string, string> {
  const out: Record<string, string> = {}
  const pattern = /--([\w-]+):\s*([^;]+);/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(css)) !== null) {
    if (!(m[1] in out)) out[m[1]] = m[2].trim().toLowerCase()
  }
  return out
}

/** The body of the one `@media (prefers-reduced-motion: reduce)` block. */
function reducedMotionBlock(css: string): string {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
  expect(start, 'globals.css must carry a reduced-motion block').toBeGreaterThan(-1)
  let depth = 0
  let i = css.indexOf('{', start)
  const from = i
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) return css.slice(from, i + 1)
    }
  }
  throw new Error('unterminated reduced-motion block')
}

const tokens = declarations(TOKENS)
const reduced = reducedMotionBlock(GLOBALS)

describe('the motion scale', () => {
  it('is exactly three durations, and all three are real time', () => {
    for (const name of SCALE) {
      expect(tokens[name], `--${name} must be declared in tokens.css`).toBeDefined()
      expect(tokens[name]).toMatch(/^\d+ms$/)
      expect(Number.parseInt(tokens[name], 10)).toBeGreaterThan(0)
    }
    // No fourth duration smuggled in beside them.
    const durations = Object.keys(tokens).filter((name) => name.startsWith('motion-'))
    expect(durations.sort()).toEqual([...SCALE].sort())
  })

  it('runs fast < medium < slow, so the names mean what they say', () => {
    const ms = (name: string) => Number.parseInt(tokens[name], 10)
    expect(ms('motion-fast')).toBeLessThan(ms('motion-medium'))
    expect(ms('motion-medium')).toBeLessThan(ms('motion-slow'))
  })

  it('keeps hover and press UNDER the 150ms default the product ran on by accident', () => {
    // §5: motion never delays somebody who knows where they are going. A press
    // that answers later than the unconsidered default would be a regression
    // dressed as a design system.
    expect(Number.parseInt(tokens['motion-fast'], 10)).toBeLessThan(150)
  })
})

describe('the reduced-motion collapse', () => {
  it('zeroes EVERY duration in the scale', () => {
    for (const name of SCALE) {
      expect(
        reduced,
        `--${name} is not collapsed under prefers-reduced-motion — the reduced-motion block must redefine it to 0ms`,
      ).toMatch(new RegExp(`--${name}:\\s*0ms\\s*;`))
    }
  })

  it('still removes the signature animations, so §5.7 is untouched', () => {
    expect(reduced).toMatch(/\[data-ab-motion\]/)
    expect(reduced).toMatch(/animation:\s*none\s*!important/)
  })

  it('collapses the content entrance rather than deleting the content', () => {
    // It is a state change, not a flourish: it may take no time, but the
    // screen it carries must still be there.
    expect(reduced).toMatch(/\[data-ab-enter='content'\]/)
    expect(reduced).not.toMatch(/\[data-ab-enter='content'\][^}]*display:\s*none/)
  })
})

describe('the real-wait threshold (ORDER MOTION-0914/A2)', () => {
  it('exists, is real time, and is NOT a fourth member of the scale', () => {
    expect(tokens['skeleton-delay']).toBeDefined()
    expect(tokens['skeleton-delay']).toMatch(/^\d+ms$/)
    expect(Number.parseInt(tokens['skeleton-delay'], 10)).toBeGreaterThan(0)
    // It is not named `motion-*`, which is what keeps the scale at three — the
    // assertion above in "is exactly three durations" does the enforcing.
    expect(Object.keys(tokens)).not.toContain('motion-skeleton-delay')
  })

  it('does NOT collapse under reduced motion', () => {
    // The fade that carries the skeleton in collapses; the threshold does not.
    // Somebody who asked for stillness must not be shown a skeleton flashing
    // on and off for work that was already finished.
    expect(reduced).not.toMatch(/--skeleton-delay:\s*0ms/)
  })

  it('holds the skeleton invisible until the threshold has passed', () => {
    const rule = GLOBALS.slice(GLOBALS.indexOf("[role='status'][aria-busy='true']"))
    const head = rule.slice(0, 300)
    expect(head).toMatch(/var\(--skeleton-delay\)/)
    // `both` is what keeps it at opacity 0 DURING the delay. Without it the
    // element paints at full opacity and the flash is exactly back.
    expect(head.includes(' both;')).toBe(true)
  })
})

describe('no screen manufactures a wait', () => {
  const PROVIDER = read('src/data/provider.tsx')

  it('useScreenPhase takes no delay argument any more', () => {
    // The 400ms artificial skeleton cost a routine navigation 473–514ms on
    // data already in memory (Docs/qa/motion-0914/nav/). A default parameter
    // is how it would come back.
    const signature = PROVIDER.slice(PROVIDER.indexOf('export function useScreenPhase'))
    expect(signature.slice(0, 120)).toMatch(/useScreenPhase\(\): ScreenPhase/)
  })

  it('static mode is ready without waiting for anything', () => {
    const body = PROVIDER.slice(
      PROVIDER.indexOf('export function useScreenPhase'),
      PROVIDER.indexOf('export function useScreenPhase') + 1200,
    )
    expect(body).not.toMatch(/setTimeout/)
    expect(body).toMatch(/return 'ready'/)
  })
})

/**
 * AMBIENT is not a moment (NIGHT-0916 order 6; D-NIGHT-0916-F): the login
 * panel's beacon breathes on its own period, outside the moments block, so
 * the four-moments guard above keeps counting only moments. The taxonomy is
 * extended by exactly one family, on exactly one token, and it collapses
 * under reduced motion the way every flourish does.
 */
describe('ambient — the taxonomy beside the moments (NIGHT-0916 order 6)', () => {
  const ambient = GLOBALS.slice(GLOBALS.indexOf('10. AMBIENT'))
  const moments = GLOBALS.slice(
    GLOBALS.indexOf('9. THE FOUR MOMENTS'),
    GLOBALS.indexOf('THE GUARANTEE, IN ONE PLACE'),
  )

  it('is exactly one family, and it lives OUTSIDE the moments block', () => {
    expect(GLOBALS.indexOf('10. AMBIENT')).toBeGreaterThan(
      GLOBALS.indexOf('THE GUARANTEE, IN ONE PLACE'),
    )
    const families = new Set(
      Array.from(ambient.matchAll(/\[data-ab-motion='([a-z-]+)'\]/g), (m) => m[1]),
    )
    expect([...families]).toEqual(['ambient-beacon'])
    expect(moments).not.toMatch(/ambient-beacon/)
  })

  it('breathes on the one ambient token, which is not a member of the motion scale', () => {
    expect(tokens['ambient-period']).toBeDefined()
    expect(tokens['ambient-period']).toMatch(/^\d+s$/)
    expect(Number.parseInt(tokens['ambient-period'], 10)).toBeGreaterThanOrEqual(15)
    expect(Object.keys(tokens)).not.toContain('motion-ambient')
    expect(ambient).toMatch(/\[data-ab-motion='ambient-beacon'\][^}]*var\(--ambient-period\)/)
    const literals =
      ambient.replace(/\/\*[\s\S]*?\*\//g, '').match(/animation:[^;{}]*?\b\d+m?s\b/g) ?? []
    expect(literals).toEqual([])
  })

  it('introduces no colour of its own', () => {
    const colours = ambient.match(/#[0-9a-f]{3,8}|\brgb\b|\boklch\b|\bhsl\b/gi) ?? []
    expect(colours).toEqual([])
  })
})

describe('the four moments (ORDER MOTION-0914/B)', () => {
  /** Rule 9 — the moments block, and only it. */
  const moments = GLOBALS.slice(
    GLOBALS.indexOf('9. THE FOUR MOMENTS'),
    GLOBALS.indexOf('THE GUARANTEE, IN ONE PLACE'),
  )

  it('there are FOUR, and the vocabulary is the beacon', () => {
    // Moments are rationed like the accent. A fifth `data-ab-motion` family
    // appearing here is the thing this assertion exists to catch.
    const families = new Set(
      Array.from(moments.matchAll(/\[data-ab-motion='([a-z-]+)'\]/g), (m) => m[1]),
    )
    expect([...families].sort()).toEqual([
      'approve-sweep',
      'first-light-core',
      'first-light-ring',
      'first-light-rule',
      'tone-rewrite',
    ])
  })

  it('introduces no colour of its own — the gold is the only ink', () => {
    const colours = moments.match(/#[0-9a-f]{3,8}|\brgb\b|\boklch\b|\bhsl\b/gi) ?? []
    expect(colours, `moments must borrow existing tokens: ${colours.join(' ')}`).toEqual([])
  })

  it('uses no literal duration — every moment comes from the scale', () => {
    const code = moments.replace(/\/\*[\s\S]*?\*\//g, '')
    const literals = code.match(/animation:[^;{}]*?\b\d+m?s\b/g) ?? []
    expect(literals, `literals: ${literals.join(' | ')}`).toEqual([])
  })

  it('draws the approve sweep and the queue rule on the SAME keyframe', () => {
    // "One sequence, not two animations colliding": the card's rule and
    // §5.7's are the same gesture at two scales, so they share a keyframe and
    // the large one is delayed by exactly the small one's duration.
    expect(moments).toMatch(/\[data-ab-motion='approve-sweep'\][\s\S]{0,160}ab-queue-clear/)
    const queue = GLOBALS.slice(GLOBALS.indexOf("[data-ab-motion='queue-clear'] {"))
    expect(queue.slice(0, 200)).toMatch(/var\(--motion-slow\)[^;]*var\(--motion-medium\)/)
  })

  it('never hangs data-ab-motion on something that carries meaning', () => {
    // That attribute also carries `display: none !important`. The card's
    // settle and the content entrance are STATE, so they collapse through the
    // scale instead — and are named in the reduced-motion block, not here.
    expect(moments).not.toMatch(/\[data-ab-approving[^\]]*\][^{]*\{[^}]*data-ab-motion/)
    expect(moments).toMatch(/\[data-ab-approving='true'\]/)
  })

  it('collapses the approve settle to its end state under reduced motion', () => {
    expect(reduced).toMatch(/\[data-ab-approving='true'\]/)
    expect(reduced).not.toMatch(/\[data-ab-approving='true'\][^}]*display:\s*none/)
  })
})

describe('every value comes from the scale', () => {
  /**
   * Rule 8 — the authored baseline — and ONLY that. It stops where the
   * signature section begins, because the two ambient loops after it keep
   * their own periods on purpose (a heartbeat is a tempo, not a duration) and
   * the reduced-motion block's `0ms` is the collapse itself, both of which
   * would otherwise read as violations of the thing they implement.
   */
  const authored = GLOBALS.slice(
    GLOBALS.indexOf('8. MOTION — the baseline'),
    GLOBALS.indexOf('Signature motion (design law'),
  )

  it('uses no literal duration in the motion block', () => {
    // Strip comments first: the prose there quotes the measured 150ms default
    // and the old 900ms literal, and quoting a number is not using one.
    const code = authored.replace(/\/\*[\s\S]*?\*\//g, '')
    const literals = code.match(/(?:transition|animation)[^;{}]*?\b\d+m?s\b/g) ?? []
    expect(literals, `literal durations must come from the scale: ${literals.join(' | ')}`).toEqual(
      [],
    )
  })

  it('carries the one memorable moment on the slow token, not on a literal', () => {
    // §5.7's queue-clear was `900ms` written out; it is `--motion-slow` now,
    // which is what makes the collapse above cover it too.
    expect(GLOBALS).toMatch(/\[data-ab-motion='queue-clear'\]/)
    const rule = GLOBALS.slice(GLOBALS.indexOf("[data-ab-motion='queue-clear']"))
    expect(rule.slice(0, 200)).toMatch(/var\(--motion-slow\)/)
  })

  it('keeps the JS counter and the CSS medium in step', () => {
    // A number changing is a state change, so it runs at MEDIUM — but it is a
    // requestAnimationFrame loop and cannot read a CSS variable. This is the
    // one crossing, and it is asserted rather than trusted.
    expect(NUMBER_TRANSITION_MS).toBe(Number.parseInt(tokens['motion-medium'], 10))
  })
})
