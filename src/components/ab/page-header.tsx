/**
 * The one h1 a screen is allowed. It exists so every page states its own
 * identity the same way — display face, sentence case — instead of each
 * feature inventing a heading scale.
 *
 * There was an `eyebrow` prop here: a tracked-out uppercase label above the
 * title. ORDER THEME-0913 bans that pattern outright — read once on a landing
 * page it is a signpost, read for hours it is noise — so the PROP is gone, not
 * merely its one call site. An affordance that still exists is an affordance
 * that comes back. Actions ride in the header rather than floating loose above
 * the content, so the primary verb for a screen is always in one place.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  /** One calm, concrete line. Say what the screen is for, not how great it is. */
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
