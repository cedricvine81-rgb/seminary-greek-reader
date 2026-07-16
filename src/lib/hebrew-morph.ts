// Decoder for Open Scriptures Hebrew Bible (OSHB / ETCBC) morphology codes into a
// traditional, human-readable parse — the Hebrew counterpart to the Greek morph formatting
// used elsewhere in the Reader. Codes come from public/data/mt/*.json (built by
// scripts/build-hebrew-ot.py); the leading language letter (H/A) is already stripped and the
// language is carried separately, so a code looks like "Ncfsa", "Vqp3ms", "To", "Rd", "Sp3ms".
//
// Reference: https://hb.openscriptures.org/parsing/HebrewMorphologyCodes.html

export type Lang = 'H' | 'A'

const GENDER: Record<string, string> = { m: 'masculine', f: 'feminine', b: 'both', c: 'common' }
const NUMBER: Record<string, string> = { s: 'singular', p: 'plural', d: 'dual' }
const STATE: Record<string, string> = { a: 'absolute', c: 'construct', d: 'determined' }
const PERSON: Record<string, string> = { '1': '1st person', '2': '2nd person', '3': '3rd person' }

// Verb stems (binyanim). Hebrew and Aramaic share some letters with different names.
const STEM_H: Record<string, string> = {
  q: 'Qal', N: 'Niphal', p: 'Piel', P: 'Pual', h: 'Hiphil', H: 'Hophal', t: 'Hithpael',
  o: 'Polel', O: 'Polal', r: 'Poel', R: 'Poal', m: 'Polel', M: 'Polal', k: 'Palel', K: 'Palal',
  Q: 'Qal passive', l: 'Pilpel', L: 'Polpal', f: 'Hithpalpel', D: 'Nithpael', j: 'Pealal',
  i: 'Pilel', u: 'Hothpaal', c: 'Tiphil', v: 'Hishtaphel', w: 'Nithpalel', y: 'Nithpael',
  z: 'Hithpoel', Z: 'Nithpoel',
}
const STEM_A: Record<string, string> = {
  q: 'Peal', Q: 'Peil', u: 'Hithpeel', N: 'Niphal', p: 'Pael', P: 'Pual', M: 'Ithpaal',
  a: 'Aphel', h: 'Haphel', s: 'Saphel', e: 'Shaphel', H: 'Hophal', i: 'Hithpaal', t: 'Hishtaphel',
}

// Verb conjugation / type (the character after the stem).
const VERB_TYPE: Record<string, string> = {
  p: 'perfect', q: 'sequential perfect', i: 'imperfect', w: 'sequential imperfect',
  h: 'cohortative', j: 'jussive', v: 'imperative',
  a: 'infinitive absolute', c: 'infinitive construct',
  r: 'active participle', s: 'passive participle',
}

// First-letter part of speech, when there is no more-specific two-letter subtype below.
const POS1: Record<string, string> = {
  C: 'conjunction', D: 'adverb', R: 'preposition',
}
// Two-letter part-of-speech subtypes.
const POS2: Record<string, string> = {
  Aa: 'adjective', Ac: 'cardinal number', Ag: 'gentilic adjective', Ao: 'ordinal number',
  Nc: 'noun', Ng: 'gentilic noun', Np: 'proper noun', Nx: 'noun',
  Pd: 'demonstrative pronoun', Pf: 'indefinite pronoun', Pi: 'interrogative pronoun',
  Pp: 'personal pronoun', Pr: 'relative pronoun',
  Sd: 'directional he', Sh: 'paragogic he', Sn: 'paragogic nun', Sp: 'pronominal suffix',
  Ta: 'affirmation particle', Td: 'definite article', Te: 'exhortation particle',
  Ti: 'interrogative particle', Tj: 'interjection', Tm: 'demonstrative particle',
  Tn: 'negative particle', To: 'direct object marker', Tr: 'relative particle',
}

function joinGN(gender?: string, number?: string): string {
  return [gender && GENDER[gender], number && NUMBER[number]].filter(Boolean).join(' ')
}

function pgn(person?: string, gender?: string, number?: string): string {
  return [person && PERSON[person], gender && GENDER[gender], number && NUMBER[number]]
    .filter(Boolean)
    .join(' ')
}

// ── Verbs ──────────────────────────────────────────────────────────────────────
function formatVerb(code: string, lang: Lang): string {
  // code[0] === 'V'; code[1] = stem; code[2] = type; remainder = person/gender/number or gender/number/state
  const stem = (lang === 'A' ? STEM_A : STEM_H)[code[1]] ?? `stem ${code[1] ?? ''}`.trim()
  const typeCh = code[2]
  const type = VERB_TYPE[typeCh] ?? ''
  const rest = code.slice(3)
  const parts = ['Verb', stem, type]

  if (typeCh === 'r' || typeCh === 's') {
    // participle: gender, number, [state]
    const gn = joinGN(rest[0], rest[1])
    if (gn) parts.push(gn)
    if (rest[2] && STATE[rest[2]]) parts.push(STATE[rest[2]])
  } else if (typeCh === 'a' || typeCh === 'c') {
    // infinitive: usually no agreement
  } else {
    // finite: person gender number
    const agr = pgn(rest[0], rest[1], rest[2])
    if (agr) parts.push(agr)
  }
  return parts.filter(Boolean).join(', ')
}

// ── Nominals (noun / adjective) ──────────────────────────────────────────────────
function formatNominal(label: string, rest: string): string {
  // rest = gender, number, state (state optional; proper nouns may omit gender/number)
  const parts = [label]
  const gn = joinGN(rest[0], rest[1])
  if (gn) parts.push(gn)
  if (rest[2] && STATE[rest[2]]) parts.push(STATE[rest[2]])
  return parts.join(', ')
}

/** Full human-readable parse, e.g. "Verb, Qal, perfect, 3rd person masculine singular". */
export function formatHebrewParse(code: string, lang: Lang = 'H'): string {
  if (!code) return ''
  const c0 = code[0]

  if (c0 === 'V') return formatVerb(code, lang)

  if (c0 === 'N' || c0 === 'A') {
    const label = POS2[code.slice(0, 2)] ?? (c0 === 'N' ? 'noun' : 'adjective')
    return formatNominal(cap(label), code.slice(2))
  }

  if (c0 === 'P') {
    const label = POS2[code.slice(0, 2)] ?? 'pronoun'
    const agr = pgn(code[2], code[3], code[4])
    return [cap(label), agr].filter(Boolean).join(', ')
  }

  if (c0 === 'S') {
    const label = POS2[code.slice(0, 2)] ?? 'suffix'
    if (code[1] === 'p') {
      const agr = pgn(code[2], code[3], code[4])
      return [cap(label), agr].filter(Boolean).join(', ')
    }
    return cap(label)
  }

  if (c0 === 'T') return cap(POS2[code.slice(0, 2)] ?? 'particle')

  if (c0 === 'R') return code[1] === 'd' ? 'Preposition + definite article' : 'Preposition'

  if (POS1[c0]) return cap(POS1[c0])

  return code // unknown — show the raw code rather than nothing
}

/** Short label for a morpheme segment (prefix/suffix), e.g. "prep.", "art.", "conj.", "3ms suffix". */
export function hebrewMorphRole(code: string, lang: Lang = 'H'): string {
  if (!code) return ''
  const c0 = code[0]
  if (c0 === 'R') return code[1] === 'd' ? 'prep. + art.' : 'preposition'
  if (c0 === 'C') return 'conjunction'
  if (c0 === 'D') return 'adverb'
  if (code.slice(0, 2) === 'Td') return 'definite article'
  if (code.slice(0, 2) === 'To') return 'direct object marker'
  if (c0 === 'T') return POS2[code.slice(0, 2)] ?? 'particle'
  if (code.slice(0, 2) === 'Sp') {
    const agr = compactPGN(code[2], code[3], code[4])
    return agr ? `${agr} suffix` : 'pronominal suffix'
  }
  if (c0 === 'S') return POS2[code.slice(0, 2)] ?? 'suffix'
  if (c0 === 'V') return 'verb'
  if (c0 === 'N') return 'noun'
  if (c0 === 'A') return 'adjective'
  if (c0 === 'P') return POS2[code.slice(0, 2)] ?? 'pronoun'
  return formatHebrewParse(code, lang)
}

/** Broad part-of-speech word used for the lexicon entry, e.g. "Noun", "Verb", "Preposition". */
export function hebrewPartOfSpeech(code: string): string {
  const map: Record<string, string> = {
    V: 'Verb', N: 'Noun', A: 'Adjective', P: 'Pronoun', R: 'Preposition',
    C: 'Conjunction', D: 'Adverb', T: 'Particle', S: 'Suffix',
  }
  return map[code?.[0]] ?? 'Word'
}

function compactPGN(person?: string, gender?: string, number?: string): string {
  const p = person && /[123]/.test(person) ? person : ''
  const g = gender && gender !== 'c' ? gender : (gender === 'c' ? 'c' : '')
  const n = number ?? ''
  return `${p}${g}${n}`
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}
