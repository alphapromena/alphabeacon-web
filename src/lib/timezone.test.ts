/**
 * W4's verify names this explicitly: "DST data (Amman ↔ New-York) renders slots
 * at correct local times."
 *
 * The pairing is the point. New York moves twice a year, Jordan has been fixed
 * at UTC+3 since it abolished DST in 2022 — so a bug that silently uses the
 * machine's own offset, or applies one offset year-round, cannot pass both.
 */
import { describe, expect, it } from 'vitest'
import { formatTimeInZone, offsetMinutesAt, zoneAbbreviation, zonedTimeToInstant } from './timezone'

describe('offsets are measured, not assumed', () => {
  it('tracks New York across a daylight-saving change', () => {
    // EST in January, EDT in July.
    expect(offsetMinutesAt(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toBe(-300)
    expect(offsetMinutesAt(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe(-240)
  })

  it('keeps Jordan fixed at UTC+3 all year — it abolished DST in 2022', () => {
    expect(offsetMinutesAt(new Date('2026-01-15T12:00:00Z'), 'Asia/Amman')).toBe(180)
    expect(offsetMinutesAt(new Date('2026-07-15T12:00:00Z'), 'Asia/Amman')).toBe(180)
  })
})

describe('a 9am slot means 9am to the person who scheduled it', () => {
  it('resolves to a different instant in New York either side of the change', () => {
    const winter = zonedTimeToInstant('2026-01-15', '09:00', 'America/New_York')
    const summer = zonedTimeToInstant('2026-07-15', '09:00', 'America/New_York')

    expect(winter.toISOString()).toBe('2026-01-15T14:00:00.000Z')
    expect(summer.toISOString()).toBe('2026-07-15T13:00:00.000Z')
  })

  it('resolves to the same offset year-round in Amman', () => {
    expect(zonedTimeToInstant('2026-01-15', '09:00', 'Asia/Amman').toISOString()).toBe(
      '2026-01-15T06:00:00.000Z',
    )
    expect(zonedTimeToInstant('2026-07-15', '09:00', 'Asia/Amman').toISOString()).toBe(
      '2026-07-15T06:00:00.000Z',
    )
  })

  it('survives the spring-forward boundary itself', () => {
    // 2026-03-08: New York jumps 02:00 -> 03:00. A slot at 01:30 is still EST,
    // one at 03:30 is already EDT.
    expect(zonedTimeToInstant('2026-03-08', '01:30', 'America/New_York').toISOString()).toBe(
      '2026-03-08T06:30:00.000Z',
    )
    expect(zonedTimeToInstant('2026-03-08', '03:30', 'America/New_York').toISOString()).toBe(
      '2026-03-08T07:30:00.000Z',
    )
  })

  it('survives the fall-back boundary', () => {
    // 2026-11-01: New York repeats 01:00-02:00. The first pass (EDT) is what a
    // scheduler should pick, and the arithmetic must not drift a day.
    const before = zonedTimeToInstant('2026-11-01', '00:30', 'America/New_York')
    const after = zonedTimeToInstant('2026-11-01', '03:30', 'America/New_York')
    expect(before.toISOString()).toBe('2026-11-01T04:30:00.000Z')
    expect(after.toISOString()).toBe('2026-11-01T08:30:00.000Z')
  })

  it('round-trips: the instant renders back as the wall-clock time it came from', () => {
    for (const zone of ['Asia/Amman', 'America/New_York', 'Europe/London', 'UTC']) {
      for (const date of ['2026-01-15', '2026-07-15', '2026-03-08', '2026-11-01']) {
        const instant = zonedTimeToInstant(date, '09:00', zone)
        expect(formatTimeInZone(instant, zone), `${zone} on ${date}`).toBe('9:00 AM')
      }
    }
  })

  it('the same instant reads differently in two zones — which is the whole point', () => {
    const instant = zonedTimeToInstant('2026-07-15', '09:00', 'Asia/Amman')
    expect(formatTimeInZone(instant, 'Asia/Amman')).toBe('9:00 AM')
    expect(formatTimeInZone(instant, 'America/New_York')).toBe('2:00 AM')
  })
})

describe('zones are labelled legibly', () => {
  it('shows an offset a person can sanity-check', () => {
    expect(zoneAbbreviation('Asia/Amman', new Date('2026-07-15T12:00:00Z'))).toBe('GMT+3')
    expect(zoneAbbreviation('America/New_York', new Date('2026-07-15T12:00:00Z'))).toBe('GMT-4')
    expect(zoneAbbreviation('America/New_York', new Date('2026-01-15T12:00:00Z'))).toBe('GMT-5')
  })
})
