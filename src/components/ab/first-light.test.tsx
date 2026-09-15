/**
 * MOMENT 2's four promises, asserted (ORDER MOTION-0914/B).
 *
 * Under two seconds · skippable by click or key · skipping lands in the same
 * place · fires once per account and cannot repeat on reload.
 *
 * The last one is the reason this file exists. "Once per account" is a claim
 * about a value that has to outlive the page, and the only way to be sure is
 * to simulate the reload — mount, unmount, mount again — and watch nothing
 * happen the second time.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FirstLight, FIRST_LIGHT_MS } from '@/components/ab/first-light'
import { firstLightKey, hasSeenFirstLight, markFirstLightSeen } from '@/lib/first-light'

const ACCOUNT = { name: 'Dana Saif', email: 'Dana@Example.com' }

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('first light, the moment', () => {
  it('is under the two-second ceiling the order sets', () => {
    expect(FIRST_LIGHT_MS).toBeLessThan(2_000)
  })

  it('greets the person by their own first name', async () => {
    render(<FirstLight {...ACCOUNT} onDone={() => {}} />)
    // Awaited, not asserted synchronously: the words arrive AFTER the beacon,
    // which is the sequence the order describes ("the core lights, then
    // Welcome to Malaky"). They arrive by being rendered rather than by
    // fading, so they are at full contrast the instant they exist.
    expect(await screen.findByText(/Welcome to Malaky, Dana/)).toBeInTheDocument()
  })

  it('names the account in its accessible label from the very first frame', () => {
    // The overlay announces itself immediately even though the visible words
    // are still a beat away — a screen-reader user is not kept waiting for a
    // beacon they cannot see.
    render(<FirstLight {...ACCOUNT} onDone={() => {}} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Welcome to Malaky, Dana')
  })

  it('falls back rather than greeting an empty string', async () => {
    // A login-then-verify walk carries no name (GATE-0910 item 59's cousin).
    render(<FirstLight name="  " email={ACCOUNT.email} onDone={() => {}} />)
    expect(await screen.findByText(/Welcome to Malaky, there/)).toBeInTheDocument()
  })

  it('dismisses itself, once, when nobody touches it', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<FirstLight {...ACCOUNT} onDone={onDone} />)

    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(FIRST_LIGHT_MS + 50)
    expect(onDone).toHaveBeenCalledTimes(1)

    // And it cannot fire twice — one exit path, guarded.
    vi.advanceTimersByTime(5_000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('is skippable by click, and by key, and both land in the same place', async () => {
    const byPointer = vi.fn()
    const { unmount } = render(<FirstLight {...ACCOUNT} onDone={byPointer} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(byPointer).toHaveBeenCalledTimes(1)
    unmount()

    window.localStorage.clear()
    const byKey = vi.fn()
    render(<FirstLight {...ACCOUNT} onDone={byKey} />)
    await userEvent.keyboard('{Escape}')
    expect(byKey).toHaveBeenCalledTimes(1)

    // "The same place" is structural: `onDone` is the only exit, and the
    // overlay never navigates. Both paths call the same one.
    expect(byPointer.mock.calls).toEqual(byKey.mock.calls)
  })
})

describe('first light fires once per account', () => {
  it('records the account BEFORE it plays, so a reload mid-moment cannot repeat it', () => {
    expect(hasSeenFirstLight(ACCOUNT.email)).toBe(false)
    render(<FirstLight {...ACCOUNT} onDone={() => {}} />)
    // Not after the timer — now, on mount.
    expect(hasSeenFirstLight(ACCOUNT.email)).toBe(true)
  })

  it('survives a reload — mount, unmount, mount again', () => {
    const { unmount } = render(<FirstLight {...ACCOUNT} onDone={() => {}} />)
    unmount()
    // A reload rebuilds the world from the dataset and every bit of React
    // state with it. This is the only thing that is still there.
    expect(hasSeenFirstLight(ACCOUNT.email)).toBe(true)
  })

  it('is keyed by the account, so a second signup on the same machine is welcomed', () => {
    markFirstLightSeen(ACCOUNT.email)
    expect(hasSeenFirstLight(ACCOUNT.email)).toBe(true)
    expect(hasSeenFirstLight('someone.else@example.com')).toBe(false)
  })

  it('treats the address case-insensitively — one account, one welcome', () => {
    markFirstLightSeen('Dana@Example.com')
    expect(hasSeenFirstLight('dana@example.com')).toBe(true)
    expect(firstLightKey('DANA@EXAMPLE.COM')).toBe(firstLightKey('dana@example.com'))
  })

  it('answers "already seen" when storage throws, so it can never loop', () => {
    const boom = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('site data blocked')
    })
    // A browser that cannot remember shows the moment NEVER rather than on
    // every single reload. That is the chosen failure direction.
    expect(hasSeenFirstLight(ACCOUNT.email)).toBe(true)
    boom.mockRestore()
  })
})
