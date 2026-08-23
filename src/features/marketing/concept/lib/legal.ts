/**
 * Legal configuration for the public website.
 *
 * ## The rule
 *
 * Every value here is a real-world fact about a company — who Malaky is as a
 * legal entity, where it is registered, which law governs its website terms,
 * which address receives a privacy request. None of them has been decided, and
 * none of them may be guessed: a privacy policy naming an entity that does not
 * exist, or a terms page choosing a jurisdiction nobody has agreed to, is
 * worse than a page that says the value is still to be supplied.
 *
 * So an undecided value is `null`, and the pages render a visible placeholder
 * in its place rather than prose that reads as settled. When the real value
 * arrives, filling it in here is the whole change — see `isProductionReady()`,
 * which reports what is still missing.
 *
 * ## Scope
 *
 * These are website documents only: a privacy policy for the public site and
 * terms of use for visiting it. They are not customer SaaS terms, a data
 * processing agreement, a security policy or an SLA, and nothing here should
 * grow into one — those are separate documents that follow the product, not
 * the website.
 */

/** A value that has not been decided yet. */
export type Undecided = null

export interface LegalConfig {
  /**
   * Registered company name, exactly as incorporated.
   * TODO(legal): supply before production.
   */
  entity: string | Undecided
  /**
   * Registered address, as it should appear on a privacy notice.
   * TODO(legal): supply before production.
   */
  address: string | Undecided
  /**
   * Mailbox that receives privacy requests.
   * TODO(legal): supply before production. Do not reuse a sales address.
   */
  privacyEmail: string | Undecided
  /**
   * Mailbox for general legal and website enquiries.
   * TODO(legal): supply before production.
   */
  legalEmail: string | Undecided
  /**
   * Governing law and forum for the website terms — the country, and the
   * courts, agreed with counsel.
   * TODO(legal): supply before production. Nothing may be inferred from where
   * the company happens to operate or from the markets it sells into.
   */
  jurisdiction: string | Undecided
  /**
   * The date these documents take effect, ISO `YYYY-MM-DD`.
   * TODO(legal): supply on the day they are published.
   */
  effectiveDate: string | Undecided
}

export const LEGAL: LegalConfig = {
  entity: null,
  address: null,
  privacyEmail: null,
  legalEmail: null,
  jurisdiction: null,
  effectiveDate: null,
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/**
 * What the page prints where a value is missing.
 *
 * Deliberately conspicuous. A reader should see that something is outstanding,
 * and anyone reviewing the page before launch should not have to hunt for it.
 */
export const PLACEHOLDER_PREFIX = 'To be confirmed'

export function legalValue(value: string | Undecided, label: string): string {
  return value ?? `[${PLACEHOLDER_PREFIX}: ${label}]`
}

/** "17 August 2026", or the placeholder. */
export function formatEffectiveDate(value: string | Undecided): string {
  if (!value) return `[${PLACEHOLDER_PREFIX}: effective date]`
  const [y, m, d] = value.split('-').map(Number)
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${d} ${months[m - 1]} ${y}`
}

/** How Malaky refers to itself in the documents while the entity is unknown. */
export const WE = 'Malaky'

/* ------------------------------------------------------------------ *
 * Pre-production check
 * ------------------------------------------------------------------ */

export interface LegalReadiness {
  ready: boolean
  missing: (keyof LegalConfig)[]
}

/**
 * Which values are still outstanding. Used by the QA run so the count of
 * placeholders on the rendered pages can be checked against the config rather
 * than eyeballed, and available to any pre-deploy check that wants to refuse a
 * production build while legal values are unset.
 */
export function isProductionReady(config: LegalConfig = LEGAL): LegalReadiness {
  const missing = (Object.keys(config) as (keyof LegalConfig)[]).filter((k) => config[k] == null)
  return { ready: missing.length === 0, missing }
}
