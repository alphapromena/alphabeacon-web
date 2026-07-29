import { describe, expect, it } from 'vitest'
import { canTransition, DRAFT_STATUSES, isTerminal, legalTargets } from './draft-status'

describe('draft state machine', () => {
  it('allows the review path: pending_review → approved → media_pending → media_ready → scheduled → published', () => {
    expect(canTransition('pending_review', 'approved')).toBe(true)
    expect(canTransition('approved', 'media_pending')).toBe(true)
    expect(canTransition('media_pending', 'media_ready')).toBe(true)
    expect(canTransition('media_ready', 'scheduled')).toBe(true)
    expect(canTransition('scheduled', 'published')).toBe(true)
  })

  it('allows attaching an existing asset without a pending generation', () => {
    // E4's attach picker: the asset already exists and was already paid for,
    // so there is nothing to wait for between approved and media_ready.
    expect(canTransition('approved', 'media_ready')).toBe(true)
    // But it is still gated on approval, like every other route to media.
    expect(canTransition('pending_review', 'media_ready')).toBe(false)
  })

  it('allows scheduling without media, rejection, expiry, and the publish-retry loop', () => {
    expect(canTransition('approved', 'scheduled')).toBe(true)
    expect(canTransition('pending_review', 'rejected')).toBe(true)
    expect(canTransition('pending_review', 'expired')).toBe(true)
    expect(canTransition('scheduled', 'publish_failed')).toBe(true)
    expect(canTransition('publish_failed', 'scheduled')).toBe(true)
  })

  it('returns a failed generation to approved (credits released), never to media_ready', () => {
    expect(canTransition('media_pending', 'approved')).toBe(true)
    expect(canTransition('media_pending', 'scheduled')).toBe(false)
  })

  it('forbids the approval-gate violations the UI must never render', () => {
    // Media entry points must not exist before approval.
    expect(canTransition('pending_review', 'media_pending')).toBe(false)
    expect(canTransition('pending_review', 'scheduled')).toBe(false)
    expect(canTransition('pending_review', 'published')).toBe(false)
    expect(canTransition('rejected', 'approved')).toBe(false)
  })

  it('treats published, rejected, and expired as terminal', () => {
    for (const status of ['published', 'rejected', 'expired'] as const) {
      expect(isTerminal(status)).toBe(true)
      expect(legalTargets(status)).toHaveLength(0)
    }
  })

  it('never allows a self-transition', () => {
    for (const status of DRAFT_STATUSES) {
      expect(canTransition(status, status)).toBe(false)
    }
  })
})
