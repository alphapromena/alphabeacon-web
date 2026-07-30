/**
 * Normalising what someone pastes into I5's "add a source" field.
 *
 * Addresses are stored WITHOUT a scheme, the same way `ClaimChip` renders them:
 * the static law bans http(s):// literals under `src/`, and a stored scheme
 * would imply a link this app could follow. The scheme is stripped with a
 * generic pattern rather than a named one for exactly that reason.
 */
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
const LEADING_WWW = /^www\./i
/** Host-ish: at least one dot, no whitespace, no path-only input. */
const HOSTLIKE = /^[^\s/]+\.[^\s/]{2,}(\/\S*)?$/

export function normalizeSourceUrl(input: string): string {
  return input.trim().replace(SCHEME, '').replace(/\/+$/, '')
}

export function isSourceUrlValid(input: string): boolean {
  return HOSTLIKE.test(normalizeSourceUrl(input))
}

/**
 * The "auto-detected name" I5 promises. With nothing to fetch, the honest
 * detection is the one the address already carries: the registrable-looking
 * part of the host, title-cased.
 */
export function deriveSourceName(input: string): string {
  const host = normalizeSourceUrl(input).split('/')[0].replace(LEADING_WWW, '')
  const parts = host.split('.')
  const stem = parts.length > 2 ? parts[parts.length - 3] || parts[0] : parts[0]
  return stem
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
