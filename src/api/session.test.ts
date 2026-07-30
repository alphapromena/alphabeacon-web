import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadSession, purgeSession, saveSession } from './session'
import type { AuthSession } from './types'

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  token: 'tok-1',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: {
    id: '1',
    name: 'Test',
    email: 'test@example.invalid',
    role: 'user',
    status: 'active',
    emailVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  orgs: [],
  ...overrides,
})

beforeEach(purgeSession)
afterEach(purgeSession)

describe('session storage', () => {
  it('rememberMe chooses localStorage; a tab session chooses sessionStorage', () => {
    saveSession(session(), true)
    expect(window.localStorage.getItem('ab-live-session')).toBeTruthy()
    expect(window.sessionStorage.getItem('ab-live-session')).toBeNull()

    saveSession(session(), false)
    expect(window.sessionStorage.getItem('ab-live-session')).toBeTruthy()
    // Writing one home purges the other — two live sessions cannot coexist.
    expect(window.localStorage.getItem('ab-live-session')).toBeNull()
  })

  it('round-trips through load', () => {
    saveSession(session({ token: 'tok-42' }), false)
    expect(loadSession()?.token).toBe('tok-42')
  })

  it('discards an expired record instead of offering a dead session', () => {
    saveSession(session({ expiresAt: new Date(Date.now() - 1000).toISOString() }), true)
    expect(loadSession()).toBeNull()
    expect(window.localStorage.getItem('ab-live-session')).toBeNull()
  })

  it('discards corrupt or shapeless records', () => {
    window.localStorage.setItem('ab-live-session', '{not json')
    expect(loadSession()).toBeNull()
    window.sessionStorage.setItem('ab-live-session', JSON.stringify({ hello: 1 }))
    expect(loadSession()).toBeNull()
  })

  it('purge clears both homes', () => {
    saveSession(session(), true)
    saveSession(session(), false)
    purgeSession()
    expect(loadSession()).toBeNull()
  })
})
