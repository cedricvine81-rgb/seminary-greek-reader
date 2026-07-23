/**
 * Matching BGVB headwords to the Tischendorf-tagged GNT corpus.
 *
 * The two sources spell some lemmas differently, so anything that joins BGVB to
 * public/data/gnt (the vocabulary seeder, the frequency builder) must apply the
 * same normalisation — otherwise a word silently loses its Strong's number,
 * frequency, or morphology examples.
 *
 * Pure helpers only: no filesystem, no data imports, safe on the client.
 */

/**
 * Cases accent-insensitive matching can't reach. BGVB tends to print the active
 * headword where the corpus lemmatises a deponent or a -υω form.
 */
export const LEMMA_ALIASES: Record<string, string> = {
  'οἶδα': 'εἴδω',
  'φοβέομαι': 'φοβέω',
  'Μωϋσῆς': 'Μωσεύς',
  'Δαυίδ': 'Δαβίδ',
  'δείκνυμι': 'δεικνύω',
  'ἐπικαλέω': 'ἐπικαλέομαι',
  'προσκαλέω': 'προσκαλέομαι',
  // Middle/passive headwords the corpus files under the other voice
  'ἄρχω': 'ἄρχομαι',
  'ἅπτω': 'ἅπτομαι',
  'ἐκλέγω': 'ἐκλέγομαι',
  'κοιμάομαι': 'κοιμάω',
  'κολλάομαι': 'κολλάω',
  'ἐπαγγέλλομαι': 'ἐπαγγέλλω',
  'προσλαμβάνομαι': 'προσλαμβάνω',
  'ἐκπλήσσομαι': 'ἐκπλήσσω',
  'συνίστημι': 'συνιστάω',
  'πίμπλημι': 'πλήθω',
  'γρηγορέω': 'γρηγορεύω',
  'νοέω': 'νοιέω',
  // Substantive / adverbial forms carried as their own corpus lemma
  'ἱερός': 'ἱερόν',      // BGVB glosses this "temple"
  'ταχύς': 'ταχύ',
  'ὕστερος': 'ὕστερον',
  'πρότερος': 'πρότερον',
  'δεσμός': 'δεσμόν',
  'δάκρυον': 'δάκρυ',
  'μέλει': 'μέλω',
  'ἀμφότεροι': 'ἀμφότερος',
  // Spelling conventions (Tischendorf vs modern critical editions)
  'τεσσεράκοντα': 'τεσσαράκοντα',
  'Καφαρναούμ': 'Καπερναούμ',
  'κράβαττος': 'κράββατος',
  'Ἰσκαριώθ': 'Ἰσκαριώτης',
  'χρυσοῦς': 'χρύσεος',
  'ἔνατος': 'ἔννατος',
}

/** Strip accents/breathings for a last-resort match (ἀποθνῄσκω ↔ ἀποθνήσκω). */
export const unaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-͂ͅʹ·]/g, '').normalize('NFC').toLowerCase()

/**
 * BGVB prints the movable nu as "ἔξεστι(ν)" — the only parenthetical headword in
 * the list. Strip it so the lemma joins with the corpus and the parsing pool.
 */
export const normaliseLexeme = (w: string) => w.replace(/\(ν\)$/, '')

/**
 * Look up a BGVB headword in a corpus index.
 *
 * Alias FIRST, then exact, then unaccented. The order matters: several headwords
 * exist in the corpus under their own spelling but with a different sense from
 * BGVB's entry — BGVB's ἱερός is glossed "temple" (corpus ἱερόν, 72×) while the
 * corpus's own ἱερός is the adjective "sacred" (2×), and ἄρχω is listed for the
 * middle "begin" (corpus ἄρχομαι, 85×) not the active "rule" (2×). An exact-first
 * order silently returns the wrong word's count.
 */
export function matchLemma<T>(
  index: Map<string, T>,
  bareIndex: Map<string, T>,
  headword: string,
): T | undefined {
  const lemma = normaliseLexeme(headword)
  const alias = LEMMA_ALIASES[lemma]
  return (alias ? index.get(alias) : undefined)
    ?? index.get(lemma)
    ?? bareIndex.get(unaccent(lemma))
}
