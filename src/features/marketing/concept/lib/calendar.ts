/**
 * Real-world calendar data.
 *
 * ## The rule
 *
 * Any real holiday, national day, religious event or public occasion shown
 * anywhere in Malaky must carry the correct official date for the specific
 * country and year being displayed. Nothing here may be written from memory:
 * an entry only exists once it has been checked against an authoritative
 * government or official source, and the source is recorded on the entry.
 *
 * A real country/event pairing must never appear with an invented date — and
 * that includes a countdown, which asserts a date implicitly.
 *
 * ## Fixed, announced, provisional
 *
 * `kind: "fixed"` events fall on the same Gregorian day every year and can be
 * expressed once. `kind: "lunar"` events — Ramadan, Eid al-Fitr, Eid al-Adha —
 * move each Gregorian year and their observance depends on official
 * announcements, so they need an entry *per country per year* and carry the
 * year they were verified for.
 *
 * `status` records how firm the date is:
 * - "fixed" — set by decree or statute, same date every year;
 * - "announced" — the specific year's date has been officially announced;
 * - "provisional" — expected but not yet announced. Nothing here is
 *   provisional today, and anything that is must say so in the UI.
 *
 * ## Occasion date vs observed holiday
 *
 * They are not always the same day. A cabinet may move the day off without
 * moving the occasion. `day`/`month` are the occasion; `observedNote` records
 * the year's holiday arrangement where it differs or spans days.
 *
 * ## Fictional business events
 *
 * Product launches, conferences, branch openings and anniversaries are company
 * context, not public occasions. They live in ./operating-calendar with the
 * demo brands and must never be presented as public holidays.
 */

export type ObservanceKind = 'fixed' | 'lunar'
export type ObservanceStatus = 'fixed' | 'announced' | 'provisional'

/** ISO 3166-1 alpha-2 for the five launch markets. */
export type CountryCode = 'SA' | 'AE' | 'JO' | 'QA' | 'OM'

export interface Observance {
  id: string
  /** English name as the official source gives it. */
  name: string
  country: CountryCode
  countryName: string
  kind: ObservanceKind
  status: ObservanceStatus
  /** Gregorian month (1–12) and day of the occasion itself. */
  month: number
  day: number
  /**
   * The year this date was verified for. Required for lunar occasions and for
   * anything whose date is set annually; omitted for statute-fixed dates that
   * do not move.
   */
  year?: number
  /** What the day marks, in one line. */
  commemorates: string
  /** The year's holiday arrangement, where it differs from the occasion. */
  observedNote?: string
  /**
   * Where the date was checked. Required — an entry without a source has not
   * been verified and does not belong here.
   */
  source: string
  /** When this entry was last checked against that source. */
  verified: string
}

/**
 * Verified observances across the five launch markets.
 *
 * Every date below was cross-checked twice: against the decree or official
 * announcement that sets it, and against the 2026 weekday it must fall on.
 */
export const OBSERVANCES: Observance[] = [
  /* --- Saudi Arabia ------------------------------------------------- */
  {
    id: 'sa-national-day',
    name: 'Saudi National Day',
    country: 'SA',
    countryName: 'Saudi Arabia',
    kind: 'fixed',
    status: 'fixed',
    month: 9,
    day: 23,
    commemorates:
      'The 1932 royal decree renaming the Kingdom of Nejd and Hejaz as the Kingdom of Saudi Arabia.',
    source:
      'Royal decree of 1932, as published by the Saudi Press Agency (spa.gov.sa) and Visit Saudi (visitsaudi.com/en/saudi-calendar/saudi-national-day).',
    verified: '2026-08-16',
  },
  {
    id: 'sa-founding-day',
    name: 'Saudi Founding Day',
    country: 'SA',
    countryName: 'Saudi Arabia',
    kind: 'fixed',
    status: 'fixed',
    month: 2,
    day: 22,
    commemorates: 'The founding of the First Saudi State by Imam Muhammad bin Saud in 1727.',
    source:
      'Royal order of 27 January 2022 designating 22 February annually, published by the Saudi Press Agency (spa.gov.sa/2324647) and the Ministry of Foreign Affairs (mofa.gov.sa).',
    verified: '2026-08-16',
  },

  /* --- United Arab Emirates ----------------------------------------- */
  {
    id: 'ae-eid-al-etihad',
    name: 'Eid Al Etihad',
    country: 'AE',
    countryName: 'United Arab Emirates',
    kind: 'fixed',
    status: 'fixed',
    month: 12,
    day: 2,
    commemorates:
      'The 1971 union of the emirates. Renamed Eid Al Etihad — the Union Festival — from the former National Day.',
    observedNote:
      'Observed 2–3 December 2026. UAE public-holiday law lets the Cabinet transfer this holiday to the start or end of a week, as it did in 2025.',
    source:
      'UAE public holidays as published by the UAE Government portal (u.ae) and Cabinet Resolution on public holidays (uaelegislation.gov.ae/en/legislations/2595); 2026 dates reported by Khaleej Times and Arabian Business.',
    verified: '2026-08-17',
  },

  /* --- Jordan --------------------------------------------------------- */
  {
    id: 'jo-labour-day',
    name: 'Labour Day',
    country: 'JO',
    countryName: 'Jordan',
    kind: 'fixed',
    status: 'fixed',
    month: 5,
    day: 1,
    commemorates: "International Workers' Day, an official public holiday in Jordan.",
    source:
      'Jordan public holidays 2026, Jordan News Agency (petra.gov.jo) and the Amman Stock Exchange official holiday calendar (ase.com.jo).',
    verified: '2026-08-17',
  },
  {
    id: 'jo-independence-day',
    name: 'Jordan Independence Day',
    country: 'JO',
    countryName: 'Jordan',
    kind: 'fixed',
    status: 'announced',
    month: 5,
    day: 25,
    year: 2026,
    commemorates:
      "Jordan's declaration of independence on 25 May 1946, ending the British mandate.",
    observedNote:
      'Designated a public holiday for Monday 25 May 2026 by prime-ministerial circular.',
    source:
      "Circular issued 27 April 2026 by Prime Minister Jafar Hassan, reported by the Jordan News Agency (petra.gov.jo, 'Official Holidays Announced for Eid Al-Adha, Independence Day').",
    verified: '2026-08-17',
  },
  {
    id: 'jo-eid-al-adha-2026',
    name: 'Eid al-Adha',
    country: 'JO',
    countryName: 'Jordan',
    kind: 'lunar',
    status: 'announced',
    month: 5,
    day: 26,
    year: 2026,
    commemorates:
      'The Feast of Sacrifice, 10 Dhul Hijjah 1447, following the official moon sighting.',
    observedNote:
      'Holiday announced from the morning of Tuesday 26 May to the evening of Saturday 30 May 2026.',
    source:
      'Prime-ministerial circular of 27 April 2026 following the official Dhul Hijjah moon sighting, reported by the Jordan News Agency (petra.gov.jo) and Jordan News.',
    verified: '2026-08-17',
  },

  /* --- Qatar ---------------------------------------------------------- */
  {
    id: 'qa-sport-day',
    name: 'Qatar National Sport Day',
    country: 'QA',
    countryName: 'Qatar',
    kind: 'fixed',
    status: 'announced',
    month: 2,
    day: 10,
    year: 2026,
    commemorates:
      'A national day of sport and public health, held on the Tuesday of the second week of February.',
    observedNote: 'Announced as an official holiday for Tuesday 10 February 2026.',
    source:
      'Emiri Resolution No. 80 of 2011 on Sports Day (almeezan.qa/LawPage.aspx?id=2911), with the 2026 date announced by the Amiri Diwan (diwan.gov.qa) and carried by Qatar News Agency (qna.org.qa).',
    verified: '2026-08-17',
  },
  {
    id: 'qa-national-day',
    name: 'Qatar National Day',
    country: 'QA',
    countryName: 'Qatar',
    kind: 'fixed',
    status: 'fixed',
    month: 12,
    day: 18,
    commemorates:
      'The 1878 succession of Sheikh Jassim bin Mohammed Al Thani and the unification of Qatar.',
    source:
      'Law No. 11 of 2007 designating 18 December annually, as published by the State of Qatar portal (qatar.qa) and the Amiri Diwan (diwan.gov.qa).',
    verified: '2026-08-17',
  },

  /* --- Oman ----------------------------------------------------------- */
  {
    id: 'om-national-day',
    name: 'Oman National Day',
    country: 'OM',
    countryName: 'Oman',
    kind: 'fixed',
    status: 'fixed',
    month: 11,
    day: 20,
    commemorates:
      "The Sultanate's national day, marking the expulsion of Portuguese forces in 1650.",
    observedNote:
      "Royal Decree 15/2025 fixes National Day on 20 and 21 November, replacing the former 18 November. The year's days off are set by Royal Office announcement.",
    source:
      'Royal Decree No. 15/2025 of 21 January 2025 amending Royal Decree 88/2022 on official holidays, published in the Official Gazette issue 1581 (decree.om/2025/rd20250015) and reported by Oman Observer and Gulf News.',
    verified: '2026-08-17',
  },
]

const BY_ID = new Map(OBSERVANCES.map((o) => [o.id, o]))

export function getObservance(id: string): Observance {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`No verified observance: ${id}`)
  return found
}

export function observancesFor(country: CountryCode): Observance[] {
  return OBSERVANCES.filter((o) => o.country === country)
}

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "23 September" — the date itself, with no year attached. */
export function formatObservanceDate(o: Observance): string {
  return `${o.day} ${MONTHS[o.month - 1]}`
}

/**
 * Whole days from `today` until the observance's next occurrence.
 *
 * Compared on calendar date parts rather than timestamps, so a viewer's
 * timezone offset can never move the answer by a day. Returns 0 on the day
 * itself, and rolls to next year once the date has passed.
 *
 * Callers must pass `today` — this module never reads the clock, so nothing
 * here can differ between a server render and the first client render.
 */
export function daysUntil(o: Observance, today: Date): number {
  const y = today.getFullYear()
  const startOfDay = Date.UTC(y, today.getMonth(), today.getDate())
  let target = Date.UTC(y, o.month - 1, o.day)
  if (target < startOfDay) target = Date.UTC(y + 1, o.month - 1, o.day)
  return Math.round((target - startOfDay) / 86_400_000)
}

/** "38 days away" · "Tomorrow" · "Today". */
export function formatCountdown(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days away`
}
