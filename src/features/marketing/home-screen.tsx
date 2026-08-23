/**
 * M1 — the marketing front door, ported from the prototype's
 * `app/concept-v2/page.tsx`. Section order is the argument and is unchanged.
 *
 * Claim → demonstration → proof, then the control story, then the visitor's
 * own company.
 *
 * Real-brand proof used to sit at 72% scroll depth, after the argument was
 * over. It now follows the fan-out it is evidence for. The standalone trust
 * section is gone — its four guarantees live inside the approval section that
 * demonstrates them.
 */
import { usePageMeta } from '@/lib/page-meta'
import { BrandDemo } from './concept/branddemo/BrandDemo'
import { Hero } from './concept/hero/Hero'
import { Approval } from './concept/sections/Approval'
import { Arabic } from './concept/sections/Arabic'
import { ClosingCta } from './concept/sections/ClosingCta'
import { Memory } from './concept/sections/Memory'
import { OneEvent } from './concept/sections/OneEvent'
import { Prompts } from './concept/sections/Prompts'
import { RealBrands } from './concept/sections/RealBrands'
import { PAGE_META, PRICING_HREF, START_HREF } from './concept/site'

export function MarketingHome() {
  usePageMeta(PAGE_META.home)

  return (
    <>
      <Hero />
      <Prompts />
      <OneEvent />
      <RealBrands />
      <Approval />
      <Memory />
      <Arabic />
      <BrandDemo />
      {/* The homepage closes on the route most visitors take. Business and
          Scale are self-serve, so the last thing on the page is the start of
          that journey rather than a request for a conversation — the demo path
          is still one click away in the header, and it is where the Enterprise
          card on the pricing page sends anyone whose deployment is scoped. A
          third button here would only make the visitor choose between two
          doors before they have chosen anything else.

          PORT NOTE: upstream sent this at its own inert get-started fiction.
          Here it is the real /signup (D-M2-C, D-M2-D). */}
      <ClosingCta
        id="get-started"
        href={START_HREF}
        title="Let's build Malaky around your business"
        lead="Choose your deployment and start setting Malaky up around your business, brand and marketing operation."
        cta="Get started"
        secondary={{ label: 'View pricing', href: PRICING_HREF }}
      />
    </>
  )
}
