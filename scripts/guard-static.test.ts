import { describe, expect, it } from 'vitest'
import { codeOf, findViolations } from './guard-static'

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

  it('allows fetch in the two licensed files, and only those two', () => {
    const content = 'const response = await fetch(`${base}${path}`)'
    expect(findViolations('src/api/client.ts', content)).toEqual([])
    expect(findViolations('src\\api\\client.ts', content)).toEqual([])
    // The presigned-upload helper: the one non-API request the app makes.
    expect(findViolations('src/api/upload.ts', content)).toEqual([])
    // Anywhere else under src/api/ the licence does not extend — a third
    // network caller is exactly what D-INT-A exists to prevent.
    expect(findViolations('src/api/media.ts', content)).toMatchObject([{ rule: 'fetch' }])
  })

  it('still bans everything else inside the licensed files', () => {
    expect(
      findViolations('src/api/client.ts', "const base = 'https://hardcoded.example'"),
    ).toMatchObject([{ rule: 'http-literal' }])
    expect(findViolations('src/api/stream.ts', 'new EventSource(url)')).toMatchObject([
      { rule: 'EventSource' },
    ])
  })

  it('a fetch outside the licensed files is still a violation, even in src/apixyz', () => {
    expect(findViolations('src/apixyz/sneaky.ts', "fetch('/x')")).toMatchObject([
      { rule: 'fetch' },
    ])
    expect(findViolations('src/features/today/queue.ts', "fetch('/x')")).toMatchObject([
      { rule: 'fetch' },
    ])
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

  it('bans the marks of calling AlphaProStudio directly (Ward, 2026-08-17)', () => {
    const cases: [string, string][] = [
      ['upstream-origin', "const cdn = 'd111111abcdef8.cloudfront.net'"],
      ['signing-header', "headers['x-aps-key-id'] = keyId"],
      ['upstream-route', "const target = base + '/v1/run/tones.preview'"],
      ['service-key', 'const signature = sign(svcKey, canonical)'],
      ['service-key', 'const secret = env.SVC_KEY_SECRET'],
      ['edge-secret', 'const guard = config.edgeSecret'],
      ['edge-secret', 'const guard = env.SVC_EDGE_SECRET'],
    ]
    for (const [rule, line] of cases) {
      expect(findViolations('src/api/client.ts', line), line).toMatchObject([{ rule }])
    }
  })

  it('lets a comment DOCUMENT the upstream route it forbids in code', () => {
    // The trap this closes: a check that matched prose would fire on the very
    // doc comments that explain the proxy, and then get deleted.
    const content = [
      '/** Proxied to the upstream /v1/run/tones.preview — sync. */',
      "export const PREVIEW = '/posts/tones-preview'",
      '// Signed with x-aps-* headers by the BACKEND, never here.',
    ].join('\n')
    expect(findViolations('src/api/posts.ts', content)).toEqual([])
  })

  it('a banned literal in code is still caught next to prose that mentions it', () => {
    const content = [
      '// the note below is prose; the line under it is not',
      "const route = '/v1/media/jobs'",
    ].join('\n')
    expect(findViolations('src/api/media-paths.ts', content)).toMatchObject([
      { line: 2, rule: 'upstream-route' },
    ])
  })

  it('prose inside a plain block comment stays prose across every line of it', () => {
    const content = [
      '/*',
      '  The backend signs /v1/run/* with x-aps-* headers.',
      '  We never do.',
      '*/',
      'export const OURS = 1',
    ].join('\n')
    expect(findViolations('src/api/notes.ts', content)).toEqual([])
  })

  it('a comment does not hide the code that follows it on the next line', () => {
    // The state machine must close the block, or every later violation is lost.
    const content = ['/* a note */', "const svcKey = 'x'"].join('\n')
    expect(findViolations('src/api/leak.ts', content)).toMatchObject([
      { line: 2, rule: 'service-key' },
    ])
  })

  it('does not mistake division for a comment', () => {
    expect(findViolations('src/lib/math.ts', 'const ratio = total / count / 2')).toEqual([])
  })

  it("an apostrophe in JSX prose does not swallow the rest of the file", () => {
    // The bug that killed the first implementation: an unclosed string mode
    // blanked every following line, and the guard silently stopped guarding.
    const content = [
      "export const Note = () => <p>Don't sign anything here.</p>",
      "const svcKey = 'x'",
    ].join('\n')
    expect(findViolations('src/features/x/note.tsx', content)).toMatchObject([
      { line: 2, rule: 'service-key' },
    ])
  })

  it('codeOf blanks comments and keeps code', () => {
    const state = { inBlockComment: false }
    expect(codeOf('const a = 1 // trailing note', state)).toBe('const a = 1 ')
    expect(codeOf('/* opens here', state)).toBe('')
    expect(state.inBlockComment).toBe(true)
    expect(codeOf('  still prose', state)).toBe('')
    expect(codeOf('closes */ const b = 2', state)).toBe(' const b = 2')
    expect(state.inBlockComment).toBe(false)
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
