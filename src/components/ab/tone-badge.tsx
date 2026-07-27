/**
 * A tone's name, wherever a tone is shown (D2, D3, C1, F1, onboarding).
 *
 * THE LAW: a custom tone renders IDENTICALLY to a preset. No accent dot, no
 * "Custom" suffix, no muted variant, no smaller size — a tone the user wrote
 * is not a second-class tone. `kind` is therefore accepted and deliberately
 * never read; it exists only so `tone-badge.test.tsx` can prove that passing
 * either value produces byte-identical markup, which is the only way this
 * promise survives future edits.
 */
import type { Tone } from '@/data/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ToneBadge({
  tone,
  className,
}: {
  tone: Pick<Tone, 'name' | 'kind'>
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('font-normal', className)}>
      {tone.name}
    </Badge>
  )
}
