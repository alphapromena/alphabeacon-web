/**
 * Money on the wire is never a float (decisions.md D-INT-E).
 *
 * Two shapes arrive, and both are exact by construction:
 * - the wallet is INTEGER CENTS (`cents`, `heldCents`, `availableCents`);
 * - `costUsdEstimate` and the catalog's `cost` are DECIMAL STRINGS, e.g.
 *   `"0.003749600000"` or `"0.03"`.
 *
 * The rule for the second kind is display-only: never `parseFloat` it for
 * arithmetic. A float there is a rounding error in someone's billing, and the
 * twelve-decimal strings the usage endpoint returns are exactly the values a
 * double cannot hold. Where a total is genuinely needed, `sumDecimalStrings`
 * adds them as integers in the smallest unit either side declares.
 *
 * Nothing here invents an exchange rate: live mode shows money, the static
 * demo shows its own credits, and the two never convert into each other.
 */

/** `4997` → `"$49.97"`. Integer cents in, exact string out. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(Math.trunc(cents))
  return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

/**
 * A decimal string, trimmed for reading but never rounded into a lie.
 *
 * `"0.003749600000"` → `"$0.0037"`; `"0.03"` → `"$0.03"`. Values smaller than
 * the shown precision become `"< $0.0001"` rather than `"$0.0000"`, because a
 * real charge displayed as zero is the one output nobody can act on.
 */
export function formatUsdString(value: string, maxDecimals = 4): string {
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value.trim())
  if (!match) return value
  const [, sign, wholeRaw, fractionRaw = ''] = match
  const whole = wholeRaw === '' ? '0' : wholeRaw
  const trimmed = fractionRaw.slice(0, maxDecimals).replace(/0+$/, '')
  if (whole === '0' && trimmed === '') {
    // Something was charged, or the value really is zero — say which.
    return /[1-9]/.test(fractionRaw) ? `< $0.${'0'.repeat(maxDecimals - 1)}1` : '$0.00'
  }
  const fraction = trimmed.padEnd(2, '0')
  return `${sign}$${whole}.${fraction}`
}

/**
 * Sums decimal strings EXACTLY, by aligning them on the longest fraction and
 * adding integers. Returns a decimal string, so the result stays in the same
 * currency of discourse as its inputs and can be handed straight back to
 * `formatUsdString`.
 */
export function sumDecimalStrings(values: string[]): string {
  const parsed = values.map((value) => {
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value.trim())
    if (!match) return { sign: 1, whole: '0', fraction: '' }
    const [, sign, whole = '0', fraction = ''] = match
    return { sign: sign === '-' ? -1 : 1, whole: whole || '0', fraction }
  })
  const scale = parsed.reduce((longest, entry) => Math.max(longest, entry.fraction.length), 0)
  const total = parsed.reduce((sum, entry) => {
    const digits = `${entry.whole}${entry.fraction.padEnd(scale, '0')}`
    return sum + BigInt(entry.sign) * BigInt(digits === '' ? '0' : digits)
  }, 0n)

  const negative = total < 0n
  const digits = (negative ? -total : total).toString().padStart(scale + 1, '0')
  const whole = digits.slice(0, digits.length - scale) || '0'
  const fraction = scale > 0 ? digits.slice(digits.length - scale) : ''
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}
