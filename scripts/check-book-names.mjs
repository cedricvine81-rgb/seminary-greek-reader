/**
 * Coverage check for the localized book-name catalogue (src/lib/i18n/book-names.ts).
 *
 * The catalogue is keyed by OSIS id, and the ids come from public/data/books.json — the same
 * file the reader and the search book pickers load. Those can drift apart in both directions:
 * a new corpus adds books nobody translated (the reader shows English inside a Spanish page),
 * or an id is renamed and an entry becomes dead weight that silently never matches.
 *
 * A missing name is NOT an error — it falls back to English by design, which is why this
 * reports rather than fails. A name for an id that does not exist IS reported louder, because
 * it is always a mistake: it can never render.
 *
 * Usage: node scripts/check-book-names.mjs [--strict]
 *        --strict exits non-zero on missing names too (for a locale you consider finished).
 */
import fs from 'node:fs'

const BOOKS = 'public/data/books.json'
const SRC = 'src/lib/i18n/book-names.ts'

const catalog = JSON.parse(fs.readFileSync(BOOKS, 'utf8'))
const ids = new Map()   // osisId -> English name, first corpus wins
for (const corpus of ['gnt', 'lxx', 'mt']) {
  for (const b of catalog[corpus] ?? []) if (!ids.has(b.osisId)) ids.set(b.osisId, b.name)
}

// Parse the locale tables out of the source rather than importing it: this is a plain .mjs
// script and book-names.ts is TypeScript. The shape is a fixed literal, so a regex is honest
// here — and if the file's shape ever changes enough to break this, the counts go to zero and
// the check says so instead of quietly passing.
const src = fs.readFileSync(SRC, 'utf8')
const locales = {}
for (const m of src.matchAll(/^const (\w+): Record<string, BookLabel> = \{$([\s\S]*?)^\}$/gm)) {
  const entries = new Set()
  for (const e of m[2].matchAll(/^\s*'?([A-Za-z0-9]+)'?:\s*\{\s*name:/gm)) entries.add(e[1])
  locales[m[1]] = entries
}

if (Object.keys(locales).length === 0) {
  console.error(`book names: parsed no locale tables from ${SRC} — has its shape changed?`)
  process.exit(1)
}

let missingTotal = 0, orphanTotal = 0
console.log(`book names: ${ids.size} OSIS ids in ${BOOKS}`)
for (const [loc, entries] of Object.entries(locales)) {
  const missing = [...ids.keys()].filter(id => !entries.has(id))
  const orphans = [...entries].filter(id => !ids.has(id))
  missingTotal += missing.length
  orphanTotal += orphans.length
  const pct = Math.round(((ids.size - missing.length) / ids.size) * 100)
  console.log(`  ${loc}: ${ids.size - missing.length}/${ids.size} (${pct}%)`)
  if (missing.length) console.log(`     missing (falls back to English): ${missing.join(', ')}`)
  if (orphans.length) console.error(`     ORPHANED — no such book, can never render: ${orphans.join(', ')}`)
}

if (orphanTotal) { console.error(`\nbook names: ${orphanTotal} orphaned entr(ies).`); process.exit(1) }
if (missingTotal && process.argv.includes('--strict')) {
  console.error(`\nbook names: ${missingTotal} missing (--strict).`); process.exit(1)
}
process.exit(0)
