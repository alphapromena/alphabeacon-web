/**
 * The review actions a draft card offers, and the dialog state behind them.
 *
 * Extracted so the queue (D2) and on-demand generate (F1) drive ONE action row
 * rather than two that drift. screens4.md F1 is explicit that a finished run
 * "becomes a normal draft card (same component as D2's) with the full action
 * row, dropping the user straight into the same review flow" — sharing the
 * handlers is what makes that true rather than merely similar.
 *
 * Pair it with `<DraftDialogs actions={…} />`, which renders the four surfaces
 * these handlers open.
 */
import { useState } from 'react'
import { toastSuccess } from '@/components/ab/toast'
import { useDataDispatch } from '@/data/provider'
import type { Draft } from '@/data/types'

export interface DraftActionHandlers {
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onCreateMedia: () => void
  onSchedule: () => void
  onRetry: () => void
}

export interface DraftActions {
  handlersFor: (draft: Draft) => DraftActionHandlers
  mediaFor: Draft | null
  setMediaFor: (draft: Draft | null) => void
  scheduleFor: Draft | null
  setScheduleFor: (draft: Draft | null) => void
  rejectFor: Draft | null
  setRejectFor: (draft: Draft | null) => void
  editFor: Draft | null
  setEditFor: (draft: Draft | null) => void
}

export function useDraftActions(): DraftActions {
  const dispatch = useDataDispatch()
  const [mediaFor, setMediaFor] = useState<Draft | null>(null)
  const [scheduleFor, setScheduleFor] = useState<Draft | null>(null)
  const [rejectFor, setRejectFor] = useState<Draft | null>(null)
  const [editFor, setEditFor] = useState<Draft | null>(null)

  return {
    handlersFor: (draft) => ({
      onApprove: () => {
        dispatch({ type: 'draft/approve', draftId: draft.id })
        toastSuccess('Approved', { description: 'Create the art, or schedule it as it is.' })
      },
      onReject: () => setRejectFor(draft),
      onEdit: () => setEditFor(draft),
      onCreateMedia: () => setMediaFor(draft),
      onSchedule: () => setScheduleFor(draft),
      onRetry: () => dispatch({ type: 'draft/publish', draftId: draft.id }),
    }),
    mediaFor,
    setMediaFor,
    scheduleFor,
    setScheduleFor,
    rejectFor,
    setRejectFor,
    editFor,
    setEditFor,
  }
}
