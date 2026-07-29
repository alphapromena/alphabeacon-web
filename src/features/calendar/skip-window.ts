/**
 * The undo window for a skipped slot.
 *
 * Skipping is easy to do by accident and expensive to notice later, so it is
 * reversible — but not forever: a slot that can always be un-skipped is a slot
 * whose state nobody can trust. Same calendar day is the compromise, and it is
 * a rule rather than a rendering detail, which is why it lives here and is
 * tested directly.
 */
import type { Slot } from '@/data/types'

export function canUndoSkip(slot: Slot, now: Date = new Date()): boolean {
  if (slot.status !== 'skipped' || !slot.skippedAt) return false
  return new Date(slot.skippedAt).toDateString() === now.toDateString()
}
