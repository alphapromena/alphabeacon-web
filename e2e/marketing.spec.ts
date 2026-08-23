/**
 * The visitor world (M2 — concept-v2).
 *
 * Replaces the M1 marketing coverage that used to live in `onboarding.spec.ts`:
 * the section order, the header and footer wiring, the pricing tiers, the demo
 * request's validation and its local success, both legal routes, the CTA map
 * landing on the REAL product, reduced motion, and the zero-network law with
 * self-hosted fonts.
 *
 * NAVIGATION RULE for this file: after switching datasets, move only through
 * in-app links. `page.goto` reloads the SPA and rebuilds the DEFAULT dataset —
 * so a deep link would silently land in the wrong world. The four secondary
 * marketing routes are public and session-independent, which is why they may
 * be reached with `goto` where a spec needs to start there.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/**
 * D-M2-F-r — the four AA failures Abdullah's palette carries, allowed BY EXACT
 * COLOUR PAIR so the review preview is his verbatim design.
 *
 * This is deliberately NOT `disableRules(['color-contrast'])`. Switching the
 * rule off would blind the scan to every contrast defect on five pages,
 * including ones nobody has looked at — and a gate that broad is the kind that
 * rots unnoticed (state.md traps 15 and 18). Each entry names one foreground
 * on one background, measured; anything else still fails, and so does every
 * other axe rule.
 *
 * Ratios are what axe reports on a settled page, so an entry can be read
 * without running anything.
 *
 * **None of this may reach `main`.** The AA pass is D-M2-F, reverted by
 * D-M2-F-r for review only; open-items 21 is the gate.
 */
const PROTOTYPE_AA_ALLOWLIST = [
  // Finding 1 of 4 — `--c-text-4` #5d5a57, ~40 elements across the five pages.
  { fg: '#5d5a57', bg: '#05080b', ratio: 2.93, what: '1/4 --c-text-4 on --c-void' },
  { fg: '#5d5a57', bg: '#080d11', ratio: 2.84, what: '1/4 --c-text-4 on --c-bg' },
  { fg: '#5d5a57', bg: '#0c1217', ratio: 2.75, what: '1/4 --c-text-4 on --c-surface-1' },
  { fg: '#5d5a57', bg: '#10171c', ratio: 2.63, what: '1/4 --c-text-4 on --c-surface-2' },
  // Finding 2 of 4 — white ink on the filled CTA. The most visible of the four.
  // Only the resting state appears here; a static scan never hovers, so the
  // worse hover pairing (2.83:1) is pinned in `marketing-tokens.test.ts`.
  { fg: '#ffffff', bg: '#ff4e2d', ratio: 3.29, what: '2/4 --c-on-accent on --c-accent' },
  // Finding 3 of 4 — the approval preview at `opacity: 0.3`. axe COMPOSITES
  // opacity rather than skipping it, so this does surface as a real violation:
  // the tiers blend to #4e5051 (`--c-text`) and #2e2f30 (`--c-text-2`) over the
  // ground, and 1.43:1 is the number design.md Part 7.7 records. verify:w02
  // holds the same finding structurally, so removing the ghosting reports both.
  { fg: '#4e5051', bg: '#090f13', ratio: 2.37, what: '3/4 .detailTitle at opacity .3' },
  { fg: '#2e2f30', bg: '#090f13', ratio: 1.43, what: '3/4 .detailBody at opacity .3' },
  // Finding 4 of 4 — the customer monogram, `--c-text-3` on `--c-surface-3`,
  // 4.22:1. It does not surface in a static scan (the initials render large
  // enough that axe applies the 3:1 large-text bar), so the pairing is pinned
  // in `marketing-tokens.test.ts` and swept for in verify:w02 instead. Listed
  // here for completeness of the four, not because a scan reports it.
] as const

/**
 * PRE-EXISTING ON M2, AND NOT ONE OF THE FOUR — found 2026-08-24.
 *
 * These are NOT D-M2-F-r's doing. Every one of them is a quiet text tier held
 * at partial opacity in the Memory section, and none involves any of the four
 * reverted values: `--c-text-2` at ~0.25 (#373738), `--c-text-3` at ~0.53
 * (#4d4c4a) and at ~0.76 (#666563). They were invisible until the homepage's
 * axe scan was given a readiness gate — before that it scanned the wrong page
 * entirely (see `settledHomepage`), so M2's "axe clean on all five routes"
 * never actually covered this route.
 *
 * They are kept SEPARATE from the four on purpose: conflating a newly-found
 * defect with a deliberate design decision is how an allowlist stops meaning
 * anything. This one is a real defect against design.md Part 6 rule 1 and
 * state.md's "never dim real text with opacity" — open-items 21 carries it,
 * and it needs a decision from the founder and Abdullah, not a quiet fix,
 * because the dimming is expressing "this is the superseded draft".
 */
const PRE_EXISTING_M2_DIMMED_TEXT = [
  { fg: '#373738', bg: '#0a1014', ratio: 1.6, what: 'memory: the superseded draft, --c-text-2 @.25' },
  { fg: '#4d4c4a', bg: '#0c1317', ratio: 2.18, what: 'memory: the rule list, --c-text-3 @.53' },
  { fg: '#666563', bg: '#0c1317', ratio: 3.21, what: 'memory: what it learned, --c-text-3 @.76' },
] as const

const ALLOWED_PAIRS = [...PROTOTYPE_AA_ALLOWLIST, ...PRE_EXISTING_M2_DIMMED_TEXT]

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>

/**
 * Everything axe found that the allowlist does NOT cover. A `color-contrast`
 * violation survives only if every one of its nodes is an allowlisted pair;
 * one unlisted node and the whole violation is reported.
 */
function unexpected(scan: AxeResults) {
  const allowed = (fg?: string, bg?: string) =>
    ALLOWED_PAIRS.some(
      (entry) => entry.fg === fg?.toLowerCase() && entry.bg === bg?.toLowerCase(),
    )
  return scan.violations
    .map((violation) => {
      if (violation.id !== 'color-contrast') return violation
      const nodes = violation.nodes.filter(
        (node) =>
          !node.any.some(
            (check) =>
              check.id === 'color-contrast' &&
              allowed(
                (check.data as { fgColor?: string } | undefined)?.fgColor,
                (check.data as { bgColor?: string } | undefined)?.bgColor,
              ),
          ),
      )
      return nodes.length ? { ...violation, nodes } : null
    })
    .filter((violation) => violation !== null)
    .map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    }))
}

/** A signed-out prospect: '/' is the marketing site. */
const asVisitor = (page: Page) => activateDataset(page, 'Visitor (signed out)')

/**
 * The homepage, RENDERED and STILL — the only state a contrast scan can read.
 *
 * Two separate problems, both found on 2026-08-24 and both pre-dating M2's
 * own "axe clean" claim for this route:
 *
 * 1. `AxeBuilder.analyze()` does not auto-wait — state.md trap 14, the same
 *    failure `count()` has. A scan fired straight after `asVisitor()` ran
 *    against whatever was still mounted: the dev-datasets page, in the APP's
 *    ivory palette, ~25 text nodes, every one of them passing. It came back
 *    clean and meant nothing. (Every other route in the @axe loop was already
 *    gated by its own heading assertion, so only the homepage was affected.)
 *
 * 2. Once it DID scan the homepage, it scanned a moving one. axe samples
 *    computed colour at one instant, so elements mid-transition report their
 *    blend — the orbit timeline at 1.02:1, an accent label at #c6553f — which
 *    are frames, not palette defects. Reduced motion is the repo's answer:
 *    `marketing.css` collapses every animation and transition inside
 *    `.mk-world` to its end state under the preference (design.md Part 7.7),
 *    which is a real user configuration and a still target. The Approval test
 *    already scans this way for the same reason.
 *
 * The four other routes keep their existing gate and no motion emulation:
 * they pass as they are, and the smallest change that fixes the defect is the
 * one that does not disturb them.
 */
async function settledHomepage(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await asVisitor(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.')
}

/**
 * The homepage's section order IS the argument (home-screen.tsx): claim →
 * demonstration → proof → control → memory → Arabic → the visitor's own
 * company → the way in. Asserted as an ordered list of the section ids so a
 * reordering fails here rather than being noticed by a founder in review.
 */
const SECTION_ORDER = [
  'product', // Prompts — it doesn't wait for prompts
  'how-it-works', // OneEvent
  'real-brands', // RealBrands
  'control', // Approval
  'arabic', // Arabic
  'brand-demo', // BrandDemo
  'get-started', // ClosingCta
] as const

test('the homepage renders the concept-v2 hero and every section, in order', async ({ page }) => {
  await asVisitor(page)

  // The hero headline is the h1, and the wordmark lives in the navigation.
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toContainText('Your marketing')
  await expect(heading).toContainText('was working')
  await expect(heading).toContainText('before you were.')
  await expect(page.getByText('Malaky learns your business, watches')).toBeVisible()

  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main section[id]'), (s) => s.id),
  )
  expect(ids).toEqual([...SECTION_ORDER])

  // The Memory section carries no id upstream, so it is asserted by its head.
  await expect(
    page.getByRole('heading', { name: /You shouldn.t have to correct the same thing twice/ }),
  ).toBeVisible()
})

test('the header wires every CTA at the route it names', async ({ page }) => {
  await asVisitor(page)
  const header = page.getByRole('banner')

  await expect(header.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')
  await expect(
    header.getByRole('link', { name: 'Request a private demo' }).first(),
  ).toHaveAttribute('href', '/request-demo')
  await expect(header.getByRole('link', { name: 'Get started' }).first()).toHaveAttribute(
    'href',
    '/signup',
  )
  await expect(header.getByRole('link', { name: 'Pricing' }).first()).toHaveAttribute(
    'href',
    '/pricing',
  )
})

test('the footer carries the legal routes and the client login', async ({ page }) => {
  await asVisitor(page)
  const footer = page.getByRole('contentinfo')

  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
  await expect(footer.getByRole('link', { name: 'Client login' })).toHaveAttribute('href', '/login')
  await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute(
    'href',
    '/request-demo',
  )
})

test('Get started lands on the REAL signup, not a second fake journey', async ({ page }) => {
  // D-M2-D: the purchase fiction did not come across; every "Get started" is
  // the app's own account creation.
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Get started' }).first().click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

test('the header survives navigation between marketing routes', async ({ page }) => {
  // The layout-route guarantee (state.md trap 8): one header mounted across
  // '/' and '/pricing', so the focused nav link is not destroyed on click.
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Pricing' }).first().click()
  await expect(page).toHaveURL(/\/pricing$/)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(
    page.getByRole('heading', { level: 1, name: /Malaky is not another tool/ }),
  ).toBeVisible()

  await page.getByRole('banner').getByRole('link', { name: 'Malaky — home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.')
})

test('the section links scroll to their sections, from this page and from another', async ({
  page,
}) => {
  // Next did fragment navigation for free; a client-side router does not.
  // `useHashScroll` in the layout is what replaces it, so it is asserted from
  // both directions: same-page (hash only) and cross-page (pathname + hash).
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Real brands' }).first().click()
  await expect(page).toHaveURL(/#real-brands$/)
  await expect(page.locator('#real-brands')).toBeInViewport()

  await page.getByRole('banner').getByRole('link', { name: 'Pricing' }).first().click()
  await expect(page).toHaveURL(/\/pricing$/)
  await page.getByRole('banner').getByRole('link', { name: 'Arabic' }).first().click()
  await expect(page).toHaveURL(/\/#arabic$/)
  await expect(page.locator('#arabic')).toBeInViewport()
})

test('the mobile menu opens, navigates, and closes behind it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await asVisitor(page)

  const burger = page.getByRole('button', { name: 'Open menu' })
  await expect(burger).toHaveAttribute('aria-expanded', 'false')
  await burger.click()

  const panel = page.locator('#mobile-nav')
  await expect(panel).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(panel.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/signup')
  await expect(panel.getByRole('link', { name: 'Request a private demo' })).toHaveAttribute(
    'href',
    '/request-demo',
  )
  await expect(panel.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')

  await panel.getByRole('link', { name: 'How it works' }).click()
  await expect(panel).toBeHidden()
  await expect(page.locator('#how-it-works')).toBeInViewport()
})

test('pricing renders all three tiers, and only the self-serve ones sell', async ({ page }) => {
  await page.goto('/pricing')

  for (const [name, price] of [
    ['Malaky Business', '$599'],
    ['Malaky Scale', '$899'],
    ['Malaky Enterprise', 'Custom'],
  ] as const) {
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name }) })
    await expect(card).toHaveCount(1)
    await expect(card).toContainText(price)
  }

  // Business and Scale can be bought; Enterprise is scoped in a conversation.
  const starts = page.getByRole('article').getByRole('link', { name: 'Get started' })
  await expect(starts).toHaveCount(2)
  for (const link of await starts.all()) {
    await expect(link).toHaveAttribute('href', '/signup')
  }
  const enterprise = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Malaky Enterprise' }) })
  await expect(enterprise.getByRole('link', { name: 'Request a private demo' })).toHaveAttribute(
    'href',
    '/request-demo',
  )

  // Malaky Managed is the optional layer, priced once on the page.
  await expect(page.getByRole('heading', { name: 'Malaky Managed' })).toBeVisible()
  await expect(page.getByText('Annual prepayment available. Save 10%.')).toBeVisible()
})

test('the demo request validates, then resolves locally and says so', async ({ page }) => {
  await page.goto('/request-demo')
  await expect(
    page.getByRole('heading', { level: 1, name: /Let.s see what Malaky could run/ }),
  ).toBeVisible()

  // The direct route out is offered BEFORE the form is sent, not only after.
  await expect(page.getByRole('link', { name: 'hello@malaky.ai' })).toHaveAttribute(
    'href',
    'mailto:hello@malaky.ai',
  )

  // Scoped to the form and matched exactly: 'Company' alone also finds the
  // website field, the 'Company social media' chip and the footer's Company
  // nav (state.md trap 16 — accessible names match by substring).
  const form = page.locator('form')

  // Empty submit: designed messages, focus sent to the first problem.
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText('Tell us who to address this to.')).toBeVisible()
  await expect(page.getByText('We need an address to reply to.')).toBeVisible()
  await expect(form.getByLabel('Name', { exact: true })).toBeFocused()

  // A website that could not be one is caught on its own terms.
  await form.getByLabel('Name', { exact: true }).fill('Maya Haddad')
  await form.getByLabel('Work email', { exact: true }).fill('maya@falak.example')
  await form.getByLabel('Company', { exact: true }).fill('Falak Logistics')
  await form.getByLabel('Company website', { exact: true }).fill('not a website')
  await form.getByLabel('Role', { exact: true }).fill('Head of Marketing')
  await form.getByLabel('Country / primary market', { exact: true }).fill('Saudi Arabia')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText(/That doesn.t look like a website address/)).toBeVisible()

  await form.getByLabel('Company website', { exact: true }).fill('falak.example')
  // The chip's input is visually hidden and the label is the affordance, so
  // click what a visitor clicks rather than forcing the input.
  await form.locator('label').filter({ hasText: 'Arabic content' }).click()
  await expect(form.getByRole('checkbox', { name: 'Arabic content' })).toBeChecked()
  await page.getByRole('button', { name: 'Send request' }).click()

  await expect(page.getByRole('heading', { name: /You.re on the list/ })).toBeVisible()
  // The success state offers a human, because nothing was transmitted.
  await expect(page.getByRole('link', { name: 'hello@malaky.ai' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View pricing' })).toHaveAttribute('href', '/pricing')
})

test('both legal routes render the website documents', async ({ page }) => {
  await page.goto('/terms')
  await expect(page.getByRole('heading', { level: 1, name: 'Website Terms of Use' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Contents' })).toBeVisible()
  // Undecided legal values render as visibly undecided, never as prose.
  await expect(page.getByText('[To be confirmed: governing jurisdiction]')).toBeVisible()
  await page.getByRole('link', { name: 'Privacy Policy' }).first().click()

  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText('[To be confirmed: legal entity name]').first()).toBeVisible()
})

test('the retired early-access door lands on the demo request', async ({ page }) => {
  // D-M2-D retired the early-access model; the path stays reachable so a
  // shared link does not 404.
  await page.goto('/request-access')
  await expect(page).toHaveURL(/\/request-demo$/)
  await expect(
    page.getByRole('heading', { level: 1, name: /Let.s see what Malaky could run/ }),
  ).toBeVisible()
})

test('the brand demo runs a company and stays honest about what it is', async ({ page }) => {
  await asVisitor(page)
  const demo = page.locator('#brand-demo')
  await demo.scrollIntoViewIfNeeded()

  // The disclaimer is on screen before anything runs, and stays.
  await expect(demo.getByText('Concept preview')).toBeVisible()

  await demo.getByLabel('Your company website').fill('falak.example')
  await demo.getByRole('button', { name: 'Show me →' }).click()

  await expect(demo.getByRole('button', { name: 'Try another company' })).toBeVisible({
    timeout: 30000,
  })
  await expect(demo.getByText('Preview only — nothing is published or connected.')).toBeVisible()
  // An illustrative run offers both routes, and neither is invented.
  await expect(demo.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/signup')
  await expect(demo.getByRole('link', { name: 'Request a private demo' })).toHaveAttribute(
    'href',
    '/request-demo',
  )
})

test('the control loop is real: Approve schedules the piece and records the preference', async ({
  page,
}) => {
  // The moment the section exists to demonstrate (replaces M1's S5 walk).
  // Reduced motion collapses the sequence to its end state in one step, which
  // is what makes this assertable without waiting on three timers.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await asVisitor(page)
  const control = page.locator('#control')
  await control.scrollIntoViewIfNeeded()

  /**
   * D-M2-F-r, finding 3 of 4 — asserted as it SHIPS, not as it ought to be.
   *
   * The prototype ghosts the un-revealed outcome at `opacity: 0.3` instead of
   * removing it, so before anyone approves anything the card is present, in
   * the accessibility tree, and readable at 1.43:1 — it says "Scheduled —
   * Monday, 11:00", which is a claim about a decision the visitor has not
   * made. M2 (D-M2-F) made it genuinely absent and this test asserted that;
   * D-M2-F-r reverted it so the review preview is Abdullah's verbatim design.
   *
   * When D-M2-F is re-applied before `main`, this goes back to `toBeHidden()`
   * and the opacity assertion goes away. Until then the suite states the cost
   * out loud rather than quietly not looking.
   */
  const outcome = control.getByText('Monday, 11:00 — the slot this audience reads.')
  await expect(outcome).toBeVisible()
  await expect(
    control.locator('[class*="detail"]').filter({ hasText: 'Monday, 11:00' }).first(),
  ).toHaveCSS('opacity', '0.3')

  await control.getByRole('button', { name: 'Approve', exact: true }).click()

  await expect(control.getByText('Monday, 11:00 — the slot this audience reads.')).toBeVisible()
  // exact:true — the live region says "Scheduled — preference remembered" too,
  // and getByText matches by substring (state.md traps 9 and 16).
  await expect(control.getByText('Preference remembered', { exact: true })).toBeVisible()
  await expect(control.getByText('Scheduled — preference remembered')).toBeVisible()
  await expect(
    control.getByText("Nothing else to do. You'll see it go out on Monday."),
  ).toBeVisible()

  // And it is a demonstration, so it can be run again — back to the ghosted
  // state, which under D-M2-F-r is present-but-dimmed rather than absent.
  await control.getByRole('button', { name: 'Run it again' }).click()
  await expect(
    control.locator('[class*="detail"]').filter({ hasText: 'Monday, 11:00' }).first(),
  ).toHaveCSS('opacity', '0.3')
})

test('the Arabic section is native RTL, not a mirrored English layout', async ({ page }) => {
  await asVisitor(page)
  const arabic = page.locator('#arabic')
  await arabic.scrollIntoViewIfNeeded()
  const panel = arabic.locator('[dir="rtl"][lang="ar"]').first()
  await expect(panel).toBeVisible()
  await expect(panel).toHaveCSS('direction', 'rtl')
})

test('@reduced-motion the orbit is a composed still and no video mounts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await asVisitor(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.')

  // BrandVideo never mounts under reduced motion — the poster carries the
  // whole story (concept/BrandVideo.tsx).
  await expect(page.locator('video')).toHaveCount(0)

  // Every section's content is present and readable, engine or no engine.
  await expect(page.getByRole('heading', { name: /One event becomes everything/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /You stay in control/ })).toBeVisible()
})

test('the visitor world does not leak into the signed-in app', async ({ page }) => {
  // The isolation guarantee (styles/marketing.css): the concept tokens hang
  // off html[data-mk-world], and the attribute leaves with the layout.
  await asVisitor(page)
  await expect(page.locator('html')).toHaveAttribute('data-mk-world', '')

  await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-mk-world', '')
  await expect(page.locator('.mk-world')).toHaveCount(0)
})

test('the marketing world self-hosts its type — no font request leaves', async ({ page }) => {
  // The fixture already fails the test on any off-origin request; this asserts
  // the faces really arrived rather than silently falling back to system-ui,
  // which is how a "zero network" font setup passes while looking wrong.
  await asVisitor(page)
  await expect(page.locator('.mk-world')).toBeVisible()
  const families = await page.evaluate(() => ({
    world: getComputedStyle(document.querySelector('.mk-world')!).fontFamily,
    // FontFaceSet is a Set-like, not an ArrayLike, and this file compiles
    // under a lib target without downlevel iteration — forEach is the portable
    // way to walk it.
    loaded: (() => {
      const families: string[] = []
      document.fonts.forEach((f) => {
        if (f.status === 'loaded') families.push(f.family)
      })
      return families
    })(),
  }))
  expect(families.world).toContain('DM Sans')
  expect(families.loaded).toContain('DM Sans Variable')
})

test('page titles follow the route', async ({ page }) => {
  await asVisitor(page)
  await expect(page).toHaveTitle('Malaky — Your marketing was working before you were')

  await page.getByRole('banner').getByRole('link', { name: 'Pricing' }).first().click()
  await expect(page).toHaveTitle('Pricing — Malaky')

  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Request a private demo' })
    .first()
    .click()
  await expect(page).toHaveTitle('Request a private demo — Malaky')
})

test(
  'every marketing route scans clean apart from the four allowlisted pairs',
  { tag: '@axe' },
  async ({ page }) => {
    await settledHomepage(page)
    expect(unexpected(await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze())).toEqual([])

    for (const [route, heading] of [
      ['/pricing', /Malaky is not another tool/],
      ['/request-demo', /Let.s see what Malaky could run/],
      ['/terms', /Website Terms of Use/],
      ['/privacy', /Privacy Policy/],
    ] as const) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(unexpected(scan), `${route} has axe violations beyond the allowlist`).toEqual([])
    }
  },
)

/**
 * The allowlist has to stay honest in the other direction too: if the palette
 * is fixed (D-M2-F restored before `main`), these pairs stop being reported
 * and the entries above are dead weight pretending to cover something.
 */
test('the allowlisted pairs are really still on the page', { tag: '@axe' }, async ({ page }) => {
  await settledHomepage(page)
  const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const reported = new Set(
    scan.violations
      .filter((violation) => violation.id === 'color-contrast')
      .flatMap((violation) =>
        violation.nodes.flatMap((node) =>
          node.any
            .filter((check) => check.id === 'color-contrast')
            .map((check) => {
              const data = check.data as { fgColor?: string; bgColor?: string } | undefined
              return `${data?.fgColor?.toLowerCase()} on ${data?.bgColor?.toLowerCase()}`
            }),
        ),
      ),
  )
  // The homepage carries findings 1, 2 and 3 of the four.
  expect(reported.size, 'the prototype palette should still be failing here').toBeGreaterThan(0)
  for (const pair of reported) {
    expect(
      ALLOWED_PAIRS.some((entry) => `${entry.fg} on ${entry.bg}` === pair),
      `${pair} is reported but appears in neither allowlist — identify the element before adding it, and put it in the group it actually belongs to`,
    ).toBe(true)
  }
})
