/**
 * The honesty counters — the product's promises as figures, counting up as
 * they scroll into view.
 *
 * Counting is `useCountUp`, the design layer's one sanctioned count (design.md
 * Part 5): under reduced motion it returns the final figure on first render,
 * so the guarantee is inherited rather than re-implemented. Before a stat is
 * seen it renders its target statically — assistive tech and find-in-page
 * always get the true number, never a zero in transit.
 *
 * The hero stat is 0 — posts published without your approval — because the
 * approval gate is the product's spine, and 0 is the only figure on this page
 * big enough to say so.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MonoNumber } from '@/components/ab/mono-number'
import { useCountUp } from '@/components/ab/use-count-up'
import { useTones } from '@/data/provider'
import { cn } from '@/lib/utils'

function Counting({ target, className }: { target: number; className?: string }) {
  const value = useCountUp(target, { durationMs: 900 })
  return <MonoNumber value={value} className={className} />
}

function Stat({
  target,
  label,
  lead = false,
}: {
  target: number
  label: ReactNode
  lead?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver !== 'function') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const figure = cn(
    'font-semibold tracking-tight',
    lead ? 'text-7xl text-brand sm:text-8xl' : 'text-4xl sm:text-5xl',
  )

  return (
    <div ref={ref} className={cn('flex flex-col gap-2', lead && 'items-center text-center')}>
      {seen ? (
        <Counting target={target} className={figure} />
      ) : (
        <MonoNumber value={target} className={figure} />
      )}
      <p className={cn('text-sm text-muted-foreground', lead && 'max-w-xs text-base')}>{label}</p>
    </div>
  )
}

export function HonestyCounters() {
  const tones = useTones()
  const presetCount = tones.filter((tone) => tone.kind === 'preset').length

  return (
    <section aria-label="The numbers" className="border-y border-border bg-muted/40">
      <div className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-20">
        <Stat
          target={0}
          lead
          label={
            <>
              posts published without <span className="text-foreground">your</span> approval —
              the gate is the product
            </>
          }
        />
        <div className="grid gap-10 sm:grid-cols-3">
          <Stat target={presetCount} label="preset tones, plus the ones you write" />
          <Stat target={3} label="channels — Facebook, Instagram, LinkedIn" />
          <Stat target={60} label="seconds, most mornings, from open to approved" />
        </div>
      </div>
    </section>
  )
}
