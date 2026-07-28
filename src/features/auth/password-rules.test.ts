import { describe, expect, it } from 'vitest'
import { PASSWORD_STRENGTH_LABELS, passwordRules, passwordScore } from './password-rules'

describe('password rules', () => {
  it('reports each rule independently, so the checklist can say which one failed', () => {
    const rules = passwordRules('alllowercase')
    expect(rules.find((r) => r.id === 'length')?.met).toBe(true)
    expect(rules.find((r) => r.id === 'case')?.met).toBe(false)
    expect(rules.find((r) => r.id === 'number')?.met).toBe(false)
  })

  it('scores 0 to 3 and only reaches 3 when every rule is met', () => {
    expect(passwordScore('')).toBe(0)
    expect(passwordScore('short')).toBe(0)
    expect(passwordScore('longenough')).toBe(1)
    expect(passwordScore('LongEnough')).toBe(2)
    expect(passwordScore('LongEnough1')).toBe(3)
    expect(passwordScore('LongEnough!')).toBe(3)
  })

  it('has a label for every reachable score', () => {
    expect(PASSWORD_STRENGTH_LABELS).toHaveLength(4)
    for (const value of ['', 'short', 'longenough', 'LongEnough', 'LongEnough1']) {
      expect(PASSWORD_STRENGTH_LABELS[passwordScore(value)]).toBeTruthy()
    }
  })
})
