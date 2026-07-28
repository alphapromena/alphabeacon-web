/**
 * M1 — Home / Landing · `/` (public, unauthenticated).
 *
 * The front door: what the product does, what it costs, and one way in.
 * Light-only by design (decisions.md), and deliberately outside `AppShell` —
 * a prospect has no rail to navigate.
 *
 * Pricing renders from the same `usePlans()` the in-app Billing screens read,
 * so the two can never drift. It also never looks broken: if plans are
 * unavailable the section falls back to a plain "see plans in-app" card rather
 * than an error, because a broken price is worse than a missing one to someone
 * deciding whether to sign up.
 */
import { BarChart3, Check, Import, Sparkles, Wand2, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { usePlans, useScreenPhase } from '@/data/provider'
import { cn } from '@/lib/utils'

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Import,
    title: 'Connect once, post everywhere',
    body: 'Facebook, Instagram and LinkedIn in one place. Approve a post once and it goes out to every channel you chose.',
  },
  {
    icon: Wand2,
    title: 'Drafts that sound like you',
    body: 'Your brand voice and tones shape every draft, and the calendar knows which holidays and launches are coming.',
  },
  {
    icon: Sparkles,
    title: 'A creative studio for everything',
    body: 'Generate the image or video for a post without leaving it — or open Studio on its own for anything else you need.',
  },
  {
    icon: BarChart3,
    title: 'See what is working',
    body: 'Reach, engagement and follower growth per channel, tied back to the posts and tones that earned them.',
  },
]

const STEPS = [
  { title: 'Connect your accounts', body: 'Link the channels you publish to. Two minutes, once.' },
  {
    title: 'Tell us about your brand',
    body: 'What you offer and what sets you apart. Drafts start here.',
  },
  {
    title: 'Set your posting rhythm',
    body: 'Which days, how many posts, which tones. Change it any time.',
  },
  {
    title: 'Review and publish',
    body: 'Approve what fits, create the art, and let it go out on schedule.',
  },
]

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

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          {/* Wordmark per the kit: Barlow, all caps, tracked (design.md Part 3). */}
          <span className="flex items-center gap-2 font-display text-base font-semibold tracking-[0.14em] uppercase">
            <span aria-hidden className="size-6 rounded-md bg-[image:var(--signal-gradient)]" />
            AlphaBeacon
          </span>
          <nav aria-label="Marketing" className="flex items-center gap-1 sm:gap-4">
            <a
              href="#features"
              className="hidden rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hidden rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              FAQ
            </a>
            <Link
              to="/login"
              className="rounded-md px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-[image:var(--signal-gradient)] opacity-15 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-14 text-center">
            <h1 className="font-display text-5xl font-bold tracking-tight text-balance sm:text-6xl">
              Your marketing team&apos;s AI co-pilot
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              Connect your channels, review the drafts we write each morning, create the art, and
              publish everywhere — then watch what works.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Start free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#pricing">See pricing</a>
              </Button>
            </div>
          </div>

          {/* Hero visual: the review queue in a browser frame. Rendered rather
              than screenshotted so it stays true as the product changes. */}
          <div className="mx-auto max-w-4xl px-6 pb-20">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
                <span aria-hidden className="size-2.5 rounded-full bg-border" />
                <span aria-hidden className="size-2.5 rounded-full bg-border" />
                <span aria-hidden className="size-2.5 rounded-full bg-border" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">
                  alphabeacon.com/today
                </span>
              </div>
              <div className="flex flex-col gap-3 p-5 text-left">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="size-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">
                    Today · <MonoNumber value={5} /> drafts ready across <MonoNumber value={3} />{' '}
                    slots
                  </span>
                </div>
                {[
                  'Most subscription coffee goes stale before it ships. Ours is roasted after you order.',
                  'Arabica futures are up 31% this year. Our contracts locked prices in January.',
                ].map((copy) => (
                  <div key={copy} className="rounded-lg border border-border p-4">
                    <p className="text-sm">{copy}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Needs review
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                        Data-driven
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section aria-label="Customers" className="border-y border-border bg-muted/50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8">
            <p className="text-sm text-muted-foreground">Trusted by marketing teams at</p>
            {['Atlas Roasters', 'Nova Skincare', 'Cedar & Co', 'Marrakesh Studio'].map((name) => (
              // De-emphasised through the muted token, not opacity: dimming
              // real text with opacity is how a logo strip quietly drops
              // below AA (axe caught exactly that here).
              <span
                key={name}
                className="font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Everything the loop needs
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <p className="text-sm/relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="font-display text-base font-semibold">{step.title}</h3>
                  <p className="text-sm/relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing — the same records Billing reads */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Simple, predictable pricing
            </h2>
            <p className="text-muted-foreground">
              Every plan includes the full review queue. Credits are only spent in Studio.
            </p>
          </div>

          {phase === 'loading' ? (
            <SkeletonCardGrid cards={3} columns={3} className="mt-10" label="Loading plans" />
          ) : plans.length === 0 ? (
            // Never a broken-looking price to a prospect.
            <Card className="mt-10">
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
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={cn(plan.id === 'pro' && 'ring-2 ring-primary')}>
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
          <p className="mt-6 text-center text-sm text-muted-foreground">
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

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">
            Start free today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Connect a channel, tell us about your brand, and read your first drafts tomorrow
            morning.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/signup">Start free</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.14em] uppercase">
              <span aria-hidden className="size-5 rounded bg-[image:var(--signal-gradient)]" />
              AlphaBeacon
            </span>
            <p className="text-sm text-muted-foreground">Marketing that keeps its rhythm.</p>
          </div>
          {[
            { heading: 'Product', links: ['Features', 'How it works', 'Pricing'] },
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
