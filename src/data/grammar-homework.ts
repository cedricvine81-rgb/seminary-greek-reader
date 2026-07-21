// Grammar homework packs — the lesson decks' "Exercises A / B" homework sets,
// with word-level model answers (parsing / syntax / translation) so they can be
// assigned as graded Translation Exercises worked in the homework pane.
//
// An instructor picks a set in the Assignment Builder (type: Translation
// Exercise); the API turns each sentence into a TRANSLATION question whose
// options[0] holds the word data as JSON ({ hw: 1, set, chapter, words, note }).
// Students answer word-by-word (parsing + syntax + gloss) plus a whole-sentence
// translation; the instructor grades per sentence and the score feeds the
// gradebook through the existing question-based translation-exercise path.
//
// To add a pack: append to GRAMMAR_HOMEWORK_SETS. `chapter` must be a Grammar
// page tab id (e.g. 'prepositions', 'nouns') so the chapter can list its sets.

export interface HomeworkWord {
  w: string
  parsing?: string
  syntax?: string
  gloss?: string
}

export interface HomeworkSentence {
  words: HomeworkWord[]
  translation: string
  note?: string
}

export interface HomeworkSet {
  id: string
  chapter: string
  title: string
  sentences: HomeworkSentence[]
}

const ART = 'Article'

export const GRAMMAR_HOMEWORK_SETS: HomeworkSet[] = [
  {
    id: 'l3-prepositions-a',
    chapter: 'prepositions',
    title: 'Homework A — Prepositions (Lesson 3)',
    sentences: [
      {
        words: [
          { w: 'δόξαν', parsing: 'Acc Sg Fem — δόξα', syntax: 'Direct Object', gloss: 'glory' },
          { w: 'παρὰ', parsing: 'Preposition + genitive', gloss: 'from' },
          { w: 'ἀνθρώπων', parsing: 'Gen Pl Masc — ἄνθρωπος', gloss: 'men' },
          { w: 'οὐ', parsing: 'Negative particle', gloss: 'not' },
          { w: 'λαμβάνω.', parsing: 'Pres Act Ind 1 Sg — λαμβάνω', gloss: 'I receive' },
        ],
        translation: 'I do not receive glory from men.',
        note: 'John 5:41 — the fronted δόξαν is emphatic.',
      },
      {
        words: [
          { w: 'πιστεύεις', parsing: 'Pres Act Ind 2 Sg — πιστεύω', gloss: 'you believe' },
          { w: 'εἰς', parsing: 'Preposition + accusative', gloss: 'in/into' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'υἱὸν', parsing: 'Acc Sg Masc — υἱός', gloss: 'Son' },
          { w: 'τοῦ', parsing: `${ART} — Gen Sg Masc`, gloss: 'of' },
          { w: 'ἀνθρώπου;', parsing: 'Gen Sg Masc — ἄνθρωπος', syntax: 'Genitive of Relationship', gloss: 'Man' },
        ],
        translation: 'Do you believe in the Son of Man?',
        note: 'John 9:35.',
      },
      {
        words: [
          { w: 'οἱ', parsing: `${ART} — Nom Pl Masc`, gloss: 'the' },
          { w: 'μαθηταὶ', parsing: 'Nom Pl Masc — μαθητής', syntax: 'Subject', gloss: 'disciples' },
          { w: 'λέγουσιν', parsing: 'Pres Act Ind 3 Pl — λέγω', gloss: 'say' },
          { w: 'αὐτῷ·', parsing: 'Dat Sg Masc — αὐτός', syntax: 'Dative of Indirect Object', gloss: 'to him' },
          { w: 'Ποῦ', parsing: 'Interrogative adverb', gloss: 'where?' },
          { w: 'ἐστιν', parsing: 'Pres Act Ind 3 Sg — εἰμί', gloss: 'is' },
          { w: 'ὁ', parsing: `${ART} — Nom Sg Masc`, gloss: 'the' },
          { w: 'κύριος;', parsing: 'Nom Sg Masc — κύριος', syntax: 'Subject', gloss: 'Lord' },
        ],
        translation: 'The disciples say to him, "Where is the Lord?"',
      },
      {
        words: [
          { w: 'ὁ', parsing: `${ART} — Nom Sg Masc`, gloss: 'the' },
          { w: 'Πέτρος', parsing: 'Nom Sg Masc — Πέτρος', syntax: 'Subject', gloss: 'Peter' },
          { w: 'λαλεῖ', parsing: 'Pres Act Ind 3 Sg — λαλέω', gloss: 'speaks' },
          { w: 'αὐτοῖς', parsing: 'Dat Pl Masc — αὐτός', syntax: 'Dative of Indirect Object', gloss: 'to them' },
          { w: 'περὶ', parsing: 'Preposition + genitive', gloss: 'about' },
          { w: 'τῆς', parsing: `${ART} — Gen Sg Fem`, gloss: 'the' },
          { w: 'βασιλείας', parsing: 'Gen Sg Fem — βασιλεία', gloss: 'kingdom' },
          { w: 'παρὰ', parsing: 'Preposition + dative', gloss: 'beside' },
          { w: 'τῇ', parsing: `${ART} — Dat Sg Fem`, gloss: 'the' },
          { w: 'θαλάσσῃ.', parsing: 'Dat Sg Fem — θάλασσα', gloss: 'sea' },
        ],
        translation: 'Peter speaks to them about the kingdom beside the sea.',
        note: 'παρά + dative = "beside" (rest) — a different sense from παρά + genitive.',
      },
      {
        words: [
          { w: 'πιστεύομεν', parsing: 'Pres Act Ind 1 Pl — πιστεύω', gloss: 'we believe' },
          { w: 'εἰς', parsing: 'Preposition + accusative', gloss: 'in' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'θεὸν', parsing: 'Acc Sg Masc — θεός', gloss: 'God' },
          { w: 'ἐνώπιον', parsing: 'Preposition + genitive', gloss: 'before' },
          { w: 'τῶν', parsing: `${ART} — Gen Pl Masc`, gloss: 'the' },
          { w: 'ἀνθρώπων.', parsing: 'Gen Pl Masc — ἄνθρωπος', gloss: 'men' },
        ],
        translation: 'We believe in God before men.',
      },
      {
        words: [
          { w: 'ὁ', parsing: `${ART} — Nom Sg Masc`, gloss: 'the' },
          { w: 'κύριος', parsing: 'Nom Sg Masc — κύριος', syntax: 'Subject', gloss: 'Lord' },
          { w: 'ἐκβάλλει', parsing: 'Pres Act Ind 3 Sg — ἐκβάλλω', gloss: 'casts out' },
          { w: 'τὸ', parsing: `${ART} — Acc Sg Neut`, gloss: 'the' },
          { w: 'δαιμόνιον', parsing: 'Acc Sg Neut — δαιμόνιον', syntax: 'Direct Object', gloss: 'demon' },
          { w: 'ἐκ', parsing: 'Preposition + genitive', gloss: 'out of' },
          { w: 'τοῦ', parsing: `${ART} — Gen Sg Neut`, gloss: 'the' },
          { w: 'τέκνου', parsing: 'Gen Sg Neut — τέκνον', gloss: 'child' },
          { w: 'λόγῳ.', parsing: 'Dat Sg Masc — λόγος', syntax: 'Dative of Means/Instrument', gloss: 'by a word' },
        ],
        translation: 'The Lord casts the demon out of the child by a word.',
        note: 'Bare λόγῳ with no preposition — the instrumental dative.',
      },
    ],
  },
  {
    id: 'l3-prepositions-b',
    chapter: 'prepositions',
    title: 'Homework B — Prepositions (Lesson 3)',
    sentences: [
      {
        words: [
          { w: 'ἐν', parsing: 'Preposition + dative', gloss: 'on/in' },
          { w: 'τῇ', parsing: `${ART} — Dat Sg Fem`, gloss: 'the' },
          { w: 'ἡμέρᾳ', parsing: 'Dat Sg Fem — ἡμέρα', syntax: 'Dative of Time', gloss: 'day' },
          { w: 'τῇ', parsing: `${ART} — Dat Sg Fem`, gloss: 'the' },
          { w: 'μεγάλῃ', parsing: 'Dat Sg Fem — μέγας (attributive)', gloss: 'great' },
          { w: 'γινώσκομεν', parsing: 'Pres Act Ind 1 Pl — γινώσκω', gloss: 'we know' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'θεὸν', parsing: 'Acc Sg Masc — θεός', syntax: 'Direct Object', gloss: 'God' },
          { w: 'πρόσωπον', parsing: 'Acc Sg Neut — πρόσωπον', gloss: 'face' },
          { w: 'πρὸς', parsing: 'Preposition + accusative', gloss: 'to' },
          { w: 'πρόσωπον.', parsing: 'Acc Sg Neut — πρόσωπον', gloss: 'face' },
        ],
        translation: 'On the great day we know God face to face.',
        note: 'πρόσωπον πρὸς πρόσωπον — the idiom of 1 Corinthians 13:12.',
      },
      {
        words: [
          { w: 'κύριε,', parsing: 'Voc Sg Masc — κύριος', gloss: 'Lord' },
          { w: 'πιστεύω', parsing: 'Pres Act Ind 1 Sg — πιστεύω', gloss: 'I believe' },
          { w: 'εἰς', parsing: 'Preposition + accusative', gloss: 'in' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'λόγον', parsing: 'Acc Sg Masc — λόγος', gloss: 'word' },
          { w: 'σου.', parsing: 'Gen Sg — σύ', syntax: 'Genitive of Possession', gloss: 'your' },
        ],
        translation: 'Lord, I believe in your word.',
        note: 'κύριε — the vocative, the case of direct address.',
      },
      {
        words: [
          { w: 'προσκυνεῖτε', parsing: 'Pres Act Ind 2 Pl — προσκυνέω', gloss: 'you worship' },
          { w: 'τῷ', parsing: `${ART} — Dat Sg Masc`, gloss: 'the' },
          { w: 'κυρίῳ', parsing: 'Dat Sg Masc — κύριος', gloss: 'Lord' },
          { w: 'ἐν', parsing: 'Preposition + dative', gloss: 'in' },
          { w: 'τῷ', parsing: `${ART} — Dat Sg Neut`, gloss: 'the' },
          { w: 'ἱερῷ;', parsing: 'Dat Sg Neut — ἱερόν', gloss: 'temple' },
        ],
        translation: 'Do you (pl.) worship the Lord in the temple?',
        note: 'προσκυνέω takes its object in the dative.',
      },
      {
        words: [
          { w: 'διὰ', parsing: 'Preposition + accusative', gloss: 'because of' },
          { w: 'τὴν', parsing: `${ART} — Acc Sg Fem`, gloss: 'the' },
          { w: 'ἡμέραν', parsing: 'Acc Sg Fem — ἡμέρα', gloss: 'day' },
          { w: 'ὁ', parsing: `${ART} — Nom Sg Masc`, gloss: 'the' },
          { w: 'Ἰησοῦς', parsing: 'Nom Sg Masc — Ἰησοῦς', syntax: 'Subject', gloss: 'Jesus' },
          { w: 'ἀπολύει', parsing: 'Pres Act Ind 3 Sg — ἀπολύω', gloss: 'releases' },
          { w: 'τοὺς', parsing: `${ART} — Acc Pl Masc`, gloss: 'the' },
          { w: 'μαθητάς.', parsing: 'Acc Pl Masc — μαθητής', syntax: 'Direct Object', gloss: 'disciples' },
        ],
        translation: 'Because of the day Jesus releases the disciples.',
        note: 'διά + accusative = "because of" — with the genitive it would be "through."',
      },
      {
        words: [
          { w: 'περιπατοῦμεν', parsing: 'Pres Act Ind 1 Pl — περιπατέω', gloss: 'we walk' },
          { w: 'ἐν', parsing: 'Preposition + dative', gloss: 'in' },
          { w: 'τῇ', parsing: `${ART} — Dat Sg Fem`, gloss: 'the' },
          { w: 'ἀγάπῃ', parsing: 'Dat Sg Fem — ἀγάπη', syntax: 'Dative of Sphere', gloss: 'love' },
          { w: 'κατὰ', parsing: 'Preposition + accusative', gloss: 'according to' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'λόγον', parsing: 'Acc Sg Masc — λόγος', gloss: 'word' },
          { w: 'τοῦ', parsing: `${ART} — Gen Sg Masc`, gloss: 'of' },
          { w: 'θεοῦ.', parsing: 'Gen Sg Masc — θεός', syntax: 'Genitive of Possession', gloss: 'God' },
        ],
        translation: 'We walk in love according to the word of God.',
      },
      {
        words: [
          { w: 'ὁ', parsing: `${ART} — Nom Sg Masc`, gloss: 'the' },
          { w: 'κύριος', parsing: 'Nom Sg Masc — κύριος', syntax: 'Subject', gloss: 'Lord' },
          { w: 'λύει', parsing: 'Pres Act Ind 3 Sg — λύω', gloss: 'releases' },
          { w: 'τὸν', parsing: `${ART} — Acc Sg Masc`, gloss: 'the' },
          { w: 'ἄνθρωπον', parsing: 'Acc Sg Masc — ἄνθρωπος', syntax: 'Direct Object', gloss: 'man' },
          { w: 'καὶ', parsing: 'Conjunction', gloss: 'and' },
          { w: 'παραλαμβάνει', parsing: 'Pres Act Ind 3 Sg — παραλαμβάνω', gloss: 'takes along' },
          { w: 'αὐτὸν', parsing: 'Acc Sg Masc — αὐτός', syntax: 'Direct Object', gloss: 'him' },
          { w: 'πρὸς', parsing: 'Preposition + accusative', gloss: 'to' },
          { w: 'τοὺς', parsing: `${ART} — Acc Pl Masc`, gloss: 'the' },
          { w: 'μαθητάς.', parsing: 'Acc Pl Masc — μαθητής', gloss: 'disciples' },
        ],
        translation: 'The Lord releases the man and takes him along to the disciples.',
      },
    ],
  },
]

export function getHomeworkSet(id: string): HomeworkSet | undefined {
  return GRAMMAR_HOMEWORK_SETS.find(s => s.id === id)
}
