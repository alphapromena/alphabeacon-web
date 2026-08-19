/**
 * The two things INT-12 rests on, both of which fail SILENTLY if they drift:
 * the deterministic published id (a random one turns a retry into a 409), and
 * the run cache (a cached non-terminal run would freeze a queue mid-flight).
 *
 * The join itself is proved end to end by `e2e/live-proposals.spec.ts`, against
 * the real ledger — a mocked join would only re-assert this file's own
 * assumptions, and the assumption that mattered (keyset paging is complete)
 * was exactly the one the live wire disproved.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { clearRunCache, publishedIdFor } from './proposals'

describe('publishedIdFor', () => {
  it('is deterministic, which is what makes a retry safe', () => {
    // The contract: re-approving with the SAME publishedId is a safe retry; a
    // different one is a 409 that changes nothing. A random id would turn a
    // double click, a flaky connection or a reload into that 409.
    expect(publishedIdFor('prop_abc')).toBe('mlk_prop_abc')
    expect(publishedIdFor('prop_abc')).toBe(publishedIdFor('prop_abc'))
  })

  it('is distinct per proposal, so two drafts never collide on one record', () => {
    // A collision would be a 409 on the SECOND approve, with the first draft
    // holding the record — a silent "why can't I approve this?".
    expect(publishedIdFor('prop_a')).not.toBe(publishedIdFor('prop_b'))
  })

  it('carries the proposal id, so a record can be traced back by eye', () => {
    expect(publishedIdFor('prop_32fb5264')).toContain('prop_32fb5264')
  })
})

describe('clearRunCache', () => {
  beforeEach(() => window.sessionStorage.clear())

  it('empties the session cache it owns and leaves everything else alone', () => {
    window.sessionStorage.setItem('ab-run-run_1', '{"runId":"run_1","status":"completed"}')
    window.sessionStorage.setItem('ab-live-session', 'keep me')
    clearRunCache()
    expect(window.sessionStorage.getItem('ab-run-run_1')).toBeNull()
    // Clearing run reads must never sign the user out.
    expect(window.sessionStorage.getItem('ab-live-session')).toBe('keep me')
  })
})
