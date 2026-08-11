import {
  AtSign,
  Award,
  BarChart2,
  Bookmark,
  Briefcase,
  CalendarClock,
  Camera,
  Check,
  CircleAlert,
  Globe,
  Heart,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Sparkles,
  ThumbsUp,
  Truck,
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PLATFORM, type DemoBrand } from './demo-brands'
import { BrandLogo } from './brand-logos'
import { photoFor } from './campaign-photos'
import { ContentAsset } from './content-asset'

/**
 * Mock marketing outputs (brief §3, §31; full-fidelity pass 2026-08-11):
 * three distinct layers, kept distinct on purpose —
 *
 *   1. MALAKY owns the wrapper: radius, warm border, soft shadow, the tiny
 *      channel label and the workflow chip, always OUTSIDE the platform's
 *      own anatomy.
 *   2. The PLATFORM owns the interior interface: Instagram's header /
 *      4:5 creative / actions / likes / caption / comments / timestamp,
 *      LinkedIn's page-vs-person headers, reaction clusters and action
 *      row, an email's From/Subject/To chrome, X's handle-and-counts row.
 *      Platform identity comes from layout, glyphs and interface hues
 *      (PLATFORM in demo-brands) — never imported logo assets (D6).
 *   3. The CUSTOMER owns the content: each brand's own logo mark
 *      (brand-logos.tsx) and palette (D5, demo-brands only) carry the
 *      creative, so the hero reads as many brands inside one system.
 *
 * Engagement numbers are DEMO DATA by founder directive (2026-08-11,
 * decisions.md) — invented brands, invented numbers, presented as the
 * preview a real feed would show. Interiors stay `aria-hidden` where they
 * are illustration; nothing promises a click it cannot honour.
 */

export type WorkflowState =
  | 'prepared'
  | 'needsReview'
  | 'approved'
  | 'scheduled'
  | 'published'

const STATUS: Record<WorkflowState, { label: string; icon: typeof Check; tone: string }> = {
  prepared: { label: 'Prepared', icon: Sparkles, tone: 'bg-muted text-muted-foreground' },
  needsReview: { label: 'Needs review', icon: CircleAlert, tone: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', icon: Check, tone: 'bg-success/10 text-success' },
  scheduled: { label: 'Scheduled', icon: CalendarClock, tone: 'bg-primary/10 text-primary' },
  published: { label: 'Published', icon: Send, tone: 'bg-success/10 text-success' },
}

/** Status is words and an icon, never color alone (design law). */
export function StatusChip({
  state,
  label,
  className,
}: {
  state: WorkflowState
  /** Override for richer strings, e.g. "Scheduled · 18:00". */
  label?: string
  className?: string
}) {
  const status = STATUS[state]
  const Icon = status.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        'motion-safe:transition-colors',
        status.tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3" />
      {label ?? status.label}
    </span>
  )
}

/** Subtle channel identity: a glyph from the repo's icon set + a text label (D6). */
export function ChannelLabel({
  channel,
  comingSoon,
}: {
  channel: 'instagram' | 'linkedin-company' | 'linkedin-executive' | 'facebook' | 'x' | 'newsletter' | 'arabic'
  comingSoon?: boolean
}) {
  // Neutral glyphs, matching features/connections/platforms.ts: lucide has
  // no brand marks, and D6 bans importing third-party logo assets — the
  // channel NAME is the identity.
  const meta = {
    instagram: { icon: Camera, label: 'Instagram' },
    'linkedin-company': { icon: Briefcase, label: 'LinkedIn · Company' },
    'linkedin-executive': { icon: Briefcase, label: 'LinkedIn · Executive' },
    facebook: { icon: Users, label: 'Facebook' },
    x: { icon: AtSign, label: 'X' },
    newsletter: { icon: Mail, label: 'Newsletter' },
    arabic: { icon: Camera, label: 'Arabic social' },
  }[channel]
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon aria-hidden className="size-3.5" />
      {meta.label}
      {comingSoon && (
        <span className="rounded-full border border-border px-1.5 py-px text-[10px] uppercase tracking-wide">
          Coming soon
        </span>
      )}
    </span>
  )
}

function brandVars(brand: DemoBrand): CSSProperties {
  return {
    '--db-primary': brand.palette.primary,
    '--db-accent': brand.palette.accent,
    '--db-surface': brand.palette.surface,
    '--db-ink': brand.palette.ink,
  } as CSSProperties
}

/** e.g. "Falak Logistics" → "@FalakLogistics" — a handle, not a real account. */
function handleFor(brand: DemoBrand): string {
  return '@' + brand.name.replace(/[^A-Za-z0-9]/g, '')
}

function CardShell({
  brand,
  channel,
  comingSoon,
  state,
  stateLabel,
  children,
  className,
}: {
  brand: DemoBrand
  channel: Parameters<typeof ChannelLabel>[0]['channel']
  comingSoon?: boolean
  state: WorkflowState
  stateLabel?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article
      style={brandVars(brand)}
      className={cn(
        'flex w-full flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-4',
        'shadow-[var(--shadow-soft-lg)]',
        className,
      )}
    >
      {/* The Malaky wrapper chrome (§7): channel + workflow state live on
          the outer edge, never inside the platform's own anatomy. */}
      <div className="flex items-center justify-between gap-2">
        <ChannelLabel channel={channel} comingSoon={comingSoon} />
        <StatusChip state={state} label={stateLabel} />
      </div>
      {children}
    </article>
  )
}

function BrandHeader({ brand, person }: { brand: DemoBrand; person?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {person ? (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.person.initials}
        </span>
      ) : (
        <BrandLogo brand={brand} />
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium">{person ? brand.person.name : brand.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {person ? brand.person.role : brand.sector}
        </p>
      </div>
    </div>
  )
}

/** LinkedIn's reaction cluster — the three overlapped hue dots every feed
 * shows, then the count. Demo data. */
function ReactionCluster({ count }: { count: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex -space-x-1">
        <span
          className="grid size-4 place-items-center rounded-full ring-1 ring-card"
          style={{ background: PLATFORM.linkedin.like }}
        >
          <ThumbsUp className="size-2.5 text-white" />
        </span>
        <span
          className="grid size-4 place-items-center rounded-full ring-1 ring-card"
          style={{ background: PLATFORM.linkedin.love }}
        >
          <Heart className="size-2.5 text-white" />
        </span>
        <span
          className="grid size-4 place-items-center rounded-full ring-1 ring-card"
          style={{ background: PLATFORM.linkedin.celebrate }}
        >
          <Award className="size-2.5 text-white" />
        </span>
      </span>
      <span className="text-[11px] text-muted-foreground">{count}</span>
    </span>
  )
}

/** LinkedIn's action row — Like · Comment · Repost · Send. */
function LinkedInActions() {
  const actions: { icon: typeof ThumbsUp; label: string }[] = [
    { icon: ThumbsUp, label: 'Like' },
    { icon: MessageCircle, label: 'Comment' },
    { icon: Repeat2, label: 'Repost' },
    { icon: Send, label: 'Send' },
  ]
  return (
    <div className="flex items-center justify-between border-t border-border pt-2 text-muted-foreground">
      {actions.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1 text-[11px] font-medium">
          <Icon className="size-3.5" />
          {label}
        </span>
      ))}
    </div>
  )
}

/** Instagram — a real feed post: header, 4:5 creative, actions, likes,
 * caption, comments, timestamp (Nura by default). */
export function InstagramCard({
  brand,
  state = 'prepared',
  stateLabel,
  visualTitle = 'The Summer Collection',
  caption = 'Linen, clay, and light. The summer collection arrives Thursday — made to be lived in.',
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  visualTitle?: string
  caption?: string
  /** Campaign photography behind the type lockup; omit for the pure
   * palette creative. */
  photo?: string
  className?: string
}) {
  const handle = handleFor(brand).slice(1).toLowerCase()
  return (
    <CardShell brand={brand} channel="instagram" state={state} stateLabel={stateLabel} className={className}>
      <div aria-hidden className="flex flex-col gap-2.5 select-none">
        {/* Feed header. */}
        <div className="flex items-center gap-2.5">
          <BrandLogo brand={brand} round className="size-8" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{handle}</p>
            <p className="truncate text-[10px] text-muted-foreground">{brand.sector}</p>
          </div>
          <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* The 4:5 campaign creative. `photo` layers real campaign
            photography UNDER the type lockup (founder-approved pass,
            2026-08-11) — the headline stays live HTML so it renders
            crisp at every size and stays translatable. Without a photo
            the palette lockup below is the creative, unchanged. */}
        <div
          className="relative -mx-1 aspect-[4/5] overflow-hidden rounded-lg"
          style={{
            background:
              'linear-gradient(160deg, var(--db-surface) 0%, var(--db-surface) 55%, var(--db-accent) 140%)',
          }}
        >
          {(photo ?? photoFor(brand)) ? (
            <>
              <ContentAsset
                asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '4 / 5' }}
                className="absolute inset-0 size-full"
              />
              {/* The scrim is what keeps the overlaid type legible. */}
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, color-mix(in oklab, var(--db-ink) 82%, transparent) 0%, transparent 55%)',
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute bottom-0 left-1/2 h-[68%] w-[54%] -translate-x-1/2 rounded-t-full"
                style={{ background: 'var(--db-primary)' }}
              />
              <div
                className="absolute top-[8%] right-[10%] size-12 rounded-full"
                style={{ background: 'var(--db-accent)' }}
              />
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-4">
            <p className="text-[9px] font-semibold tracking-[0.22em] text-white/80 uppercase">
              {brand.name}
            </p>
            <p className="px-3 text-center font-display text-base font-semibold text-white">
              {visualTitle}
            </p>
            <span
              className="mt-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: 'var(--db-surface)', color: 'var(--db-ink)' }}
            >
              Arrives Thursday
            </span>
          </div>
        </div>

        {/* Actions, likes, caption, comments, time. */}
        <div className="flex items-center gap-3.5">
          <Heart className="size-[1.15rem]" style={{ color: PLATFORM.instagram.heart }} fill={PLATFORM.instagram.heart} />
          <MessageCircle className="size-[1.15rem] text-foreground" />
          <Send className="size-[1.15rem] text-foreground" />
          <Bookmark className="ml-auto size-[1.15rem] text-foreground" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold">1,248 likes</p>
          <p className="text-xs/relaxed">
            <span className="font-semibold">{handle}</span> {caption}{' '}
            <span className="text-muted-foreground">more</span>
          </p>
          <p className="text-[11px] text-muted-foreground">View all 32 comments</p>
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">2 hours ago</p>
        </div>
      </div>
    </CardShell>
  )
}

/** LinkedIn Company — a company-page post with the branded launch creative
 * (Falak by default). */
export function LinkedInCompanyCard({
  brand,
  state = 'needsReview',
  stateLabel,
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="linkedin-company" state={state} stateLabel={stateLabel} className={className}>
      <div aria-hidden className="flex flex-col gap-2.5 select-none">
        {/* Page header. */}
        <div className="flex items-start gap-2.5">
          <BrandLogo brand={brand} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{brand.followers}</p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              2h · <Globe className="size-2.5" />
            </p>
          </div>
          <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        <p className="text-xs/relaxed">
          Same-day, both ways. Our Riyadh ⇄ Jeddah lane opens Monday — cutoff at noon, delivered
          before your customers finish dinner.{' '}
          <span className="text-muted-foreground">…see more</span>
        </p>

        {/* The launch creative: the customer's navy + orange, full bleed,
            over the fleet photography when one is supplied. */}
        <div
          className="relative -mx-1 flex flex-col gap-2 overflow-hidden rounded-lg p-4"
          style={{ background: 'var(--db-primary)' }}
        >
          {(photo ?? photoFor(brand)) && (
            <>
              <ContentAsset
                asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '16 / 9' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, var(--db-primary) 8%, color-mix(in oklab, var(--db-primary) 55%, transparent) 62%, transparent 100%)',
                }}
              />
            </>
          )}
          <p className="relative font-display text-lg/tight font-semibold text-white">
            SAME-DAY.
            <br />
            <span style={{ color: 'var(--db-accent)' }}>BOTH WAYS.</span>
          </p>
          <div className="relative flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white">RUH</span>
            <span
              className="h-0.5 flex-1 rounded-full"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--db-accent) 0 8px, transparent 8px 14px)',
              }}
            />
            <Truck className="size-4" style={{ color: 'var(--db-accent)' }} />
            <span
              className="h-0.5 flex-1 rounded-full"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--db-accent) 0 8px, transparent 8px 14px)',
              }}
            />
            <span className="text-[11px] font-semibold text-white">JED</span>
          </div>
          <p className="relative text-[10px] text-white/75">Riyadh ⇄ Jeddah · from Monday</p>
        </div>

        {/* Social proof + the action row. */}
        <div className="flex items-center justify-between">
          <ReactionCluster count="142" />
          <span className="text-[11px] text-muted-foreground">18 comments · 7 reposts</span>
        </div>
        <LinkedInActions />
      </div>
    </CardShell>
  )
}

/** LinkedIn Executive — a person's text-first post: Malaky writes for
 * PEOPLE, not just company pages (Meezan's managing partner by default). */
export function LinkedInExecutiveCard({
  brand,
  state = 'prepared',
  stateLabel,
  copy = "Most VAT penalties I see aren't about money — they're about calendars. The filings that go wrong are the ones nobody owned until the last week. Q3 closes soon: decide today who owns yours.",
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  copy?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="linkedin-executive" state={state} stateLabel={stateLabel} className={className}>
      <div aria-hidden className="flex flex-col gap-2.5 select-none">
        {/* Person header — clearly a human, not a page. */}
        <div className="flex items-start gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white ring-2 ring-card"
            style={{
              background:
                'linear-gradient(145deg, var(--db-primary) 20%, var(--db-ink) 100%)',
            }}
          >
            {brand.person.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand.person.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{brand.person.role}</p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              2h · <Globe className="size-2.5" />
            </p>
          </div>
          <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        <p className="text-xs/relaxed">
          {copy} <span className="text-muted-foreground">…see more</span>
        </p>

        <div className="flex items-center justify-between">
          <ReactionCluster count="98" />
          <span className="text-[11px] text-muted-foreground">12 comments</span>
        </div>
        <LinkedInActions />
      </div>
    </CardShell>
  )
}

/** Arabic social — a real Arabic feed post, RTL from the first pixel
 * (Zaytoun by default): header, Ramadan creative, actions, engagement,
 * caption, all native. */
export function ArabicSocialCard({
  brand,
  state = 'prepared',
  stateLabel,
  headlineAr = 'رمضان يجمعنا',
  bodyAr = 'قائمة إفطار عائلية جديدة — من قلب المطبخ الشامي. احجزوا طاولتكم قبل المغرب، ونحن نهتم بالباقي.',
  ctaAr = 'احجز الآن',
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  headlineAr?: string
  bodyAr?: string
  ctaAr?: string
  photo?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="arabic" state={state} stateLabel={stateLabel} className={className}>
      {/* The interior is a real RTL document: direction, alignment and
          punctuation are Arabic-first, not a mirrored English layout. */}
      <div dir="rtl" lang="ar" aria-hidden className="flex flex-col gap-2.5 text-right select-none">
        <div className="flex items-center gap-2.5">
          <BrandLogo brand={brand} round className="size-8" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold" style={{ color: 'var(--db-ink)' }}>
              {brand.nameAr}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{brand.sectorAr}</p>
          </div>
          <MoreHorizontal className="mr-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* The Ramadan creative — the brand's deep olive + warm red, over
            the iftar table when a photo is supplied. Arabic type stays
            live HTML so it renders and shapes natively. */}
        <div
          className="relative -mx-1 flex flex-col items-center gap-1.5 overflow-hidden rounded-lg px-3 py-5"
          style={{
            background:
              'linear-gradient(200deg, var(--db-primary) 0%, var(--db-ink) 130%)',
          }}
        >
          {(photo ?? photoFor(brand)) && (
            <>
              <ContentAsset
                asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '3 / 2' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(200deg, color-mix(in oklab, var(--db-ink) 72%, transparent) 0%, color-mix(in oklab, var(--db-ink) 55%, transparent) 100%)',
                }}
              />
            </>
          )}
          <p className="relative text-[9px] font-semibold tracking-widest text-white/75">
            {brand.nameAr}
          </p>
          <p className="relative font-display text-xl font-semibold text-white">{headlineAr}</p>
          <span
            className="relative mt-1 rounded-full px-3 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: 'var(--db-accent)' }}
          >
            قائمة الإفطار العائلية
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-foreground">
          <Heart
            className="size-[1.15rem]"
            style={{ color: PLATFORM.instagram.heart }}
            fill={PLATFORM.instagram.heart}
          />
          <MessageCircle className="size-[1.15rem]" />
          <Send className="size-[1.15rem]" />
          <Bookmark className="mr-auto size-[1.15rem]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold">١٦٦ إعجابًا</p>
          <p className="text-xs/relaxed">{bodyAr}</p>
          <p className="text-[11px] text-muted-foreground">عرض التعليقات الـ٢٤ جميعها</p>
        </div>
        <span
          className="self-start rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          {ctaAr}
        </span>
      </div>
    </CardShell>
  )
}

/** Newsletter — an email preview, unmistakably not social: envelope
 * chrome, then the branded email itself (Falak by default). */
export function NewsletterCard({
  brand,
  state = 'approved',
  stateLabel,
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="newsletter" state={state} stateLabel={stateLabel} className={className}>
      <div aria-hidden className="overflow-hidden rounded-xl border border-border select-none">
        {/* Envelope chrome: From / To / Subject. */}
        <div className="flex flex-col gap-0.5 border-b border-border bg-background px-4 py-2">
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">From:</span> {brand.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">To:</span> Falak customers
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Subject:</span> Same-day delivery is
            here.
          </p>
        </div>
        {/* The email itself: brand masthead, hero creative, body, CTA. */}
        <div className="flex items-center gap-2 bg-background px-4 py-2">
          <BrandLogo brand={brand} className="size-5" />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--db-ink)' }}>
            {brand.name}
          </span>
        </div>
        <div
          className="relative flex flex-col gap-1.5 px-4 py-4"
          style={{ background: 'var(--db-primary)' }}
        >
          {(photo ?? photoFor(brand)) && (
            <>
              <ContentAsset
                asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '16 / 9' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(95deg, var(--db-primary) 12%, color-mix(in oklab, var(--db-primary) 50%, transparent) 70%, transparent 100%)',
                }}
              />
            </>
          )}
          <p className="relative font-display text-base/tight font-semibold text-white">
            Same-day delivery is here.
          </p>
          <div className="relative flex items-center gap-2">
            <span className="text-[10px] font-semibold text-white">RUH</span>
            <span
              className="h-0.5 w-14 rounded-full"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--db-accent) 0 6px, transparent 6px 11px)',
              }}
            />
            <Truck className="size-3.5" style={{ color: 'var(--db-accent)' }} />
            <span className="text-[10px] font-semibold text-white">JED</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 bg-background px-4 py-3">
          <p className="text-xs/relaxed text-muted-foreground">
            From Monday, orders placed before noon arrive the same evening — Riyadh to Jeddah
            and back.
          </p>
          <span
            className="mt-1 self-start rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: 'var(--db-accent)' }}
          >
            See how it changes your delivery promise
          </span>
        </div>
      </div>
    </CardShell>
  )
}

/** Facebook — localized, customer-facing (Zaytoun by default). */
export function FacebookCard({
  brand,
  state = 'prepared',
  stateLabel,
  copy = "Iftar with the whole family, without the wait. Our Ramadan family set serves six — book a table before maghrib and it's on the table when you arrive.",
  banner = 'Family iftar · serves 6',
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  copy?: string
  banner?: string
  photo?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="facebook" state={state} stateLabel={stateLabel} className={className}>
      <BrandHeader brand={brand} />
      <p className="text-xs/relaxed">{copy}</p>
      <div aria-hidden className="relative overflow-hidden rounded-xl">
        {(photo ?? photoFor(brand)) ? (
          <>
            <ContentAsset
              asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '3 / 2' }}
              className="w-full"
            />
            <span
              className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-semibold text-white"
              style={{
                background:
                  'linear-gradient(to top, color-mix(in oklab, var(--db-ink) 85%, transparent), transparent)',
              }}
            >
              {banner}
            </span>
          </>
        ) : (
          <div
            className="flex h-10 items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--db-surface)', color: 'var(--db-primary)' }}
          >
            {banner}
          </div>
        )}
      </div>
    </CardShell>
  )
}

/** X — a text-first post with the counts row; publishing is roadmap, and
 * the Malaky label says so (§34). */
export function XCard({
  brand,
  state = 'prepared',
  stateLabel,
  photo,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  className?: string
}) {
  return (
    <CardShell
      brand={brand}
      channel="x"
      comingSoon
      state={state}
      stateLabel={stateLabel}
      className={className}
    >
      <div aria-hidden className="flex flex-col gap-2 select-none">
        <div className="flex items-start gap-2.5">
          <BrandLogo brand={brand} round className="size-8" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{brand.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{handleFor(brand)} · 2h</p>
          </div>
          <MoreHorizontal className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-xs/relaxed">
          Noon cutoff, evening delivery. Riyadh ⇄ Jeddah goes same-day on Monday.
        </p>
        {/* X's media card: rounded, bordered, 16:9 — the shape a post with
            an attached image actually takes. */}
        {(photo ?? photoFor(brand)) && (
          <ContentAsset
            asset={{ type: 'image', src: (photo ?? photoFor(brand))!, alt: '', aspectRatio: '16 / 9' }}
            className="overflow-hidden rounded-xl border border-border"
          />
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />5
          </span>
          <span className="inline-flex items-center gap-1">
            <Repeat2 className="size-3.5" />
            11
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            27
          </span>
          <span className="inline-flex items-center gap-1">
            <BarChart2 className="size-3.5" />
            8.4K
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3.5" />
            <Send className="size-3.5" />
          </span>
        </div>
      </div>
    </CardShell>
  )
}
