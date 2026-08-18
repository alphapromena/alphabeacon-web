/**
 * Holidays -> occasions (INT-8). The shapes come from the wire capture in
 * Docs/api/alphastudio-shapes.md, where a JO calendar carried six rules on one
 * day and `kind` was do/dont throughout.
 */
import { describe, expect, it } from 'vitest'
import type { ApiHoliday } from '@/api/types'
import { adaptHolidays, HOLIDAY_SOURCE_ID } from './scheduling-adapter'

const holiday = (over: Partial<ApiHoliday> = {}): ApiHoliday => ({
  id: '8',
  orgId: '1',
  date: '2026-12-25',
  event: 'Christmas Day',
  rules: [{ kind: 'do', text: 'Keep the tone warm and inclusive.' }],
  createdAt: '2026-08-17T11:26:00.581Z',
  ...over,
})

describe('adaptHolidays', () => {
  it('carries the day, its name and its rules onto the occasion', () => {
    const [occasion] = adaptHolidays([holiday()])
    expect(occasion).toMatchObject({
      date: '2026-12-25',
      name: 'Christmas Day',
      sourceId: HOLIDAY_SOURCE_ID,
    })
    expect(occasion.rules).toEqual([{ kind: 'do', text: 'Keep the tone warm and inclusive.' }])
  })

  it('namespaces the id, so a holiday can never collide with a demo event', () => {
    const [occasion] = adaptHolidays([holiday({ id: '1' })])
    expect(occasion.id).toBe('hol_1')
  })

  it('keeps an UNKNOWN rule kind instead of dropping or reassigning it', () => {
    // The rules come from an external capability. Dropping one would hide
    // guidance generation will still obey; filing it under do/dont would
    // state the opposite of what it might mean.
    const [occasion] = adaptHolidays([
      holiday({ rules: [{ kind: 'consider', text: 'Local observance varies by region.' }] }),
    ])
    expect(occasion.rules).toEqual([
      { kind: 'consider', text: 'Local observance varies by region.' },
    ])
  })

  it('survives a holiday with no rules at all', () => {
    const [occasion] = adaptHolidays([holiday({ rules: [] })])
    expect(occasion.rules).toEqual([])
  })

  it('preserves the calendar order the API answers in', () => {
    const occasions = adaptHolidays([
      holiday({ id: '1', date: '2026-08-25', event: 'Mawlid al-Nabi' }),
      holiday({ id: '2', date: '2026-12-25', event: 'Christmas Day' }),
    ])
    expect(occasions.map((entry) => entry.date)).toEqual(['2026-08-25', '2026-12-25'])
  })
})
