// Corrections to public/data/lsj.json — the imported Liddell–Scott gloss digest.
//
// That file is a HARVEST, not the lexicon: each key holds up to about five short glosses
// scraped from the entry, and the key is the lemma with its diacritics stripped. Both of
// those lose information, and where a very common function word folds onto a rare homograph
// or onto Liddell–Scott's article about the LETTER, the harvest window fills up with the
// wrong word. So the reader was showing "little; short o," for ὁ, "butterfly; moth" for δέ,
// and "u" for οὐ — the three commonest words in Greek. Elsewhere the window filled with the
// entry's etymology (Sanskrit and Gothic cognates for ἀπό, ἀνήρ, ἵημι) or with a citation
// abbreviation ("Spir. Prooem." for φημί, "Stadtrecht von Gortyn" for ἑαυτοῦ).
//
// A mechanical filter was tried first and abandoned: the junk and the good glosses are not
// separable by shape. Dropping short or non-English-looking segments takes "and" from καί,
// "or" from ἤ, "all" from πᾶς and "man" from ἄνθρωπος along with the cognates, because "af,"
// and "all" look alike to a regular expression. Nothing here is clever, therefore — it is a
// hand-audit of the sixty most-clicked lemmas in the corpus, which is where the damage is
// concentrated: these sixteen keys alone carry about a fifth of all word-clicks.
//
// `was` records what the file holds today. tests/lsj-corrections.test.ts asserts it still
// holds exactly that, so if lsj.json is ever rebuilt from a real source this table fails
// loudly and gets revisited rather than quietly overriding a better lexicon.
//
// The replacements are the ordinary abridged-Liddell–Scott senses for these words. This is a
// stopgap over a defective import, not lexicography: the real fix is to rebuild lsj.json from
// a proper Liddell–Scott source, keyed by ACCENTED lemma so ὁ and ὅ and ο stay three words.

export interface LsjCorrection {
  /** The folded key as normalizeLemma() produces it. */
  key: string
  /** What lsj.json holds today — asserted by the test, so a rebuild invalidates the entry. */
  was: string
  /** What the reader should see instead. */
  gloss: string
  /** Why the stored value is wrong. */
  why: string
}

export const LSJ_CORRECTIONS: LsjCorrection[] = [
  { key: 'ο', was: 'little; short o,; great; long o.',
    gloss: 'the; this, that',
    why: "Liddell–Scott's article on the letter omicron — ὁ, ὅ and the letter all fold to «ο»" },
  { key: 'δε', was: 'butterfly; moth.',
    gloss: 'but; and; now',
    why: 'a rare homograph won the fold; the particle δέ has no gloss left in the file' },
  { key: 'ου', was: 'u',
    gloss: 'not, no',
    why: 'the name of the letter, not the negative' },
  { key: 'ει', was: 'where,',
    gloss: 'if; whether',
    why: 'the gloss belongs to another headword folded onto «ει»' },
  { key: 'λεγω', was: 'lay',
    gloss: 'say, speak, tell; mean',
    why: 'harvested from λέχος/λέγω "lay to rest" rather than the ordinary verb' },
  { key: 'οσ', was: 'yas, yā, yad,; jis, ji (he, she),; i, ja, je (he, she, it; this, that; he, she, it',
    gloss: 'who, which, that',
    why: "the entry's etymology — Sanskrit, Lithuanian and Slavonic cognates" },
  { key: 'επι', was: 'prepare for contest, stir up, irritate,; set; upon; irritate,',
    gloss: 'on, upon; at; against; in the time of',
    why: 'the first senses belong to a compound verb, not to the preposition' },
  { key: 'μη', was: 'mā´; mi; mē´; not; will',
    gloss: 'not (with the non-indicative moods); lest',
    why: 'cognates fill the window before the actual sense' },
  { key: 'εχω', was: 'check; lon; seĝh; sáhate; sigis',
    gloss: 'have, hold, possess; be able; (intransitive) be',
    why: 'four of the five segments are cognates' },
  { key: 'φημι', was: 'Spir. Prooem., Eratosth.Prooem.; say, affirm, assert,; shall we say of; speak; think, deem, suppose,',
    gloss: 'say, affirm, assert; think, suppose',
    why: 'opens with a citation abbreviation harvested as a gloss' },
  { key: 'εαυτου', was: 'Stadtrecht von Gortyn; of himself, herself, itself; itself, absolutely; themselves, himself; his own',
    gloss: 'of himself, herself, itself; themselves',
    why: 'opens with the title of a German monograph harvested as a gloss' },
  { key: 'υπο', was: 'úpa; uf; from under,; from under; from under',
    gloss: 'under; by (of the agent); beneath',
    why: 'cognates first, and the agent sense — the one a reader needs — is missing' },
  { key: 'απο', was: 'ápa,; ab,; ap-ehtre; af,; af, cef, of,',
    gloss: 'from, away from; since',
    why: 'every segment is a cognate; there is no English gloss at all' },
  { key: 'ανηρ', was: 'nar-; ner-, nṛ-; nṛ-,; ṇr-; man,',
    gloss: 'man; husband',
    why: 'four of the five segments are reconstructed roots' },
  { key: 'ιημι', was: 'Ja-c-io; sēmen; véti; vyánti; vīs',
    gloss: 'send, let go, hurl; (middle) hasten',
    why: 'every segment is a cognate; there is no English gloss at all' },
  { key: 'αλλα', was: 'otheruise; but; not only . . but; not only not . . but; still, at least',
    gloss: 'but; yet, still',
    why: 'opens on a typo carried in from the source scan' },
]

const BY_KEY: Record<string, string> = Object.fromEntries(
  LSJ_CORRECTIONS.map(c => [c.key, c.gloss]),
)

/**
 * The Liddell–Scott line to show for a folded lemma key, or null for none.
 * Corrections win over the imported file; everything else passes through untouched.
 */
export function lsjGlossFor(key: string, dict: Record<string, string>): string | null {
  return BY_KEY[key] ?? dict[key] ?? null
}
