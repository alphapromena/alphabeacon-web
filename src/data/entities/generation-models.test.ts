/**
 * D-UX-0913-D, enforced on the surface that got it wrong.
 *
 * `GENERATION_MODELS` is sent as a schedule's `modelAlias`
 * (`fast|balanced|quality`). That wire field says NOTHING about grounding,
 * freshness, knowledge, sources or web research — those belong to the OTHER
 * vocabulary, `ApiPlan` (`balanced|creative|precise`), on the Generate
 * screen's own control.
 *
 * The two render identical labels, which is exactly how ORDER UX-0913/P1 put
 * the Generate control's copy here and got it as far as a commit. This test is
 * the tripwire for the next time.
 */
import { describe, expect, it } from 'vitest'
import { GENERATION_MODELS } from './generation-models'
import { MODEL_ALIAS_BY_ID } from '@/data/adapters/scheduling-adapter'

/** Words that can only be true of `plan`, never of `modelAlias`. */
const GROUNDING_VOCABULARY = [
  'grounded',
  'grounding',
  'knowledge',
  'sources',
  'web search',
  'facts',
  'research',
] as const

describe('the schedule picker speaks only modelAlias (D-UX-0913-D)', () => {
  it('still describes every option', () => {
    // A table that lost its rows would pass every assertion below.
    expect(GENERATION_MODELS.length).toBe(3)
    for (const model of GENERATION_MODELS) expect(model.description.trim()).not.toBe('')
  })

  it('maps every option to a modelAlias, and to nothing else', () => {
    // The claim this whole test rests on: these rows go to `modelAlias`.
    for (const model of GENERATION_MODELS) {
      expect(MODEL_ALIAS_BY_ID[model.id], `${model.id} has no modelAlias`).toBeDefined()
    }
  })

  it.each(GROUNDING_VOCABULARY)('no description claims %j', (word) => {
    const offenders = GENERATION_MODELS.filter((model) =>
      model.description.toLowerCase().includes(word),
    ).map(
      (model) => `${model.id} → modelAlias '${MODEL_ALIAS_BY_ID[model.id]}': ${model.description}`,
    )

    expect(
      offenders,
      `A schedule model description made a grounding claim.\n\n` +
        `These rows are sent as modelAlias (fast|balanced|quality), which carries no ` +
        `grounding behaviour. Grounding copy belongs to the Generate screen's plan ` +
        `control (PLANS in live-generate.tsx), sent as ApiPlan. The two render the ` +
        `same three labels — that is the trap (D-UX-0913-D).\n\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})
