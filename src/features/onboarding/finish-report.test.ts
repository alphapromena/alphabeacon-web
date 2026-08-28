import { describe, expect, it } from 'vitest'
import { describeIncomplete } from './finish-report'

describe('describeIncomplete', () => {
  it('says nothing when every step landed', () => {
    expect(describeIncomplete([])).toBeUndefined()
  })

  it('names one failed step and where to repair it', () => {
    expect(describeIncomplete([{ step: 'schedule' }])).toBe(
      'Your posting schedule did not save — set it in Settings.',
    )
  })

  it('lists several steps in the order Finish attempts them', () => {
    // Reported out of order; read back in the order they were tried.
    expect(describeIncomplete([{ step: 'country' }, { step: 'schedule' }])).toBe(
      'Your posting schedule and your country did not save — set them in Settings.',
    )
  })

  it('deduplicates a step that failed more than once', () => {
    const failures = Array.from({ length: 3 }, () => ({ step: 'country' as const }))

    expect(describeIncomplete(failures)).toBe('Your country did not save — set it in Settings.')
  })

  it("carries the server's request id when the envelope had one", () => {
    expect(describeIncomplete([{ step: 'schedule', code: 'bad_gateway', requestId: 'req_9f2' }])).toBe(
      'Your posting schedule did not save — set it in Settings. (req_9f2)',
    )
  })

  it('falls back to the contract code when no request id was exposed', () => {
    // open-items 3: CORS exposes no x-request-id, and a network failure has
    // no envelope at all — the code is what is left to quote.
    expect(describeIncomplete([{ step: 'country', code: 'bad_gateway' }])).toBe(
      'Your country did not save — set it in Settings. (bad_gateway)',
    )
  })
})
