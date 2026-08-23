/**
 * `/pricing` — the port of the prototype's `app/concept-v2/pricing/page.tsx`.
 *
 * The figures, tiers and copy are Abdullah's, verbatim, from
 * `concept/lib/pricing.ts`. That module is marketing's own data and is
 * deliberately NOT `usePlans()`: the app's plan entities describe what billing
 * can charge for, this page describes what sales is offering during the Middle
 * East launch, and the two are different documents with different owners
 * (decisions.md D-M2-B).
 */
import { usePageMeta } from '@/lib/page-meta'
import { PricingPage } from './concept/pricing/PricingPage'
import { ClosingCta } from './concept/sections/ClosingCta'
import { DEMO_HREF, HOME_HREF, PAGE_META } from './concept/site'

export function PricingScreen() {
  usePageMeta(PAGE_META.pricing)

  return (
    <>
      <PricingPage />
      {/* Deliberately not the homepage's closing words — a visitor who reads
          both should not hit the same wall twice. */}
      <ClosingCta
        id="request-demo"
        title="Let's design your Malaky deployment"
        lead="We'll look at your brands, markets, team and approval process and recommend the right operating scope."
        cta="Request a private demo"
        href={DEMO_HREF}
        secondary={{ label: 'Back to Malaky', href: HOME_HREF }}
      />
    </>
  )
}
