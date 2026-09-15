/**
 * True for one play, on the render where a value FIRST becomes the one watched
 * for. Used by moment 3 (ORDER MOTION-0914/B) to catch a draft turning
 * `approved`.
 *
 * An edge, not a state — the same distinction `useContentEntrance` draws. A
 * draft stays approved for the rest of its life, so keying a celebration off
 * the value itself would replay it on every re-render of the queue, and
 * re-mount it on every navigation back to Today. A person approves a draft
 * once; the moment happens once.
 *
 * It deliberately does NOT fire when a card mounts already in the target
 * state. Arriving at a screen where something is already done is not the same
 * event as finishing it, and celebrating the former is how a moment becomes
 * wallpaper.
 */
import { useEffect, useRef, useState } from 'react'

export function useStatusArrival<T>(value: T, target: T, holdMs = 700): boolean {
  const previous = useRef<T>(value)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    const was = previous.current
    previous.current = value
    if (was !== target && value === target) setArrived(true)
  }, [value, target])

  useEffect(() => {
    if (!arrived) return
    const timer = window.setTimeout(() => setArrived(false), holdMs)
    return () => window.clearTimeout(timer)
  }, [arrived, holdMs])

  return arrived
}
