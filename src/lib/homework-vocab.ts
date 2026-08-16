// Which words in a grammar-homework set the class has not met yet.
//
// The homework packs were authored from the lesson decks, not filtered against the
// vocabulary track, so a set can ask a student to gloss a word the course has not taught.
// Because the student supplies the gloss themselves (model answers only appear at grading),
// an unknown word is not a small friction — it is a blank they cannot fill. This module
// works out which words those are so the homework pane can list them up front.
//
// The rank cap per grammar lesson comes from docs/curriculum-map.md: vocabulary advances
// evenly through the BGVB frequency sections, finishing rank 320 at Lesson 10, so the cap
// at lesson N is 32 x N snapped DOWN to a section boundary. A word counts as known if its
// BGVB frequency rank is within the cap for that set's lesson.
//
// Words with no lemma in their parsing — the article, καί, particles — are closed-class
// items the decks introduce directly, and are never reported.

import { GREEK_DECK } from './vocab-decks'
import { GRAMMAR_HOMEWORK_SETS, type HomeworkSet, type HomeworkWord } from '@/data/grammar-homework'

/** BGVB rank a student has reached by the end of each grammar lesson (docs/curriculum-map.md). */
export const VOCAB_RANK_CAP: Record<number, number> = {
  1: 20, 2: 60, 3: 80, 4: 120, 5: 160, 6: 180, 7: 220, 8: 240, 9: 280, 10: 320,
}

export interface UnlearnedWord {
  /** Dictionary form, as written in the pack's parsing field. */
  lemma: string
  /** BGVB's gloss where the word is in the list at all, else the pack's own gloss. */
  gloss: string
  /** BGVB frequency rank, or null for a word outside the 320 (usually a proper noun). */
  rank: number | null
}

/** Accents differ between sources (oxia vs tonos), so compare on bare letters. */
function bare(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Closed-class words the decks teach as GRAMMAR, not vocabulary — the article, the personal
 * pronouns, conjunctions, particles and the prepositions of Lesson 3. Several carry no BGVB
 * frequency rank at all, so without this they are reported as words the student has never
 * met: `ἡμεῖς` was being listed as a new word to learn, with no gloss to give it.
 */
const CLOSED_CLASS = new Set([
  'ο', 'εγω', 'ημεις', 'συ', 'υμεις', 'αυτος', 'ουτος', 'εκεινος', 'ος', 'τις', 'τις',
  'και', 'δε', 'γαρ', 'ουν', 'αλλα', 'οτι', 'ει', 'εαν', 'ινα', 'ως', 'η', 'τε', 'μεν',
  'ου', 'μη', 'ουδε', 'αν', 'ειμι', 'εν', 'εις', 'εκ', 'απο', 'προς', 'δια', 'κατα',
  'μετα', 'περι', 'υπερ', 'υπο', 'συν', 'παρα', 'επι', 'ανα', 'αντι', 'προ', 'εαυτου',
])

/**
 * The grammar lesson a set belongs to, from its id: `l3-…` = Lesson 3, `l34-…` = Lessons
 * 3–4, `l58-…` = Lessons 5 and 8. A set spanning two lessons is done AFTER the later one,
 * so the later lesson sets the cap.
 */
export function grammarLessonForSet(setId: string): number | null {
  const m = /^l(\d+)-/.exec(setId)
  if (!m) return null
  const digits = m[1]
  // '10' is a single lesson; any other multi-digit id is a list of single-digit lessons
  if (digits === '10') return 10
  return Math.max(...digits.split('').map(Number))
}

const GREEK_LETTER = /[Ͱ-Ͽἀ-῿]/

/** The lemma a parsing string ends with, e.g. 'Pres Act Ind 1 Sg — λαμβάνω'. */
function lemmaOf(word: HomeworkWord): string | null {
  if (!word.parsing) return null
  const tail = word.parsing.split('—').pop()
  if (!tail) return null
  // Strip the annotations BEFORE testing for Greek: 'Preposition + genitive (ἀπό)' has a
  // Greek lemma inside the bracket but is itself a parsing label, and testing first would
  // let the label through as if it were a word.
  const lemma = tail.replace(/\([^)]*\)/g, '').trim()     // drops '(intensive)', '(3rd decl.)'
  if (!lemma || !GREEK_LETTER.test(lemma)) return null    // 'Article — Acc Sg Masc' etc.
  return lemma
}

let bgvbByLemma: Map<string, { gloss: string; rank: number }> | null = null
function bgvb() {
  if (!bgvbByLemma) {
    bgvbByLemma = new Map()
    for (const w of GREEK_DECK.words) {
      if (w.order == null) continue
      const key = bare(w.word)
      const prev = bgvbByLemma.get(key)
      if (!prev || w.order < prev.rank) bgvbByLemma.set(key, { gloss: w.gloss, rank: w.order })
    }
  }
  return bgvbByLemma
}

/** Every word in `set` whose BGVB rank is beyond the cap for the set's lesson. */
export function unlearnedWordsForSet(set: HomeworkSet): UnlearnedWord[] {
  const lesson = grammarLessonForSet(set.id)
  const cap = lesson == null ? null : VOCAB_RANK_CAP[lesson]
  if (cap == null) return []
  const dict = bgvb()
  const seen = new Set<string>()
  const out: UnlearnedWord[] = []
  for (const sentence of set.sentences) {
    for (const word of sentence.words) {
      const lemma = lemmaOf(word)
      if (!lemma) continue
      const key = bare(lemma)
      if (seen.has(key) || CLOSED_CLASS.has(key)) continue
      seen.add(key)
      const entry = dict.get(key)
      if (entry && entry.rank <= cap) continue            // already taught
      out.push({
        lemma,
        // the pack's gloss belongs to the inflected form ('he was begging'), so prefer
        // BGVB's dictionary gloss whenever the word is in the list at all
        gloss: entry?.gloss || word.gloss || '',
        rank: entry?.rank ?? null,
      })
    }
  }
  // commonest first: the words most worth learning head the list, unranked ones last
  return out.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
}

export function unlearnedWordsForSetId(setId: string): UnlearnedWord[] {
  const set = GRAMMAR_HOMEWORK_SETS.find(s => s.id === setId)
  return set ? unlearnedWordsForSet(set) : []
}
