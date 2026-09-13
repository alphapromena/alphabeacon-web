/**
 * Brand adapter: AlphaStudio's four brand resources → the app's model.
 *
 * REWRITTEN in INT-7 for the 2026-08-17 contract, which gave voices and tones
 * the thing INT-3 had to disable: a real `rules[]` of `{id, kind: do|dont,
 * text}`, embedded in every read (open-items 7, now partly closed).
 *
 * - **Tones** (D-INT-C): `rules[]` ↔ the app's `{do, dont}`, both ways.
 *   `preset` arrives on every read and is IGNORED — the concept is gone
 *   client-side (CUT-0831) while the wire keeps the field. `example` STILL
 *   has no wire home, so it is
 *   never smuggled into `description` and its editor stays disabled.
 * - **Voices** (D-INT-B, AMENDED 2026-09-13): the app has ONE brand voice; the
 *   wire has a list of voice rows. Reads take the CANONICAL row's rules and
 *   only those, because that is the one row a write replaces. Until today the
 *   read flattened every row while the write PATCHed one, so the screen
 *   showed a merged list and every save wrote that merge back onto the
 *   canonical row — 18 rules became 94 across five saves on org 1867, and
 *   past the wire's 50-rule limit every PATCH came back 400 (item 65).
 *   Read and write now address the same thing.
 *
 *   Extra rows are NOT silently hidden. The backend still builds its context
 *   bundle from every voice row, so rules this screen stops showing would go
 *   on shaping drafts invisibly — the worst of both worlds. They are counted
 *   into `extraVoiceRows` and the screen says so plainly. Nothing is migrated
 *   or deleted here: that is a destructive change and it is not this order's.
 *   INT-3-era rows (description-as-rule, no rules) carry no rules at all, so
 *   they contribute nothing and are not counted.
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
import type { BrandVoice, FollowedSource, Tone, ToneLanguage, ToneLength } from '@/data/types'
import { normalizeSourceUrl } from '@/lib/source-url'

/** The wire may one day echo these; only the app's own vocabulary is read. */
const isToneLanguage = (value: unknown): value is ToneLanguage => value === 'ar' || value === 'en'
const isToneLength = (value: unknown): value is ToneLength =>
  value === 'short' || value === 'medium' || value === 'long'

/** The one voice row the app writes to (D-INT-B). Matched case-insensitively
 *  so a row typed by hand in another client still resolves. */
export const CANONICAL_VOICE_NAME = 'Brand voice'

/** A voice row the screen does not edit, but whose rules still reach drafts. */
export interface ExtraVoiceRow {
  id: string
  name: string
  ruleCount: number
}

export interface BrandGraft {
  tones: Tone[]
  /** The CANONICAL row's rules — the exact list a save replaces (D-INT-B). */
  brandVoice: BrandVoice
  /** The row writes target; `null` when the org has none yet (create lazily). */
  canonicalVoiceId: string | null
  /**
   * Rows that are not the canonical one and still carry rules. The screen
   * cannot edit them and must not pretend they are gone: the server's context
   * bundle reads every row, so these rules keep shaping drafts.
   */
  extraVoiceRows: ExtraVoiceRow[]
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

  // The canonical row is picked in CREATION order, so an org that ended up
  // with two rows of the same name keeps editing the OLDEST — the one the
  // product wrote first. Picking the newest would move the target every time
  // a stray row appeared, which is how org 1867 grew its second row.
  const canonical = inCreationOrder.find(
    (voice) => voice.name?.trim().toLowerCase() === CANONICAL_VOICE_NAME.toLowerCase(),
  )

  // Read what a write replaces, and nothing else (D-INT-B, amended).
  const canonicalRules = splitRules(canonical?.rules)

  const extraVoiceRows = inCreationOrder
    .filter((voice) => voice.id !== canonical?.id)
    .map((voice) => ({
      id: voice.id,
      name: voice.name?.trim() || CANONICAL_VOICE_NAME,
      ruleCount: (voice.rules ?? []).length,
    }))
    .filter((row) => row.ruleCount > 0)

  return {
    tones: tones.map((tone) => ({
      id: tone.id,
      name: tone.name,
      description: tone.description,
      rules: splitRules(tone.rules),
      // HSN-03: read ONLY when the server echoes them — it does not yet. The
      // interim client sidecar fills the gap one layer up (`tone-fields.ts`),
      // and a server value always wins over it.
      ...(isToneLanguage(tone.language) ? { language: tone.language } : {}),
      ...(isToneLength(tone.length) ? { length: tone.length } : {}),
    })),
    brandVoice: {
      ...canonicalRules,
      // No wire home yet (open-items 7): absent, never fabricated.
      examples: [],
    },
    canonicalVoiceId: canonical?.id ?? null,
    extraVoiceRows,
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
