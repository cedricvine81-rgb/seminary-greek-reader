/**
 * Where Brenton's verse numbers do not line up with the Greek beside them.
 *
 * Brenton translated the Septuagint, but his English was numbered in the tradition the KJV
 * Apocrypha follows, and Swete's Greek is numbered in its own. In a handful of chapters they
 * disagree, and because this app pairs the two columns by verse id, the disagreement showed as
 * an English column quietly reporting a different sentence from the Greek beside it. Tobit 5:14
 * printed Raguel's speech about Ananias and Jathan against "what wages shall I give thee? wilt
 * thou a drachm a day" — plausible-looking English, one verse out.
 *
 * THE SHAPE IS ALWAYS THE SAME. A verse exists in the Greek that Brenton does not number
 * separately, and from there on his numbering runs one behind. So a mapping is not a single
 * offset per chapter: the verses BEFORE the divergence line up perfectly and must be left alone,
 * one verse has no English at all, and the rest are shifted. Applying a whole-chapter offset
 * would break the verses that currently work.
 *
 * FOUND BY MEASURING, CONFIRMED BY READING. Verse-length correlation per chapter flagged
 * candidates (scripts/lxx-english-alignment.py); every entry below was then checked by reading
 * both columns, and several flagged chapters were dropped as false positives. Two known
 * divergences are deliberately NOT here, because neither is a shift and guessing would be worse
 * than the honest gap:
 *
 *   1 Esdras 1  drifts mid-chapter — verse 3 pairs correctly, verse 30 is two out. Brenton
 *               splits a verse partway through. Needs a verse-by-verse map, not a rule.
 *   Sirach 30-36 the Greek and English traditions TRANSPOSE whole blocks (Greek 30:25-33:13a
 *               against 33:13b-36:16a). No offset can express that.
 *
 * Only Brenton needs this. The Spanish deuterocanon was translated from the Greek this app
 * shows, so it is aligned to it by construction.
 */

/** Greek verses `from`..`to` take the English verse `offset` away. `to: null` runs to the end. */
interface Span { from: number; to: number | null; offset: number }

/**
 * Keyed by osisId, then Greek chapter. A Greek verse covered by no span has no English — which
 * is the truth, and better shown as an empty column than as its neighbour's sentence.
 */
const ALIGNMENT: Record<string, Record<number, Span[]>> = {
  // v9 (εἰσελθὼν εἶπεν τῷ πατρί — he went in and told his father) is not numbered separately by
  // Brenton; from v10 his numbers run one behind.
  Tob: {
    5: [{ from: 1, to: 8, offset: 0 }, { from: 10, to: null, offset: -1 }],
    // v1 (καὶ ἐπαύσατο κλαίουσα — and she ceased weeping) closes chapter 5 in Brenton.
    6: [{ from: 2, to: null, offset: -1 }],
  },
  // Brenton numbers the letter's superscription as verse 1, where Swete has it as verse 0, so
  // the whole letter is one out. The only clean uniform shift of the four.
  EpJer: {
    1: [{ from: 0, to: null, offset: 1 }],
  },
  // Brenton's chapter opens at what Swete numbers 2, and ends at Swete's 28: his 4 Maccabees 8
  // has 27 verses to Swete's 29, so the first and last Greek verses have no English.
  '4Macc': {
    8: [{ from: 2, to: 28, offset: -1 }],
  },
}

/** Highest verse number worth probing when a span runs to the end of a chapter. */
const MAX_VERSE = 200

export function hasBrentonAlignment(osisId: string): boolean {
  return osisId in ALIGNMENT
}

/**
 * Rewrite a Brenton book, keyed by its own verse ids, into the Greek's numbering — so every
 * consumer can go on looking English up by the Greek verse id it is showing.
 *
 * Chapters with no entry are passed through untouched, which is nearly all of them.
 */
export function alignBrenton(osisId: string, raw: Record<string, string>): Record<string, string> {
  const chapters = ALIGNMENT[osisId]
  if (!chapters) return raw

  const out: Record<string, string> = {}
  const remapped = new Set(Object.keys(chapters))
  for (const [key, text] of Object.entries(raw)) {
    // Drop the chapters we are about to rebuild; keep every other verse exactly as it is.
    const chapter = key.split('.')[1]
    if (!remapped.has(chapter)) out[key] = text
  }

  for (const [chapter, spans] of Object.entries(chapters)) {
    for (const span of spans) {
      const last = span.to ?? MAX_VERSE
      for (let verse = span.from; verse <= last; verse++) {
        const english = raw[`${osisId}.${chapter}.${verse + span.offset}`]
        if (english != null) out[`${osisId}.${chapter}.${verse}`] = english
      }
    }
  }
  return out
}
