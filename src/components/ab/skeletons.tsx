/**
 * The loading state, shaped like the content it stands in for.
 *
 * A spinner would say "wait"; these say "a stat row is coming", "a feed is
 * coming" — so the layout does not jump when data lands and the wait is
 * legible. That is the whole reason this file exists instead of `<Spinner />`.
 *
 * Every pattern goes through `SkeletonShell`, which is where the
 * accessibility guarantee lives: `role="status"` + `aria-busy` + an
 * `aria-label` means loading is announced rather than silent, and the
 * placeholder shapes are `aria-hidden` so nothing meaningless is read out.
 * Tailwind's `animate-pulse` on shadcn's Skeleton is the one accepted
 * loading motion — signature motion stays in `ab/motion`.
 */
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** One place for the announce-the-wait contract, so no pattern can forget it. */
function SkeletonShell({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn('w-full', className)}>
      <div aria-hidden>{children}</div>
    </div>
  )
}

export function SkeletonText({
  lines = 3,
  label = 'Loading text',
  className,
}: {
  lines?: number
  label?: string
  className?: string
}) {
  return (
    <SkeletonShell label={label} className={className}>
      {/* The last line runs short, the way a real paragraph ends. */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn('h-4 w-full', i === lines - 1 && 'w-2/3')} />
        ))}
      </div>
    </SkeletonShell>
  )
}

/** Mirrors the four-up stat row on the dashboard (D1) and analytics (G1). */
export function SkeletonStatRow({
  cards = 4,
  label = 'Loading stats',
  className,
}: {
  cards?: number
  label?: string
  className?: string
}) {
  return (
    <SkeletonShell label={label} className={className}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </SkeletonShell>
  )
}

/** Mirrors feed and table rows: leading marker, two text lines, trailing status. */
export function SkeletonList({
  rows = 5,
  label = 'Loading list',
  className,
}: {
  rows?: number
  label?: string
  className?: string
}) {
  return (
    <SkeletonShell label={label} className={className}>
      <div className="flex flex-col">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonShell>
  )
}

// Static class strings so Tailwind's scanner can see every column count.
const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/** Mirrors the model, plan, and connection card grids: media, copy, one action. */
export function SkeletonCardGrid({
  cards = 6,
  columns = 3,
  label = 'Loading cards',
  className,
}: {
  cards?: number
  columns?: 2 | 3 | 4
  label?: string
  className?: string
}) {
  return (
    <SkeletonShell label={label} className={className}>
      <div className={cn('grid grid-cols-1 gap-4', COLUMN_CLASS[columns])}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </SkeletonShell>
  )
}

/** Mirrors a `FieldGroup`: label above control, one submit action at the end. */
export function SkeletonForm({
  fields = 4,
  label = 'Loading form',
  className,
}: {
  fields?: number
  label?: string
  className?: string
}) {
  return (
    <SkeletonShell label={label} className={className}>
      <div className="flex flex-col gap-6">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </SkeletonShell>
  )
}
