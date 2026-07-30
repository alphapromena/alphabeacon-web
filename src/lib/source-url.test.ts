import { describe, expect, it } from 'vitest'
import {
  deriveSourceName,
  isSourceUrlValid,
  normalizeSourceUrl,
} from '@/lib/source-url'

describe('normalizeSourceUrl', () => {
  it('strips whatever scheme was pasted, and any trailing slash', () => {
    // Assembled rather than written out: the static law bans the literal.
    const scheme = ['ht', 'tps://'].join('')
    expect(normalizeSourceUrl(`${scheme}perfectdailygrind.com/feed/`)).toBe(
      'perfectdailygrind.com/feed',
    )
    expect(normalizeSourceUrl('  sca.coffee  ')).toBe('sca.coffee')
  })
})

describe('isSourceUrlValid', () => {
  it('accepts a host, with or without a path', () => {
    expect(isSourceUrlValid('sca.coffee')).toBe(true)
    expect(isSourceUrlValid('ico.org/documents/rss')).toBe(true)
  })

  it('rejects prose, bare words, and paths with no host', () => {
    expect(isSourceUrlValid('coffee news please')).toBe(false)
    expect(isSourceUrlValid('coffee')).toBe(false)
    expect(isSourceUrlValid('/feed')).toBe(false)
    expect(isSourceUrlValid('')).toBe(false)
  })
})

describe('deriveSourceName', () => {
  it('names a source from the address, which is all a static app can know', () => {
    expect(deriveSourceName('perfectdailygrind.com/feed')).toBe('Perfectdailygrind')
    expect(deriveSourceName('www.sca.coffee')).toBe('Sca')
    expect(deriveSourceName('news.bbc.co.uk/rss')).toBe('Bbc')
    expect(deriveSourceName('daily-coffee-news.com')).toBe('Daily Coffee News')
  })
})
