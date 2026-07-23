/**
 * Seed BGVB vocabulary into LexicalEntry, VocabularyItem and Flashcard.
 *
 * The original prisma/seed.ts only loaded small hand-made subsets (95 Beginning,
 * 75 Intermediate words), so the flashcard deck and every VocabularyItem-backed
 * feature covered a fraction of each course. Source of truth is
 * src/data/bgvb-vocabulary.json — the same list the vocab quizzes and the /vocab
 * study tab use.
 *
 * BGVB sections are NT-frequency bands (measured against public/data/gnt):
 *   §1 100+   §2 50–99   §3 30–49   §4 22–30   §5 18–21   §6 13–17   §7 10–12
 * Beginning = §1–2 (50+ occurrences); Intermediate = §3 (30+), matching the legacy
 * vocabulary-nt-30-plus.json → INTERMEDIATE mapping; Advanced = §4–7, which sit past
 * both courses. Each level defaults to its own sections, so --sections is optional.
 *
 * `sortOrder` is written as the BGVB frequency RANK (1 = most frequent), which is
 * what the field name and every comment referring to it assume. It previously held
 * the raw occurrence count; existing rows are renumbered so the column has one
 * consistent meaning. Strong's numbers and NT frequencies are read off the tagged
 * GNT corpus in public/data/gnt.
 *
 * Idempotent: re-running only fills gaps. Instructor-curated fields (gloss,
 * extendedGloss, acceptedAnswers) on entries that already exist are never touched.
 *
 *   npx tsx scripts/seed-bgvb-vocab.ts --level=BEGINNING     (§1–2)
 *   npx tsx scripts/seed-bgvb-vocab.ts --level=INTERMEDIATE  (§3)
 *   npx tsx scripts/seed-bgvb-vocab.ts --level=ADVANCED      (§4–7)
 *   (add --dry-run to report without writing)
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { matchLemma, unaccent, normaliseLexeme } from '../src/lib/bgvb-lemmas'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry-run')

const arg = (name: string) =>
  process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1]

const LEVEL = (arg('level') ?? 'BEGINNING').toUpperCase() as 'BEGINNING' | 'INTERMEDIATE' | 'ADVANCED'

const DEFAULT_SECTIONS: Record<string, string> = {
  BEGINNING: '1,2',      // 50+ occurrences
  INTERMEDIATE: '3',     // 30–49
  ADVANCED: '4,5,6,7',   // under 30 — past both courses
}

const SECTIONS = (arg('sections') ?? DEFAULT_SECTIONS[LEVEL] ?? '')
  .split(',').map(Number).filter(n => n >= 1 && n <= 7)

if (!DEFAULT_SECTIONS[LEVEL] || SECTIONS.length === 0) {
  console.error('usage: --level=BEGINNING|INTERMEDIATE|ADVANCED --sections=1,2 [--dry-run]')
  process.exit(1)
}

interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  freq: number | null
  order?: number
}

// BGVB part-of-speech abbreviations → the lowercase full names already in LexicalEntry.
const POS_MAP: Record<string, string> = {
  Verb: 'verb', Noun: 'noun', Adj: 'adjective', Adv: 'adverb',
  Prep: 'preposition', Conj: 'conjunction', Pron: 'pronoun',
  Art: 'article', Particle: 'particle', Interj: 'interjection',
  Interrog: 'interrogative', 'pron-posses': 'pronoun',
}

// BGVB and the Tischendorf-tagged corpus disagree on a handful of lemma spellings.
// Accent-insensitive matching catches the iota-subscript pairs (ἀποθνῄσκω/ἀποθνήσκω,
// σῴζω/σώζω); these need naming outright. εἶπον is deliberately absent — the corpus
// files it under λέγω, and merging the two would distort λέγω's count.
/** lemma → { strongs, frequency } from the morphologically tagged GNT. */
function corpusIndex(): Map<string, { strongs: string | null; frequency: number }> {
  const dir = join(process.cwd(), 'public/data/gnt')
  const index = new Map<string, { strongs: string | null; frequency: number }>()
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      verses: { words: { lemma: string; strongs: string | null }[] }[]
    }
    for (const verse of data.verses ?? []) {
      for (const w of verse.words ?? []) {
        if (!w.lemma) continue
        const hit = index.get(w.lemma)
        if (hit) hit.frequency++
        else index.set(w.lemma, { strongs: w.strongs ? `G${w.strongs}` : null, frequency: 1 })
      }
    }
  }
  return index
}

async function main() {
  const all = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/bgvb-vocabulary.json'), 'utf8'),
  ) as BgvbWord[]

  // Order by the BGVB frequency rank so sortOrder 1..N tracks the lesson sequence.
  const words = all
    .filter(w => SECTIONS.includes(w.section) && w.word && w.gloss)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))

  const corpus = corpusIndex()
  // Accent-insensitive view, keeping the most frequent lemma per bare form.
  const corpusBare = new Map<string, { strongs: string | null; frequency: number }>()
  corpus.forEach((meta, lemma) => {
    const key = unaccent(lemma)
    const hit = corpusBare.get(key)
    if (!hit || hit.frequency < meta.frequency) corpusBare.set(key, meta)
  })
  console.log(`${LEVEL} — BGVB §${SECTIONS.join(', §')}: ${words.length} words`)
  console.log(`GNT corpus index:   ${corpus.size} lemmas`)

  const missingInCorpus: string[] = []
  let createdEntries = 0, updatedEntries = 0, createdItems = 0, updatedItems = 0, createdCards = 0

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const rank = i + 1
    const lexeme = normaliseLexeme(w.word)
    const meta = matchLemma(corpus, corpusBare, w.word)
    if (!meta) missingInCorpus.push(lexeme)
    const partOfSpeech = POS_MAP[w.pos] ?? w.pos.toLowerCase()

    if (DRY) continue

    const existing = await prisma.lexicalEntry.findUnique({ where: { lexeme } })
    const entry = existing
      ? await (async () => {
          // Only fill blanks — never overwrite curated glosses or answer lists.
          const patch: Record<string, unknown> = {}
          if (!existing.strongs && meta?.strongs) patch.strongs = meta.strongs
          if (!existing.frequency && meta?.frequency) patch.frequency = meta.frequency
          if (Object.keys(patch).length === 0) return existing
          updatedEntries++
          return prisma.lexicalEntry.update({ where: { id: existing.id }, data: patch })
        })()
      : await (async () => {
          createdEntries++
          return prisma.lexicalEntry.create({
            data: {
              lexeme,
              gloss: w.gloss,
              partOfSpeech,
              frequency: meta?.frequency ?? w.freq ?? 0,
              strongs: meta?.strongs ?? null,
            },
          })
        })()

    const item = await prisma.vocabularyItem.findUnique({
      where: { lexemeId_level: { lexemeId: entry.id, level: LEVEL } },
    })
    if (item) {
      if (item.sortOrder !== rank) {
        await prisma.vocabularyItem.update({ where: { id: item.id }, data: { sortOrder: rank } })
        updatedItems++
      }
    } else {
      await prisma.vocabularyItem.create({
        data: { lexemeId: entry.id, level: LEVEL, sortOrder: rank },
      })
      createdItems++
    }

    const card = await prisma.flashcard.findUnique({
      where: { lexemeId_level: { lexemeId: entry.id, level: LEVEL } },
    })
    if (!card) {
      await prisma.flashcard.create({
        data: {
          lexemeId: entry.id,
          level: LEVEL,
          front: w.word,
          backLexeme: w.inflection ? `${w.word}, ${w.inflection}` : w.word,   // BGVB spelling
          backGloss: w.gloss,
          backParsing: partOfSpeech,
        },
      })
      createdCards++
    }
  }

  // Any pre-existing word at this level but outside the seeded sections keeps a
  // rank, placed after the list, so sortOrder stays a single coherent ordering.
  if (!DRY) {
    const seeded = new Set(words.map(w => normaliseLexeme(w.word)))
    const strays = (await prisma.vocabularyItem.findMany({
      where: { level: LEVEL },
      include: { lexeme: true },
      orderBy: { lexeme: { frequency: 'desc' } },
    })).filter(v => !seeded.has(v.lexeme.lexeme))
    for (let i = 0; i < strays.length; i++) {
      const v = strays[i]
      const rank = words.length + i + 1
      if (v.sortOrder !== rank) {
        await prisma.vocabularyItem.update({ where: { id: v.id }, data: { sortOrder: rank } })
        updatedItems++
      }
    }
    console.log(`\nWords at this level outside §${SECTIONS.join(',')}, re-ranked after the list: ${strays.length}`)
    if (strays.length > 0) console.log(`  ${strays.map(v => v.lexeme.lexeme).join(' ')}`)
  }

  if (missingInCorpus.length > 0) {
    console.log(`\nNot found in the GNT corpus (no Strong's/frequency): ${missingInCorpus.length}`)
    console.log(`  ${missingInCorpus.join(' ')}`)
  }

  console.log(`\nLexicalEntry:   +${createdEntries} created, ${updatedEntries} back-filled`)
  console.log(`VocabularyItem: +${createdItems} created, ${updatedItems} re-ranked`)
  console.log(`Flashcard:      +${createdCards} created`)

  const total = await prisma.vocabularyItem.count({ where: { level: LEVEL } })
  console.log(`\n${LEVEL} VocabularyItem rows now: ${total}`)
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
