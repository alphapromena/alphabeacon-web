/**
 * The money rules, pinned. Every case here is one the wire actually produces:
 * the twelve-decimal `costUsdEstimate` strings and the two-decimal catalog
 * prices in Docs/api/alphastudio-shapes.md.
 */
import { describe, expect, it } from 'vitest'
import { formatCents, formatUsdString, sumDecimalStrings } from './money'

describe('formatCents', () => {
  it('renders integer cents exactly', () => {
    expect(formatCents(5000)).toBe('$50.00')
    expect(formatCents(4997)).toBe('$49.97')
    expect(formatCents(0)).toBe('$0.00')
    expect(formatCents(7)).toBe('$0.07')
  })

  it('keeps a negative balance readable rather than hiding it', () => {
    expect(formatCents(-250)).toBe('-$2.50')
  })
})

describe('formatUsdString', () => {
  it('trims a twelve-decimal estimate without rounding it into a lie', () => {
    expect(formatUsdString('0.003749600000')).toBe('$0.0037')
    expect(formatUsdString('0.000300000000')).toBe('$0.0003')
  })

  it('leaves a catalog price alone', () => {
    expect(formatUsdString('0.03')).toBe('$0.03')
    expect(formatUsdString('0.211')).toBe('$0.211')
  })

  it('never displays a real charge as zero', () => {
    // The one output nobody can act on: "you were charged $0.0000".
    expect(formatUsdString('0.00000004')).toBe('< $0.0001')
    expect(formatUsdString('0')).toBe('$0.00')
    expect(formatUsdString('0.00')).toBe('$0.00')
  })

  it('handles whole dollars', () => {
    expect(formatUsdString('12')).toBe('$12.00')
    expect(formatUsdString('1.5')).toBe('$1.50')
  })
})

describe('sumDecimalStrings', () => {
  it('adds exactly, where floats would drift', () => {
    // 0.1 + 0.2 !== 0.3 in a double; it does here.
    expect(sumDecimalStrings(['0.1', '0.2'])).toBe('0.3')
  })

  it('aligns different precisions', () => {
    expect(sumDecimalStrings(['0.003749600000', '0.000647200000', '0.0003'])).toBe('0.004696800000')
  })

  it('sums the smoke run capture to the number the wallet moved by', () => {
    const capture = [
      '0.000300000000',
      '0.003749600000',
      '0.000647200000',
      '0.000677000000',
      '0.000170000000',
    ]
    expect(sumDecimalStrings(capture)).toBe('0.005543800000')
    expect(formatUsdString(sumDecimalStrings(capture))).toBe('$0.0055')
  })

  it('is empty-safe', () => {
    expect(sumDecimalStrings([])).toBe('0')
  })
})
