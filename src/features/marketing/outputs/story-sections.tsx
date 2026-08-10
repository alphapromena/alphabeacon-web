import { Check, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
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

/**
 * The lower-page story sections (brief §20–§27): product proof between
 * concise copy, alternating so no two text-only sections touch (§31). All
 * demo content draws from the four demo brands; Malaky chrome stays on
 * Malaky's palette (D5).
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

/* ------------------------------------------------------------------ §20 */

const STEPS: { title: string; copy: string; visual: ReactNode }[] = [
  {
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
  return (
    <SectionShell
      id="how"
      headline="How Malaky works"
      copy="Five steps, one morning ritual. Introduce your business once; from then on the work is waiting before you ask."
    >
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <Reveal
            key={step.title}
            className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-5 shadow-xs"
          >
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-semibold">{step.title}</h3>
            <p className="text-xs/relaxed text-muted-foreground">{step.copy}</p>
            <div aria-hidden inert className="mt-auto select-none">
              {step.visual}
            </div>
          </Reveal>
        ))}
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
  return (
    <SectionShell
      tinted
      headline="Malaky remembers your business."
      copy="Teach Malaky once. Your brand voice, products, audience, offers, approved facts, preferences and past decisions become the starting point for every future draft — persistent business intelligence, not a settings form."
    >
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        <Reveal className="flex flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-xs">
          <ul className="flex flex-col divide-y divide-border">
            {MEMORY_ROWS.map((row) => (
              <li key={row.item} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm">{row.item}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    MEMORY_TAG_TONE[row.tag],
                  )}
                >
                  {row.tag}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p className="max-w-[46ch]">
            Every approval teaches it something. Approve a launch-morning announcement and the
            next launch starts with one — that is the{' '}
            <span className="font-medium text-foreground">memory updated from your approval</span>{' '}
            moment you saw above.
          </p>
          <p className="max-w-[46ch]">
            Decline with a reason, and the reason is remembered too.
          </p>
        </Reveal>
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

export function CalendarSection() {
  return (
    <SectionShell
      headline="Malaky knows what's coming."
      copy="Important dates should not depend on someone remembering to prompt an AI tool. Malaky tracks your calendar — the region's occasions and your own key dates — and prepares relevant campaigns before the opportunity arrives."
    >
      <Reveal className="mt-10 rounded-[1.25rem] border border-border bg-card p-6 shadow-xs">
        <div aria-hidden className="flex items-center gap-2">
          {OCCASIONS.map((occasion, index) => (
            <div key={occasion.label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  occasion.state === 'next' ? 'bg-brand' : 'bg-border',
                )}
              />
              {index < OCCASIONS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {OCCASIONS.map((occasion) => (
            <span
              key={occasion.label}
              className={cn(occasion.state === 'next' && 'font-medium text-foreground')}
            >
              {occasion.label}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <StatusChip state="prepared" />
          <span className="text-sm">
            Nura Living — National Day collection teaser
          </span>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            Ready 12 days before the date
          </span>
        </div>
      </Reveal>
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
