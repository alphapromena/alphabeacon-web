import { Bell, Check, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '../reveal'
import { DEMO_BRANDS } from './demo-brands'
import {
  ArabicSocialCard,
  FacebookCard,
  InstagramCard,
  LinkedInCompanyCard,
  LinkedInExecutiveCard,
  NewsletterCard,
  StatusChip,
} from './post-cards'
import { useCinematicLayer } from './use-media'

/**
 * The lower-page story sections (brief §20–§27; production pass
 * 2026-08-11): product proof between concise copy. How-it-works is one
 * connected journey with a single commanding step; Memory visibly learns
 * from an approval; the calendar section SHOWS the campaign Malaky
 * prepared early. Every timed sequence is gated on the cinematic layer —
 * reduced motion renders the finished state immediately — and all demo
 * content draws from the four demo brands; Malaky chrome stays on
 * Malaky's palette (D5). No brains, no particles, no AI clichés.
 */

function SectionShell({
  id,
  eyebrow,
  headline,
  copy,
  tinted,
  children,
}: {
  id?: string
  eyebrow?: string
  headline: string
  copy: string
  tinted?: boolean
  children?: ReactNode
}) {
  return (
    <section id={id} className={cn('border-t border-border', tinted && 'bg-muted/40')}>
      <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          {eyebrow && (
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">
            {headline}
          </h2>
          <p className="max-w-[56ch] text-muted-foreground">{copy}</p>
        </Reveal>
        {children}
      </div>
    </section>
  )
}

/** Fires once when the node first enters the viewport. */
function useInViewOnce(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver !== 'function') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ------------------------------------------------------------------ §20 */

const STEPS: { short: string; title: string; copy: string; visual: ReactNode }[] = [
  {
    short: 'Introduce',
    title: 'Introduce your business once',
    copy: 'Logo, brand colors, products, audience, goals, tone, approved sources and key dates.',
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {['Logo', 'Colors', 'Products', 'Audience', 'Tone', 'Key dates'].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    ),
  },
  {
    short: 'Learn',
    title: 'Malaky learns your brand',
    copy: 'It builds persistent brand memory from your information, preferences and approvals.',
    visual: (
      <div className="flex flex-col gap-1.5">
        {['Brand voice', 'Preferences', 'Approvals'].map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Check aria-hidden className="size-3 text-success" />
            {chip}
          </span>
        ))}
      </div>
    ),
  },
  {
    short: 'Prepare',
    title: 'Your marketing is prepared',
    copy: 'Posts, campaigns and executive content appear proactively around your schedule and what is coming next.',
    visual: (
      <div className="flex flex-col gap-1.5">
        <StatusChip state="prepared" label="Instagram · Prepared" />
        <StatusChip state="prepared" label="Newsletter · Prepared" />
      </div>
    ),
  },
  {
    short: 'Review',
    title: 'You review and approve',
    copy: 'Edit, approve or decline. Nothing goes out without your sign-off.',
    visual: (
      <div className="flex flex-col gap-1.5">
        <StatusChip state="needsReview" />
        <span className="text-[11px] text-muted-foreground">Approve · Edit · Decline</span>
      </div>
    ),
  },
  {
    short: 'Publish & Learn',
    title: 'Malaky publishes and learns',
    copy: 'Approved work is scheduled to supported channels, and future drafts improve from your decisions.',
    visual: (
      <div className="flex flex-col gap-1.5">
        <StatusChip state="scheduled" label="Scheduled · Thu 09:00" />
        <span className="text-[11px] text-muted-foreground">Memory updated ✓</span>
      </div>
    ),
  },
]

export function HowMalakyWorksSection() {
  const cinematic = useCinematicLayer()
  const { ref, inView } = useInViewOnce()
  const [active, setActive] = useState(0)
  const [engaged, setEngaged] = useState(false)

  /* One step commands attention at a time; the journey walks itself until
     the visitor takes over by picking a step. */
  useEffect(() => {
    if (!cinematic || engaged || !inView) return
    const interval = setInterval(() => setActive((step) => (step + 1) % STEPS.length), 3200)
    return () => clearInterval(interval)
  }, [cinematic, engaged, inView])

  return (
    <SectionShell
      id="how"
      headline="How Malaky works"
      copy="Five steps, one connected system. Introduce your business once; from then on the work is waiting before you ask."
    >
      <div ref={ref} className="mt-10">
        {/* The flow indicator: numbered stations on one line. */}
        <div aria-hidden className="mb-6 hidden items-center gap-0 lg:flex">
          {STEPS.map((step, index) => (
            <div key={step.short} className={cn('flex items-center', index < STEPS.length - 1 && 'flex-1')}>
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                  'motion-safe:transition-colors motion-safe:duration-500',
                  index <= active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
              {index < STEPS.length - 1 && (
                <span className="relative mx-2 h-px flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className={cn(
                      'absolute inset-0 origin-left bg-foreground',
                      'motion-safe:transition-transform motion-safe:duration-700',
                      index < active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const isActive = index === active
            return (
              <button
                key={step.title}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setEngaged(true)
                  setActive(index)
                }}
                className={cn(
                  'flex flex-col gap-3 rounded-[1.25rem] border p-5 text-left',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  'motion-safe:transition-all motion-safe:duration-500',
                  isActive
                    ? 'border-foreground/20 bg-card shadow-[var(--shadow-soft-lg)] lg:scale-[1.03]'
                    : 'border-border bg-muted/40 shadow-xs',
                )}
              >
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, '0')} · {step.short}
                </span>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs/relaxed text-muted-foreground">{step.copy}</p>
                <div
                  aria-hidden
                  inert
                  className={cn(
                    'mt-auto select-none',
                    'motion-safe:transition-opacity motion-safe:duration-500',
                    isActive ? 'opacity-100' : 'opacity-0 lg:opacity-100',
                  )}
                >
                  {step.visual}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §22 */

const FALAK = DEMO_BRANDS.falak

export function EveryChannelSection() {
  return (
    <SectionShell
      tinted
      headline="One idea. Made right for every channel."
      copy="Malaky keeps the same brand and message, then adapts the format, length and creative for each channel. One launch, six shapes — none of them copy-pasted."
    >
      <div className="mt-10 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Reveal>
          <InstagramCard
            brand={FALAK}
            visualTitle="Same day. Both ways."
            caption="Riyadh ⇄ Jeddah goes same-day on Monday. Noon cutoff, evening delivery."
          />
        </Reveal>
        <Reveal>
          <LinkedInCompanyCard brand={FALAK} state="prepared" />
        </Reveal>
        <Reveal>
          <LinkedInExecutiveCard
            brand={FALAK}
            copy="We didn't add a same-day lane because it's fashionable. We added it because 40% of our support tickets asked one question: can it arrive today? From Monday, the answer is yes."
          />
        </Reveal>
        <Reveal>
          <FacebookCard
            brand={FALAK}
            copy="Ordering from Jeddah? From Monday, anything you order from Riyadh before noon is at your door the same evening."
            banner="Same-day · Riyadh ⇄ Jeddah"
          />
        </Reveal>
        <Reveal>
          <ArabicSocialCard
            brand={FALAK}
            headlineAr="يوم واحد. في الاتجاهين."
            bodyAr="خط الشحن السريع بين الرياض وجدة يبدأ يوم الإثنين — اطلبوا قبل الظهر، ويصل في المساء."
            ctaAr="اعرفوا المزيد"
          />
        </Reveal>
        <Reveal>
          <NewsletterCard brand={FALAK} state="prepared" />
        </Reveal>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §25 */

export function TwoVoicesSection() {
  return (
    <SectionShell
      headline="Your company has a voice. So do the people behind it."
      copy="Malaky can prepare company content and personal LinkedIn content for founders, executives and sales leaders — each with its own voice and goals. The same launch, told two ways."
    >
      <div className="mt-10 grid items-start gap-4 sm:grid-cols-2 lg:max-w-3xl">
        <Reveal>
          <LinkedInCompanyCard brand={FALAK} state="prepared" />
        </Reveal>
        <Reveal>
          <LinkedInExecutiveCard
            brand={FALAK}
            copy="We didn't add a same-day lane because it's fashionable. We added it because 40% of our support tickets asked one question: can it arrive today? From Monday, the answer is yes."
          />
        </Reveal>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §21 */

const MEMORY_ROWS: { item: string; tag: 'learned' | 'remembered' | 'tracked' }[] = [
  { item: 'Brand voice', tag: 'learned' },
  { item: 'Products & services', tag: 'remembered' },
  { item: 'Audience', tag: 'remembered' },
  { item: 'Approved facts & sources', tag: 'remembered' },
  { item: 'Content preferences', tag: 'learned' },
  { item: 'Past approvals', tag: 'learned' },
  { item: 'Upcoming campaigns & dates', tag: 'tracked' },
]

const MEMORY_TAG_TONE = {
  learned: 'bg-primary/10 text-primary',
  remembered: 'bg-muted text-muted-foreground',
  tracked: 'bg-success/10 text-success',
}

export function MemorySection() {
  const cinematic = useCinematicLayer()
  const { ref, inView } = useInViewOnce()
  /* The living event (§21): 0 idle → 1 approval notification → 2 the
     Past approvals row absorbs it → 3 memory confirmed. Reduced motion
     renders the finished state (3) immediately. */
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (!cinematic) {
      setStep(3)
      return
    }
    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [cinematic, inView])

  return (
    <SectionShell
      tinted
      headline="Malaky remembers your business."
      copy="Teach Malaky once. Your brand voice, products, audience, offers, approved facts, preferences and past decisions become the starting point for every future draft — persistent business intelligence, not a settings form."
    >
      <div ref={ref} className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        <Reveal className="flex flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-xs">
          <ul className="flex flex-col divide-y divide-border">
            {MEMORY_ROWS.map((row) => {
              const highlighted = row.item === 'Past approvals' && step >= 2
              return (
                <li
                  key={row.item}
                  className={cn(
                    'flex items-center justify-between gap-3 px-5 py-3',
                    'motion-safe:transition-colors motion-safe:duration-500',
                    highlighted && 'bg-accent',
                  )}
                >
                  <span className={cn('text-sm', highlighted && 'font-medium')}>{row.item}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      'motion-safe:transition-colors motion-safe:duration-500',
                      highlighted ? 'bg-success/10 text-success' : MEMORY_TAG_TONE[row.tag],
                    )}
                  >
                    {highlighted ? 'learned ✓' : row.tag}
                  </span>
                </li>
              )
            })}
          </ul>
        </Reveal>

        <div className="flex flex-col gap-4">
          {/* The event feed: an approval arrives, memory absorbs it. */}
          <div aria-live="polite" className="flex min-h-24 flex-col gap-2">
            <div
              className={cn(
                'flex items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5 shadow-xs',
                'motion-safe:transition-all motion-safe:duration-500',
                step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
              )}
            >
              <Bell aria-hidden className="size-3.5 text-muted-foreground" />
              <span className="text-sm">CEO LinkedIn post approved</span>
              <Check aria-hidden className="size-3.5 text-success" />
            </div>
            <p
              className={cn(
                'text-sm font-medium text-success',
                'motion-safe:transition-opacity motion-safe:duration-500',
                step >= 3 ? 'opacity-100' : 'opacity-0',
              )}
            >
              Memory updated ✓
            </p>
          </div>

          <Reveal className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="max-w-[46ch]">
              Every approval teaches it something. Approve a launch-morning announcement and the
              next launch starts with one — that is the{' '}
              <span className="font-medium text-foreground">memory updated from your approval</span>{' '}
              moment you saw above.
            </p>
            <p className="max-w-[46ch]">Decline with a reason, and the reason is remembered too.</p>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §26 */

const OCCASIONS = [
  { label: 'Ramadan', state: 'past' },
  { label: 'Eid al-Fitr', state: 'past' },
  { label: 'Saudi National Day', state: 'next' },
  { label: 'UAE National Day', state: 'future' },
] as const

const NURA = DEMO_BRANDS.nura

export function CalendarSection() {
  const cinematic = useCinematicLayer()
  const { ref, inView } = useInViewOnce()
  /* 0 idle → 1 timeline draws → 2 National Day activates → 3 the prepared
     campaign appears. Reduced motion renders the proof immediately. */
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (!cinematic) {
      setStep(3)
      return
    }
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2300),
    ]
    return () => timers.forEach(clearTimeout)
  }, [cinematic, inView])

  return (
    <SectionShell
      headline="Malaky knows what's coming."
      copy="Important dates should not depend on someone remembering to prompt an AI tool. Malaky tracks your calendar — the region's occasions and your own key dates — and prepares relevant campaigns before the opportunity arrives."
    >
      <div ref={ref}>
        <Reveal className="mt-10 rounded-[1.25rem] border border-border bg-card p-6 shadow-xs">
          {/* The timeline draws in, then the next occasion takes focus. */}
          <div aria-hidden className="flex items-center gap-2">
            {OCCASIONS.map((occasion, index) => (
              <div key={occasion.label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    'motion-safe:transition-all motion-safe:duration-500',
                    step >= 1 ? 'opacity-100' : 'opacity-0',
                    occasion.state === 'next' && step >= 2 ? 'scale-125 bg-brand' : 'bg-border',
                  )}
                  style={{ transitionDelay: cinematic ? `${index * 140}ms` : undefined }}
                />
                {index < OCCASIONS.length - 1 && (
                  <span className="h-px flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className={cn(
                        'block h-full origin-left bg-foreground/25',
                        'motion-safe:transition-transform motion-safe:duration-700',
                        step >= 1 ? 'scale-x-100' : 'scale-x-0',
                      )}
                      style={{ transitionDelay: cinematic ? `${index * 140}ms` : undefined }}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {OCCASIONS.map((occasion) => (
              <span
                key={occasion.label}
                className={cn(
                  'motion-safe:transition-colors motion-safe:duration-500',
                  occasion.state === 'next' && step >= 2 && 'font-medium text-foreground',
                )}
              >
                {occasion.label}
                {occasion.state === 'next' && step >= 2 && (
                  <span className="ml-1.5 text-muted-foreground">· 12 days away</span>
                )}
              </span>
            ))}
          </div>

          {/* The proof: not "a campaign was prepared" — the campaign. */}
          <div
            aria-live="polite"
            className={cn(
              'mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background px-4 py-3',
              'motion-safe:transition-all motion-safe:duration-500',
              step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            )}
          >
            {step >= 3 && (
              <>
                {/* The campaign thumbnail — Nura's own colors, no new assets. */}
                <span
                  aria-hidden
                  className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg"
                  style={{
                    background: `linear-gradient(160deg, ${NURA.palette.surface} 0%, ${NURA.palette.accent} 150%)`,
                  }}
                >
                  <span
                    className="absolute bottom-0 left-1/2 h-2/3 w-1/2 -translate-x-1/2 rounded-t-full"
                    style={{ background: NURA.palette.primary }}
                  />
                  <span
                    className="absolute inset-x-0 bottom-1 text-center text-[7px] font-semibold tracking-wide text-white uppercase"
                  >
                    National Day
                  </span>
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-medium">
                    Nura Living — National Day collection teaser
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusChip state="needsReview" label="Ready for review" />
                    <span className="text-xs text-success">Prepared 12 days early ✓</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §24 */

const PROOF_BLOCKS = [
  {
    title: 'Arabic, natively',
    copy: 'Arabic copy and layouts created as Arabic — right-to-left hierarchy, punctuation and rhythm — not translated after the fact.',
  },
  {
    title: "Your country's calendar",
    copy: 'Ramadan, Eid al-Fitr, Eid al-Adha, Saudi National Day, UAE National Day, Jordan Independence Day — and the dates only your business knows.',
  },
  {
    title: 'Local timing & context',
    copy: 'Content prepared around your market, your timezone, and when your customers are actually awake.',
  },
]

export function BuiltHereSection() {
  return (
    <SectionShell
      tinted
      headline="Built here. Written for here."
      copy="Malaky understands the language, business rhythm and calendar of the region — from native Arabic and RTL creative to the occasions that shape what your customers care about."
    >
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {PROOF_BLOCKS.map((block) => (
          <Reveal
            key={block.title}
            className="flex flex-col gap-2 rounded-[1.25rem] border border-border bg-card p-5 shadow-xs"
          >
            <h3 className="text-sm font-semibold">{block.title}</h3>
            <p className="text-xs/relaxed text-muted-foreground">{block.copy}</p>
          </Reveal>
        ))}
      </div>

      {/* The split screen: one campaign, two first languages. */}
      <Reveal className="mt-6 grid overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-xs sm:grid-cols-2">
        <div className="flex flex-col gap-2 p-6">
          <p className="text-xs text-muted-foreground">Bayt Zaytoun · Eid campaign</p>
          <p className="font-display text-xl font-semibold">Eid, at one table.</p>
          <p className="text-sm text-muted-foreground">
            Celebrate Eid al-Fitr with the whole family — seatings from 1 pm.
          </p>
          <span className="mt-2 self-start rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
            Book for Eid
          </span>
        </div>
        <div dir="rtl" lang="ar" className="flex flex-col gap-2 border-t border-border p-6 text-right sm:border-t-0 sm:border-r">
          <p className="text-xs text-muted-foreground">بيت زيتون · حملة العيد</p>
          <p className="font-display text-xl font-semibold">العيد على طاولة واحدة.</p>
          <p className="text-sm text-muted-foreground">
            احتفلوا بعيد الفطر مع كامل العائلة — الحجوزات تبدأ من الساعة الواحدة ظهرًا.
          </p>
          <span className="mt-2 self-start rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
            احجزوا للعيد
          </span>
        </div>
      </Reveal>
      <p className="mt-3 text-xs text-muted-foreground">
        Written as Arabic — not translated after the fact.
      </p>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ §27 */

export function FactsSection() {
  return (
    <SectionShell
      headline="Marketing without made-up facts."
      copy="Malaky creates from the business information and sources you trust. When a factual claim matters, you can see where it came from before you approve it."
    >
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[20rem_1fr]">
        <Reveal>
          <LinkedInCompanyCard brand={FALAK} state="needsReview" stateLabel="Ready for review" />
        </Reveal>
        <Reveal className="max-w-md">
          <details
            open
            className="rounded-[1.25rem] border border-border bg-card p-5 shadow-xs"
          >
            <summary className="cursor-pointer text-sm font-medium">
              Sources for this post
            </summary>
            <ul className="mt-3 flex flex-col gap-2.5">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
                <span>
                  <span className="font-medium text-foreground">falak.example/operations</span> —
                  lane schedule and the noon cutoff
                </span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
                <span>
                  <span className="font-medium text-foreground">Approved business facts</span> —
                  the same-day delivery promise, approved by you
                </span>
              </li>
            </ul>
          </details>
        </Reveal>
      </div>
    </SectionShell>
  )
}
