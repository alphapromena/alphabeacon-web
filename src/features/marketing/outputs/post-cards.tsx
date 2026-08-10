import {
  AtSign,
  Briefcase,
  CalendarClock,
  Camera,
  Check,
  CircleAlert,
  Mail,
  Send,
  Sparkles,
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DemoBrand } from './demo-brands'

/**
 * Mock marketing outputs (brief §3, §31): every card looks publication-ready
 * — real copy, real hierarchy, the demo brand's own colors INSIDE the
 * artwork (D5) — and carries a workflow-state chip instead of engagement
 * numbers. Fake likes/comments are banned (§5); the chip set below is the
 * only status vocabulary.
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

/** Instagram — visual-first campaign with a caption preview (Nura by default). */
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
      <BrandHeader brand={brand} />
      {/* The artwork: an abstract composition in the brand's own colors —
          never a blank rectangle (§31). */}
      <div
        aria-hidden
        className="relative aspect-square overflow-hidden rounded-xl"
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
        <p
          className="absolute bottom-3 left-1/2 w-full -translate-x-1/2 px-2 text-center text-sm font-semibold tracking-wide text-white"
        >
          {visualTitle}
        </p>
      </div>
      <p className="text-xs/relaxed text-foreground">{caption}</p>
    </CardShell>
  )
}

/** LinkedIn Company — announcement + branded graphic (Falak by default). */
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
      <BrandHeader brand={brand} />
      <p className="text-xs/relaxed">
        Same-day, both ways. Our Riyadh ⇄ Jeddah lane opens Monday — cutoff at noon, delivered
        before your customers finish dinner.
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
    </CardShell>
  )
}

/** LinkedIn Executive — text-forward thought leadership (Meezan by default). */
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
      <BrandHeader brand={brand} person />
      <p className="text-xs/relaxed">{copy}</p>
    </CardShell>
  )
}

/** Arabic social — native RTL campaign, written as Arabic (Zaytoun by default). */
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
      <div dir="rtl" lang="ar" className="flex flex-col gap-2 text-right">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--db-ink)' }}>
            {brand.nameAr}
          </span>
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg text-[10px] font-semibold text-white"
            style={{ background: 'var(--db-primary)' }}
          >
            {brand.monogram}
          </span>
        </div>
        <div
          aria-hidden
          className="flex h-16 items-center justify-center rounded-xl px-3"
          style={{ background: 'var(--db-primary)' }}
        >
          <span className="text-lg font-semibold text-white">{headlineAr}</span>
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

/** Newsletter — a real email layout: subject, header band, body, CTA. */
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
        <div
          className="px-4 py-2 text-xs font-semibold text-white"
          style={{ background: 'var(--db-primary)' }}
        >
          {brand.name}
        </div>
        <div className="flex flex-col gap-1.5 bg-background px-4 py-3">
          <p className="text-sm font-semibold">Same-day is here.</p>
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

/** X — short-form; publishing is roadmap, and the label says so (§34). */
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
      <BrandHeader brand={brand} />
      <p className="text-xs/relaxed">
        Noon cutoff, evening delivery. Riyadh ⇄ Jeddah goes same-day on Monday.
      </p>
    </CardShell>
  )
}
