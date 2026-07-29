/**
 * D4 — Media generation, opened from an approved draft.
 *
 * This is not a second feature. It is `ComposerBody` from Creative Studio in
 * draft-scoped mode, inside a dialog — same model picker, same schema-driven
 * params form, same credit arithmetic, same states. The file is this short
 * BECAUSE the composer is shared; anything that grew here rather than in
 * `studio/composer.tsx` would be the drift screens4.md forbids.
 */
import { ComposerBody, ComposerSubmit } from '@/features/studio/composer'
import { useComposer } from '@/features/studio/use-composer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Draft, PlanTier } from '@/data/types'

export function MediaPanel({
  draft,
  planTier,
  open,
  onOpenChange,
}: {
  draft: Draft | null
  planTier: PlanTier
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const composer = useComposer({
    planTier,
    draftId: draft?.id,
    // Succeeding returns the user to the draft, which is the whole point of
    // the draft-scoped mode: the art was for this post.
    onSucceeded: () => onOpenChange(false),
  })

  if (!draft) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) composer.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create image or video</DialogTitle>
          <DialogDescription>Creative Studio, attached to this draft.</DialogDescription>
        </DialogHeader>

        <ComposerBody composer={composer} idPrefix="d4" contextSnippet={draft.copy} />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <ComposerSubmit composer={composer} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
