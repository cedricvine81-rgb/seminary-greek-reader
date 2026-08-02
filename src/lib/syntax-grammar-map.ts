// Syntax category → Grammar chapter.
//
// The right-click menu already names a word's syntactic category and describes it. What it
// could not do was connect that category to the place where the category is TAUGHT — so a
// student who met "Partitive Genitive" on a word had no route from there to the Genitive
// section of the Nouns chapter. This is that route.
//
// SCOPE — this maps the categories the detector already produces; it adds none. Those are a
// curated subset of Wallace (about 15 genitive categories against his ~33, and similarly
// through the other cases), chosen to match what the Intermediate course teaches. Two reasons
// to keep it that way:
//
//   1. The detector infers categories from treebank structure, and much of Wallace is not
//      mechanically detectable — subjective vs. objective genitive turns on context and the
//      author's usage, which is why the Nouns chapter treats πίστις Χριστοῦ as an open
//      question rather than a lookup. A parser cannot assign those without guessing.
//   2. The value here is connecting a word to OUR teaching. A category the course never
//      mentions adds confusion, not depth.
//
// If a category should link somewhere and doesn't, the fix is usually to teach it in the
// Grammar first and then add the row — not to widen this table on its own.

/** Grammar chapter ids — these are MorphologyView's MainTab values. */
export type GrammarChapter =
  | 'essentials' | 'pronunciation' | 'parsing' | 'nouns' | 'pronouns' | 'demonstratives'
  | 'relatives' | 'prepositions' | 'conjunctions' | 'conj-adv' | 'indicatives'
  | 'contract-verbs' | 'liquids' | 'principal-parts' | 'infinitives' | 'imperatives'
  | 'participles' | 'subjunctives' | 'mi-verbs' | '2nd-aorists' | 'deponents'

/** Human label for the chapter, matching the tab the student will land on. */
export const CHAPTER_LABEL: Record<GrammarChapter, string> = {
  essentials: 'Minimums',
  pronunciation: 'Pronunciation',
  parsing: 'Parsing',
  nouns: 'Nouns & Adjectives',
  pronouns: 'Pronouns',
  demonstratives: 'Demonstratives',
  relatives: 'Relatives',
  prepositions: 'Prepositions',
  conjunctions: 'Conditionals',
  'conj-adv': 'Conjunctions & Adverbs',
  indicatives: 'Indicatives',
  'contract-verbs': 'Contract Verbs',
  liquids: 'Liquid Verbs',
  'principal-parts': 'Principal Parts',
  infinitives: 'Infinitives',
  imperatives: 'Imperatives',
  participles: 'Participles',
  subjunctives: 'Subjunctives',
  'mi-verbs': 'μι-Verbs',
  '2nd-aorists': '2nd Aorists',
  deponents: 'Deponents',
}

// Categories whose name does not betray its chapter by the patterns below, or where the
// obvious pattern would send it to the wrong place. Checked before the patterns.
const OVERRIDES: Record<string, GrammarChapter> = {
  // Case functions on the article / adjectives are taught with the nouns they modify.
  'Definite Article': 'nouns',
  'Attributive Adjective': 'nouns',
  'Predicate Adjective': 'nouns',
  'Substantival Adjective': 'nouns',
  'Substantizer': 'nouns',
  'Indeclinable Proper Name': 'nouns',
  'Vocative of Address': 'nouns',
  // Pronoun categories live in their own chapters.
  'Intensive Pronoun': 'pronouns',
  'Demonstrative / Possessive Genitive': 'demonstratives',
  // Conditional sentences are their own chapter, not a mood chapter.
  'First-Class Condition': 'conjunctions',
  'Second-Class Condition': 'conjunctions',
  'Fourth-Class Condition': 'conjunctions',
  'Subjunctive — Third-Class Condition (ἐάν)': 'conjunctions',
  // Adverbs are taught alongside conjunctions.
  'Adverb': 'conj-adv',
  'Coordinating Conjunction / Particle': 'conj-adv',
  'Subordinating Conjunction': 'conj-adv',
  'Preposition': 'prepositions',
  'Object of Preposition': 'prepositions',
}

// Name patterns, in order. First match wins, so the more specific rules come first.
const PATTERNS: [RegExp, GrammarChapter][] = [
  [/relative pronoun/i, 'relatives'],
  [/participle/i, 'participles'],
  [/infinitive/i, 'infinitives'],
  [/subjunctive/i, 'subjunctives'],
  [/imperative/i, 'imperatives'],
  [/condition/i, 'conjunctions'],
  [/preposition/i, 'prepositions'],
  // Case functions — the Nouns chapter carries the Essential Syntax Categories for all four.
  [/genitive|dative|accusative|nominative|vocative|apposition|case function/i, 'nouns'],
  [/subject|direct object|indirect object|predicate/i, 'nouns'],
  // Tense/aspect categories belong to the Indicatives chapter.
  [/indicative|present|imperfect|future|aorist|perfect|pluperfect/i, 'indicatives'],
]

/**
 * The Grammar chapter that teaches this category, or null when nothing in the Grammar covers
 * it. A null is a legitimate answer — the menu simply omits the link rather than sending a
 * student to a chapter that does not discuss what they clicked.
 *
 * Greek-lemma-headed entries (γάρ, δέ, ἵνα …) are conjunction and particle glosses rather than
 * syntax categories; they go to the Conjunctions & Adverbs chapter.
 */
export function chapterForCategory(name: string): GrammarChapter | null {
  const direct = OVERRIDES[name]
  if (direct) return direct

  // A name beginning with a Greek letter is a particle/conjunction entry.
  if (/^[Ͱ-Ͽἀ-῿]/.test(name)) return 'conj-adv'

  for (const [re, chapter] of PATTERNS) {
    if (re.test(name)) return chapter
  }
  return null
}

/**
 * A deep link into the Grammar at that chapter, carrying the level the category is pitched at
 * so a beginner lands on the Beginning explanation and an intermediate category opens the
 * Intermediate one. MorphologyView reads both on mount.
 *
 * `level` is the WallaceCategory's own level — note the vocabulary differs by one letter
 * between the two systems ('beginner' there, 'beginning' in the Grammar).
 */
export function grammarHref(chapter: GrammarChapter, level: 'beginner' | 'intermediate'): string {
  const l = level === 'beginner' ? 'beginning' : 'intermediate'
  return `/grammar?chapter=${encodeURIComponent(chapter)}&level=${l}`
}
