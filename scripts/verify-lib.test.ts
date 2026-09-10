import { describe, expect, it } from 'vitest'
import {
  suiteRowsFromReport,
  summarizePlaywright,
  summarizeVitest,
  type VerifyReport,
} from './verify-lib'

function report(overrides: Partial<VerifyReport> = {}): VerifyReport {
  return {
    version: 1,
    treeHash: 'abc123',
    startedAt: '2026-09-10T12:00:00.000Z',
    finishedAt: '2026-09-10T12:04:00.000Z',
    ok: true,
    steps: [
      { name: 'lint', ok: true, seconds: 20, log: '.gate/reports/lint.log' },
      { name: 'typecheck', ok: true, seconds: 15, log: '.gate/reports/typecheck.log' },
      { name: 'guard-static', ok: true, seconds: 2, log: '.gate/reports/guard-static.log' },
      { name: 'unit', ok: true, seconds: 21, log: '.gate/reports/unit.log' },
      { name: 'build', ok: true, seconds: 60, log: '.gate/reports/build.log' },
      { name: 'e2e', ok: true, seconds: 99, log: '.gate/reports/e2e.log' },
    ],
    unit: { files: 55, tests: 633, passed: 633, failed: 0, skipped: 0 },
    e2e: {
      passed: 2,
      failed: 0,
      skipped: 1,
      flaky: 0,
      tests: [
        {
          title: 'signup -> verify -> the app @golden',
          file: 'entry-flow.spec.ts',
          status: 'passed',
          tags: ['@golden'],
          durationMs: 1000,
        },
        {
          title: 'kitchen sink has no axe violations',
          file: 'kitchen-sink.spec.ts',
          status: 'passed',
          tags: ['@axe'],
          durationMs: 500,
        },
        {
          title: 'a live-only walk',
          file: 'live-auth.spec.ts',
          status: 'skipped',
          tags: [],
          skipReason: 'live-mode run only',
          durationMs: 0,
        },
      ],
    },
    ...overrides,
  }
}

const same = () => 'abc123'

describe('a verify reads the suite report instead of re-running (GATE-0910 §3.1)', () => {
  it('has no report → every suite row FAILS with the one instruction, nothing is re-run', () => {
    const out = suiteRowsFromReport({ e2eLabel: 'e2e', needE2e: true }, null, same)
    expect(out.ok).toBe(false)
    expect(out.rows.map((r) => r.outcome)).toEqual(['FAIL', 'FAIL', 'FAIL', 'FAIL', 'FAIL', 'FAIL'])
    expect(out.reason).toMatch(/pnpm verify:all/)
  })

  it('a report for another tree is stale → FAIL, never a silent pass', () => {
    const out = suiteRowsFromReport({ e2eLabel: 'e2e', needE2e: true }, report(), () => 'other')
    expect(out.ok).toBe(false)
    expect(out.reason).toMatch(/stale/)
  })

  it('a fresh green report → the six rows PASS with the counts from the report', () => {
    const out = suiteRowsFromReport(
      { e2eLabel: 'e2e (@golden walk)', needE2e: true, e2eMustPass: [/@golden/] },
      report(),
      same,
    )
    expect(out.ok).toBe(true)
    expect(out.rows.map((r) => r.outcome)).toEqual(['PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS'])
    expect(out.rows.find((r) => r.name === 'unit tests')?.detail).toMatch(/633 passed/)
    expect(out.rows.find((r) => r.name === 'e2e (@golden walk)')?.detail).toMatch(/2 passed/)
  })

  it('a named fact the suite did not prove green fails the e2e row', () => {
    const out = suiteRowsFromReport(
      { e2eLabel: 'e2e', needE2e: true, e2eMustPass: [/@golden/, /never ran/] },
      report(),
      same,
    )
    expect(out.ok).toBe(false)
    expect(out.rows.find((r) => r.name === 'e2e')?.detail).toMatch(/not proven green/)
  })

  it('a failed unit step in the report fails its row', () => {
    const r = report()
    r.steps = r.steps.map((s) => (s.name === 'unit' ? { ...s, ok: false } : s))
    const out = suiteRowsFromReport({ e2eLabel: 'e2e', needE2e: true }, r, same)
    expect(out.ok).toBe(false)
    expect(out.rows.find((r) => r.name === 'unit tests')?.outcome).toBe('FAIL')
  })

  it('--skip-e2e makes the e2e row SKIP and never a failure', () => {
    const r = report({ e2e: undefined })
    r.steps = r.steps.map((s) => (s.name === 'e2e' ? { ...s, ok: false, skipped: true } : s))
    const out = suiteRowsFromReport({ e2eLabel: 'e2e', needE2e: false }, r, same)
    expect(out.ok).toBe(true)
    expect(out.rows.find((r) => r.name === 'e2e')?.outcome).toBe('SKIP')
  })

  it('a report without an e2e run cannot satisfy a verify that needs one', () => {
    const r = report({ e2e: undefined })
    r.steps = r.steps.map((s) => (s.name === 'e2e' ? { ...s, ok: false, skipped: true } : s))
    const out = suiteRowsFromReport({ e2eLabel: 'e2e', needE2e: true }, r, same)
    expect(out.ok).toBe(false)
    expect(out.rows.find((r) => r.name === 'e2e')?.detail).toMatch(/no e2e run/)
  })
})

describe('the reporters are read as they are written', () => {
  it('vitest JSON (Jest-shaped) → files, tests, passed, failed', () => {
    expect(
      summarizeVitest({
        numTotalTests: 633,
        numPassedTests: 633,
        numFailedTests: 0,
        numPendingTests: 0,
        testResults: new Array(55).fill({}),
      }),
    ).toEqual({ files: 55, tests: 633, passed: 633, failed: 0, skipped: 0 })
  })

  it('Playwright JSON → one row per test with the skip reason and the error kept', () => {
    const out = summarizePlaywright({
      suites: [
        {
          title: 'live-auth.spec.ts',
          file: 'live-auth.spec.ts',
          specs: [
            {
              title: 'signup works',
              tags: ['@golden'],
              tests: [{ status: 'expected', results: [{ status: 'passed', duration: 1200 }] }],
            },
            {
              title: 'needs money',
              tests: [
                {
                  status: 'skipped',
                  annotations: [{ type: 'skip', description: 'the wallet is $0.00' }],
                  results: [{ status: 'skipped', duration: 0 }],
                },
              ],
            },
          ],
          suites: [
            {
              title: 'nested',
              specs: [
                {
                  title: 'breaks',
                  tests: [
                    {
                      status: 'unexpected',
                      results: [
                        {
                          status: 'failed',
                          duration: 40000,
                          error: { message: 'read ECONNRESET' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    expect(out.passed).toBe(1)
    expect(out.skipped).toBe(1)
    expect(out.failed).toBe(1)
    expect(out.tests.find((t) => t.title === 'needs money')?.skipReason).toBe('the wallet is $0.00')
    expect(out.tests.find((t) => t.title === 'breaks')?.error).toMatch(/ECONNRESET/)
    expect(out.tests.find((t) => t.title === 'breaks')?.file).toBe('live-auth.spec.ts')
    expect(out.tests.find((t) => t.title === 'signup works')?.tags).toEqual(['@golden'])
  })
})
