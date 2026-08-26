/**
 * Every corpus this app ships, and who to thank for it.
 *
 * WHY A REGISTRY AND NOT JUST THE POPOVERS. Each work already carries its own attribution, shown
 * in the reader's "Sources & copyright" — but only while that work is open. A reader who wants to
 * know what the app is built on, or an editor checking a licence before adding something, had
 * nowhere to look. This is that one place, and it is deliberately at SOURCE level: the per-work
 * strings (119 of them) answer "who translated this page", which is a different question.
 *
 * WHAT AN ENTRY MUST SAY. Who made the text, when, and under what terms we may show it. Where a
 * licence requires attribution by name (CC-BY, CC-BY-SA) that name is not optional and the entry
 * is the place the requirement is met. Where the text is public domain we still say whose it is,
 * because "public domain" names a legal status, not a translator.
 *
 * The prose lives in messages.ts under `sources.<id>.body`, so it is translated with the rest of
 * the interface rather than being English-only in a Spanish app. This file holds only the shape.
 */

export interface SourceCredit {
  id: string
  /** Which part of the app it feeds — the page groups by this. */
  group: 'scripture' | 'literature' | 'commentary' | 'reference'
  /** Set where the licence names a condition beyond attribution (share-alike, non-commercial). */
  licence?: string
  /** Where it came from, for anyone who wants to go to the source itself. */
  url?: string
}

export const SOURCE_CREDITS: SourceCredit[] = [
  // ── The biblical text ───────────────────────────────────────────────────────────────
  { id: 'mt', group: 'scripture', url: 'https://hb.openscriptures.org' },
  { id: 'na1904', group: 'scripture' },
  // Swete via First1KGreek. CC BY-SA: attribution is required and share-alike attaches to the
  // derived indexes built from it (construct, search shards, lemma-forms). Replaced the previous
  // Rahlfs/CATSS data, which was CC BY-NC-SA and so blocked by the paid tier. See docs/provenance.md.
  { id: 'lxx', group: 'scripture', licence: 'CC BY-SA 4.0', url: 'https://github.com/nathans/lxx-swete' },
  { id: 'brenton', group: 'scripture' },
  { id: 'web', group: 'scripture' },
  { id: 'bsb', group: 'scripture' },
  { id: 'ourSpanish', group: 'scripture' },
  { id: 'variants', group: 'scripture', licence: 'CC BY-SA 4.0', url: 'https://greekcntr.org' },
  { id: 'sp', group: 'scripture' },

  // ── Ancient literature ──────────────────────────────────────────────────────────────
  { id: 'josephus', group: 'literature', licence: 'CC BY-SA 4.0', url: 'https://www.perseus.tufts.edu' },
  { id: 'philo', group: 'literature' },
  { id: 'apostolicFathers', group: 'literature' },
  { id: 'anf', group: 'literature' },
  { id: 'eusebius', group: 'literature' },
  { id: 'pseudepigrapha', group: 'literature' },
  { id: 'grecoRoman', group: 'literature', licence: 'CC BY-SA 4.0', url: 'https://www.perseus.tufts.edu' },
  { id: 'mishnah', group: 'literature', licence: 'CC BY 4.0', url: 'https://www.sefaria.org' },
  { id: 'yerushalmi', group: 'literature', licence: 'CC BY 4.0', url: 'https://www.sefaria.org' },
  { id: 'targums', group: 'literature', url: 'https://www.sefaria.org' },

  // ── Commentary and analysis ─────────────────────────────────────────────────────────
  { id: 'keil', group: 'commentary' },
  { id: 'robertson', group: 'commentary' },
  { id: 'alford', group: 'commentary' },
  { id: 'bengel', group: 'commentary' },
  { id: 'bullinger', group: 'commentary' },
  { id: 'evans', group: 'commentary' },

  // ── Reference data ──────────────────────────────────────────────────────────────────
  { id: 'bdb', group: 'reference' },
  { id: 'lsj', group: 'reference' },
  { id: 'strongs', group: 'reference' },
  { id: 'jastrow', group: 'reference' },
  { id: 'macula', group: 'reference', licence: 'CC BY 4.0', url: 'https://github.com/Clear-Bible' },
  { id: 'places', group: 'reference', licence: 'CC BY-SA 4.0', url: 'https://www.perseus.tufts.edu' },
]

export const SOURCE_GROUPS = ['scripture', 'literature', 'commentary', 'reference'] as const
