/**
 * The four surfaces a draft card can open, mounted once per screen.
 *
 * They live together because they share one rule: each is opened by holding a
 * draft, and each reads the LIVE record back out of the provider by id rather
 * than rendering the snapshot it was handed — a sheet that keeps its own copy
 * shows the user a version of the thing they just changed.
 */
import { useBilling, useDrafts } from '@/data/provider'
import { CreateVisualDialog } from '@/features/studio/create-visual-dialog'
import { EditDraftDialog } from './edit-draft-dialog'
import { MediaPanel } from './media-panel'
import { RejectDialog } from './reject-dialog'
import { ScheduleDialog } from './schedule-dialog'
import type { DraftActions } from './use-draft-actions'

export function DraftDialogs({ actions }: { actions: DraftActions }) {
  const billing = useBilling()
  const drafts = useDrafts()
  // The same rule as the rest: hold the id, read the live record back.
  const visualDraft = actions.visualFor
    ? drafts.find((draft) => draft.id === actions.visualFor?.id)
    : undefined
  return (
    <>
      <MediaPanel
        draft={actions.mediaFor}
        planTier={billing.planId}
        open={actions.mediaFor !== null}
        onOpenChange={(next) => !next && actions.setMediaFor(null)}
      />
      {/* HSN-02: the capability popup. It resolves through the Studio
          simulation here and attaches nothing — D4 above stays the one
          attach path this world has. */}
      <CreateVisualDialog
        subject={
          visualDraft
            ? { ref: visualDraft.id, content: visualDraft.copy, toneId: visualDraft.toneId }
            : null
        }
        open={actions.visualFor !== null}
        onOpenChange={(next) => !next && actions.setVisualFor(null)}
      />
      <ScheduleDialog
        draft={actions.scheduleFor}
        open={actions.scheduleFor !== null}
        onOpenChange={(next) => !next && actions.setScheduleFor(null)}
      />
      <RejectDialog
        draft={actions.rejectFor}
        open={actions.rejectFor !== null}
        onOpenChange={(next) => !next && actions.setRejectFor(null)}
      />
      <EditDraftDialog
        draft={actions.editFor}
        open={actions.editFor !== null}
        onOpenChange={(next) => !next && actions.setEditFor(null)}
      />
    </>
  )
}
