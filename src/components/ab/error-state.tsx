/**
 * The one designed error surface, so a failed screen still tells the truth
 * calmly and offers the way out.
 *
 * Design law it enforces:
 * - status is never color alone — the destructive border and icon always
 *   arrive with the TriangleAlert glyph and a written title;
 * - errors say what happened AND how to fix it, so `message` is required and
 *   comes from `lib/messages.ts` (MESSAGES.errors.*) rather than being
 *   inlined per screen;
 * - no apology and no code in the primary line: the title names what failed,
 *   the message says what to do, and the `reference` a support agent needs
 *   renders last and quietest (ORDER THEME-0913 §5.5);
 * - the retry affordance only exists when retrying is actually possible —
 *   no dead button teasing a recovery the caller can't perform.
 *
 * `role="alert"` wraps the whole block so assistive tech gets the icon's
 * meaning (via the title), the explanation, and the recovery in one
 * announcement.
 */
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ErrorState({
  title = "This didn't load",
  message,
  onRetry,
  retryLabel = 'Try again',
  reference,
  className,
}: {
  /**
   * Says WHAT failed, not that something did. The default is deliberately
   * concrete: "Something went wrong" was an apology stacked on top of a
   * message that already explained itself, on 16 of the 23 call sites
   * (ORDER THEME-0913 §5.5).
   */
  title?: string
  /** What happened and how to fix it — pass a MESSAGES.errors.* entry. */
  message: string
  /** Omit when the caller has no way to retry; the button is then absent, not disabled. */
  onRetry?: () => void
  retryLabel?: string
  /**
   * The handle a user can quote when they report this — `errorReference()`.
   * Rendered SECONDARY and last: a request id is for the person who will
   * debug it, never the first thing the person who hit it has to read.
   */
  reference?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-6 text-center',
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <TriangleAlert aria-hidden className="size-4" />
      </span>
      <div className="flex max-w-sm flex-col gap-1 text-balance">
        <p className="font-heading text-sm font-medium tracking-tight text-foreground">{title}</p>
        <p className="text-sm/relaxed text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {reference && (
        <p className="text-xs text-subtle-foreground">
          Reference <span className="font-medium">{reference}</span>
        </p>
      )}
    </div>
  )
}
