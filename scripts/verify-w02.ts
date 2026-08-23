// W2 verify orchestrator -- the marketing + auth + onboarding checklist from web-plan.md.
// Usage: pnpm verify:w02 [--skip-e2e]
//
// W2 Verify coverage, and where each item is actually proven:
//   "every A/M state renders per screens4 across the dataset + state switchers"
//        -> the `visitor` dataset plus e2e/onboarding.spec.ts
//   "Playwright golden: signup -> verify -> onboard -> dashboard"
//        -> the @golden test, run below and asserted to exist
//   "plans stay one source" -> src/data/entities/plans.test.ts (H1 reads
//        usePlans()). SUPERSEDED FOR MARKETING by D-M2-B, 2026-08-23: the
//        pricing page is marketing's own data module and no longer touches
//        the app's plan entities at all -- the two documents have different
//        owners. The structural check below asserts the separation.
//   "posts_per_day=4 blocked with the named message"
//        -> the cap canary below, plus the e2e cap test
//   "axe + reduced-motion clean" -> the Playwright @axe / @reduced-motion specs

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

type Outcome = 'PASS' | 'FAIL' | 'SKIP'

interface Result {
  name: string
  outcome: Outcome
}

const results: Result[] = []
const skipE2e = process.argv.includes('--skip-e2e')

function run(cmd: string): number {
  console.log(`\n> ${cmd}`)
  return spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: root }).status ?? 1
}

function step(name: string, cmd: string): boolean {
  console.log(`\n=== ${name} ===`)
  const ok = run(cmd) === 0
  results.push({ name, outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function skip(name: string): void {
  results.push({ name, outcome: 'SKIP' })
}

/**
 * The cap is a shared rule, not a per-screen check: `MAX_POSTS_PER_DAY` and the
 * zod schema that names the message both live in data/types.ts. This asserts the
 * rule is stated once and worded from the catalogue -- a fourth post being
 * blocked by a hand-rolled `if` in some screen would pass e2e and still be wrong.
 */
function capIsDeclaredOnce(): boolean {
  console.log('\n=== posts-per-day cap is declared once, with a named message ===')
  const types = readFileSync(join(root, 'src', 'data', 'types.ts'), 'utf8')
  const messages = readFileSync(join(root, 'src', 'lib', 'messages.ts'), 'utf8')

  const declaresCap = /export const MAX_POSTS_PER_DAY = 3/.test(types)
  const schemaUsesCap = /\.max\(MAX_POSTS_PER_DAY, MESSAGES\.errors\.postsPerDayCap\)/.test(types)
  const messageExists = /postsPerDayCap:\s*'[^']+'/.test(messages)

  const ok = declaresCap && schemaUsesCap && messageExists
  console.log(
    ok
      ? 'cap: MAX_POSTS_PER_DAY = 3, enforced by the shared schema with the catalogue message'
      : `cap check failed -- declared:${declaresCap} schema:${schemaUsesCap} message:${messageExists}`,
  )
  results.push({ name: 'posts-per-day cap declared once', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/**
 * The visitor world's structural laws (M2 — the concept-v2 port; design.md
 * Part 7). Behavioural tests cannot tell a faithful port from one that has
 * quietly grown a second opinion — these read the source.
 *
 * Per state.md rule 11 every check below matches STRUCTURE (an import, a
 * declaration, a token, a file's existence), never prose. The one place copy
 * is asserted is the pair of strings `index.html` and `site.ts` must agree on,
 * and there the point IS that two files say the same thing.
 */
function marketingLawsHold(): boolean {
  console.log('\n=== the visitor world holds its laws (structural) ===')
  const marketingRoot = join(root, 'src', 'features', 'marketing')

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })

  const files = walk(marketingRoot).filter((file) => /\.(ts|tsx)$/.test(file))
  const codeFiles = files.filter((file) => !/\.test\.tsx?$/.test(file))

  // Comments may QUOTE the laws they uphold — and the port's comments cite
  // upstream files by their real `app/concept-v2/...` paths, which is exactly
  // the string one of these checks bans in code. So every textual check runs
  // against comment-stripped source.
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  const sources = new Map(
    codeFiles.map((file) => [file, stripComments(readFileSync(file, 'utf8'))]),
  )
  const named = (name: string) => {
    const hit = codeFiles.find((file) => file.endsWith(name))
    return hit ? (sources.get(hit) ?? '') : ''
  }
  const rel = (file: string) => file.slice(root.length).replace(/\\/g, '/')

  const failures: string[] = []

  // 1. THE PORT IS A PORT. Nothing Next-shaped survived the translation, and
  //    no prototype route is left typed into code (D-M2-A..D).
  const bannedEverywhere: [RegExp, string][] = [
    [/from ['"]next\//, 'imports from next/ — this is a Vite SPA'],
    [/^\s*['"]use client['"]/m, 'still carries a "use client" directive'],
    [/concept-v2/, 'names a /concept-v2 route — the prototype segment is gone'],
    [/from ['"](gsap|motion|framer-motion|lenis)/, 'imports an animation library'],
    [/fonts\.(googleapis|gstatic)\.com/, 'reaches for Google Fonts — the faces are self-hosted'],
  ]
  for (const [file, source] of sources) {
    for (const [pattern, why] of bannedEverywhere) {
      if (pattern.test(source)) failures.push(`${rel(file)}: ${why}`)
    }
  }

  // 2. THE PURCHASE FICTION DID NOT COME ACROSS (D-M2-C). Next to a real
  //    signup it would be a second, fake "get started" journey. Its modules
  //    are named here so re-adding one fails loudly rather than quietly.
  const notPorted = [
    'purchase',
    'PaymentSurface',
    'Checkout',
    'GetStarted',
    'StepRail',
    'flow-state',
    'commerce',
    'onboarding-steps',
    'adapters',
  ]
  for (const name of notPorted) {
    const hit = codeFiles.find(
      (file) => file.replace(/\\/g, '/').includes(`/concept/`) && file.includes(name),
    )
    if (hit) failures.push(`${rel(hit)}: the purchase flow is deliberately NOT ported (D-M2-C)`)
  }

  // 3. MARKETING OWNS ITS OWN DATA (D-M2-B). The pricing page reads
  //    concept/lib/pricing.ts, and nothing in the visitor world reaches into
  //    the app's data layer — with ONE exception, the layout, which asks the
  //    provider whether '/' is the site or the product.
  const dataReaders = [...sources]
    .filter(([, source]) => /from ['"]@\/data/.test(source))
    .map(([file]) => rel(file))
  const legalDataReader = 'src/features/marketing/marketing-layout.tsx'
  for (const file of dataReaders) {
    if (file !== legalDataReader) {
      failures.push(`${file}: reads @/data — marketing data is its own (D-M2-B)`)
    }
  }
  const pricing = named(join('lib', 'pricing.ts'))
  if (!/export const PLANS/.test(pricing) || !/export const MANAGED/.test(pricing)) {
    failures.push('concept/lib/pricing.ts: the ported pricing data is missing (D-M2-B)')
  }
  const pricingScreen = named('pricing-screen.tsx')
  if (/usePlans\(/.test(pricingScreen)) {
    failures.push('pricing-screen.tsx: marketing must not read usePlans() (D-M2-B)')
  }

  // 4. ONE WIRING MAP (D-M2-D). Every CTA resolves through concept/site.ts,
  //    and the two decisions the founder can veto are declared there in one
  //    place. `site.test.ts` proves no component types a route by hand; this
  //    proves the map says what the decision says.
  const site = named(join('concept', 'site.ts'))
  for (const [declaration, why] of [
    [/export const START_HREF = '\/signup'/, '"Get started" must be the REAL signup'],
    [/export const LOGIN_HREF = '\/login'/, 'Login must be the REAL sign-in'],
    [/export const MARKETING_ROUTES = \{/, 'the wiring map itself'],
  ] as [RegExp, string][]) {
    if (!declaration.test(site)) failures.push(`concept/site.ts: ${why}`)
  }

  // 5. THE HEAD FOLLOWS THE ROUTE. Every marketing screen sets its own title
  //    and description; a page that forgets leaves the tab lying.
  for (const screen of [
    'home-screen.tsx',
    'pricing-screen.tsx',
    'request-demo-screen.tsx',
    'legal-screens.tsx',
  ]) {
    if (!/usePageMeta\(/.test(named(screen))) {
      failures.push(`${screen}: does not set its page meta`)
    }
  }

  // 6. THE HOMEPAGE'S ORDER IS THE ARGUMENT. Claim -> demonstration -> proof
  //    -> control -> memory -> Arabic -> the visitor's own company -> the way
  //    in. Read as the order of the JSX tags, not as copy.
  const home = named('home-screen.tsx')
  const ORDER = [
    'Hero',
    'Prompts',
    'OneEvent',
    'RealBrands',
    'Approval',
    'Memory',
    'Arabic',
    'BrandDemo',
    'ClosingCta',
  ]
  const rendered = [...home.matchAll(/<([A-Z]\w+)/g)].map((m) => m[1])
  if (JSON.stringify(rendered) !== JSON.stringify(ORDER)) {
    failures.push(
      `home-screen.tsx: section order is ${rendered.join(' → ')}, expected ${ORDER.join(' → ')}`,
    )
  }

  // 7. THE VISITOR WORLD CANNOT REACH AN APP SCREEN. Its tokens hang off the
  //    document attribute the layout owns, its resets off the layout's own
  //    class, and the attribute is removed on unmount. If any of the three
  //    goes, the concept's dark palette leaks into the signed-in product.
  const marketingCss = readFileSync(join(root, 'src', 'styles', 'marketing.css'), 'utf8')
  if (!/^html\[data-mk-world\] \{/m.test(marketingCss)) {
    failures.push('styles/marketing.css: the token block is not scoped to html[data-mk-world]')
  }
  if (/^:root\s*\{/m.test(marketingCss)) {
    failures.push('styles/marketing.css: declares tokens on :root — they would leak into the app')
  }
  const layout = named('marketing-layout.tsx')
  if (
    !/setAttribute\('data-mk-world'/.test(layout) ||
    !/removeAttribute\('data-mk-world'/.test(layout)
  ) {
    failures.push('marketing-layout.tsx: the world attribute must be set AND removed')
  }
  if (!/useLayoutEffect/.test(layout)) {
    failures.push('marketing-layout.tsx: the world attribute must be applied before paint')
  }

  // 8. THE FROZEN RHYTHM. The hero is the approved reference and these are its
  //    own paddings; the prototype froze them and said so. Changing one is a
  //    design decision, and it fails here first.
  for (const frozen of [
    '--section-y: clamp(3.5rem, 6vw, 6.5rem);',
    '--section-y-dense: clamp(2.5rem, 4vw, 4.25rem);',
  ]) {
    if (!marketingCss.includes(frozen)) {
      failures.push(`styles/marketing.css: the FROZEN rhythm changed — expected "${frozen}"`)
    }
  }
  // The third value the prototype froze with them: the section head's step
  // down to its content, taken from the hero's own CTA-row-to-strip gap.
  const uiCss = readFileSync(join(marketingRoot, 'concept', 'ui.module.css'), 'utf8')
  if (!uiCss.includes('margin-bottom: clamp(2rem, 3.1vw, 2.75rem);')) {
    failures.push('concept/ui.module.css: the FROZEN section-head gap changed')
  }

  // 9. THE FACES ARE SELF-HOSTED. Two packages, five imports, zero network —
  //    the static e2e asserts no request leaves, and this asserts the reason.
  for (const face of [
    "@import '@fontsource-variable/dm-sans/opsz.css';",
    "@import '@fontsource-variable/dm-sans/opsz-italic.css';",
    "@import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';",
  ]) {
    if (!marketingCss.includes(face)) failures.push(`styles/marketing.css: missing ${face}`)
  }

  // 10. REDUCED MOTION REMOVES, IT DOES NOT SLOW. BrandVideo never mounts a
  //     <video> at all under the preference — the poster carries the story —
  //     and the hook that decides affirms the query positively.
  const hooks = named('useConceptHooks.ts')
  if (!/matchMedia/.test(hooks) || !hooks.includes('prefers-reduced-motion: reduce')) {
    failures.push('useConceptHooks.ts: the reduced-motion gate must read matchMedia')
  }
  const video = named('BrandVideo.tsx')
  const guardAt = video.indexOf('if (reducedMotion)')
  const videoAt = video.indexOf('<video')
  if (guardAt === -1 || videoAt === -1 || guardAt > videoAt) {
    failures.push('BrandVideo.tsx: the <video> must sit behind the reduced-motion return')
  }
  if (!marketingCss.includes('prefers-reduced-motion: reduce')) {
    failures.push('styles/marketing.css: lost its reduced-motion block')
  }

  // 11. THE RAW-COLOR EXEMPTION IS SCOPED. Four files draw artwork or depict
  //     someone else's platform chrome; nowhere else in the visitor world may
  //     borrow their licence. Reads RAW source — the disable IS a comment.
  const EXEMPT = [
    'concept/BrandMedia.tsx',
    'concept/posts/shared.tsx',
    'concept/posts/NewsletterPreview.tsx',
    'concept/lib/campaign-creative.ts',
  ]
  const borrowing = files
    .filter((file) => readFileSync(file, 'utf8').includes('eslint-disable ab/no-raw-color'))
    .map((file) => rel(file).replace('src/features/marketing/', ''))
  const unexpected = borrowing.filter((file) => !EXEMPT.includes(file))
  const missing = EXEMPT.filter((file) => !borrowing.includes(file))
  for (const file of unexpected) {
    failures.push(`${file}: borrows the artwork raw-color exemption — the four listed files only`)
  }
  for (const file of missing) {
    failures.push(`${file}: lost its raw-color exemption comment (or moved)`)
  }

  // 11b. THE QUIET TIERS STAY OFF THE LIGHT FILLS, WITH ONE NAMED EXCEPTION.
  //      `--c-text-3` on `--c-surface-3` is 4.22:1 — under AA. D-M2-F moved
  //      the one place the port did it (the customer monogram) up a tier;
  //      D-M2-F-r put it back, because the review preview has to be
  //      Abdullah's verbatim design. So the sweep still runs over every
  //      marketing stylesheet and BrandMark is allowed BY NAME: a second file
  //      doing the same thing still fails, and if BrandMark ever stops doing
  //      it the exception is reported as stale rather than sitting there
  //      forever (state.md traps 15 and 18 — a check nobody can fail is a
  //      check that has already broken).
  const QUIET_TIER_EXCEPTION = 'concept/BrandMark.module.css'
  const cssFiles = walk(marketingRoot).filter((file) => file.endsWith('.css'))
  let exceptionSeen = false
  for (const file of cssFiles) {
    const css = readFileSync(file, 'utf8')
    const name = rel(file).replace('src/features/marketing/', '')
    for (const block of css.split('}')) {
      const lightFill = /background(?:-color)?:\s*var\(--c-surface-[34]\)/.test(block)
      const quietInk = /color:\s*var\(--c-text-[34]\)/.test(block)
      if (!lightFill || !quietInk) continue
      if (name === QUIET_TIER_EXCEPTION) {
        exceptionSeen = true
        continue
      }
      const selector = block.trim().split('{')[0].trim().split(/\r?\n/).pop() ?? '?'
      failures.push(`${rel(file)}: "${selector}" puts a quiet text tier on a light fill (< AA)`)
    }
  }
  if (!exceptionSeen) {
    failures.push(
      `${QUIET_TIER_EXCEPTION}: no longer puts a quiet tier on a light fill — the D-M2-F-r exception is stale, remove it`,
    )
  }

  // 11c. THE APPROVAL PREVIEW IS FINDING 3 OF 4. The prototype's ghosted card
  //      — `opacity: 0.3`, 1.43:1, and in the accessibility tree before the
  //      visitor has approved anything — is held HERE as a declaration, and
  //      separately in `e2e/marketing.spec.ts`, where axe composites the
  //      opacity and reports the blend. Two checks on one finding is not
  //      redundancy: the scan proves it is what the visitor gets, this proves
  //      it is what the stylesheet says. Asserted PRESENT, so restoring
  //      D-M2-F's `visibility: hidden` before `main` reports this check as
  //      stale rather than passing silently and leaving the allowlist a lie.
  // Comment-stripped, or trap 11 bites: the comment at the site of the revert
  // says the words "visibility: hidden" while explaining that they are gone,
  // and a check that reads prose fails on the explanation of its own subject.
  const approvalCss = stripComments(
    readFileSync(join(marketingRoot, 'concept', 'sections', 'approval.module.css'), 'utf8'),
  )
  const detailBlock = approvalCss.split('}').find((block) => /\n\.detail\s*\{/.test(block)) ?? ''
  if (!/opacity:\s*0\.3/.test(detailBlock)) {
    failures.push(
      'concept/sections/approval.module.css: .detail no longer holds the prototype opacity: 0.3 — D-M2-F-r finding 3 is stale, or the AA pass is back (update open-items 21)',
    )
  }
  if (/visibility:\s*hidden/.test(detailBlock)) {
    failures.push(
      'concept/sections/approval.module.css: .detail hides with visibility — that is D-M2-F, which D-M2-F-r reverted for the review preview',
    )
  }

  // 12. M1 IS RETIRED (D-M2-A), on both sides: its modules are gone from the
  //     tree, and its motion layer is gone from the global stylesheet.
  for (const gone of [
    'src/features/marketing/marketing-home.tsx',
    'src/features/marketing/reveal.tsx',
    'src/features/marketing/pricing-section.tsx',
    'src/features/marketing/outputs',
    'src/features/system/legal-screens.tsx',
    'public/campaigns',
    'public/brand/og-malaky.png',
  ]) {
    if (existsSync(join(root, gone)))
      failures.push(`${gone}: M1 artefact still in the tree (D-M2-A)`)
  }
  const globals = readFileSync(join(root, 'src', 'styles', 'globals.css'), 'utf8')
  const globalsCode = stripComments(globals)
  for (const attribute of [
    '[data-mk-reveal]',
    '[data-mk-stage]',
    '[data-mk-ambient]',
    '[data-mk-card3d]',
  ]) {
    if (globalsCode.includes(attribute)) {
      failures.push(`globals.css: ${attribute} is M1's motion layer and should be gone (D-M2-A)`)
    }
  }

  // 13. THE HEAD AND THE MODULE SAY THE SAME THING. index.html is what a
  //     crawler reads; site.ts is what a client-side navigation sets. Two
  //     sources for one homepage title is how they drift.
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  const title = /export const HOME_TITLE = '([^']+)'/.exec(site)?.[1]
  const ogPath = /url: '([^']+)'/.exec(site)?.[1]
  if (!title || !html.includes(`<title>${title}</title>`)) {
    failures.push('index.html: its <title> is not site.ts’s HOME_TITLE')
  }
  if (!ogPath || !html.includes(ogPath)) {
    failures.push('index.html: its og:image is not site.ts’s OG_IMAGE')
  }

  for (const failure of failures) console.log(`  FAIL ${failure}`)
  const ok = failures.length === 0
  if (ok) console.log(`visitor-world laws: ${codeFiles.length} marketing files clean`)
  results.push({ name: 'visitor-world laws hold', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/** A phase is not done because its tests pass -- it is done when its screens exist. */
/**
 * A PRODUCTION BUILD MUST NEVER BOOT SIGNED-IN.
 *
 * Not a hypothetical: production shipped with no environment variables,
 * `VITE_DEFAULT_DATASET` was never set on Vercel, and `/` served the signed-in
 * demo dashboard to every visitor for ten days. The default is derived from the
 * BUILD now, so this asserts both halves of that claim:
 *
 *  1. SOURCE — the default is chosen by `import.meta.env.PROD`, and the
 *     production branch is `visitor`. An inverted ternary, or a revert to a
 *     plain constant, fails here.
 *  2. ARTIFACT — the emitted bundle really does fall back to `visitor`. Vite
 *     folds `import.meta.env.PROD` at build time, so `dist/` contains the
 *     registry, a constant `"visitor"`, and a resolver using that constant as
 *     its fallback. The constant's NAME is minified and changes per build, so
 *     it is captured and matched by backreference rather than hard-coded.
 *
 * The artifact half is what makes this more than a style rule: it is the only
 * check that would have caught the incident, because the source was fine and
 * the DEPLOYMENT was what defaulted wrong.
 */
function productionBootsVisitor(): boolean {
  console.log('\n=== a production build boots into the visitor world ===')
  const source = readFileSync(join(root, 'src', 'data', 'datasets', 'index.ts'), 'utf8')

  const derivedFromBuild =
    /export const DEFAULT_DATASET_ID:\s*DatasetId\s*=\s*import\.meta\.env\.PROD\s*\?\s*'visitor'\s*:\s*'active'/.test(
      source,
    )

  // The built chunk: `…],NAME="visitor";function r(e){return REG.some(…)?e:NAME}`
  const distDir = join(root, 'dist', 'assets')
  let artifactFallsBackToVisitor = false
  let scanned = 0
  if (existsSync(distDir)) {
    for (const file of readdirSync(distDir).filter((name) => name.endsWith('.js'))) {
      const bundle = readFileSync(join(distDir, file), 'utf8')
      scanned += 1
      const declared =
        /\{id:"active",build:[^}]+\}[\s\S]{0,600}?\],\s*([A-Za-z_$][\w$]*)\s*=\s*"visitor"/.exec(
          bundle,
        )
      if (!declared) continue
      const constant = declared[1]
      // String.raw, because a plain template literal eats the backslashes:
      // an escaped dot would become `.` (any char) and the whitespace class
      // would become a literal `s`, so the regex would quietly match the
      // wrong thing instead of failing loudly.
      const usedAsFallback = new RegExp(
        String.raw`\.some\(\s*\w+\s*=>\s*\w+\.id\s*===\s*\w+\s*\)\s*\?\s*\w+\s*:\s*` +
          constant +
          String.raw`\b`,
      ).test(bundle)
      if (usedAsFallback) {
        artifactFallsBackToVisitor = true
        break
      }
    }
  }

  const ok = derivedFromBuild && artifactFallsBackToVisitor
  results.push({ name: 'production boots into visitor', outcome: ok ? 'PASS' : 'FAIL' })
  console.log(
    ok
      ? 'production default: source derives it from the build, and dist falls back to "visitor"'
      : `production-default check FAILED -- source:${derivedFromBuild} artifact:${artifactFallsBackToVisitor} (scanned ${scanned} chunk(s); run a build first)`,
  )
  return ok
}

function deliverablesExist(): boolean {
  console.log('\n=== W2 deliverables exist ===')
  const required = [
    // M1 (the visitor world — concept-v2, M2)
    'src/features/marketing/marketing-layout.tsx',
    'src/features/marketing/home-screen.tsx',
    'src/features/marketing/pricing-screen.tsx',
    'src/features/marketing/request-demo-screen.tsx',
    'src/features/marketing/legal-screens.tsx',
    'src/features/marketing/concept/site.ts',
    'src/features/marketing/concept/site.test.ts',
    'src/features/marketing/concept/Header.tsx',
    'src/features/marketing/concept/Footer.tsx',
    'src/features/marketing/concept/BrandMedia.tsx',
    'src/features/marketing/concept/hero/Hero.tsx',
    'src/features/marketing/concept/sections/ClosingCta.tsx',
    'src/features/marketing/concept/branddemo/BrandDemo.tsx',
    'src/features/marketing/concept/pricing/PricingPage.tsx',
    'src/features/marketing/concept/requestdemo/RequestDemo.tsx',
    'src/features/marketing/concept/legal/LegalPage.tsx',
    'src/features/marketing/concept/lib/pricing.ts',
    'src/features/marketing/concept/lib/demo-request.ts',
    'src/features/marketing/concept/lib/legal.ts',
    'src/styles/marketing.css',
    'src/styles/marketing-tokens.test.ts',
    'src/lib/page-meta.ts',
    // the assets the port renders from
    'public/og/malaky-social.png',
    'public/brand/malaky-logo-gold.png',
    // A1-A4
    'src/features/auth/auth-layout.tsx',
    'src/features/auth/signup-screen.tsx',
    'src/features/auth/signin-screen.tsx',
    'src/features/auth/verify-email-screen.tsx',
    'src/features/auth/reset-password-screen.tsx',
    'src/features/auth/password-rules.ts',
    'src/features/auth/password-strength.tsx',
    'src/features/auth/use-countdown.ts',
    // A5
    'src/features/onboarding/onboarding-screen.tsx',
    'src/features/onboarding/wizard-shell.tsx',
    'src/features/onboarding/pipeline-fields.tsx',
    'src/features/settings/tone-editor.tsx',
    // N3 + the signed-out world every A/M state needs
    'src/features/system/empty-org-screen.tsx',
    'src/data/datasets/visitor.ts',
    // the specs that sign the phase off
    'e2e/onboarding.spec.ts',
    'e2e/marketing.spec.ts',
  ]
  const missing = required.filter((path) => !existsSync(join(root, path)))
  if (missing.length) {
    console.log('missing:')
    for (const path of missing) console.log(`  - ${path}`)
  } else {
    console.log(`all ${required.length} W2 deliverables present`)
  }

  // The golden walk is named in the plan, so its absence has to fail loudly
  // rather than leaving the phase green with no journey covered.
  const spec = readFileSync(join(root, 'e2e', 'onboarding.spec.ts'), 'utf8')
  const hasGolden = /@golden/.test(spec) && /signup/.test(spec) && /dashboard/i.test(spec)
  if (!hasGolden) console.log('missing: the @golden signup -> verify -> onboard -> dashboard walk')

  const ok = missing.length === 0 && hasGolden
  results.push({ name: 'W2 deliverables exist', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function main(): void {
  let failed = false

  for (const [name, cmd] of [
    ['lint', 'pnpm lint'],
    ['typecheck', 'pnpm typecheck'],
    ['unit tests', 'pnpm test'],
    ['guard-static', 'pnpm guard:static'],
    ['build', 'pnpm build'],
  ] as const) {
    if (!step(name, cmd)) {
      failed = true
      console.log(`step failed: ${name} -- remaining steps skipped`)
      break
    }
  }

  if (!failed) {
    if (!capIsDeclaredOnce()) failed = true
    if (!productionBootsVisitor()) failed = true
    if (!marketingLawsHold()) failed = true
    if (!deliverablesExist()) failed = true

    if (skipE2e) {
      skip('e2e (@golden walk, marketing + auth axe)')
      console.log('\ne2e skipped (--skip-e2e)')
    } else {
      run('pnpm exec playwright install chromium')
      if (!step('e2e (@golden walk, marketing + auth axe)', 'pnpm e2e')) failed = true
    }
  } else {
    for (const name of [
      'posts-per-day cap declared once',
      'visitor-world laws hold',
      'W2 deliverables exist',
      'e2e (@golden walk, marketing + auth axe)',
    ]) {
      skip(name)
    }
  }

  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW2 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')

  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W2 Verify):')
  console.log('  1. Read the visitor world as a prospect would, end to end: does the hero')
  console.log('     say what Malaky makes, and does each section answer one question')
  console.log('     (what / how / proof / control / memory / Arabic / your company / next)?')
  console.log('  2. Walk the wizard on a phone-width viewport -- the day pills, the')
  console.log('     stepper, and the tone sheet are the three places touch targets and')
  console.log('     overlay behaviour are hardest to get right.')
  console.log('  3. Cross the seam at "Get started": /signup still wears the APP design.')
  console.log('     That is deliberate this pass and logged as an open item -- confirm it')
  console.log('     reads as a change of place, not as a broken page.')
  console.log('  4. Scroll the homepage by hand at 1440 and at 390: the hero orbit turns')
  console.log('     and slows on hover, the card stack swipes on the phone, the brand demo')
  console.log('     runs a company and says it is a preview, and with reduced motion on')
  console.log('     every section is complete and still, with no video mounted.')
  console.log('  5. D-M2-F-r: this branch carries the PROTOTYPE values, so four known')
  console.log('     WCAG AA failures are live and allowlisted, not fixed -- white ink')
  console.log('     on the orange CTA (3.29:1, 2.83:1 on hover), the fourth text tier')
  console.log('     at #5d5a57 (2.64-2.93:1, ~40 elements), the approval preview')
  console.log('     ghosted at opacity 0.3 (1.43:1, and in the a11y tree early), and')
  console.log('     the customer monogram at 4.22:1. The preview is Abdullah\'s design')
  console.log('     verbatim ON PURPOSE. Re-apply D-M2-F before this reaches main.')

  process.exit(failed ? 1 : 0)
}

main()
