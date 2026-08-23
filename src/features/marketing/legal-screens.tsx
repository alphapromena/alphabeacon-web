/**
 * `/privacy` and `/terms` — the two website legal documents, ported from the
 * prototype's `app/concept-v2/{privacy,terms}/page.tsx`.
 *
 * These replace the app-styled pair that used to live in
 * `features/system/legal-screens.tsx`: they are visitor-world documents, they
 * are linked from the marketing footer, and they now render in the marketing
 * world's type and surfaces. The signup consent line still links to them and
 * still resolves.
 *
 * Every undecided legal value — entity, address, contact mailboxes, governing
 * law, effective date — renders as a visible `[To be confirmed: …]` rather
 * than as plausible prose. `concept/lib/legal.ts` is where the real values
 * arrive, and `isProductionReady()` reports what is still missing.
 */
import { usePageMeta } from '@/lib/page-meta'
import { PrivacyPolicy } from './concept/legal/PrivacyPolicy'
import { TermsOfUse } from './concept/legal/TermsOfUse'
import { PAGE_META } from './concept/site'

export function PrivacyScreen() {
  usePageMeta(PAGE_META.privacy)
  return <PrivacyPolicy />
}

export function TermsScreen() {
  usePageMeta(PAGE_META.terms)
  return <TermsOfUse />
}
