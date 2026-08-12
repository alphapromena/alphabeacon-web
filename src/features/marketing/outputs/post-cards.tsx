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
  Truck,
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PLATFORM_UI, type DemoBrand, type PlatformId } from './demo-brands'
import { BrandLogo, PersonAvatar } from './brand-logos'
import { photoFor } from './campaign-photos'
import { ContentAsset } from './content-asset'
import {
  FacebookActionRow,
  FacebookReactions,
  InstagramActionRow,
  LinkedInActionRow,
  LinkedInReactions,
  PfMuted,
  PlatformFrame,
  PostMenu,
  PostedMeta,
  XCountsRow,
} from './platform-chrome'

/**
 * Mock marketing outputs — three layers, kept strictly separate
 * (founder pass 2026-08-12; brief §3, §31):
 *
 *   1. MALAKY owns the OUTER row only: the channel label and the workflow
 *      badge, on Malaky's warm card, ABOVE the post. Malaky's ivory and
 *      gold never touch the post itself.
 *   2. The PLATFORM owns its own frame: surface, ink, border and radius
 *      come from PLATFORM_UI via `PlatformFrame`, so Instagram is white,
 *      X is black, and each network's chrome (headers, reaction clusters,
 *      action rows, counts) matches the real thing. Identity is layout,
 *      color and typography — never an imported logo asset (D6;
 *      open-items 20 carries the trademark question).
 *   3. The CUSTOMER owns the content: their logo mark, their palette,
 *      their words, their campaign creative.
 *
 * The founder's quality bar: hide the Malaky label and the platform is
 * still obvious; hide the platform chrome and the brand is still obvious.
 *
 * Engagement numbers are DEMO DATA on INVENTED brands (decisions.md
 * 2026-08-11) and are passed as structured `engagement` props so any card
 * can later be driven by real data without touching its markup.
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
  // Each glyph carries its platform's own brand COLOR (PLATFORM_UI.glyph),
  // which is what makes the channel readable at a glance. The artwork is
  // still ours — colors are not the trademarked mark (D6; open-items 20).
  const meta = {
    instagram: { icon: Camera, label: 'Instagram', platform: 'instagram' },
    'linkedin-company': { icon: Briefcase, label: 'LinkedIn · Company', platform: 'linkedin' },
    'linkedin-executive': { icon: Briefcase, label: 'LinkedIn · Executive', platform: 'linkedin' },
    facebook: { icon: Users, label: 'Facebook', platform: 'facebook' },
    x: { icon: AtSign, label: 'X', platform: 'x' },
    newsletter: { icon: Mail, label: 'Newsletter', platform: 'newsletter' },
    arabic: { icon: Camera, label: 'Arabic social', platform: 'instagram' },
  }[channel] as { icon: typeof Camera; label: string; platform: PlatformId }
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon aria-hidden className="size-3.5" style={{ color: PLATFORM_UI[meta.platform].glyph }} />
      {meta.label}
      {comingSoon && (
        <span className="rounded-full border border-border px-1.5 py-px text-[10px] uppercase tracking-wide">
          Coming soon
        </span>
      )}
    </span>
  )
}

/** The customer's palette, published to the post interior as `--db-*`. */
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

/** e.g. Falak Logistics → news@falak.example (invented domain, .example). */
function senderAddress(brand: DemoBrand): string {
  return 'news@' + brand.name.split(' ')[0].toLowerCase() + '.example'
}

/** Lowercase handle without the @, the way Instagram shows a username. */
function usernameFor(brand: DemoBrand): string {
  return brand.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

/**
 * The Malaky wrapper: workflow chrome only, and only on the outside. The
 * post itself is handed to `PlatformFrame` by each card below.
 */
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
        'flex w-full flex-col gap-2.5 rounded-[1.25rem] border border-border bg-card p-3',
        'shadow-[var(--shadow-soft-lg)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <ChannelLabel channel={channel} comingSoon={comingSoon} />
        <StatusChip state={state} label={stateLabel} />
      </div>
      {children}
    </article>
  )
}

/** The photo a card should use, unless one is passed explicitly. */
function mediaFor(brand: DemoBrand, photo?: string) {
  return photo ?? photoFor(brand)
}

/* ------------------------------------------------------------- Instagram */

export interface InstagramEngagement {
  likes: string
  comments: string
  time: string
}

/** Instagram — the real feed anatomy on Instagram's own white surface. */
export function InstagramCard({
  brand,
  state = 'prepared',
  stateLabel,
  visualTitle = 'The Summer Collection',
  caption = 'Linen, clay, and light. The summer collection arrives Thursday — made to be lived in.',
  ctaLabel = 'Discover the collection',
  photo,
  engagement = { likes: '1,248 likes', comments: 'View all 32 comments', time: '2 hours ago' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  visualTitle?: string
  caption?: string
  /** The chip on the creative — a campaign line, so it must follow the
   * brand rather than sit hardcoded to one of them. */
  ctaLabel?: string
  photo?: string
  engagement?: InstagramEngagement
  className?: string
}) {
  const username = usernameFor(brand)
  const media = mediaFor(brand, photo)
  return (
    <CardShell brand={brand} channel="instagram" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="instagram">
        {/* Feed header: story-ring avatar, username, location, ⋯ */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span
            className="grid shrink-0 place-items-center rounded-full p-[2px]"
            style={{
              background:
                'conic-gradient(from 210deg, var(--db-accent), var(--db-primary), var(--db-ink), var(--db-accent))',
            }}
          >
            <BrandLogo brand={brand} round className="size-7 ring-2 [--tw-ring-color:var(--pf-surface)] ring-2" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{username}</p>
            <PfMuted className="block truncate text-[10px]">Riyadh, Saudi Arabia</PfMuted>
          </div>
          <PostMenu />
        </div>

        {/* The 4:5 creative — the customer's own campaign, full bleed. */}
        <div
          className="relative aspect-[4/5] w-full overflow-hidden"
          style={{
            background:
              'linear-gradient(160deg, var(--db-surface) 0%, var(--db-surface) 52%, var(--db-accent) 145%)',
          }}
        >
          {media ? (
            <>
              <ContentAsset
                asset={{ type: 'image', src: media, alt: '', aspectRatio: '4 / 5' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, color-mix(in oklab, var(--db-ink) 84%, transparent) 0%, transparent 58%)',
                }}
              />
            </>
          ) : (
            <>
              <span
                className="absolute bottom-0 left-1/2 h-[68%] w-[54%] -translate-x-1/2 rounded-t-full"
                style={{ background: 'var(--db-primary)' }}
              />
              <span
                className="absolute top-[8%] right-[10%] size-12 rounded-full"
                style={{ background: 'var(--db-accent)' }}
              />
            </>
          )}
          {/* The brand signs its own creative. */}
          <span className="absolute top-3 left-3 flex items-center gap-1.5">
            <BrandLogo brand={brand} className="size-5" />
            <span className="text-[9px] font-semibold tracking-[0.18em] text-white uppercase drop-shadow">
              {brand.name}
            </span>
          </span>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-4">
            <p className="px-4 text-center font-display text-lg/tight font-semibold text-white">
              {visualTitle}
            </p>
            <span
              className="mt-1 rounded-full px-3 py-0.5 text-[9px] font-semibold tracking-wide uppercase"
              style={{ background: 'var(--db-surface)', color: 'var(--db-ink)' }}
            >
              {ctaLabel}
            </span>
          </div>
        </div>

        <InstagramActionRow />
        <div className="flex flex-col gap-0.5 px-3 pt-1.5 pb-3">
          <p className="text-xs font-semibold">{engagement.likes}</p>
          <p className="text-xs/relaxed">
            <span className="font-semibold">{username}</span> {caption}{' '}
            <PfMuted>more</PfMuted>
          </p>
          <PfMuted className="text-[11px]">{engagement.comments}</PfMuted>
          <PfMuted className="text-[9px] tracking-wide uppercase">{engagement.time}</PfMuted>
        </div>
      </PlatformFrame>
    </CardShell>
  )
}

/* -------------------------------------------------------------- LinkedIn */

/** LinkedIn Company — page header, copy, full-bleed creative, reactions. */
export function LinkedInCompanyCard({
  brand,
  state = 'needsReview',
  stateLabel,
  photo,
  copy = 'Same-day, both ways. Our Riyadh ⇄ Jeddah lane opens Monday — cutoff at noon, delivered before your customers finish dinner.',
  engagement = { reactions: '142', comments: '18 comments · 7 reposts' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  copy?: string
  engagement?: { reactions: string; comments: string }
  className?: string
}) {
  const media = mediaFor(brand, photo)
  return (
    <CardShell brand={brand} channel="linkedin-company" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="linkedin">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <BrandLogo brand={brand} className="size-11" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand.name}</p>
            <PfMuted className="block truncate text-[10px]">{brand.followers}</PfMuted>
            <PostedMeta />
          </div>
          <PostMenu />
        </div>

        <p className="px-3 pb-2.5 text-xs/relaxed">
          {copy} <PfMuted>…see more</PfMuted>
        </p>

        {/* The launch creative: navy field, orange accent, white type. */}
        <div
          className="relative flex w-full flex-col gap-2 overflow-hidden p-4"
          style={{ background: 'var(--db-primary)' }}
        >
          {media && (
            <>
              <ContentAsset
                asset={{ type: 'image', src: media, alt: '', aspectRatio: '16 / 9' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, var(--db-primary) 10%, color-mix(in oklab, var(--db-primary) 55%, transparent) 64%, transparent 100%)',
                }}
              />
            </>
          )}
          <span className="relative flex items-center gap-1.5">
            <BrandLogo brand={brand} className="size-5" />
            <span className="text-[9px] font-semibold tracking-[0.18em] text-white uppercase">
              {brand.name}
            </span>
          </span>
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
            <Truck aria-hidden className="size-4" style={{ color: 'var(--db-accent)' }} />
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

        <LinkedInReactions count={engagement.reactions} comments={engagement.comments} />
        <LinkedInActionRow />
      </PlatformFrame>
    </CardShell>
  )
}

/** LinkedIn Executive — a PERSON's post: portrait avatar, text-first, no
 * company banner. This is the card that proves Malaky writes for people. */
export function LinkedInExecutiveCard({
  brand,
  state = 'prepared',
  stateLabel,
  copy = "Most VAT penalties I see aren't about money — they're about calendars. The filings that go wrong are the ones nobody owned until the last week. Q3 closes soon: decide today who owns yours.",
  engagement = { reactions: '98', comments: '12 comments' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  copy?: string
  engagement?: { reactions: string; comments: string }
  className?: string
}) {
  return (
    <CardShell brand={brand} channel="linkedin-executive" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="linkedin">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <PersonAvatar brand={brand} className="size-11" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand.person.name}</p>
            <PfMuted className="block truncate text-[10px]">{brand.person.role}</PfMuted>
            <PostedMeta />
          </div>
          <PostMenu />
        </div>

        {/* Text-first: a personal post has no banner unless it earns one. */}
        <p className="px-3 pb-3 text-xs/relaxed">
          {copy} <PfMuted>…see more</PfMuted>
        </p>

        <LinkedInReactions count={engagement.reactions} comments={engagement.comments} />
        <LinkedInActionRow />
      </PlatformFrame>
    </CardShell>
  )
}

/* -------------------------------------------------------------- Facebook */

/** Facebook — page header, copy, full-bleed creative, reactions, 3 actions. */
export function FacebookCard({
  brand,
  state = 'prepared',
  stateLabel,
  copy = "Iftar with the whole family, without the wait. Our Ramadan family set serves six — book a table before maghrib and it's on the table when you arrive.",
  banner = 'Family iftar · serves 6',
  photo,
  engagement = { reactions: '214', meta: '27 comments · 48 shares' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  copy?: string
  banner?: string
  photo?: string
  engagement?: { reactions: string; meta: string }
  className?: string
}) {
  const media = mediaFor(brand, photo)
  return (
    <CardShell brand={brand} channel="facebook" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="facebook">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <BrandLogo brand={brand} round className="size-10" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{brand.name}</p>
            <PfMuted className="block truncate text-[10px]">{brand.followers}</PfMuted>
            <PostedMeta />
          </div>
          <PostMenu />
        </div>

        <p className="px-3 pb-2.5 text-xs/relaxed">{copy}</p>

        <div className="relative w-full overflow-hidden">
          {media ? (
            <>
              <ContentAsset
                asset={{ type: 'image', src: media, alt: '', aspectRatio: '3 / 2' }}
                className="w-full"
              />
              <span
                className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white"
                style={{
                  background:
                    'linear-gradient(to top, color-mix(in oklab, var(--db-ink) 88%, transparent), transparent)',
                }}
              >
                <BrandLogo brand={brand} className="size-4" />
                {banner}
              </span>
            </>
          ) : (
            <div
              className="flex h-16 items-center justify-center gap-2 text-xs font-semibold text-white"
              style={{ background: 'var(--db-primary)' }}
            >
              <BrandLogo brand={brand} className="size-5" />
              {banner}
            </div>
          )}
        </div>

        <FacebookReactions count={engagement.reactions} meta={engagement.meta} />
        <FacebookActionRow />
      </PlatformFrame>
    </CardShell>
  )
}

/* --------------------------------------------------------- Arabic social */

/** Arabic social — RTL from the first pixel: Arabic name, Arabic handle,
 * Arabic-first hierarchy, mirrored chrome, Eastern-Arabic counts. */
export function ArabicSocialCard({
  brand,
  state = 'prepared',
  stateLabel,
  headlineAr = 'رمضان يجمعنا',
  bodyAr = 'قائمة إفطار عائلية جديدة — من قلب المطبخ الشامي. احجزوا طاولتكم قبل المغرب، ونحن نهتم بالباقي.',
  ctaAr = 'احجز الآن',
  photo,
  engagement = { likes: '١٦٦ إعجابًا', comments: 'عرض التعليقات الـ٢٤ جميعها', time: 'قبل ساعتين' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  headlineAr?: string
  bodyAr?: string
  ctaAr?: string
  photo?: string
  engagement?: { likes: string; comments: string; time: string }
  className?: string
}) {
  const media = mediaFor(brand, photo)
  return (
    <CardShell brand={brand} channel="arabic" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="instagram">
        {/* dir="rtl" on the frame itself, so the chrome mirrors natively
            rather than being an English layout with Arabic text poured in. */}
        <div dir="rtl" lang="ar" className="text-right">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <span
              className="grid shrink-0 place-items-center rounded-full p-[2px]"
              style={{
                background:
                  'conic-gradient(from 210deg, var(--db-accent), var(--db-primary), var(--db-ink), var(--db-accent))',
              }}
            >
              <BrandLogo brand={brand} round className="size-7" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold">{brand.nameAr}</p>
              <PfMuted className="block truncate text-[10px]">{brand.sectorAr}</PfMuted>
            </div>
            <PostMenu />
          </div>

          <div
            className="relative aspect-[4/5] w-full overflow-hidden"
            style={{
              background: 'linear-gradient(200deg, var(--db-primary) 0%, var(--db-ink) 130%)',
            }}
          >
            {media && (
              <>
                <ContentAsset
                  asset={{ type: 'image', src: media, alt: '', aspectRatio: '4 / 5' }}
                  className="absolute inset-0 size-full"
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, color-mix(in oklab, var(--db-ink) 86%, transparent) 0%, transparent 62%)',
                  }}
                />
              </>
            )}
            <span className="absolute top-3 right-3 flex items-center gap-1.5">
              <BrandLogo brand={brand} className="size-5" />
              <span className="text-[10px] font-semibold text-white drop-shadow">{brand.nameAr}</span>
            </span>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-4">
              <p className="px-4 text-center font-display text-xl font-semibold text-white">
                {headlineAr}
              </p>
              <span
                className="rounded-full px-3 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: 'var(--db-accent)' }}
              >
                قائمة الإفطار العائلية
              </span>
            </div>
          </div>

          <InstagramActionRow />
          <div className="flex flex-col gap-0.5 px-3 pt-1.5 pb-3">
            <p className="text-xs font-semibold">{engagement.likes}</p>
            <p className="text-xs/relaxed">
              <span className="font-semibold">{brand.nameAr}</span> {bodyAr}
            </p>
            <PfMuted className="text-[11px]">{engagement.comments}</PfMuted>
            <span
              className="mt-1.5 self-start rounded-full px-3 py-1 text-[11px] font-semibold text-white"
              style={{ background: 'var(--db-accent)' }}
            >
              {ctaAr}
            </span>
            <PfMuted className="mt-0.5 text-[9px]">{engagement.time}</PfMuted>
          </div>
        </div>
      </PlatformFrame>
    </CardShell>
  )
}

/* ------------------------------------------------------------ Newsletter */

/** Newsletter — an email client's chrome, then the brand's own email. */
export function NewsletterCard({
  brand,
  state = 'approved',
  stateLabel,
  photo,
  subject = 'Same-day delivery is here.',
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  subject?: string
  className?: string
}) {
  const media = mediaFor(brand, photo)
  return (
    <CardShell brand={brand} channel="newsletter" state={state} stateLabel={stateLabel} className={className}>
      <PlatformFrame platform="newsletter">
        {/* Client chrome — the part that says "this is an inbox". */}
        <div
          className="flex flex-col gap-1 border-b px-3 py-2.5"
          style={{ borderColor: 'var(--pf-border)', background: 'var(--pf-chrome)' }}
        >
          <p className="truncate text-[11px]">
            <PfMuted>From:</PfMuted>{' '}
            <span className="font-semibold">{brand.name}</span>{' '}
            <PfMuted>&lt;{senderAddress(brand)}&gt;</PfMuted>
          </p>
          <p className="truncate text-[11px]">
            <PfMuted>Subject:</PfMuted> <span className="font-semibold">{subject}</span>
          </p>
        </div>

        {/* The brand's masthead — its own bar, in its own color. */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ background: 'var(--db-primary)' }}
        >
          <BrandLogo brand={brand} className="size-5" />
          <span className="text-[11px] font-semibold tracking-[0.16em] text-white uppercase">
            {brand.name}
          </span>
        </div>

        {/* Hero creative. */}
        <div
          className="relative flex w-full flex-col gap-1.5 px-4 py-5"
          style={{ background: 'var(--db-ink)' }}
        >
          {media && (
            <>
              <ContentAsset
                asset={{ type: 'image', src: media, alt: '', aspectRatio: '16 / 9' }}
                className="absolute inset-0 size-full"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(95deg, var(--db-primary) 14%, color-mix(in oklab, var(--db-primary) 48%, transparent) 72%, transparent 100%)',
                }}
              />
            </>
          )}
          <p className="relative font-display text-base/tight font-semibold text-white">{subject}</p>
          <div className="relative flex items-center gap-2">
            <span className="text-[10px] font-semibold text-white">RUH</span>
            <span
              className="h-0.5 w-12 rounded-full"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--db-accent) 0 6px, transparent 6px 11px)',
              }}
            />
            <Truck aria-hidden className="size-3.5" style={{ color: 'var(--db-accent)' }} />
            <span className="text-[10px] font-semibold text-white">JED</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3">
          <p className="text-xs/relaxed">
            From Monday, orders placed before noon arrive the same evening — Riyadh to Jeddah and
            back.
          </p>
          <span
            className="mt-0.5 self-start rounded-md px-3 py-1.5 text-[11px] font-semibold text-white"
            style={{ background: 'var(--db-accent)' }}
          >
            See how it changes your delivery promise
          </span>
          <PfMuted className="mt-1 text-[9px]">
            You're receiving this because you ship with {brand.name}. · Unsubscribe
          </PfMuted>
        </div>
      </PlatformFrame>
    </CardShell>
  )
}

/* --------------------------------------------------------------------- X */

/** X — black surface, white type, the counts row. Publishing is roadmap
 * and the Malaky label says so (§34). */
export function XCard({
  brand,
  state = 'prepared',
  stateLabel,
  photo,
  copy = 'Noon cutoff, evening delivery. Riyadh ⇄ Jeddah goes same-day on Monday.',
  engagement = { replies: '211', reposts: '732', likes: '4.1K', views: '287.6K' },
  className,
}: {
  brand: DemoBrand
  state?: WorkflowState
  stateLabel?: string
  photo?: string
  copy?: string
  engagement?: { replies: string; reposts: string; likes: string; views: string }
  className?: string
}) {
  const media = mediaFor(brand, photo)
  return (
    <CardShell
      brand={brand}
      channel="x"
      comingSoon
      state={state}
      stateLabel={stateLabel}
      className={className}
    >
      <PlatformFrame platform="x">
        <div className="flex items-start gap-2.5 px-3 pt-2.5">
          <BrandLogo brand={brand} round className="size-9" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-bold">{brand.name}</p>
            <PfMuted className="block truncate text-[11px]">{handleFor(brand)} · 2h</PfMuted>
          </div>
          <PostMenu />
        </div>
        <p className="px-3 pt-2 pb-2.5 text-xs/relaxed">{copy}</p>
        {media && (
          <div className="px-3 pb-2">
            <ContentAsset
              asset={{ type: 'image', src: media, alt: '', aspectRatio: '16 / 9' }}
              className="overflow-hidden rounded-2xl border [border-color:var(--pf-border)]"
            />
          </div>
        )}
        <XCountsRow {...engagement} />
      </PlatformFrame>
    </CardShell>
  )
}

/* ----------------------------------------------------------------------- */

/**
 * Platform-named aliases (§9). The `*Card` names are the established API
 * across ~37 call sites and the e2e suite; these are the same components
 * under the names the founder asked for, so new code can read as
 * `InstagramPost` without a rename churn through the whole route.
 */
export {
  InstagramCard as InstagramPost,
  LinkedInCompanyCard as LinkedInCompanyPost,
  LinkedInExecutiveCard as LinkedInExecutivePost,
  FacebookCard as FacebookPost,
  ArabicSocialCard as ArabicSocialPost,
  NewsletterCard as NewsletterPreview,
  XCard as XPost,
}
