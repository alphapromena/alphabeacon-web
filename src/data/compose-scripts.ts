/**
 * The canned runs behind F1's live stream.
 *
 * This is the seam where a real streaming endpoint would sit. Because the app
 * is static, the "model" is a script and a timer (`lib/compose-player.ts`) —
 * but every state F1 must render is a state a real stream produces, so the five
 * scripts here are the five outcomes, not five happy paths:
 *
 *   complete       — the ordinary run
 *   complete + flag — a guardrail fires mid-stream; the text is NEVER hidden
 *   dropped        — the stream breaks; the partial text is kept for recovery
 *   long           — enough tokens that stopping is a real choice
 *   rate_limited   — refused before a single token, said out loud
 *
 * A script is chosen by a word in the prompt (`trigger`), so every designed
 * state is reachable by typing rather than by a demo-only control living in the
 * product. The rate-limited script is chosen by the session's run count instead
 * — a limit you can trigger on purpose is not a limit.
 */
import type { Claim } from '@/data/types'

export interface ComposeScript {
  id: string
  /** Shown nowhere; names the run in tests and in the verify output. */
  label: string
  /** Lower-cased word that selects this script when the prompt contains it. */
  trigger?: string
  /** The finished copy. The player emits it a word at a time. */
  copy: string
  /** Grounding surfaces as the sentence carrying it finishes, not all at once. */
  claims: { afterWord: number; claim: Claim }[]
  outcome: 'complete' | 'dropped' | 'rate_limited'
  /** dropped only: the word index the stream breaks after. */
  dropAfterWord?: number
  /** dropped only: what happened and what survives. */
  dropReason?: string
  /** The "why this post" line on the draft the run produces. */
  rationale: string
}

export const COMPOSE_SCRIPTS: ComposeScript[] = [
  {
    id: 'cs_launch',
    label: 'happy path',
    copy:
      'The Kirinyaga AA landed Tuesday and we roasted it Thursday — that is the whole trick. ' +
      'Kenyan AA lots from Kirinyaga cup blackcurrant and cane sugar when they are this fresh, ' +
      'and they lose that inside a month. We are shipping it within 48 hours of the roast, ' +
      'which is the only part of this we can actually control. Order the first crack of it today.',
    claims: [
      {
        afterWord: 28,
        claim: {
          id: 'claim_kenya_profile',
          source: 'sca.coffee/research/kenya-flavour-wheel',
          title: 'Kenyan AA lots from Kirinyaga are documented for blackcurrant acidity.',
          state: 'verified',
        },
      },
      {
        afterWord: 46,
        claim: {
          id: 'claim_freshness',
          source: 'perfectdailygrind.com/2026/03/coffee-staling-timeline',
          title: 'Aromatic compounds fall off measurably in the first four weeks after roast.',
          state: 'verified',
        },
      },
    ],
    outcome: 'complete',
    rationale:
      'You asked for it directly, and it leans on the two facts we can source: the origin profile and the staling window.',
  },
  {
    id: 'cs_competitor',
    label: 'guardrail flags a claim mid-stream',
    trigger: 'competitor',
    copy:
      'Most subscription roasters ship coffee that was roasted three weeks before it reaches you. ' +
      'We roast to order and ship inside 48 hours, and we are cheaper per cup than the big ' +
      'subscription boxes once you account for what you throw away. That is the difference you ' +
      'taste on a Tuesday morning, not the one on the label.',
    claims: [
      {
        afterWord: 16,
        claim: {
          id: 'claim_ship_window',
          source: 'atlasroasters.example/roast-log',
          title: 'Our own roast log: every order left the roastery within 48 hours last quarter.',
          state: 'verified',
        },
      },
      {
        // The flag arrives WITH the sentence that earned it. The text keeps
        // streaming underneath — flagging is not censoring.
        afterWord: 31,
        claim: {
          id: 'claim_cheaper_per_cup',
          source: 'no source found',
          title:
            'We could not verify the per-cup price comparison. Check it yourself before this goes out.',
          state: 'flagged',
        },
      },
    ],
    outcome: 'complete',
    rationale:
      'A comparison post needs numbers we can stand behind. One of the two claims here is not sourced — it is flagged, not removed.',
  },
  {
    id: 'cs_breaking',
    label: 'stream drops mid-run',
    trigger: 'breaking',
    copy:
      'Arabica futures moved again this morning, and the number that matters for your cup is not ' +
      'the headline one. Here is what actually changes when the C price swings: the differential ' +
      'a farm negotiates, the shipping contracts already signed, and the roast schedule nobody ' +
      'reprints. We buy on twelve-month agreements, so this week moves nothing on our shelf.',
    claims: [
      {
        afterWord: 12,
        claim: {
          id: 'claim_c_price',
          source: 'ico.org/documents/cy2025-26/coffee-market-report',
          title: 'The C price is a benchmark, not the price any single farm receives.',
          state: 'verified',
        },
      },
    ],
    outcome: 'dropped',
    dropAfterWord: 34,
    dropReason:
      'The connection dropped while the draft was still being written. Nothing was lost — what arrived is below, and you can pick it up from there.',
    rationale: 'A market post, grounded in the benchmark rather than the headline.',
  },
  {
    id: 'cs_thread',
    label: 'long run, where stopping is a real choice',
    trigger: 'thread',
    copy:
      'Everything we know about roasting to order, in one place. ' +
      'One: freshness is a schedule problem, not a marketing one — the roast date has to be later ' +
      'than the order date, and that is a logistics decision you make once. ' +
      'Two: green coffee is stable for months and roasted coffee is not, so the inventory you ' +
      'hold should be green, which costs you cash flow and buys you flavour. ' +
      'Three: the 48-hour promise only works if the roaster and the packer are the same building, ' +
      'because every handoff adds a day. ' +
      'Four: degassing means the best cup is usually day four to day ten, so shipping fast is ' +
      'about landing inside that window rather than beating it. ' +
      'Five: none of this matters if the grind is wrong at the other end, which is why every bag ' +
      'goes out with a brew card nobody asked for. ' +
      'That is the whole method. Ask us anything about the parts we got wrong first.',
    claims: [
      {
        afterWord: 52,
        claim: {
          id: 'claim_green_stability',
          source: 'sca.coffee/standards/green-coffee-storage',
          title:
            'Green coffee holds its quality for months under stable storage; roasted does not.',
          state: 'verified',
        },
      },
      {
        afterWord: 96,
        claim: {
          id: 'claim_degassing',
          source: 'perfectdailygrind.com/2025/11/degassing-and-extraction',
          title: 'Extraction stabilises roughly four to ten days after roast.',
          state: 'verified',
        },
      },
    ],
    outcome: 'complete',
    rationale: 'A long-form thread, which is why it takes a while and why stopping is offered.',
  },
  {
    id: 'cs_limit',
    label: 'refused: on-demand allowance spent',
    copy: '',
    claims: [],
    outcome: 'rate_limited',
    rationale: '',
  },
]
