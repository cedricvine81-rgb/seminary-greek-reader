/* ─────────────────────────────────────────────
   Morphology glossary

   Plain-English definitions for grammar terms, shown by the <Term>
   tooltip component. Written for a reader who has never studied a
   second language: every definition uses an everyday English example
   before any Greek. Keys are lowercase.
───────────────────────────────────────────── */

export interface GlossaryEntry { title: string; def: string }

export const GLOSSARY: Record<string, GlossaryEntry> = {
  noun: {
    title: 'Noun',
    def: 'A word that names a person, place, thing, or idea: "dog," "Paul," "love," "kingdom."',
  },
  verb: {
    title: 'Verb',
    def: 'A word for an action or state: "runs," "sees," "is." Every complete sentence has one.',
  },
  adjective: {
    title: 'Adjective',
    def: 'A word that describes a noun: "the good word," "a faithful servant."',
  },
  article: {
    title: 'Article',
    def: 'The little word "the." Greek has one (ὁ, ἡ, τό) and uses it constantly; it changes form to match its noun, which makes it a superb clue for parsing.',
  },
  pronoun: {
    title: 'Pronoun',
    def: 'A word that stands in for a noun so you need not repeat it: "he," "she," "it," "they," "who."',
  },
  preposition: {
    title: 'Preposition',
    def: 'A little relationship word placed before a noun: "in the house," "into the city," "with him."',
  },
  case: {
    title: 'Case',
    def: 'The form a noun takes to show its job in the sentence. English keeps a trace of this in pronouns: "he" (subject), "him" (object), "his" (possessor). Greek does it to every noun, with endings.',
  },
  gender: {
    title: 'Gender',
    def: 'A grammatical category (masculine, feminine, neuter) every Greek noun belongs to. It is about word-class, not biology — the Greek word for "child" (τέκνον) is neuter.',
  },
  number: {
    title: 'Number',
    def: 'Whether a word is singular (one: "cat") or plural (more than one: "cats").',
  },
  declension: {
    title: 'Declension',
    def: 'A family of nouns that share the same set of endings. English has ending-families too: cat→cats, ox→oxen, mouse→mice. Greek has three main families.',
  },
  subject: {
    title: 'Subject',
    def: 'The one doing the action of the verb. In "The dog bit the man," the dog is the subject.',
  },
  'direct object': {
    title: 'Direct object',
    def: 'The one the action happens to. In "The dog bit the man," the man is the direct object.',
  },
  'indirect object': {
    title: 'Indirect object',
    def: 'The one something is given or said to. In "She gave the book to me," "me" is the indirect object.',
  },
  stem: {
    title: 'Stem',
    def: 'The part of a word that carries its core meaning and stays (mostly) unchanged while endings are swapped: λογ- in λόγος, λόγου, λόγῳ.',
  },
  ending: {
    title: 'Ending',
    def: 'The final letters of a word, which change to signal its case, number, and gender (for nouns) or person and tense (for verbs).',
  },
  parse: {
    title: 'Parse',
    def: 'To identify a word\'s grammatical form — e.g. "genitive singular masculine" — from its ending and article. Parsing is how you decode a Greek sentence.',
  },
  parsing: {
    title: 'Parsing',
    def: 'Identifying a word\'s grammatical form — e.g. "genitive singular masculine" — from its ending and article. Parsing is how you decode a Greek sentence.',
  },
  inflection: {
    title: 'Inflection',
    def: 'Changing a word\'s form to change its grammatical role — like English "sing, sang, sung" or "who/whom." Greek is a highly inflected language: the endings do the work word order does in English.',
  },
  clause: {
    title: 'Clause',
    def: 'A group of words containing a subject and a verb. "When the king arrived" is a clause; "after breakfast" is not (no verb).',
  },
  nominative: {
    title: 'Nominative case',
    def: 'The subject\'s case — the form a noun wears when it is doing the action: ὁ θεός in "God loves…".',
  },
  genitive: {
    title: 'Genitive case',
    def: 'The "of" case — possession, source, description: τοῦ θεοῦ "of God." English shows the same idea with "of" or an apostrophe-s.',
  },
  dative: {
    title: 'Dative case',
    def: 'The "to / for" case — the person something is given or said to, and also "with / by / in": τῷ θεῷ "to God."',
  },
  accusative: {
    title: 'Accusative case',
    def: 'The direct-object case — the form a noun wears when the action happens to it: τὸν λόγον in "he speaks the word."',
  },
  vocative: {
    title: 'Vocative case',
    def: 'The case of direct address — calling someone: κύριε "O Lord!" It usually looks like the nominative.',
  },
  tense: {
    title: 'Tense',
    def: 'The verb form that signals time (past, present, future) and — in Greek especially — the kind of action (ongoing vs. complete).',
  },
  aspect: {
    title: 'Aspect',
    def: 'The kind of action a verb form portrays: ongoing ("I was writing"), a simple whole ("I wrote"), or a completed state ("I have written"). Greek cares about aspect even more than time.',
  },
  mood: {
    title: 'Mood',
    def: 'The verb form that signals how the speaker frames the action: as fact (indicative), command (imperative), possibility (subjunctive), or "to…" idea (infinitive).',
  },
  voice: {
    title: 'Voice',
    def: 'Whether the subject does the action (active: "I loose"), receives it (passive: "I am loosed"), or acts with self-involvement (middle).',
  },
}
