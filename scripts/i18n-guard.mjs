/**
 * Two guards for the interface-translation work, both meant to run BEFORE a push.
 *
 * The question they answer is not "is the Spanish good" but "is the ENGLISH still exactly what
 * it was" — because converting a hard-coded string into a t() lookup replaces something that
 * cannot fail with something that can, in three ways:
 *
 *   1. a typo'd key            -> the user is shown "themes.absencesHeading"
 *   2. a key missing in English -> the same, since the fallback chain ends at the key itself
 *   3. a valid but WRONG key    -> the user is shown the wrong English, and nothing errors
 *
 *   --keys      catches 1 and 2 statically: every t('…') in the source must exist in the
 *               English catalogue. Cheap, and belongs in `build`.
 *
 *   --snapshot  catches all three, including 3, which no static check can reach. It renders
 *               the app in English and records the visible text of each route. Convert a
 *               surface, run it again, and diff: if the English output is unchanged, the
 *               conversion is safe by construction. A wrong-but-valid key moves the text and
 *               shows up immediately — verified by deliberately mislabelling the header with a
 *               valid-but-wrong key, which tsc and --keys both passed and this caught on seven
 *               routes at once.
 *
 * WHAT IT DOES NOT SEE, and this was found the same way: it reads SERVER-RENDERED HTML, so any
 * text behind client state is invisible to it. The Tools hover menu appears zero times in the
 * markup of /themes; a wrong key inside it passed all three checks silently. Interaction-gated
 * UI — hover menus, modals, popovers, anything opened by a click — must still be checked by
 * opening it in a browser. Treat a green snapshot as "the pages did not change", never as
 * "the conversion is correct".
 *
 * Usage:
 *   node scripts/i18n-guard.mjs --keys
 *   node scripts/i18n-guard.mjs --snapshot --write     # record a baseline (dev server running)
 *   node scripts/i18n-guard.mjs --snapshot             # compare against it; non-zero on drift
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const BASE = process.env.I18N_BASE ?? 'http://localhost:3000'
const SNAPSHOT = 'scripts/i18n-english-snapshot.json'

// Routes chosen for coverage of the surfaces students actually see. Add to this as surfaces
// are converted — an unlisted page is an unguarded page.
const ROUTES = [
  '/tools',
  '/themes?topic=godhead',
  '/themes?topic=character-of-god',
  '/texts?work=tert-praxeas',
  '/search/construct',
  '/map',
  '/grammar',
  '/vocab',
]

/** Visible text of a server-rendered page, normalised so whitespace churn is not a diff. */
function visibleText(html) {
  let t = html
  t = t.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  t = t.replace(/<[^>]+>/g, '\n')
  t = t.replace(/&nbsp;/g, ' ')
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  t = t.replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
  t = t.replace(/&[a-z]+;/gi, ' ')
  return t.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

async function fetchEnglish(route) {
  const res = await fetch(BASE + route, {
    headers: { Cookie: 'interface-language=en', 'User-Agent': 'i18n-guard' },
  })
  if (!res.ok) throw new Error(`${route} -> HTTP ${res.status}`)
  return visibleText(await res.text())
}

// ── --keys ────────────────────────────────────────────────────────────────────────────
async function checkKeys() {
  const { ALL_KEYS } = await import('../src/lib/i18n/messages.ts')
  const known = new Set(ALL_KEYS)
  const files = execSync("git ls-files 'src/**/*.ts' 'src/**/*.tsx'").toString().trim().split('\n')
  const bad = []
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8')
    const lines = src.split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/\bt\(\s*'([^']+)'/g)) {
        if (!known.has(m[1])) bad.push(`${f}:${i + 1}  ${m[1]}`)
      }
    })
  }
  if (bad.length) {
    console.error(`i18n: ${bad.length} key(s) referenced but absent from the English catalogue:`)
    bad.forEach(b => console.error('  ' + b))
    return 1
  }
  console.log(`i18n keys: ok (${known.size} defined)`)
  return 0
}

// ── --snapshot ────────────────────────────────────────────────────────────────────────
async function snapshot(write) {
  const now = {}
  for (const r of ROUTES) {
    try { now[r] = await fetchEnglish(r) } catch (e) { now[r] = [`__ERROR__ ${e.message}`] }
  }
  if (write) {
    fs.writeFileSync(SNAPSHOT, JSON.stringify(now, null, 1))
    const lines = Object.values(now).reduce((n, v) => n + v.length, 0)
    console.log(`i18n snapshot written: ${ROUTES.length} routes, ${lines} lines of English`)
    return 0
  }
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`no baseline at ${SNAPSHOT} — run with --write first`)
    return 1
  }
  const before = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
  let drift = 0
  for (const r of ROUTES) {
    const a = before[r] ?? [], b = now[r] ?? []
    const removed = a.filter(x => !b.includes(x))
    const added = b.filter(x => !a.includes(x))
    if (removed.length || added.length) {
      drift++
      console.error(`\n${r}`)
      removed.slice(0, 8).forEach(x => console.error('  - ' + x.slice(0, 110)))
      added.slice(0, 8).forEach(x => console.error('  + ' + x.slice(0, 110)))
      if (removed.length + added.length > 16) console.error(`  … ${removed.length + added.length - 16} more`)
    }
  }
  if (drift) {
    console.error(`\ni18n: English output changed on ${drift} route(s). If the change was `
      + `intended, re-record with --write; otherwise a key is wrong.`)
    return 1
  }
  console.log(`i18n snapshot: English unchanged across ${ROUTES.length} routes`)
  return 0
}

const args = process.argv.slice(2)
const code = args.includes('--keys')
  ? await checkKeys()
  : args.includes('--snapshot')
    ? await snapshot(args.includes('--write'))
    : (console.error('usage: --keys | --snapshot [--write]'), 1)
process.exit(code)
