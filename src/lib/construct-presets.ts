// Worked constructs, to open the builder on something real rather than a blank form.
//
// Every one of these was checked against the New Testament before being listed, and the count is
// quoted so a wrong result is obvious rather than plausible. They are ordinary queries — clicking
// one loads it into the builder, where it can be edited, re-scoped or run against another corpus.

import type { ConstructQuery, ConstructTerm } from './construct-query'

export interface ConstructPreset {
  label: string
  // What the construction is, in a sentence a student can act on.
  note: string
  // Roughly how many New Testament passages it finds, so an unexpected number stands out.
  approx: number
  query: Omit<ConstructQuery, 'corpus'>
}
export interface PresetGroup { heading: string; presets: ConstructPreset[] }

const subj = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['verb'], mood: ['subjunctive'], ...extra } })
const word = (lemma: string): ConstructTerm => ({ features: {}, lemma })
const agreeing = (pos: string, withTerm: number): ConstructTerm =>
  ({ features: { pos: [pos] }, agreeWith: withTerm, agreeOn: ['case', 'number', 'gender'] })

const base = { ordered: true, sameVerse: false }

// The subjunctive's uses, as the grammars divide them. Two are missing on purpose: the
// DELIBERATIVE subjunctive ("what shall we say?") is defined by being a question, which no
// morphological search can see, and the subjunctive after verbs of fearing is rare enough in the
// New Testament to be worth reading rather than searching.
const SUBJUNCTIVE: ConstructPreset[] = [
  {
    label: 'Purpose — ἵνα + subjunctive',
    note: 'The commonest purpose clause: “in order that…”. Also covers result and content clauses, which share the form.',
    approx: 546,
    query: { ...base, within: 5, terms: [word('ἵνα'), subj()] },
  },
  {
    label: 'Purpose — ὅπως + subjunctive',
    note: 'The less common purpose conjunction. Worth comparing with ἵνα for what each writer prefers.',
    approx: 47,
    query: { ...base, within: 5, terms: [word('ὅπως'), subj()] },
  },
  {
    label: 'Emphatic denial — οὐ μή + aorist subjunctive',
    note: 'The strongest negation in Greek: “will certainly not”. Matt 5:18, 5:20.',
    approx: 73,
    query: { ...base, within: 3, terms: [word('οὐ'), word('μή'), subj({ tense: ['aorist'] })] },
  },
  {
    label: 'Prohibition — μή + aorist subjunctive',
    note: 'A command not to START an action, as against μή + present imperative (stop doing it). Matt 1:20 μὴ φοβηθῇς.',
    approx: 99,
    query: { ...base, within: 3, terms: [word('μή'), subj({ tense: ['aorist'], person: ['2 person'] })] },
  },
  {
    label: 'Third-class condition — ἐάν + subjunctive',
    note: 'The “if, and it may well be” condition — a live possibility, as against the first class.',
    approx: 297,
    query: { ...base, within: 5, terms: [word('ἐάν'), subj()] },
  },
  {
    label: 'Indefinite temporal — ὅταν + subjunctive',
    note: '“Whenever”: the time is left open. Matt 5:11, 6:2.',
    approx: 109,
    query: { ...base, within: 5, terms: [word('ὅταν'), subj()] },
  },
  {
    label: 'Indefinite relative — ὅς ἄν + subjunctive',
    note: '“Whoever”: the person is left open. Matt 5:19, 5:21.',
    approx: 54,
    query: { ...base, within: 4, terms: [word('ὅς'), word('ἄν'), subj()] },
  },
  {
    label: 'Hortatory — first person plural subjunctive',
    note: '“Let us…”, the speaker urging a group he belongs to. One word, so distance and order don’t apply.',
    approx: 152,
    query: { ...base, within: 4, terms: [subj({ person: ['1 person'], number: ['plural'] })] },
  },
]

// The three uses of the adjective. Position is what distinguishes them, which is exactly what a
// construct search can see — with one honest limitation, noted on the substantival preset.
const ADJECTIVE: ConstructPreset[] = [
  {
    label: 'Attributive — article, adjective, noun',
    note: 'The adjective modifies the noun: τὰ καλὰ ἔργα, “the good works”. All three agree in case, number and gender.',
    approx: 409,
    query: {
      ...base, within: 3,
      terms: [{ features: { pos: ['article'] } }, agreeing('adjective', 0), agreeing('noun', 0)],
    },
  },
  {
    label: 'Predicate — article, noun, adjective with no second article',
    note: 'The adjective asserts something of the noun: ὁ ἄνθρωπος ἀγαθός, “the man is good”. The forbidden article is what rules out the second attributive position (ὁ ἄνθρωπος ὁ ἀγαθός).',
    approx: 232,
    query: {
      ...base, within: 4,
      terms: [
        { features: { pos: ['article'] } },
        agreeing('noun', 0),
        agreeing('adjective', 0),
        { features: { pos: ['article'] }, negate: true },
      ],
    },
  },
  {
    label: 'Substantival — article + adjective',
    note: 'The adjective standing as a noun: οἱ ἅγιοι, “the saints”. NOTE this also catches the start of an attributive phrase, since a search can forbid a word BETWEEN two others but not after them — compare the attributive preset to see which is which.',
    approx: 1521,
    query: { ...base, within: 1, terms: [{ features: { pos: ['article'] } }, agreeing('adjective', 0)] },
  },
]


const ptcp = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['verb'], mood: ['participle'], ...extra } })
const infinitive: ConstructTerm = { features: { pos: ['verb'], mood: ['infinitive'] } }
const nounIn = (kase: string): ConstructTerm => ({ features: { pos: ['noun'], case: [kase] } })

// The participle's uses. Position and agreement carry most of the distinctions; the purely
// adverbial (circumstantial) participle is left out, since what makes it adverbial is its relation
// to the main clause rather than anything a morphological search can see.
const PARTICIPLE: ConstructPreset[] = [
  {
    label: 'Genitive absolute',
    note: 'A genitive participle with its own genitive subject, grammatically detached from the main clause: Τοῦ δὲ Ἰησοῦ γεννηθέντος (Matt 2:1).',
    approx: 294,
    query: { ...base, ordered: false, within: 3, terms: [
      nounIn('genitive'),
      { ...ptcp({ case: ['genitive'] }), agreeWith: 0, agreeOn: ['number', 'gender'] },
    ] },
  },
  {
    label: 'Substantival — article + participle',
    note: 'The participle standing as a noun: ὁ πιστεύων, “the one who believes”.',
    approx: 1227,
    query: { ...base, within: 1, terms: [
      { features: { pos: ['article'] } },
      { ...ptcp(), agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
    ] },
  },
  {
    label: 'Attributive — article, participle, noun',
    note: 'The participle modifying a noun, like an attributive adjective: τὸ γεγεννημένον παιδίον.',
    approx: 128,
    query: { ...base, within: 3, terms: [
      { features: { pos: ['article'] } },
      { ...ptcp(), agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
      agreeing('noun', 0),
    ] },
  },
  {
    label: 'Periphrastic — εἰμί + participle',
    note: 'A form of εἰμί with a participle doing the work of one verb: ἦν διδάσκων, “he was teaching”. Proximity can’t tell a true periphrastic from an εἰμί that merely happens to be near a participle, so read before concluding.',
    approx: 477,
    query: { ...base, within: 4, terms: [word('εἰμί'), ptcp()] },
  },
  {
    label: 'Aorist participle before its main verb',
    note: 'The classic antecedent action: “having done X, he did Y”. Nearness isn’t dependence, so some hits will be a participle belonging to another clause.',
    approx: 1217,
    query: { ...base, within: 5, terms: [
      ptcp({ tense: ['aorist'] }),
      { features: { pos: ['verb'], mood: ['indicative'] } },
    ] },
  },
]

// The articular infinitive. The preposition governing the article is what fixes the sense, so each
// of these is a different construction rather than a different shade of one.
const INFINITIVE: ConstructPreset[] = [
  { label: 'Purpose — τοῦ + infinitive', note: 'The bare genitive article with an infinitive, usually purpose.', approx: 167,
    query: { ...base, within: 2, terms: [{ features: { pos: ['article'], case: ['genitive'] } }, infinitive] } },
  { label: 'Purpose or result — εἰς τό + infinitive', note: '“in order to”, and sometimes “with the result that”.', approx: 115,
    query: { ...base, within: 3, terms: [word('εἰς'), infinitive] } },
  { label: 'Contemporaneous time — ἐν τῷ + infinitive', note: '“while”, “as” — action at the same time as the main verb.', approx: 96,
    query: { ...base, within: 3, terms: [word('ἐν'), infinitive] } },
  { label: 'Cause — διά τό + infinitive', note: '“because”. The accusative article marks it off from other uses of διά.', approx: 36,
    query: { ...base, within: 3, terms: [word('διά'), infinitive] } },
  { label: 'Subsequent time — μετά τό + infinitive', note: '“after”.', approx: 27,
    query: { ...base, within: 3, terms: [word('μετά'), infinitive] } },
  { label: 'Antecedent time — πρὸ τοῦ + infinitive', note: '“before”.', approx: 10,
    query: { ...base, within: 3, terms: [word('πρό'), infinitive] } },
]

// Prepositions whose sense turns on the case they govern — the reason case matters for reading
// rather than just for parsing.
const PREPOSITION: ConstructPreset[] = [
  { label: 'διά + genitive — “through”', note: 'Agency or means. Contrast the accusative below.', approx: 253,
    query: { ...base, within: 2, terms: [word('διά'), nounIn('genitive')] } },
  { label: 'διά + accusative — “because of”', note: 'Cause. The same preposition, the opposite question.', approx: 99,
    query: { ...base, within: 2, terms: [word('διά'), nounIn('accusative')] } },
  { label: 'κατά + genitive — “against”', note: 'Opposition, or motion down from.', approx: 46,
    query: { ...base, within: 2, terms: [word('κατά'), nounIn('genitive')] } },
  { label: 'κατά + accusative — “according to”', note: 'Standard or norm.', approx: 282,
    query: { ...base, within: 2, terms: [word('κατά'), nounIn('accusative')] } },
  { label: 'μετά + genitive — “with”', note: 'Association.', approx: 159,
    query: { ...base, within: 2, terms: [word('μετά'), nounIn('genitive')] } },
  { label: 'μετά + accusative — “after”', note: 'Time. The case does all the work.', approx: 35,
    query: { ...base, within: 2, terms: [word('μετά'), nounIn('accusative')] } },
  { label: 'ὑπέρ + genitive — “on behalf of”', note: 'Representation.', approx: 37,
    query: { ...base, within: 2, terms: [word('ὑπέρ'), nounIn('genitive')] } },
  { label: 'ὑπέρ + accusative — “above, beyond”', note: 'Surpassing.', approx: 12,
    query: { ...base, within: 2, terms: [word('ὑπέρ'), nounIn('accusative')] } },
  { label: 'ἐν + dative — “in, by”', note: 'The commonest preposition in the New Testament, and dative only.', approx: 1525,
    query: { ...base, within: 2, terms: [word('ἐν'), nounIn('dative')] } },
  { label: 'εἰς + accusative — “into, for”', note: 'Accusative only — worth seeing beside ἐν.', approx: 1186,
    query: { ...base, within: 2, terms: [word('εἰς'), nounIn('accusative')] } },
]


const accNoun: ConstructTerm = { features: { pos: ['noun'], case: ['accusative'] } }
const accPron: ConstructTerm = { features: { pos: ['pronoun'], case: ['accusative'] } }
const verb = (lemma: string): ConstructTerm => ({ features: { pos: ['verb'] }, lemma })

// Double accusatives. Two accusatives standing near each other prove nothing — an article and its
// noun are two accusatives, and 1,360 New Testament verses have a pair within four words. What
// makes a double accusative is the VERB: only certain verbs govern two objects. So each of these is
// anchored on such a verb, which takes the count from 1,360 to single or low double figures.
//
// Still a strong lead rather than a guarantee: the verb and two accusatives can be near each other
// without both belonging to it (Matt 7:29 has διδάσκων αὐτούς with ἐξουσίαν belonging to ἔχων).
const DOUBLE_ACC: ConstructPreset[] = [
  {
    label: 'Object-complement — καλέω + two accusatives',
    note: 'Calling something something: καλέσεις τὸ ὄνομα αὐτοῦ Ἰησοῦν (Matt 1:21). The second accusative renames the first.',
    approx: 13,
    query: { ...base, within: 6, terms: [verb('καλέω'), accNoun, accNoun] },
  },
  {
    label: 'Object-complement — ποιέω + two accusatives',
    note: 'Making something something: “make his paths straight” (Matt 3:3). The complement states what the object becomes.',
    approx: 33,
    query: { ...base, within: 6, terms: [verb('ποιέω'), accNoun, accNoun] },
  },
  {
    label: 'Person and thing — διδάσκω',
    note: 'Teaching someone something. The person is usually a pronoun, the thing a noun, which is how this is framed.',
    approx: 8,
    query: { ...base, within: 6, terms: [verb('διδάσκω'), accPron, accNoun] },
  },
  {
    label: 'Person and thing — ἐρωτάω',
    note: 'Asking someone something: ἐρωτήσω ὑμᾶς κἀγὼ λόγον ἕνα (Matt 21:24).',
    approx: 10,
    query: { ...base, within: 6, terms: [verb('ἐρωτάω'), accPron, accNoun] },
  },
  {
    label: 'Person and thing — ἐνδύω',
    note: 'Clothing someone with something: ἐνέδυσαν αὐτὸν τὰ ἱμάτια αὐτοῦ (Matt 27:31).',
    approx: 3,
    query: { ...base, within: 6, terms: [verb('ἐνδύω'), accPron, accNoun] },
  },
]

const OTHER: ConstructPreset[] = [
  {
    label: 'Granville Sharp shape — article, noun, καί, noun',
    note: 'Two nouns joined by καί under ONE article, agreeing — the shape Sharp’s rule is about. The rule itself applies only to singular, personal, non-proper nouns, so add Singular and read before concluding: most of these hits will not qualify.',
    approx: 159,
    query: { ...base, within: 5, terms: [
      { features: { pos: ['article'] } },
      agreeing('noun', 0),
      word('καί'),
      agreeing('noun', 0),
      { features: { pos: ['article'] }, negate: true },
    ] },
  },
]


const indic = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['verb'], mood: ['indicative'], ...extra } })

// The conditional sentences, by class. The protasis is what a search can see: the conjunction plus
// the mood (and, for the second class, a secondary tense with ἄν in the apodosis). The FOURTH class
// (εἰ + optative) is left out because the New Testament has no complete example of it.
const CONDITIONAL: ConstructPreset[] = [
  {
    label: 'First class — εἰ + indicative',
    note: 'Assumed true for the sake of the argument: “if — and let’s say it is”. Not a statement that the condition IS true, which is the usual mistake.',
    approx: 270,
    query: { ...base, within: 4, terms: [word('εἰ'), indic()] },
  },
  {
    label: 'Second class — εἰ + past indicative, with ἄν',
    note: 'Contrary to fact: “if it were… (but it isn’t)”. A secondary tense in the protasis and ἄν in the apodosis — the ἄν is what separates it from the first class.',
    approx: 33,
    query: { ...base, within: 12, terms: [
      word('εἰ'), indic({ tense: ['imperfect', 'aorist', 'pluperfect'] }), word('ἄν'),
    ] },
  },
  {
    label: 'Third class — ἐάν + subjunctive',
    note: 'A live possibility: “if, and it may well happen”. The commonest condition in the New Testament.',
    approx: 297,
    query: { ...base, within: 5, terms: [word('ἐάν'), subj()] },
  },
]

const RESULT: ConstructPreset[] = [
  {
    label: 'Result — ὥστε + infinitive',
    note: 'The usual result clause: “so that”, “with the result that”. Naturally consequent rather than actual.',
    approx: 42,
    query: { ...base, within: 4, terms: [word('ὥστε'), infinitive] },
  },
  {
    label: 'Actual result — ὥστε + indicative',
    note: 'The rarer construction, stating a result that in fact happened.',
    approx: 11,
    query: { ...base, within: 4, terms: [word('ὥστε'), indic()] },
  },
  {
    label: 'Correlation — μέν … δέ',
    note: '“On the one hand… on the other”. The pair sets two things against each other; μέν alone often just marks emphasis.',
    approx: 112,
    query: { ...base, within: 12, terms: [word('μέν'), word('δέ')] },
  },
  {
    label: 'Comparison — comparative adjective + genitive',
    note: 'The genitive of comparison: “greater THAN…”, without ἤ. Compare the same idea expressed with ἤ.',
    approx: 55,
    query: { ...base, within: 3, terms: [
      { features: { pos: ['adjective'], degree: ['comparative'] } },
      { features: { pos: ['noun'], case: ['genitive'] } },
    ] },
  },
  {
    label: 'Attributive participle, second position',
    note: 'Article, noun, article, participle — ὁ ἄνθρωπος ὁ σπείρων. The repeated article is what makes it attributive rather than predicate.',
    approx: 190,
    query: { ...base, within: 4, terms: [
      { features: { pos: ['article'] } },
      agreeing('noun', 0),
      { features: { pos: ['article'] }, agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
      { ...ptcp(), agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
    ] },
  },
]

export const CONSTRUCT_PRESETS: PresetGroup[] = [
  { heading: 'Uses of the subjunctive', presets: SUBJUNCTIVE },
  { heading: 'Uses of the adjective', presets: ADJECTIVE },
  { heading: 'Uses of the participle', presets: PARTICIPLE },
  { heading: 'The articular infinitive', presets: INFINITIVE },
  { heading: 'Prepositions and their cases', presets: PREPOSITION },
  { heading: 'Double accusatives', presets: DOUBLE_ACC },
  { heading: 'Conditional sentences', presets: CONDITIONAL },
  { heading: 'Result, correlation and comparison', presets: RESULT },
  { heading: 'Other constructions', presets: OTHER },
]
