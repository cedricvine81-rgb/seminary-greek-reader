#!/usr/bin/env node
/**
 * Find user-visible English that never passes through t().
 *
 * WHY THE OTHER TWO GUARDS MISS IT. `i18n-guard --keys` checks that every t('key') a
 * component asks for exists in messages.ts, and `i18n-content --audit` checks that every
 * string in a content catalogue has a Spanish counterpart. Both can report 100% while the
 * screen is still half English, because neither can see a sentence that was typed straight
 * into the JSX and never offered to the translation layer at all. That is the entire class
 * of bug this finds: not a missing translation, a missing **call**.
 *
 * It is why a Spanish reader could meet "Dotted words are raras en la LXX" — one clause
 * translated, the rest of the sentence hard-coded around it.
 *
 * WHAT IS EXEMPT. Directories whose English is swapped at render time by the content
 * catalogue (the grammar chapters, themes, rhetoric notes) are skipped: their source is
 * English by design and `npm run i18n:audit` is the guard that covers them.
 *
 *   node scripts/i18n-literals.mjs            # summary by file
 *   node scripts/i18n-literals.mjs --list src/components/phrase/AllusionsView.tsx
 */
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

/** Source whose English is translated by the content catalogue, not by t(). */
const CATALOGUE_DIRS = [
  'components/morphology/chapters',
  'components/morphology/hebrew',
  'components/vocab/morphology-explanations',
  'components/themes',
  'data/',
]

/**
 * Pages that are English by intent, not by omission. The legal and marketing pages state
 * the terms a real person is bound by, and a machine-assisted translation of a contract is
 * a liability, not a courtesy — they carry their own language notice instead.
 */
const INTENTIONAL = ['app/terms/', 'app/privacy/', 'app/refunds/', 'app/pricing/']

// A run of prose is English if it has function words. Deliberately conservative: single
// nouns ("Beta Code", a proper name, a siglum) are not flagged, because most are not
// translatable anyway and the noise would bury the real finds.
const FUNCTION_WORDS = /\b(the|and|is|are|was|were|be|this|that|these|with|from|for|which|when|where|only|each|every|their|its|has|have|you|your|will|can|not|but|any|all|into|than|then|shown|use|used)\b/i

// Not prose: code that happens to sit between a '>' and a '<', and runs that are ALREADY
// translated — a t() call whose arguments the hole-collapsing above reduced to noise reads
// like a sentence otherwise, and reporting it would train the reader to ignore the output.
const CODEY = /^[\s{}()[\];,.<>/\\|&%$#@!?*+=~`^-]*$|^[A-Za-z]+\(|=>|\bconst\b|\bfunction\b|className|https?:|\bt\(|\.json\(|\bRecord<|\bawait\b|\breturn\b/

function jsxTextRuns(src) {
  // Strip comments and the import block, then walk the file finding text that sits between
  // a '>' and a '<' — JSX text — including across line breaks, which is where the mixed
  // English/Spanish sentences hide.
  const body = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, ' ')
  const runs = []
  const re = />([^<>]{12,})</g
  let m
  while ((m = re.exec(body)) !== null) {
    // Collapse the JSX expression holes so "text {expr} more text" reads as one run.
    const text = m[1].replace(/\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length < 12 || CODEY.test(text)) continue
    if (!FUNCTION_WORDS.test(text)) continue
    // Count the line the run started on.
    const line = body.slice(0, m.index).split('\n').length
    runs.push({ line, text })
  }
  return runs
}

const files = execSync("find src -name '*.tsx'", { encoding: 'utf8' })
  .trim().split('\n')
  .filter(f => !CATALOGUE_DIRS.some(d => f.includes(d)))

const listing = process.argv.includes('--list')
  ? process.argv[process.argv.indexOf('--list') + 1]
  : null

const byFile = new Map()
for (const f of files) {
  const runs = jsxTextRuns(readFileSync(f, 'utf8'))
  if (runs.length) byFile.set(f, runs)
}

if (listing) {
  const runs = byFile.get(listing) ?? byFile.get(`src/${listing}`) ?? []
  console.log(`${listing}: ${runs.length} untranslated runs`)
  for (const r of runs) console.log(`  ${String(r.line).padStart(4)}  ${r.text.slice(0, 100)}`)
  process.exit(0)
}

const rows = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)
const intentional = rows.filter(([f]) => INTENTIONAL.some(p => f.includes(p)))
const actionable = rows.filter(([f]) => !INTENTIONAL.some(p => f.includes(p)))
const total = actionable.reduce((s, [, r]) => s + r.length, 0)

console.log(`${total} untranslated English runs in ${actionable.length} files\n`)
for (const [f, runs] of actionable) {
  console.log(`${String(runs.length).padStart(4)}  ${f.replace('src/', '')}`)
}
if (intentional.length) {
  const n = intentional.reduce((s, [, r]) => s + r.length, 0)
  console.log(`\n(${n} more in legal/marketing pages, English by intent — see INTENTIONAL)`)
}
console.log(`\nDetail:  node scripts/i18n-literals.mjs --list <file>`)
process.exit(total > 0 ? 1 : 0)
