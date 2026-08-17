// The instructor's "Essential Syntax Categories and Grading Criteria" — the reference
// students may consult DURING a translation exam, lockdown included.
//
// Source: Dropbox / Classes / 4. Greek Admin / Essential Syntax /
// "Essential syntax and grading criteria.docx" (transcribed 2026-08-16). The category list
// follows Wallace's "Basics of New Testament Syntax"; the grade descriptors are quoted
// verbatim, which is also why this content stays in English in every locale — it is the
// official grading document, not app chrome.
//
// One departure from the source: the document's second "The C Grade" heading introduces the
// paragraph that describes the D grade ("The D grade exhibits …"), so it is rendered here as
// "The D Grade". Flagged to the instructor rather than silently kept wrong.

export interface SyntaxRefGroup {
  heading: string
  items: string[]
}

export const SYNTAX_REFERENCE_TITLE = 'Essential Syntax Categories'
export const SYNTAX_REFERENCE_SUBTITLE = 'based on Wallace’s “Basics of NT Syntax”'

export const SYNTAX_REFERENCE: SyntaxRefGroup[] = [
  { heading: 'Nominative Nouns', items: [
    'Subject', 'Predicate Nominative', 'Nominative Absolute', 'Nominative for Vocative',
  ]},
  { heading: 'Genitive Nouns', items: [
    'Possessive Genitive', 'Descriptive Genitive', 'Genitive of Relationship',
    'Partitive Genitive', 'Subjective Genitive', 'Objective Genitive', 'Genitive Absolute',
    'Genitive after Certain Verbs (as a Direct Object)', 'Genitive of Apposition',
    'Genitive of Comparison', 'Genitive of Time', 'Genitive after Certain Prepositions',
  ]},
  { heading: 'Dative Nouns', items: [
    'Dative of Indirect Object', 'Dative of Means/Instrument', 'Dative of Sphere',
    'Dative of Time', 'Dative of Possession', 'Dative Direct Object',
    'Dative of Reference/Respect', 'Dative of Interest (Advantage/ Disadvantage)',
    'Dative after Certain Prepositions',
  ]},
  { heading: 'Accusative Nouns', items: [
    'Accusative Direct Object', 'Double Accusative', 'Accusative of Measure (Time, etc.)',
    'Accusative Subject of Infinitive', 'Accusative after Certain Prepositions',
  ]},
  { heading: 'Articles', items: [
    'Granville Sharp Rule', 'Colwell’s Rule',
  ]},
  { heading: 'Imperatives', items: [
    'Imperative of Command', 'Imperative of Prohibition', 'Imperative of Request',
  ]},
  { heading: 'Subjunctive Mood', items: [
    'Hortatory Subjunctive', 'Prohibitive Subjunctive', 'Deliberative Subjunctive',
    'Subjunctive of Emphatic Negation', 'ἵνα + Subjunctive',
    'Subjunctive in Conditional Sentences',
  ]},
  { heading: 'Aorist Indicative', items: [
    'Constative Aorist', 'Ingressive Aorist', 'Culminative Aorist', 'Gnomic Aorist',
    'Epistolary Aorist', 'Immediate Past/Dramatic Aorist',
  ]},
  { heading: 'Present Indicative', items: [
    'Progressive Present', 'Extending-From-Past Present', 'Iterative Present',
    'Conative Present', 'Historical Present', 'Futuristic Present',
  ]},
  { heading: 'Imperfect Indicative', items: [
    'Progressive Imperfect', 'Iterative Imperfect', 'Conative Imperfect',
    'Ingressive/Inceptive Imperfect',
  ]},
  { heading: 'Perfect Indicative', items: [
    'Intensive/Resultative Perfect', 'Extensive/Consummative Perfect',
  ]},
  { heading: 'Future Indicative', items: [
    'Predictive Future', 'Imperatival Future', 'Deliberative Future',
  ]},
  { heading: 'Infinitives', items: [
    'Complementary Infinitive', 'Infinitive of Time', 'Infinitive of Purpose',
    'Infinitive of Result', 'Causal Infinitive', 'Epexegetical Infinitive',
    'Inf. of Indirect Discourse', 'Subject Infinitive',
  ]},
  { heading: 'Participles', items: [
    'Adjectival Participle (Attributive, Predicate, Substantival)',
    'Adverbial Participle (Temporal, Cause, Purpose, Condition, Concession, Means)',
    'Imperatival Participle', 'Periphrastic Participle',
    'Participle of Attendant Circumstances',
  ]},
  { heading: 'Conditional Sentences', items: [
    'First Class: Assumed True', 'Second Class: Contrary to Fact',
    'Third Class: Probable or Future',
  ]},
]

export const GRADING_CRITERIA_TITLE = 'Passing Grades and Percentages'

export const GRADING_CRITERIA: { grade: string; scope: string; text: string }[] = [
  { grade: 'The A Grade', scope: 'Tests out of Beginning Greek and Intermediate Greek',
    text: 'An A grade is given only when a student not only fulfills the criteria for a B grade, but in doing so demonstrates an advanced academic aptitude for content knowledge, critique, synthesis and independent insight. An A grade translation demonstrates a deep understanding of the Greek text and its syntax.' },
  { grade: 'The B Grade', scope: 'Tests out of Beginning Greek and Intermediate Greek',
    text: 'The B grade demonstrates a significant level of the knowledge, insight, critical competence and professional written presentation standards essential for an individual wishing to pursue a career as a professional pastor. A B grade translation demonstrates a good understanding of the Greek text and its syntax. The translation may typically include one or two mistakes per sentence relating to vocabulary or syntax.' },
  { grade: 'The C Grade', scope: 'Tests out of Beginning Greek, requires Intermediate Greek',
    text: 'The C grade differs only from a B grade in that the traits outlined in the B grade above are not consistently applied. A C grade translation demonstrates a reasonable understanding of the Greek text and its syntax. The translation may typically include three or four mistakes per sentence relating to vocabulary or syntax.' },
  { grade: 'The D Grade', scope: 'Requires Beginning Greek and Intermediate Greek',
    text: 'The D grade exhibits a limited level of knowledge, insight and critique. A D grade translation demonstrates a degree of understanding of the Greek text and its syntax. The translation demonstrates some knowledge of vocabulary and syntax but significantly misrepresents the intentions of the biblical author.' },
  { grade: 'Fail', scope: '',
    text: 'The Fail grade is given when very limited or no demonstrable competency has been observed.' },
]
