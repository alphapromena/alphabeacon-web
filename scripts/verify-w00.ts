// W0 verify orchestrator -- runs the locally-verifiable W0 checklist from web-plan.md.
// Usage: pnpm verify:w00 [--skip-e2e]
// --skip-e2e skips the Playwright step for fast local runs; it is ignored in CI.

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

// Step 1 -- shadcn config: `shadcn info` exits 0, and the committed config + skill exist.
function checkShadcnConfig(): boolean {
  const info = runQuiet('pnpm exec shadcn info')
  if (info.status !== 0) {
    console.log('pnpm exec shadcn info exited non-zero:')
    if (info.stdout.trim() !== '') console.log(info.stdout.trim())
    if (info.stderr.trim() !== '') console.log(info.stderr.trim())
    return false
  }
  const hasComponentsJson = existsSync(join(root, 'components.json'))
  const hasSkill = existsSync(join(root, '.agents', 'skills', 'shadcn'))
  if (!hasComponentsJson) console.log('missing components.json (shadcn config must be committed)')
  if (!hasSkill) console.log('missing .agents/skills/shadcn (the committed shadcn skill)')
  if (hasComponentsJson && hasSkill) {
    console.log('shadcn info ok; components.json and .agents/skills/shadcn present')
  }
  return hasComponentsJson && hasSkill
}

// Step 6 -- canary: a planted fetch() under src/ must make guard-static fail.
function canaryGuardStatic(): boolean {
  const canary = join(root, 'src', '__canary-fetch__.ts')
  writeFileSync(canary, "export const leak = fetch('https://example.com')\n")
  try {
    const res = runQuiet('pnpm guard:static')
    const blocked = res.status !== 0
    console.log(
      blocked
        ? 'canary guard-static: planted fetch() was rejected as expected'
        : 'canary guard-static: planted fetch() was NOT caught -- guard-static is broken',
    )
    return blocked
  } finally {
    rmSync(canary, { force: true })
  }
}

// Step 7 -- canary: a raw Tailwind palette color + raw hex in a feature file must fail lint.
function canaryRawColor(): boolean {
  const dir = join(root, 'src', 'features')
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
    const res = runQuiet('pnpm exec eslint src/features/__canary-color__.tsx')
    const blocked = res.status !== 0
    console.log(
      blocked
        ? 'canary raw color: bg-blue-500 / #ff0000 were rejected as expected'
        : 'canary raw color: raw colors were NOT caught -- the no-raw-color lint rule is broken',
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

function printSummary(failed: boolean): void {
  const width = Math.max(...results.map((r) => r.name.length))
  console.log('\nW0 verify summary')
  console.log('-'.repeat(width + 6))
  for (const r of results) {
    console.log(`${r.name.padEnd(width)}  ${r.outcome}`)
  }
  console.log('-'.repeat(width + 6))
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS (automated steps)')
  console.log('\nMANUAL -- needs external setup; verify by hand (web-plan.md W0 Verify):')
  console.log('  1. "a canary PR is blocked by every check" -- needs the GitHub repo: open a')
  console.log('     canary PR and confirm every merge-blocking check rejects it.')
  console.log('  2. "staging URL serves the shell" -- needs AWS + the domain/cert: deploy')
  console.log('     staging and confirm the URL serves the app shell.')
}

function main(): void {
  const inCi = process.env.CI !== undefined && process.env.CI !== ''
  const skipE2e = process.argv.includes('--skip-e2e') && !inCi
  if (process.argv.includes('--skip-e2e') && inCi) {
    console.log('--skip-e2e ignored: CI never skips e2e')
  }

  const steps: { name: string; exec: () => boolean; skip?: boolean }[] = [
    { name: 'shadcn config (info + committed skill)', exec: checkShadcnConfig },
    { name: 'lint', exec: () => run('pnpm lint') === 0 },
    { name: 'typecheck', exec: () => run('pnpm typecheck') === 0 },
    { name: 'unit tests', exec: () => run('pnpm test') === 0 },
    { name: 'guard-static', exec: () => run('pnpm guard:static') === 0 },
    { name: 'canary: planted fetch fails guard-static', exec: canaryGuardStatic },
    { name: 'canary: raw color fails lint', exec: canaryRawColor },
    { name: 'build', exec: () => run('pnpm build') === 0 },
    {
      name: 'e2e (Playwright smoke, zero-network assert)',
      exec: () => run('pnpm exec playwright install chromium') === 0 && run('pnpm e2e') === 0,
      skip: skipE2e,
    },
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
