/**
 * Seed Spanish rows into LexicalGloss from the completed static deck.
 *
 * ONLY where the DB's English gloss and the deck's English gloss are the SAME TEXT. That is the
 * whole safety property: the deck's Spanish was written from the deck's English, so it is only
 * provably about the DB's lemma when the two Englishes agree. Where they differ, the Spanish may
 * be describing a different sense, and this is an answer key — those are left for review.
 *
 * Idempotent: upserts by (lexemeId, locale), so re-running corrects rather than duplicates.
 * Never touches LexicalEntry.gloss — English stays exactly as it is.
 *
 *   npx tsx scripts/seed-lexical-gloss-es.ts --dry     # report only
 *   npx tsx scripts/seed-lexical-gloss-es.ts           # write
 */
import { prisma } from '../src/lib/db'
import fs from 'node:fs'

const LOCALE = 'es'
const norm = (s: string) => s.normalize('NFC')
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase()
const sameEnglish = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ')

/** Lemmas the DB has that the deck does not; translated directly from the DB's own gloss. */
const DB_ONLY: Record<string, string> = {
  'ἱερόν': 'templo',
  'ἔξεστι': 'es lícito, está permitido',
  'δέομαι': 'rogar, suplicar',
}

async function main() {
  const dry = process.argv.includes('--dry')
  const deck = JSON.parse(fs.readFileSync('src/data/bgvb-vocabulary.json', 'utf8')) as
    { word: string; gloss: string }[]
  const es = JSON.parse(fs.readFileSync('src/lib/i18n/es/vocab.json', 'utf8')) as Record<string, string>

  const byLemma = new Map<string, { word: string; gloss: string }>()
  const byStripped = new Map<string, { word: string; gloss: string }>()
  for (const w of deck) { byLemma.set(norm(w.word), w); byStripped.set(strip(w.word), w) }

  const entries = await prisma.lexicalEntry.findMany({ select: { id: true, lexeme: true, gloss: true } })

  const writes: { id: string; lexeme: string; gloss: string; source: string }[] = []
  let skippedDiffer = 0
  for (const lex of entries) {
    const dbOnly = DB_ONLY[norm(lex.lexeme)]
    if (dbOnly) { writes.push({ id: lex.id, lexeme: lex.lexeme, gloss: dbOnly, source: 'db-only' }); continue }
    const hit = byLemma.get(norm(lex.lexeme)) ?? byStripped.get(strip(lex.lexeme))
    if (!hit) continue
    const spanish = es[`vocab.gloss.greek.${norm(hit.word)}`]
    if (!spanish) continue
    if (!sameEnglish(hit.gloss, lex.gloss)) { skippedDiffer++; continue }
    writes.push({ id: lex.id, lexeme: lex.lexeme, gloss: spanish, source: 'exact' })
  }

  console.log(`exact-English matches to write : ${writes.filter(w => w.source === 'exact').length}`)
  console.log(`DB-only lemmas to write ........ ${writes.filter(w => w.source === 'db-only').length}`)
  console.log(`skipped (English differs) ...... ${skippedDiffer}`)
  if (dry) { console.log('\n--dry: nothing written'); await prisma.$disconnect(); return }

  let written = 0
  for (const w of writes) {
    await prisma.lexicalGloss.upsert({
      where: { lexemeId_locale: { lexemeId: w.id, locale: LOCALE } },
      update: { gloss: w.gloss },          // acceptedAnswers left alone — the appeal loop owns it
      create: { lexemeId: w.id, locale: LOCALE, gloss: w.gloss },
    })
    written++
  }
  console.log(`\nwritten: ${written}`)
  console.log(`LexicalGloss rows now: ${await prisma.lexicalGloss.count({ where: { locale: LOCALE } })}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
