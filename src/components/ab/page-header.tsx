/**
 * The one h1 a screen is allowed. It exists so every page states its own
 * identity the same way — display face, sentence case, optional tracked
 * eyebrow for the area it belongs to — instead of each feature inventing a
 * heading scale. Actions ride in the header rather than floating loose above
 * the content, so the primary verb for a screen is always in one place.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string
  /** One calm, concrete line. Say what the screen is for, not how great it is. */
  description?: string
  /** The area this screen belongs to, e.g. "Creative studio". */
  eyebrow?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && (
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
