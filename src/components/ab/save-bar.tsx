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
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
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
  /*
   * "Saved", shown at the bar rather than only in a corner toast (§5.3).
   *
   * `onSave` is a plain callback with no completion signal, so the success is
   * read from the only fact this component can see: `dirty` going true → false
   * is the screen telling us the commit landed. A failed save leaves the form
   * dirty and its own screen owns the error, so this never claims a success
   * that did not happen. It holds for 1.6s — long enough to read, short enough
   * that the bar does not linger over the work it was covering.
   *
   * Two guards, both from TEST-0915 (`live-scheduling` on the built app):
   * - the clean edge counts only after THIS bar's Save was pressed. A live
   *   sync landing on a pristine form after a reload is dirty for one render
   *   while the draft adopts the wire, and Cancel after a failed save is a
   *   clean edge too — neither is a save, so neither may say "Saved";
   * - an edit inside the 1.6s is unsaved work again: the bar says so at once
   *   and brings its buttons back. The first version cleared the reset timer
   *   on that edit and left the bar stuck on "Saved" with nothing to press.
   */
  const [justSaved, setJustSaved] = useState(false)
  const wasDirty = useRef(dirty)
  const savePressed = useRef(false)
  useEffect(() => {
    if (dirty) {
      setJustSaved(false)
      wasDirty.current = true
      return
    }
    const landed = wasDirty.current && savePressed.current
    wasDirty.current = false
    savePressed.current = false
    if (!landed) return
    setJustSaved(true)
    const timer = setTimeout(() => setJustSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [dirty])

  // The guard is the router's, not a window.confirm: leaving is a navigation,
  // so the refusal belongs where navigation happens.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  /**
   * Where focus goes when the refusal is dismissed.
   *
   * This dialog has no trigger element — the blocker opens it, not a button —
   * so Radix has nothing to restore focus to and drops it on `document.body`.
   *
   * Reading `document.activeElement` at the moment of blocking is not enough
   * either: by then focus is on whatever the user clicked to leave, usually a
   * nav tab. Choosing "Keep editing" should put you back in the form you are
   * keeping, so this tracks the last control focused INSIDE the editing region
   * and ignores anything in a tablist or in the dialog itself.
   */
  const blocked = blocker.state === 'blocked'
  const returnFocusTo = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!dirty) return
    const remember = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || target === document.body) return
      if (target.closest('[role="tablist"], [role="dialog"], [role="alertdialog"]')) return
      returnFocusTo.current = target
    }
    // Seed from whatever is focused right now: editing a field is what made the
    // form dirty, so the listener would otherwise miss the very control the
    // user is standing in and only start tracking from their next move.
    remember({ target: document.activeElement } as unknown as FocusEvent)
    document.addEventListener('focusin', remember)
    return () => document.removeEventListener('focusin', remember)
  }, [dirty])

  return (
    <>
      {(dirty || justSaved) && (
        <div
          data-slot="save-bar"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-6">
            {justSaved ? (
              /*
               * The result, AT the control that was pressed (§5.3). A corner
               * toast alone makes the user look away from the thing they just
               * acted on to find out whether it worked. The bar has to leave
               * anyway, so it says what happened on its way out.
               * `role="status"` so it is announced rather than only seen.
               */
              <p role="status" className="flex items-center gap-2 text-sm text-success">
                <Check aria-hidden className="size-4" />
                Saved
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            )}
            {!justSaved && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    savePressed.current = false
                    onCancel()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    savePressed.current = true
                    onSave()
                  }}
                >
                  {saveLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={blocked} onOpenChange={(open) => !open && blocker.reset?.()}>
        <DialogContent
          className="sm:max-w-[420px]"
          onCloseAutoFocus={(event) => {
            // Only meaningful when we stay on the page; if the user discarded,
            // the route is already changing and the new screen owns focus.
            // If the remembered control has left the DOM, let the browser do
            // whatever it would have done — there is nothing better to offer.
            const target = returnFocusTo.current
            if (!target?.isConnected) return
            event.preventDefault()
            target.focus()
          }}
        >
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
