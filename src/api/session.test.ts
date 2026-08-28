import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadActiveOrgId, loadSession, purgeSession, saveActiveOrgId, saveSession } from './session'
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

/**
 * The active org is the second thing this app persists (ORDER ONB-0827-B,
 * D-ONB-F). It is what makes "a session opens where it left off" survive a
 * reload — the half of open-item 38's fix that storage owns.
 */
describe('the remembered active org', () => {
  it('survives a reload, from whichever storage holds the session', () => {
    saveSession(session(), false)
    saveActiveOrgId('1', '1064')
    // `loadActiveOrgId` is what boot reads; this IS the reload.
    expect(loadActiveOrgId('1')).toBe('1064')
    // It followed the session's own rememberMe choice, not a second one.
    expect(window.sessionStorage.getItem('ab-live-active-org')).toBeTruthy()
    expect(window.localStorage.getItem('ab-live-active-org')).toBeNull()
  })

  it('follows rememberMe to localStorage', () => {
    saveSession(session(), true)
    saveActiveOrgId('1', '1065')
    expect(window.localStorage.getItem('ab-live-active-org')).toBeTruthy()
    expect(loadActiveOrgId('1')).toBe('1065')
  })

  it('is purged with the session — a sign-out leaves nothing behind', () => {
    saveSession(session(), true)
    saveActiveOrgId('1', '1064')

    purgeSession()
    expect(loadActiveOrgId('1')).toBeNull()

    /**
     * DELIBERATE, and the narrower of the two readings. The rule says a
     * SESSION opens in the org it remembers, and a session ends at sign-out —
     * so the memory lives exactly as long as the thing it belongs to, which
     * is the persistence law this repo already keeps (architecture.md: the
     * live session is the one durable record). Widening it to survive
     * sign-out would make it a second durable record that outlives its
     * session, and on a shared machine it would say which workspace the last
     * person worked in. Reload keeps it; sign-out does not. If the founder
     * wants "come back tomorrow and land where I was", that is the change.
     */
  })

  it('is never offered to a DIFFERENT account on the same machine', () => {
    saveSession(session(), false)
    saveActiveOrgId('1', '1064')

    // Same browser, different person: they choose their own workspace.
    expect(loadActiveOrgId('2')).toBeNull()
  })

  it('is a no-op when signed out — there is no session to qualify', () => {
    saveActiveOrgId('1', '1064')
    expect(loadActiveOrgId('1')).toBeNull()
  })
})
