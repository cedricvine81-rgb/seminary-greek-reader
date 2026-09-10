// Which paradigm table explains a given form — so that when a practice drill marks a parse
// wrong, the student can open the exact table rather than the whole chapter.
//
// This is the table-level counterpart to morph-grammar-links.ts, which resolves a (field,
// value) pair to a CHAPTER. A chapter is the right answer for "where is the aorist taught";
// it is too coarse for "why is κυρίου singular", where what the student needs is the one
// paradigm whose genitive column he misread.
//
// WHY A CLASSIFIER AND NOT A LOOKUP TABLE. The parse fields alone cannot pick the table:
// κυρίου is Genitive/Masculine/Singular, and so is a third-declension masculine genitive
// singular that declines nothing like it. What decides the table is the DECLENSION, and the
// pool records no such field. Declension is, however, a property of the lexeme, and the pools
// are far too large to enumerate by hand — NOUN_POOL alone carries 196 lexemes, ADJECTIVE_POOL
// 149. So the declension is derived from the lexeme's ending and gender, which is exactly the
// rule the chapter itself teaches, with an explicit exception list for the words that rule
// misfiles.
//
// THE EXCEPTIONS ARE THE POINT. A confidently wrong table is worse than no table at all: the
// student is being corrected at the moment he is least able to judge. Every exception below is
// listed individually rather than folded into a cleverer regex, so that a reader can check them
// one at a time. tests/morph-paradigm-tables.test.ts runs the classifier over every lexeme in
// all three nominal pools and fails if any one of them fails to resolve.

export type Declension = '1st' | '2nd' | '3rd'

export interface ParadigmTarget {
  /** Grammar chapter id — the ?chapter= value, as in morph-grammar-links.ts. */
  chapter: string
  /** MorphTable id, rendered into the DOM as an anchor (see MorphTable in shared.tsx). */
  tableId: string
}

// No label field here on purpose. A target names a table, and the table already carries its own
// title: the panel renders PARADIGM_TABLE_DATA[...].title (the chapter's own words, so the two
// agree), and the chapter link is labelled t('morph.par.seeTable'). An i18n key per target
// duplicated that, went unrendered, and — because scripts/i18n-guard.mjs reads every
// dotted string literal as a key reference — failed the production build for keys nothing used.

/**
 * Nouns and adjectives whose ending lies about their declension.
 *
 * Three of these fall out of the pool automatically — they end in -ος but are feminine, so the
 * ending rule would file them under the masculine column. The rest are the ones no rule can
 * catch: the ending looks perfectly ordinary and the paradigm is not.
 *
 * Keep this list explicit and alphabetical. It is meant to be read and corrected by a Greek
 * instructor, not maintained by pattern-matching.
 */
export const DECLENSION_EXCEPTIONS: Record<string, Declension> = {
  // -ος, but feminine: second declension all the same, so the DECLENSION is right and only a
  // gender-driven rule would go wrong. Listed so the classifier never has to guess from gender.
  'Κόρινθος': '2nd',
  'παρθένος': '2nd',
  'στείρος': '2nd',
  // Contract noun. Its ending is -οῦς with a circumflex, so it slips past the plain -ους test
  // and would otherwise fall to the third declension; it is second.
  'νοῦς': '2nd',
  // -ης masculines are first declension and the rule now gets them right; Σωσθένης is the
  // third-declension -ες stem wearing the same ending, so only it needs listing.
  'Σωσθένης': '3rd',
  'προφήτης': '1st',
  // Stems no ending can reveal: γυνή declines γυναικ-, and ἀσθενής is a third-declension -ες
  // adjective whose -ης ending reads as a first-declension feminine.
  'γυνή': '3rd',
  'ἀσθενής': '3rd',
  // Comparative adjectives in -ων/-ον decline third declension, but their neuter looks exactly
  // like a second-declension neuter.
  'κρεῖσσον': '3rd',
  'ἥττον': '3rd',
  // Irregular adjectives. μέγας and πολύς inflect 2-1-2 on stems (μεγαλ-, πολλ-) that their
  // nominative singular hides, so the -ας/-υς ending points at the wrong declension; ἀσθενής
  // is a third-declension -ες stem whose -ης ending reads as a first-declension feminine.
  'μέγας': '2nd',
  'πολύς': '2nd',
}

const SECOND_ENDING = /(ος|ον)$/
const FIRST_ENDING = /(α|η|ας|ης)$/
const MATA_STEM = /μα$/
const EUS_STEM = /ευς$/

/**
 * Accents off before the ending is tested.
 *
 * This is not cosmetic. An accented ending is a different codepoint from its bare form — -ός is
 * not -ος, -ή is not -η — so matching the raw lexeme silently drops every word that is accented
 * on its last syllable. The first version of this file did exactly that, and sent θεός, ἀδελφός,
 * γραφή, ἐντολή, κεφαλή and γυνή to the third declension, which is wrong for all six.
 */
const bare = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * The declension of a noun or adjective, from its lexical (nominative singular) form.
 *
 * The rule is the chapter's own: -ος / -ον is second declension, -α / -η is first, and anything
 * else — consonant stems, -ις, -μα, -ευς — is third. `DECLENSION_EXCEPTIONS` wins over the rule.
 */
export function classifyDeclension(lexeme: string): Declension {
  const known = DECLENSION_EXCEPTIONS[lexeme]
  if (known) return known
  const stem = bare(lexeme)
  // -μα before -α (ὄνομα is a -ματ- stem) and -ευς before anything (βασιλεύς is not -ος).
  if (MATA_STEM.test(stem)) return '3rd'
  if (EUS_STEM.test(stem)) return '3rd'
  if (SECOND_ENDING.test(stem)) return '2nd'
  if (FIRST_ENDING.test(stem)) return '1st'
  return '3rd'
}

/** First and second declension share one endings table; the third has its own. */
const NOMINAL_TABLE: Record<Declension, ParadigmTarget> = {
  '1st': { chapter: 'nouns', tableId: 'nouns.t3' },
  '2nd': { chapter: 'nouns', tableId: 'nouns.t3' },
  '3rd': { chapter: 'nouns', tableId: 'nouns.t5' },
}

/**
 * Pronouns decline individually, so each gets its own full paradigm rather than an endings
 * table. Anything not listed falls back to the pronoun chapter's αὐτός paradigm, which is the
 * pattern the others are taught against.
 */
const PRONOUN_TABLE: Record<string, ParadigmTarget> = {
  'αὐτός':   { chapter: 'pronouns',       tableId: 'pronouns.t1' },
  'ἐγώ':     { chapter: 'pronouns',       tableId: 'pronouns.t2' },
  'σύ':      { chapter: 'pronouns',       tableId: 'pronouns.t2' },
  'ἡμεῖς':   { chapter: 'pronouns',       tableId: 'pronouns.t2' },
  'ὑμεῖς':   { chapter: 'pronouns',       tableId: 'pronouns.t2' },
  'οὐδείς':  { chapter: 'pronouns',       tableId: 'pronouns.t3' },
  'μηδείς':  { chapter: 'pronouns',       tableId: 'pronouns.t4' },
  'τις':     { chapter: 'pronouns',       tableId: 'pronouns.t5' },
  'τίς':     { chapter: 'pronouns',       tableId: 'pronouns.t6' },
  'οὗτος':   { chapter: 'demonstratives', tableId: 'demonstratives.t1' },
  'ἐκεῖνος': { chapter: 'demonstratives', tableId: 'demonstratives.t2' },
}
const PRONOUN_FALLBACK: ParadigmTarget = PRONOUN_TABLE['αὐτός']

/**
 * The paradigm table that explains a form, or null when this part of speech has no single
 * table to point at.
 *
 * Verbs deliberately return null. Which conjugation table a verb form belongs to depends on its
 * class — contract, liquid, μι-, second aorist — and VERB_POOL carries 880 lexemes with no class
 * recorded, so any answer here would be a guess. Verbs keep the chapter-level link from
 * morph-grammar-links.ts until verb classes are tagged.
 */
export function paradigmFor(entry: { partOfSpeech?: string | null; lexeme?: string | null }): ParadigmTarget | null {
  const { partOfSpeech, lexeme } = entry
  if (!lexeme) return null
  switch (partOfSpeech) {
    case 'Noun':
    case 'Adjective':
      return NOMINAL_TABLE[classifyDeclension(lexeme)]
    case 'Pronoun':
      return PRONOUN_TABLE[lexeme] ?? PRONOUN_FALLBACK
    default:
      return null
  }
}

/**
 * The paradigm tables themselves, as data.
 *
 * These rows used to live inline in chapters/nouns.tsx. They are here so the practice panel and
 * the grammar chapter render the SAME table rather than two copies that drift — the chapter
 * imports them back. Only the endings paradigms are moved: they are what the nominal classifier
 * points at, and between them they cover every noun and adjective in the pools.
 *
 * Pronouns are deliberately not here. Each declines individually, so there are eleven separate
 * paradigms rather than two shared ones; the practice link sends those to the chapter's own
 * table by anchor instead of duplicating them.
 */
export interface ParadigmTableData {
  /** The chapter's own English title/note, verbatim. MorphTable feeds these through
   *  tm(K.title(id)) with the literal as fallback AND fingerprint source, so the panel
   *  rendering the same literal under the same id reuses the chapter's translation.
   *  Changing either string strands its Spanish — see the i18n fingerprint contract. */
  title: string
  headers: string[]
  rows: string[][]
  dividerRows: number[]
  tCols: number[]
  note: string
}

export const PARADIGM_TABLE_DATA: Record<string, ParadigmTableData> = {
  'nouns.t3': {
    title: '1st & 2nd Declension Endings',
    headers: ['', 'Masc.', 'Neut.', 'Fem.', 'Sense'],
    tCols: [0, 4],
    dividerRows: [0, 5],
    rows: [
      ['Singular', '', '', '', ''],
      ['Nom.', '‒ος', '‒ον', '‒η', 'subject'], ['Gen.', '‒ου →', '‒ου', '‒ης', 'of'],
      ['Dat.', '‒ῳ →', '‒ῳ', '‒ῃ', 'to / for'], ['Acc.', '‒ον', '= Nom.', '‒ην', 'object'],
      ['Plural', '', '', '', ''],
      ['Nom.', '‒οι', '‒α', '‒αι', 'subject'], ['Gen.', '‒ων →', '‒ων', '‒ων', 'of'],
      ['Dat.', '‒οις →', '‒οις', '‒αις', 'to / for'], ['Acc.', '‒ους', '= Nom.', '‒ας', 'object'],
    ],
    note: '→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom.',
  },
  'nouns.t5': {
    title: '3rd Declension Endings',
    headers: ['', 'Masc./Fem.', 'Neuter', 'Sense'],
    tCols: [0, 1, 2, 3],
    dividerRows: [0, 5],
    rows: [
      ['Singular', '', '', ''],
      ['Nom.', '‒ς  or  ‒(none)', '‒(none)', 'subject'], ['Gen.', '‒ος →', '‒ος', 'of'],
      ['Dat.', '‒ι →', '‒ι', 'to / for'], ['Acc.', '‒α  or  ‒ν', '= Nom.', 'object'],
      ['Plural', '', '', ''],
      ['Nom.', '‒ες', '‒α', 'subject'], ['Gen.', '‒ων →', '‒ων', 'of'],
      ['Dat.', '‒σι →', '‒σι', 'to / for'], ['Acc.', '‒ας', '= Nom.', 'object'],
    ],
    note: '→ neuter takes the same ending as Masc./Fem.  ·  Neuter Acc. = Neuter Nom.',
  },
}
