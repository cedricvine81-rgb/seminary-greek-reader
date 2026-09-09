/**
 * safeInternalPath — the guard on every user-supplied "where to go next".
 *
 * The vectors that matter are the ones that LOOK relative. `startsWith('/') &&
 * !startsWith('//')` was the previous check in both the preview redirect and the practice
 * page's back link, and `/\evil.example` walks straight through it: browsers treat a
 * backslash as a path separator in a special scheme, so it resolves to https://evil.example/.
 */
import { safeInternalPath } from '@/lib/safe-path'

describe('safeInternalPath', () => {
  it.each([
    ['/grammar?chapter=nouns&level=beginning', '/grammar?chapter=nouns&level=beginning'],
    ['/student/assignments/abc123', '/student/assignments/abc123'],
    ['/a/b#frag', '/a/b#frag'],
    ['/', '/'],
  ])('keeps the same-site path %s', (input, expected) => {
    expect(safeInternalPath(input)).toBe(expected)
  })

  it.each([
    '//evil.example',
    '/\\evil.example',        // backslash: parses to another ORIGIN, passes a naive // test
    '/\\/evil.example',
    '/\t/evil.example',       // tab is stripped by the URL parser, leaving //
    'https://evil.example',
    'http://evil.example/x',
    'javascript:alert(1)',
    '//evil.example/path?x=1',
  ])('rejects %s', bad => {
    expect(safeInternalPath(bad)).toBeNull()
  })

  it('rejects anything that is not an absolute path', () => {
    expect(safeInternalPath('grammar')).toBeNull()
    expect(safeInternalPath('')).toBeNull()
    expect(safeInternalPath(null)).toBeNull()
    expect(safeInternalPath(undefined)).toBeNull()
  })

  it('returns what the BROWSER would resolve, not what was passed in', () => {
    // The caller renders/redirects to the return value, so the check and the destination
    // can never disagree about what the string means.
    expect(safeInternalPath('/a/../b')).toBe('/b')
  })
})
