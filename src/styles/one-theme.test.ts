/**
 * The one-theme guard (ORDER THEME-0913, RULING 4 / D-THEME-0913-A).
 *
 * The founder repealed the rule that scoped the visitor world and the product
 * so they could not reach each other: ONE theme now governs both. That ruling
 * is a sentence in a document, and a sentence does not survive contact with a
 * palette edit. This test is what makes it mechanically true.
 *
 * `marketing.css` remains the SOURCE. It is still scoped to
 * `html[data-mk-world]` and `verify:w02` still asserts that scoping — nothing
 * about the CSS isolation changed. What changed is that `tokens.css` now
 * carries the same VALUES, and this file fails the build the moment the two
 * disagree.
 *
 * It compares by value, not by name, because the two files name things
 * differently on purpose: the visitor world speaks in `--c-surface-1`, the
 * product in `--card`. The mapping below is the whole claim "one theme" makes,
 * written down once, where a diff can see it.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

const MARKETING = read('src/styles/marketing.css')
const TOKENS = read('src/styles/tokens.css')

/** Pulls `--name: value;` pairs, value trimmed, from one stylesheet. */
function declarations(css: string): Record<string, string> {
  const out: Record<string, string> = {}
  const pattern = /--([\w-]+):\s*([^;]+);/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(css)) !== null) {
    // First declaration wins: both files declare their palette once, at the
    // top, and a later @media override must not masquerade as the base value.
    if (!(m[1] in out)) out[m[1]] = m[2].trim().toLowerCase()
  }
  return out
}

const site = declarations(MARKETING)
const app = declarations(TOKENS)

/**
 * product token  ->  visitor-world token it must equal.
 *
 * Every entry is a value the two worlds genuinely share. Roles the product
 * invented (`--destructive`, `--warning`, `--input`, `--scrim`) are ABSENT on
 * purpose: the visitor world has no equivalent, so there is nothing to hold
 * them to, and pretending otherwise would make this guard lie.
 */
const SHARED: ReadonlyArray<readonly [string, string]> = [
  // the graphite ladder, all six steps
  ['sunken', 'c-void'],
  ['background', 'c-bg'],
  ['card', 'c-surface-1'],
  ['muted', 'c-surface-2'],
  ['popover', 'c-surface-3'],
  ['accent', 'c-surface-4'],
  // the three real text tiers
  ['foreground', 'c-text'],
  ['muted-foreground', 'c-text-2'],
  ['subtle-foreground', 'c-text-3'],
  // the accent, and the dark ink the site already corrected to
  ['primary', 'c-accent'],
  ['primary-foreground', 'c-on-accent'],
  ['ring', 'c-accent'],
  // the gold
  ['brand', 'c-gold'],
  ['brand-strong', 'c-gold-hi'],
  // the one semantic state the site has
  ['success', 'c-ok'],
  // the hairlines
  ['border', 'c-line-2'],
  // motion
  ['ease-out', 'ease-out'],
  ['ease-inout', 'ease-inout'],
  // the glow
  ['accent-glow', 'c-accent-glow'],
]

describe('one theme governs the visitor world and the product', () => {
  it('read both stylesheets', () => {
    expect(Object.keys(site).length).toBeGreaterThan(30)
    expect(Object.keys(app).length).toBeGreaterThan(25)
  })

  it.each(SHARED)("--%s equals the visitor world's --%s", (appToken, siteToken) => {
    expect(site[siteToken], `marketing.css has no --${siteToken}`).toBeDefined()
    expect(app[appToken], `tokens.css has no --${appToken}`).toBeDefined()
    expect(
      app[appToken],
      `--${appToken} (${app[appToken]}) has drifted from the visitor world's --${siteToken} (${site[siteToken]}). ` +
        'One theme governs both (D-THEME-0913-A): change marketing.css and this file together, or not at all.',
    ).toBe(site[siteToken])
  })

  it('uses the same Latin and Arabic families in both worlds', () => {
    // The type seam. The product reads its families from globals.css's @theme,
    // the site from marketing.css, and the two must name the same faces.
    const globals = read('src/styles/globals.css')
    expect(globals).toContain('DM Sans Variable')
    expect(globals).toContain('IBM Plex Sans Arabic')
    expect(site['f-sans']).toContain('dm sans variable')
    expect(site['f-arabic']).toContain('ibm plex sans arabic')
  })

  it('keeps Inter retired', () => {
    // D-THEME-0913-F supersedes design.md Part 2's "Inter, pending founder
    // confirmation". If Inter comes back it is a decision, not a drive-by.
    // The word may still appear in a comment explaining the supersession — it
    // is the FONT STACK and the @font-face rules that must be clear of it.
    const globals = read('src/styles/globals.css')
    const stack = /--font-sans:([\s\S]*?);/.exec(globals)?.[1] ?? ''
    expect(stack).toContain('DM Sans Variable')
    expect(stack).not.toContain('Inter')
    expect(globals, 'the vendored Inter @font-face is gone').not.toContain('@font-face')
    expect(globals).not.toContain('inter-latin')
  })

  it('keeps the visitor world scoped, exactly as verify:w02 requires', () => {
    // The design separation was repealed; the CSS isolation was NOT. If this
    // ever fails, the concept's tokens are leaking onto app screens through
    // the cascade rather than through a deliberate shared value.
    expect(MARKETING).toMatch(/^html\[data-mk-world\] \{/m)
    expect(MARKETING).not.toMatch(/^:root\s*\{/m)
  })
})
