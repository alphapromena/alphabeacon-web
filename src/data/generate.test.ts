/**
 * The run shape and the ledger (INT-10). Both are places where a silent wrong
 * answer is the failure mode: a draft whose tone and rationale read
 * `undefined` still renders, and a ledger that never drops a dead id looks
 * like a working history until every entry 404s.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { GenerationRun } from './generate'
import {
  draftsFromRun,
  forgetRun,
  isRunTerminal,
  readLedger,
  rememberRun,
  toRunTone,
} from './generate'

/** Verbatim from Docs/api/alphastudio-shapes.md — a real completed run. */
const OBSERVED: GenerationRun = {
  runId: 'run_bcff55c15099774a756bea95',
  capability: 'social-posts.generate',
  mode: 'batch',
  status: 'completed',
  outputs: [
    {
      index: 0,
      content: {
        toneId: 'smoke-tone',
        content: "Today's roast is from the Flores farm.",
        rationale: 'It names the farm, as the tone asks.',
      },
      judge: { score: 0.2, voice: 0.2, grounding: 0, repetition: 0 },
      flags: [],
      attributions: [],
      proposalId: 'prop_bf6fd4c695b9c20418ac5050',
    },
  ],
}

describe('draftsFromRun', () => {
  it('reads toneId and rationale from INSIDE content, where they actually live', () => {
    // The trap D-INT-H caught: a type with these at the output level compiles,
    // renders, and shows a tone-less rationale-less draft forever.
    const [draft] = draftsFromRun(OBSERVED)
    expect(draft.toneId).toBe('smoke-tone')
    expect(draft.rationale).toBe('It names the farm, as the tone asks.')
    expect(draft.content).toBe("Today's roast is from the Flores farm.")
  })

  it('keeps the proposalId without rendering it', () => {
    // Proposals are not proxied yet; the id is the handle the day they are.
    expect(draftsFromRun(OBSERVED)[0].proposalId).toBe('prop_bf6fd4c695b9c20418ac5050')
  })

  it('defaults flags and attributions to arrays, so a card never crashes on them', () => {
    const run: GenerationRun = {
      runId: 'run_x',
      status: 'completed',
      outputs: [{ index: 0, content: { content: 'A line.' } }],
    }
    const [draft] = draftsFromRun(run)
    expect(draft.flags).toEqual([])
    expect(draft.attributions).toEqual([])
  })

  it('survives a run with no outputs', () => {
    expect(draftsFromRun({ runId: 'run_y', status: 'completed' })).toEqual([])
  })
})

describe('isRunTerminal', () => {
  it('uses the RUN vocabulary, never a media job one', () => {
    // A media job reaches `succeeded`; a run reaches `completed`. Sharing a
    // predicate between them would poll one of the two forever.
    expect(isRunTerminal({ runId: 'r', status: 'completed' })).toBe(true)
    expect(isRunTerminal({ runId: 'r', status: 'failed' })).toBe(true)
    expect(isRunTerminal({ runId: 'r', status: 'queued' })).toBe(false)
    expect(isRunTerminal({ runId: 'r', status: 'running' })).toBe(false)
    expect(isRunTerminal(null)).toBe(false)
  })
})

describe('toRunTone', () => {
  it('sends the tone whole, with its rules, and omits an absent example', () => {
    const sent = toRunTone({
      id: 'tone_1',
      name: 'Roastery floor',
      kind: 'custom',
      description: 'Warm and specific.',
      rules: { do: ['Name the farm'], dont: ['Say artisanal'] },
    })
    expect(sent).toEqual({
      id: 'tone_1',
      name: 'Roastery floor',
      description: 'Warm and specific.',
      rules: [
        { kind: 'do', text: 'Name the farm' },
        { kind: 'dont', text: 'Say artisanal' },
      ],
    })
    expect('example' in sent).toBe(false)
  })
})

describe('the run ledger', () => {
  beforeEach(() => window.localStorage.clear())

  it('remembers newest first and never twice', () => {
    rememberRun('1', 'run_a')
    rememberRun('1', 'run_b')
    rememberRun('1', 'run_a')
    expect(readLedger('1').map((entry) => entry.runId)).toEqual(['run_a', 'run_b'])
  })

  it('is scoped per org, so one workspace never shows another one runs', () => {
    rememberRun('1', 'run_a')
    rememberRun('2', 'run_b')
    expect(readLedger('1').map((e) => e.runId)).toEqual(['run_a'])
    expect(readLedger('2').map((e) => e.runId)).toEqual(['run_b'])
  })

  it('drops an id on request — a 404 must not linger as a dead row', () => {
    rememberRun('1', 'run_a')
    rememberRun('1', 'run_b')
    expect(forgetRun('1', 'run_a').map((e) => e.runId)).toEqual(['run_b'])
  })

  it('treats a corrupt ledger as empty rather than an error state', () => {
    window.localStorage.setItem('ab-live-runs-1', '{ not json')
    expect(readLedger('1')).toEqual([])
    window.localStorage.setItem('ab-live-runs-1', '{"runId":"nope"}')
    expect(readLedger('1')).toEqual([])
  })

  it('answers empty without an org, instead of throwing', () => {
    expect(readLedger(null)).toEqual([])
  })
})
