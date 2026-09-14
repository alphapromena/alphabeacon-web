import { useNumberTransition } from '@/components/ab/use-number-transition'
import { cn } from '@/lib/utils'

/**
 * Every number that matters renders through this — credits, counts,
 * timestamps, metrics — so the mono stack (Inter with tabular figures since
 * the rebrand) is automatic and raw digits in features stay a lint smell.
 *
 * And because it is the one place, it is also where ORDER MOTION-0914/A §3's
 * "numbers that change animate to their new value" is fixed: a numeric value
 * travels to its new figure instead of being replaced, and every figure in
 * the product inherits that without a single screen being edited. Strings
 * pass straight through — a timestamp or a formatted balance is text, and
 * interpolating text is nonsense.
 *
 * `tabular-nums` is load-bearing here in a way it was not before: proportional
 * digits would make the column jitter on every frame of the change.
 */
export function MonoNumber({
  value,
  className,
  /**
   * Off for a caller that is ALREADY animating the number it passes in.
   *
   * There is exactly one: `ClaimChip` counts a cited figure up from zero on
   * mount (`useCountUp`), and feeding that into this component's own tween
   * stacked two easings on one number — the figure lagged its own count and
   * settled late. Caught by `claim-chip.test.tsx` the moment the tween landed
   * here. One owner per number.
   */
  animate = true,
}: {
  value: number | string
  className?: string
  animate?: boolean
}) {
  const numeric = typeof value === 'number'
  // Hooks are unconditional; the transition simply has nothing to do for a
  // string, and `0` is as good a parked value as any.
  const animated = useNumberTransition(numeric && animate ? value : 0)
  const shown = numeric ? (animate ? animated : value) : value
  const text = numeric ? new Intl.NumberFormat('en-US').format(shown as number) : value
  return <span className={cn('font-mono tabular-nums', className)}>{text}</span>
}
