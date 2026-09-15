/**
 * `pnpm verify:all` — the suites ONCE, as reports (ORDER GATE-0910 §3.1).
 *
 * Runs lint, typecheck, guard-static, the unit suite, the build and the
 * STATIC e2e suite one time each, captures every output, and writes
 * `.gate/reports/verify.json` carrying the hash of the tree it ran on plus
 * the unit and Playwright summaries (`unit.json`, `e2e.json`). The seven
 * `verify:wNN` scripts assert over that report; none re-runs a suite.
 *
 * The static suite is pinned static here no matter what the shell exported:
 * `VITE_API_BASE_URL` is passed EMPTY to Playwright, which its webServer
 * treats as "override the file" (playwright.config.ts) — the zero-network
 * test bed cannot be flipped live by a runner that also drives live rounds.
 *
 * Usage: pnpm verify:all [--skip-e2e] [--workers <n>]
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  REPORTS_DIR,
  VERIFY_REPORT,
  root,
  summarizePlaywright,
  summarizeVitest,
  treeHash,
  type SuiteStep,
  type SuiteStepName,
  type VerifyReport,
} from './verify-lib'

const skipE2e = process.argv.includes('--skip-e2e')

/**
 * The static suite's worker count (ORDER-FIX-0915, item 74). Outside CI it is
 * ONE unless the caller says otherwise: a testing session runs every Playwright
 * command line at `--workers=1` (item 70), and the motion specs sample clocks
 * a parallel run perturbs. In CI nothing is passed and Playwright's own default
 * stands, exactly as before. `pnpm gate` hands its own `--workers` down here.
 */
function workersArg(argv: string[]): string | undefined {
  const index = argv.indexOf('--workers')
  if (index >= 0) return argv[index + 1]
  return argv.find((a) => a.startsWith('--workers='))?.slice('--workers='.length)
}
const workers = workersArg(process.argv) ?? (process.env.CI ? undefined : '1')
if (workers !== undefined && !/^[1-9]\d*$/.test(workers)) {
  throw new Error(`--workers must be a positive integer, got "${workers}"`)
}

function runStep(
  name: SuiteStepName,
  cmd: string,
  env: NodeJS.ProcessEnv = process.env,
): SuiteStep {
  mkdirSync(REPORTS_DIR, { recursive: true })
  const logPath = join(REPORTS_DIR, `${name}.log`)
  console.log(`\n=== ${name} === ${cmd}`)
  const started = Date.now()
  const child = spawnSync(cmd, {
    shell: true,
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  const output = `${child.stdout ?? ''}${child.stderr ?? ''}`
  writeFileSync(logPath, output)
  const seconds = (Date.now() - started) / 1000
  const ok = child.status === 0
  const tail = output.trim().split('\n').slice(-12).join('\n')
  console.log(tail)
  console.log(
    `--- ${name}: ${ok ? 'ok' : `FAILED (exit ${child.status})`} in ${seconds.toFixed(1)} s`,
  )
  return { name, ok, seconds, log: relative(root, logPath).replace(/\\/g, '/') }
}

function main(): void {
  const startedAt = new Date().toISOString()
  const hash = treeHash()
  console.log(`verify:all on tree ${hash.slice(0, 12)} (${startedAt})`)

  const steps: SuiteStep[] = []
  const report: VerifyReport = {
    version: 1,
    treeHash: hash,
    startedAt,
    finishedAt: startedAt,
    ok: false,
    steps,
  }

  const staticEnv: NodeJS.ProcessEnv = { ...process.env, VITE_API_BASE_URL: '' }
  const unitJson = join(REPORTS_DIR, 'unit.json')
  const e2eJson = join(REPORTS_DIR, 'e2e.json')

  const plan: { name: SuiteStepName; cmd: string; env?: NodeJS.ProcessEnv; after?: () => void }[] =
    [
      { name: 'lint', cmd: 'pnpm lint' },
      { name: 'typecheck', cmd: 'pnpm typecheck' },
      { name: 'guard-static', cmd: 'pnpm guard:static' },
      {
        name: 'unit',
        cmd: `pnpm exec vitest run --reporter=default --reporter=json --outputFile="${unitJson}"`,
        after: () => {
          if (existsSync(unitJson))
            report.unit = summarizeVitest(JSON.parse(readFileSync(unitJson, 'utf8')))
        },
      },
      { name: 'build', cmd: 'pnpm build' },
      {
        name: 'e2e',
        cmd: `pnpm exec playwright install chromium && pnpm exec playwright test --reporter=list,json${workers ? ` --workers=${workers}` : ''}`,
        env: { ...staticEnv, PLAYWRIGHT_JSON_OUTPUT_NAME: e2eJson },
        after: () => {
          if (existsSync(e2eJson))
            report.e2e = summarizePlaywright(JSON.parse(readFileSync(e2eJson, 'utf8')))
        },
      },
    ]

  let failed = false
  for (const item of plan) {
    if (item.name === 'e2e' && skipE2e) {
      steps.push({ name: 'e2e', ok: false, skipped: true, seconds: 0, log: '' })
      console.log('\n=== e2e === skipped (--skip-e2e): the report carries no e2e run')
      continue
    }
    if (failed) {
      steps.push({ name: item.name, ok: false, skipped: true, seconds: 0, log: '' })
      continue
    }
    const step = runStep(item.name, item.cmd, item.env)
    steps.push(step)
    item.after?.()
    if (!step.ok) failed = true
  }

  report.finishedAt = new Date().toISOString()
  report.ok = !failed
  // The tree must not have moved while the suites ran; a report for a tree
  // that no longer exists would only ever be stale.
  const after = treeHash()
  if (after !== hash) {
    console.log(
      `\nthe tree changed during verify:all (${hash.slice(0, 12)} → ${after.slice(0, 12)}); the report is written for the tree the suites ran on and will read as stale`,
    )
  }
  mkdirSync(REPORTS_DIR, { recursive: true })
  writeFileSync(VERIFY_REPORT, JSON.stringify(report, null, 2))

  const width = 14
  console.log('\nverify:all summary')
  for (const s of steps) {
    console.log(
      `${s.name.padEnd(width)} ${s.skipped ? 'SKIP' : s.ok ? 'PASS' : 'FAIL'}  ${s.seconds ? `${s.seconds.toFixed(0)} s` : ''}`,
    )
  }
  if (report.unit)
    console.log(
      `unit: ${report.unit.passed} passed / ${report.unit.failed} failed / ${report.unit.files} files`,
    )
  if (report.e2e)
    console.log(
      `e2e: ${report.e2e.passed} passed / ${report.e2e.skipped} skipped / ${report.e2e.failed} failed`,
    )
  console.log(`report: ${relative(root, VERIFY_REPORT)} for tree ${hash.slice(0, 12)}`)
  console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS')
  process.exit(failed ? 1 : 0)
}

main()
