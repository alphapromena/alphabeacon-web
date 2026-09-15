/**
 * The frame every auth screen shares (A1–A4): a centered card on a branded
 * split background — the brand panel appears from 1024px, and the form stands
 * alone below that (screens4.md A1).
 *
 * THE PANEL IS GRAPHITE, NOT ACCENT (ORDER THEME-0913 Phase 4, founder finding
 * 1). It was `bg-primary`, which was a charcoal fill when `--primary` meant
 * charcoal — and became half a viewport of #ff4e2d the moment the accent took
 * that token. Nobody decided that; the panel simply inherited it.
 *
 * It is decided now, and it goes graphite. Not for contrast — dark ink on the
 * accent measures 5.86:1 and passes AA — but because the accent's entire job is
 * to mean "this is the action" (D-THEME-0913-C). Half a screen of it teaches a
 * user, on the very first screen they ever see, that orange means nothing in
 * particular; and it sits directly beside a sign-in button that is also accent,
 * so the one real action on the screen is the quietest orange thing on it.
 * The website never fills a half viewport with the accent either, so the old
 * panel did not read as the same product.
 *
 * What the accent does here instead is the website's own idiom: the full stop
 * that closes an editorial headline. One character, and it is the only accent
 * on the panel.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  /** The "already have an account?" line under the card. */
  footer?: ReactNode
  /** Panel copy — a different promise per screen keeps the funnel specific. */
  aside?: { heading: string; body: string }
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-8 px-6 py-10 sm:px-10">
        <Link
          to="/"
          className="flex w-fit items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {/* The Arabic wordmark, exactly as supplied (design.md Part 3).
              One theme, one wordmark — the charcoal-on-light variant became
              unreachable when light retired (D-THEME-0913-B). */}
          <img src="/brand/malaky-logo-white.png" alt="Malaky" className="h-8 w-auto" />
        </Link>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      {aside && (
        /*
         * Graphite panel, hairline seam, and the gold bloom kept as the brand
         * moment it always was — gold is the one thing on this screen allowed
         * to be purely atmospheric (D-THEME-0913-C).
         *
         * The bloom is held at 18%, and that number is measured rather than
         * chosen by eye: the heading and body sit over it in the worst case,
         * and at 18% they read 11.16:1 and 5.84:1. At the old 70% the body
         * would have measured 1.46:1. `inset-inline-end` so the bloom mirrors
         * in RTL along with everything else.
         */
        <aside className="relative hidden overflow-hidden border-s border-border bg-card px-12 py-10 lg:flex lg:flex-col lg:gap-8">
          <span
            aria-hidden
            className="absolute -top-24 -end-24 size-[28rem] rounded-full bg-brand opacity-[0.18] blur-3xl"
          />
          {/* The same rhythm as the form column — a wordmark-high row, the
              same gap, then a block centred in what is left — so the copy and
              the form share ONE optical centre (NIGHT-0916 order 6, finding 1). */}
          <div aria-hidden className="h-8" />
          <div className="relative flex flex-1 flex-col justify-center">
            {/*
             * The beacon at rest (D-NIGHT-0916-F): static concentric gold
             * rings at 7–20% around one accent core that is always there,
             * and one breathing layer that vanishes under reduced motion.
             * Decorative in full, so it is hidden from assistive tech; the
             * copy sits over its outer rings, which are hairlines — the
             * background axe reads under the words is the card's.
             */}
            <div
              aria-hidden
              data-slot="ambient-beacon"
              className="pointer-events-none absolute end-0 top-1/2 size-[22rem] -translate-y-1/2 translate-x-1/3"
            >
              <span className="absolute inset-0 rounded-full border border-brand opacity-[0.07]" />
              <span className="absolute inset-[12%] rounded-full border border-brand opacity-[0.1]" />
              <span className="absolute inset-[24%] rounded-full border border-brand opacity-[0.14]" />
              <span className="absolute inset-[36%] rounded-full border border-brand opacity-[0.2]" />
              <span
                data-ab-motion="ambient-beacon"
                className="absolute inset-[24%] rounded-full border border-brand"
              />
              <span className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
            </div>
            <blockquote className="relative max-w-md">
              <p className="font-display text-3xl leading-tight font-semibold text-balance text-foreground">
                {/* The website's own idiom: the accent full stop that closes an
                  editorial headline, and the only accent on this panel. The
                  copy is NOT changed — all three headings already end in a
                  period, so the existing stop is simply drawn in the accent
                  rather than a second one being added. */}
                {aside.heading.replace(/\.$/, '')}
                <span className="text-primary">.</span>
              </p>
              <p className="mt-4 text-base/relaxed text-muted-foreground">{aside.body}</p>
            </blockquote>
          </div>
        </aside>
      )}
    </div>
  )
}
