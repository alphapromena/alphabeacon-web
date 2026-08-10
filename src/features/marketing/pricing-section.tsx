/**
 * PRICING — deliberately UNLINKED from the V1 page (decisions.md D3; brief
 * §15/§28). Nothing imports this module. It is the seam for the flip:
 *
 * If the founder finalizes tiers, rebuild THIS file to the §28 packaging
 * before linking it — outcome-led Starter / Growth / Business:
 *   - Starter  · solo/small business · brand memory, planned monthly
 *     content, launch channels, approval workflow · CTA "Start free"
 *   - Growth   · growing business · more brands/channels/volume, advanced
 *     calendar, executive LinkedIn · CTA "Start free" (trial)
 *   - Business · teams/multi-brand · users, approvals, volume, support ·
 *     CTA "Talk to us" — NOTE: adding this CTA requires amending D2 and the
 *     verify:w02 CTA law in the same commit.
 * §28 bans on the marketing page: model names (Balanced/Precise/Creative),
 * "drafting model(s)", credit terminology, and "All channels" while some
 * channels are roadmap. The verify:w02 copy laws enforce these bans — a
 * §28-compliant section passes them unchanged.
 *
 * The app's Billing screens (H1–H4) are untouched by any of this and keep
 * reading `usePlans()`.
 */
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { usePlans, useScreenPhase } from '@/data/provider'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const plans = usePlans()
  const phase = useScreenPhase()

  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Simple, predictable pricing
          </h2>
        </div>

        {phase === 'loading' ? (
          <SkeletonCardGrid cards={3} columns={3} className="mt-12" label="Loading plans" />
        ) : plans.length === 0 ? (
          <Card className="mt-12">
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p className="text-sm text-muted-foreground">
                Plans start free and scale with how much you publish.
              </p>
              <Button asChild>
                <Link to="/signup">Start free</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn('rounded-2xl', plan.id === 'pro' && 'relative ring-2 ring-primary')}
              >
                <CardHeader>
                  <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold">
                      $<MonoNumber value={plan.priceMonthly} />
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
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
                    <Link to="/signup">Start free</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
