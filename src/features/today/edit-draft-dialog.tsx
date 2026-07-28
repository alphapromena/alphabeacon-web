/**
 * Editing a draft's copy before approving it (D2).
 *
 * Editing is deliberately available only while a draft is still under review:
 * once it is approved the copy is what the art and the schedule were agreed
 * against, so changing it silently would make both stale.
 */
import { useEffect, useState } from 'react'
import { MonoNumber } from '@/components/ab/mono-number'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useDataDispatch } from '@/data/provider'
import type { Draft } from '@/data/types'

export function EditDraftDialog({
  draft,
  open,
  onOpenChange,
}: {
  draft: Draft | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dispatch = useDataDispatch()
  const [copy, setCopy] = useState('')

  useEffect(() => {
    if (draft) setCopy(draft.copy)
  }, [draft])

  if (!draft) return null

  const dirty = copy.trim() !== draft.copy.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit this draft</DialogTitle>
          <DialogDescription>Your wording wins — the pipeline learns from it.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Textarea
            aria-label="Draft copy"
            rows={6}
            value={copy}
            onChange={(event) => setCopy(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            <MonoNumber value={copy.length} /> characters
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!dirty || copy.trim().length === 0}
            onClick={() => {
              dispatch({ type: 'draft/edit', draftId: draft.id, copy: copy.trim() })
              toastSuccess('Draft updated')
              onOpenChange(false)
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
