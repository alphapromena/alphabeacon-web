/**
 * The visitor world's chrome — the port of the prototype's
 * `app/concept-v2/layout.tsx`, plus the three things Next did for it that a
 * Vite SPA has to do itself.
 *
 * A ROUTE LAYOUT, not a wrapper each page renders: `/`, `/pricing`,
 * `/request-demo`, `/terms` and `/privacy` are siblings under one `Outlet`, so
 * the header survives navigation between them. A page that rendered its own
 * copy of the header would destroy the focused nav link on every click —
 * state.md trap 8, learned the expensive way in Settings.
 *
 * `/` is dual-purpose (screens4.md): marketing when signed out, the product
 * when signed in. So the layout gates itself — signed in at `/`, it renders
 * the outlet bare and never puts marketing chrome around the dashboard.
 */
import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useSession } from '@/data/provider'
import { MediaDefs } from './concept/BrandMedia'
import { Footer } from './concept/Footer'
import { Header } from './concept/Header'
import { HOME_HREF } from './concept/site'

/**
 * Marks the document while the visitor world is on screen.
 *
 * `styles/marketing.css` hangs every concept-v2 token off this attribute, and
 * the dark page background with it. It exists — rather than the tokens living
 * on `:root` the way the prototype had them — because this repo also holds a
 * signed-in product with its own design system, and the two must not be able
 * to reach each other. Removing the attribute on unmount is the whole
 * isolation guarantee, so it is a layout effect: it runs before paint, and its
 * cleanup runs before the next screen paints.
 */
function useMarketingWorld(active: boolean): void {
  useLayoutEffect(() => {
    if (!active) return
    const root = document.documentElement
    root.setAttribute('data-mk-world', '')
    return () => root.removeAttribute('data-mk-world')
  }, [active])
}

/**
 * Fragment navigation, which the browser does for free on a document load and
 * not at all on a client-side one.
 *
 * The header's section links are `/#product`-shaped, so arriving from
 * `/pricing` changes the pathname AND the hash in one navigation — the element
 * does not exist yet when the location changes. Hence the frame's grace:
 * `requestAnimationFrame` lets the new route commit before the lookup.
 *
 * Reduced motion is honoured by the stylesheet, which sets `scroll-behavior:
 * auto` on the document under the reduce query, so this uses the CSS-declared
 * behaviour rather than forcing 'smooth' here.
 */
function useHashScroll(hash: string, active: boolean): void {
  useEffect(() => {
    if (!active) return
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView()
    })
    return () => cancelAnimationFrame(frame)
  }, [hash, active])
}

export function MarketingLayout() {
  const session = useSession()
  const { pathname, hash } = useLocation()

  /* Signed in at '/', this route is the product, not the site — RootGate
     resolves it to the dashboard or to N3, and neither wears marketing
     chrome. Every other route under this layout is marketing at any session
     state, including /terms and /privacy. */
  const isProductHome = pathname === HOME_HREF && session.signedIn
  const visitorWorld = !isProductHome

  useMarketingWorld(visitorWorld)
  useHashScroll(hash, visitorWorld)

  if (isProductHome) return <Outlet />

  return (
    <div className="mk-world">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* Gradient definitions for every generated creative, rendered once. */}
      <MediaDefs />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
