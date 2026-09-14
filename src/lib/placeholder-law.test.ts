/**
 * D-UX-0913-C, enforced: a placeholder describes the INPUT, never a sample
 * from another business.
 *
 * ORDER UX-0913 neutralised 15 placeholders that a live org could see, all of
 * them left over from the static demo's coffee roaster. This test is what
 * stops them coming back — and it guards the whole app surface, not just the
 * `placeholder` attribute, because the same sample content is equally wrong in
 * a helper line, a default value or a seeded row.
 *
 * WHAT IS IN SCOPE: the screens a signed-in customer sees, plus the shared
 * copy module and the route table that titles them. The static demo dataset
 * (`src/data/**`) is deliberately EXCLUDED — Atlas Roasters is what the demo
 * world is, and `/dev/datasets` is not a customer. The visitor world
 * (`src/features/marketing/**`) is excluded for the same reason it is scoped
 * apart everywhere else (CLAUDE.md). Test files are excluded: a fixture may
 * name anything it likes.
 *
 * Sibling guards: `tokens.test.ts` (colour), `guard-static.ts` (network).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The ORDER UX-0913 Phase 0(b) list, verbatim. Case-insensitive substrings. */
const RESIDUE = [
  'Roasted to order',
  'perfectdailygrind',
  'single origin',
  'Roasting notes',
  'Guji',
  'roast',
  'coffee',
  'espresso',
  'barista',
  'beans',
] as const

const ROOTS = ['src/features', 'src/components/ab', 'src/lib', 'src/api']
const FILES = ['src/routes.tsx']

/** The demo world and the visitor world both keep their own content. */
const EXCLUDED_DIRS = [join('src', 'features', 'marketing')]

function walk(dir: string): string[] {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (EXCLUDED_DIRS.some((skip) => full.startsWith(skip))) continue
    if (statSync(full).isDirectory()) {
      out = out.concat(walk(full))
      continue
    }
    if (!/\.tsx?$/.test(entry)) continue
    if (/\.test\.tsx?$/.test(entry)) continue
    out.push(full)
  }
  return out
}

const sources = [...ROOTS.flatMap(walk), ...FILES].map((path) => ({
  path: relative('.', path).split(sep).join('/'),
  text: readFileSync(path, 'utf8'),
}))

describe('the placeholder law (D-UX-0913-C)', () => {
  it('reads a meaningful number of app-surface files', () => {
    // A broken walk that found nothing would pass every assertion below.
    expect(sources.length).toBeGreaterThan(50)
  })

  it.each(RESIDUE)('no live-mode surface carries the sample content %j', (needle) => {
    const hits: string[] = []
    for (const { path, text } of sources) {
      text.split('\n').forEach((line, i) => {
        if (line.toLowerCase().includes(needle.toLowerCase()))
          hits.push(`${path}:${i + 1}  ${line.trim()}`)
      })
    }
    expect(
      hits,
      `Sample content from the demo world reached a customer-facing surface.\n` +
        `A placeholder describes the input; it is never an example from another ` +
        `business (D-UX-0913-C).\n\n${hits.join('\n')}`,
    ).toEqual([])
  })
})
