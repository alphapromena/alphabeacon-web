// guard-static: enforces the network law over src/ (web-plan.md, amended by
// decisions.md 2026-07-30 for the AlphaStudio integration).
// The law now reads: network code is legal ONLY inside src/api/ — everywhere
// else under src/ there is no fetch, no XHR, no EventSource, no WebSocket, no
// axios, and NOWHERE (src/api/ included) an http(s) literal: the API base URL
// comes from the environment, never from source. Lines containing "w3.org"
// are allowlisted (SVG/xmlns).
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

/** fetch is allowed here and ONLY here; every other rule still applies. */
const NETWORK_RULES_EXEMPT = new Set(['fetch'])

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html', '.svg', '.js', '.jsx'])

/** The one directory licensed to speak HTTP (decisions.md 2026-07-30). */
export function isApiLayerFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.includes('src/api/') || normalized.startsWith('api/')
}

export function findViolations(filePath: string, content: string): Violation[] {
  if (!SCAN_EXTENSIONS.has(extname(filePath).toLowerCase())) return []
  const exemptFromNetworkGlobals = isApiLayerFile(filePath)
  const violations: Violation[] = []
  const lines = content.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (line.includes('w3.org')) return
    for (const { rule, pattern } of RULES) {
      if (exemptFromNetworkGlobals && NETWORK_RULES_EXEMPT.has(rule)) continue
      if (pattern.test(line)) {
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
