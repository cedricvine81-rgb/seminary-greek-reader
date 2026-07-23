/**
 * Fill the `freq` field of src/data/bgvb-vocabulary.json from the tagged GNT.
 *
 * The Greek deck shipped with `freq: null` on every word, while the Hebrew deck
 * (built by scripts/build-hebrew-vocabulary.py) carries a real count — so the UI
 * could show frequency ratings for Hebrew but not Greek. This counts each lemma
 * in public/data/gnt and writes the number back, giving both decks the same shape.
 *
 * Only `freq` is touched; word, gloss, pos, section and order are left alone.
 * Idempotent — re-run after the corpus changes.
 *
 *   npx tsx scripts/build-bgvb-frequencies.ts [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { matchLemma, unaccent, normaliseLexeme } from '../src/lib/bgvb-lemmas'

const DRY = process.argv.includes('--dry-run')
const FILE = join(process.cwd(), 'src/data/bgvb-vocabulary.json')

interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  freq: number | null
  order?: number
}

function corpusCounts(): Map<string, number> {
  const dir = join(process.cwd(), 'public/data/gnt')
  const counts = new Map<string, number>()
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      verses: { words: { lemma: string }[] }[]
    }
    for (const verse of data.verses ?? []) {
      for (const w of verse.words ?? []) {
        if (w.lemma) counts.set(w.lemma, (counts.get(w.lemma) ?? 0) + 1)
      }
    }
  }
  return counts
}

const words = JSON.parse(readFileSync(FILE, 'utf8')) as BgvbWord[]
const counts = corpusCounts()

// Accent-insensitive view, keeping the highest count per bare form.
const bare = new Map<string, number>()
counts.forEach((n, lemma) => {
  const key = unaccent(lemma)
  if ((bare.get(key) ?? 0) < n) bare.set(key, n)
})

const missing: string[] = []
let filled = 0, changed = 0

for (const w of words) {
  const n = matchLemma(counts, bare, w.word)
  if (n == null) { missing.push(normaliseLexeme(w.word)); continue }
  if (w.freq == null) filled++
  else if (w.freq !== n) changed++
  w.freq = n
}

const bySection: Record<number, number> = {}
for (const w of words) if (w.freq == null) bySection[w.section] = (bySection[w.section] ?? 0) + 1

console.log(`words=${words.length}  filled=${filled}  corrected=${changed}  unmatched=${missing.length}`)
if (missing.length > 0) {
  console.log(`unmatched by section: ${JSON.stringify(bySection)}`)
  console.log(`  ${missing.join(' ')}`)
}

// Section frequency ranges — the numbers the section headers will show.
for (const s of Array.from(new Set(words.map(w => w.section))).sort()) {
  const f = words.filter(w => w.section === s && w.freq != null).map(w => w.freq as number)
  console.log(`  §${s}: ${Math.min(...f)}–${Math.max(...f)}×  (${f.length}/${words.filter(w => w.section === s).length} matched)`)
}

if (!DRY) {
  writeFileSync(FILE, JSON.stringify(words, null, 2) + '\n', 'utf8')
  console.log(`\nwrote ${FILE}`)
}
