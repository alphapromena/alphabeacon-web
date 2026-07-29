// W5 verify orchestrator -- Creative Studio and Billing.
// Usage: pnpm verify:w05 [--skip-e2e]
//
// W5 Verify coverage, and where each item is proven:
//   "the params form renders correctly from >=3 different capability schemas"
//        -> src/lib/params-schema.test.ts, run against the REAL catalog
//   "insufficient-credits and plan-gate flows end in designed states with
//    prompts preserved" -> the composer's e2e tests on the low-credits world
//   "the past_due dataset gates product-wide (banner + disabled actions)"
//        -> the structural check below + its e2e
//   "ledger entries sum to the displayed balance (computed, never a stored
//    literal)" -> the structural check below + src/data/studio-billing.test.ts
//   "axe" -> the Playwright @axe specs

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

type Outcome = 'PASS' | 'FAIL' | 'SKIP'
const results: { name: string; outcome: Outcome }[] = []
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

const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')

/**
 * "D4 and E2 are visually and functionally the same composer" is a promise a
 * screenshot cannot keep. This checks it structurally: both entry points must
 * render the SHARED `ComposerBody`, and neither may grow its own model picker
 * or params form. The day someone copies the body into one of them to tweak it,
 * this fails -- which is the moment the drift starts, not months later.
 */
function composerIsShared(): boolean {
  console.log('\n=== D4 and E2 are the same composer ===')
  const d4 = read('src', 'features', 'today', 'media-panel.tsx')
  const e2 = read('src', 'features', 'studio', 'studio-screens.tsx')

  const bothUseBody = /ComposerBody/.test(d4) && /ComposerBody/.test(e2)
  // A second params form or model list in either file means it forked.
  const noForkedForm = !/ParamsForm/.test(d4) && !/fieldsFromSchema/.test(d4)
  const noForkedPicker = !/name={`?\$\{?idPrefix/.test(d4)

  const ok = bothUseBody && noForkedForm && noForkedPicker
  console.log(
    ok
      ? 'composer: D4 and E2 both render the shared ComposerBody; neither has forked the form'
      : `composer check failed -- shared:${bothUseBody} noForkedForm:${noForkedForm} noForkedPicker:${noForkedPicker}`,
  )
  results.push({ name: 'D4 and E2 share one composer', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/**
 * The params form must be generated, never hardcoded. A per-model `if` or a
 * switch on a model id inside the form is the failure mode; it works for
 * today's four models and silently omits the fifth.
 */
function paramsFormIsGenerated(): boolean {
  console.log('\n=== the params form is generated from the schema ===')
  const form = read('src', 'features', 'studio', 'params-form.tsx')

  const usesGenerator = /fieldsFromSchema/.test(form)
  const noModelIds = !/sm_(spark|prism|motion|cinema)/.test(form)
  // Nor may it branch on a parameter's NAME, which is the same mistake wearing
  // a different hat.
  const noParamNames = !/aspect_ratio|duration_seconds|camera_motion/.test(form)

  const ok = usesGenerator && noModelIds && noParamNames
  console.log(
    ok
      ? 'params: every control comes from fieldsFromSchema; no model or parameter is named in the UI'
      : `params check failed -- generator:${usesGenerator} noModelIds:${noModelIds} noParamNames:${noParamNames}`,
  )
  results.push({ name: 'params form is schema-generated', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/**
 * The balance is the ledger. A stored `balance` field is how money UIs drift,
 * so the provider must compute it and no entity may carry one.
 */
function balanceIsComputed(): boolean {
  console.log('\n=== the balance is computed from the ledger ===')
  const provider = read('src', 'data', 'provider.tsx')
  const types = read('src', 'data', 'types.ts')

  const computed = /useCreditBalance[\s\S]{0,240}reduce\(/.test(provider)
  const noStoredField = !/\bbalance\??:\s*number/.test(types)

  const ok = computed && noStoredField
  console.log(
    ok
      ? 'credits: useCreditBalance sums the ledger, and no entity stores a balance'
      : `balance check failed -- computed:${computed} noStoredField:${noStoredField}`,
  )
  results.push({ name: 'balance computed, never stored', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/** past_due must gate the product: a global banner AND refused actions. */
function pastDueGatesProductWide(): boolean {
  console.log('\n=== past due gates the product, not a screen ===')
  const shell = read('src', 'components', 'ab', 'app-shell.tsx')
  const composer = read('src', 'features', 'studio', 'use-composer.ts')
  const schedule = read('src', 'features', 'today', 'schedule-dialog.tsx')

  // The banner lives in the shell, so every authenticated screen carries it.
  const globalBanner = /past_due/.test(shell)
  // And the two actions that cost money or go public are actually refused.
  const generationGated = /pastDue/.test(composer) && /pastDue \|\|/.test(composer)
  const publishGated = /pastDue/.test(schedule)

  const ok = globalBanner && generationGated && publishGated
  console.log(
    ok
      ? 'past_due: banner in the shell, generation and publishing both refused'
      : `past_due check failed -- banner:${globalBanner} generation:${generationGated} publish:${publishGated}`,
  )
  results.push({ name: 'past_due gates product-wide', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function e2eNavigationRuleHolds(): boolean {
  console.log('\n=== e2e specs navigate in-app after switching datasets ===')
  const specs = [
    'onboarding.spec.ts',
    'today-queue.spec.ts',
    'calendar-connections.spec.ts',
    'studio-billing.spec.ts',
  ]
  let ok = true
  for (const name of specs) {
    const source = read('e2e', name)
    const gotos = [...source.matchAll(/page\.goto\('([^']+)'\)/g)].map((m) => m[1])
    const offenders = gotos.filter((path) => path !== '/dev/datasets')
    const usesSharedHelper = /from '\.\/datasets'/.test(source)
    if (offenders.length > 0 || !usesSharedHelper) {
      ok = false
      console.log(
        `  ${name}: helper:${usesSharedHelper} stray gotos: ${offenders.join(', ') || 'none'}`,
      )
    } else {
      console.log(`  ${name}: switches via the shared helper, then walks in-app`)
    }
  }
  results.push({ name: 'e2e navigation rule holds', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function deliverablesExist(): boolean {
  console.log('\n=== W5 deliverables exist ===')
  const required = [
    'src/features/studio/studio-screens.tsx', // E1, E2, E3, E4
    'src/features/studio/composer.tsx',
    'src/features/studio/use-composer.ts',
    'src/features/studio/params-form.tsx',
    'src/lib/params-schema.ts',
    'src/lib/params-schema.test.ts',
    'src/features/billing/billing-screens.tsx', // H1-H4
    'src/data/datasets/past-due.ts',
    'src/data/studio-billing.test.ts',
    'e2e/studio-billing.spec.ts',
  ]
  const missing = required.filter((path) => !existsSync(join(root, path)))
  if (missing.length) {
    console.log('missing:')
    for (const path of missing) console.log(`  - ${path}`)
  } else {
    console.log(`all ${required.length} W5 deliverables present`)
  }
  const ok = missing.length === 0
  results.push({ name: 'W5 deliverables exist', outcome: ok ? 'PASS' : 'FAIL' })
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
    if (!composerIsShared()) failed = true
    if (!paramsFormIsGenerated()) failed = true
    if (!balanceIsComputed()) failed = true
    if (!pastDueGatesProductWide()) failed = true
    if (!e2eNavigationRuleHolds()) failed = true
    if (!deliverablesExist()) failed = true

    if (skipE2e) {
      results.push({ name: 'e2e (studio, billing, axe)', outcome: 'SKIP' })
      console.log('\ne2e skipped (--skip-e2e)')
    } else {
      run('pnpm exec playwright install chromium')
      if (!step('e2e (studio, billing, axe)', 'pnpm e2e')) failed = true
    }
  } else {
    for (const name of [
      'D4 and E2 share one composer',
      'params form is schema-generated',
      'balance computed, never stored',
      'past_due gates product-wide',
      'e2e navigation rule holds',
      'W5 deliverables exist',
      'e2e (studio, billing, axe)',
    ]) {
      results.push({ name, outcome: 'SKIP' })
    }
  }

  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW5 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')

  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W5 Verify):')
  console.log('  1. Open D4 from a draft and E2 from the gallery back to back.')
  console.log('     They pass the structural check -- but do they FEEL like one')
  console.log('     tool? That is the judgement the checklist actually asks for.')
  console.log('  2. Read the credits ledger as someone querying a charge: do the')
  console.log('     held rows explain why the balance is lower than the spend?')
  console.log('\n  Carried forward, still open (see .agent/open-items.md):')
  console.log('   - W1 screen-reader walk of the app shell (NVDA / VoiceOver)')
  console.log('   - W2 marketing copy read, wizard at phone width, marketing in a dark OS')
  console.log('   - W3 queue as one continuous tool, queue on a phone')
  console.log('   - W4 month grid at phone width, timezone as the audience sees it')

  process.exit(failed ? 1 : 0)
}

main()
