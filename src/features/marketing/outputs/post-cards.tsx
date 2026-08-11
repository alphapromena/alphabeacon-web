import {
  AtSign,
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
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DemoBrand } from './demo-brands'

/**
 * Mock marketing outputs (brief §3, §31; realism pass 2026-08-11): each
 * card's INTERIOR follows the anatomy of its channel — an Instagram post
 * reads as an Instagram post, a LinkedIn company post as one, the
 * newsletter as an email — while the OUTER shell stays the neutral Malaky
 * preview treatment (radius, warm border, soft shadow, tiny channel label,
 * workflow chip). Malaky previews the channel; it does not clone it:
 * platform identity comes from layout and generic glyphs, never imported
 * third-party logo assets (D6), and there are no fabricated engagement
 * or follower numbers (§5) — action rows are icon affordances only,
 * `aria-hidden` because they illustrate the output rather than promise a
 * click. The demo brand's own colors live INSIDE the artwork (D5).
 *
 * Surfaces follow §12: ~20px radius, thin warm borders, subtle shadows,
 * generous padding, no glassmorphism.
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

/** e.g. "Falak Logistics" → "@falaklogistics" — a handle, not a real account. */
function handleFor(brand: DemoBrand): string {
  return '@' + brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')
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
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.monogram}
        </span>
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

/** LinkedIn's action row — icon affordances only, no counts (§5). */
function LinkedInActions() {
  const actions: { icon: typeof ThumbsUp; label: string }[] = [
    { icon: ThumbsUp, label: 'Like' },
    { icon: MessageCircle, label: 'Comment' },
    { icon: Repeat2, label: 'Repost' },
    { icon: Send, label: 'Send' },
  ]
  return (
    <div
      aria-hidden
      className="flex items-center justify-between border-t border-border pt-2 text-muted-foreground"
    >
      {actions.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1 text-[11px]">
          <Icon className="size-3.5" />
          {label}
        </span>
      ))}
    </div>
  )
}

/** Instagram — the real post anatomy: header, artwork, actions, caption. */
export function InstagramCard({
  brand,
  state = 'prepared',
  stateLabel,
  visualTitle = 'The Summer Collection',
  caption = 'Linen, clay, and light. The summer collection arrives Thursday — made to be lived in.',
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  visualTitle?: string
  caption?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="instagram" state={state} stateLabel={stateLabel} className={className}>
      {/* Post header: avatar · name · category, the way the feed shows it. */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.monogram}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold">{brand.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{brand.sector}</p>
        </div>
        <MoreHorizontal aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </div>
      {/* The artwork: an abstract composition in the brand's own colors —
          never a blank rectangle (§31). */}
      <div
        aria-hidden
        className="relative -mx-1 aspect-square overflow-hidden rounded-xl"
        style={{ background: 'var(--db-surface)' }}
      >
        <div
          className="absolute bottom-0 left-1/2 h-3/4 w-1/2 -translate-x-1/2 rounded-t-full"
          style={{ background: 'var(--db-primary)' }}
        />
        <div
          className="absolute top-6 right-6 size-10 rounded-full"
          style={{ background: 'var(--db-accent)' }}
        />
        <p className="absolute bottom-3 left-1/2 w-full -translate-x-1/2 px-2 text-center text-sm font-semibold tracking-wide text-white">
          {visualTitle}
        </p>
      </div>
      {/* Action row: like · comment · share · save — icons, never counts. */}
      <div aria-hidden className="flex items-center gap-3.5 text-foreground">
        <Heart className="size-[1.15rem]" />
        <MessageCircle className="size-[1.15rem]" />
        <Send className="size-[1.15rem]" />
        <Bookmark className="ml-auto size-[1.15rem]" />
      </div>
      <p className="text-xs/relaxed">
        <span className="font-semibold">{handleFor(brand).slice(1)}</span> {caption}{' '}
        <span className="text-muted-foreground">more</span>
      </p>
    </CardShell>
  )
}

/** LinkedIn Company — company-page post anatomy (Falak by default). */
export function LinkedInCompanyCard({
  brand,
  state = 'needsReview',
  stateLabel,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="linkedin-company" state={state} stateLabel={stateLabel} className={className}>
      {/* Company header: square avatar · name · category · time · visibility. */}
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-md text-xs font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.monogram}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{brand.name}</p>
          <p className="truncate text-xs text-muted-foreground">{brand.sector} company</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            2h · <Globe aria-hidden className="size-2.5" />
          </p>
        </div>
      </div>
      <p className="text-xs/relaxed">
        Same-day, both ways. Our Riyadh ⇄ Jeddah lane opens Monday — cutoff at noon, delivered
        before your customers finish dinner. <span className="text-muted-foreground">…see more</span>
      </p>
      <div
        aria-hidden
        className="flex items-center gap-2 rounded-xl px-4 py-3"
        style={{ background: 'var(--db-surface)' }}
      >
        <span className="text-[11px] font-semibold" style={{ color: 'var(--db-ink)' }}>
          RUH
        </span>
        <span
          className="h-0.5 flex-1 rounded-full"
          style={{
            background:
              'repeating-linear-gradient(90deg, var(--db-accent) 0 8px, transparent 8px 14px)',
          }}
        />
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          same day
        </span>
        <span
          className="h-0.5 flex-1 rounded-full"
          style={{
            background:
              'repeating-linear-gradient(90deg, var(--db-accent) 0 8px, transparent 8px 14px)',
          }}
        />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--db-ink)' }}>
          JED
        </span>
      </div>
      <LinkedInActions />
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
      {/* Person header: round avatar · name · role · time — clearly a human,
          not a company page. */}
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.person.initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{brand.person.name}</p>
          <p className="truncate text-xs text-muted-foreground">{brand.person.role}</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            2h · <Globe aria-hidden className="size-2.5" />
          </p>
        </div>
      </div>
      <p className="text-xs/relaxed">
        {copy} <span className="text-muted-foreground">…see more</span>
      </p>
      <LinkedInActions />
    </CardShell>
  )
}

/** Arabic social — native RTL post, designed as Arabic from the first line
 * (Zaytoun by default): header, creative, caption and CTA all RTL-first. */
export function ArabicSocialCard({
  brand,
  state = 'prepared',
  stateLabel,
  headlineAr = 'رمضان يجمعنا',
  bodyAr = 'قائمة إفطار عائلية جديدة — من قلب المطبخ الشامي. احجزوا طاولتكم قبل المغرب، ونحن نهتم بالباقي.',
  ctaAr = 'احجز الآن',
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  headlineAr?: string
  bodyAr?: string
  ctaAr?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="arabic" state={state} stateLabel={stateLabel} className={className}>
      {/* The interior is a real RTL document: direction, alignment and
          punctuation are Arabic-first, not a mirrored English layout. */}
      <div dir="rtl" lang="ar" className="flex flex-col gap-2.5 text-right">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: 'var(--db-primary)' }}
          >
            {brand.monogram}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold" style={{ color: 'var(--db-ink)' }}>
              {brand.nameAr}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{brand.sectorAr}</p>
          </div>
          <MoreHorizontal aria-hidden className="mr-auto size-4 shrink-0 text-muted-foreground" />
        </div>
        <div
          aria-hidden
          className="flex h-16 items-center justify-center rounded-xl px-3"
          style={{ background: 'var(--db-primary)' }}
        >
          <span className="text-lg font-semibold text-white">{headlineAr}</span>
        </div>
        <div aria-hidden className="flex items-center gap-3.5 text-foreground">
          <Heart className="size-[1.15rem]" />
          <MessageCircle className="size-[1.15rem]" />
          <Send className="size-[1.15rem]" />
          <Bookmark className="mr-auto size-[1.15rem]" />
        </div>
        <p className="text-xs/relaxed">{bodyAr}</p>
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

/** Newsletter — a real email: From/Subject chrome, hero band, body, CTA.
 * Visibly not social media. */
export function NewsletterCard({
  brand,
  state = 'approved',
  stateLabel,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="newsletter" state={state} stateLabel={stateLabel} className={className}>
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Email chrome: the two lines every inbox shows. */}
        <div className="flex flex-col gap-0.5 border-b border-border bg-background px-4 py-2">
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">From:</span> {brand.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Subject:</span> Same-day is here.
          </p>
        </div>
        <div
          aria-hidden
          className="px-4 py-4"
          style={{ background: 'var(--db-primary)' }}
        >
          <p className="text-sm font-semibold text-white">Same-day is here.</p>
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
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  copy?: string
  banner?: string
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="facebook" state={state} stateLabel={stateLabel} className={className}>
      <BrandHeader brand={brand} />
      <p className="text-xs/relaxed">{copy}</p>
      <div
        aria-hidden
        className="flex h-10 items-center justify-center rounded-xl text-xs font-semibold"
        style={{ background: 'var(--db-surface)', color: 'var(--db-primary)' }}
      >
        {banner}
      </div>
    </CardShell>
  )
}

/** X — a text-first post; publishing is roadmap, and the label says so (§34). */
export function XCard({
  brand,
  state = 'prepared',
  stateLabel,
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
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
      {/* X anatomy: small round avatar · name · handle · time, then the
          short copy and the quiet action row. */}
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.monogram}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold">{brand.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{handleFor(brand)} · 2h</p>
        </div>
      </div>
      <p className="text-xs/relaxed">
        Noon cutoff, evening delivery. Riyadh ⇄ Jeddah goes same-day on Monday.
      </p>
      <div aria-hidden className="flex items-center justify-between text-muted-foreground">
        <MessageCircle className="size-3.5" />
        <Repeat2 className="size-3.5" />
        <Heart className="size-3.5" />
        <Bookmark className="size-3.5" />
        <Send className="size-3.5" />
      </div>
    </CardShell>
  )
}
