/**
 * The marketing header: fixed, transparent over the ink hero, solid once the
 * page grades to daylight. The flip is driven by an IntersectionObserver on
 * the hero (marketing-home owns it), not a scroll listener — no work per
 * scroll frame, and it behaves identically under reduced motion.
 */
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'The loop', href: '#the-loop' },
  { label: 'Tones', href: '#tones' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function SiteHeader({ solid }: { solid: boolean }) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300 motion-reduce:transition-none',
        solid
          ? 'border-b border-border bg-background/90 text-foreground backdrop-blur'
          : 'dark bg-[image:linear-gradient(to_bottom,var(--ab-ink),transparent)] text-foreground',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        {/* Wordmark per the kit: Barlow, all caps, tracked (design.md Part 3). */}
        <span className="flex items-center gap-2 font-display text-base font-semibold tracking-[0.14em] uppercase">
          <span aria-hidden className="size-6 rounded-md bg-[image:var(--signal-gradient)]" />
          AlphaBeacon
        </span>
        <nav aria-label="Marketing" className="flex items-center gap-1 sm:gap-4">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/login"
            className={cn(
              'rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap underline-offset-4 hover:underline',
              solid ? 'text-primary' : 'text-foreground',
            )}
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link to="/signup">Start free</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
