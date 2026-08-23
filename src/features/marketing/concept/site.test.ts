/**
 * The marketing → product wiring map.
 *
 * Why a test and not just constants: the whole point of M2's CTA decision
 * (decisions.md D-M2-D) is that "Get started" means ONE thing everywhere on
 * the site. The prototype it was ported from sent that CTA into its own inert
 * purchase fiction, and the failure mode being guarded against is somebody
 * re-typing a href in one section — the header still going to `/signup`, the
 * pricing card quietly going somewhere else, and nobody noticing until a
 * visitor did.
 *
 * So this asserts two things a constant cannot: that every destination is a
 * route this app actually serves, and that no marketing component types a
 * marketing route as a string literal instead of importing it. The second half
 * reads source, because it is the only way to catch the href that was never
 * imported in the first place.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONTACT_EMAIL,
  DEMO_HREF,
  HOME_HREF,
  LOGIN_HREF,
  MARKETING_ROUTES,
  PRICING_HREF,
  PRIVACY_HREF,
  PRODUCT_ROUTES,
  START_HREF,
  TERMS_HREF,
} from './site'

/**
 * Every path in the app's route table that a marketing CTA is allowed to
 * resolve to. Kept as a literal list rather than imported from `routes.tsx`
 * on purpose: importing the router would make this test pass whenever the two
 * files agreed, including when they agreed on the wrong thing. This list is
 * the independent statement of what the product serves.
 */
const SERVED_ROUTES = [
  '/', // RootGate — marketing signed out, the product signed in
  '/pricing',
  '/request-demo',
  '/privacy',
  '/terms',
  '/signup',
  '/login',
] as const

describe('the marketing → product wiring map', () => {
  it('sends the two commercial CTAs at the REAL product screens', () => {
    // D-M2-D: "Get started" is self-serve signup, not a second fake journey.
    expect(START_HREF).toBe('/signup')
    expect(LOGIN_HREF).toBe('/login')
    // …and both are product routes, not marketing ones.
    for (const name of PRODUCT_ROUTES) {
      expect(MARKETING_ROUTES[name]).toMatch(/^\/(signup|login)$/)
    }
  })

  it('keeps the marketing-owned routes marketing-owned', () => {
    expect(HOME_HREF).toBe('/')
    expect(PRICING_HREF).toBe('/pricing')
    expect(DEMO_HREF).toBe('/request-demo')
    expect(PRIVACY_HREF).toBe('/privacy')
    expect(TERMS_HREF).toBe('/terms')
  })

  it('resolves every destination to a route this app serves', () => {
    for (const [name, href] of Object.entries(MARKETING_ROUTES)) {
      expect(SERVED_ROUTES, `${name} → ${href} is not a served route`).toContain(href)
    }
  })

  it('names each destination exactly once', () => {
    const hrefs = Object.values(MARKETING_ROUTES)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('carries a contact address the demo form can offer', () => {
    // Still a PLACEHOLDER (see site.ts) — this asserts it is a usable mailbox
    // shape, not that it is the right one.
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/)
  })
})

/* ------------------------------------------------------------------ *
 * No hand-typed routes anywhere in the visitor world
 * ------------------------------------------------------------------ */

const CONCEPT_ROOT = join(process.cwd(), 'src', 'features', 'marketing')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full)
  }
  return out
}

/** Comments may quote a route; only code may not type one. */
function codeOf(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('no marketing component types a route by hand', () => {
  const files = walk(CONCEPT_ROOT).filter((f) => !f.endsWith(join('concept', 'site.ts')))

  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(Object.values(MARKETING_ROUTES).filter((href) => href !== '/'))(
    '%s appears only through the site module',
    (href) => {
      const offenders = files.filter((file) =>
        new RegExp(`['"\`]${href}(['"\`?#/])`).test(codeOf(readFileSync(file, 'utf8'))),
      )
      expect(offenders.map((f) => f.replace(CONCEPT_ROOT, ''))).toEqual([])
    },
  )

  it('leaves no /concept-v2 path behind from the prototype', () => {
    // Code only. The port's doc comments cite upstream files by their real
    // paths (`app/concept-v2/pricing/page.tsx`) and should keep doing so —
    // a structural check that matched prose gets deleted the first time it
    // fires on a comment (state.md trap 11).
    const offenders = files.filter((file) => /concept-v2/.test(codeOf(readFileSync(file, 'utf8'))))
    expect(offenders.map((f) => f.replace(CONCEPT_ROOT, ''))).toEqual([])
  })
})
