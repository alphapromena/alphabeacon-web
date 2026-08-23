/**
 * The head, for a single-page app.
 *
 * `index.html` carries the homepage's title, description, canonical origin and
 * social card — that is what a crawler which never runs JavaScript sees, and
 * it must stay the homepage's. Everything else on the marketing route is a
 * client-side navigation, so the head has to be updated in the browser.
 *
 * This is deliberately the smallest thing that does that job: title and
 * description, set on mount, restored to `index.html`'s values on unmount. No
 * head-management library, and no Open Graph rewriting — a crawler reads the
 * served HTML, not the DOM after React has run, so per-route `og:*` tags would
 * be theatre. The one card in `index.html` is honest for every route because
 * it describes the site.
 *
 * When these pages need per-route social cards for real, the answer is
 * pre-rendering the marketing routes at build time, not a bigger hook.
 */
import { useLayoutEffect } from 'react'

export interface PageMeta {
  title: string
  description: string
}

/** What `index.html` shipped with — captured once, before anything edits it. */
const documentDefaults: PageMeta = {
  title: typeof document === 'undefined' ? '' : document.title,
  description:
    typeof document === 'undefined'
      ? ''
      : (document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''),
}

function apply({ title, description }: PageMeta): void {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}

/**
 * Sets this route's title and description, and puts `index.html`'s back when
 * the route leaves — so walking from `/pricing` into the signed-in app does
 * not leave the browser tab claiming to be the pricing page.
 */
export function usePageMeta(meta: PageMeta): void {
  useLayoutEffect(() => {
    apply(meta)
    return () => apply(documentDefaults)
  }, [meta])
}
