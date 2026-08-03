// Build the Theology topic index: retrieval-grounded pointers into the Texts library.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: a model is never asked which passages are about a
// topic. Ask that and you get confident, plausible, partly-invented citations — fatal here,
// because the whole value of the page is that a student can trust the pointer. Instead a
// curated query set runs against the same full-text index the search pane uses, and the only
// thing written by hand (or by a model) afterwards is a short summary of a passage that
// retrieval actually returned. Every entry therefore has a real address by construction, and
// the whole index is re-runnable as the corpus grows.
//
//   npx tsx scripts/build-themes.ts <topic-id>        # dump ranked candidates for review
//   npx tsx scripts/build-themes.ts <topic-id> --emit # write the data file
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { TEXT_CATEGORIES, type CatalogWork } from '../src/lib/texts-catalog'
import { TOPICS, type Topic } from '../src/lib/theme-topics'

interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string }

const DATA = path.join(process.cwd(), 'public', 'data')

/** How near a death/afterlife word must sit to a common term for it to count. ~1 sentence. */
const CONTEXT_WINDOW = 220

function loadIndex(): Entry[] {
  const gz = fs.readFileSync(path.join(DATA, 'backgrounds-search-en.json.gz'))
  return JSON.parse(zlib.gunzipSync(gz).toString('utf8'))
}

const WORK_BY_ID = new Map<string, { work: CatalogWork; category: string }>()
for (const c of TEXT_CATEGORIES as any[]) for (const w of c.works) WORK_BY_ID.set(w.id, { work: w, category: c.id })

/** Score one passage against a topic's query set. 0 = not a candidate. */
function score(text: string, topic: Topic): { score: number; hits: string[] } {
  const lower = text.toLowerCase()
  let total = 0
  const hits: string[] = []
  for (const q of topic.queries) {
    const m = q.re.exec(lower)
    if (!m) continue
    // A "context" term is too common to stand alone. Requiring a death word merely SOMEWHERE in
    // the passage is far too weak: Philo's chapters run to thousands of characters, so "soul"
    // and "die" co-occur constantly in passages about nothing of the kind (a discussion of why
    // Sarah's name gained a letter scored 5 that way). Demand PROXIMITY instead.
    if (q.needsContext) {
      const from = Math.max(0, m.index - CONTEXT_WINDOW)
      const near = lower.slice(from, m.index + m[0].length + CONTEXT_WINDOW)
      if (!topic.context.some(c => c.test(near))) continue
    }
    total += q.weight
    hits.push(q.label)
  }
  return { score: total, hits }
}

/** Josephus and the multi-book works carry their book number in `b`; without it a citation
    like "Antiquities 5:171" is unresolvable (that is Ant 13.171, the three-sects passage). */
function ref(work: CatalogWork, e: Entry): string {
  return e.b ? `${work.name} ${e.b}.${e.c}.${e.v}` : `${work.name} ${e.c}:${e.v}`
}

function main() {
  const topicId = process.argv[2]
  const emit = process.argv.includes('--emit')
  const topic = TOPICS.find(t => t.id === topicId)
  if (!topic) { console.error(`Unknown topic "${topicId}". Known: ${TOPICS.map(t => t.id).join(', ')}`); process.exit(1) }

  const index = loadIndex()
  const scored: { e: Entry; score: number; hits: string[] }[] = []
  for (const e of index) {
    if (!WORK_BY_ID.has(e.g)) continue
    const { score: s, hits } = score(e.t, topic)
    if (s >= topic.minScore) scored.push({ e, score: s, hits })
  }
  scored.sort((a, b) => b.score - a.score || a.e.g.localeCompare(b.e.g) || a.e.c - b.e.c || a.e.v - b.e.v)

  // Per-work cap so one enormous work (Josephus, a Church Father) can't crowd out the rest.
  const perWork = new Map<string, number>()
  const kept = scored.filter(s => {
    const n = perWork.get(s.e.g) ?? 0
    if (n >= topic.perWorkCap) return false
    perWork.set(s.e.g, n + 1)
    return true
  })

  const byCategory = new Map<string, number>()
  for (const k of kept) {
    const cat = WORK_BY_ID.get(k.e.g)!.category
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1)
  }

  console.log(`TOPIC: ${topic.label}`)
  console.log(`${index.length.toLocaleString()} indexed passages scanned`)
  console.log(`${scored.length.toLocaleString()} scored >= ${topic.minScore}; ${kept.length} kept after per-work cap of ${topic.perWorkCap}\n`)
  console.log('BY CATEGORY')
  // Array.from, not a spread: the tsconfig target rejects spreading a Map iterator.
  for (const [cat, n] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${String(n).padStart(4)}  (${new Set(kept.filter(k => WORK_BY_ID.get(k.e.g)!.category === cat).map(k => k.e.g)).size} works)`)
  }

  if (!emit) {
    console.log('\nTOP CANDIDATES')
    for (const k of kept.slice(0, 60)) {
      const { work } = WORK_BY_ID.get(k.e.g)!
      console.log(`\n[${k.score}] ${ref(work, k.e)}  {${k.hits.join(', ')}}`)
      console.log(`    ${k.e.t.replace(/\s+/g, ' ').slice(0, 200)}`)
    }
    return
  }

  fs.writeFileSync(
    path.join(DATA, 'themes', `${topic.id}.candidates.json`),
    JSON.stringify(kept.map(k => ({ ...k.e, score: k.score, hits: k.hits })), null, 1),
  )
  console.log(`\nwrote ${kept.length} candidates`)
}

if (!process.argv.includes('--check') && !process.argv.includes('--survey')) main()

// ── Validation ───────────────────────────────────────────────────────────────────────────
// Run with --check. Every curated entry must resolve: its `probe` phrase has to occur in the
// indexed corpus, and the passage it occurs in has to be the one the entry cites. This is what
// makes a hand-written citation trustworthy — and it re-runs whenever a corpus is rebuilt, so a
// renumbering (Josephus was renumbered by Niese section once already) turns into a failed build
// instead of a link that quietly lands in the wrong chapter.
export function check(topicId: string): number {
  const { THEME_PAGES } = require('../src/lib/themes') as typeof import('../src/lib/themes')
  const page = THEME_PAGES.find(p => p.id === topicId)
  if (!page) { console.error(`no curated page for "${topicId}"`); return 1 }
  const index = loadIndex()
  let bad = 0
  for (const e of page.entries) {
    const needle = e.probe.toLowerCase()
    const matches = index.filter(x => x.t.toLowerCase().includes(needle))
    const label = `${e.work} ${e.book ? `${e.book}.` : ''}${e.chapter}:${e.verse}`
    if (matches.length === 0) { console.log(`  NO MATCH   ${label} — probe "${e.probe}"`); bad++; continue }
    const exact = matches.find(m =>
      m.g === e.work && m.c === e.chapter && m.v === e.verse && (e.book === undefined || m.b === e.book))
    if (!exact) {
      const m = matches[0]
      console.log(`  WRONG REF  ${label} — probe found at ${m.g} ${m.b ? `${m.b}.` : ''}${m.c}:${m.v}`)
      bad++
      continue
    }
    if (matches.length > 3) console.log(`  (probe for ${label} is not distinctive: ${matches.length} passages)`)
  }
  console.log(`\n${page.entries.length} entries checked, ${bad} unresolved`)
  return bad === 0 ? 0 : 1
}

if (process.argv.includes('--check')) process.exit(check(process.argv[2]))

// ── Survey ───────────────────────────────────────────────────────────────────────────────
// Run with --survey. Scores every topic against the whole corpus and reports what is actually
// there, per tradition. This runs BEFORE curation, not after, because it answers the question
// that decides where the effort goes: which topics can this library support, and which are
// anachronistic for the Jewish sources however much they matter to Christian theology? A topic
// with 200 hits in the Fathers and 3 in Second Temple Judaism is not a failure — it is a finding,
// and the page should say so rather than pad the thin half.
export function survey() {
  const { TOPICS } = require('../src/lib/theme-topics') as typeof import('../src/lib/theme-topics')
  const index = loadIndex()
  const JEWISH = new Set(['pseudepigrapha', 'apocrypha', 'josephus', 'philo', 'septuagint'])
  const CHRISTIAN = new Set(['apostolic-fathers', 'church-fathers', 'nt-apocrypha'])
  console.log('topic'.padEnd(16), 'total'.padStart(6), '2ndT'.padStart(6), 'rabb'.padStart(6), 'chrn'.padStart(6), 'g-r'.padStart(6), '  works  verdict')
  for (const topic of TOPICS) {
    const kept: { cat: string; g: string }[] = []
    const perWork = new Map<string, number>()
    const rows = index
      .filter(e => WORK_BY_ID.has(e.g))
      .map(e => ({ e, s: score(e.t, topic).score }))
      .filter(r => r.s >= topic.minScore)
      .sort((a, b) => b.s - a.s)
    for (const r of rows) {
      const n = perWork.get(r.e.g) ?? 0
      if (n >= topic.perWorkCap) continue
      perWork.set(r.e.g, n + 1)
      kept.push({ cat: WORK_BY_ID.get(r.e.g)!.category, g: r.e.g })
    }
    const n = (pred: (c: string) => boolean) => kept.filter(k => pred(k.cat)).length
    const jew = n(c => JEWISH.has(c)), rab = n(c => c === 'rabbinic' || c === 'targums')
    const chr = n(c => CHRISTIAN.has(c)), gr = n(c => c === 'greco-roman')
    // These are RECALL numbers. Nothing here measures precision, and the gap is not academic:
    // "only begotten" is an ordinary idiom for an only child, and before it was gated on a
    // divine subject it manufactured 38 Second Temple Jewish hits for the Trinity — a topic
    // those sources do not contain at all. So no row here says "ready"; it says how much there
    // is to read, and a sample must be read before any topic is curated.
    const verdict = kept.length < 40 ? 'thin — widen the queries first'
      : jew < 15 ? 'lopsided Christian — check the Jewish hits are real'
      : chr < 10 ? 'lopsided Jewish — expected for practice topics'
      : 'enough to sample'
    console.log(
      topic.id.padEnd(16), String(kept.length).padStart(6), String(jew).padStart(6),
      String(rab).padStart(6), String(chr).padStart(6), String(gr).padStart(6),
      String(perWork.size).padStart(7), '  ' + verdict)
  }
}

if (process.argv.includes('--survey')) { survey(); process.exit(0) }
