/**
 * A gloss for the FORM in front of the student, not just for its dictionary entry.
 *
 * A lexicon gloss names the lemma, which is what a lexicon is for. But on the closed classes it
 * can mislead a beginner badly: ἡμῖν lemmatises to ἐγώ, so the pane said "yo" over a first
 * person PLURAL DATIVE. Technically right, and no help at all to someone still learning to read
 * the ending — the one place a reader most needs the form explained is exactly where the lemma
 * gloss says least.
 *
 * So for the handful of paradigms where the inflection carries the meaning — the article, the
 * personal and demonstrative pronouns, the relative — the gloss is computed from the parsing
 * instead. These are a tiny closed set and between them account for roughly a quarter of every
 * word in the New Testament, so the payoff per entry is enormous.
 *
 * WHY NOT EVERYTHING. For an ordinary noun or verb the lemma gloss IS the useful answer: a
 * student reading ἐλάβομεν wants "tomar, recibir", and conjugating it into "tomamos" would hide
 * the dictionary form they need in order to look it up or to learn it. The parsing line beside
 * the gloss already tells them the person and number. Only where the paradigm is the vocabulary
 * does form-glossing help, which is why this is a table and not a rule.
 *
 * Returns null when it has nothing better to offer, and the caller falls back to the lexicon.
 */

type Morph = { case?: string; number?: string; gender?: string; person?: string }

/** Read back the comma-separated English parsing that formatParsing() produces. */
function parseMorph(parsing: string | undefined): Morph {
  const t = (parsing ?? '').toLowerCase().split(',').map(s => s.trim())
  const has = (...xs: string[]) => xs.find(x => t.includes(x))
  return {
    case: has('nominative', 'genitive', 'dative', 'accusative', 'vocative'),
    number: has('singular', 'plural'),
    gender: has('masculine', 'feminine', 'neuter'),
    person: /(\d) person/.exec(parsing ?? '')?.[1],
  }
}

/** The article, whose Spanish equivalent is entirely a matter of case, number and gender. */
const ARTICLE: Record<string, Record<string, string>> = {
  'singular.masculine': { nominative: 'el', genitive: 'del, de el', dative: 'al, a el', accusative: 'el, lo' },
  'singular.feminine':  { nominative: 'la', genitive: 'de la', dative: 'a la', accusative: 'la' },
  'singular.neuter':    { nominative: 'lo', genitive: 'de lo', dative: 'a lo', accusative: 'lo' },
  'plural.masculine':   { nominative: 'los', genitive: 'de los', dative: 'a los', accusative: 'los' },
  'plural.feminine':    { nominative: 'las', genitive: 'de las', dative: 'a las', accusative: 'las' },
  'plural.neuter':      { nominative: 'los, las cosas', genitive: 'de las cosas', dative: 'a las cosas', accusative: 'las cosas' },
}

/** First and second person. The dative is the case the lemma gloss served worst. */
const PERSONAL: Record<string, Record<string, string>> = {
  '1.singular': { nominative: 'yo', genitive: 'de mí, mi', dative: 'me, a mí', accusative: 'me, a mí' },
  '1.plural':   { nominative: 'nosotros', genitive: 'de nosotros, nuestro', dative: 'nos, a nosotros', accusative: 'nos, a nosotros' },
  // Latin American Spanish throughout: ustedes, never vosotros.
  '2.singular': { nominative: 'tú', genitive: 'de ti, tu', dative: 'te, a ti', accusative: 'te, a ti' },
  '2.plural':   { nominative: 'ustedes', genitive: 'de ustedes', dative: 'les, a ustedes', accusative: 'los, a ustedes' },
}

/** αὐτός — third person, and by far the commonest word a student clicks after the article. */
const AUTOS: Record<string, Record<string, string>> = {
  'singular.masculine': { nominative: 'él; mismo', genitive: 'de él, su', dative: 'le, a él', accusative: 'lo, a él' },
  'singular.feminine':  { nominative: 'ella; misma', genitive: 'de ella, su', dative: 'le, a ella', accusative: 'la, a ella' },
  'singular.neuter':    { nominative: 'ello; mismo', genitive: 'de ello, su', dative: 'le, a ello', accusative: 'lo' },
  'plural.masculine':   { nominative: 'ellos; mismos', genitive: 'de ellos, su', dative: 'les, a ellos', accusative: 'los, a ellos' },
  'plural.feminine':    { nominative: 'ellas; mismas', genitive: 'de ellas, su', dative: 'les, a ellas', accusative: 'las, a ellas' },
  'plural.neuter':      { nominative: 'ellos; mismos', genitive: 'de ellos, su', dative: 'les, a ellos', accusative: 'los' },
}

/** Demonstratives inflect for gender and number, which Spanish matches one-for-one. */
const DEMONSTRATIVE: Record<string, Record<string, string>> = {
  'οὗτος': {
    'singular.masculine': 'este', 'singular.feminine': 'esta', 'singular.neuter': 'esto',
    'plural.masculine': 'estos', 'plural.feminine': 'estas', 'plural.neuter': 'estas cosas',
  },
  'ἐκεῖνος': {
    'singular.masculine': 'aquel', 'singular.feminine': 'aquella', 'singular.neuter': 'aquello',
    'plural.masculine': 'aquellos', 'plural.feminine': 'aquellas', 'plural.neuter': 'aquellas cosas',
  },
}

const nfc = (s: string) => s.normalize('NFC')

/**
 * The form's meaning, or null to fall back to the lemma gloss.
 * `parsing` is the English parsing string as stored, not the translated display one.
 */
export function formGloss(lexeme: string | undefined, parsing: string | undefined): string | null {
  if (!lexeme) return null
  const l = nfc(lexeme)
  const m = parseMorph(parsing)
  const ng = m.number && m.gender ? `${m.number}.${m.gender}` : null

  if (l === 'ὁ' && ng && m.case) return ARTICLE[ng]?.[m.case] ?? null

  if ((l === 'ἐγώ' || l === 'σύ') && m.number && m.case) {
    // Person is not always tagged on these — the lemma already fixes it.
    const person = l === 'ἐγώ' ? '1' : '2'
    return PERSONAL[`${person}.${m.number}`]?.[m.case] ?? null
  }

  if (l === 'αὐτός' && ng && m.case) return AUTOS[ng]?.[m.case] ?? null

  const dem = DEMONSTRATIVE[l]
  if (dem && ng) return dem[ng] ?? null

  return null
}
