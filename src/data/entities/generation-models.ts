import type { GenerationModel } from '@/data/types'

/**
 * Copy-drafting models — friendly names only, never vendor ids.
 *
 * ⚠️ TWO VOCABULARIES, IDENTICAL LABELS (D-UX-0913-D). These rows render
 * "Balanced", "Creative" and "Precise" — and so does the Generate screen's
 * plan control in `src/features/generate/live-generate.tsx` (`PLANS`). They
 * are NOT the same thing and their copy is not interchangeable:
 *
 *   THIS table  → a schedule's `modelAlias`, wire values `fast|balanced|quality`
 *   PLANS there → an on-demand run's `plan`,  wire values `balanced|creative|precise`
 *
 * ORDER UX-0913/P1 put the Generate control's grounding copy on THIS table and
 * it shipped as far as a commit before the founder caught it. The labels are
 * why it was invisible. **Before editing any description below, name the wire
 * field it is sent as** — here that is `modelAlias`, mapped ONLY by
 * `MODEL_ALIAS_BY_ID` in `src/data/adapters/scheduling-adapter.ts`.
 *
 * So: nothing below may make a grounding, freshness, knowledge, sources or
 * web-research claim. `modelAlias` says nothing about any of them.
 * `generation-models.test.ts` fails the build if one creeps back in.
 */
export const GENERATION_MODELS: GenerationModel[] = [
  {
    id: 'gm_balanced',
    name: 'Balanced',
    // → modelAlias 'balanced' (confirmed). Both facts are checkable in code:
    // it is the fallback in BOTH directions (scheduling-adapter.ts `?? 'gm_balanced'`,
    // scheduling.ts `?? 'balanced'`), and its tier is 'free'.
    description: 'The default. Every plan can use it.',
    tier: 'free',
  },
  {
    id: 'gm_creative',
    name: 'Creative',
    // → modelAlias 'fast', UNCONFIRMED — taken by elimination, open-items 9.
    // DELIBERATELY LEFT AS IT WAS (the founder, UX-0913/P1-R): any sentence
    // describing this option's behaviour could become false the moment Hasan
    // confirms the mapping, so the old line stands rather than a new invention.
    // Note the tension that makes the point: "a touch slower" sits oddly next
    // to an alias literally named `fast`.
    description: 'Bolder angles and fresher hooks; a touch slower.',
    tier: 'pro',
  },
  {
    id: 'gm_precise',
    name: 'Precise',
    // → modelAlias 'quality' (confirmed). The alias name is the only evidence
    // we have, and it is enough for this and nothing more. The previous line,
    // "Tightest grounding to your sources", claimed a grounding behaviour
    // `modelAlias` does not carry.
    description: 'Our highest-quality drafting model.',
    tier: 'pro',
  },
]
