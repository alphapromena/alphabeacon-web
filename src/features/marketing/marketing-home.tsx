/**
 * M1 — Home / Landing · `/` (public, unauthenticated).
 *
 * The cinematic front door (design.md Part 5 — "Marketing cinematic layer"):
 * an ink-void hero the visitor scrubs into order, grading into the off-white
 * body where the product speaks for itself. Deliberately outside `AppShell` —
 * a prospect has no rail to navigate — and light-only by design; the ink
 * sections are art direction inside scoped `.dark` islands, not a theme.
 *
 * Pricing renders from the same `usePlans()` the in-app Billing screens read,
 * so the two can never drift. It also never looks broken: if plans are
 * unavailable the section falls back to a plain "see plans in-app" card rather
 * than an error, because a broken price is worse than a missing one to someone
 * deciding whether to sign up.
 *
 * Every scroll effect on this page answers to one switch: under
 * prefers-reduced-motion there is no Lenis, no scrub, no marquee, no pin, no
 * autoplay ambience — each section renders its finished state instead.
 */
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { usePlans, useScreenPhase } from '@/data/provider'
import { cn } from '@/lib/utils'
import { CustomerMarquee } from './cinematic/customer-marquee'
import { FinalCta } from './cinematic/final-cta'
import { HeroScrub } from './cinematic/hero-scrub'
import { HonestyCounters } from './cinematic/honesty-counters'
import { LoopPillars } from './cinematic/loop-pillars'
import { ProductTruth } from './cinematic/product-truth'
import { SiteHeader } from './cinematic/site-header'
import { ToneMorph } from './cinematic/tone-morph'
import { useLenis } from './cinematic/use-lenis'
import { usePrefersReducedMotion } from './cinematic/use-media-query'

const FAQ = [
  {
    q: 'Who can see our data?',
    a: 'Only your team. Drafts, sources and analytics belong to your organization, and we never use your content to train anything.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'Facebook Pages, Instagram and LinkedIn today, for both publishing and analytics. X is coming soon.',
  },
  {
    q: 'How do credits work?',
    a: 'Every plan includes a monthly credit grant. Credits are spent only in Creative Studio, when you generate an image or a video — drafting copy never costs credits. A failed generation releases its credits back.',
  },
  {
    q: 'Can we cancel?',
    a: 'Any time, from the billing screen. You keep access until the end of the period you have already paid for.',
  },
]

export function MarketingHome() {
  const plans = usePlans()
  const phase = useScreenPhase()
  const reduced = usePrefersReducedMotion()
  useLenis(!reduced)

  // The header goes solid the moment the hero's ink leaves the viewport.
  const heroRef = useRef<HTMLDivElement>(null)
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader solid={pastHero} />

      <main>
        <div ref={heroRef}>
          <HeroScrub />
        </div>

        <CustomerMarquee />
        <LoopPillars />
        <ToneMorph />
        <HonestyCounters />
        <ProductTruth />

        {/* Pricing — the same records Billing reads */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Simple, predictable pricing
            </h2>
            <p className="text-muted-foreground">
              Every plan includes the full review queue. Credits are only spent in Studio.
            </p>
          </div>

          {phase === 'loading' ? (
            <SkeletonCardGrid cards={3} columns={3} className="mt-12" label="Loading plans" />
          ) : plans.length === 0 ? (
            // Never a broken-looking price to a prospect.
            <Card className="mt-12">
              <CardContent className="flex flex-col items-start gap-3 py-6">
                <p className="text-sm text-muted-foreground">
                  Plans start free and scale with how much you publish.
                </p>
                <Button asChild>
                  <Link to="/signup">See plans after signup</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'rounded-2xl',
                    plan.id === 'pro' && 'relative ring-2 ring-primary',
                  )}
                >
                  {plan.id === 'pro' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Most teams
                    </span>
                  )}
                  <CardHeader>
                    {/* A real heading, not CardTitle's div: on a marketing page
                        the plan names are part of the document outline. */}
                    <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                    <p className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold">
                        $<MonoNumber value={plan.priceMonthly} />
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <MonoNumber value={plan.credits} /> credits a month
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-6">
                    <ul className="flex flex-col gap-2">
                      {plan.entitlements.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={plan.id === 'pro' ? 'default' : 'outline'}>
                      <Link to="/signup">Get started</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Cancel anytime, no long-term contracts.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Questions people ask
            </h2>
            <div className="mt-8 flex flex-col gap-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg border border-border bg-card px-4 py-3"
                >
                  <summary className="cursor-pointer list-none font-medium marker:content-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm/relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <FinalCta />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.14em] uppercase">
              <span aria-hidden className="size-5 rounded bg-brand" />
              AlphaBeacon
            </span>
            <p className="text-sm text-muted-foreground">Marketing that keeps its rhythm.</p>
          </div>
          {[
            { heading: 'Product', links: ['The loop', 'Tones', 'Pricing'] },
            { heading: 'Legal', links: ['Privacy', 'Terms', 'Data processing'] },
            { heading: 'Contact', links: ['Support', 'Sales', 'Status'] },
          ].map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-2">
              <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
                {column.heading}
              </h2>
              {column.links.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="mx-auto max-w-6xl border-t border-border px-6 py-6">
          <p className="text-xs text-muted-foreground">
            © <MonoNumber value={new Date().getFullYear()} /> AlphaBeacon, an Alpha Pro MENA
            product.
          </p>
        </div>
      </footer>
    </div>
  )
}
