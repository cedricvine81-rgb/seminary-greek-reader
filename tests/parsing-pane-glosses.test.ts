import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { glossKey, duplicatedLemmas } from '@/lib/vocab-gloss-key'
import { content, type ContentCatalogue } from '@/lib/i18n/content'

/**
 * The parsing pane's Spanish glosses.
 *
 * Two things are worth pinning, and neither is "is the Spanish good".
 *
 * FIRST, that the two halves stay in step. The pane resolves a gloss from a translation
 * catalogue AND the deck's English, and content() only returns the Spanish when the English
 * still fingerprints to what the translation was made from. Emitting those halves from one
 * build is what keeps them agreeing; this fails if they ever stop.
 *
 * SECOND, the COVERAGE number, because it is the one that decides whether this feature is worth
 * having. The decks hold about a fifth of the New Testament's vocabulary but they are
 * frequency-ordered, so they carry the large majority of running text. A regression here would
 * not throw — it would just quietly leave more words English — so the threshold is asserted.
 */
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), p), 'utf8'))

describe('deck English emitted for the client', () => {
  it.each(['greek', 'hebrew'] as const)('%s matches the deck it came from', deck => {
    const file = deck === 'greek' ? 'src/data/bgvb-vocabulary.json' : 'src/data/hebrew-vocabulary.json'
    const words = read(file) as { word: string; gloss: string }[]
    const emitted = read(`public/data/vocab/${deck}.en.json`) as Record<string, string>
    const expected = words.filter(w => w.gloss?.trim()).length
    // Homographs collapse onto one lemma key here; the catalogue disambiguates them by
    // fingerprint, which is why this is >= rather than ==.
    expect(Object.keys(emitted).length).toBeGreaterThan(0)
    expect(Object.keys(emitted).length).toBeLessThanOrEqual(expected)
    for (const [lemma, gloss] of Object.entries(emitted).slice(0, 50)) {
      expect(words.some(w => w.word.normalize('NFC') === lemma && w.gloss === gloss)).toBe(true)
    }
  })
})

describe('Spanish glosses resolve through the fingerprint', () => {
  const deck = 'greek' as const
  const words = (read('src/data/bgvb-vocabulary.json') as { word: string; gloss: string }[])
    .filter(w => w.gloss?.trim())
  const english = read(`public/data/vocab/${deck}.en.json`) as Record<string, string>
  const cat = read(`public/data/vocab/es/${deck}.json`) as ContentCatalogue
  const dup = duplicatedLemmas(words)

  const resolve = (lemma: string) => {
    const eng = english[lemma]
    if (eng === undefined) return null
    const out = content(cat, glossKey(deck, lemma, eng, dup), eng)
    return out === eng ? null : out
  }

  it('resolves a common word into Spanish', () => {
    expect(resolve('εἰμί'.normalize('NFC'))).toMatch(/ser|estar/i)
  })

  it('returns null for a lemma the deck does not carry, rather than inventing one', () => {
    expect(resolve('Ἑσρώμ'.normalize('NFC'))).toBeNull()
  })

  it('translates essentially the whole deck', () => {
    const unresolved = Object.keys(english).filter(l => resolve(l) === null)
    expect(unresolved.length / Object.keys(english).length).toBeLessThan(0.02)
  })
})

describe('coverage of running New Testament text', () => {
  // Two layers: the course deck (1,120 words, ~90% of running text on its own) and the lexicon
  // gloss layer that covers the long tail. Asserted as a floor because a regression would not
  // throw — it would quietly leave more words English, which is invisible until a student
  // notices. Raise the floor as the tail is filled in.
  const lemmas = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(path.join(process.cwd(), 'public/data/lemma-index.json.gz'))).toString('utf8'),
  ) as { l: string; f: number }[]
  const known = new Set([
    ...Object.keys(read('public/data/vocab/greek.en.json') as Record<string, string>),
    ...Object.keys(read('public/data/lexicon-gloss/es/greek.json') as Record<string, unknown>)
      .map(k => k.slice('lex.gloss.'.length)),
  ])

  it('covers the large majority of what a student actually clicks', () => {
    const total = lemmas.reduce((n, e) => n + e.f, 0)
    const covered = lemmas.filter(e => known.has(e.l.normalize('NFC'))).reduce((n, e) => n + e.f, 0)
    expect(covered / total).toBeGreaterThan(0.95)
  })

  it('every lemma occurring three times or more has a gloss', () => {
    const gaps = lemmas.filter(e => e.f >= 3 && !known.has(e.l.normalize('NFC'))).map(e => e.l)
    expect(gaps).toEqual([])
  })
})
