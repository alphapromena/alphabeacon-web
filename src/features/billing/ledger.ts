/**
 * Reading a credit balance as arithmetic rather than as a list.
 *
 * H3 already showed every row and the balance, and the rows really did sum to
 * it — but a reader looking at "granted 500" and "balance 458" was left to
 * find the missing 42 themselves by adding up a table. That is the gap this
 * closes: the same four numbers, stated as the sum they are.
 *
 * Pure and separate from the screen so the identity below can be asserted
 * against every dataset, which is the only way a world whose ledger does not
 * reconcile gets caught before someone reads it on screen.
 */
import type { LedgerEntry } from '@/data/types'

export interface LedgerReconciliation {
  /** Everything added: plan grants and refunds. */
  granted: number
  /** Committed, and therefore gone. */
  spent: number
  /** Reserved by runs that have neither committed nor released — still yours. */
  held: number
  /** granted − spent − held, and equal to the plain sum of every row. */
  balance: number
}

const sumOf = (ledger: LedgerEntry[], ...types: LedgerEntry['type'][]) =>
  ledger
    .filter((entry) => types.includes(entry.type))
    .reduce((total, entry) => total + entry.amount, 0)

export function reconcileLedger(ledger: LedgerEntry[]): LedgerReconciliation {
  const granted = sumOf(ledger, 'grant', 'refund')
  const spent = -sumOf(ledger, 'committed')
  // A hold that resolved produced a matching release, so the two cancel; what
  // is left is what is still being held by runs in flight.
  const held = -(sumOf(ledger, 'reserved') + sumOf(ledger, 'released'))
  return { granted, spent, held, balance: granted - spent - held }
}

/** The reserves that have not resolved yet — the rows H3 marks "Held". */
export function outstandingHolds(ledger: LedgerEntry[]): LedgerEntry[] {
  return ledger.filter((entry) => {
    if (entry.type !== 'reserved') return false
    const settled = ledger.filter(
      (other) =>
        other.ref?.id === entry.ref?.id &&
        (other.type === 'released' || other.type === 'committed'),
    )
    return settled.length === 0
  })
}
