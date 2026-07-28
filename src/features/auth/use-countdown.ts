/**
 * Seconds remaining until a deadline, ticking once a second and settling on 0.
 *
 * Shared by A2's lockout and A3's resend cooldown — both need the same honest
 * behaviour: a real number that reaches zero and then stays there, so the UI
 * can re-enable itself without the user reloading to find out they may retry.
 */
import { useEffect, useState } from 'react'

export function useCountdown(deadline: number | undefined): number {
  const remaining = () => (deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0)
  const [seconds, setSeconds] = useState(remaining)

  useEffect(() => {
    if (!deadline) {
      setSeconds(0)
      return
    }
    setSeconds(remaining())
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(next)
      if (next === 0) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
    // `remaining` closes over `deadline`, which is the only real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline])

  return seconds
}

/** "1:05" / "0:09" — mono in the UI, so the digits do not jump as they tick. */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
