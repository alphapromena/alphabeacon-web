/**
 * H3 in live mode — what this workspace actually spent (INT-9).
 *
 * The static demo's credits ledger answers "why is my balance what it is" from
 * entries the app wrote itself. Live mode has no such ledger: the wire offers a
 * metering read-back over a window, so this view answers the same question from
 * the only honest source there is.
 *
 * Three rules it exists to keep:
 * - **`group_by=tenant` is unreachable.** It reports across every org of this
 *   app, so it is a billing view, not a user's. The seam's type forbids it.
 * - **`costUsdEstimate` is a decimal STRING** and is never parsed into a float
 *   (D-INT-E). Totals are summed exactly in `sumDecimalStrings`.
 * - **`unit` is displayed as it arrives.** The wire returns `input_tokens`,
 *   `output_tokens`, `guardrail_text_units` and will grow more; inventing
 *   friendly names for a vocabulary we do not own would go stale silently.
 */
import { useEffect, useState } from 'react'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { useWalletActions, type Usage, type UsageGrain } from '@/data/wallet'
import { formatUsdString, sumDecimalStrings } from '@/lib/money'

/** Inclusive UTC days, the window the endpoint takes. */
function utcDay(offsetDays = 0): string {
  const at = new Date()
  at.setUTCDate(at.getUTCDate() + offsetDays)
  return at.toISOString().slice(0, 10)
}

export function UsageView() {
  const wallet = useWalletActions()
  const [grain, setGrain] = useState<UsageGrain>('capability')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)

  const from = utcDay(-29)
  const to = utcDay(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void wallet.usage(from, to, grain).then((result) => {
      if (cancelled) return
      setUsage(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the window is fixed; grain is the input
  }, [grain])

  const groups = usage?.groups ?? []
  const total = sumDecimalStrings(groups.map((group) => group.costUsdEstimate))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Usage</h2>
          <p className="text-sm text-muted-foreground">
            The last 30 days, {from} to {to} (UTC).
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Group usage by">
          {(['capability', 'model'] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={grain === option ? 'default' : 'outline'}
              aria-pressed={grain === option}
              onClick={() => setGrain(option)}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Reading your usage…
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nothing metered in this window yet — usage appears here after your first generation.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Usage for {from} to {to}, grouped by {grain}
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th scope="col" className="px-3 py-2 font-medium capitalize">
                    {grain}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Unit
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Quantity
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Estimated cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, index) => (
                  <tr
                    key={`${group.key}-${group.unit}-${index}`}
                    className="border-b border-border last:border-0"
                  >
                    {/* `key` is null for unattributed usage — a real answer. */}
                    <td className="px-3 py-2">{group.key ?? 'Unattributed'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{group.unit}</td>
                    <td className="px-3 py-2 text-right">
                      <MonoNumber value={group.qty} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatUsdString(group.costUsdEstimate)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td className="px-3 py-2 font-medium" colSpan={3}>
                    Total, estimated
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatUsdString(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Costs are the platform&apos;s own estimates, summed exactly from the values it reports —
            your balance is the final word on what was charged.
          </p>
        </>
      )}
    </section>
  )
}
