import { describe, expect, it } from 'vitest'
import { findViolations } from './guard-static'

describe('findViolations', () => {
  it('passes clean React content', () => {
    const content = [
      "import { useState } from 'react'",
      '',
      'export function Counter() {',
      '  const [count, setCount] = useState(0)',
      '  return <button onClick={() => setCount(count + 1)}>{count}</button>',
      '}',
    ].join('\n')
    expect(findViolations('src/features/Counter.tsx', content)).toEqual([])
  })

  it('flags fetch(', () => {
    const content = "const res = fetch('/api/plans')"
    const violations = findViolations('src/data/api.ts', content)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ line: 1, rule: 'fetch' })
  })

  it('flags new WebSocket', () => {
    const content = "const socket = new WebSocket('wss://example.com/live')"
    const violations = findViolations('src/features/live.ts', content)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ line: 1, rule: 'WebSocket' })
  })

  it('flags an https string literal', () => {
    const content = "const base = 'https://example.com'"
    const violations = findViolations('src/data/config.ts', content)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ line: 1, rule: 'http-literal' })
  })

  it('does not flag an xmlns w3.org namespace line', () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>'
    expect(findViolations('src/assets/icon.svg', content)).toEqual([])
  })

  it('reports correct 1-based line numbers', () => {
    const content = [
      'const a = 1',
      'const b = 2',
      "const socket = new WebSocket('ws://localhost:5173')",
      'const c = 3',
      "const url = 'https://example.com/pricing'",
    ].join('\n')
    const violations = findViolations('src/features/multi.ts', content)
    expect(violations).toHaveLength(2)
    expect(violations[0]).toMatchObject({ line: 3, rule: 'WebSocket' })
    expect(violations[1]).toMatchObject({ line: 5, rule: 'http-literal' })
  })
})
