/**
 * Seed the full BGVB Beginning vocabulary (Sections I–II) into LexicalEntry,
 * VocabularyItem and Flashcard.
 *
 * The original prisma/seed.ts only loaded a 95-word subset, so the flashcard deck
 * and any VocabularyItem-backed feature covered less than a third of the Beginning
 * course. Source of truth is src/data/bgvb-vocabulary.json — the same list the
 * vocab quizzes and the /vocab study tab use.
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
 *   npx tsx scripts/seed-beginning-vocab.ts [--dry-run]
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry-run')

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
const LEMMA_ALIASES: Record<string, string> = {
  'οἶδα': 'εἴδω',
  'φοβέομαι': 'φοβέω',
  'Μωϋσῆς': 'Μωσεύς',
  'Δαυίδ': 'Δαβίδ',
}

const unaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-͂ͅʹ·]/g, '').normalize('NFC').toLowerCase()

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

/** Look up a BGVB lemma in the corpus, via alias then accent-insensitive fallback. */
function lookup(
  index: Map<string, { strongs: string | null; frequency: number }>,
  bare: Map<string, { strongs: string | null; frequency: number }>,
  lemma: string,
) {
  return index.get(lemma)
    ?? index.get(LEMMA_ALIASES[lemma] ?? '')
    ?? bare.get(unaccent(lemma))
}

async function main() {
  const all = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/bgvb-vocabulary.json'), 'utf8'),
  ) as BgvbWord[]

  // Sections I–II are the Beginning course. Order by the BGVB frequency rank so
  // sortOrder 1..N tracks the lesson sequence.
  const words = all
    .filter(w => w.section <= 2 && w.word && w.gloss)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))

  const corpus = corpusIndex()
  // Accent-insensitive view, keeping the most frequent lemma per bare form.
  const corpusBare = new Map<string, { strongs: string | null; frequency: number }>()
  corpus.forEach((meta, lemma) => {
    const key = unaccent(lemma)
    const hit = corpusBare.get(key)
    if (!hit || hit.frequency < meta.frequency) corpusBare.set(key, meta)
  })
  console.log(`BGVB Sections I–II: ${words.length} words`)
  console.log(`GNT corpus index:   ${corpus.size} lemmas`)

  const missingInCorpus: string[] = []
  let createdEntries = 0, updatedEntries = 0, createdItems = 0, updatedItems = 0, createdCards = 0

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const rank = i + 1
    const meta = lookup(corpus, corpusBare, w.word)
    if (!meta) missingInCorpus.push(w.word)
    const partOfSpeech = POS_MAP[w.pos] ?? w.pos.toLowerCase()

    if (DRY) continue

    const existing = await prisma.lexicalEntry.findUnique({ where: { lexeme: w.word } })
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
              lexeme: w.word,
              gloss: w.gloss,
              partOfSpeech,
              frequency: meta?.frequency ?? w.freq ?? 0,
              strongs: meta?.strongs ?? null,
            },
          })
        })()

    const item = await prisma.vocabularyItem.findUnique({
      where: { lexemeId_level: { lexemeId: entry.id, level: 'BEGINNING' } },
    })
    if (item) {
      if (item.sortOrder !== rank) {
        await prisma.vocabularyItem.update({ where: { id: item.id }, data: { sortOrder: rank } })
        updatedItems++
      }
    } else {
      await prisma.vocabularyItem.create({
        data: { lexemeId: entry.id, level: 'BEGINNING', sortOrder: rank },
      })
      createdItems++
    }

    const card = await prisma.flashcard.findUnique({
      where: { lexemeId_level: { lexemeId: entry.id, level: 'BEGINNING' } },
    })
    if (!card) {
      await prisma.flashcard.create({
        data: {
          lexemeId: entry.id,
          level: 'BEGINNING',
          front: w.word,
          backLexeme: w.inflection ? `${w.word}, ${w.inflection}` : w.word,
          backGloss: w.gloss,
          backParsing: partOfSpeech,
        },
      })
      createdCards++
    }
  }

  // Any pre-existing Beginning word outside BGVB I–II keeps a rank, placed after
  // the seeded list, so sortOrder stays a single coherent ordering.
  if (!DRY) {
    const seeded = new Set(words.map(w => w.word))
    const strays = (await prisma.vocabularyItem.findMany({
      where: { level: 'BEGINNING' },
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
    console.log(`\nNon-BGVB Beginning words re-ranked after the list: ${strays.length}`)
  }

  if (missingInCorpus.length > 0) {
    console.log(`\nNot found in the GNT corpus (no Strong's/frequency): ${missingInCorpus.length}`)
    console.log(`  ${missingInCorpus.join(' ')}`)
  }

  console.log(`\nLexicalEntry:   +${createdEntries} created, ${updatedEntries} back-filled`)
  console.log(`VocabularyItem: +${createdItems} created, ${updatedItems} re-ranked`)
  console.log(`Flashcard:      +${createdCards} created`)

  const total = await prisma.vocabularyItem.count({ where: { level: 'BEGINNING' } })
  console.log(`\nBEGINNING VocabularyItem rows now: ${total}`)
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
