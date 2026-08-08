/**
 * The frame every auth screen shares (A1–A4): a centered card on a branded
 * split background — the charcoal brand panel appears from 1024px, and the
 * form stands alone below that (screens4.md A1).
 *
 * The panel is the one place in the product where the signature pink runs at
 * full strength behind type, so its copy is large and its contrast comes from
 * white on brand rather than from a token pair.
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
          {/* The Arabic wordmark, exactly as supplied (design.md Part 3). */}
          <img
            src="/brand/malaky-logo-charcoal.png"
            alt="Malaky"
            className="h-8 w-auto dark:hidden"
          />
          <img
            src="/brand/malaky-logo-white.png"
            alt=""
            aria-hidden
            className="hidden h-8 w-auto dark:block"
          />
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
         * The panel is `bg-primary`, not the brand gradient, because copy sits
         * on it: `--primary` + `--primary-foreground` is a pair proven at
         * 6.6:1 light and 6.9:1 dark, while white on the signature pink is
         * 3.77:1 and would fail AA the moment it carried a sentence. The pink
         * still leads — as the decorative bloom above, where no text lands.
         */
        <aside className="relative hidden overflow-hidden bg-primary p-12 lg:flex lg:flex-col lg:justify-end">
          <span
            aria-hidden
            className="absolute -top-24 -right-24 size-[28rem] rounded-full bg-brand opacity-70 blur-3xl"
          />
          <blockquote className="relative max-w-md text-primary-foreground">
            <p className="font-display text-3xl leading-tight font-semibold text-balance">
              {aside.heading}
            </p>
            <p className="mt-4 text-base/relaxed">{aside.body}</p>
          </blockquote>
        </aside>
      )}
    </div>
  )
}
