// Worked constructs, to open the builder on something real rather than a blank form.
//
// Every one of these was checked against the New Testament before being listed, and the count is
// quoted so a wrong result is obvious rather than plausible. They are ordinary queries — clicking
// one loads it into the builder, where it can be edited, re-scoped or run against another corpus.

import type { ConstructQuery, ConstructTerm } from './construct-query'

export interface ConstructPreset {
  /**
   * Stable identity, and the key its translation is stored under. Explicit rather than derived
   * from the label or the position: rewording a label must not orphan its note's translation,
   * and these lists get reordered as the curation grows.
   */
  id: string
  label: string
  // What the construction is, in a sentence a student can act on.
  note: string
  // Roughly how many New Testament passages it finds, so an unexpected number stands out.
  approx: number
  query: Omit<ConstructQuery, 'corpus'>
}
export interface PresetGroup {
  /** Stable key for the heading's translation — see ConstructPreset.id. */
  id: string
  heading: string
  presets: ConstructPreset[]
}

const subj = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['verb'], mood: ['subjunctive'], ...extra } })
const word = (lemma: string): ConstructTerm => ({ features: {}, lemma })
const verb = (lemma: string): ConstructTerm => ({ features: { pos: ['verb'] }, lemma })
const agreeing = (pos: string, withTerm: number): ConstructTerm =>
  ({ features: { pos: [pos] }, agreeWith: withTerm, agreeOn: ['case', 'number', 'gender'] })

const base = { ordered: true, sameVerse: false }

// The subjunctive's uses, as the grammars divide them. Two are missing on purpose: the
// DELIBERATIVE subjunctive ("what shall we say?") is defined by being a question, which no
// morphological search can see, and the subjunctive after verbs of fearing is rare enough in the
// New Testament to be worth reading rather than searching.
const SUBJUNCTIVE: ConstructPreset[] = [
  {
    id: 'purpose-ina-subjunctive',
    label: 'Purpose — ἵνα + subjunctive',
    note: 'The commonest purpose clause: “in order that…”. Also covers result and content clauses, which share the form.',
    approx: 546,
    query: { ...base, within: 5, terms: [word('ἵνα'), subj()] },
  },
  {
    id: 'purpose-opos-subjunctive',
    label: 'Purpose — ὅπως + subjunctive',
    note: 'The less common purpose conjunction. Worth comparing with ἵνα for what each writer prefers.',
    approx: 47,
    query: { ...base, within: 5, terms: [word('ὅπως'), subj()] },
  },
  {
    id: 'emphatic-denial-oy-me-aorist-subjunctive',
    label: 'Emphatic denial — οὐ μή + aorist subjunctive',
    note: 'The strongest negation in Greek: “will certainly not”. Matt 5:18, 5:20.',
    approx: 73,
    query: { ...base, within: 3, terms: [word('οὐ'), word('μή'), subj({ tense: ['aorist'] })] },
  },
  {
    id: 'prohibition-me-aorist-subjunctive',
    label: 'Prohibition — μή + aorist subjunctive',
    note: 'A command not to START an action, as against μή + present imperative (stop doing it). Matt 1:20 μὴ φοβηθῇς.',
    approx: 99,
    query: { ...base, within: 3, terms: [word('μή'), subj({ tense: ['aorist'], person: ['2 person'] })] },
  },
  {
    id: 'third-class-condition-ean-subjunctive',
    label: 'Third-class condition — ἐάν + subjunctive',
    note: 'The “if, and it may well be” condition — a live possibility, as against the first class.',
    approx: 297,
    query: { ...base, within: 5, terms: [word('ἐάν'), subj()] },
  },
  {
    id: 'indefinite-temporal-otan-subjunctive',
    label: 'Indefinite temporal — ὅταν + subjunctive',
    note: '“Whenever”: the time is left open. Matt 5:11, 6:2.',
    approx: 109,
    query: { ...base, within: 5, terms: [word('ὅταν'), subj()] },
  },
  {
    id: 'indefinite-relative-os-an-subjunctive',
    label: 'Indefinite relative — ὅς ἄν + subjunctive',
    note: '“Whoever”: the person is left open. Matt 5:19, 5:21.',
    approx: 54,
    query: { ...base, within: 4, terms: [word('ὅς'), word('ἄν'), subj()] },
  },
  {
    id: 'hortatory-first-person-plural-subjunctive',
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
    id: 'attributive-article-adjective-noun',
    label: 'Attributive — article, adjective, noun',
    note: 'The adjective modifies the noun: τὰ καλὰ ἔργα, “the good works”. All three agree in case, number and gender.',
    approx: 409,
    query: {
      ...base, within: 3,
      terms: [{ features: { pos: ['article'] } }, agreeing('adjective', 0), agreeing('noun', 0)],
    },
  },
  {
    id: 'predicate-article-noun-adjective-with-no-second-article',
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
    id: 'substantival-article-adjective',
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
    id: 'genitive-absolute',
    label: 'Genitive absolute',
    note: 'A genitive participle with its own genitive subject, grammatically detached from the main clause: Τοῦ δὲ Ἰησοῦ γεννηθέντος (Matt 2:1).',
    approx: 294,
    query: { ...base, ordered: false, within: 3, terms: [
      nounIn('genitive'),
      { ...ptcp({ case: ['genitive'] }), agreeWith: 0, agreeOn: ['number', 'gender'] },
    ] },
  },
  {
    id: 'substantival-article-participle',
    label: 'Substantival — article + participle',
    note: 'The participle standing as a noun: ὁ πιστεύων, “the one who believes”.',
    approx: 1227,
    query: { ...base, within: 1, terms: [
      { features: { pos: ['article'] } },
      { ...ptcp(), agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
    ] },
  },
  {
    id: 'attributive-article-participle-noun',
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
    id: 'adverbial-finite-verb-then-anarthrous-participle',
    label: 'Adverbial — finite verb then anarthrous participle',
    note: 'The circumstantial participle, telling how or when the main verb happened. The forbidden article is what does the work: an ARTICULAR participle is attributive or substantival, an anarthrous one adverbial. Only finds participles AFTER their verb — a search can’t forbid an article before the first matched word.',
    approx: 1478,
    query: { ...base, within: 5, terms: [
      { features: { pos: ['verb'], mood: ['indicative'] } },
      ptcp(),
      { features: { pos: ['article'] }, negate: true },
    ] },
  },
  {
    id: 'predicate-article-noun-participle-with-no-second-article',
    label: 'Predicate — article, noun, participle with no second article',
    note: 'The participle asserting something of the noun rather than modifying it — the same test as the predicate adjective, and the same forbidden article.',
    approx: 355,
    query: { ...base, within: 4, terms: [
      { features: { pos: ['article'] } },
      agreeing('noun', 0),
      { ...ptcp(), agreeWith: 0, agreeOn: ['case', 'number', 'gender'] },
      { features: { pos: ['article'] }, negate: true },
    ] },
  },
  {
    id: 'complementary-payomai-participle',
    label: 'Complementary — παύομαι + participle',
    note: 'The participle completing the verb’s idea: ἐπαύσατο λαλῶν, “he stopped speaking” (Luke 5:4). Note ἄρχομαι takes an INFINITIVE instead (ἤρξατο λέγειν), which is why it isn’t here — searching it returns nothing, as it should.',
    approx: 10,
    query: { ...base, within: 4, terms: [verb('παύω'), ptcp()] },
  },
  {
    id: 'periphrastic-eimi-participle',
    label: 'Periphrastic — εἰμί + participle',
    note: 'A form of εἰμί with a participle doing the work of one verb: ἦν διδάσκων, “he was teaching”. Proximity can’t tell a true periphrastic from an εἰμί that merely happens to be near a participle, so read before concluding.',
    approx: 477,
    query: { ...base, within: 4, terms: [word('εἰμί'), ptcp()] },
  },
  {
    id: 'aorist-participle-before-its-main-verb',
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
  { id: 'purpose-toy-infinitive', label: 'Purpose — τοῦ + infinitive', note: 'The bare genitive article with an infinitive, usually purpose.', approx: 167,
    query: { ...base, within: 2, terms: [{ features: { pos: ['article'], case: ['genitive'] } }, infinitive] } },
  { id: 'purpose-or-result-eis-to-infinitive', label: 'Purpose or result — εἰς τό + infinitive', note: '“in order to”, and sometimes “with the result that”.', approx: 115,
    query: { ...base, within: 3, terms: [word('εἰς'), infinitive] } },
  { id: 'contemporaneous-time-en-to-infinitive', label: 'Contemporaneous time — ἐν τῷ + infinitive', note: '“while”, “as” — action at the same time as the main verb.', approx: 96,
    query: { ...base, within: 3, terms: [word('ἐν'), infinitive] } },
  { id: 'cause-dia-to-infinitive', label: 'Cause — διά τό + infinitive', note: '“because”. The accusative article marks it off from other uses of διά.', approx: 36,
    query: { ...base, within: 3, terms: [word('διά'), infinitive] } },
  { id: 'subsequent-time-meta-to-infinitive', label: 'Subsequent time — μετά τό + infinitive', note: '“after”.', approx: 27,
    query: { ...base, within: 3, terms: [word('μετά'), infinitive] } },
  { id: 'antecedent-time-pro-toy-infinitive', label: 'Antecedent time — πρὸ τοῦ + infinitive', note: '“before”.', approx: 10,
    query: { ...base, within: 3, terms: [word('πρό'), infinitive] } },
]

// Prepositions whose sense turns on the case they govern — the reason case matters for reading
// rather than just for parsing.
const PREPOSITION: ConstructPreset[] = [
  { id: 'dia-genitive-through', label: 'διά + genitive — “through”', note: 'Agency or means. Contrast the accusative below.', approx: 253,
    query: { ...base, within: 2, terms: [word('διά'), nounIn('genitive')] } },
  { id: 'dia-accusative-because-of', label: 'διά + accusative — “because of”', note: 'Cause. The same preposition, the opposite question.', approx: 99,
    query: { ...base, within: 2, terms: [word('διά'), nounIn('accusative')] } },
  { id: 'kata-genitive-against', label: 'κατά + genitive — “against”', note: 'Opposition, or motion down from.', approx: 46,
    query: { ...base, within: 2, terms: [word('κατά'), nounIn('genitive')] } },
  { id: 'kata-accusative-according-to', label: 'κατά + accusative — “according to”', note: 'Standard or norm.', approx: 282,
    query: { ...base, within: 2, terms: [word('κατά'), nounIn('accusative')] } },
  { id: 'meta-genitive-with', label: 'μετά + genitive — “with”', note: 'Association.', approx: 159,
    query: { ...base, within: 2, terms: [word('μετά'), nounIn('genitive')] } },
  { id: 'meta-accusative-after', label: 'μετά + accusative — “after”', note: 'Time. The case does all the work.', approx: 35,
    query: { ...base, within: 2, terms: [word('μετά'), nounIn('accusative')] } },
  { id: 'yper-genitive-on-behalf-of', label: 'ὑπέρ + genitive — “on behalf of”', note: 'Representation.', approx: 37,
    query: { ...base, within: 2, terms: [word('ὑπέρ'), nounIn('genitive')] } },
  { id: 'yper-accusative-above-beyond', label: 'ὑπέρ + accusative — “above, beyond”', note: 'Surpassing.', approx: 12,
    query: { ...base, within: 2, terms: [word('ὑπέρ'), nounIn('accusative')] } },
  { id: 'en-dative-in-by', label: 'ἐν + dative — “in, by”', note: 'The commonest preposition in the New Testament, and dative only.', approx: 1525,
    query: { ...base, within: 2, terms: [word('ἐν'), nounIn('dative')] } },
  { id: 'eis-accusative-into-for', label: 'εἰς + accusative — “into, for”', note: 'Accusative only — worth seeing beside ἐν.', approx: 1186,
    query: { ...base, within: 2, terms: [word('εἰς'), nounIn('accusative')] } },
]


const accNoun: ConstructTerm = { features: { pos: ['noun'], case: ['accusative'] } }
const accPron: ConstructTerm = { features: { pos: ['pronoun'], case: ['accusative'] } }

// Double accusatives. Two accusatives standing near each other prove nothing — an article and its
// noun are two accusatives, and 1,360 New Testament verses have a pair within four words. What
// makes a double accusative is the VERB: only certain verbs govern two objects. So each of these is
// anchored on such a verb, which takes the count from 1,360 to single or low double figures.
//
// Still a strong lead rather than a guarantee: the verb and two accusatives can be near each other
// without both belonging to it (Matt 7:29 has διδάσκων αὐτούς with ἐξουσίαν belonging to ἔχων).
const DOUBLE_ACC: ConstructPreset[] = [
  {
    id: 'object-complement-kaleo-two-accusatives',
    label: 'Object-complement — καλέω + two accusatives',
    note: 'Calling something something: καλέσεις τὸ ὄνομα αὐτοῦ Ἰησοῦν (Matt 1:21). The second accusative renames the first.',
    approx: 13,
    query: { ...base, within: 6, terms: [verb('καλέω'), accNoun, accNoun] },
  },
  {
    id: 'object-complement-poieo-two-accusatives',
    label: 'Object-complement — ποιέω + two accusatives',
    note: 'Making something something: “make his paths straight” (Matt 3:3). The complement states what the object becomes.',
    approx: 33,
    query: { ...base, within: 6, terms: [verb('ποιέω'), accNoun, accNoun] },
  },
  {
    id: 'person-and-thing-didasko',
    label: 'Person and thing — διδάσκω',
    note: 'Teaching someone something. The person is usually a pronoun, the thing a noun, which is how this is framed.',
    approx: 8,
    query: { ...base, within: 6, terms: [verb('διδάσκω'), accPron, accNoun] },
  },
  {
    id: 'person-and-thing-erotao',
    label: 'Person and thing — ἐρωτάω',
    note: 'Asking someone something: ἐρωτήσω ὑμᾶς κἀγὼ λόγον ἕνα (Matt 21:24).',
    approx: 10,
    query: { ...base, within: 6, terms: [verb('ἐρωτάω'), accPron, accNoun] },
  },
  {
    id: 'person-and-thing-endyo',
    label: 'Person and thing — ἐνδύω',
    note: 'Clothing someone with something: ἐνέδυσαν αὐτὸν τὰ ἱμάτια αὐτοῦ (Matt 27:31).',
    approx: 3,
    query: { ...base, within: 6, terms: [verb('ἐνδύω'), accPron, accNoun] },
  },
]

const OTHER: ConstructPreset[] = [
  {
    id: 'granville-sharp-shape-article-noun-kai-noun',
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
    id: 'first-class-ei-indicative',
    label: 'First class — εἰ + indicative',
    note: 'Assumed true for the sake of the argument: “if — and let’s say it is”. Not a statement that the condition IS true, which is the usual mistake.',
    approx: 270,
    query: { ...base, within: 4, terms: [word('εἰ'), indic()] },
  },
  {
    id: 'second-class-ei-past-indicative-with-an',
    label: 'Second class — εἰ + past indicative, with ἄν',
    note: 'Contrary to fact: “if it were… (but it isn’t)”. A secondary tense in the protasis and ἄν in the apodosis — the ἄν is what separates it from the first class.',
    approx: 33,
    query: { ...base, within: 12, terms: [
      word('εἰ'), indic({ tense: ['imperfect', 'aorist', 'pluperfect'] }), word('ἄν'),
    ] },
  },
  {
    id: 'third-class-ean-subjunctive',
    label: 'Third class — ἐάν + subjunctive',
    note: 'A live possibility: “if, and it may well happen”. The commonest condition in the New Testament.',
    approx: 297,
    query: { ...base, within: 5, terms: [word('ἐάν'), subj()] },
  },
]

const RESULT: ConstructPreset[] = [
  {
    id: 'result-oste-infinitive',
    label: 'Result — ὥστε + infinitive',
    note: 'The usual result clause: “so that”, “with the result that”. Naturally consequent rather than actual.',
    approx: 42,
    query: { ...base, within: 4, terms: [word('ὥστε'), infinitive] },
  },
  {
    id: 'actual-result-oste-indicative',
    label: 'Actual result — ὥστε + indicative',
    note: 'The rarer construction, stating a result that in fact happened.',
    approx: 11,
    query: { ...base, within: 4, terms: [word('ὥστε'), indic()] },
  },
  {
    id: 'correlation-men-de',
    label: 'Correlation — μέν … δέ',
    note: '“On the one hand… on the other”. The pair sets two things against each other; μέν alone often just marks emphasis.',
    approx: 112,
    query: { ...base, within: 12, terms: [word('μέν'), word('δέ')] },
  },
  {
    id: 'comparison-comparative-adjective-genitive',
    label: 'Comparison — comparative adjective + genitive',
    note: 'The genitive of comparison: “greater THAN…”, without ἤ. Compare the same idea expressed with ἤ.',
    approx: 55,
    query: { ...base, within: 3, terms: [
      { features: { pos: ['adjective'], degree: ['comparative'] } },
      { features: { pos: ['noun'], case: ['genitive'] } },
    ] },
  },
  {
    id: 'attributive-participle-second-position',
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


const nomNoun: ConstructTerm = { features: { pos: ['noun'], case: ['nominative'] } }
const article: ConstructTerm = { features: { pos: ['article'] } }

// The predicate nominative — the third of the predicate constructions, alongside the predicate
// adjective (under the adjective) and the predicate accusative (the object-complement double
// accusatives). Its interest is which of two nominatives is the SUBJECT, which is what the article
// settles and what Colwell's rule is about.
const PREDICATE_NOM: ConstructPreset[] = [
  {
    id: 'predicate-nominative-nominative-eimi-nominative',
    label: 'Predicate nominative — nominative, εἰμί, nominative',
    note: 'Two nominatives joined by “to be”: ὁ λύχνος … ἐστιν ὁ ὀφθαλμός. Both are nominative, so word order and the article — not case — tell you which is the subject.',
    approx: 172,
    query: { ...base, within: 5, terms: [nomNoun, verb('εἰμί'), nomNoun] },
  },
  {
    id: 'colwell-shape-nominative-eimi-article-nominative',
    label: 'Colwell shape — nominative, εἰμί, article, nominative',
    note: 'A preverbal predicate nominative with the articular subject after the verb: κύριός ἐστιν ὁ υἱὸς τοῦ ἀνθρώπου (Mark 2:28), ὁ ἀγρός ἐστιν ὁ κόσμος (Matt 13:38). NOTE the search cannot require the FIRST noun to be anarthrous — a search forbids a word between two others, never before them — so check each hit before treating it as Colwell’s rule.',
    approx: 31,
    query: { ...base, within: 4, terms: [nomNoun, verb('εἰμί'), article, nomNoun] },
  },
  {
    id: 'predicate-nominative-with-ginomai',
    label: 'Predicate nominative with γίνομαι',
    note: '“Become” takes a predicate nominative too, and is worth seeing beside εἰμί.',
    approx: 29,
    query: { ...base, within: 5, terms: [verb('γίνομαι'), nomNoun, nomNoun] },
  },
]


// Deponency and the second aorist are NOT searchable as categories: the parsing trees the index is
// built from record voice as active/middle/passive and tense simply as "aorist". The reader's own
// chapter files do carry `Deponent` (1,685 words) and `2nd Aorist` (5,111), so a search for them
// waits on re-sourcing the New Testament index from those files.
//
// What can be done meanwhile is to anchor on verbs that EXHIBIT each, so a student sees the forms
// even though the category can't be queried.
const VERB_FORMS: ConstructPreset[] = [
  {
    id: 'second-aorist-every-aorist-of-lambano',
    label: 'Second aorist — every aorist of λαμβάνω',
    note: 'ἔλαβον, ἔλαβεν, λαβών: a second aorist takes the aorist endings onto a changed stem, with no -σα. The category itself isn’t searchable yet — see the note on this group.',
    approx: 175,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], tense: ['aorist'] }, lemma: 'λαμβάνω' }] },
  },
  {
    id: 'second-aorist-every-aorist-of-orao',
    label: 'Second aorist — every aorist of ὁράω',
    note: 'εἶδον, ἰδών — a suppletive second aorist, formed from a different root altogether.',
    approx: 549,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], tense: ['aorist'] }, lemma: 'ὁράω' }] },
  },
  {
    id: 'second-aorist-every-aorist-of-lego',
    label: 'Second aorist — every aorist of λέγω',
    note: 'εἶπον, εἰπών — the commonest suppletive aorist in the New Testament.',
    approx: 860,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], tense: ['aorist'] }, lemma: 'λέγω' }] },
  },
  {
    id: 'deponent-middle-and-passive-forms-of-erchomai',
    label: 'Deponent — middle and passive forms of ἔρχομαι',
    note: 'Middle or passive in form, active in meaning. The index records the FORM, so these come back as middle or passive; nothing marks them deponent.',
    approx: 239,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], voice: ['middle', 'passive', 'middlepassive'] }, lemma: 'ἔρχομαι' }] },
  },
  {
    id: 'deponent-middle-and-passive-forms-of-apokrinomai',
    label: 'Deponent — middle and passive forms of ἀποκρίνομαι',
    note: 'ἀπεκρίθη is passive in form and plainly active in sense — the clearest demonstration of why deponency is worth naming.',
    approx: 231,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], voice: ['middle', 'passive', 'middlepassive'] }, lemma: 'ἀποκρίνομαι' }] },
  },
  {
    id: 'deponent-middle-and-passive-forms-of-ginomai',
    label: 'Deponent — middle and passive forms of γίνομαι',
    note: 'The commonest deponent in the New Testament.',
    approx: 567,
    query: { ...base, within: 4, terms: [{ features: { pos: ['verb'], voice: ['middle', 'passive', 'middlepassive'] }, lemma: 'γίνομαι' }] },
  },
]

export const CONSTRUCT_PRESETS: PresetGroup[] = [
  { id: 'uses-of-the-subjunctive', heading: 'Uses of the subjunctive', presets: SUBJUNCTIVE },
  { id: 'uses-of-the-adjective', heading: 'Uses of the adjective', presets: ADJECTIVE },
  { id: 'uses-of-the-participle', heading: 'Uses of the participle', presets: PARTICIPLE },
  { id: 'the-articular-infinitive', heading: 'The articular infinitive', presets: INFINITIVE },
  { id: 'prepositions-and-their-cases', heading: 'Prepositions and their cases', presets: PREPOSITION },
  { id: 'the-predicate-nominative', heading: 'The predicate nominative', presets: PREDICATE_NOM },
  { id: 'double-accusatives', heading: 'Double accusatives', presets: DOUBLE_ACC },
  { id: 'conditional-sentences', heading: 'Conditional sentences', presets: CONDITIONAL },
  { id: 'result-correlation-and-comparison', heading: 'Result, correlation and comparison', presets: RESULT },
  { id: 'verb-forms-second-aorist-and-deponents', heading: 'Verb forms — second aorist and deponents', presets: VERB_FORMS },
  { id: 'other-constructions', heading: 'Other constructions', presets: OTHER },
]
