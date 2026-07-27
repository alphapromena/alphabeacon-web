/**
 * The only way this product asks "are you sure?" — by never asking it.
 *
 * `consequence` is a REQUIRED, non-optional prop by design: the type system is
 * what enforces the design law that a destructive dialog names what will be
 * lost. A caller physically cannot compile a bare "Are you sure?" dialog here,
 * because there is no shape of these props that omits the sentence explaining
 * the cost. That is the whole reason this wrapper exists rather than features
 * reaching for `AlertDialog` directly.
 *
 * Built on shadcn's AlertDialog so focus trapping, focus restore, escape-to-
 * cancel and the `alertdialog` role come for free and stay consistent.
 */
import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ConfirmDialog({
  trigger,
  title,
  consequence,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
}: {
  /**
   * The control that opens the dialog. Rendered with `asChild`, so pass a
   * single element that accepts a ref and DOM props (a `Button`) — a bare
   * string would leave the trigger without an accessible name.
   */
  trigger: ReactNode
  /** What the user is about to do, sentence case. */
  title: string
  /**
   * What this costs, in plain words — "Drafts already using it keep their
   * copy, but you won't be able to select it for new ones." Required so the
   * consequence can never be skipped.
   */
  consequence: string
  /** Names the action, not "OK" — the label carries through from the trigger. */
  confirmLabel: string
  cancelLabel?: string
  /** Destructive by default: this dialog exists for irreversible actions. */
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          {destructive && (
            // Decorative: the title and consequence already carry the meaning,
            // so the icon reinforces severity without becoming the only signal.
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <TriangleAlert aria-hidden />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
