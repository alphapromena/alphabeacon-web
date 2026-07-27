/**
 * The product's two signature motions, and the only two that exist.
 *
 * `BeaconDot` — the live-status dot; its ring pulses ONLY while something
 * needs attention (`live`), never decoratively.
 * `SignalSweep` — a gradient line sweeping a surface's top edge while work
 * is in flight (generation, publishing).
 *
 * Both animate through `data-ab-motion`, which `styles/globals.css` disables
 * wholesale under `prefers-reduced-motion` — so neither component needs to
 * know about the media query, and new motion cannot skip the guarantee.
 */
import { cn } from '@/lib/utils'

export function BeaconDot({
  live = false,
  label,
  className,
}: {
  /** Pulse only while something genuinely needs attention. */
  live?: boolean
  /** Accessible name; omit when an adjacent label already says it. */
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn('relative inline-flex size-2 shrink-0', className)}
      role={label ? 'status' : undefined}
      aria-label={label}
    >
      {live && (
        <span
          data-ab-motion="beacon-pulse"
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary"
        />
      )}
      <span
        aria-hidden
        className={cn(
          'relative inline-flex size-2 rounded-full',
          live ? 'bg-primary shadow-[var(--glow-signal)]' : 'bg-muted-foreground/40',
        )}
      />
    </span>
  )
}

export function SignalSweep({
  active = false,
  className,
}: {
  active?: boolean
  className?: string
}) {
  if (!active) return null
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-t-[inherit]',
        className,
      )}
    >
      <span
        data-ab-motion="signal-sweep"
        className="block h-px w-1/2 bg-[image:var(--signal-gradient)]"
      />
    </span>
  )
}
