/**
 * The brand-setup checklist (ORDER ONB-0827, D-ONB-D).
 *
 * ONE component, three placements: the dashboard card, the Settings entry, and
 * every blocked generation state. They render the same rows from the same
 * `useReadiness()` selector, so what the dashboard promises and what the
 * blocked Generate screen refuses can never drift apart — which is the whole
 * reason the wizard's checklist could be trusted and a scattered set of
 * per-screen banners could not.
 *
 * DESIGN LAW, both halves of it:
 *   - **No dead rows.** Every item links to the screen that completes it. A
 *     checklist that names a gap without offering the way to close it is the
 *     disabled-and-teasing pattern in list form.
 *   - **Status is never colour-only.** A done row carries a check icon AND the
 *     word "Done"; an outstanding one carries a circle and what it is for.
 *
 * Items that do NOT block generation (country, posting rhythm) are shown in
 * the same list and say what they buy instead. The Phase-0 probe proved the
 * wire runs without them (readiness.ts), so calling them blockers would be a
 * lie — but leaving them out would hide real setup.
 */
import { Check, Circle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useReadiness, type ReadinessItem } from '@/data/readiness'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

export function SetupChecklist({
  /** A heading is rendered only where the surface does not already own one. */
  heading,
  className,
}: {
  heading?: string
  className?: string
}) {
  const readiness = useReadiness()

  // Trap 20 in the UI: while the live sync is in flight we do not know what
  // this workspace has, so nothing is claimed in either direction.
  if (!readiness.known) {
    return (
      <div aria-busy="true" className={cn('flex flex-col gap-2', className)}>
        <span className="sr-only">Loading your setup</span>
        <div className="h-24 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      </div>
    )
  }

  return (
    <section
      aria-label="Brand setup"
      className={cn('flex flex-col gap-3 rounded-xl border border-border p-4', className)}
    >
      <div className="flex flex-col gap-1">
        {heading && <h2 className="font-display text-lg font-semibold">{heading}</h2>}
        <p className="text-sm text-muted-foreground">
          {readiness.canGenerate ? MESSAGES.notices.setupComplete : MESSAGES.notices.setupChecklist}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {readiness.items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}

function ChecklistRow({ item }: { item: ReadinessItem }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        {/* Icon + word: the status never rests on colour alone. */}
        {item.done ? (
          <Check aria-hidden className="size-4 text-success" />
        ) : (
          <Circle aria-hidden className="size-4 text-muted-foreground" />
        )}
        <span className="font-medium">{item.label}</span>
        <span className="text-muted-foreground">
          {item.done ? 'Done' : item.detail}
          {!item.done && !item.blocking && ' (optional for generating)'}
        </span>
      </span>

      {/* Never a dead row: even a finished item stays reachable to change. */}
      <Button asChild variant={item.done ? 'ghost' : 'outline'} size="sm">
        <Link to={item.to}>
          {item.done ? 'Change' : 'Set up'}
          <span className="sr-only"> {item.label}</span>
        </Link>
      </Button>
    </li>
  )
}

/**
 * What a BLOCKED generation entry point renders instead of its form or its
 * button. It names what is missing and links straight to it — the order's "no
 * dead buttons" rule, said once so five screens cannot each say it differently.
 */
export function GenerationBlocked({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold">Finish your brand setup first</h2>
        <p className="text-sm text-muted-foreground">{MESSAGES.notices.generationBlocked}</p>
      </div>
      <SetupChecklist />
    </div>
  )
}
