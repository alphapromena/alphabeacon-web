/**
 * The operating calendar — a month of Malaky's work, per market, shown as a
 * month.
 *
 * The point of the visualisation is that Malaky is reading two calendars at
 * once: what is happening in the market, and what is happening inside the
 * company. Each entry is one or the other, and the month shows them
 * interleaved with the work Malaky has prepared for each.
 *
 * ## Real vs illustrative
 *
 * Two kinds of entry, typed apart so they cannot be confused:
 *
 * - `market` — a real public occasion. It carries no date of its own. The date
 *   comes from ./calendar, where it is recorded against an official source. A
 *   component may never place one of these on a date of its own choosing, and
 *   an occasion whose verified date falls outside the displayed month is
 *   dropped rather than moved.
 * - `company` — illustrative demo-business context: a launch, a conference, an
 *   opening. Private company context, not a public occasion, and the UI says
 *   so. These need no verification and are dated freely.
 *
 * ## Why each market has its own month
 *
 * The month is a property of the market, not a global constant. Each market
 * opens on the month that shows its own calendar most clearly — Saudi Arabia
 * on its National Day, Oman on its, Jordan on the week its independence day
 * and Eid al-Adha holiday meet. Forcing one month across five countries would
 * demonstrate the opposite of what this section is for.
 *
 * ## Why the months are anchored
 *
 * Each grid is a fixed reference frame rather than the live current month, for
 * two reasons. It renders identically on the server and the client, so there
 * is no hydration mismatch and no blank calendar before JavaScript runs. And a
 * live month cannot be relied on to tell the story — visited on the 1st it
 * would have no completed work behind it.
 *
 * The year is displayed, because these are specific verified months. The
 * section is labelled illustrative for exactly that reason.
 */

import { getObservance, type CountryCode, type Observance } from './calendar'

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

export type ActivityStatus =
  | 'opportunity'
  | 'preparing'
  | 'drafts-ready'
  | 'awaiting-approval'
  | 'campaign-ready'
  | 'published'
  | 'completed'

/**
 * Four readings, not seven. A visitor should be able to scan the month and
 * see at a glance what is done, what is moving, what wants them, and what has
 * only been noticed — without reading a legend.
 */
export type StatusTone = 'done' | 'moving' | 'needs-you' | 'noticed'

export interface StatusMeta {
  label: string
  tone: StatusTone
  /** The mark drawn in the calendar cell. */
  glyph: 'check' | 'full' | 'half' | 'ring'
}

export const STATUS: Record<ActivityStatus, StatusMeta> = {
  completed: { label: 'Completed', tone: 'done', glyph: 'check' },
  published: { label: 'Published', tone: 'done', glyph: 'check' },
  'campaign-ready': { label: 'Campaign ready', tone: 'needs-you', glyph: 'full' },
  'awaiting-approval': { label: 'Awaiting approval', tone: 'needs-you', glyph: 'full' },
  'drafts-ready': { label: 'Drafts ready', tone: 'moving', glyph: 'half' },
  preparing: { label: 'Preparing', tone: 'moving', glyph: 'half' },
  opportunity: { label: 'Opportunity', tone: 'noticed', glyph: 'ring' },
}

/* ------------------------------------------------------------------ *
 * Entries
 * ------------------------------------------------------------------ */

/** One line of work in the detail panel. */
export interface WorkItem {
  channel: string
  /** What happened to it. Past tense for finished work. */
  state: string
  done: boolean
}

interface EntryBase {
  id: string
  /**
   * What the cell says. A seventh of a calendar cannot hold a full title, and
   * an ellipsis says nothing at all — so each entry names itself twice.
   */
  short: string
  status: ActivityStatus
  /** The channels, and where each one got to. */
  work: WorkItem[]
  /** Shown under the work list when something is still owed by a person. */
  awaiting?: string
}

/** A real public occasion. Its date is looked up, never written here. */
interface MarketEntry extends EntryBase {
  kind: 'market'
  observanceId: string
}

/** Illustrative demo-business context. Dated freely because nothing is claimed. */
interface CompanyEntry extends EntryBase {
  kind: 'company'
  title: string
  /** What kind of business moment this is, shown in the panel. */
  eventType: string
  day: number
}

export type CalendarEntry = MarketEntry | CompanyEntry

/* ------------------------------------------------------------------ *
 * Markets
 * ------------------------------------------------------------------ */

export interface Market {
  id: string
  /** Short label for the selector. */
  label: string
  /** Full country name, used in the panel and the footnote. */
  country: string
  code: CountryCode
  /** The demo company operating in this market. Illustrative. */
  company: string
  /**
   * The month this market opens on, and the day the grid treats as "today".
   * A property of the market — never a global constant.
   */
  anchor: { year: number; month: number; today: number }
  /** One line on why this month, shown under the calendar. */
  monthRationale: string
  entries: CalendarEntry[]
  defaultEntryId: string
}

export const MARKETS: Market[] = [
  /* --- Saudi Arabia — September 2026 --------------------------------- */
  {
    id: 'sa',
    label: 'Saudi Arabia',
    country: 'Saudi Arabia',
    code: 'SA',
    company: 'a Riyadh logistics group',
    anchor: { year: 2026, month: 9, today: 11 },
    monthRationale:
      'September is the month Saudi National Day falls in — the largest single marketing moment in the Saudi calendar.',
    defaultEntryId: 'sa-national-day',
    entries: [
      {
        kind: 'company',
        id: 'sa-quarterly',
        title: 'Quarterly campaign launch',
        eventType: 'Campaign',
        short: 'Campaign launch',
        day: 3,
        status: 'completed',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Executive LinkedIn', state: 'Approved and published', done: true },
          { channel: 'Arabic social', state: 'Published', done: true },
          { channel: 'Newsletter', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'sa-branch',
        title: 'New branch opening',
        eventType: 'Business milestone',
        short: 'Branch opening',
        day: 9,
        status: 'published',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Arabic social', state: 'Published', done: true },
          { channel: 'Newsletter', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'sa-keynote',
        title: 'CEO conference keynote',
        eventType: 'Executive appearance',
        short: 'CEO keynote',
        day: 17,
        status: 'awaiting-approval',
        work: [
          { channel: 'Executive LinkedIn', state: "Drafted in an executive's voice", done: true },
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Instagram', state: 'Drafted', done: true },
        ],
        awaiting: 'Approval from the marketing lead',
      },
      {
        kind: 'market',
        id: 'sa-national-day',
        observanceId: 'sa-national-day',
        short: 'National Day',
        status: 'campaign-ready',
        work: [
          { channel: 'Instagram', state: 'Ready', done: true },
          { channel: 'LinkedIn company', state: 'Ready', done: true },
          { channel: 'Executive LinkedIn', state: 'Ready', done: true },
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'Newsletter', state: 'Ready', done: true },
        ],
        awaiting: 'Your approval',
      },
      {
        kind: 'company',
        id: 'sa-anniversary',
        title: 'Company anniversary',
        eventType: 'Business milestone',
        short: 'Anniversary',
        day: 26,
        status: 'opportunity',
        work: [
          { channel: 'Instagram', state: 'Not started', done: false },
          { channel: 'LinkedIn company', state: 'Not started', done: false },
          { channel: 'Arabic social', state: 'Not started', done: false },
        ],
      },
      {
        kind: 'company',
        id: 'sa-product',
        title: 'Product launch',
        eventType: 'Launch',
        short: 'Product launch',
        day: 29,
        status: 'preparing',
        work: [
          { channel: 'Instagram', state: 'Drafting', done: false },
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Executive LinkedIn', state: 'Drafting', done: false },
          { channel: 'Arabic social', state: 'Queued', done: false },
          { channel: 'Newsletter', state: 'Queued', done: false },
        ],
      },
    ],
  },

  /* --- United Arab Emirates — December 2026 -------------------------- */
  {
    id: 'ae',
    label: 'UAE',
    country: 'United Arab Emirates',
    code: 'AE',
    company: 'a Dubai professional-services firm',
    anchor: { year: 2026, month: 12, today: 9 },
    monthRationale:
      "December opens on Eid Al Etihad, the UAE's union day and the peak of the country's brand calendar.",
    defaultEntryId: 'ae-eid-al-etihad',
    entries: [
      {
        kind: 'market',
        id: 'ae-eid-al-etihad',
        observanceId: 'ae-eid-al-etihad',
        short: 'Eid Al Etihad',
        status: 'published',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Executive LinkedIn', state: 'Approved and published', done: true },
          { channel: 'Arabic social', state: 'Written natively, published', done: true },
          { channel: 'Reel', state: 'Published', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'ae-office',
        title: 'DIFC office opening',
        eventType: 'Business milestone',
        short: 'Office opening',
        day: 6,
        status: 'published',
        work: [
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Executive LinkedIn', state: 'Approved and published', done: true },
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Newsletter', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'ae-client',
        title: 'Major client announcement',
        eventType: 'Client news',
        short: 'Client news',
        day: 14,
        status: 'awaiting-approval',
        work: [
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Executive LinkedIn', state: "Drafted in the partner's voice", done: true },
          { channel: 'Email', state: 'Drafted', done: true },
        ],
        awaiting: 'Client sign-off before publication',
      },
      {
        kind: 'company',
        id: 'ae-recruitment',
        title: 'Graduate recruitment campaign',
        eventType: 'Recruitment',
        short: 'Recruitment',
        day: 20,
        status: 'drafts-ready',
        work: [
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Instagram', state: 'Drafted', done: true },
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'Landing-page copy', state: 'Drafting', done: false },
        ],
      },
      {
        kind: 'company',
        id: 'ae-service',
        title: 'New advisory service launch',
        eventType: 'Launch',
        short: 'Service launch',
        day: 29,
        status: 'preparing',
        work: [
          { channel: 'Campaign concept', state: 'Drafted', done: true },
          { channel: 'LinkedIn company', state: 'Drafting', done: false },
          { channel: 'Arabic social', state: 'Queued', done: false },
          { channel: 'Newsletter', state: 'Queued', done: false },
        ],
      },
    ],
  },

  /* --- Jordan — May 2026 --------------------------------------------- */
  {
    id: 'jo',
    label: 'Jordan',
    country: 'Jordan',
    code: 'JO',
    company: 'an Amman consumer brand',
    anchor: { year: 2026, month: 5, today: 13 },
    monthRationale:
      'May carries three verified occasions in one month — Labour Day, Independence Day and the announced Eid al-Adha holiday.',
    defaultEntryId: 'jo-independence-day',
    entries: [
      {
        kind: 'market',
        id: 'jo-labour-day',
        observanceId: 'jo-labour-day',
        short: 'Labour Day',
        status: 'published',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Arabic social', state: 'Written natively, published', done: true },
          { channel: 'LinkedIn company', state: 'Published', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'jo-partnership',
        title: 'Retail partnership announcement',
        eventType: 'Partnership',
        short: 'Partnership',
        day: 7,
        status: 'published',
        work: [
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Newsletter', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'jo-seasonal',
        title: 'Seasonal promotion',
        eventType: 'Promotion',
        short: 'Promotion',
        day: 12,
        status: 'completed',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Arabic social', state: 'Published', done: true },
          { channel: 'Reel', state: 'Published', done: true },
          { channel: 'Email', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'jo-industry-event',
        title: 'Industry event attendance',
        eventType: 'Industry event',
        short: 'Industry event',
        day: 19,
        status: 'awaiting-approval',
        work: [
          { channel: 'Executive LinkedIn', state: "Drafted in the founder's voice", done: true },
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Instagram', state: 'Drafted', done: true },
        ],
        awaiting: 'Approval from the founder',
      },
      {
        kind: 'market',
        id: 'jo-independence-day',
        observanceId: 'jo-independence-day',
        short: 'Independence',
        status: 'campaign-ready',
        work: [
          { channel: 'Instagram', state: 'Ready', done: true },
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'LinkedIn company', state: 'Ready', done: true },
          { channel: 'Reel', state: 'Ready', done: true },
        ],
        awaiting: 'Your approval',
      },
      {
        kind: 'market',
        id: 'jo-eid-al-adha',
        observanceId: 'jo-eid-al-adha-2026',
        short: 'Eid al-Adha',
        status: 'preparing',
        work: [
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'Instagram', state: 'Drafting', done: false },
          { channel: 'Email', state: 'Queued', done: false },
          { channel: 'Landing-page copy', state: 'Queued', done: false },
        ],
      },
    ],
  },

  /* --- Qatar — February 2026 ------------------------------------------ */
  {
    id: 'qa',
    label: 'Qatar',
    country: 'Qatar',
    code: 'QA',
    company: 'a Doha hospitality group',
    anchor: { year: 2026, month: 2, today: 5 },
    monthRationale:
      "February is built around Qatar National Sport Day, the country's most brand-active civic occasion.",
    defaultEntryId: 'qa-sport-day',
    entries: [
      {
        kind: 'company',
        id: 'qa-quarterly',
        title: 'Quarterly campaign launch',
        eventType: 'Campaign',
        short: 'Campaign launch',
        day: 2,
        status: 'published',
        work: [
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Arabic social', state: 'Published', done: true },
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Email', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'market',
        id: 'qa-sport-day',
        observanceId: 'qa-sport-day',
        short: 'Sport Day',
        status: 'campaign-ready',
        work: [
          { channel: 'Instagram', state: 'Ready', done: true },
          { channel: 'Reel', state: 'Ready', done: true },
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'LinkedIn company', state: 'Ready', done: true },
          { channel: 'Event announcement', state: 'Ready', done: true },
        ],
        awaiting: 'Your approval',
      },
      {
        kind: 'company',
        id: 'qa-investor',
        title: 'Investor briefing',
        eventType: 'Leadership event',
        short: 'Investor briefing',
        day: 12,
        status: 'drafts-ready',
        work: [
          { channel: 'Executive LinkedIn', state: "Drafted in the chairman's voice", done: true },
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
          { channel: 'Email', state: 'Drafted', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'qa-venue',
        title: 'New venue opening',
        eventType: 'Business milestone',
        short: 'Venue opening',
        day: 18,
        status: 'preparing',
        work: [
          { channel: 'Campaign concept', state: 'Drafted', done: true },
          { channel: 'Instagram', state: 'Drafting', done: false },
          { channel: 'Arabic social', state: 'Queued', done: false },
          { channel: 'Reel', state: 'Queued', done: false },
        ],
      },
      {
        kind: 'company',
        id: 'qa-ramadan-prep',
        title: 'Seasonal menu promotion',
        eventType: 'Promotion',
        short: 'Menu promotion',
        day: 24,
        status: 'opportunity',
        work: [
          { channel: 'Instagram', state: 'Not started', done: false },
          { channel: 'Arabic social', state: 'Not started', done: false },
          { channel: 'Email', state: 'Not started', done: false },
        ],
      },
    ],
  },

  /* --- Oman — November 2026 ------------------------------------------- */
  {
    id: 'om',
    label: 'Oman',
    country: 'Oman',
    code: 'OM',
    company: 'a Muscat industrial supplier',
    anchor: { year: 2026, month: 11, today: 12 },
    monthRationale:
      'November holds Oman National Day, fixed to 20–21 November by royal decree in 2025.',
    defaultEntryId: 'om-national-day',
    entries: [
      {
        kind: 'company',
        id: 'om-product',
        title: 'Product line launch',
        eventType: 'Launch',
        short: 'Product launch',
        day: 4,
        status: 'published',
        work: [
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Instagram', state: 'Published', done: true },
          { channel: 'Arabic social', state: 'Published', done: true },
          { channel: 'Newsletter', state: 'Sent', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'om-trade-show',
        title: 'Trade show attendance',
        eventType: 'Industry event',
        short: 'Trade show',
        day: 10,
        status: 'completed',
        work: [
          { channel: 'LinkedIn company', state: 'Published', done: true },
          { channel: 'Executive LinkedIn', state: 'Approved and published', done: true },
          { channel: 'Instagram', state: 'Published', done: true },
        ],
      },
      {
        kind: 'company',
        id: 'om-keynote',
        title: 'Managing director panel',
        eventType: 'Executive appearance',
        short: 'MD panel',
        day: 17,
        status: 'awaiting-approval',
        work: [
          { channel: 'Executive LinkedIn', state: "Drafted in the MD's voice", done: true },
          { channel: 'LinkedIn company', state: 'Drafted', done: true },
        ],
        awaiting: 'Approval from the managing director',
      },
      {
        kind: 'market',
        id: 'om-national-day',
        observanceId: 'om-national-day',
        short: 'National Day',
        status: 'campaign-ready',
        work: [
          { channel: 'Arabic social', state: 'Written natively', done: true },
          { channel: 'Instagram', state: 'Ready', done: true },
          { channel: 'LinkedIn company', state: 'Ready', done: true },
          { channel: 'Executive LinkedIn', state: 'Ready', done: true },
          { channel: 'Reel', state: 'Ready', done: true },
        ],
        awaiting: 'Your approval',
      },
      {
        kind: 'company',
        id: 'om-anniversary',
        title: 'Company anniversary',
        eventType: 'Business milestone',
        short: 'Anniversary',
        day: 26,
        status: 'opportunity',
        work: [
          { channel: 'LinkedIn company', state: 'Not started', done: false },
          { channel: 'Arabic social', state: 'Not started', done: false },
          { channel: 'Email', state: 'Not started', done: false },
        ],
      },
    ],
  },
]

export const DEFAULT_MARKET_ID = 'sa'

export function getMarket(id: string): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0]
}

/* ------------------------------------------------------------------ *
 * Resolution
 * ------------------------------------------------------------------ */

export interface ResolvedEntry {
  id: string
  kind: CalendarEntry['kind']
  title: string
  short: string
  /** Day of the month. For a market event this came from the verified record. */
  day: number
  status: ActivityStatus
  work: WorkItem[]
  awaiting?: string
  /** Company events only: what kind of business moment this is. */
  eventType?: string
  /** Market events only: the verified record behind the date. */
  observance?: Observance
}

/**
 * Turns a market's entries into something a component can place on a grid.
 *
 * A market event's day is read from the verified record, and it is dropped
 * entirely if it does not fall in that market's anchored month — better an
 * absent occasion than one moved to fit the layout.
 */
export function resolveEntries(market: Market): ResolvedEntry[] {
  const out: ResolvedEntry[] = []

  for (const entry of market.entries) {
    if (entry.kind === 'company') {
      out.push({
        id: entry.id,
        kind: 'company',
        title: entry.title,
        short: entry.short,
        day: entry.day,
        status: entry.status,
        work: entry.work,
        awaiting: entry.awaiting,
        eventType: entry.eventType,
      })
      continue
    }

    const observance = getObservance(entry.observanceId)
    if (observance.month !== market.anchor.month) continue
    if (observance.country !== market.code) continue
    out.push({
      id: entry.id,
      kind: 'market',
      title: observance.name,
      short: entry.short,
      day: observance.day,
      status: entry.status,
      work: entry.work,
      awaiting: entry.awaiting,
      observance,
    })
  }

  return out.sort((a, b) => a.day - b.day)
}

/* ------------------------------------------------------------------ *
 * The grid
 * ------------------------------------------------------------------ */

/** Sunday first — the working week across the Gulf and the Levant. */
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MONTH_NAMES = [
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

export interface DayCell {
  /** Null for the leading and trailing blanks that pad the grid. */
  day: number | null
  entry?: ResolvedEntry
  /** Before, on, or after the anchored reference day. */
  when: 'past' | 'today' | 'future'
}

/**
 * Builds a market's month grid, padded to whole weeks.
 *
 * Uses Date.UTC so the first weekday of the month cannot shift with the
 * viewer's timezone — the grid must be identical everywhere it renders.
 */
export function buildMonth(market: Market, entries: ResolvedEntry[]): DayCell[] {
  const { year, month, today } = market.anchor
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDay = new Map(entries.map((e) => [e.day, e]))

  const cells: DayCell[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, when: 'past' })
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      entry: byDay.get(day),
      when: day < today ? 'past' : day === today ? 'today' : 'future',
    })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, when: 'future' })

  return cells
}

/** "September 2026" — the month, with the year, because it is a real one. */
export function monthLabel(market: Market): string {
  return `${MONTH_NAMES[market.anchor.month - 1]} ${market.anchor.year}`
}
