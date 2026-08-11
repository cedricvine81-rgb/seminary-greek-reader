/**
 * Repairs morph rows whose Robinson codes were never expanded.
 *
 * The Tischendorf corpus carries Robinson tags like `P-1GP` (personal pronoun, 1st person,
 * genitive plural). Whatever built public/data/gnt filled the structured fields positionally and
 * so slid every value one slot left for the classes whose code carries a PERSON before its case:
 *
 *     ὑμῶν  →  { partOfSpeech: 'Personal Pronoun', casus: '2', number: 'G', gender: 'P' }
 *
 * The person sits in `casus`, the case letter in `number`, the number letter in `gender`. It
 * affects 7,312 words — the personal, reflexive and possessive pronouns, plus the indeclinables
 * (`Ἰσραήλ` is tagged N-PRI, "proper, indeclinable") and a tail of adverbs whose letter is a
 * DEGREE (`πρότερον`, N-C = comparative), not a case at all.
 *
 * Three things were wrong because of it, and only the third is about Spanish:
 *
 *   1. The parsing line read "Personal Pronoun, G, 2, P" — in English too. A pre-existing bug
 *      that survived because the default edition is Nestle 1904, where the codes ARE expanded.
 *   2. Prepositions before a pronoun could not find their object's case, so 589 of them fell
 *      back to a gloss listing every case at once.
 *   3. formGloss() reads case and number off the parsing, so ἡμῖν had neither and dropped to the
 *      lemma gloss — "yo" over a first person PLURAL DATIVE. Exactly the complaint that started
 *      this work, still live on this edition after the table that was meant to fix it.
 *
 * Repairing the data on the way in fixes all three at once, and anything else that reads a case.
 * The alternative — teaching each consumer to recognise a person digit — is how the same bug
 * ends up fixed three times and missed a fourth.
 *
 * DECODES ONLY WHAT IS UNAMBIGUOUS. A row whose `casus` already holds a real case name is
 * returned untouched, so the Nestle 1904 and LXX corpora pass straight through.
 */
export interface RawMorph {
  partOfSpeech: string
  casus?: string | null
  number?: string | null
  gender?: string | null
  tense?: string | null
  voice?: string | null
  mood?: string | null
  person?: string | null
  degree?: string | null
}

const CASE_LETTER: Record<string, string> = {
  N: 'Nominative', G: 'Genitive', D: 'Dative', A: 'Accusative', V: 'Vocative',
}
const NUMBER_LETTER: Record<string, string> = { S: 'Singular', P: 'Plural' }
const GENDER_LETTER: Record<string, string> = { M: 'Masculine', F: 'Feminine', N: 'Neuter' }
/** The degree letters Robinson hangs on adverbs and adjectives. */
const DEGREE_LETTER: Record<string, string> = { C: 'Comparative', S: 'Superlative' }

const CASES = new Set(Object.values(CASE_LETTER))
const NUMBERS = new Set(Object.values(NUMBER_LETTER))
const GENDERS = new Set(Object.values(GENDER_LETTER))

const isPerson = (v: string | null | undefined) => v === '1' || v === '2' || v === '3'

/**
 * `N` is both Nominative and Neuter, so a bare letter can only be read from the slot it sits in.
 * These helpers take the slot as given and never guess across it.
 */
const asCase = (v: string | null | undefined) => (v && CASE_LETTER[v]) || undefined
const asNumber = (v: string | null | undefined) => (v && NUMBER_LETTER[v]) || undefined

/** Every field optional and undefined-not-null, which is the shape MorphParse wants. */
export interface NormalizedMorph {
  partOfSpeech: string
  casus?: string
  number?: string
  gender?: string
  person?: string
  degree?: string
  tense?: string
  voice?: string
  mood?: string
}

/** A morph row with its Robinson leftovers expanded into the fields they belong in.
 *  `degree` is set because Robinson marks it on adverbs the source shape has no slot for. */
export function normalizeMorph(m: RawMorph): NormalizedMorph {
  const base: NormalizedMorph = {
    partOfSpeech: m.partOfSpeech,
    tense: m.tense ?? undefined,
    voice: m.voice ?? undefined,
    mood: m.mood ?? undefined,
    person: m.person ?? undefined,
    degree: m.degree ?? undefined,
  }
  const keep = (v: string | null | undefined, ok: Set<string>) => (v && ok.has(v) ? v : undefined)

  const c = m.casus
  // Already expanded — Nestle 1904 and the LXX take this path and come through untouched.
  if (!c || CASES.has(c)) {
    return { ...base, casus: c ?? undefined, number: m.number ?? undefined, gender: m.gender ?? undefined }
  }

  // ── The shifted classes: a person digit landed in `casus`. ────────────────────────────────
  if (isPerson(c)) {
    // Personal and reflexive: case letter in `number`, number letter in `gender`.
    const shifted = asCase(m.number)
    if (shifted) return { ...base, person: c, casus: shifted, number: asNumber(m.gender) }

    // Possessive: `number` was expanded already, so only the case slid, into `gender`. Where
    // `gender` holds a real gender instead, the case is simply absent from the source — say
    // nothing rather than invent one.
    return {
      ...base,
      person: c,
      casus: (m.gender && CASE_LETTER[m.gender]) || undefined,
      number: keep(m.number, NUMBERS),
      gender: keep(m.gender, GENDERS),
    }
  }

  // ── Everything else: the letter is not a case, and pretending otherwise is what showed
  //    "Adverb, C" to a student. Indeclinables (N-PRI, N-LI, N-OI) have no case, number or
  //    gender at all; the codes marking them so are dropped rather than displayed. ───────────
  return {
    ...base,
    degree: DEGREE_LETTER[c] ?? base.degree,
    number: keep(m.number, NUMBERS),
    gender: keep(m.gender, GENDERS),
  }
}
