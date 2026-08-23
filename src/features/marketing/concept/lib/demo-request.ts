/**
 * The private-demo request: its shape, its validation, and the one seam
 * through which it would eventually leave the browser.
 *
 * ## There is no backend
 *
 * This repository has no route handlers, no server actions, no database, no
 * email or CRM dependency and no environment configuration — every page is
 * statically prerendered. So `submitDemoRequest` resolves locally and nothing
 * is sent anywhere. It is deliberately the only place that knows that: the
 * form component awaits a promise and renders a result, exactly as it would
 * against a real service.
 *
 * ## Connecting it later
 *
 * Replace the body of `submitDemoRequest` with a call that returns the same
 * `SubmitResult`. Nothing in the UI needs to change. A realistic first
 * implementation is a POST to an `app/request-demo/route.ts`
 * handler that validates with `validateDemoRequest` again server-side — the
 * validators here are pure and import nothing, so both sides can share them —
 * and then fans out to email, CRM or a database. Scheduling would become a
 * second, separate call made from the success state.
 */

/* ------------------------------------------------------------------ *
 * Shape
 * ------------------------------------------------------------------ */

export type InterestId =
  | 'company-social'
  | 'executive-linkedin'
  | 'arabic-content'
  | 'campaign-planning'
  | 'multi-channel'
  | 'brand-consistency'
  | 'approvals'

export interface InterestOption {
  id: InterestId
  label: string
}

/**
 * What the visitor most wants Malaky to take on. Ordered roughly by how
 * often each comes up rather than alphabetically.
 */
export const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'company-social', label: 'Company social media' },
  { id: 'executive-linkedin', label: 'Founder / executive LinkedIn' },
  { id: 'arabic-content', label: 'Arabic content' },
  { id: 'campaign-planning', label: 'Campaign planning' },
  { id: 'multi-channel', label: 'Multi-channel marketing' },
  { id: 'brand-consistency', label: 'Brand consistency' },
  { id: 'approvals', label: 'Marketing approvals' },
]

export interface DemoRequest {
  name: string
  email: string
  company: string
  website: string
  role: string
  market: string
  interests: InterestId[]
  /** Optional free text. */
  notes: string
}

export const EMPTY_REQUEST: DemoRequest = {
  name: '',
  email: '',
  company: '',
  website: '',
  role: '',
  market: '',
  interests: [],
  notes: '',
}

/** Every field the visitor can get wrong, so error state is typed. */
export type RequiredField = 'name' | 'email' | 'company' | 'website' | 'role' | 'market'

export type FieldErrors = Partial<Record<RequiredField, string>>

/* ------------------------------------------------------------------ *
 * Validation — pure, dependency-free, safe to run on either side
 * ------------------------------------------------------------------ */

/**
 * Deliberately permissive. This is a first contact form, not an
 * authentication step: it should catch a typo, not argue with a valid address
 * it has never seen. One @, something either side, a dot in the domain.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

const FREE_EMAIL_HOSTS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
])

export function emailHost(value: string): string {
  return value.trim().toLowerCase().split('@')[1] ?? ''
}

/** True for a personal mailbox. Used to nudge, never to block. */
export function isFreeEmailHost(value: string): boolean {
  return FREE_EMAIL_HOSTS.has(emailHost(value))
}

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/

/**
 * Reduces what someone actually types to a bare host.
 * "www.Example.com/about?x=1", scheme and all, -> "example.com".
 * (Upstream spelled the scheme out here; guard-static bans an http(s) literal
 * anywhere under src/, comments included, so the example drops it.)
 * Returns null when the input could not be a website address.
 */
export function normalizeWebsite(input: string): string | null {
  let value = (input ?? '').trim().toLowerCase()
  if (!value) return null

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // scheme
  value = value.replace(/^www\./, '')
  value = value.split(/[/?#]/)[0] // path, query, fragment
  value = value.replace(/:\d+$/, '') // port
  value = value.replace(/\.$/, '') // trailing dot
  value = value.replace(/\s+/g, '')

  if (!value || value.length > 253) return null
  return HOST_RE.test(value) ? value : null
}

export function validateDemoRequest(values: DemoRequest): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name.trim()) errors.name = 'Tell us who to address this to.'

  const email = values.email.trim()
  if (!email) errors.email = 'We need an address to reply to.'
  else if (!EMAIL_RE.test(email)) errors.email = "That doesn't look like an email address."

  if (!values.company.trim()) errors.company = 'Which company is this for?'

  if (!values.website.trim()) errors.website = 'Your website tells us the most, fastest.'
  else if (!normalizeWebsite(values.website))
    errors.website = "That doesn't look like a website address. Try yourcompany.com"

  if (!values.role.trim()) errors.role = 'Your role shapes what we show you.'
  if (!values.market.trim()) errors.market = 'Where does the business operate?'

  return errors
}

/* ------------------------------------------------------------------ *
 * The submission seam
 * ------------------------------------------------------------------ */

export type SubmitResult = { ok: true } | { ok: false; message: string }

/**
 * Reserved for exercising the failure path in QA. `.test` is reserved by
 * RFC 2606 and can never resolve to a real company, so this can sit in the
 * concept without any chance of a genuine visitor tripping it.
 */
const FAILURE_PROBE = 'fail.test'

/** How long the mock takes to resolve, so the pending state is real. */
const MOCK_LATENCY_MS = 900

/**
 * The only function that would talk to a service.
 *
 * Today it resolves locally: nothing is transmitted, stored or emailed, and
 * the payload never leaves the page. The signature is the contract — swap the
 * body for a real call and the form keeps working unchanged.
 */
export async function submitDemoRequest(request: DemoRequest): Promise<SubmitResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  if (normalizeWebsite(request.website) === FAILURE_PROBE) {
    return {
      ok: false,
      message: "We couldn't send that just now. Please try again.",
    }
  }

  return { ok: true }
}

/* ------------------------------------------------------------------ *
 * Page content
 * ------------------------------------------------------------------ */

/**
 * What the conversation covers. Every line describes something this concept
 * already demonstrates — no turnaround time, no deliverable, no ROI report.
 */
export const WHAT_HAPPENS_NEXT = [
  'We learn how your business markets today.',
  'We identify where Malaky would fit.',
  'We show what Malaky could prepare for your company.',
  'We recommend the right deployment scope.',
]

/**
 * Intelligence Setup from the pricing page, condensed to four phases. No
 * duration is stated, because the implementation timeline is not decided.
 */
export const DEPLOYMENT_PHASES = [
  {
    id: 'business',
    title: 'Business',
    body: 'Brand, products, services and markets.',
  },
  {
    id: 'voice',
    title: 'Voice',
    body: 'Company voice, Arabic voice and executive voices.',
  },
  {
    id: 'context',
    title: 'Operating context',
    body: 'Calendar, audiences, approved facts and priorities.',
  },
  {
    id: 'workflow',
    title: 'Workflow',
    body: 'Review rules, approvals and the initial marketing plan.',
  },
]

export const DEPLOYMENT_CLOSE =
  "Malaky starts with your company's context instead of a blank prompt."
