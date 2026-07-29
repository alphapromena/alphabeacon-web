/**
 * The commit bar for screens that hold edits locally until saved, and the
 * refusal that goes with it.
 *
 * Both halves live here because they are one promise: nothing changes under the
 * user while they are still deciding, and leaving with unsaved work has to be
 * said out loud rather than silently discarded. A screen that shipped the bar
 * without the guard would keep the first half and quietly break the second.
 *
 * It is sticky and it appears ONLY when there is something to save — a bar that
 * is always there stops meaning anything.
 */
import { useBlocker } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function SaveBar({
  dirty,
  onSave,
  onCancel,
  /** What is lost by leaving — named, never "your changes". */
  consequence,
  saveLabel = 'Save changes',
}: {
  dirty: boolean
  onSave: () => void
  onCancel: () => void
  consequence: string
  saveLabel?: string
}) {
  // The guard is the router's, not a window.confirm: leaving is a navigation,
  // so the refusal belongs where navigation happens.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  return (
    <>
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-6">
            <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSave}>{saveLabel}</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>{consequence}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
