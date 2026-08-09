/**
 * M1 — Home / Landing · `/` (public, unauthenticated).
 *
 * The Malaky front door (design.md Part 5 — "Marketing layer"): the kit's §4
 * product flow in order — Hero, Today's Workspace, How Malaky Works, Memory,
 * One Brand Every Channel, Human Approval, Built for the Middle East, Call to
 * Action, Footer — on the warm-ivory surface, wordmark exactly as supplied.
 * Deliberately outside `AppShell`: a prospect has no rail to navigate.
 *
 * Motion is two-tier since the 2026-08-08 amendment (design.md Part 5): the
 * base page's budget is a single gentle fade-and-rise per section, and the
 * cinematic-calm tier — the hero scrub and two film bands under
 * features/marketing/film/ — mounts ONLY when the browser affirms
 * no-preference (useCinematicLayer). Under prefers-reduced-motion neither
 * tier exists: the fade's animated state lives inside a no-preference media
 * query in globals.css and the film layer never mounts, so every section
 * renders finished. The route is light-canonical — the footage is graded for
 * ivory, and the app theme is ignored here (Part 6 rule 8).
 *
 * Content is the product's own: tones and their rules from `useTones()`,
 * channels from `useConnections()`, pricing from the same `usePlans()` the
 * Billing screens read (if plans are unavailable the section falls back to a
 * plain signup card — a broken price is worse than a missing one). The
 * workspace preview quotes Atlas Roasters, the demo workspace that ships in
 * the static datasets, and says so beneath it.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot } from '@/components/ab/motion'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useConnections, usePlans, useScreenPhase, useTones } from '@/data/provider'
import { PLATFORMS } from '@/features/connections/platforms'
import { AmbientClip } from '@/features/marketing/film/ambient-clip'
import { FILM } from '@/features/marketing/film/media'
import { ScrubHero } from '@/features/marketing/film/scrub-hero'
import { useCinematicLayer } from '@/features/marketing/film/use-cinematic'
import { MESSAGES } from '@/lib/messages'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/**
 * The founder-approved Arabic wordmark, exactly as supplied — never redrawn,
 * edited, or distorted (design.md Part 3). Charcoal on light, white on dark,
 * gold reserved for the premium brand moment.
 */
function Wordmark({
  tone = 'auto',
  className,
  alt = '',
}: {
  /** auto = charcoal in light / white in dark; gold and white are fixed. */
  tone?: 'auto' | 'gold' | 'white'
  className?: string
  /** Empty by default — pass a name only when no adjacent text names it. */
  alt?: string
}) {
  if (tone !== 'auto') {
    return (
      <img
        src={`/brand/malaky-logo-${tone}.png`}
        alt={alt}
        aria-hidden={alt === '' || undefined}
        className={className}
      />
    )
  }
  return (
    <>
      <img
        src="/brand/malaky-logo-charcoal.png"
        alt={alt}
        aria-hidden={alt === '' || undefined}
        className={cn(className, 'dark:hidden')}
      />
      <img
        src="/brand/malaky-logo-white.png"
        alt=""
        aria-hidden
        className={cn(className, 'hidden dark:block')}
      />
    </>
  )
}

/**
 * The one motion on this page: fade in and settle when the block first
 * enters the viewport. The CSS lives in globals.css behind
 * prefers-reduced-motion: no-preference, so reduced motion never sees an
 * intermediate state — this component only flips the attribute.
 */
function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver !== 'function') {
      node.setAttribute('data-mk-reveal', 'in')
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.setAttribute('data-mk-reveal', 'in')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} data-mk-reveal="" className={className}>
      {children}
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          to="/"
          className="flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Wordmark alt="Malaky" className="h-8 w-auto" />
        </Link>
        <nav aria-label="Site" className="hidden items-center gap-6 md:flex">
          {[
            ['How Malaky works', '#how'],
            ['Pricing', '#pricing'],
            ['FAQ', '#faq'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

/**
 * Two real drafts from Atlas Roasters, shown the way D1 shows them. The block
 * is `inert`: it is an illustration of the workspace, not the workspace, so
 * nothing inside it can take focus or promise a click it cannot honour. The
 * sr-only line before it carries the same information to assistive tech.
 */
function WorkspacePreview() {
  const tones = useTones()
  const byName = (name: string) => tones.find((tone) => tone.name === name)
  const drafts = [
    {
      copy: 'What does "washed process" actually mean? A 60-second guide to the step that decides half of what you taste.',
      tone: byName('Educational'),
      platform: PLATFORMS.instagram.label,
      time: '09:00',
    },
    {
      copy: 'New arrival: Kirinyaga AA, Kenya. Blackcurrant, cane sugar, a finish that will not quit. 240 bags, then it is gone.',
      tone: byName('Data-driven'),
      platform: PLATFORMS.linkedin.label,
      time: '12:30',
    },
  ]
  return (
    <div>
      <p className="sr-only">
        A preview of the review queue: two drafts awaiting review, each with its tone, channel,
        and time, and the approve and edit actions beside them.
      </p>
      <div inert aria-hidden className="select-none">
        <Card className="rounded-2xl shadow-[var(--shadow-soft-lg)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BeaconDot live />
              <span className="text-sm font-medium">
                <MonoNumber value={drafts.length} /> drafts awaiting review
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Today</span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {drafts.map((draft) => (
              <div
                key={draft.copy}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
              >
                <p className="text-sm/relaxed">{draft.copy}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {draft.tone && <ToneBadge tone={draft.tone} />}
                  <span className="text-xs text-muted-foreground">{draft.platform}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {draft.time}
                  </span>
                  <span className="ml-auto flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Real drafts from Atlas Roasters, the demo workspace that ships with Malaky.
      </p>
    </div>
  )
}

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
    a: 'Every plan includes a monthly credit grant. Credits are spent only in Creative Studio, when you generate an image or a video. Drafting copy never costs credits, and a failed generation releases its credits back.',
  },
  {
    q: 'Can we cancel?',
    a: 'Any time, from the billing screen. You keep access until the end of the period you have already paid for.',
  },
]

/**
 * The hero copy, shared verbatim by both tiers: the static hero renders it as
 * the section body, the cinematic scrub pins it as stage one. Either way the
 * wordmark is the h1 — its letters are presentation, the accessible name is
 * the sr-only text (e2e relies on this).
 */
function HeroCopy() {
  return (
    <>
      <h1>
        <span className="sr-only">Malaky</span>
        <Wordmark className="h-24 w-auto sm:h-28" />
      </h1>
      <p className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Your marketing team&apos;s AI co-pilot
      </p>
      <p className="max-w-[46ch] text-lg text-muted-foreground">
        Malaky drafts your posts every morning. You review, approve, and publish. Nothing
        goes out without your sign-off.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/signup">Start free</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#how">How Malaky works</a>
        </Button>
      </div>
    </>
  )
}

function TodaysWorkspaceContent() {
  return (
    <>
      <Reveal className="flex flex-col gap-4">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Today&apos;s workspace
        </h2>
        <p className="max-w-[52ch] text-muted-foreground">
          One screen each morning: the drafts Malaky wrote overnight, waiting for you. Approve
          the good ones, edit the close ones, decline the rest. Ten minutes, and the week
          keeps its rhythm.
        </p>
      </Reveal>
      <Reveal>
        <WorkspacePreview />
      </Reveal>
    </>
  )
}

export function MarketingHome() {
  const plans = usePlans()
  const phase = useScreenPhase()
  const tones = useTones()
  const connections = useConnections()
  const voiceTone = tones.find((tone) => tone.rules.do.length > 0) ?? tones[0]
  const cinematic = useCinematicLayer()

  /* Light-canonical (design.md Part 6 rule 8, amended): the footage is graded
     for ivory, so this route ignores the app theme. The preference itself is
     untouched — the class is restored on the way out. */
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    return () => {
      if (resolvedTheme === 'dark') root.classList.add('dark')
    }
  }, [resolvedTheme])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />

      <main>
        {cinematic ? (
          <ScrubHero
            intro={
              <div className="flex flex-col items-center gap-6">
                <HeroCopy />
              </div>
            }
          />
        ) : (
          <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pt-20 pb-24 text-center sm:pt-24">
            <HeroCopy />
          </section>
        )}

        {/* Today's Workspace — pinned over the detail macro when the layer is
            on; the plain two-column section otherwise. Same content either way. */}
        {cinematic ? (
          <section className="relative h-[220vh]">
            <div className="sticky top-0 flex h-svh items-center overflow-hidden">
              <AmbientClip
                src={FILM.detail}
                poster={FILM.detailPoster}
                className="absolute inset-0 size-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-background/55" />
              <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
                <TodaysWorkspaceContent />
              </div>
            </div>
          </section>
        ) : (
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <TodaysWorkspaceContent />
          </section>
        )}

        {/* How Malaky Works */}
        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                How Malaky works
              </h2>
            </Reveal>
            <div className="mt-8 flex flex-col divide-y divide-border">
              {[
                {
                  title: 'Drafts arrive each morning',
                  body: 'On the days you choose, at the hour you choose, Malaky writes posts from your offer, your sources, and your calendar.',
                },
                {
                  title: 'You approve what goes out',
                  body: 'Every draft holds in the review queue until a person says yes. Edit in place, or decline and say why.',
                },
                {
                  title: 'Malaky publishes and reports',
                  body: 'Approved posts go out to every connected channel at their scheduled time, and the results come back to one dashboard.',
                },
              ].map((step) => (
                <Reveal key={step.title} className="flex flex-col gap-1 py-6">
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="max-w-[60ch] text-sm/relaxed text-muted-foreground">{step.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Memory */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <Reveal className="order-last lg:order-first">
            {voiceTone && (
              <Card className="rounded-2xl">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {tones.slice(0, 4).map((tone) => (
                      <ToneBadge key={tone.id} tone={tone} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{voiceTone.description}</p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Do
                    </h3>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {voiceTone.rules.do.map((rule) => (
                        <li key={rule} className="text-sm/relaxed">
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Don&apos;t
                    </h3>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {voiceTone.rules.dont.map((rule) => (
                        <li key={rule} className="text-sm/relaxed">
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </Reveal>
          <Reveal className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Memory</h2>
            <p className="max-w-[52ch] text-muted-foreground">
              Malaky writes from what your business actually knows: your offer, your tones and
              their rules, your price list, the things you would never say. Teach it once and
              every draft starts from there.
            </p>
          </Reveal>
        </section>

        {/* One Brand, Every Channel */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                One brand, every channel
              </h2>
              <p className="max-w-[52ch] text-muted-foreground">
                Write once, approve once, and the same voice reaches every account you connect.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {connections.map((connection) => {
                const platform = PLATFORMS[connection.platform]
                const Icon = platform.icon
                const comingSoon = connection.platform === 'x'
                return (
                  <Reveal
                    key={connection.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
                  >
                    <Icon aria-hidden className="size-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platform.label}</span>
                      {comingSoon && (
                        <Badge variant="outline" className="font-normal">
                          Coming soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {comingSoon ? 'On the roadmap next.' : 'Publishing and analytics.'}
                    </p>
                  </Reveal>
                )
              })}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{MESSAGES.notices.xComingSoon}</p>
          </div>
        </section>

        {/* Human Approval */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <Reveal className="flex flex-col items-center gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Human approval
              </h2>
              <p className="max-w-[54ch] text-muted-foreground">
                Nothing publishes itself. Every draft waits for a human. Every fact shows its
                source. Every publish reports what actually happened, channel by channel. Malaky
                drafts, you decide.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Built for the Middle East */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Built for the Middle East
            </h2>
            <p className="max-w-[52ch] text-muted-foreground">
              Malaky plans in your timezone, writes around your country&apos;s holidays, and posts
              when your customers are actually awake. It carries an Arabic name because it was
              built here, not translated here.
            </p>
          </Reveal>
          <Reveal className="flex items-center justify-center rounded-2xl bg-secondary p-12 sm:p-16">
            <Wordmark tone="gold" className="h-24 w-auto sm:h-28" />
          </Reveal>
        </section>

        {/* Pricing — the same records Billing reads */}
        <section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
            <Reveal className="flex flex-col gap-2 text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Simple, predictable pricing
              </h2>
              <p className="text-muted-foreground">
                Every plan includes the full review queue. Credits are only spent in Studio.
              </p>
            </Reveal>

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
                        <Link to="/signup">Start free</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Cancel anytime, no long-term contracts.
            </p>
          </div>
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

        {/* Call to Action — the one deliberate dark moment on the page: a
            scoped charcoal island (design.md Part 3: white wordmark on dark),
            not a theme flip. With the layer on, the calm pull-back drifts
            behind it — finished work, quiet order in the morning. */}
        <section className="relative overflow-hidden py-20">
          {cinematic && (
            <>
              <AmbientClip
                src={FILM.calm}
                poster={FILM.calmPoster}
                className="absolute inset-0 size-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-background/40" />
            </>
          )}
          <div className="relative mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="dark flex flex-col items-center gap-6 rounded-2xl border border-border bg-card px-6 py-16 text-center text-card-foreground">
                <Wordmark tone="white" className="h-16 w-auto" />
                <p className="font-display text-3xl font-semibold tracking-tight text-balance">
                  Tomorrow morning, your drafts are waiting
                </p>
                <p className="max-w-[44ch] text-muted-foreground">
                  Set up your workspace tonight. Review your first drafts with your first coffee.
                </p>
                <Button asChild size="lg">
                  <Link to="/signup">Start free</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Wordmark alt="Malaky" className="h-7 w-auto self-start" />
            <p className="text-sm text-muted-foreground">
              Your marketing, drafted every morning.
            </p>
          </div>
          {[
            {
              heading: 'Product',
              links: [
                ['How Malaky works', '#how'],
                ['Pricing', '#pricing'],
                ['FAQ', '#faq'],
              ],
            },
            {
              heading: 'Legal',
              links: [
                ['Privacy', '#privacy'],
                ['Terms', '#terms'],
                ['Data processing', '#data-processing'],
              ],
            },
            {
              heading: 'Contact',
              links: [
                ['Support', '#support'],
                ['Sales', '#sales'],
                ['Status', '#status'],
              ],
            },
          ].map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-2">
              <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
                {column.heading}
              </h2>
              {column.links.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="mx-auto max-w-6xl border-t border-border px-6 py-6">
          <p className="text-xs text-muted-foreground">
            {/* A year is an identifier, not a quantity — no digit grouping. */}
            © <MonoNumber value={String(new Date().getFullYear())} /> Malaky, an Alpha Pro MENA
            product.
          </p>
        </div>
      </footer>
    </div>
  )
}
