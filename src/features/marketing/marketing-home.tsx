/**
 * M1 — Home / Landing · `/` (public, unauthenticated).
 *
 * Abdullah's Website V1 (Docs/brief/malaky-website-v1-brief-abdullah.md,
 * rb/02-v1-brief): the hero is the marketing Malaky produces — floating,
 * publication-ready outputs for the four demo brands — and the lower page
 * alternates product proof with concise copy per the §33 flow. Pricing is
 * omitted by D3 (the seam lives in pricing-section.tsx, unlinked). The
 * page's claims stay inside Docs/brief/claims-map.md.
 *
 * Motion is two-tier (design.md Part 5): the base page's budget is one
 * gentle fade-and-rise per section; the cinematic tier is the
 * scroll-choreographed card story under features/marketing/outputs/,
 * mounting only when the browser affirms no-preference. The route is
 * light-canonical — the app theme is ignored here.
 */
import { useEffect } from 'react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { ApprovalDemo } from './outputs/approval-demo'
import { OutputStory } from './outputs/scroll-story'
import {
  BuiltHereSection,
  CalendarSection,
  EveryChannelSection,
  FactsSection,
  HowMalakyWorksSection,
  MemorySection,
  TwoVoicesSection,
} from './outputs/story-sections'
import { WorkspaceSection } from './outputs/workspace-section'
import { Reveal } from './reveal'

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

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-6">
        {/* The mark carries the brand alone — enlarged ~25% with breathing
            room, and never paired with a Latin "Malaky" (brief §1). */}
        <Link
          to="/"
          className="flex items-center rounded-md py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Wordmark alt="Malaky" className="h-10 w-auto" />
        </Link>
        <nav aria-label="Site" className="hidden items-center gap-6 md:flex">
          {[
            ['How Malaky works', '#how'],
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
            <Link to="/signup">Request early access</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

/** The hero copy (brief §2) — stage one of the story, both tiers. */
function HeroIntro() {
  return (
    <div className="flex flex-col items-start gap-6 text-left">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        Your marketing, already done.
      </h1>
      <p className="max-w-[44ch] text-lg text-muted-foreground">
        Malaky learns your business and prepares your marketing before you ask. You review. You
        approve. Malaky handles the rest.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link to="/signup">Request early access</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#how">See how it works →</a>
        </Button>
      </div>
    </div>
  )
}

const FAQ = [
  {
    q: 'Does Malaky publish without my approval?',
    a: 'No. Every draft waits in the review queue until a person approves it. Publishing without approval is not a setting you can turn on — it does not exist.',
  },
  {
    q: 'Will Malaky remember my brand and business information?',
    a: 'Yes. Your brand voice, tones and their rules, your schedule and your key dates live in your workspace, and what you approve keeps teaching it.',
  },
  {
    q: 'Can it write Arabic natively?',
    a: 'Arabic is written as Arabic — right-to-left layout, hierarchy and punctuation — not translated from English after the fact.',
  },
  {
    q: 'Can it create content for my personal LinkedIn as well as my company?',
    a: "Yes. Company and personal voices are separate: a founder's post and the company's post can come from the same event, written differently.",
  },
  {
    q: 'Which channels can Malaky publish to today?',
    a: "The channel list is being finalized for launch. Every channel you see in Malaky is either available at launch or clearly labeled as coming soon — we don't sell channels we haven't shipped.",
  },
  {
    q: 'What happens when a channel is not connected?',
    a: 'Your content is still prepared and approved as usual; publishing to that channel simply waits until you connect it. Nothing is lost.',
  },
  {
    q: 'Where does Malaky get factual information about my business?',
    a: 'From you: the business information you provide and the sources you approve. When a factual claim matters, you can check where it came from before approving.',
  },
  {
    q: 'Can my team review and approve content?',
    a: 'Yes. Invite your team and assign roles — nothing publishes without a yes from someone with the right to give it.',
  },
  {
    q: 'Can I edit a draft before publishing?',
    a: 'Always. Edit in place, then approve — or decline and say why, and Malaky remembers the reason.',
  },
  {
    q: 'How is my company data protected?',
    a: 'Your data belongs to your organization. It is never shared between workspaces and never used to train anything for anyone else.',
  },
  {
    q: 'Can I cancel or change plans?',
    a: "Yes, at any time — you keep access until the end of what you've already paid for.",
  },
]

export function MarketingHome() {
  /* Light-canonical (design.md Part 6 rule 8): this route ignores the app
     theme. The preference itself is untouched — the class is restored on
     the way out. */
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
        {/* Flow items 2–7 (§33): hero + the continuous 3D output story. */}
        <OutputStory intro={<HeroIntro />} />

        {/* 8 — Today's workspace (§5). */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="flex max-w-2xl flex-col gap-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Today&apos;s workspace
              </h2>
              <p className="max-w-[56ch] text-muted-foreground">
                Your marketing is ready. Review what needs you, approve what works, and move on
                with your day.
              </p>
            </Reveal>
            <Reveal className="mt-10">
              <WorkspaceSection />
            </Reveal>
          </div>
        </section>

        {/* 9 — How Malaky works (§20). */}
        <HowMalakyWorksSection />

        {/* 5 — Malaky remembers your business (§21). */}
        <MemorySection />

        {/* 6 — Malaky knows what's coming (§26). */}
        <CalendarSection />

        {/* 10 — One idea. Made right for every channel. (§22). */}
        <EveryChannelSection />

        {/* 11 — Your company has a voice. So do the people behind it. (§25). */}
        <TwoVoicesSection />

        {/* 12 — Built here. Written for here. (§24). */}
        <BuiltHereSection />

        {/* 13 — Marketing without made-up facts. (§27). */}
        <FactsSection />

        {/* 15 — FAQ (§29; pricing is omitted by D3). */}
        <section id="faq" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Frequently asked questions
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

        {/* 16 — the one dark moment (§30): quiet charcoal, the Arabic
            identity prominent, the output system's approval moment beside
            it — no product-dashboard imagery. */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <div className="dark grid items-center gap-10 rounded-2xl border border-border bg-card px-8 py-14 text-card-foreground lg:grid-cols-[1fr_18rem] lg:px-12">
              <div className="flex flex-col items-start gap-5">
                <Wordmark tone="white" className="h-20 w-auto" />
                <p className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Tomorrow&apos;s marketing is already waiting.
                </p>
                <p className="max-w-[44ch] text-muted-foreground">
                  Set up your brand once. Malaky starts preparing what comes next.
                </p>
                <Button asChild size="lg">
                  <Link to="/signup">Request early access</Link>
                </Button>
              </div>
              <div aria-hidden inert className="hidden select-none lg:block">
                <ApprovalDemo active={false} />
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Wordmark alt="Malaky" className="h-8 w-auto self-start" />
            <p className="max-w-[36ch] text-sm text-muted-foreground">
              Introduce your business once. Wake up to marketing that&apos;s already done.
            </p>
          </div>
          {[
            {
              heading: 'Product',
              links: [
                ['How Malaky works', '#how'],
                ['FAQ', '#faq'],
              ],
            },
            {
              heading: 'Legal',
              links: [
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
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
