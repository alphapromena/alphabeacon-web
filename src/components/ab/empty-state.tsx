/**
 * The one empty state in the product, so "nothing here yet" always invites a
 * next step instead of dead-ending.
 *
 * Design law: empty states invite action — the `action` slot exists so a
 * screen cannot ship a bare "No results". Copy is a prop, never a literal
 * here: every designed string lives in `lib/messages.ts` (MESSAGES.empty.*)
 * so the W7 catalogue-completeness test can see all of them.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  /** Decorative only — the title carries the meaning, so the icon is hidden from AT. */
  icon?: LucideIcon
  title: string
  /** Pass a MESSAGES.empty.* entry rather than inlining copy. */
  description?: string
  /** The invitation: a Button/link that starts the flow this screen is missing. */
  action?: ReactNode
  className?: string
}) {
  return (
    <Empty className={cn('border border-dashed border-border', className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon aria-hidden />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
