/**
 * Verify-once (ORDER GATE-0910 §3.1).
 *
 * `pnpm verify:all` runs the suites ONCE and writes machine-readable reports
 * under `.gate/reports/` with the hash of the tree they were produced from.
 * Every `verify:wNN` then asserts over those reports instead of re-running
 * lint, typecheck, unit, guard-static, build and the static e2e — the six
 * steps all seven scripts used to repeat (19 min for seven on one unchanged
 * tree, measured 2026-09-10). The rule on record: a verify never re-runs a
 * suite that already ran on the same tree hash.
 *
 * The scripts keep their own assertions over the tree and their manual
 * checklists untouched; only the re-running goes. `--rerun` keeps the old
 * six-step chain reachable until the founder retires it.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const REPORTS_DIR = join(root, '.gate', 'reports')
export const VERIFY_REPORT = join(REPORTS_DIR, 'verify.json')

export type SuiteStepName = 'lint' | 'typecheck' | 'guard-static' | 'unit' | 'build' | 'e2e'

export interface SuiteStep {
  name: SuiteStepName
  ok: boolean
  /** True when the step was deliberately not run (`--skip-e2e`). */
  skipped?: boolean
  seconds: number
  /** The captured output, relative to the repo root. */
  log: string
}

export interface UnitSummary {
  files: number
  tests: number
  passed: number
  failed: number
  skipped: number
}

export interface E2eTest {
  title: string
  file: string
  status: 'passed' | 'failed' | 'skipped' | 'flaky'
  tags: string[]
  /**
   * Present ONLY when the test carried a skip annotation — a deliberate skip,
   * with its own reason. ABSENT means Playwright skipped it without one, which
   * in a `serial` file is every test after a failure: not a skip at all, and
   * the record must not read it as one (GATE-0910, 2026-09-13).
   */
  skipReason?: string
  error?: string
  durationMs: number
}

export interface E2eSummary {
  passed: number
  failed: number
  skipped: number
  flaky: number
  tests: E2eTest[]
}

export interface VerifyReport {
  version: 1
  treeHash: string
  startedAt: string
  finishedAt: string
  ok: boolean
  steps: SuiteStep[]
  unit?: UnitSummary
  e2e?: E2eSummary
}

/**
 * The tree as it is on disk: HEAD, every change against it (staged or not),
 * and every untracked file that is not ignored. Two trees with the same hash
 * would produce the same suite results, which is exactly what lets a report
 * stand in for a re-run. `.gate/` itself is ignored, so writing a report
 * never changes the hash it carries.
 */
export function treeHash(cwd = root): string {
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
  const head = git(['rev-parse', 'HEAD']).trim()
  const diff = git(['diff', 'HEAD', '--binary', '--no-color', '--no-ext-diff'])
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
    .sort()
  const hash = createHash('sha256')
  hash.update(head).update('\0').update(diff).update('\0')
  for (const file of untracked) {
    hash.update(file).update('\0')
    try {
      hash.update(readFileSync(join(cwd, file)))
    } catch {
      // vanished between the listing and the read — not part of the tree
    }
    hash.update('\0')
  }
  return hash.digest('hex')
}

export function loadVerifyReport(path = VERIFY_REPORT): VerifyReport | null {
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as VerifyReport
    return parsed.version === 1 ? parsed : null
  } catch {
    return null
  }
}

export interface SuiteRow {
  name: string
  outcome: 'PASS' | 'FAIL' | 'SKIP'
  detail?: string
}

export interface SuiteFacts {
  /** The label the script gives its e2e step (what it wants from the suite). */
  e2eLabel: string
  /** False under `--skip-e2e`: the e2e row is SKIP and never a failure. */
  needE2e: boolean
  /**
   * Titles the suite must have run green for this script's claim to hold —
   * the @golden walk, the axe specs. Each pattern must match at least one
   * PASSED test title (file path included).
   */
  e2eMustPass?: RegExp[]
}

/**
 * The six suite rows a verify script used to earn by re-running, read from
 * the report instead. A missing or stale report is a FAIL with the one
 * instruction that fixes it; it is never a reason to re-run here.
 */
export function suiteRowsFromReport(
  facts: SuiteFacts,
  report: VerifyReport | null = loadVerifyReport(),
  currentHash: () => string = treeHash,
): { rows: SuiteRow[]; ok: boolean; reason?: string } {
  const names: { step: SuiteStepName; label: string }[] = [
    { step: 'lint', label: 'lint' },
    { step: 'typecheck', label: 'typecheck' },
    { step: 'unit', label: 'unit tests' },
    { step: 'guard-static', label: 'guard-static' },
    { step: 'build', label: 'build' },
  ]

  if (!report) {
    const reason = 'no suite report — run `pnpm verify:all` first (GATE-0910 §3.1)'
    return {
      ok: false,
      reason,
      rows: [
        ...names.map((n) => ({ name: n.label, outcome: 'FAIL' as const, detail: reason })),
        { name: facts.e2eLabel, outcome: 'FAIL', detail: reason },
      ],
    }
  }

  const hash = currentHash()
  if (report.treeHash !== hash) {
    const reason = `stale suite report (made for tree ${report.treeHash.slice(0, 12)}, this tree is ${hash.slice(0, 12)}) — run \`pnpm verify:all\` again`
    return {
      ok: false,
      reason,
      rows: [
        ...names.map((n) => ({ name: n.label, outcome: 'FAIL' as const, detail: reason })),
        { name: facts.e2eLabel, outcome: 'FAIL', detail: reason },
      ],
    }
  }

  const rows: SuiteRow[] = []
  let ok = true
  for (const { step, label } of names) {
    const found = report.steps.find((s) => s.name === step)
    const pass = Boolean(found && found.ok && !found.skipped)
    let detail: string | undefined
    if (step === 'unit' && report.unit) {
      detail = `${report.unit.passed} passed / ${report.unit.failed} failed / ${report.unit.files} files (from the report)`
    } else if (found) {
      detail = `${found.seconds.toFixed(0)} s in the report`
    } else {
      detail = 'not in the report'
    }
    rows.push({ name: label, outcome: pass ? 'PASS' : 'FAIL', detail })
    if (!pass) ok = false
  }

  if (!facts.needE2e) {
    rows.push({ name: facts.e2eLabel, outcome: 'SKIP', detail: '--skip-e2e' })
    return { rows, ok }
  }

  const e2eStep = report.steps.find((s) => s.name === 'e2e')
  if (!e2eStep || e2eStep.skipped || !report.e2e) {
    rows.push({
      name: facts.e2eLabel,
      outcome: 'FAIL',
      detail: 'the report has no e2e run — run `pnpm verify:all` without --skip-e2e',
    })
    return { rows, ok: false }
  }
  const missing = (facts.e2eMustPass ?? []).filter(
    (pattern) =>
      !report.e2e!.tests.some(
        (t) =>
          t.status === 'passed' &&
          (pattern.test(t.title) || pattern.test(`${t.file} › ${t.title}`)),
      ),
  )
  const pass = e2eStep.ok && report.e2e.failed === 0 && missing.length === 0
  const detail =
    `${report.e2e.passed} passed / ${report.e2e.skipped} skipped / ${report.e2e.failed} failed (from the report)` +
    (missing.length ? `; not proven green: ${missing.map(String).join(', ')}` : '')
  rows.push({ name: facts.e2eLabel, outcome: pass ? 'PASS' : 'FAIL', detail })
  return { rows, ok: ok && pass }
}

/** `--rerun` on a verify script: the legacy six-step chain, kept until retired. */
export function wantsRerun(argv = process.argv): boolean {
  return argv.includes('--rerun') || process.env.VERIFY_LEGACY === '1'
}

/** Vitest's JSON reporter (Jest-shaped) → the summary the report keeps. */
export function summarizeVitest(json: unknown): UnitSummary {
  const j = json as {
    numTotalTests?: number
    numPassedTests?: number
    numFailedTests?: number
    numPendingTests?: number
    testResults?: unknown[]
  }
  return {
    files: j.testResults?.length ?? 0,
    tests: j.numTotalTests ?? 0,
    passed: j.numPassedTests ?? 0,
    failed: j.numFailedTests ?? 0,
    skipped: j.numPendingTests ?? 0,
  }
}

interface PwSuite {
  title?: string
  file?: string
  suites?: PwSuite[]
  specs?: PwSpec[]
}
interface PwSpec {
  title: string
  tags?: string[]
  file?: string
  tests?: {
    status?: string
    annotations?: { type: string; description?: string }[]
    results?: { status?: string; duration?: number; error?: { message?: string } }[]
  }[]
}

/** Playwright's JSON reporter → one row per test, skip reasons and errors kept. */
export function summarizePlaywright(json: unknown): E2eSummary {
  const tests: E2eTest[] = []
  const walk = (suite: PwSuite, file: string) => {
    const here = suite.file ?? file
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? []
        const last = results[results.length - 1]
        const outcome = test.status ?? last?.status ?? 'skipped'
        const status: E2eTest['status'] =
          outcome === 'expected' || outcome === 'passed'
            ? 'passed'
            : outcome === 'flaky'
              ? 'flaky'
              : outcome === 'skipped'
                ? 'skipped'
                : 'failed'
        const skip = test.annotations?.find((a) => a.type === 'skip')
        tests.push({
          title: spec.title,
          file: spec.file ?? here,
          status,
          tags: spec.tags ?? [],
          skipReason: status === 'skipped' ? skip?.description : undefined,
          error:
            status === 'failed'
              ? (last?.error?.message ?? results.find((r) => r.error)?.error?.message)?.slice(
                  0,
                  600,
                )
              : undefined,
          durationMs: results.reduce((sum, r) => sum + (r.duration ?? 0), 0),
        })
      }
    }
    for (const child of suite.suites ?? []) walk(child, here)
  }
  const top = json as { suites?: PwSuite[] }
  for (const suite of top.suites ?? []) walk(suite, suite.file ?? suite.title ?? '')
  return {
    passed: tests.filter((t) => t.status === 'passed').length,
    failed: tests.filter((t) => t.status === 'failed').length,
    skipped: tests.filter((t) => t.status === 'skipped').length,
    flaky: tests.filter((t) => t.status === 'flaky').length,
    tests,
  }
}
