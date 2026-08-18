/**
 * The two studio rules that fail silently if they drift (INT-11).
 */
import { describe, expect, it } from 'vitest'
import { isJobTerminal, COMPOSABLE_CAPABILITIES, GALLERY_CAPABILITIES } from './studio'

describe('isJobTerminal', () => {
  it('uses the MEDIA JOB vocabulary, not a run one', () => {
    // Observed on the wire: queued -> submitted -> succeeded. A run reaches
    // `completed`; sharing a predicate would poll one of the two forever.
    expect(isJobTerminal({ jobId: 'j', status: 'succeeded' })).toBe(true)
    expect(isJobTerminal({ jobId: 'j', status: 'failed' })).toBe(true)
    expect(isJobTerminal({ jobId: 'j', status: 'queued' })).toBe(false)
    expect(isJobTerminal({ jobId: 'j', status: 'submitted' })).toBe(false)
    // A run's terminal word must NOT settle a job.
    expect(isJobTerminal({ jobId: 'j', status: 'completed' })).toBe(false)
  })

  it('is null-safe, so a failed read does not read as finished', () => {
    expect(isJobTerminal(null)).toBe(false)
    expect(isJobTerminal(undefined)).toBe(false)
  })
})

describe('the gallery/composer split (amendment 6)', () => {
  it('offers a composer only for capabilities whose body shape is known', () => {
    // Everything else is listed honestly rather than given a guessed form.
    expect([...COMPOSABLE_CAPABILITIES]).toEqual([
      'media.generate',
      'social-posts.media',
      'images.edit',
    ])
  })

  it('still PROBES every capability, because granted-ness is discovered', () => {
    for (const capability of COMPOSABLE_CAPABILITIES) {
      expect(GALLERY_CAPABILITIES).toContain(capability)
    }
    expect(GALLERY_CAPABILITIES.length).toBeGreaterThan(COMPOSABLE_CAPABILITIES.length)
  })
})
