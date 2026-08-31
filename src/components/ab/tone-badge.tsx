/**
 * A tone's name, wherever a tone is shown (D2, D3, C1, F1, I3).
 *
 * THE LAW, now structural: a badge is ONLY the name — no accent dot, no
 * suffix, no muted variant, no smaller size. The preset concept is gone
 * (CUT-0831), so the type can no longer even express a second-class tone;
 * what remains to guard is that no caller decorates the name.
 */
import type { Tone } from '@/data/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ToneBadge({ tone, className }: { tone: Pick<Tone, 'name'>; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-normal', className)}>
      {tone.name}
    </Badge>
  )
}
