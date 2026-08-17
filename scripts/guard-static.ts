// guard-static: enforces the network law over src/ (web-plan.md, amended by
// decisions.md 2026-07-30 for the AlphaStudio integration, and by Ward's proxy
// law of 2026-08-17).
//
// Law 1 — the network law. Network code is legal ONLY inside src/api/, and
// since 2026-08-17 only in the TWO files licensed for it: the client, and the
// presigned-upload helper (decisions.md D-INT-A). Everywhere else under src/
// there is no fetch, no XHR, no EventSource, no WebSocket, no axios, and
// NOWHERE (src/api/ included) an http(s) literal: the API base URL comes from
// the environment, never from source. Lines containing "w3.org" are
// allowlisted (SVG/xmlns).
//
// Law 2 — the PROXY law (Ward, 2026-08-17). Every generation call goes through
// our own API's /orgs/:orgId/alphastudio/* namespace with the normal Bearer
// session. The frontend never addresses the AlphaProStudio service directly,
// never signs anything, and holds no service secret — so the marks of doing so
// are banned outright in code under src/.
//
// Law 2 is applied to CODE only, comments removed (`codeOf`), and deliberately
// so: the upstream routes and headers are things this repo's docs SHOULD be
// able to name, and a structural check that matched prose would be deleted the
// first time it fired on a doc comment (state.md, "a structural check must not
// match prose"). Law 1 still scans raw lines, unchanged.
//
// Run: pnpm guard:static (tsx scripts/guard-static.ts [--root <dir>])

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export interface Violation {
  line: number
  rule: string
  text: string
}

const RULES: { rule: string; pattern: RegExp }[] = [
  { rule: 'fetch', pattern: /\bfetch\s*\(/ },
  { rule: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { rule: 'EventSource', pattern: /\bEventSource\b/ },
  { rule: 'WebSocket', pattern: /\bWebSocket\b/ },
  { rule: 'axios', pattern: /\baxios\b/ },
  { rule: 'http-literal', pattern: /https?:\/\//i },
]

/**
 * Ward's proxy law, as five literals. Each is a mark of talking to the upstream
 * service directly, or of holding a credential this app has no business
 * holding:
 *  - the service's own CDN origin;
 *  - its signed request headers;
 *  - its route namespace (ours is /orgs/:orgId/alphastudio/*);
 *  - the HMAC key and edge secret the BACKEND signs with, in either casing.
 */
const PROXY_LAW_RULES: { rule: string; pattern: RegExp }[] = [
  { rule: 'upstream-origin', pattern: /cloudfront\.net/i },
  { rule: 'signing-header', pattern: /x-aps-/i },
  { rule: 'upstream-route', pattern: /\/v1\// },
  { rule: 'service-key', pattern: /svc[_-]?key/i },
  { rule: 'edge-secret', pattern: /edge[_-]?secret/i },
]

/** fetch is allowed in the licensed files and ONLY there; the rest always apply. */
const NETWORK_RULES_EXEMPT = new Set(['fetch'])

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html', '.svg', '.js', '.jsx'])

/**
 * The two files licensed to speak HTTP (decisions.md 2026-07-30, narrowed by
 * D-INT-A). `client.ts` is every API call; `upload.ts` is the one non-API
 * request the app makes — bytes to a presigned url our API just minted, because
 * the platform never proxies bytes. Nothing else, src/api/ included.
 */
export function isFetchLicensedFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  return /(?:^|\/)src\/api\/(?:client|upload)\.ts$/.test(normalized)
}

/** Carried across lines so a multi-line block comment stays prose throughout. */
export interface CommentState {
  inBlockComment: boolean
}

/**
 * The part of one line that is CODE, with `//` and comments blanked out.
 *
 * Deliberately line-scoped and deliberately simple. A full string-aware lexer
 * was the first attempt and it is the wrong tool: one apostrophe in JSX prose
 * ("Don't") opens a string it never closes, and the scanner then swallows the
 * rest of the file — a guard that silently stops guarding, which is worse than
 * one with a documented blind spot.
 *
 * The two known blind spots, both of which only ever LOSE a law-2 match (never
 * invent one), and both already covered by law 1 on the raw line:
 * - a `//` inside a string literal (`'https://…'`) truncates the line there;
 * - a regex literal ending `\//` reads as a comment start.
 */
export function codeOf(line: string, state: CommentState): string {
  if (state.inBlockComment) {
    const end = line.indexOf('*/')
    if (end === -1) return ''
    state.inBlockComment = false
    return codeOf(line.slice(end + 2), state)
  }
  const blockStart = line.indexOf('/*')
  const lineStart = line.indexOf('//')
  if (blockStart !== -1 && (lineStart === -1 || blockStart < lineStart)) {
    const head = line.slice(0, blockStart)
    const rest = line.slice(blockStart + 2)
    const end = rest.indexOf('*/')
    if (end === -1) {
      state.inBlockComment = true
      return head
    }
    return head + codeOf(rest.slice(end + 2), state)
  }
  if (lineStart !== -1) return line.slice(0, lineStart)
  return line
}

export function findViolations(filePath: string, content: string): Violation[] {
  const extension = extname(filePath).toLowerCase()
  if (!SCAN_EXTENSIONS.has(extension)) return []
  const fetchLicensed = isFetchLicensedFile(filePath)
  // CSS/HTML/SVG have their own comment syntax; the JS scanner only applies
  // where JS-shaped comments do. Elsewhere the whole line counts as code.
  const isScript = ['.ts', '.tsx', '.js', '.jsx'].includes(extension)
  const state: CommentState = { inBlockComment: false }
  const violations: Violation[] = []

  content.split(/\r?\n/).forEach((line, index) => {
    const code = isScript ? codeOf(line, state) : line
    if (line.includes('w3.org')) return
    for (const { rule, pattern } of RULES) {
      if (fetchLicensed && NETWORK_RULES_EXEMPT.has(rule)) continue
      if (pattern.test(line)) {
        violations.push({ line: index + 1, rule, text: line.trim() })
      }
    }
    for (const { rule, pattern } of PROXY_LAW_RULES) {
      if (pattern.test(code)) {
        violations.push({ line: index + 1, rule, text: line.trim() })
      }
    }
  })
  return violations
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, files)
    } else if (SCAN_EXTENSIONS.has(extname(full).toLowerCase())) {
      files.push(full)
    }
  }
  return files
}

function main(): void {
  const argv = process.argv.slice(2)
  const rootIndex = argv.indexOf('--root')
  const rootArg = rootIndex !== -1 ? argv[rootIndex + 1] : undefined
  const root = rootArg ?? 'src'

  if (!existsSync(root)) {
    console.error(`guard-static: root directory not found: ${root}`)
    process.exit(1)
  }

  const files = walk(root)
  let violationCount = 0
  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    for (const violation of findViolations(file, content)) {
      violationCount += 1
      console.error(`${file}:${violation.line} [${violation.rule}] ${violation.text}`)
    }
  }

  if (violationCount > 0) {
    console.error(
      `guard-static: FAILED — ${violationCount} violation(s) across ${files.length} scanned file(s)`,
    )
    process.exit(1)
  }
  console.log(`guard-static: ${files.length} files clean`)
}

const invokedPath = process.argv[1]
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  main()
}
