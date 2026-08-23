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

/** A signed-out prospect: '/' is the marketing site. */
const asVisitor = (page: Page) => activateDataset(page, 'Visitor (signed out)')

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

  // Before approval, the outcome is genuinely absent — not a dimmed preview
  // of a decision nobody has made yet.
  await expect(control.getByText('Monday, 11:00 — the slot this audience reads.')).toBeHidden()

  await control.getByRole('button', { name: 'Approve', exact: true }).click()

  await expect(control.getByText('Monday, 11:00 — the slot this audience reads.')).toBeVisible()
  // exact:true — the live region says "Scheduled — preference remembered" too,
  // and getByText matches by substring (state.md traps 9 and 16).
  await expect(control.getByText('Preference remembered', { exact: true })).toBeVisible()
  await expect(control.getByText('Scheduled — preference remembered')).toBeVisible()
  await expect(
    control.getByText("Nothing else to do. You'll see it go out on Monday."),
  ).toBeVisible()

  // And it is a demonstration, so it can be run again.
  await control.getByRole('button', { name: 'Run it again' }).click()
  await expect(control.getByText('Monday, 11:00 — the slot this audience reads.')).toBeHidden()
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

test('every marketing route scans clean', { tag: '@axe' }, async ({ page }) => {
  await asVisitor(page)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  for (const [route, heading] of [
    ['/pricing', /Malaky is not another tool/],
    ['/request-demo', /Let.s see what Malaky could run/],
    ['/terms', /Website Terms of Use/],
    ['/privacy', /Privacy Policy/],
  ] as const) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(scan.violations, `${route} has axe violations`).toEqual([])
  }
})
