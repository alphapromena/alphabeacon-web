/**
 * A short sample post in one tone — composed, never generated.
 *
 * ORDER MOTION-0914/B moment 1. A marketer judges the output, not the chrome,
 * and until now the first place they could see any output was after finishing
 * setup and waiting for a run. This is the line that appears beside the tone
 * picker so they can see the product work while they are still setting it up.
 *
 * ## Nothing here calls a generation endpoint, by construction
 *
 * It is a pure function over data the world already holds. There is a real
 * wire for this — `POST /orgs/:id/alphastudio/posts/tones-preview` — and it is
 * deliberately not used: the order forbids it, it costs the org's wallet, and
 * a sample that needs the network cannot be the thing you show somebody in the
 * first minute. `src/data/brand.ts` still owns that call for I4's Preview,
 * where the user asked for a real run.
 *
 * ## Where the words come from, in order
 *
 * 1. **The seeded draft written in that tone** (DEMO-0914's review world).
 *    Real prose of the right length in the right voice, already committed as
 *    demo content, already what the account's Today is full of — so the sample
 *    and the queue tell the same story.
 * 2. **The tone's own example line**, when it has one. A tone somebody wrote
 *    themselves carries their words.
 * 3. **The tone's description**, which every tone has.
 *
 * It never invents a sentence about the business. A workspace's offer line is
 * the owner's claim to make (D-DEMO-0914-B), and a sample that fabricated one
 * would be putting words in their mouth at the exact moment they are deciding
 * whether to trust the product.
 */
import type { Draft, Tone } from '@/data/types'

export interface ToneSample {
  /** The line to show. Never empty for a tone that exists. */
  copy: string
  /** Which of the three sources answered — the card says so, quietly. */
  source: 'draft' | 'example' | 'description'
}

/** Long enough to read as a post, short enough not to become the screen. */
const MAX_CHARS = 180

function trim(copy: string): string {
  const clean = copy.trim()
  if (clean.length <= MAX_CHARS) return clean
  // Cut at a word boundary rather than mid-word; an ellipsis is honest about
  // there being more, which there is.
  const cut = clean.slice(0, MAX_CHARS)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`
}

export function toneSample(tone: Tone | undefined, drafts: Draft[]): ToneSample | null {
  if (!tone) return null

  // The most recent draft in this tone — most recent so the sample tracks what
  // the workspace is actually producing rather than freezing on its oldest.
  const written = drafts
    .filter((draft) => draft.toneId === tone.id && draft.copy.trim().length > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (written) return { copy: trim(written.copy), source: 'draft' }

  const example = tone.example?.trim()
  if (example) return { copy: trim(example), source: 'example' }

  const description = tone.description.trim()
  if (description) return { copy: trim(description), source: 'description' }

  // A tone with no example and no description cannot happen through the
  // editor (description is required), but a wire could answer one.
  return null
}
