/**
 * W6 Verify: "all five compose scripts render (happy, flagged, failed→recovery,
 * stopped, rate-limited)."
 *
 * The e2e proves they render; this proves they are all REACHABLE and internally
 * sound — a script whose flag fires past the end of its own copy would render
 * perfectly and still be broken.
 */
import { describe, expect, it } from 'vitest'
import { COMPOSE_SCRIPTS } from '@/data/compose-scripts'
import { COMPOSE_LIMIT, pickScript, tokenize } from '@/lib/compose-player'

describe('the compose script catalogue', () => {
  it('covers every outcome F1 has to render', () => {
    const outcomes = new Set(COMPOSE_SCRIPTS.map((script) => script.outcome))
    expect(outcomes).toEqual(new Set(['complete', 'dropped', 'rate_limited']))
    // Five scripts, one of them long enough that stopping is a real choice.
    expect(COMPOSE_SCRIPTS).toHaveLength(5)
    const longest = Math.max(...COMPOSE_SCRIPTS.map((script) => tokenize(script.copy).length))
    expect(longest).toBeGreaterThan(100)
  })

  it('has exactly one untriggered default, so any prompt produces a run', () => {
    const defaults = COMPOSE_SCRIPTS.filter(
      (script) => !script.trigger && script.outcome !== 'rate_limited',
    )
    expect(defaults).toHaveLength(1)
  })

  it('keeps every flag and every drop inside its own copy', () => {
    for (const script of COMPOSE_SCRIPTS) {
      const words = tokenize(script.copy).length
      for (const entry of script.claims) {
        expect(entry.afterWord).toBeGreaterThan(0)
        expect(entry.afterWord).toBeLessThanOrEqual(words)
      }
      if (script.outcome === 'dropped') {
        expect(script.dropAfterWord).toBeDefined()
        expect(script.dropAfterWord ?? 0).toBeLessThan(words)
        // A drop with nothing to preserve is not the state being designed.
        expect(script.dropAfterWord ?? 0).toBeGreaterThan(0)
        expect(script.dropReason).toBeTruthy()
      }
    }
  })

  it('reaches the guardrail path with a flagged claim that is shown, not hidden', () => {
    const flagged = COMPOSE_SCRIPTS.find((script) =>
      script.claims.some((entry) => entry.claim.state === 'flagged'),
    )
    expect(flagged).toBeDefined()
    // Flagging does not stop the run: the outcome is still a finished draft.
    expect(flagged?.outcome).toBe('complete')
  })
})

describe('pickScript', () => {
  it('falls back to the default run for an ordinary prompt', () => {
    expect(pickScript('Write about the new Kenyan lot', 0).id).toBe('cs_launch')
  })

  it('matches a trigger anywhere in the prompt, case-insensitively', () => {
    expect(pickScript('How do we compare to a COMPETITOR?', 0).outcome).toBe('complete')
    expect(pickScript('How do we compare to a COMPETITOR?', 0).id).toBe('cs_competitor')
    expect(pickScript('A Breaking market story', 0).outcome).toBe('dropped')
  })

  it('refuses once the allowance is spent, whatever the prompt says', () => {
    expect(pickScript('write about a competitor', COMPOSE_LIMIT).outcome).toBe('rate_limited')
    expect(pickScript('anything at all', COMPOSE_LIMIT + 4).outcome).toBe('rate_limited')
    // And not one run early.
    expect(pickScript('anything at all', COMPOSE_LIMIT - 1).outcome).not.toBe('rate_limited')
  })
})

describe('tokenize', () => {
  it('emits words, dropping the whitespace between them', () => {
    expect(tokenize('  one   two\nthree ')).toEqual(['one', 'two', 'three'])
  })

  it('is empty for the refusal script, which never streams a token', () => {
    const refusal = COMPOSE_SCRIPTS.find((script) => script.outcome === 'rate_limited')
    expect(tokenize(refusal?.copy ?? '')).toEqual([])
  })
})
