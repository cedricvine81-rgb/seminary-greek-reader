// Dump a topic's top candidates grouped by tradition, for curation. Read-only.
//   npx tsx scripts/theology-review.ts <topic-id> [perTradition]
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { TEXT_CATEGORIES } from '../src/lib/texts-catalog'
import { TOPICS } from '../src/lib/theology-topics'

const TRADITION_OF: Record<string, string> = {
  pseudepigrapha: 'Second Temple', apocrypha: 'Second Temple', josephus: 'Second Temple',
  philo: 'Second Temple', septuagint: 'Second Temple',
  rabbinic: 'Rabbinic', targums: 'Rabbinic',
  'apostolic-fathers': 'Apostolic Fathers', 'nt-apocrypha': 'Apostolic Fathers',
  'church-fathers': 'Later Christian', 'greco-roman': 'Greek and Roman',
}

const idx = JSON.parse(zlib.gunzipSync(
  fs.readFileSync(path.join(process.cwd(), 'public/data/backgrounds-search-en.json.gz'))).toString())
const meta = new Map<string, { name: string; cat: string }>()
for (const c of TEXT_CATEGORIES as any[]) for (const w of c.works) meta.set(w.id, { name: w.name, cat: c.id })

const topic = TOPICS.find(t => t.id === process.argv[2])!
const per = Number(process.argv[3] ?? 14)

function score(text: string) {
  const lo = text.toLowerCase()
  let s = 0; const hits: string[] = []
  for (const q of topic.queries) {
    const m = q.re.exec(lo)
    if (!m) continue
    if (q.needsContext) {
      const from = Math.max(0, m.index - 220)
      if (!topic.context.some(c => c.test(lo.slice(from, m.index + m[0].length + 220)))) continue
    }
    s += q.weight; hits.push(q.label)
  }
  return { s, hits }
}

const rows = idx.filter((e: any) => meta.has(e.g)).map((e: any) => ({ e, ...score(e.t) }))
  .filter((r: any) => r.s >= topic.minScore).sort((a: any, b: any) => b.s - a.s)

for (const trad of ['Second Temple', 'Rabbinic', 'Apostolic Fathers', 'Later Christian', 'Greek and Roman']) {
  const seen = new Map<string, number>()
  const picked = rows.filter((r: any) => {
    if (TRADITION_OF[meta.get(r.e.g)!.cat] !== trad) return false
    const n = seen.get(r.e.g) ?? 0
    if (n >= 2) return false          // at most two per work, so one book can't fill the page
    seen.set(r.e.g, n + 1)
    return true
  }).slice(0, per)
  console.log(`\n########## ${trad} (${picked.length}) ##########`)
  for (const r of picked) {
    const m = meta.get(r.e.g)!
    const ref = r.e.b ? `${m.name} ${r.e.b}.${r.e.c}.${r.e.v}` : `${m.name} ${r.e.c}:${r.e.v}`
    console.log(`\n[${r.s}] ${ref}   id=${r.e.g}${r.e.b ? ` b=${r.e.b}` : ''} c=${r.e.c} v=${r.e.v}`)
    console.log('   ' + r.e.t.replace(/\s+/g, ' ').slice(0, 230))
  }
}
