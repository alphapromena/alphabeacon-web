/**
 * Brand adapter: AlphaStudio's four brand resources → the app's model.
 *
 * REWRITTEN in INT-7 for the 2026-08-17 contract, which gave voices and tones
 * the thing INT-3 had to disable: a real `rules[]` of `{id, kind: do|dont,
 * text}`, embedded in every read (open-items 7, now partly closed).
 *
 * - **Tones** (D-INT-C): `rules[]` ↔ the app's `{do, dont}`, both ways.
 *   `preset` still maps to `kind`. `example` STILL has no wire home, so it is
 *   never smuggled into `description` and its editor stays disabled.
 * - **Voices** (D-INT-B): the app has ONE brand voice; the wire has a list of
 *   voice rows. Reads FLATTEN every row's rules in creation order — which is
 *   exactly how the backend builds the context bundle it pushes for
 *   generation, so what the user reads here is what the next run is grounded
 *   on. Writes go to ONE canonical row named `Brand voice`, resolved here so
 *   the seam never has to guess. INT-3-era rows (description-as-rule, no
 *   rules) exist only on QA orgs and are left alone rather than migrated —
 *   their rules list is simply empty, so they contribute nothing.
 *   `examples` still has no wire home; disabled, not invented.
 * - **Sources**: `{url, title}` ↔ `FollowedSource` — addresses are stored
 *   scheme-less by law; the adapter strips on read, the seam restores on write.
 * - **Topics**: rows of `{description}` ↔ the app's `string[]`.
 *
 * Alongside the world shapes it returns the ids mutations need. Voices no
 * longer need a text→id map: the canonical row id is the only handle a write
 * uses, which is what removed INT-3's edit-jumps-to-top behaviour
 * (open-items 12) from the voice surface entirely.
 */
import type { ApiRule, ApiSource, ApiTone, ApiTopic, ApiVoice } from '@/api/types'
import type { BrandVoice, FollowedSource, Tone } from '@/data/types'
import { normalizeSourceUrl } from '@/lib/source-url'

/** The one voice row the app writes to (D-INT-B). Matched case-insensitively
 *  so a row typed by hand in another client still resolves. */
export const CANONICAL_VOICE_NAME = 'Brand voice'

export interface BrandGraft {
  tones: Tone[]
  /** Every voice's rules, flattened in creation order — the bundle's own order. */
  brandVoice: BrandVoice
  /** The row writes target; `null` when the org has none yet (create lazily). */
  canonicalVoiceId: string | null
  sources: FollowedSource[]
  topics: string[]
  topicIdByText: Record<string, string>
}

/** `rules[]` → the app's split. Unknown kinds are ignored, never guessed into
 *  a bucket: a rule filed under the wrong half would invert its meaning. */
export function splitRules(rules: ApiRule[] | undefined): { do: string[]; dont: string[] } {
  const split = { do: [] as string[], dont: [] as string[] }
  for (const rule of rules ?? []) {
    if (rule.kind === 'do') split.do.push(rule.text)
    else if (rule.kind === 'dont') split.dont.push(rule.text)
  }
  return split
}

/** The app's split → `rules[]` for a create or a whole-list PATCH. */
export function joinRules(rules: { do: string[]; dont: string[] }) {
  return [
    ...rules.do.map((text) => ({ kind: 'do' as const, text })),
    ...rules.dont.map((text) => ({ kind: 'dont' as const, text })),
  ]
}

export function adaptBrand(
  tones: ApiTone[],
  voices: ApiVoice[],
  sources: ApiSource[],
  topics: ApiTopic[],
): BrandGraft {
  // Creation order, because that is the order the context bundle is built in.
  // The list arrives newest-first (`createdAt DESC`), so it is reversed here
  // rather than sorted on a date string.
  const inCreationOrder = [...voices].reverse()
  const flattened = { do: [] as string[], dont: [] as string[] }
  for (const voice of inCreationOrder) {
    const split = splitRules(voice.rules)
    flattened.do.push(...split.do)
    flattened.dont.push(...split.dont)
  }

  const canonical = voices.find(
    (voice) => voice.name?.trim().toLowerCase() === CANONICAL_VOICE_NAME.toLowerCase(),
  )

  return {
    tones: tones.map((tone) => ({
      id: tone.id,
      name: tone.name,
      kind: tone.preset ? 'preset' : 'custom',
      description: tone.description,
      rules: splitRules(tone.rules),
    })),
    brandVoice: {
      ...flattened,
      // No wire home yet (open-items 7): absent, never fabricated.
      examples: [],
    },
    canonicalVoiceId: canonical?.id ?? null,
    sources: sources.map((source) => ({
      id: source.id,
      url: normalizeSourceUrl(source.url),
      name: source.title,
      addedAt: source.createdAt,
    })),
    topics: topics.map((topic) => topic.description),
    topicIdByText: Object.fromEntries(topics.map((topic) => [topic.description, topic.id])),
  }
}
