/**
 * Brand readiness — the ONE source of truth for "may this workspace generate?"
 * (ORDER ONB-0827, decisions.md D-ONB-D).
 *
 * Hasan's ruling: nothing generates — posts or any Studio media job — until
 * the org's brand setup is complete. With the wizard deleted (D-ONB-C) there
 * is no longer a moment that guarantees setup happened, so the guarantee has
 * to live where the data does. Every generation entry point reads this hook;
 * none of them decides for itself what "ready" means.
 *
 * ## What is a hard gate, and why
 *
 * The PHASE-0 PROBE settled it against the deployed API rather than by
 * argument (2026-08-28, two fresh QA orgs):
 *
 *   (a) org 954 with ONLY the four brand entities — one voice, one tone, one
 *       source, one topic — and NO country and NO schedule ran the exact
 *       `posts/generate` body the app sends today: **202**, request
 *       `60c06fd5-acb7-4060-81d5-4a7b8113ebeb`, run completed with real copy.
 *       `slot` is synthesized client-side (`generate.ts`), so the absent
 *       schedule costs nothing.
 *   (b) org 955 with voice + source + topic and ZERO tones: **400
 *       `bad_request`** — "The generation service rejected the request — check
 *       the body against the capability's schema", request
 *       `ae30783f-f28d-4d5a-9ac6-88c92da1a2a9`. No field details, nothing a
 *       user could act on. That refusal is what this gate exists to make sure
 *       nobody ever sees.
 *
 * So the HARD gate is the four brand entities and nothing else. The country
 * and the schedule are real setup and appear in the checklist — they buy
 * holidays and scheduled posting — but they do not block a run, and pretending
 * they did would be a lie the wire disproves.
 *
 * ## Two traps this file is written against
 *
 * **Trap 19 — a fact to RECORD, not to infer from a moving reference.**
 * Everything here is derived from provider state on the render that reads it.
 * There is no ref, no cached snapshot, no "have we synced yet" flag of our
 * own: the answer cannot go stale because it is never stored.
 *
 * **Trap 20 — a null wire answer must never fall through to demo data.** In
 * live mode the world is SEEDED before the sync lands, so `world.tones` is the
 * demo's five until `live/orgSynced` replaces them. Reading readiness in that
 * window would report a workspace ready on somebody else's data. So live
 * readiness is `known: false` until the sync says `ready`, and callers render
 * their loading state rather than guessing in either direction. Unknown is not
 * blocked, and it is certainly not ready.
 *
 * Static mode reports ready: the demo world is a configured workspace and the
 * order leaves it untouched.
 */
import {
  useFollowedSources,
  useLiveSyncSettled,
  useOrg,
  useSchedule,
  useTones,
  useTopics,
} from '@/data/provider'

/** The items a checklist can name, in the order it names them. */
export type ReadinessItemId = 'voice' | 'tones' | 'sources' | 'topics' | 'country' | 'schedule'

export interface ReadinessItem {
  id: ReadinessItemId
  /** Short label for the checklist row. */
  label: string
  /** What it is for, said plainly. */
  detail: string
  done: boolean
  /** Where to go and finish it — a real route, never a dead row. */
  to: string
  /**
   * Whether generation is refused without it. The four brand entities are
   * `true`; country and schedule are `false` (the Phase-0 ruling above).
   */
  blocking: boolean
}

export interface Readiness {
  /**
   * False while live mode is still syncing. Callers MUST render loading, not
   * a blocked state and not an enabled one (trap 20).
   */
  known: boolean
  /** True when every blocking item is done — the answer the gates read. */
  canGenerate: boolean
  /** Every item, blocking or not, in checklist order. */
  items: ReadinessItem[]
  /** The blocking items still outstanding — what a blocked state names. */
  missing: ReadinessItem[]
}

/** What the derivation needs, and nothing more — so it can be tested flat. */
export interface ReadinessInput {
  /** False while the live sync is in flight (trap 20). */
  known: boolean
  brandVoice: { do: string[]; dont: string[] }
  toneCount: number
  sourceCount: number
  topicCount: number
  country?: string | null
  activeDayCount: number
}

/**
 * The pure half, so the ruling can be tested without a React tree.
 *
 * `component files may not export non-components` is a fast-refresh rule, not
 * a testing one — but the same instinct applies here: a decision this load
 * bearing should be assertable as a function, not only through a rendered
 * screen.
 */
export function deriveReadiness(input: ReadinessInput): Readiness {
  const voice = input.brandVoice
  const items: ReadinessItem[] = [
    {
      id: 'voice',
      label: 'Brand voice',
      detail: 'The rules every draft follows, whatever tone it is written in.',
      done: voice.do.length + voice.dont.length > 0,
      to: '/settings/brand-voice',
      blocking: true,
    },
    {
      id: 'tones',
      label: 'At least one tone',
      detail: 'How a draft should sound. Nothing generates without one.',
      done: input.toneCount > 0,
      to: '/settings/tones',
      blocking: true,
    },
    {
      id: 'sources',
      label: 'Sources',
      detail: 'What drafts read before they write.',
      done: input.sourceCount > 0,
      to: '/settings/sources',
      blocking: true,
    },
    {
      id: 'topics',
      label: 'Topics',
      detail: 'What this workspace talks about.',
      done: input.topicCount > 0,
      to: '/settings/sources',
      blocking: true,
    },
    {
      id: 'country',
      label: 'Country',
      detail: 'Needed for holidays — drafts work around your calendar.',
      done: Boolean(input.country),
      to: '/settings/organization',
      blocking: false,
    },
    {
      id: 'schedule',
      label: 'Posting rhythm',
      detail: 'Needed for scheduled posting — which days, and how many.',
      done: input.activeDayCount > 0,
      to: '/calendar/settings',
      blocking: false,
    },
  ]

  const missing = items.filter((item) => item.blocking && !item.done)

  return {
    known: input.known,
    // Unknown is never ready. A caller that has not waited gets `false` here
    // AND `known: false`, which is what tells it to render loading instead of
    // a refusal.
    canGenerate: input.known && missing.length === 0,
    items,
    missing,
  }
}

/**
 * The hook every gate reads. Every value comes through a provider hook, like
 * every other screen: this selector has no privileged access to the world and
 * no second opinion about where the data came from.
 */
export function useReadiness(): Readiness {
  const org = useOrg()
  const tones = useTones()
  const sources = useFollowedSources()
  const topics = useTopics()
  const schedule = useSchedule()
  // Trap 20: in live mode the seeded world is not this org's data until the
  // sync has replaced it. Until then we know nothing, and say so.
  const known = useLiveSyncSettled()

  return deriveReadiness({
    known,
    brandVoice: org.brandVoice,
    toneCount: tones.length,
    sourceCount: sources.length,
    topicCount: topics.length,
    country: org.country,
    activeDayCount: schedule.activeDays.length,
  })
}
