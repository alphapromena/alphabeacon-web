/**
 * Rejecting a draft (D2). A reason is required because rejection is the only
 * signal the pipeline gets that it drafted the wrong thing — "no" without a
 * why teaches nothing, and this is the screen where that feedback is cheapest
 * to give.
 */
import { useState } from 'react'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useDataDispatch } from '@/data/provider'
import type { Draft } from '@/data/types'

const REASONS = [
  'Off brand',
  'Wrong facts',
  'Bad timing',
  'Already posted this',
  'Tone is off',
] as const

export function RejectDialog({
  draft,
  open,
  onOpenChange,
}: {
  draft: Draft | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dispatch = useDataDispatch()
  const [reason, setReason] = useState<string>('')
  const [notes, setNotes] = useState('')

  if (!draft) return null

  const full = [reason, notes.trim()].filter(Boolean).join(' — ')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Reject this draft</DialogTitle>
          <DialogDescription>
            It leaves the queue and will not be published. Tell us why so the next one is better.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            value={reason}
            onValueChange={(next) => next && setReason(next)}
            className="flex-wrap justify-start"
          >
            {REASONS.map((option) => (
              <ToggleGroupItem key={option} value={option} className="text-xs">
                {option}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex flex-col gap-2">
            <label htmlFor="reject-notes" className="text-sm font-medium">
              Anything else? (optional)
            </label>
            <Textarea
              id="reject-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason}
            onClick={() => {
              dispatch({ type: 'draft/reject', draftId: draft.id, reason: full })
              onOpenChange(false)
            }}
          >
            Reject draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
