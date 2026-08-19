// W2 verify orchestrator -- the marketing + auth + onboarding checklist from web-plan.md.
// Usage: pnpm verify:w02 [--skip-e2e]
//
// W2 Verify coverage, and where each item is actually proven:
//   "every A/M state renders per screens4 across the dataset + state switchers"
//        -> the `visitor` dataset plus e2e/onboarding.spec.ts
//   "Playwright golden: signup -> verify -> onboard -> dashboard"
//        -> the @golden test, run below and asserted to exist
//   "plans stay one source" -> src/data/entities/plans.test.ts (H1 reads
//        usePlans(); marketing renders no plans since D3, 2026-08-10)
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
 * The marketing layer's structural laws (design.md Part 5 -- "Marketing
 * layer", post-rebrand). Behavioural tests cannot tell a calm page from one
 * that merely looks calm in the default viewport -- these read the source.
 * Per state.md rule 11, every check matches STRUCTURE (a call, a prop, an
 * import), never prose.
 */
function marketingLawsHold(): boolean {
  console.log('\n=== M1 marketing laws hold (structural) ===')
  const marketingRoot = join(root, 'src', 'features', 'marketing')

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })

  const files = walk(marketingRoot).filter((file) => /\.(ts|tsx)$/.test(file))

  // Comments may QUOTE the laws they uphold, so every textual check below
  // runs against comment-stripped source. Same lesson as W6's "times are
  // honest about zones" check.
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  const sources = new Map(files.map((file) => [file, stripComments(readFileSync(file, 'utf8'))]))
  const named = (name: string) => {
    const hit = files.find((file) => file.endsWith(name))
    return hit ? (sources.get(hit) ?? '') : ''
  }

  const failures: string[] = []
  const isOutputs = (file: string) => file.includes(join('marketing', 'outputs'))

  // 1a. Laws that bind the WHOLE route (design.md Part 5 v2, D8). Scroll
  //     stays native, no animation library enters, nothing scrubs footage --
  //     and the film ban is now an assertion: no canvas, no video, anywhere
  //     on the marketing route.
  const bannedEverywhere: [RegExp, string][] = [
    [/from ['"]lenis['"]|new Lenis/, 'imports Lenis -- scroll stays native'],
    [/from ['"](gsap|motion|framer-motion)/, 'imports an animation library'],
    [/\.currentTime/, 'touches currentTime -- footage scrubbing is retired'],
    [/<video/, 'renders a <video> -- the film is retired from this route (D1)'],
    [/<canvas|getContext\(/, 'draws to a canvas -- the film is retired from this route (D1)'],
    [/['"`]\/film\//, 'references /film/ -- that asset directory was retired (D1)'],
    [/['"`]\/marketing\//, 'references /marketing/ -- that asset directory was retired'],
  ]
  // 1b. Cinematic primitives are legal only inside outputs/ -- the card
  //     engine the reduced-motion gate controls.
  const bannedOutsideOutputs: [RegExp, string][] = [
    [/requestAnimationFrame/, 'runs a rAF loop outside outputs/ -- reveal is CSS-only'],
    [
      /addEventListener\(['"]scroll['"]/,
      'listens to scroll outside outputs/ -- use IntersectionObserver',
    ],
  ]
  // AMENDED for Phase 2 §26 (decisions.md 2026-08-11): content-asset.tsx is
  // the ONE legal <video> seam on the route — the manifest's approved Reel
  // will render there poster-first, muted, in-view only, reduced-motion →
  // poster. The scrubbed-film ban (D1) otherwise stands: currentTime and
  // canvas stay banned everywhere, video stays banned everywhere else, and
  // the seam's own constraints are asserted in 1f below.
  const isVideoSeam = (file: string) => file.endsWith('content-asset.tsx')
  for (const [file, source] of sources) {
    for (const [pattern, why] of bannedEverywhere) {
      if (pattern.source === '<video' && isVideoSeam(file)) continue
      if (pattern.test(source)) failures.push(`${file}: ${why}`)
    }
    if (isOutputs(file)) continue
    for (const [pattern, why] of bannedOutsideOutputs) {
      if (pattern.test(source)) failures.push(`${file}: ${why}`)
    }
  }

  // 1f. The video seam's license is conditional: poster-first, muted, no
  //     eager download, and gated on the cinematic layer.
  const assetSeam = named('content-asset.tsx')
  if (assetSeam) {
    for (const requirement of ['preload="none"', 'muted', 'poster', 'useCinematicLayer']) {
      if (!assetSeam.includes(requirement)) {
        failures.push(`content-asset.tsx: the video seam lost its ${requirement} constraint`)
      }
    }
  }

  // 1c. The engine animates transform/opacity only (D8) -- every style
  //     assignment in outputs/ is on the compositor allow-list.
  const styleProp = /\.style\.(\w+)\s*=/g
  for (const [file, source] of sources) {
    if (!isOutputs(file)) continue
    for (const match of source.matchAll(styleProp)) {
      if (!['transform', 'opacity', 'zIndex'].includes(match[1])) {
        failures.push(`${file}: engine sets style.${match[1]} -- transform/opacity only`)
      }
    }
  }

  // 1d. The reduced-motion gate is the tier's whole license: the hook must
  //     affirm no-preference positively, and the story must mount the engine
  //     behind it.
  const gate = named('use-media.ts')
  if (!/matchMedia/.test(gate) || !gate.includes('prefers-reduced-motion: no-preference')) {
    failures.push('use-media.ts: the layer gate must affirm no-preference via matchMedia')
  }
  const story = named('scroll-story.tsx')
  if (!/useCinematicLayer\(\)/.test(story)) {
    failures.push('scroll-story.tsx: the engine lost its useCinematicLayer() gate')
  }
  if (!/data-mk-engine/.test(story)) {
    failures.push('scroll-story.tsx: the engine root lost data-mk-engine (the e2e hook)')
  }
  if (!/cinematic\s*&&\s*wide\s*\?/.test(story)) {
    failures.push('scroll-story.tsx: the engine must render behind the gate AND the width check')
  }

  // 1d2. The D5 palette exemption is scoped: raw customer colors live in
  //      demo-brands.ts alone. This check reads RAW source (the disable is
  //      a comment), so it runs against `files`, not `sources`.
  for (const file of files) {
    if (file.endsWith('demo-brands.ts')) continue
    if (readFileSync(file, 'utf8').includes('ab/no-raw-color')) {
      failures.push(`${file}: borrows the D5 raw-color exemption -- demo-brands.ts only`)
    }
  }

  // 1e. Native RTL is structural, not styling: the Arabic card declares its
  //     direction and language.
  const cards = named('post-cards.tsx')
  if (!/dir="rtl"/.test(cards) || !/lang="ar"/.test(cards)) {
    failures.push('post-cards.tsx: the Arabic card must declare dir="rtl" and lang="ar"')
  }

  // 2. The reveal's and the stages' animated state exists only under
  //    no-preference, so reduced motion renders every section finished
  //    (removed, not slowed).
  const globals = readFileSync(join(root, 'src', 'styles', 'globals.css'), 'utf8')
  const noPref = globals.indexOf('prefers-reduced-motion: no-preference')
  for (const attribute of ['[data-mk-reveal]', '[data-mk-stage]']) {
    const at = globals.indexOf(attribute)
    if (noPref === -1 || at === -1 || at < noPref) {
      failures.push(`globals.css: ${attribute} styles are not inside the no-preference query`)
    }
  }

  // 3. The wordmark law (design.md Part 3): the Arabic artwork enters only as
  //    an <img> of one of the three supplied files -- never redrawn as SVG or
  //    text.
  const home = named('marketing-home.tsx')
  if (!/\/brand\/malaky-logo-(charcoal|gold|white)\.png/.test(home)) {
    failures.push('marketing-home.tsx: the supplied wordmark files are not used')
  }

  // 3c. Light-canonical (design.md Part 6 rule 8): the route ignores the app
  //     theme.
  if (!/classList\.remove\(['"]dark['"]\)/.test(home)) {
    failures.push('marketing-home.tsx: the light-canonical effect is missing')
  }

  // 4. Copy laws (brief §2/§14/§19/§28/§29 via D2/D7; comment-stripped, the
  //    whole marketing route). The site sells outcomes -- never the old
  //    positioning, model names, or credit terminology -- and exactly one
  //    CTA pair exists.
  const copyBans: [RegExp, string][] = [
    [/co-?pilot/i, 'the co-pilot positioning is retired (brief §2)'],
    [/\bdrafting model/i, 'model terminology is banned on the marketing route (§28)'],
    [
      /\b(Balanced|Precise|Creative) drafting/i,
      'model names are banned on the marketing route (§28)',
    ],
    [/\bcredits?\b/i, 'credit terminology is banned on the marketing route (§28)'],
    // AMENDED by the founder's 2026-08-11 production pass (item 12): the
    // launch model is early access until self-service publishing ships, so
    // "Request early access" is THE acquisition CTA and "Start free" joins
    // the banned list -- the two launch models must never mix. The
    // pricing-section seam keeps its "Start free" for the flip back; it is
    // unlinked and exempted below.
    [
      /Book demo|Request demo|Join waitlist|Try Malaky|Get started|Start free/i,
      'a banned CTA variant (launch model: Request early access / See how it works only)',
    ],
    [/Questions people ask/, 'the FAQ title is "Frequently asked questions" (§29)'],
  ]
  for (const [file, source] of sources) {
    if (file.endsWith('pricing-section.tsx')) continue // the unlinked seam
    for (const [pattern, why] of copyBans) {
      if (pattern.test(source)) failures.push(`${file}: ${why}`)
    }
  }
  if (!home.includes('Request early access') || !home.includes('See how it works')) {
    failures.push(
      'marketing-home.tsx: the CTA pair is incomplete (Request early access / See how it works)',
    )
  }
  if (!home.includes('Frequently asked questions')) {
    failures.push('marketing-home.tsx: the FAQ heading is missing (§29)')
  }
  if (!home.includes('Your marketing, already done.')) {
    failures.push('marketing-home.tsx: the §2 hero headline is missing')
  }

  // 5. Retired laws, recorded so their absence is conscious (decisions.md
  //    2026-08-10): "pricing keeps usePlans()" retired with D3 (no plans on
  //    the page; the seam re-links the same source if it flips), and the kit
  //    §5 real-product-content laws (useTones/ToneBadge/useConnections)
  //    retired with the §33 flow — demo-brand content replaces them, and no
  //    local plan data may return:
  if (/priceMonthly\s*:/.test(home)) {
    failures.push('marketing-home.tsx: declares plan data locally (D3 keeps plans off this page)')
  }

  for (const failure of failures) console.log(`  FAIL ${failure}`)
  const ok = failures.length === 0
  if (ok) console.log(`marketing laws: ${files.length} marketing files clean`)
  results.push({ name: 'M1 marketing laws hold', outcome: ok ? 'PASS' : 'FAIL' })
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
    // M1 (+ the output story, rb/02-v1-brief)
    'src/features/marketing/marketing-home.tsx',
    'src/features/marketing/reveal.tsx',
    'src/features/marketing/pricing-section.tsx', // the D3 seam, unlinked
    'src/features/marketing/outputs/demo-brands.ts',
    'src/features/marketing/outputs/post-cards.tsx',
    'src/features/marketing/outputs/approval-demo.tsx',
    'src/features/marketing/outputs/story-layout.ts',
    'src/features/marketing/outputs/scroll-story.tsx',
    'src/features/marketing/outputs/story-sections.tsx',
    'src/features/marketing/outputs/workspace-section.tsx',
    'src/features/marketing/outputs/use-media.ts',
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
      'M1 marketing laws hold',
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
  console.log('  1. Read the marketing copy as a prospect would: does the hero say what')
  console.log('     Malaky makes, and does every section answer one of the five brief')
  console.log('     questions (what / why different / why trust / built for me / next)?')
  console.log('  2. Walk the wizard on a phone-width viewport -- the day pills, the')
  console.log('     stepper, and the tone sheet are the three places touch targets and')
  console.log('     overlay behaviour are hardest to get right.')
  console.log('  3. M1 is light-canonical (Part 6 rule 8): confirm it renders light even')
  console.log('     with the app in dark, and that the app itself still honors dark.')
  console.log('  4. Scroll M1 end to end by hand -- the card story should separate, focus')
  console.log('     and reorganize slowly with no bounce or pop; approve the S5 card and')
  console.log('     watch it schedule; on a phone the cards swipe; with reduced motion on,')
  console.log('     the static layout is complete and readable, no engine.')

  process.exit(failed ? 1 : 0)
}

main()
