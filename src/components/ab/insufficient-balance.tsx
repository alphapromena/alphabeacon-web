/**
 * The 402 state (INT-9, decisions.md D-INT-E).
 *
 * `wallet_insufficient` is the one refusal in this API that a user could act
 * on — which is exactly why it has its own code instead of hiding inside a 400
 * — so it gets a state rather than a toast that vanishes.
 *
 * What it must do, in order of how badly it goes wrong otherwise:
 * 1. **Keep the user's input.** They wrote a prompt and pressed a button; the
 *    refusal happened before anything ran, so losing the prompt would punish
 *    them for the platform's accounting.
 * 2. **Show the actual balance.** "Insufficient funds" without a number is
 *    unanswerable.
 * 3. **Not offer a top-up.** There is no funding endpoint on this API — orgs
 *    are funded once, server-side, at creation. A "Buy more" button here would
 *    lead nowhere, so the honest instruction is to contact support.
 */
import { Wallet } from 'lucide-react'
import type { Wallet as WalletBalance } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'
import { formatCents } from '@/lib/money'

export function InsufficientBalance({ wallet }: { wallet: WalletBalance | null }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg border border-warning/60 bg-warning/10 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Wallet aria-hidden className="size-4 shrink-0" />
        {MESSAGES.errors.walletInsufficient}
      </p>
      {wallet && (
        <p className="text-sm text-muted-foreground">
          Available: <span className="tabular-nums">{formatCents(wallet.availableCents)}</span>
          {wallet.heldCents > 0 && (
            <>
              {' '}
              · <span className="tabular-nums">{formatCents(wallet.heldCents)}</span> is reserved by
              work already running, and comes back when it finishes.
            </>
          )}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{MESSAGES.notices.noSelfServeTopUp}</p>
      <p className="text-xs text-muted-foreground">
        Nothing was generated and nothing was charged — what you wrote is still here.
      </p>
    </div>
  )
}
