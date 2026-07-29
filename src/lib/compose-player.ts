/**
 * F1's stream, made of a script and a timer.
 *
 * The app is static, so nothing is being generated — but everything downstream
 * of the stream is real: the partial text a drop leaves behind is the text that
 * was on screen, a stop keeps exactly what had arrived, and a completed run
 * hands back copy that becomes an ordinary draft in the ordinary queue.
 *
 * Selection is deliberately boring and testable: `pickScript` is pure, so which
 * outcome a prompt produces is provable without rendering anything, and the
 * component below it only ever asks "what word are we on".
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { COMPOSE_SCRIPTS, type ComposeScript } from '@/data/compose-scripts'
import type { Claim } from '@/data/types'

/**
 * On-demand runs allowed per session. F1 shows what is left, because a limit
 * discovered only by hitting it is a trap rather than a limit.
 */
export const COMPOSE_LIMIT = 3

/** Milliseconds between emitted words — fast enough to read, slow enough to see. */
export const COMPOSE_TOKEN_MS = 26

export type ComposePhase =
  | 'idle'
  | 'streaming'
  | 'complete'
  /** The stream broke. Partial text is preserved and resumable. */
  | 'dropped'
  /** The user stopped it. Same preservation, different cause. */
  | 'stopped'
  | 'rate_limited'

export function tokenize(copy: string): string[] {
  return copy.split(/\s+/).filter(Boolean)
}

/**
 * Which run a prompt gets.
 *
 * The allowance is checked first: being out of runs beats anything the prompt
 * asks for, and it must not be possible to type your way past it.
 */
export function pickScript(
  prompt: string,
  runsUsed: number,
  scripts: ComposeScript[] = COMPOSE_SCRIPTS,
): ComposeScript {
  const refusal = scripts.find((script) => script.outcome === 'rate_limited')
  if (runsUsed >= COMPOSE_LIMIT && refusal) return refusal

  const words = prompt.toLowerCase()
  const triggered = scripts.find((script) => script.trigger && words.includes(script.trigger))
  if (triggered) return triggered

  const fallback = scripts.find((script) => !script.trigger && script.outcome !== 'rate_limited')
  if (!fallback) throw new Error('compose-scripts must include one untriggered default script')
  return fallback
}

export interface ComposePlayer {
  phase: ComposePhase
  script?: ComposeScript
  /** Exactly what is on screen — never the full copy while streaming. */
  text: string
  /** Grounding that has surfaced so far; a flagged one is shown, never dropped. */
  claims: Claim[]
  runsUsed: number
  runsLeft: number
  start: (prompt: string) => void
  stop: () => void
  /** Picks a broken or stopped run back up from where it left off. */
  resume: () => void
  reset: () => void
}

export function useComposePlayer(tokenMs: number = COMPOSE_TOKEN_MS): ComposePlayer {
  const [script, setScript] = useState<ComposeScript | undefined>(undefined)
  const [phase, setPhase] = useState<ComposePhase>('idle')
  const [emitted, setEmitted] = useState(0)
  const [runsUsed, setRunsUsed] = useState(0)
  /** Once a drop has been recovered it must not fire again at the same word. */
  const [recovered, setRecovered] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const words = script ? tokenize(script.copy) : []
  const endsAt =
    script?.outcome === 'dropped' && !recovered
      ? Math.min(script.dropAfterWord ?? words.length, words.length)
      : words.length

  useEffect(() => {
    if (phase !== 'streaming' || !script) return
    if (emitted >= endsAt) {
      setPhase(script.outcome === 'dropped' && !recovered ? 'dropped' : 'complete')
      return
    }
    timer.current = window.setTimeout(() => setEmitted((n) => n + 1), tokenMs)
    return () => window.clearTimeout(timer.current)
  }, [phase, script, emitted, endsAt, recovered, tokenMs])

  const start = useCallback(
    (prompt: string) => {
      const next = pickScript(prompt, runsUsed)
      setScript(next)
      setEmitted(0)
      setRecovered(false)
      // A refused run costs nothing; it never started.
      if (next.outcome === 'rate_limited') {
        setPhase('rate_limited')
        return
      }
      setRunsUsed((n) => n + 1)
      setPhase('streaming')
    },
    [runsUsed],
  )

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    setPhase((current) => (current === 'streaming' ? 'stopped' : current))
  }, [])

  const resume = useCallback(() => {
    setRecovered(true)
    setPhase('streaming')
  }, [])

  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    setScript(undefined)
    setEmitted(0)
    setRecovered(false)
    setPhase('idle')
  }, [])

  return {
    phase,
    script,
    text: words.slice(0, emitted).join(' '),
    claims: (script?.claims ?? [])
      .filter((entry) => entry.afterWord <= emitted)
      .map((entry) => entry.claim),
    runsUsed,
    runsLeft: Math.max(0, COMPOSE_LIMIT - runsUsed),
    start,
    stop,
    resume,
    reset,
  }
}
