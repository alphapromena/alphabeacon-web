/**
 * The draft state machine — UI law.
 *
 * Buttons render from `canTransition`, so illegal actions are unrenderable
 * rather than disabled. One of the three integration reconciliation points
 * (web-plan.md §13): when a backend arrives, its transitions reconcile here.
 */
export const DRAFT_STATUSES = [
  'pending_review',
  'approved',
  'media_pending',
  'media_ready',
  'scheduled',
  'published',
  'rejected',
  'expired',
  'publish_failed',
] as const

export type DraftStatus = (typeof DRAFT_STATUSES)[number]

/**
 * Every legal edge. `media_pending → approved` is the failure path: a failed
 * generation releases its credits and returns the draft to `approved`.
 */
const TRANSITIONS: Record<DraftStatus, readonly DraftStatus[]> = {
  pending_review: ['approved', 'rejected', 'expired'],
  approved: ['media_pending', 'scheduled', 'expired'],
  media_pending: ['media_ready', 'approved'],
  media_ready: ['scheduled', 'expired'],
  scheduled: ['published', 'publish_failed'],
  publish_failed: ['scheduled'],
  published: [],
  rejected: [],
  expired: [],
}

export function canTransition(from: DraftStatus, to: DraftStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function legalTargets(from: DraftStatus): readonly DraftStatus[] {
  return TRANSITIONS[from]
}

export function isTerminal(status: DraftStatus): boolean {
  return TRANSITIONS[status].length === 0
}
