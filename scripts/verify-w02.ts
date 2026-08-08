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

  // 1. The calm law (brand law: gentle fades and subtle hovers ONLY). No
  //    video, no canvas, no scroll hijack, no animation library, no rAF loop:
  //    the only legal motion primitives are the reveal attribute and CSS.
  const banned: [RegExp, string][] = [
    [/<video/, 'renders a <video> -- the calm law allows none'],
    [/<canvas|getContext\(/, 'draws to a canvas -- the calm law allows none'],
    [/from ['"]lenis['"]|new Lenis/, 'imports Lenis -- scroll must stay native'],
    [/from ['"](gsap|motion|framer-motion)/, 'imports an animation library'],
    [/requestAnimationFrame/, 'runs a rAF loop -- reveal is CSS-only'],
    [/addEventListener\(['"]scroll['"]/, 'listens to scroll -- use IntersectionObserver'],
  ]
  for (const [file, source] of sources) {
    for (const [pattern, why] of banned) {
      if (pattern.test(source)) failures.push(`${file}: ${why}`)
    }
  }

  // 2. The reveal's animated state exists only under no-preference, so
  //    reduced motion renders every section finished (removed, not slowed).
  const globals = readFileSync(join(root, 'src', 'styles', 'globals.css'), 'utf8')
  const noPref = globals.indexOf('prefers-reduced-motion: no-preference')
  const reveal = globals.indexOf('[data-mk-reveal]')
  if (noPref === -1 || reveal === -1 || reveal < noPref) {
    failures.push('globals.css: [data-mk-reveal] styles are not inside the no-preference query')
  }

  // 3. The wordmark law (design.md Part 3): the Arabic artwork enters only as
  //    an <img> of one of the three supplied files -- never redrawn as SVG or
  //    text -- and no other asset directory is referenced.
  const home = named('marketing-home.tsx')
  if (!/\/brand\/malaky-logo-(charcoal|gold|white)\.png/.test(home)) {
    failures.push('marketing-home.tsx: the supplied wordmark files are not used')
  }
  for (const [file, source] of sources) {
    if (source.includes("'/marketing/")) {
      failures.push(`${file}: references /marketing/ -- that asset directory was retired`)
    }
  }

  // 4. Pricing stays on the one plan source: the hook, and no local records.
  if (!/usePlans\(\)/.test(home)) failures.push('marketing-home.tsx: pricing lost usePlans()')
  if (/priceMonthly\s*:/.test(home)) {
    failures.push('marketing-home.tsx: declares plan data locally instead of reading the provider')
  }

  // 5. Real product content (kit §5): tones and channels come from the
  //    provider, rendered the mandated way.
  if (!/useTones\(\)/.test(home) || !/<ToneBadge/.test(home)) {
    failures.push('marketing-home.tsx: Memory must read useTones() and render ToneBadge')
  }
  if (!/useConnections\(\)/.test(home)) {
    failures.push('marketing-home.tsx: the channels section must read useConnections()')
  }

  for (const failure of failures) console.log(`  FAIL ${failure}`)
  const ok = failures.length === 0
  if (ok) console.log(`marketing laws: ${files.length} marketing files clean`)
  results.push({ name: 'M1 marketing laws hold', outcome: ok ? 'PASS' : 'FAIL' })
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
  console.log('     the product does, and does the pricing answer the question it raises?')
  console.log('  2. Walk the wizard on a phone-width viewport -- the day pills, the')
  console.log('     stepper, and the tone sheet are the three places touch targets and')
  console.log('     overlay behaviour are hardest to get right.')
  console.log('  3. Check M1 in both themes: light is the brand default; dark must show')
  console.log('     the white wordmark on charcoal (design.md Part 3).')
  console.log('  4. Scroll M1 end to end by hand -- every reveal should be a gentle fade,')
  console.log('     nothing more. Then repeat with reduced motion on: the page must read')
  console.log('     as designed, not as degraded.')

  process.exit(failed ? 1 : 0)
}

main()
