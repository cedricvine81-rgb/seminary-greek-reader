// Near-synonym sets for allusion matching, keyed by Strong's number.
//
// Why this exists: the allusion engine matches on Strong's identity, and a NT author quoting
// the LXX often reaches for a neighbouring word rather than the identical one. Mark 1:2 has
// ἀποστέλλω τὸν ἄγγελόν μου; Malachi 3:1 LXX has ἐξαποστελῶ — the same idea, a different
// Strong's, and so an invisible match. Turning synonyms on lets one stand in for the other.
//
// DELIBERATELY CONSERVATIVE, and off by default. Deriving families mechanically (same root
// after stripping a preverb) over-reaches badly: it puts ἀντιλέγω "contradict" and ἐκλέγω
// "choose" in with λέγω "say", which would manufacture matches a reader would have to spend
// time rejecting. Every set below is hand-checked, and every Strong's number was resolved
// from the tagged GNT (public/data/phrase-tree) rather than typed from memory.
//
// A synonym match is weaker evidence than an identical lemma, so the engine scores it lower
// and the UI marks it — the student should always be able to see that a match was inexact.
//
// Extending this is an editorial act, not a coding one: add a set only where the two words
// would be interchangeable in the kind of citation you are hunting.

/** Groups of Strong's numbers treated as interchangeable when synonyms are enabled. */
export const SYNONYM_SETS: string[][] = [
  ['649', '1821'],            // ἀποστέλλω / ἐξαποστέλλω — send, send out (Mal 3:1 vs Mark 1:2)
  ['191', '1522'],            // ἀκούω / εἰσακούω — hear, hearken (the LXX's usual pairing)
  ['2564', '1941'],           // καλέω / ἐπικαλέω — call, call upon
  ['2896', '349', '994'],     // κράζω / ἀνακράζω / βοάω — cry out (Isa 40:3 βοῶντος)
  ['2476', '450', '1453'],    // ἵστημι / ἀνίστημι / ἐγείρω — stand, raise up
  ['4982', '1295'],           // σῴζω / διασῴζω — save, bring safely through
  ['3708', '991'],            // ὁράω / βλέπω — see
  ['2980', '3004'],           // λαλέω / λέγω — speak, say
  ['4198', '1607', '1531'],   // πορεύομαι / ἐκπορεύομαι / εἰσπορεύομαι — go, go out, go in
  ['1325', '1929'],           // δίδωμι / ἐπιδίδωμι — give
]

// Strong's → every number in its set(s). Built once; a number may sit in more than one set.
const INDEX = new Map<string, Set<string>>()
for (const set of SYNONYM_SETS) {
  for (const s of set) {
    const bucket = INDEX.get(s) ?? new Set<string>([s])
    for (const other of set) bucket.add(other)
    INDEX.set(s, bucket)
  }
}

/** The Strong's numbers that may stand in for `s` — always including `s` itself. */
export function synonymsOf(s: string): Set<string> {
  return INDEX.get(s) ?? new Set([s])
}

/** Does `candidate` satisfy a search for `wanted`, allowing synonyms? */
export function matchesStrongs(wanted: string, candidate: string, useSynonyms: boolean): boolean {
  if (wanted === candidate) return true
  return useSynonyms && (INDEX.get(wanted)?.has(candidate) ?? false)
}

/** True when the two are related but not identical — the UI marks these as inexact. */
export function isSynonymMatch(wanted: string, candidate: string): boolean {
  return wanted !== candidate && (INDEX.get(wanted)?.has(candidate) ?? false)
}
