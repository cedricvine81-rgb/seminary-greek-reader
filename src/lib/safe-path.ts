/**
 * Is this a path on OUR site, and what is it exactly?
 *
 * A user-supplied "where to go next" — a ?back= link, a preview redirect — is only safe if it
 * stays on this origin. The obvious check, `startsWith('/') && !startsWith('//')`, is NOT
 * enough: browsers follow the WHATWG URL rules, where a backslash is a path separator in a
 * special scheme, so `/\evil.example` (and `/\/evil.example`) parse to the ORIGIN
 * `https://evil.example` — they pass a `//` test and still leave the site.
 *
 * So the value is parsed rather than pattern-matched: resolve it against a base and keep it
 * only if the resolved origin is that base. Anything else — an absolute URL, a
 * protocol-relative one, a backslash trick, a `javascript:` URI — resolves elsewhere (or
 * throws) and is rejected.
 */
const BASE = 'https://internal.invalid'

/**
 * The normalised same-site path (`/path?query#hash`), or null.
 *
 * Returns the RESOLVED path, not the input, so a caller can never hand on a form of the value
 * the browser would read differently than the check did.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string' || !value.startsWith('/')) return null
  try {
    const url = new URL(value, BASE)
    if (url.origin !== BASE) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
