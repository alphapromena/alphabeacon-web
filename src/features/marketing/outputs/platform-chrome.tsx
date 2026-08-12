import { Bookmark, Globe, Heart, MessageCircle, MoreHorizontal, Repeat2, Send, ThumbsUp } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FACEBOOK_REACTIONS, PLATFORM, PLATFORM_UI, type PlatformId } from './demo-brands'

/**
 * Reusable platform chrome (founder pass 2026-08-12, §9).
 *
 * The founder's note was that the cards "still feel like generic SaaS
 * mockups". The root cause was structural, not decorative: every post
 * rendered on Malaky's warm ivory `bg-card`, inherited Malaky's text
 * colors, and borrowed Malaky's radius — so six different networks all
 * looked like six Malaky panels.
 *
 * The fix is this module. A post is now composed of three separable
 * layers, and only the middle one belongs to the platform:
 *
 *   Malaky badge row   → warm, outside, above (post-cards' CardShell)
 *   PlatformFrame      → the network's OWN surface, ink, border, radius
 *   customer content   → the brand's logo, palette and words, inside
 *
 * `PlatformFrame` publishes the network's palette as `--pf-*` custom
 * properties, so every child (headers, action rows, counts) reads its
 * color from the platform rather than from Malaky's theme. That single
 * change is what makes X read as X (black) and Instagram as Instagram
 * (white) before any label is read.
 *
 * D6 is unchanged: identity here is surface, chrome, layout and type —
 * no imported or traced third-party logo assets. See open-items 20.
 */

function platformVars(platform: PlatformId): CSSProperties {
  const ui = PLATFORM_UI[platform]
  return {
    '--pf-surface': ui.surface,
    '--pf-ink': ui.ink,
    '--pf-muted': ui.muted,
    '--pf-border': ui.border,
    '--pf-accent': ui.accent,
    '--pf-chrome': ui.chrome,
  } as CSSProperties
}

/**
 * The network's own canvas. Everything inside inherits the platform's
 * surface and ink, never Malaky's — that is the whole point.
 */
export function PlatformFrame({
  platform,
  children,
  className,
}: {
  platform: PlatformId
  children: ReactNode
  className?: string
}) {
  return (
    <div
      aria-hidden
      style={platformVars(platform)}
      className={cn(
        'overflow-hidden rounded-xl border select-none',
        // Colors come from the platform, not the theme.
        '[border-color:var(--pf-border)] [background:var(--pf-surface)] [color:var(--pf-ink)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Muted secondary text in the platform's own gray. */
export function PfMuted({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('[color:var(--pf-muted)]', className)}>{children}</span>
}

/** The "2h · 🌐" line every feed shows under a company name. */
export function PostedMeta({ time = '2h' }: { time?: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] [color:var(--pf-muted)]">
      {time} · <Globe aria-hidden className="size-2.5" />
    </span>
  )
}

/** The ⋯ affordance at the top-right of every post. */
export function PostMenu() {
  return <MoreHorizontal aria-hidden className="ml-auto size-4 shrink-0 [color:var(--pf-muted)] rtl:mr-auto rtl:ml-0" />
}

/* ------------------------------------------------------------- reactions */

/** LinkedIn's overlapped reaction dots, then the count. */
export function LinkedInReactions({ count, comments }: { count: string; comments: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] [color:var(--pf-muted)]">
      <span className="inline-flex items-center gap-1.5">
        <span className="flex -space-x-1">
          {[PLATFORM.linkedin.like, PLATFORM.linkedin.love, PLATFORM.linkedin.celebrate].map(
            (hue, i) => (
              <span
                key={hue}
                className="grid size-4 place-items-center rounded-full ring-1 [ring-color:var(--pf-surface)]"
                style={{ background: hue }}
              >
                {i === 0 && <ThumbsUp className="size-2.5 text-white" />}
                {i === 1 && <Heart className="size-2.5 text-white" />}
                {i === 2 && <span className="size-1.5 rounded-full bg-white" />}
              </span>
            ),
          )}
        </span>
        {count}
      </span>
      <span>{comments}</span>
    </div>
  )
}

/** Facebook's reaction cluster — 👍 ❤️ 😮 then the count. */
export function FacebookReactions({ count, meta }: { count: string; meta: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] [color:var(--pf-muted)]">
      <span className="inline-flex items-center gap-1.5">
        <span className="flex -space-x-1">
          {[FACEBOOK_REACTIONS.like, FACEBOOK_REACTIONS.love, FACEBOOK_REACTIONS.wow].map(
            (hue, i) => (
              <span
                key={hue}
                className="grid size-4 place-items-center rounded-full ring-1 [ring-color:var(--pf-surface)]"
                style={{ background: hue }}
              >
                {i === 0 && <ThumbsUp className="size-2.5 text-white" />}
                {i === 1 && <Heart className="size-2.5 text-white" />}
                {i === 2 && <span className="text-[7px] leading-none text-white">!</span>}
              </span>
            ),
          )}
        </span>
        {count}
      </span>
      <span>{meta}</span>
    </div>
  )
}

/* --------------------------------------------------------------- actions */

/** LinkedIn's four-up action row, on the platform's divider. */
export function LinkedInActionRow() {
  return (
    <ActionRow
      items={[
        { icon: ThumbsUp, label: 'Like' },
        { icon: MessageCircle, label: 'Comment' },
        { icon: Repeat2, label: 'Repost' },
        { icon: Send, label: 'Send' },
      ]}
    />
  )
}

/** Facebook's three-up action row. */
export function FacebookActionRow() {
  return (
    <ActionRow
      items={[
        { icon: ThumbsUp, label: 'Like' },
        { icon: MessageCircle, label: 'Comment' },
        { icon: Send, label: 'Share' },
      ]}
    />
  )
}

function ActionRow({ items }: { items: { icon: typeof ThumbsUp; label: string }[] }) {
  return (
    <div className="flex items-center justify-around border-t px-2 py-1.5 [border-color:var(--pf-border)]">
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold [color:var(--pf-muted)]"
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </span>
      ))}
    </div>
  )
}

/** Instagram's action bar: heart / comment / share left, bookmark right. */
export function InstagramActionRow() {
  return (
    <div className="flex items-center gap-4 px-3 pt-2.5">
      <Heart
        aria-hidden
        className="size-[1.35rem]"
        style={{ color: PLATFORM.instagram.heart }}
        fill={PLATFORM.instagram.heart}
      />
      <MessageCircle aria-hidden className="size-[1.35rem] -scale-x-100" />
      <Send aria-hidden className="size-[1.3rem] -rotate-12" />
      <Bookmark aria-hidden className="ml-auto size-[1.3rem] rtl:mr-auto rtl:ml-0" />
    </div>
  )
}

/** X's counts row — reply, repost, like, views, then save/share. */
export function XCountsRow({
  replies,
  reposts,
  likes,
  views,
}: {
  replies: string
  reposts: string
  likes: string
  views: string
}) {
  const items: { icon: typeof MessageCircle; value: string }[] = [
    { icon: MessageCircle, value: replies },
    { icon: Repeat2, value: reposts },
    { icon: Heart, value: likes },
  ]
  return (
    <div className="flex items-center justify-between px-3 pt-1 pb-2.5 text-[11px] [color:var(--pf-muted)]">
      {items.map(({ icon: Icon, value }) => (
        <span key={value} className="inline-flex items-center gap-1.5">
          <Icon aria-hidden className="size-[0.95rem]" />
          {value}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="flex h-[0.95rem] items-end gap-px">
          <span className="w-[2px] bg-current" style={{ height: '45%' }} />
          <span className="w-[2px] bg-current" style={{ height: '72%' }} />
          <span className="w-[2px] bg-current" style={{ height: '100%' }} />
        </span>
        {views}
      </span>
      <span className="inline-flex items-center gap-2.5">
        <Bookmark aria-hidden className="size-[0.95rem]" />
        <Send aria-hidden className="size-[0.95rem] -rotate-12" />
      </span>
    </div>
  )
}
