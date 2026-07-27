/**
 * M1 — Marketing home (W0 seed). Light-only public layout; W2 builds the
 * full page (hero visual, features, how-it-works, FAQ). Pricing already
 * renders from the same plans the app's Billing screens read — the one
 * source that keeps M1 and H1 from drifting.
 */
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlans } from '@/data/provider'

export function MarketingHome() {
  const plans = usePlans()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span aria-hidden className="size-2.5 rounded-full bg-primary" />
          AlphaBeacon
        </span>
        <nav aria-label="Marketing" className="flex items-center gap-3">
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </a>
          <Button asChild size="sm">
            <Link to="/signup">Start free</Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight">
            Your marketing team's AI co-pilot
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Connect your channels, review AI-drafted posts, create the media, and publish everywhere
            — then watch what works.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
        </section>
        <section id="pricing" aria-label="Pricing" className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="font-display">{plan.name}</CardTitle>
                  <p className="text-2xl font-semibold">
                    $<MonoNumber value={plan.priceMonthly} />
                    <span className="text-sm font-normal text-muted-foreground"> /month</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <MonoNumber value={plan.credits} /> credits a month
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {plan.entitlements.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full">
                    <Link to="/signup">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Cancel anytime, no long-term contracts.
          </p>
        </section>
      </main>
    </div>
  )
}
