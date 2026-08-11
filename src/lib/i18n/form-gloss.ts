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

const nfc = (s: string) => s.normalize('NFC')

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

/**
 * Which person each personal-pronoun lemma is. Editions disagree about the lemma of the plural
 * forms — Nestle 1904 files ὑμῶν under σύ, Tischendorf under ὑμεῖς — and both must resolve, or
 * the gloss silently depends on which edition the student happens to be reading. κἀγώ is ἐγώ
 * with καί fused onto the front.
 */
const PERSON_OF: Record<string, string> = {
  'ἐγώ': '1', 'ἡμεῖς': '1', 'κἀγώ': '1',
  'σύ': '2', 'ὑμεῖς': '2',
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

/**
 * A preposition's sense depends on the case it governs — which is carried by its OBJECT, not by
 * the preposition. διά + genitive is "by means of"; διά + accusative is "because of". The lemma
 * gloss has to list every case at once, so a beginner reading διὰ τὴν ἀγάπην is handed three
 * possibilities and left to pick. Given the case, only one is shown.
 *
 * Prepositions governing a single case are here too: "(con dat.) en" is not wrong, but "en" is
 * what the student needs, and the case is stated on the parsing line anyway.
 */
const PREPOSITION: Record<string, Record<string, string>> = {
  'ἐν':        { dative: 'en, dentro de; con, por' },
  'εἰς':       { accusative: 'a, hacia dentro de; para' },
  'ἐκ':        { genitive: 'de, desde dentro de' },
  'ἀπό':       { genitive: 'de, desde, lejos de' },
  'πρό':       { genitive: 'antes de, delante de' },
  'σύν':       { dative: 'con, junto con' },
  'ἀντί':      { genitive: 'en lugar de, a cambio de' },
  'ἐνώπιον':   { genitive: 'delante de, en presencia de' },
  'ἔμπροσθεν': { genitive: 'delante de, ante' },
  'ἕνεκα':     { genitive: 'a causa de, por' },
  // The ones whose meaning actually turns on the case — where this earns its place.
  'ἐπί':   { genitive: 'sobre, encima de; en tiempos de', dative: 'en, junto a; a base de', accusative: 'sobre, hacia; contra' },
  'διά':   { genitive: 'por medio de, a través de', accusative: 'a causa de, por' },
  'κατά':  { genitive: 'contra; hacia abajo desde', accusative: 'según, conforme a; por' },
  'μετά':  { genitive: 'con, en compañía de', accusative: 'después de' },
  'περί':  { genitive: 'acerca de, sobre', accusative: 'alrededor de' },
  'ὑπό':   { genitive: 'por (agente)', accusative: 'debajo de, bajo' },
  'παρά':  { genitive: 'de parte de', dative: 'junto a, al lado de; ante', accusative: 'junto a, a lo largo de' },
  'ὑπέρ':  { genitive: 'a favor de, por', accusative: 'por encima de, más que' },
  'πρός':  { accusative: 'a, hacia; con', dative: 'cerca de, junto a', genitive: 'de parte de' },
  'ἀνά':   { accusative: 'por, a través de; cada uno' },
}

/** The real cases. The corpus stores a person digit or a proper-noun code in this field for some
 *  pronouns and names, so a value has to be recognised rather than merely present. */
const CASES = ['nominative', 'genitive', 'dative', 'accusative', 'vocative']
export function isCase(v: string | null | undefined): boolean {
  return !!v && CASES.includes(v.toLowerCase())
}

/**
 * Postpositives, which cannot begin a clause and so routinely sit between a preposition and its
 * object (ἐν δὲ τῷ …) without being part of the phrase.
 */
const POSTPOSITIVE = new Set(['δέ', 'γάρ', 'μέν', 'οὖν', 'τε'])

/**
 * The case a preposition at `i` governs, or undefined when it cannot be read.
 *
 * STOPS AT THE FIRST REAL WORD rather than searching for the first readable case, and the
 * difference matters: the corpus stores a person digit for pronouns (ὑμᾶς is '2', not
 * Accusative) and 'P' for indeclinable names. Scanning onward for something case-shaped sailed
 * past those objects into the NEXT phrase and mis-sensed 282 prepositions — εἰς ὑμᾶς ἐν λόγῳ was
 * read as εἰς + dative, which εἰς never takes. Giving up is correct there: the panel falls back
 * to the full lemma gloss, which lists every case, and the student is no worse off than before.
 *
 * Exported so the reader and its tests share one implementation. An earlier pair of reference
 * parsers drifted apart in exactly this way and grew the same bug twice.
 */
export function governingCase(
  words: { lemma?: string; casus?: string | null }[], i: number,
): string | undefined {
  for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
    const w = words[j]
    if (w.lemma && POSTPOSITIVE.has(nfc(w.lemma))) continue   // not part of the phrase
    return isCase(w.casus) ? (w.casus as string) : undefined  // the object: readable, or give up
  }
  return undefined
}

/**
 * The form's meaning, or null to fall back to the lemma gloss.
 * `parsing` is the English parsing string as stored, not the translated display one.
 */
export function formGloss(
  lexeme: string | undefined, parsing: string | undefined, objectCase?: string,
): string | null {
  if (!lexeme) return null
  const l = nfc(lexeme)
  const m = parseMorph(parsing)
  const ng = m.number && m.gender ? `${m.number}.${m.gender}` : null

  if (l === 'ὁ' && ng && m.case) return ARTICLE[ng]?.[m.case] ?? null

  const person = PERSON_OF[l]
  if (person && m.number && m.case) {
    // Person is not always tagged on these — the lemma already fixes it.
    return PERSONAL[`${person}.${m.number}`]?.[m.case] ?? null
  }

  if (l === 'αὐτός' && ng && m.case) return AUTOS[ng]?.[m.case] ?? null

  const dem = DEMONSTRATIVE[l]
  if (dem && ng) return dem[ng] ?? null

  const prep = PREPOSITION[l]
  if (prep) {
    // A preposition governing ONE case needs no lookahead: εἰς is accusative whether or not the
    // object's tagging can be read. Deriving that from the table rather than a second list keeps
    // the two from drifting when a case is added to an entry.
    const only = Object.keys(prep)
    if (only.length === 1) return prep[only[0]]
    if (objectCase) return prep[objectCase.toLowerCase()] ?? null
  }

  return null
}

/**
 * Every lemma this module glosses by form. Exported so a caller — or a test — can ask rather
 * than restate the list; the one that restated it went stale the first time a lemma was added.
 */
export const FORM_GLOSSED_LEMMAS: ReadonlySet<string> = new Set([
  'ὁ', 'αὐτός', ...Object.keys(PERSON_OF), ...Object.keys(DEMONSTRATIVE), ...Object.keys(PREPOSITION),
])
