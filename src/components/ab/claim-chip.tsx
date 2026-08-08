/**
 * The product's signature component: wherever Malaky states a fact, it
 * shows where that fact came from. A ClaimChip is that citation — source,
 * verification state, and an optional figure — so grounding travels attached to
 * the claim instead of living in a "sources" panel a user has to go find.
 *
 * Four laws are enforced here so no caller can break them screen by screen:
 *
 * - Status is never colour alone. The tint is the last cue, never the only one:
 *   the icon carries it visually and a visually-hidden word carries it to
 *   assistive tech, which keeps the chip compact without keeping it silent.
 * - Grounding is shown, never hidden. Only the source clamps, and it clamps to a
 *   character budget, so a chip can shrink but can never truncate to nothing.
 *   A flagged claim shows flagged — it is never quietly dropped.
 * - Figures render mono and count up (see `use-count-up`), which is the one
 *   place this product animates a number.
 * - The chip is inert by default. This app is static and holds no URLs, so a
 *   chip that looked clickable would promise a destination that does not exist;
 *   it becomes a real button only when a caller passes `onSelect`.
 */
import { BadgeCheck, TriangleAlert } from 'lucide-react'
import { MonoNumber } from '@/components/ab/mono-number'
import { useCountUp } from '@/components/ab/use-count-up'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Claim } from '@/data/types'
import { cn } from '@/lib/utils'

/** Icon + word first; `tint` only reinforces what those two already said. */
const CLAIM_STATE = {
  verified: { icon: BadgeCheck, tint: 'text-success', word: 'Verified source' },
  flagged: { icon: TriangleAlert, tint: 'text-warning', word: 'Flagged source' },
} as const

export function ClaimChip({
  claim,
  count,
  className,
  onSelect,
}: {
  claim: Claim
  /** A figure belonging to this claim — counts up on mount, always mono. */
  count?: number
  className?: string
  /** Opt-in interactivity; omit it and the chip stays a non-interactive span. */
  onSelect?: () => void
}) {
  const state = CLAIM_STATE[claim.state]
  const StateIcon = state.icon
  // Hooks cannot be conditional, so the count always runs and the render decides.
  const shownCount = useCountUp(count ?? 0)

  const chipClassName = cn(
    'inline-flex max-w-full items-center gap-1.5 rounded-md border border-border',
    'bg-card px-2 py-0.5 text-left align-middle',
    // Focus is re-drawn, never removed — the ring replaces the outline visibly.
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    onSelect && 'hover:bg-accent',
    className,
  )

  const content = (
    <>
      <StateIcon aria-hidden className={cn('size-3.5 shrink-0', state.tint)} />
      <span className="sr-only">{state.word}</span>
      <span className="max-w-[22ch] truncate font-mono text-xs text-muted-foreground">
        {claim.source}
      </span>
      {count !== undefined && (
        <MonoNumber value={shownCount} className="shrink-0 text-xs font-medium text-foreground" />
      )}
    </>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {onSelect ? (
            <button type="button" onClick={onSelect} className={chipClassName}>
              {content}
            </button>
          ) : (
            // Focusable but not actionable: the full claim lives in the tooltip,
            // and a tooltip no keyboard can reach would hide the grounding again.
            <span tabIndex={0} className={chipClassName}>
              {content}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>{claim.title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
