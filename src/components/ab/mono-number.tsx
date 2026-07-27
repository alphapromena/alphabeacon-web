import { cn } from '@/lib/utils'

/**
 * Every number that matters renders through this — credits, counts,
 * timestamps, metrics — so Geist Mono + tabular figures are automatic and
 * raw digits in features stay a lint smell.
 */
export function MonoNumber({ value, className }: { value: number | string; className?: string }) {
  const text = typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value
  return <span className={cn('font-mono tabular-nums', className)}>{text}</span>
}
