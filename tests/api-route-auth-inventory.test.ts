/**
 * Every API route must either verify authentication IN THE HANDLER, or be on the explicit
 * public list below. This exists because the middleware's PUBLIC_API_PREFIXES list is
 * load-bearing and hand-maintained, and because middleware only DECODES the JWT (role
 * routing) — it does not verify the signature. A route that relies on middleware alone
 * accepts a forged token. The 2026-09 audit found two such routes (register/citations,
 * register/passage); this test keeps the count at zero.
 *
 * If this test fails on a route you just added:
 *   - a route that touches user data: call getPayload() (or requireRole) and return 401.
 *   - a deliberately public route (read-only corpus data, webhook with its own trust
 *     mechanism): add it to PUBLIC_ROUTES with a one-line reason.
 *
 * The equality check runs both ways, so a route that later GAINS auth must also be
 * removed from PUBLIC_ROUTES — the list cannot rot.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const API_ROOT = join(__dirname, '..', 'src', 'app', 'api')

/** Helpers that constitute real, signature-verifying auth inside a handler. */
const AUTH_PATTERN =
  /\b(getPayload|getCurrentUser|getAuthUser|requireAuth|requireRole|verifyToken|getTokenFromCookies)\b/

/** Routes that are public ON PURPOSE. Path is relative to src/app/api, no trailing /route.ts. */
const PUBLIC_ROUTES: Record<string, string> = {
  'allusions':             'read-only LXX allusion search over corpus files',
  'construct/lemmas':      'read-only lexeme lookup for construct search',
  'lexicon':               'read-only lexicon lookup',
  'profile/institutions':  'institution list for the sign-up dropdown',
  'reader':                'read-only Bible text',
  'search':                'read-only corpus search',
  'search/backgrounds':    'read-only backgrounds search',
  'search/context':        'read-only verse context',
  'suggest':               'read-only reference suggestions',
  'translation':           'read-only translations',
  'vocab-sentence':        'read-only "identify the word" drill text',
  'webhooks/paddle':       'trust via Paddle HMAC signature, not a session cookie',
}

function routeFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...routeFiles(p))
    else if (name === 'route.ts') out.push(p)
  }
  return out
}

describe('API route auth inventory', () => {
  const files = routeFiles(API_ROOT)

  it('finds a plausible number of routes', () => {
    expect(files.length).toBeGreaterThan(80) // 103 at the time of writing
  })

  it('every route verifies auth in-handler, or is explicitly public', () => {
    const unverified = files
      .filter(f => !AUTH_PATTERN.test(readFileSync(f, 'utf8')))
      .map(f => relative(API_ROOT, f).replace(/\/route\.ts$/, ''))
      .sort()
    // Set equality, both directions: a NEW unauthenticated route fails until it is either
    // given auth or consciously listed; a listed route that gains auth (or is deleted)
    // fails until it is removed from the list.
    expect(unverified).toEqual(Object.keys(PUBLIC_ROUTES).sort())
  })

  it('client-error keeps its flood guard', () => {
    // /api/client-error is on the middleware public list (errors happen signed out); it
    // calls verifyToken only to ATTRIBUTE reports, so it passes the check above, but its
    // real guard against log flooding is the per-IP token bucket — assert it stays.
    const src = readFileSync(join(API_ROOT, 'client-error', 'route.ts'), 'utf8')
    expect(src).toMatch(/bucket|rateLimit/)
  })
})
