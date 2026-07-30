// W2 verify orchestrator -- the marketing + auth + onboarding checklist from web-plan.md.
// Usage: pnpm verify:w02 [--skip-e2e]
//
// W2 Verify coverage, and where each item is actually proven:
//   "every A/M state renders per screens4 across the dataset + state switchers"
//        -> the `visitor` dataset plus e2e/onboarding.spec.ts
//   "Playwright golden: signup -> verify -> onboard -> dashboard"
//        -> the @golden test, run below and asserted to exist
//   "marketing pricing and H1 pricing assert equal from one module"
//        -> src/data/entities/plans.test.ts (structural: both read usePlans())
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
 * The cinematic layer's structural laws (design.md Part 5 -- "Marketing
 * cinematic layer"). Behavioural tests cannot tell a canvas scrub from a
 * video being seeked, or a guarded Lenis from an unconditional one -- these
 * read the source. Per state.md rule 11, every check matches STRUCTURE (a
 * call, a prop, an import), never prose.
 */
function cinematicLawsHold(): boolean {
  console.log('\n=== M1 cinematic laws hold (structural) ===')
  const marketingRoot = join(root, 'src', 'features', 'marketing')

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })

  const files = walk(marketingRoot).filter((file) => /\.(ts|tsx)$/.test(file))

  // Comments may QUOTE the laws they uphold (hero-scrub's doc comment names
  // the currentTime ban; that is not a violation) -- so every textual check
  // below runs against comment-stripped source. Same lesson as W6's
  // "times are honest about zones" check.
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  const sources = new Map(files.map((file) => [file, stripComments(readFileSync(file, 'utf8'))]))
  const named = (name: string) => {
    const hit = files.find((file) => file.endsWith(name))
    return hit ? (sources.get(hit) ?? '') : ''
  }

  const failures: string[] = []

  // 1. The scrub runs on canvas frames, never on video currentTime.
  for (const [file, source] of sources) {
    if (source.includes('currentTime')) {
      failures.push(`${file}: touches currentTime -- the scrub law forbids video seeking`)
    }
  }
  const heroScrub = named('hero-scrub.tsx')
  if (!/getContext\('2d'\)/.test(heroScrub) || !/HeroFrameStore/.test(heroScrub)) {
    failures.push('hero-scrub.tsx: no canvas + HeroFrameStore -- the scrub must draw frames')
  }

  // 2. Reduced motion gets the finished frame, not a slower film.
  if (
    !/usePrefersReducedMotion/.test(heroScrub) ||
    !/CINEMATIC_MEDIA\.heroStatic/.test(heroScrub)
  ) {
    failures.push('hero-scrub.tsx: missing the reduced-motion still path')
  }

  // 3. Lenis is never constructed when motion is reduced: the guard must
  //    return before the constructor runs.
  const lenis = named('use-lenis.ts')
  const guardAt = lenis.indexOf('if (!enabled) return')
  const buildAt = lenis.indexOf('new Lenis')
  if (guardAt === -1 || buildAt === -1 || guardAt > buildAt) {
    failures.push('use-lenis.ts: new Lenis is not behind the enabled guard')
  }

  // 4. Pricing stays on the one plan source: the hook, and no local records.
  const home = named('marketing-home.tsx')
  if (!/usePlans\(\)/.test(home)) failures.push('marketing-home.tsx: pricing lost usePlans()')
  if (/priceMonthly\s*:/.test(home)) {
    failures.push('marketing-home.tsx: declares plan data locally instead of reading the provider')
  }

  // 5. Every marketing <video> is muted inline ambience or a controlled
  //    player -- silent, and either aria-hidden or pausable.
  for (const [file, source] of sources) {
    const chunks = source.split('<video').slice(1)
    for (const chunk of chunks) {
      const tag = chunk.slice(0, chunk.indexOf('/>'))
      if (!/\bmuted\b/.test(tag) || !/\bplaysInline\b/.test(tag)) {
        failures.push(`${file}: a <video> is missing muted/playsInline`)
      }
      if (!/aria-hidden/.test(tag) && !/\bcontrols\b/.test(tag)) {
        failures.push(`${file}: a <video> is neither aria-hidden ambience nor a controls player`)
      }
    }
  }

  // 6. Media paths live in media.ts / hero-frames.ts only, so the asset
  //    inventory has one home. Tests are exempt: they assert the paths.
  for (const [file, source] of sources) {
    if (file.endsWith('media.ts') || file.endsWith('hero-frames.ts')) continue
    if (/\.test\.tsx?$/.test(file)) continue
    if (source.includes("'/marketing/")) {
      failures.push(`${file}: hardcodes a /marketing/ asset path -- add it to media.ts`)
    }
  }

  // 7. The tone chips are the product's real tones, rendered the mandated way.
  const toneMorph = named('tone-morph.tsx')
  if (!/useTones\(\)/.test(toneMorph) || !/<ToneBadge/.test(toneMorph)) {
    failures.push('tone-morph.tsx: chips must read useTones() and render ToneBadge')
  }

  for (const failure of failures) console.log(`  FAIL ${failure}`)
  const ok = failures.length === 0
  if (ok) console.log(`cinematic laws: ${files.length} marketing files clean`)
  results.push({ name: 'M1 cinematic laws hold', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/** A phase is not done because its tests pass -- it is done when its screens exist. */
function deliverablesExist(): boolean {
  console.log('\n=== W2 deliverables exist ===')
  const required = [
    // M1
    'src/features/marketing/marketing-home.tsx',
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
    if (!cinematicLawsHold()) failed = true
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
      'M1 cinematic laws hold',
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
  console.log('     the product does, and does the pricing answer the question it raises?')
  console.log('  2. Walk the wizard on a phone-width viewport -- the day pills, the')
  console.log('     stepper, and the tone sheet are the three places touch targets and')
  console.log('     overlay behaviour are hardest to get right.')
  console.log('  3. Marketing is light-only by design (decisions.md). Confirm it still')
  console.log('     reads correctly when the OS is set to dark.')
  console.log('  4. Scrub the M1 hero end to end by hand -- the frame cadence, the clock,')
  console.log('     and the 07:00 handoff are judged by feel, and the e2e only proves')
  console.log('     they move. Then repeat with reduced motion on: the page must read as')
  console.log('     designed, not as degraded.')

  process.exit(failed ? 1 : 0)
}

main()
