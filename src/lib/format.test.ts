import { describe, expect, it } from 'vitest'
import { shortDate } from './format'

describe('shortDate', () => {
  const now = new Date('2026-07-29T12:00:00.000Z')

  it('drops the year within the current year', () => {
    expect(shortDate('2026-01-04T09:00:00.000Z', now)).toBe('Jan 4')
  })

  it('keeps the year outside it, so a stale row cannot read as recent', () => {
    // The bug: joined dates, invoice history and published posts are not all
    // recent, and a bare "Nov 4" on a row from last year reads as this year.
    expect(shortDate('2025-11-04T09:00:00.000Z', now)).toBe('Nov 4, 2025')
    expect(shortDate('2027-02-01T09:00:00.000Z', now)).toBe('Feb 1, 2027')
  })
})
