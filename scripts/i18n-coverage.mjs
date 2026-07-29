/**
 * Report interface-localisation progress: which components still hold hard-coded English,
 * ranked by how much, so the next slice can be chosen by impact rather than guessed at.
 *
 * A "string" here is a run of visible English in JSX — either text between tags or a
 * label/placeholder/title prop. It over-counts a little (some are ids or class fragments) and
 * under-counts a little (template literals), so treat it as a ranking, not an inventory.
 *
 * Usage:  node scripts/i18n-coverage.mjs [--top N] [--file <path>]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'src'
const args = process.argv.slice(2)
const top = Number(args[args.indexOf('--top') + 1]) || 25
const only = args.includes('--file') ? args[args.indexOf('--file') + 1] : null

// Text between tags, and the common text-bearing props.
const BETWEEN_TAGS = />\s*([A-Z][A-Za-z][^<>{}\n]{2,60}?)\s*</g
const TEXT_PROPS = /\b(?:label|placeholder|title|aria-label|description|hint)=["']([A-Z][^"']{2,60})["']/g
// Not worth translating / not user-visible.
const IGNORE = /^(?:[A-Z0-9_]+|https?:|\/|#|[0-9.,%$]+|[A-Z]{2,5})$/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.tsx$/.test(e.name)) out.push(p)
  }
  return out
}

const rows = []
let totalRemaining = 0, totalTranslated = 0
for (const file of walk(ROOT)) {
  if (only && !file.includes(only)) continue
  const src = fs.readFileSync(file, 'utf8')
  const translated = (src.match(/\bt\(['"]/g) || []).length
  const found = new Set()
  for (const re of [BETWEEN_TAGS, TEXT_PROPS]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) {
      const s = m[1].trim()
      if (!IGNORE.test(s) && /[a-z]/.test(s)) found.add(s)
    }
  }
  totalRemaining += found.size
  totalTranslated += translated
  if (found.size || translated) rows.push({ file: file.replace(/^src\//, ''), remaining: found.size, translated, samples: [...found].slice(0, 3) })
}

rows.sort((a, b) => b.remaining - a.remaining)
const pct = totalTranslated + totalRemaining > 0
  ? (totalTranslated / (totalTranslated + totalRemaining) * 100).toFixed(1) : '0'
console.log(`translated calls: ${totalTranslated}   remaining literals: ${totalRemaining}   (~${pct}% of touched strings)`)
console.log(`files with any remaining: ${rows.filter(r => r.remaining).length}\n`)
console.log('most English left, by file:')
for (const r of rows.slice(0, top)) {
  if (!r.remaining) continue
  console.log(`  ${String(r.remaining).padStart(4)} left, ${String(r.translated).padStart(3)} done  ${r.file}`)
  console.log(`        e.g. ${r.samples.map(s => JSON.stringify(s)).join(', ')}`)
}
const done = rows.filter(r => r.translated && !r.remaining).map(r => r.file)
if (done.length) console.log(`\nfully localised (${done.length}): ${done.join(', ')}`)
