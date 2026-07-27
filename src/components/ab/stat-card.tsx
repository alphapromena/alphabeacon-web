/**
 * The dashboard/analytics stat tile (D1, G1), extracted so a metric looks the
 * same everywhere it appears.
 *
 * Two laws live here so features cannot forget them:
 * - the value ALWAYS renders through `MonoNumber`, never as raw digits;
 * - `tone="warning"` is never color alone — it forces an icon and an sr-only
 *   status word alongside the warning tint, so the alarm survives greyscale
 *   and a screen reader.
 *
 * When `to` is set the whole tile is the link (a card-sized target beats a
 * "view more" afterthought) and keeps a visible focus ring.
 */
import { TriangleAlert, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
  to,
  className,
}: {
  label: string
  value: number | string
  icon?: LucideIcon
  /** 'warning' tints the tile AND adds an icon + status word — never color alone. */
  tone?: 'default' | 'warning'
  /** Short, concrete context under the number. Not a place for hype. */
  hint?: string
  /** In-app route; makes the whole card the link. */
  to?: string
  className?: string
}) {
  const warn = tone === 'warning'
  // A warning without a shape is a warning half the room cannot see.
  const ToneIcon = Icon ?? (warn ? TriangleAlert : undefined)

  const card = (
    <Card
      className={cn(
        'h-full transition-colors',
        warn && 'ring-warning/50',
        to && 'group-hover/stat:ring-primary/40 group-focus-visible/stat:ring-primary/40',
        !to && className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {ToneIcon && (
          <CardAction>
            <ToneIcon
              aria-hidden
              className={cn('size-4 text-muted-foreground', warn && 'text-warning')}
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <MonoNumber
          value={value}
          className={cn('text-3xl leading-none font-semibold', warn && 'text-warning')}
        />
        {warn && <span className="sr-only">Needs attention</span>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )

  if (!to) return card

  return (
    <Link
      to={to}
      className={cn(
        'group/stat block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        className,
      )}
    >
      {card}
    </Link>
  )
}
