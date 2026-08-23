/**
 * `/request-demo` — the port of the prototype's
 * `app/concept-v2/request-demo/page.tsx`.
 *
 * The submit keeps the prototype's honesty: `submitDemoRequest` resolves
 * locally and nothing leaves the browser (`concept/lib/demo-request.ts` says
 * so in its own header, and the network law forbids anything else here). What
 * the port adds is a visible way to reach a human anyway — see
 * `concept/requestdemo/RequestDemo.tsx` — because a form that goes nowhere and
 * offers no alternative is a dead end wearing a success state.
 *
 * Open-item: this form needs a real destination (email or CRM) before DNS
 * cutover. See `.agent/open-items.md`.
 */
import { usePageMeta } from '@/lib/page-meta'
import { RequestDemo } from './concept/requestdemo/RequestDemo'
import { PAGE_META } from './concept/site'

export function RequestDemoScreen() {
  usePageMeta(PAGE_META.demo)
  return <RequestDemo />
}
