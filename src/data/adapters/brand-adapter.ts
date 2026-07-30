/**
 * Brand adapter (INT-3): AlphaStudio's four brand resources → the app's
 * model, adapting HONESTLY where the wire is narrower (docs/api/api.md):
 *
 * - **Tones**: the API stores `{name, description, preset}` — no rules, no
 *   example. `preset` maps to `kind`; `rules` come back empty and `example`
 *   absent, and the editors for them are DISABLED in live mode with a note
 *   (open-items: backend asked for the fields). Nothing is smuggled into
 *   `description`.
 * - **Voices**: one description per row. The app's do/don't/examples split has
 *   no wire home, so live mode carries ONE flat rule list (each row = one
 *   rule); the don't/example editors are disabled with the same note.
 * - **Sources**: `{url, title}` ↔ `FollowedSource` — the app stores addresses
 *   scheme-less by law; the adapter strips on read and the seam restores a
 *   secure scheme on write.
 * - **Topics**: rows of `{description}` ↔ the app's `string[]`.
 *
 * Alongside the world shapes, the adapter returns the id maps mutations need
 * (rule text → voice id, topic text → topic id); sources and tones keep the
 * API id as their own id, so they need no map.
 */
import type { ApiSource, ApiTone, ApiTopic, ApiVoice } from '@/api/types'
import type { FollowedSource, Tone } from '@/data/types'
import { normalizeSourceUrl } from '@/lib/source-url'

export interface BrandGraft {
  tones: Tone[]
  voiceRules: string[]
  voiceIdByRule: Record<string, string>
  sources: FollowedSource[]
  topics: string[]
  topicIdByText: Record<string, string>
}

export function adaptBrand(
  tones: ApiTone[],
  voices: ApiVoice[],
  sources: ApiSource[],
  topics: ApiTopic[],
): BrandGraft {
  return {
    tones: tones.map((tone) => ({
      id: tone.id,
      name: tone.name,
      kind: tone.preset ? 'preset' : 'custom',
      description: tone.description,
      rules: { do: [], dont: [] },
    })),
    voiceRules: voices.map((voice) => voice.description),
    voiceIdByRule: Object.fromEntries(voices.map((voice) => [voice.description, voice.id])),
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
