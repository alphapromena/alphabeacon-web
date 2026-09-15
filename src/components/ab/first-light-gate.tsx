/**
 * Whether moment 2 plays, decided in one place.
 *
 * Split from `FirstLight` itself so the animation is a dumb component a test
 * can render directly, and so the three conditions that gate it are readable
 * together rather than scattered through an overlay:
 *
 *   1. the verify flow armed it (a workspace was just created, and it landed);
 *   2. this account has never seen it (`lib/first-light.ts`, localStorage);
 *   3. this person has not asked for stillness.
 *
 * Condition 3 is JS rather than CSS because the overlay owns timers, and a
 * hidden-but-mounted overlay would still swallow two seconds of clicks. The
 * end state of first light is "you are in the product", which is exactly where
 * skipping it leaves you — so not mounting it IS the collapse.
 */
import { useEffect, useRef } from 'react'
import { FirstLight } from '@/components/ab/first-light'
import { useDataDispatch, useFirstLight } from '@/data/provider'
import { hasSeenFirstLight } from '@/lib/first-light'
import { prefersReducedMotion } from '@/lib/reduced-motion'

export function FirstLightGate() {
  const armed = useFirstLight()
  const dispatch = useDataDispatch()

  /*
   * Decided ONCE per arming (TEST-0915, proof F on the built app against the
   * dev API). The overlay writes the account's flag the moment it mounts, so
   * re-reading `hasSeenFirstLight` on every render read that flag back as
   * "already seen" on the next provider update and unmounted the moment while
   * it was playing — in LIVE mode the workspace sync lands within the first
   * second, so on a fresh live account the flag was written and nothing was
   * ever seen. Each `firstLight/arm` is a new object, so identity is the key.
   */
  const decision = useRef<{ armed: NonNullable<typeof armed>; show: boolean } | null>(null)
  if (armed && decision.current?.armed !== armed) {
    decision.current = {
      armed,
      show: !hasSeenFirstLight(armed.email) && !prefersReducedMotion(),
    }
  }
  const blocked = armed !== null && !(decision.current?.show ?? false)

  // Disarm a moment that will not play, so the signal cannot sit set forever
  // and fire on some later render. Done in an effect rather than during render
  // because it is a dispatch.
  useEffect(() => {
    if (blocked) dispatch({ type: 'firstLight/dismiss' })
  }, [blocked, dispatch])

  if (!armed || blocked) return null

  return (
    <FirstLight
      name={armed.name}
      email={armed.email}
      onDone={() => dispatch({ type: 'firstLight/dismiss' })}
    />
  )
}
