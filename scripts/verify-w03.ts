// W3 verify orchestrator -- the review queue checklist from web-plan.md.
// Usage: pnpm verify:w03 [--skip-e2e]
//
// W3 Verify coverage, and where each item is proven:
//   "the state-machine walk renders every legal transition and NO illegal one"
//        -> src/data/review-queue.test.ts walks the full DRAFT_STATUSES matrix
//   "low-credits and not-approved datasets produce the designed states"
//        -> the low-credits dataset + its e2e refusal test
//   "media entry points are ABSENT pre-approval, never disabled-teasing"
//        -> the source canary below, plus the e2e gate tests on D2 and D3
//   "dashboard stats equal Today/Calendar counts from the same dataset"
//        -> the consistency test, plus the e2e that approves and re-reads D1
//   "approving in D2 moves the card and updates D1 within the session" -> @golden
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
 * The approval gate is the phase's headline rule, and the way it breaks is not
 * a failing test -- it is someone rendering the media button with `disabled`
 * instead of omitting it. A test cannot see the difference between "absent
 * because the machine says so" and "absent because I wrote status === approved",
 * so this reads the source: the queue's action rows must ask `canTransition`,
 * and must never disable a media control.
 */
function approvalGateIsStructural(): boolean {
  console.log('\n=== the approval gate is enforced by the state machine ===')
  const card = readFileSync(join(root, 'src', 'features', 'today', 'draft-card.tsx'), 'utf8')

  const asksTheMachine = /canTransition\(draft\.status, 'media_pending'\)/.test(card)
  const noHandRolledStatusCheck = !/draft\.status === 'approved'/.test(card)
  // A disabled media control would be exactly the "teasing" the plan forbids.
  const mediaBlock = card.slice(card.indexOf('canCreateMedia &&'), card.indexOf('canSchedule &&'))
  const noDisabledMedia = !/disabled/.test(mediaBlock)

  const ok = asksTheMachine && noHandRolledStatusCheck && noDisabledMedia
  console.log(
    ok
      ? 'gate: media entry is rendered from canTransition, and is never disabled-and-teasing'
      : `gate check failed -- canTransition:${asksTheMachine} noAdHoc:${noHandRolledStatusCheck} noDisabled:${noDisabledMedia}`,
  )
  results.push({ name: 'approval gate is structural', outcome: ok ? 'PASS' : 'FAIL' })
  return ok
}

/**
 * The e2e navigation rule carried in from W2: `page.goto` reloads the SPA and
 * rebuilds the DEFAULT dataset, so a deep link after a dataset switch silently
 * tests the wrong tenant. Specs must switch, then walk through in-app links.
 * This catches the regression at the point it is cheapest -- before a spec
 * starts passing for the wrong reason.
 */
function e2eNavigationRuleHolds(): boolean {
  console.log('\n=== e2e specs navigate in-app after switching datasets ===')
  const specs = ['entry-flow.spec.ts', 'today-queue.spec.ts']
  let ok = true

  for (const name of specs) {
    const source = readFileSync(join(root, 'e2e', name), 'utf8')
    // The only goto a world-switching spec should perform is the switcher
    // itself, which the shared helper owns.
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
  console.log('\n=== W3 deliverables exist ===')
  const required = [
    'src/features/dashboard/dashboard-screen.tsx', // D1
    'src/features/today/today-screen.tsx', // D2
    'src/features/today/draft-card.tsx',
    'src/features/today/draft-detail-screen.tsx', // D3
    'src/features/today/media-panel.tsx', // D4
    'src/features/today/schedule-dialog.tsx', // D5
    'src/features/today/reject-dialog.tsx',
    'src/features/today/edit-draft-dialog.tsx',
    'src/data/datasets/low-credits.ts',
    'src/data/review-queue.test.ts',
    'e2e/today-queue.spec.ts',
  ]
  const missing = required.filter((path) => !existsSync(join(root, path)))
  if (missing.length) {
    console.log('missing:')
    for (const path of missing) console.log(`  - ${path}`)
  } else {
    console.log(`all ${required.length} W3 deliverables present`)
  }
  const ok = missing.length === 0
  results.push({ name: 'W3 deliverables exist', outcome: ok ? 'PASS' : 'FAIL' })
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
    if (!approvalGateIsStructural()) failed = true
    if (!e2eNavigationRuleHolds()) failed = true
    if (!deliverablesExist()) failed = true

    if (skipE2e) {
      results.push({ name: 'e2e (@golden approve walk, queue axe)', outcome: 'SKIP' })
      console.log('\ne2e skipped (--skip-e2e)')
    } else {
      run('pnpm exec playwright install chromium')
      if (!step('e2e (@golden approve walk, queue axe)', 'pnpm e2e')) failed = true
    }
  } else {
    for (const name of [
      'approval gate is structural',
      'e2e navigation rule holds',
      'W3 deliverables exist',
      'e2e (@golden approve walk, queue axe)',
    ]) {
      results.push({ name, outcome: 'SKIP' })
    }
  }

  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW3 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')

  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W3 Verify):')
  console.log('  1. Approve, generate media, and schedule a post end to end and')
  console.log('     judge whether it FEELS like one continuous tool -- the plan asks')
  console.log('     for D4 to read as "Studio, in context", not a second product.')
  console.log('  2. Read the queue on a phone: three slot groups deep, is it still')
  console.log('     obvious which draft belongs to which time?')
  console.log('\n  Carried forward, still open (see .agent/open-items.md):')
  console.log('   - W1 screen-reader walk of the app shell (NVDA / VoiceOver)')
  console.log('   - W2 marketing copy read, wizard at phone width, marketing in a dark OS')

  process.exit(failed ? 1 : 0)
}

main()
