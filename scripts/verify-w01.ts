// W1 verify orchestrator -- runs the locally-verifiable W1 checklist from web-plan.md.
// Usage: pnpm verify:w01 [--skip-e2e]
// --skip-e2e skips the Playwright step for fast local runs; it is ignored in CI.
//
// W1 Verify coverage: the kitchen-sink axe run (light + dark) and the reduced-motion
// assertion live in the Playwright specs, so `pnpm e2e` is what signs those off; the
// form wrapper's named validation message is a unit test. The canary below proves the
// design law is enforced by lint rather than merely documented, and the deliverables
// check makes a missing ab/ composition fail the phase instead of passing silently.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, rmdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

type Outcome = 'PASS' | 'FAIL' | 'SKIP'

interface Result {
  name: string
  outcome: Outcome
}

const results: Result[] = []

function run(cmd: string): number {
  console.log(`\n> ${cmd}`)
  const child = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: root })
  return child.status ?? 1
}

function runQuiet(cmd: string): { status: number; stdout: string; stderr: string } {
  const child = spawnSync(cmd, { shell: true, stdio: 'pipe', encoding: 'utf8', cwd: root })
  return { status: child.status ?? 1, stdout: child.stdout ?? '', stderr: child.stderr ?? '' }
}

// Step 6 -- canary: a raw Tailwind palette color + raw hex inside an ab/ composition must
// fail lint. W0 planted this in features/; W1 plants it in the design layer itself, because
// that is where the tokens-only law is easiest to break and most expensive to lose.
function canaryRawColorInAb(): boolean {
  const dir = join(root, 'src', 'components', 'ab')
  const createdDir = !existsSync(dir)
  if (createdDir) mkdirSync(dir, { recursive: true })
  const canary = join(dir, '__canary-color__.tsx')
  const content = [
    "const hex = '#ff0000'",
    '',
    'export function CanaryColor() {',
    '  return <div className="bg-blue-500">{hex}</div>',
    '}',
    '',
  ].join('\n')
  writeFileSync(canary, content)
  try {
    const res = runQuiet('pnpm exec eslint src/components/ab/__canary-color__.tsx')
    const blocked = res.status !== 0
    console.log(
      blocked
        ? 'canary raw color: bg-blue-500 / #ff0000 in ab/ were rejected as expected'
        : 'canary raw color: raw colors in ab/ were NOT caught -- the no-raw-color rule is broken',
    )
    return blocked
  } finally {
    rmSync(canary, { force: true })
    if (createdDir) {
      try {
        rmdirSync(dir)
      } catch {
        // directory gained other content meanwhile -- leave it in place
      }
    }
  }
}

// Step 8 -- the W1 deliverables from web-plan.md must be on disk. Without this, a phase
// missing a whole composition still runs green: lint and tests only see what exists.
const AB_DELIVERABLES = [
  'app-shell',
  'page-header',
  'mono-number',
  'status-badge',
  'slot-chip',
  'claim-chip',
  'empty-state',
  'error-state',
  'skeletons',
  'confirm-dialog',
  'form',
  'motion',
  'stat-card',
  'tone-badge',
  'toast',
]

function checkDeliverables(): boolean {
  const missing: string[] = []
  for (const name of AB_DELIVERABLES) {
    // Either extension is legal: toast is a plain module, the rest render JSX.
    const found = ['tsx', 'ts'].some((ext) =>
      existsSync(join(root, 'src', 'components', 'ab', `${name}.${ext}`)),
    )
    if (!found) missing.push(`src/components/ab/${name}.{tsx,ts}`)
  }
  const kitchenSink = join(root, 'src', 'features', 'dev', 'dev-kitchen-sink.tsx')
  if (!existsSync(kitchenSink)) missing.push('src/features/dev/dev-kitchen-sink.tsx')

  if (missing.length > 0) {
    console.log('missing W1 deliverables:')
    for (const path of missing) console.log(`  ${path}`)
    return false
  }
  console.log(`all ${AB_DELIVERABLES.length + 1} W1 deliverables present`)
  return true
}

function printSummary(failed: boolean): void {
  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW1 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) {
    console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  }
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')
  console.log('\nMANUAL -- human judgement; verify by hand (web-plan.md W1 Verify):')
  console.log('  1. "visual pass of /dev/kitchen-sink in light + dark against design.md" --')
  console.log('     design.md is not in this repo yet, so the palette is the provisional')
  console.log('     OKLCH system recorded in .agent/decisions.md (2026-07-27). Review type,')
  console.log('     spacing, radius, and status treatments now; re-review when design.md lands.')
  console.log('  2. "keyboard-only walk of the shell" -- drive the rail, org switcher, bell,')
  console.log('     theme toggle, and account menu with the keyboard alone on a real screen')
  console.log('     reader (NVDA or VoiceOver) and confirm every stop announces a name and')
  console.log('     keeps a visible focus ring. axe cannot hear what the screen reader says.')
}

function main(): void {
  const inCi = process.env.CI !== undefined && process.env.CI !== ''
  const skipE2e = process.argv.includes('--skip-e2e') && !inCi
  if (process.argv.includes('--skip-e2e') && inCi) {
    console.log('--skip-e2e ignored: CI never skips e2e')
  }

  const steps: { name: string; exec: () => boolean; skip?: boolean }[] = [
    { name: 'lint', exec: () => run('pnpm lint') === 0 },
    { name: 'typecheck', exec: () => run('pnpm typecheck') === 0 },
    { name: 'unit tests', exec: () => run('pnpm test') === 0 },
    { name: 'guard-static', exec: () => run('pnpm guard:static') === 0 },
    { name: 'build', exec: () => run('pnpm build') === 0 },
    { name: 'canary: raw color in ab/ fails lint', exec: canaryRawColorInAb },
    {
      name: 'e2e (kitchen-sink axe both themes, reduced-motion)',
      exec: () => run('pnpm exec playwright install chromium') === 0 && run('pnpm e2e') === 0,
      skip: skipE2e,
    },
    { name: 'W1 deliverables exist', exec: checkDeliverables },
  ]

  let failed = false
  for (const step of steps) {
    if (failed) {
      results.push({ name: step.name, outcome: 'SKIP' })
      continue
    }
    if (step.skip === true) {
      console.log(`\n=== ${step.name} === skipped (--skip-e2e)`)
      results.push({ name: step.name, outcome: 'SKIP' })
      continue
    }
    console.log(`\n=== ${step.name} ===`)
    const ok = step.exec()
    results.push({ name: step.name, outcome: ok ? 'PASS' : 'FAIL' })
    if (!ok) {
      failed = true
      console.log(`step failed: ${step.name} -- remaining steps skipped`)
    }
  }

  printSummary(failed)
  process.exit(failed ? 1 : 0)
}

main()
