import { erasmianIPA, erasmianWordIPA, erasmianRespell, audioSlug } from '@/lib/erasmian'
import bgvb from '@/data/bgvb-vocabulary.json'

/**
 * The Erasmian transliterator is the single source of truth for how the app SAYS Greek —
 * both the pre-rendered audio and the browser's fallback voice read from it. So the
 * regression suite is the Pronunciation chapter's own worked examples: if a value here
 * changes, the chapter and the audio have stopped agreeing, and one of them is now lying to
 * students.
 */
describe('erasmian — the chapter\'s own examples', () => {
  const CASES: [string, string][] = [
    ['ἡμεῖς', 'heɪˈmeɪs'],          // chapter: hay-MACE
    ['καί', 'ˈkaɪ'],                // kai, as in "eye"
    ['βαπτίζω', 'bɑpˈtɪdzoʊ'],      // bap-TID-zoh
    ['ἅγιος', 'ˈhɑgɪɒs'],           // HA-gi-os (rough breathing)
    ['ἄγγελος', 'ˈɑŋgɛlɒs'],        // angelos — γγ = "ng", smooth breathing
    ['λόγος', 'ˈlɒgɒs'],
    ['υἱός', 'hwɪˈɒs'],             // υι = "quit"
    ['οὐρανός', 'uːrɑˈnɒs'],        // ου = "soup"
    ['εὐαγγέλιον', 'juːɑŋˈgɛlɪɒn'], // ευ = "feud"
    ['αὐτός', 'aʊˈtɒs'],            // αυ = "how"
    ['οἶκος', 'ˈɔɪkɒs'],            // οι = "oil"
    ['εἰμί', 'eɪˈmɪ'],              // ει = "veil"
    ['τῷ', 'ˈtoʊ'],                 // iota subscript is silent
    ['λόγῳ', 'ˈlɒgoʊ'],
    ['ψυχή', 'psʊˈxeɪ'],            // ψ = ps, χ = "loch"
    ['Ἰερουσαλήμ', 'ɪɛruːsɑˈleɪm'],
    ['Ἠσαΐας', 'eɪsɑˈɪɑs'],         // diaeresis splits a would-be diphthong
    ['κόσμος', 'ˈkɒsmɒs'],
    ['θρόνος', 'ˈθrɒnɒs'],
    ['ζωή', 'zoʊˈeɪ'],              // word-initial ζ
    ['ῥῆμα', 'ˈreɪmɑ'],             // initial ῥ: the mark is written, not sounded
  ]
  it.each(CASES)('%s → %s', (greek, ipa) => {
    expect(erasmianWordIPA(greek)).toBe(ipa)
  })
})

describe('erasmian — phrases', () => {
  it('reads John 1:1 as the chapter respells it (en ar-CHAY ane ho LO-gos)', () => {
    expect(erasmianIPA('Ἐν ἀρχῇ ἦν ὁ λόγος')).toBe('ɛn ɑrˈxeɪ ˈeɪn hɒ ˈlɒgɒs')
  })
  it('drops punctuation and keeps word boundaries', () => {
    expect(erasmianIPA('τίς εἶ;')).toBe('ˈtɪs ˈeɪ')
  })
})

/**
 * The respelling is what a student READS as a hint and what the browser's fallback voice
 * SPEAKS, so it has to stay recognisably the chapter's own style: syllables hyphenated,
 * the stressed one capitalised (the chapter prints hay-MACE, bap-TID-zoh, HA-gi-os).
 */
describe('erasmian — respelling', () => {
  it.each([
    ['βαπτίζω', 'bahp-TIH-dzoh'],    // chapter: bap-TID-zoh
    ['ἡμεῖς', 'hay-MAYS'],           // chapter: hay-MACE
    ['ἅγιος', 'HAH-gih-os'],         // chapter: HA-gi-os
    ['ἀρχῇ', 'ahr-CHAY'],            // chapter: ar-CHAY
    ['λόγος', 'LO-gos'],             // chapter: LO-gos
    ['ἄγγελος', 'AHNG-geh-los'],
    ['ψυχή', 'psuu-CHAY'],
  ])('%s → %s', (greek, respelling) => {
    expect(erasmianRespell(greek)).toBe(respelling)
  })

  // Reported from the flashcards: πίστις was being read with a LONG first iota, because an
  // open "PI-" is read "pie" in English. Erasmian iota is always short.
  it.each([
    ['πίστις', 'PIH-stis'],
    ['εἰμί', 'ay-MIH'],
    ['ἴδιος', 'IH-dih-os'],
    ['τίς', 'TIS'],                  // already closed by ς — unchanged
  ])('keeps iota short: %s → %s', (greek, respelling) => {
    expect(erasmianRespell(greek)).toBe(respelling)
  })
})

/**
 * The transliterator has to survive the whole teaching inventory, not just the examples:
 * every word the audio pipeline will ever be asked to speak comes from this deck.
 */
describe('erasmian — the whole vocabulary deck', () => {
  const words = (bgvb as { word: string }[]).map(w => w.word)

  it('produces output for every deck word', () => {
    const empty = words.filter(w => !erasmianWordIPA(w))
    expect(empty).toEqual([])
  })

  it('never starts a syllable with ŋ (no English voice can say it)', () => {
    const bad = words.filter(w => /ˈŋ|^ŋ/.test(erasmianWordIPA(w)))
    expect(bad).toEqual([])
  })

  it('never files two different-sounding words under one audio slug', () => {
    // The audit found εἰς ("ays") and εἷς ("HAYS") sharing a slug because the rough
    // breathing was stripped — whichever rendered first spoke for both. The slug now
    // keeps the breathing as a leading "h"; this sweep holds the whole inventory
    // (the deck plus each letter quoted alone) to that rule.
    const inventory = [...words, ...'αβγδεζηθικλμνξοπρστυφχψω']
    const bySlug = new Map<string, Set<string>>()
    for (const w of inventory) {
      const slug = audioSlug(w)
      if (!slug) continue
      const sounds = bySlug.get(slug) ?? new Set<string>()
      sounds.add(erasmianRespell(w).toLowerCase())
      bySlug.set(slug, sounds)
    }
    const clashes = Array.from(bySlug.entries())
      .filter(([, sounds]) => sounds.size > 1)
      .map(([slug, sounds]) => `${slug}: ${Array.from(sounds).join(' vs ')}`)
    expect(clashes).toEqual([])
  })

  it('emits only IPA symbols the speech engines accept', () => {
    // Vowels ɑ ɛ ɒ ʊ ɪ ɔ + glide parts e o a u, length ː, and the consonants the scheme
    // uses — including h, which only ever comes from a rough breathing.
    const ALLOWED = /^[ɑɛɒʊɪɔeoauːjθxŋhdzkspflmnrbtgvwˈ ]+$/
    const strange = words.filter(w => !ALLOWED.test(erasmianWordIPA(w)))
    expect(strange).toEqual([])
  })
})
