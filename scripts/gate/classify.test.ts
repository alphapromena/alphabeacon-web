import { describe, expect, it } from 'vitest'
import type { E2eSummary } from '../verify-lib'
import { classifyResult, gateRoundGreen, isRerunnable, redact, skipLabel } from './classify'

const summary = (over: Partial<E2eSummary>): E2eSummary => ({
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  tests: [],
  ...over,
})

const failing = (error: string, title = 'a walk') =>
  summary({
    failed: 1,
    passed: 1,
    tests: [
      {
        title,
        file: 'live-knowledge.spec.ts',
        status: 'failed',
        tags: [],
        error,
        durationMs: 150_000,
      },
    ],
  })

describe('the classification rule (GATE-0910 §3.5)', () => {
  it('a green file is green', () => {
    expect(classifyResult(summary({ passed: 7 }), 0, '7 passed')).toBe('green')
  })

  it('a file whose every test skipped with a reason is skipped-all, not green and not red', () => {
    expect(classifyResult(summary({ skipped: 3 }), 0, '3 skipped')).toBe('skipped-all')
  })

  it('a lost socket in the failing test is network-lost — the file is re-run, never waived', () => {
    const s = summary({
      failed: 1,
      passed: 1,
      tests: [
        {
          title: 'uploads',
          file: 'live-media-capabilities.spec.ts',
          status: 'failed',
          tags: [],
          error: 'apiRequestContext.put: read ECONNRESET',
          durationMs: 4400,
        },
      ],
    })
    expect(classifyResult(s, 1, '')).toBe('network-lost')
  })

  it('the signature is read from the raw log too, for a run that left no report', () => {
    expect(classifyResult(null, 1, 'Error: API fleet never warmed: 12 bursts')).toBe('network-lost')
    expect(classifyResult(null, 1, 'net::ERR_CONNECTION_RESET at http://localhost:5199/')).toBe(
      'network-lost',
    )
  })

  it('an assertion failure is UNCLASSIFIED until a human names it', () => {
    const s = summary({
      failed: 1,
      tests: [
        {
          title: 'lands on the Dashboard',
          file: 'live-auth.spec.ts',
          status: 'failed',
          tags: [],
          error: 'expect(locator).toBeVisible() failed — waiting for heading Dashboard',
          durationMs: 40000,
        },
      ],
    })
    expect(classifyResult(s, 1, 'Error: expect(locator).toBeVisible() failed')).toBe('unclassified')
  })

  it('a non-zero exit with no failed test and no report is unclassified, not green', () => {
    expect(classifyResult(null, 1, 'ELIFECYCLE Command failed')).toBe('unclassified')
  })
})

describe("the app's own error page is the service's fault, not the product's (2026-09-13)", () => {
  const timeout = 'locator.fill: Test timeout of 150000ms exceeded. waiting for getByLabel(...)'

  it("a timeout behind 'We couldn't load this screen' is an error-page red", () => {
    const page = '- paragraph: Something went wrong\n- paragraph: We couldn’t load this screen.'
    expect(classifyResult(failing(timeout), 1, timeout, page)).toBe('error-page')
  })

  it('the straight apostrophe reads the same as the typographic one', () => {
    const page = "- paragraph: We couldn't load this screen. Try again in a moment."
    expect(classifyResult(failing(timeout), 1, timeout, page)).toBe('error-page')
  })

  it("the balance chip's own failure text counts too", () => {
    const page = '- link "Balance could not be read"'
    expect(classifyResult(failing(timeout), 1, timeout, page)).toBe('error-page')
  })

  it('the SAME timeout with an ordinary page stays UNCLASSIFIED', () => {
    const page = '- heading "Knowledge" [level=1]\n- button "Add a file"'
    expect(classifyResult(failing(timeout), 1, timeout, page)).toBe('unclassified')
  })

  it('a spec that ASSERTS the error copy fails on its own terms — the page decides, not the message', () => {
    const asserts =
      "expect(locator).toBeVisible() failed — waiting for getByText('Something went wrong')"
    expect(classifyResult(failing(asserts), 1, asserts)).toBe('unclassified')
  })

  it('a lost socket still wins over an error page — the nearer cause is named first', () => {
    const page = '- paragraph: Something went wrong'
    expect(classifyResult(failing('read ECONNRESET'), 1, '', page)).toBe('network-lost')
  })

  it('both of the runner’s own classes are re-run; nothing else is', () => {
    expect(isRerunnable('network-lost')).toBe(true)
    expect(isRerunnable('error-page')).toBe(true)
    expect(isRerunnable('unclassified')).toBe(false)
    expect(isRerunnable('green')).toBe(false)
    expect(isRerunnable('skipped-all')).toBe(false)
  })
})

describe('a skip and a not-run are different things (the founder, 2026-09-13)', () => {
  it('a deliberate skip keeps its own reason', () => {
    expect(skipLabel({ skipReason: 'set LIVE_MEDIA=1 to spend on one real render' }, false)).toBe(
      'set LIVE_MEDIA=1 to spend on one real render',
    )
    expect(skipLabel({ skipReason: 'the wallet is $0.00' }, true)).toBe('the wallet is $0.00')
  })

  it("a test with no reason in a file that FAILED did not run — Playwright's serial cascade", () => {
    expect(skipLabel({}, true)).toBe('not run, an earlier test in this file failed')
    expect(skipLabel({ skipReason: '   ' }, true)).toBe(
      'not run, an earlier test in this file failed',
    )
  })

  it('a test with no reason in a file that passed is an honest unknown, not a cascade', () => {
    expect(skipLabel({}, false)).toBe('skipped, no reason given')
  })
})

describe("the round's verdict counts both of the runner's own classes (TEST-0915 proof D)", () => {
  it('an error-page file re-run 3/3 green leaves the round GREEN, exactly like network-lost', () => {
    // Proof D2 on 2026-09-15: classified error-page, re-run 3/3 green — and the
    // README still said RED, because the verdict forgave network-lost only.
    expect(gateRoundGreen(['green', 'error-page'])).toBe(true)
    expect(gateRoundGreen(['green', 'network-lost'])).toBe(true)
    expect(gateRoundGreen(['skipped-all', 'green'])).toBe(true)
  })

  it('anything the runner could not name keeps the round RED, and an empty round is not green', () => {
    expect(gateRoundGreen(['green', 'unclassified'])).toBe(false)
    expect(gateRoundGreen([])).toBe(false)
  })
})

describe('the record carries no host and no presigned url', () => {
  it('redacts the API host, storage urls and any X-Amz-signed url', () => {
    const text =
      'GET https://api.example.test/health 200 · PUT https://bucket.s3.us-east-1.amazonaws.com/x?X-Amz-Signature=abc · https://cdn.example.test/a.png?X-Amz-Credential=k&X-Amz-Signature=z'
    const out = redact(text, 'api.example.test')
    expect(out).not.toContain('api.example.test')
    expect(out).not.toContain('amazonaws')
    expect(out).not.toContain('X-Amz-')
    expect(out).toContain('<api-host>')
    expect(out).toContain('<redacted url>')
  })

  it('leaves a run with no host to redact alone', () => {
    expect(redact('7 passed (48.3s)', undefined)).toBe('7 passed (48.3s)')
  })
})
