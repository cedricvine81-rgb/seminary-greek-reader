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
  diphthong: {
    title: 'Diphthong',
    def: 'Two vowels pronounced as one gliding sound — English has them too: "oil," "how," "eye." Greek writes its diphthongs with two letters: οι, αυ, αι.',
  },
  transliteration: {
    title: 'Transliteration',
    def: 'Writing a word letter-for-letter in another alphabet: λόγος → logos. Not translation (which gives the meaning, "word") — just the sounds.',
  },

  // ── Hebrew-specific terms ────────────────────────────────────────────────────────────
  // Same audience as above: every definition works from an everyday English example before
  // any Hebrew, so the Hebrew grammar chapters serve readers with no grammar background.
  root: {
    title: 'Root',
    def: 'The three consonants that carry a Hebrew word\'s core meaning, the way "sing / sang / sung / song" all share s-ng in English. From the root מ־ל־ך ("rule") Hebrew builds "king," "queen," "kingdom," and "he reigned." Dictionaries file words by root.',
  },
  'construct state': {
    title: 'Construct state',
    def: 'Hebrew has no word for "of." Instead it compresses the first of two nouns and leans it on the second — like English "doghouse" from "dog" + "house." A noun in that compressed, leaning form is "in construct"; its ordinary dictionary form is the "absolute" state.',
  },
  absolute: {
    title: 'Absolute state',
    def: 'A noun\'s ordinary, stand-alone dictionary form — as opposed to the compressed "construct" form it takes when leaning on a following noun to mean "X of Y."',
  },
  definite: {
    title: 'Definite',
    def: 'Pointing at a particular one: "THE king" (definite) versus "A king" (indefinite). Hebrew makes a word definite with the article הַ־, with a "my/your/his" ending, or by its being a name.',
  },
  binyan: {
    title: 'Binyan (stem)',
    def: 'One of seven patterns a Hebrew root can be poured into, each shifting the meaning in a predictable way — roughly like English "eat / feed" (cause to eat) or "see / show" (cause to see). The plural is binyanim; grammars also say "stem."',
  },
  qal: {
    title: 'Qal',
    def: 'The simplest and most common verb pattern (binyan): the root\'s plain meaning, nothing added — "he wrote," "he ate." The name means "light, simple."',
  },
  niphal: {
    title: 'Niphal',
    def: 'The verb pattern that usually turns the action around onto the subject: "was written," "was heard" — like English passives.',
  },
  piel: {
    title: 'Piel',
    def: 'A verb pattern that often intensifies or extends the plain meaning: qal "break" becomes piel "smash to pieces." Recognisable by a dot (dagesh) in the middle root letter.',
  },
  hiphil: {
    title: 'Hiphil',
    def: 'The "cause to" pattern: qal "he ate" → hiphil "he fed" (caused to eat); "he saw" → "he showed." English needs a different verb; Hebrew just changes the pattern.',
  },
  perfect: {
    title: 'Perfect (qatal)',
    def: 'The Hebrew verb form for an action viewed as a complete whole — usually past in English: "he wrote." Formed with endings on the back of the root. Also called qatal.',
  },
  imperfect: {
    title: 'Imperfect (yiqtol)',
    def: 'The Hebrew verb form for an action viewed as ongoing or not yet done — usually future or repeated: "he will write," "he used to write." Formed with letters on the FRONT of the root. Also called yiqtol.',
  },
  'waw-consecutive': {
    title: 'Waw-consecutive',
    def: 'Biblical stories chain events with "and… and… and…" — a special use of וְ ("and") that flips how the verb form is translated. It is the trademark of Hebrew narrative: "and he arose, and he went, and he said."',
  },
  pointing: {
    title: 'Pointing (vowel points)',
    def: 'The dots and dashes above and below Hebrew letters that mark the vowels. Ancient Hebrew wrote only consonants; medieval scribes (the Masoretes) added the points so the traditional pronunciation would not be lost.',
  },
  sheva: {
    title: 'Sheva',
    def: 'The two vertical dots (ְ) under a letter: either a very short "uh" (like the first vowel of "about") or silence — the absence of a vowel. Which one it is follows rules the vowels chapter teaches.',
  },
  dagesh: {
    title: 'Dagesh',
    def: 'A dot inside a Hebrew letter. In בגדכפת letters it hardens the sound (b vs v, k vs kh); elsewhere it doubles the letter, as if it were written twice.',
  },
  guttural: {
    title: 'Guttural',
    def: 'The throat letters — א ה ח ע (and often ר). They refuse doubling and dislike certain vowels, which bends the regular patterns around them; most "irregular" forms trace back to a guttural.',
  },
  suffix: {
    title: 'Pronominal suffix',
    def: 'A "my / your / his / our" glued onto the end of a word instead of standing alone: סוּס "horse," סוּסִי "my horse," סוּסוֹ "his horse." Verbs take them too, as objects: "he kept HIM."',
  },
  participle: {
    title: 'Participle',
    def: 'A verb wearing an adjective\'s clothes: English "-ing" words used to describe — "the RULING king," "those SITTING at the gate." Hebrew uses it for ongoing action and for "the one who does X."',
  },
  infinitive: {
    title: 'Infinitive',
    def: 'The "to do" form of a verb — naming the action without saying who or when: "to keep," "to write." Hebrew has two: one that combines with prepositions ("in order to keep"), one that adds emphasis ("dying you shall die" = "you shall surely die").',
  },
  volitive: {
    title: 'Volitive',
    def: 'The asking-and-telling forms — the ones you use to want something to happen: "Go!", "let me go", "may he go". Hebrew uses a different form depending on WHO is meant to act: me, you, or someone else.',
  },
  cohortative: {
    title: 'Cohortative',
    def: 'The “let me / let us” form — a wish or resolve about YOURSELF: “let me go,” “let us build.” In Hebrew it is the ordinary future form with a ־ָה added on the end.',
  },
  jussive: {
    title: 'Jussive',
    def: 'The “may he / let them” form — a wish about SOMEONE ELSE: “may the LORD bless you,” “let there be light.” In Hebrew it is the ordinary future form, usually shortened a little.',
  },
  imperative: {
    title: 'Imperative',
    def: 'A direct command to the person you are speaking to: “Go!”, “Listen!”. Hebrew builds it by taking the future form and dropping its front letter.',
  },
  stative: {
    title: 'Stative verb',
    def: 'A verb that describes a STATE rather than an action — “be heavy,” “be old,” “be able.” English usually turns these into “is” plus an adjective: he IS old.',
  },
  factitive: {
    title: 'Factitive',
    def: 'Making something be what the adjective says: “pure” → “purify,” “holy” → “make holy.” Hebrew does this by moving the same root into the Piel pattern.',
  },
  denominative: {
    title: 'Denominative',
    def: 'A verb made out of a noun, the way English turns “a text” into “to text” or “salt” into “to salt.” Hebrew: דָּבָר “word” → דִּבֶּר “speak.”',
  },
  assimilation: {
    title: 'Assimilation',
    def: 'A letter disappearing into the one after it, leaving a doubling dot behind — the way English says “impossible” rather than “inpossible.” Hebrew’s נ does this constantly.',
  },
  maqqef: {
    title: 'Maqqef',
    def: 'The small raised hyphen ־ that joins two words so they are read as one, with a single stress — like the hyphen in “father-in-law.”',
  },
  'materlectionis': {
    title: 'Mater lectionis',
    def: 'Literally “mother of reading”: a consonant (ו, י or ה) used to show a vowel, from the days before vowel points existed. It is why some long vowels are spelled with an extra letter.',
  },
  apocopation: {
    title: 'Apocopation',
    def: 'Chopping the end off a word — Hebrew shortens some verb forms this way, which is how the jussive is often told apart from the ordinary future.',
  },
  paradigm: {
    title: 'Paradigm',
    def: 'One word written out in every form it can take, used as the pattern for all the words that behave like it. Learn the one and you can read the thousands built the same way.',
  },
  conjugation: {
    title: 'Conjugation',
    def: 'Changing a verb to match who is doing it: I keep, you keep, he keeps. English barely changes the word; Hebrew changes it for every person, gender and number — so one Hebrew word can say "you women will keep".',
  },
  passive: {
    title: 'Passive',
    def: 'The subject receives the action instead of doing it: "the letter WAS WRITTEN" rather than "he wrote the letter."',
  },
  reflexive: {
    title: 'Reflexive',
    def: 'The subject acts on itself: "he hid HIMSELF," "she washed HERSELF."',
  },
  causative: {
    title: 'Causative',
    def: 'Making someone else do the action: "feed" is the causative of "eat," "show" of "see," "seat" of "sit." Hebrew has a whole verb pattern (the hiphil) for this.',
  },
  person: {
    title: 'Person',
    def: 'Who a verb form points at: I/we (first person), you (second), he/she/they (third). Hebrew verb endings carry person, gender, and number all at once, so a single word can say "you (feminine, plural) will keep."',
  },
}
