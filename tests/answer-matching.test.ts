import { normalise, levenshtein, fuzzyMatch, isAnswerCorrect, isMultipleChoiceCorrect } from '@/lib/answer-matching'

describe('fuzzyMatch — antonym (negation prefix) guard', () => {
  it('rejects "unclean" as a fuzzy match for "clean" (regression: καθαρός)', () => {
    expect(fuzzyMatch('unclean', 'clean')).toBe(false)
    expect(fuzzyMatch('clean', 'unclean')).toBe(false)
  })

  it('rejects other common negation-prefix antonym pairs', () => {
    expect(fuzzyMatch('unhappy', 'happy')).toBe(false)
    expect(fuzzyMatch('unkind', 'kind')).toBe(false)
    expect(fuzzyMatch('unfair', 'fair')).toBe(false)
    expect(fuzzyMatch('dishonest', 'honest')).toBe(false)
    expect(fuzzyMatch('nonresident', 'resident')).toBe(false)
  })

  it('still allows real typos with similar prefixes', () => {
    // "ineffective" is NOT the negation of "effective" only by prefix-strip == base
    // "inflate" doesn't fuzzy-match "flate" since "flate" isn't a real correct answer
    // Sanity: legitimate close matches still pass
    expect(fuzzyMatch('grace', 'graci')).toBe(true)        // 1 typo
    expect(fuzzyMatch('mesage', 'message')).toBe(true)     // 1 typo, 7 chars
  })

  it('still accepts exact match even when prefixes overlap', () => {
    expect(fuzzyMatch('unclean', 'unclean')).toBe(true)
  })
})

describe('isAnswerCorrect (fuzzy mode) — antonym guard end-to-end', () => {
  it('rejects "unclean" for "clean, pure" (the original bug report)', () => {
    expect(isAnswerCorrect('unclean', 'clean, pure', true)).toBe(false)
  })

  it('still tolerates real typos in fuzzy mode', () => {
    expect(isAnswerCorrect('clen', 'clean, pure', true)).toBe(true)
  })
})

describe('isAnswerCorrect — verb-marker tolerance ("I"/"to")', () => {
  // Regression: φεύγω is glossed "flee, escape"; a student typing "I flee" (natural
  // for a Greek verb) was marked wrong.
  it('accepts "I flee" for "flee, escape"', () => {
    expect(isAnswerCorrect('I flee', 'flee, escape', false)).toBe(true)
    expect(isAnswerCorrect('I flee', 'flee, escape', true)).toBe(true)
  })

  it('accepts "to flee" for "flee, escape"', () => {
    expect(isAnswerCorrect('to flee', 'flee, escape', false)).toBe(true)
  })

  it('accepts a bare "flee" when the gloss itself is "I flee"', () => {
    expect(isAnswerCorrect('flee', 'I flee', false)).toBe(true)
  })

  it('accepts the second alternative with a marker ("I escape")', () => {
    expect(isAnswerCorrect('I escape', 'flee, escape', false)).toBe(true)
  })

  it('still rejects a genuinely wrong verb answer', () => {
    expect(isAnswerCorrect('I run', 'flee, escape', false)).toBe(false)
  })
})

describe('isAnswerCorrect — semicolon-separated alternatives', () => {
  // Regression: ἀνίστημι's gloss is "I raise; I rise" — the grader used to only
  // split on commas, marking "I rise" wrong even though it's literally listed.
  it('accepts the second alternative in a semicolon-separated correct answer', () => {
    expect(isAnswerCorrect('I rise', 'I raise; I rise', false)).toBe(true)
    expect(isAnswerCorrect('I rise', 'I raise; I rise', true)).toBe(true)
  })

  it('accepts the first alternative too', () => {
    expect(isAnswerCorrect('I raise', 'I raise; I rise', false)).toBe(true)
  })

  it('handles mixed comma + semicolon separators', () => {
    expect(isAnswerCorrect('herald', 'proclaim, preach; herald', false)).toBe(true)
  })

  it('still rejects an unrelated answer', () => {
    expect(isAnswerCorrect('walk', 'I raise; I rise', false)).toBe(false)
  })
})

describe('isMultipleChoiceCorrect (whole-option match)', () => {
  it('accepts a correct option whose gloss contains a comma (regression: "hope, expectation")', () => {
    expect(isMultipleChoiceCorrect('hope, expectation', 'hope, expectation')).toBe(true)
  })

  it('does NOT accept a partial gloss for a multiple-choice option', () => {
    // The student must pick the whole option; "hope" alone is not the option shown
    expect(isMultipleChoiceCorrect('hope', 'hope, expectation')).toBe(false)
  })

  it('ignores case and surrounding punctuation/whitespace', () => {
    expect(isMultipleChoiceCorrect('  Hope, Expectation.', 'hope, expectation')).toBe(true)
  })

  it('rejects a wrong option', () => {
    expect(isMultipleChoiceCorrect('temple', 'hope, expectation')).toBe(false)
  })
})

describe('normalise', () => {
  it('trims, lowercases, and strips terminal punctuation', () => {
    expect(normalise('  Love. ')).toBe('love')
    expect(normalise('WORD!')).toBe('word')
    expect(normalise('a, b; c:')).toBe('a b c')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalise('   ')).toBe('')
    expect(normalise('')).toBe('')
  })

  it('preserves internal spacing between words', () => {
    expect(normalise('to loose')).toBe('to loose')
  })
})

describe('levenshtein', () => {
  it('is zero for identical strings', () => {
    expect(levenshtein('logos', 'logos')).toBe(0)
  })

  it('counts single edits', () => {
    expect(levenshtein('logos', 'logot')).toBe(1) // substitution
    expect(levenshtein('logos', 'logoss')).toBe(1) // insertion
    expect(levenshtein('logos', 'logo')).toBe(1) // deletion
  })

  it('counts multiple edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })

  it('equals the longer length when one string is empty', () => {
    expect(levenshtein('', 'word')).toBe(4)
    expect(levenshtein('word', '')).toBe(4)
  })
})

describe('fuzzyMatch', () => {
  it('matches identical strings', () => {
    expect(fuzzyMatch('word', 'word')).toBe(true)
  })

  it('allows zero typos for very short words (<=3 chars)', () => {
    expect(fuzzyMatch('cat', 'cot')).toBe(false)
    expect(fuzzyMatch('cat', 'cat')).toBe(true)
  })

  it('allows one typo for medium words (4-6 chars)', () => {
    expect(fuzzyMatch('grace', 'graci')).toBe(true)   // 1 edit
    expect(fuzzyMatch('grace', 'grxci')).toBe(false)  // 2 edits
  })

  it('allows two typos for longer words (7+ chars)', () => {
    expect(fuzzyMatch('righteous', 'rigteus')).toBe(true)   // 2 edits
    expect(fuzzyMatch('righteous', 'rigtxus')).toBe(false)  // 3 edits
  })

  it('treats two empty strings as a match', () => {
    expect(fuzzyMatch('', '')).toBe(true)
  })
})

describe('isAnswerCorrect (exact mode)', () => {
  it('accepts an exact match ignoring case and punctuation', () => {
    expect(isAnswerCorrect('Word.', 'word')).toBe(true)
  })

  it('rejects a near-miss when fuzzy is off', () => {
    expect(isAnswerCorrect('wrd', 'word')).toBe(false)
  })

  it('accepts any comma-separated alternative', () => {
    expect(isAnswerCorrect('word', 'word, message, reason')).toBe(true)
    expect(isAnswerCorrect('reason', 'word, message, reason')).toBe(true)
  })

  it('rejects an empty student answer', () => {
    expect(isAnswerCorrect('', 'word')).toBe(false)
    expect(isAnswerCorrect('   ', 'word')).toBe(false)
  })

  it('normalises alternatives (whitespace around commas)', () => {
    expect(isAnswerCorrect('message', 'word ,  message')).toBe(true)
  })
})

describe('isAnswerCorrect (fuzzy mode)', () => {
  it('tolerates a typo against one of several alternatives', () => {
    // "mesage" is 1 edit from "message" (7 chars → 2 allowed)
    expect(isAnswerCorrect('mesage', 'word, message', true)).toBe(true)
  })

  it('still rejects an answer too far from every alternative', () => {
    expect(isAnswerCorrect('xyz', 'word, message', true)).toBe(false)
  })

  it('does not tolerate typos when fuzzy is off', () => {
    expect(isAnswerCorrect('mesage', 'word, message', false)).toBe(false)
  })

  it('rejects an empty answer even in fuzzy mode', () => {
    expect(isAnswerCorrect('', 'word', true)).toBe(false)
  })
})
