import { describe, expect, it } from 'vitest'
import type { E2eSummary } from '../verify-lib'
import { classifyResult, redact } from './classify'

const summary = (over: Partial<E2eSummary>): E2eSummary => ({
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  tests: [],
  ...over,
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
