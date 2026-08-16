import { GRAMMAR_HOMEWORK_SETS } from '@/data/grammar-homework'
import {
  grammarLessonForSet, unlearnedWordsForSet, unlearnedWordsForSetId, VOCAB_RANK_CAP,
} from '@/lib/homework-vocab'

describe('grammarLessonForSet', () => {
  it('reads a single lesson from the id', () => {
    expect(grammarLessonForSet('l3-prepositions-a')).toBe(3)
    expect(grammarLessonForSet('l9-mi-verbs')).toBe(9)
  })

  it('treats l10 as Lesson 10, not lessons 1 and 0', () => {
    expect(grammarLessonForSet('l10-conditionals')).toBe(10)
  })

  it('takes the LATER lesson when a set spans two — the homework follows both', () => {
    expect(grammarLessonForSet('l34-nouns')).toBe(4)
    expect(grammarLessonForSet('l58-infinitives')).toBe(8)
  })

  it('returns null for an id that encodes no lesson', () => {
    expect(grammarLessonForSet('mystery-set')).toBeNull()
  })
})

describe('unlearnedWordsForSet', () => {
  it('reports words beyond the lesson cap and stays silent about ones within it', () => {
    const set = GRAMMAR_HOMEWORK_SETS.find(s => s.id === 'l3-prepositions-a')!
    const words = unlearnedWordsForSet(set)
    const lemmas = words.map(w => w.lemma)
    // δόξα is rank 96, past the 80 a Lesson 3 student has reached
    expect(lemmas).toContain('δόξα')
    // λαμβάνω and ἄνθρωπος are inside the first 80 and must not be flagged
    expect(lemmas).not.toContain('λαμβάνω')
    expect(lemmas).not.toContain('ἄνθρωπος')
  })

  it('never reports a parsing label as if it were a word', () => {
    // 'Preposition + genitive (ἀπό)' carries Greek inside its bracket; the bracket has to be
    // stripped BEFORE the Greek test or the English label leaks out as a vocabulary item.
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      for (const w of unlearnedWordsForSet(set)) {
        expect(w.lemma).not.toMatch(/[A-Za-z]/)
      }
    }
  })

  it('skips closed-class words that carry no lemma in their parsing', () => {
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      const lemmas = unlearnedWordsForSet(set).map(w => w.lemma)
      expect(lemmas).not.toContain('Article')
    }
  })

  it('lists each lemma once however often the set uses it', () => {
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      const lemmas = unlearnedWordsForSet(set).map(w => w.lemma)
      expect(new Set(lemmas).size).toBe(lemmas.length)
    }
  })

  it('orders commonest first, with words outside the 320 last', () => {
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      const ranks = unlearnedWordsForSet(set).map(w => w.rank ?? Infinity)
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
    }
  })

  it('gives every reported word a gloss — the point is that the student can proceed', () => {
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      for (const w of unlearnedWordsForSet(set)) {
        expect(w.gloss.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('reports nothing above the cap it was given', () => {
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      const cap = VOCAB_RANK_CAP[grammarLessonForSet(set.id)!]
      for (const w of unlearnedWordsForSet(set)) {
        if (w.rank != null) expect(w.rank).toBeGreaterThan(cap)
      }
    }
  })

  it('resolves a set by id and returns nothing for an unknown one', () => {
    expect(unlearnedWordsForSetId('l3-prepositions-a').length).toBeGreaterThan(0)
    expect(unlearnedWordsForSetId('no-such-set')).toEqual([])
  })
})

describe('closed-class words', () => {
  it('never reports the article, pronouns or prepositions as new vocabulary', () => {
    // These are taught as grammar from Lesson 3 and several have no BGVB rank at all, so a
    // rank-based rule alone lists them as unknown words — ἡμεῖς was appearing with no gloss.
    for (const set of GRAMMAR_HOMEWORK_SETS) {
      const lemmas = unlearnedWordsForSet(set).map(w => w.lemma)
      for (const closed of ['ἡμεῖς', 'ἐγώ', 'σύ', 'αὐτός', 'ὁ', 'καί', 'ἐν', 'εἰς']) {
        expect(lemmas).not.toContain(closed)
      }
    }
  })
})
