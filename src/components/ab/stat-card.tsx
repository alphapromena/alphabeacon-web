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
import { ArrowDownRight, ArrowUpRight, TriangleAlert, type LucideIcon } from 'lucide-react'
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
  delta,
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
  /**
   * Period-over-period movement (G1). Arrow + signed percent + a spoken
   * direction, so it survives greyscale and a screen reader. Pass nothing when
   * there is no comparable prior period — an invented "0%" is worse than
   * silence.
   */
  delta?: { percent: number; period: string }
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
        {delta && <Delta {...delta} />}
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

/** Movement, said three ways at once: shape, sign, and a word. */
function Delta({ percent, period }: { percent: number; period: string }) {
  const up = percent >= 0
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <p className="flex flex-wrap items-center gap-1 text-xs">
      <Arrow
        aria-hidden
        className={cn('size-3.5 shrink-0', up ? 'text-success' : 'text-warning')}
      />
      <MonoNumber
        value={`${up ? '+' : ''}${percent}%`}
        className={cn('font-medium', up ? 'text-success' : 'text-warning')}
      />
      <span className="sr-only">{up ? 'up on' : 'down on'}</span>
      <span aria-hidden className="text-muted-foreground">
        vs
      </span>
      <span className="text-muted-foreground">{period}</span>
    </p>
  )
}
