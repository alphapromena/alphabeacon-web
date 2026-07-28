/**
 * The contrast guard: proves `tokens.css` meets WCAG AA, and keeps proving it.
 *
 * This exists because the brand's signature pink genuinely fails AA as small
 * text (see design.md Part 1), so the palette carries a deliberate split
 * between `--brand` (display/decorative) and `--primary` (anything with words
 * in it). That split is only worth something if it cannot be quietly undone:
 * this test parses the real CSS, resolves OKLCH the way a browser does, and
 * asserts every pair the product actually renders — including the
 * `text-X on bg-X/10` status-badge pattern, which is stricter than text on the
 * page and is where three separate failures were caught during W1.
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
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const a = c * Math.cos((hDeg * Math.PI) / 180)
  const b = c * Math.sin((hDeg * Math.PI) / 180)
  const lCube = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCube = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCube = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lr = 4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube
  const lg = -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube
  const lb = -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube
  return [
    Math.min(255, Math.max(0, linearToSrgb(lr) * 255)),
    Math.min(255, Math.max(0, linearToSrgb(lg) * 255)),
    Math.min(255, Math.max(0, linearToSrgb(lb) * 255)),
  ]
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

// --- read the real tokens ----------------------------------------------------

// Resolved from the project root: under jsdom `import.meta.url` is not a
// file: URL, so it cannot locate a sibling file.
const CSS = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/**
 * Pulls one theme block's custom properties. Alpha-carrying values (the dark
 * `--border`) are skipped: they have no fixed rendered color, and the pairs
 * asserted below never need one.
 */
function readTheme(selector: string): Record<string, Rgb> {
  const block = CSS.slice(CSS.indexOf(selector))
  const body = block.slice(block.indexOf('{') + 1, block.indexOf('\n}'))
  const tokens: Record<string, Rgb> = {}
  const pattern = /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    tokens[match[1]] = oklchToRgb(Number(match[2]), Number(match[3]), Number(match[4]))
  }
  return tokens
}

const light = readTheme(':root')
const dark = readTheme('.dark')

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme meets WCAG AA', (themeName, t) => {
  it('parsed the theme', () => {
    // A typo in a selector would otherwise make every assertion below vacuous.
    expect(Object.keys(t).length).toBeGreaterThan(20)
    for (const required of ['background', 'foreground', 'primary', 'card', 'muted-foreground']) {
      expect(t[required], `${themeName} is missing --${required}`).toBeDefined()
    }
  })

  it.each([
    ['foreground on background', 'foreground', 'background'],
    ['foreground on card', 'foreground', 'card'],
    ['card-foreground on card', 'card-foreground', 'card'],
    ['popover-foreground on popover', 'popover-foreground', 'popover'],
    ['muted-foreground on background', 'muted-foreground', 'background'],
    ['muted-foreground on card', 'muted-foreground', 'card'],
    ['muted-foreground on muted', 'muted-foreground', 'muted'],
    ['secondary-foreground on secondary', 'secondary-foreground', 'secondary'],
    ['primary as text on background', 'primary', 'background'],
    ['primary as text on card', 'primary', 'card'],
    ['accent-foreground on accent', 'accent-foreground', 'accent'],
    ['primary-foreground on a primary fill', 'primary-foreground', 'primary'],
    ['sidebar-foreground on sidebar', 'sidebar-foreground', 'sidebar'],
    [
      'sidebar-primary-foreground on sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-primary',
    ],
  ])('%s clears 4.5:1', (_label, fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  /**
   * The status-badge pattern: `bg-X/10 text-X`, which `ab/status-badge.tsx`
   * uses for every tone in both themes. Stricter than text on the page, and
   * historically where this palette broke — three separate times.
   */
  it.each(['primary', 'destructive', 'warning', 'success'])(
    '%s reads on its own 10% tint over every surface',
    (token) => {
      for (const surface of ['background', 'card', 'muted'] as const) {
        const tinted = composite(t[token], t[surface], 0.1)
        expect(
          contrast(t[token], tinted),
          `--${token} on ${token}/10 over --${surface}`,
        ).toBeGreaterThanOrEqual(AA_TEXT)
      }
    },
  )

  it('keeps the destructive button readable at the heavier tint shadcn uses in dark', () => {
    // ui/button.tsx: `bg-destructive/10 ... dark:bg-destructive/20`. More alpha
    // over a dark surface means a lighter plate under light text, so /20 is the
    // binding case in dark and has to be asserted separately.
    const alpha = themeName === 'dark' ? 0.2 : 0.1
    for (const surface of ['background', 'card', 'muted'] as const) {
      const tinted = composite(t.destructive, t[surface], alpha)
      expect(
        contrast(t.destructive, tinted),
        `--destructive on destructive/${alpha * 100} over --${surface}`,
      ).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('keeps form-control boundaries visible (WCAG 1.4.11)', () => {
    for (const surface of ['background', 'card'] as const) {
      expect(contrast(t.input, t[surface]), `--input against --${surface}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })

  it('keeps the focus ring visible against every surface it lands on', () => {
    for (const surface of ['background', 'card', 'muted'] as const) {
      expect(contrast(t.ring, t[surface]), `--ring against --${surface}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })

  it('keeps chart series distinguishable from the surface they sit on', () => {
    for (const series of ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const) {
      expect(contrast(t[series], t.background), `--${series}`).toBeGreaterThanOrEqual(AA_NON_TEXT)
    }
  })
})

describe('the brand/primary split', () => {
  it('keeps the signature pink out of the small-text role', () => {
    // The kit's #FF1E57 is 3.77:1 on white — this is the measurement that
    // forced the split, asserted so nobody "simplifies" --primary back to it.
    const brandAsText = contrast(light.brand, light.background)
    expect(brandAsText).toBeLessThan(AA_TEXT)
    expect(contrast(light.primary, light.background)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('still lets the brand carry large display type and fills (3:1)', () => {
    expect(contrast(light.brand, light.background)).toBeGreaterThanOrEqual(AA_NON_TEXT)
    expect(contrast(dark.brand, dark.background)).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })

  it('keeps destructive visually distinct from the brand rose', () => {
    // Same-family reds would make "delete" look like the primary action. Hue
    // distance is the property that matters, so it is the property asserted.
    const hue = (rgb: Rgb) => {
      const [r, g, b] = rgb.map((c) => srgbToLinear(c / 255)) as Rgb
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
      const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
      const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
      const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
      const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
      return (Math.atan2(B, A) * 180) / Math.PI
    }
    expect(Math.abs(hue(light.destructive) - hue(light.primary))).toBeGreaterThan(12)
  })
})
