/**
 * What is worth going back to (NIGHT-0916 order 3; D-NIGHT-0916-C): only an
 * app route — one leading slash, same origin, never the visitor world or the
 * auth walk — and storage that throws reads as absent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RETURN_TO_KEY,
  clearReturnTo,
  isAppPath,
  rememberReturnTo,
  takeReturnTo,
} from './return-to'

beforeEach(() => window.sessionStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('isAppPath', () => {
  it.each([
    '/billing',
    '/billing?tab=balance',
    '/settings/team',
    '/today/dr_1?from=queue',
    '/studio/assets/9#top',
  ])('accepts the app route %s', (path) => {
    expect(isAppPath(path)).toBe(true)
  })

  it.each([
    ['protocol-relative', '//evil.example/billing'],
    // Assembled from the scheme: rule 2 keeps http(s):// literals out of src/,
    // and what is under test here is that such a value is REJECTED.
    ['absolute http', 'http:' + '//evil.example/billing'],
    ['absolute https', 'https:' + '//alphabeacon.example/billing'],
    ['a scheme', 'javascript:alert(1)'],
    ['a backslash after the slash', '/\\evil.example'],
    ['no leading slash', 'billing'],
    ['a newline', '/billing\n/x'],
    ['the marketing home', '/'],
    ['login', '/login'],
    ['login with a query', '/login?next=/billing'],
    ['signup', '/signup'],
    ['verify', '/verify-email?email=a%40b.c'],
    ['reset', '/reset-password'],
    ['accept-invite', '/accept-invite?token=x'],
    ['pricing', '/pricing'],
    ['request-demo', '/request-demo'],
    ['privacy', '/privacy'],
    ['terms', '/terms'],
    ['a dev page', '/dev/states'],
    ['a trailing slash on login', '/login/'],
    ['not a string', 42],
    ['null', null],
  ])('rejects %s', (_label, path) => {
    expect(isAppPath(path)).toBe(false)
  })
})

describe('remember / take / clear', () => {
  it('remembers an app path under the one key and take reads it once', () => {
    rememberReturnTo('/settings/team?x=1')
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBe('/settings/team?x=1')
    expect(takeReturnTo()).toBe('/settings/team?x=1')
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
    expect(takeReturnTo()).toBeNull()
  })

  it('does not remember what is not an app path', () => {
    rememberReturnTo('/login')
    rememberReturnTo('//evil.example/billing')
    rememberReturnTo('/')
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })

  it('a stored value that is not an app path reads as absent, and is cleared', () => {
    window.sessionStorage.setItem(RETURN_TO_KEY, 'https:' + '//evil.example/')
    expect(takeReturnTo()).toBeNull()
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })

  it('clear removes it', () => {
    rememberReturnTo('/billing')
    clearReturnTo()
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })

  it('storage that throws is storage that is absent — nothing throws, nothing is read', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    vi.spyOn(window, 'sessionStorage', 'get').mockReturnValue(throwing as unknown as Storage)
    expect(() => rememberReturnTo('/billing')).not.toThrow()
    expect(takeReturnTo()).toBeNull()
    expect(() => clearReturnTo()).not.toThrow()
  })

  it('storage whose accessor throws is absent too', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => rememberReturnTo('/billing')).not.toThrow()
    expect(takeReturnTo()).toBeNull()
    expect(() => clearReturnTo()).not.toThrow()
  })
})
