// W4 verify orchestrator -- calendar, scheduling, event sources, connections.
// Usage: pnpm verify:w04 [--skip-e2e]
//
// W4 Verify coverage, and where each item is proven:
//   "DST data (Amman <-> New-York) renders slots at correct local times"
//        -> src/lib/timezone.test.ts, including both 2026 boundary days
//   "every connection status + return state reachable from the datasets"
//        -> the reachability sweep in src/data/calendar-connections.test.ts
//           (it lives in the unit suite so it runs on every commit, and so it
//           can use the @/ alias that scripts/ deliberately does not have)
//           plus e2e over B1 and the B3 return states
//   "skip -> undo window behavior" -> skip-window.ts and its tests + e2e
//   "'Syncing...' never shows a stale zero" -> the source + data check below
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

/**
 * The "Syncing..." rule is an honesty rule, and the way it breaks is a `?? 0`
 * quietly turning "we do not know" into "nobody saw it". A behavioural test can
 * only check the case it happens to render, so this checks the SHAPE: metrics
 * must be optional in the type, and the screens that read them must branch on
 * presence rather than defaulting the whole object to zero.
 */
function syncingIsStructural(): boolean {
  console.log('\n=== an unreported metric is absent, never zero ===')
  const types = readFileSync(join(root, 'src', 'data', 'types.ts'), 'utf8')
  const calendar = readFileSync(
    join(root, 'src', 'features', 'calendar', 'calendar-screen.tsx'),
    'utf8',
  )
  const sheet = readFileSync(join(root, 'src', 'features', 'calendar', 'slot-sheet.tsx'), 'utf8')

  // The type must allow "not reported yet" at all.
  const optionalMetrics = /metrics\?:\s*\{/.test(types)
  // Both surfaces must decide on presence before showing any number.
  const calendarBranches = /reported\.length === 0/.test(calendar)
  const sheetBranches = /reported\.length === 0/.test(sheet)
  // And neither may substitute a whole zeroed metrics object.
  const noZeroObject = !/metrics\s*\?\?\s*\{/.test(calendar) && !/metrics\s*\?\?\s*\{/.test(sheet)

  const ok = optionalMetrics && calendarBranches && sheetBranches && noZeroObject
  console.log(
    ok
      ? 'syncing: metrics are optional, and both surfaces branch on presence before rendering a figure'
      : `syncing check failed -- optional:${optionalMetrics} calendar:${calendarBranches} sheet:${sheetBranches} noZeroObject:${noZeroObject}`,
  )
  results.push({ name: 'Syncing never renders a zero', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

function deliverablesExist(): boolean {
  console.log('\n=== W4 deliverables exist ===')
  const required = [
    'src/features/calendar/calendar-screen.tsx', // C3
    'src/features/calendar/schedule-config-screen.tsx', // C1
    'src/features/calendar/event-sources-screen.tsx', // C2
    'src/features/calendar/slot-sheet.tsx', // C4
    'src/features/calendar/skip-window.ts',
    'src/features/connections/connections-screen.tsx', // B1
    'src/features/connections/connection-sheet.tsx', // B2
    'src/features/connections/connect-return.tsx', // B3
    'src/data/datasets/needs-reauth.ts',
    'src/lib/timezone.ts',
    'src/lib/timezone.test.ts',
    'src/data/calendar-connections.test.ts',
    'e2e/calendar-connections.spec.ts',
  ]
  const missing = required.filter((path) => !existsSync(join(root, path)))
  if (missing.length) {
    console.log('missing:')
    for (const path of missing) console.log(`  - ${path}`)
  } else {
    console.log(`all ${required.length} W4 deliverables present`)
  }
  const ok = missing.length === 0
  results.push({ name: 'W4 deliverables exist', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/** The e2e navigation rule, carried since W2 and now covering three specs. */
function e2eNavigationRuleHolds(): boolean {
  console.log('\n=== e2e specs navigate in-app after switching datasets ===')
  const specs = ['onboarding.spec.ts', 'today-queue.spec.ts', 'calendar-connections.spec.ts']
  let ok = true
  for (const name of specs) {
    const source = readFileSync(join(root, 'e2e', name), 'utf8')
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
    if (!syncingIsStructural()) failed = true
    if (!e2eNavigationRuleHolds()) failed = true
    if (!deliverablesExist()) failed = true

    if (skipE2e) {
      results.push({ name: 'e2e (calendar, connections, axe)', outcome: 'SKIP' })
      console.log('\ne2e skipped (--skip-e2e)')
    } else {
      run('pnpm exec playwright install chromium')
      if (!step('e2e (calendar, connections, axe)', 'pnpm e2e')) failed = true
    }
  } else {
    for (const name of [
      'Syncing never renders a zero',
      'e2e navigation rule holds',
      'W4 deliverables exist',
      'e2e (calendar, connections, axe)',
    ]) {
      results.push({ name, outcome: 'SKIP' })
    }
  }

  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW4 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')

  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W4 Verify):')
  console.log('  1. Read the month grid at 360px: three slot chips in one day cell')
  console.log('     is the density this design is betting on -- does it hold?')
  console.log('  2. Switch the timezone in Schedule settings and confirm the slot')
  console.log('     times you see match what your audience in that zone would see.')
  console.log('\n  Carried forward, still open (see .agent/open-items.md):')
  console.log('   - W1 screen-reader walk of the app shell (NVDA / VoiceOver)')
  console.log('   - W2 marketing copy read, wizard at phone width, marketing in a dark OS')
  console.log('   - W3 queue as one continuous tool, queue on a phone')

  process.exit(failed ? 1 : 0)
}

main()
