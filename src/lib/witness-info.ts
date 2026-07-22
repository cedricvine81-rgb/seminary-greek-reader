// Reference metadata for the New Testament manuscript witnesses shown in the Exegesis
// "Variants" tab, used to fill the per-witness info popup (date, provenance, contents,
// significance). Keyed by CNTR file id (`wid`) — the same id carried on each collation row.
//
// The transcriptions themselves come from the Center for New Testament Restoration
// (CC BY-SA 4.0); this descriptive metadata is hand-curated from standard references
// (INTF Kurzgefasste Liste, Metzger–Ehrman, Aland & Aland, Comfort & Barrett). The major
// witnesses are described in full; anything not listed falls back to a generic entry
// derived from its siglum + text-family (see `witnessInfo`).

export type WitnessFamily = 'byzantine' | 'alexandrian' | 'western' | 'mixed' | 'critical' | 'other'

export interface WitnessInfo {
  sigil: string
  name: string
  ga?: string          // Gregory-Aland number
  date: string         // approximate date
  provenance: string   // where written / found, present home
  contents: string     // NT coverage
  family: WitnessFamily
  importance: string   // one or two sentences on why it matters
}

export const FAMILY_LABEL: Record<WitnessFamily, string> = {
  byzantine: 'Byzantine',
  alexandrian: 'Alexandrian',
  western: 'Western',
  mixed: 'Mixed / Caesarean',
  critical: 'Critical / edition',
  other: 'Other',
}

// Family accent colours — kept in sync with the legend in VariantsView.
export const FAMILY_COLOR: Record<WitnessFamily, string> = {
  byzantine: '#b45309',    // amber-700
  alexandrian: '#1d4ed8',  // blue-700
  western: '#be185d',      // pink-700
  mixed: '#7c3aed',        // violet-600
  critical: '#0d9488',     // teal-600
  other: '#6b7280',        // gray-500
}

export const WITNESS_INFO: Record<string, WitnessInfo> = {
  RP: {
    sigil: '𝔐', name: 'Byzantine Majority Text (Robinson–Pierpont)', date: 'tradition of 5th–15th c.',
    provenance: 'The reading of the great majority of later Greek manuscripts.',
    contents: 'Entire New Testament', family: 'byzantine',
    importance: 'Shown here as the reference line: the text of the Byzantine majority, against which each early witness is compared. Underlined words are where a witness departs from it.',
  },
  SR: {
    sigil: 'SR', name: 'Statistical Restoration (Bunning)', date: '2022 (computer-generated)',
    provenance: 'CNTR — an algorithmic reconstruction weighing the earliest manuscript evidence.',
    contents: 'Entire New Testament', family: 'critical',
    importance: 'A modern, reproducible critical text built statistically from the early witnesses; close to NA/UBS. A useful "critical" reference to compare against.',
  },
  WH: {
    sigil: 'WH', name: 'Westcott–Hort (1881)', date: '1881',
    provenance: 'The New Testament in the Original Greek, by B. F. Westcott and F. J. A. Hort.',
    contents: 'Entire New Testament', family: 'critical',
    importance: 'The landmark 19th-century critical edition that broke the dominance of the Textus Receptus and leans heavily on ℵ and B.',
  },
  KJTR: {
    sigil: 'TR', name: 'Textus Receptus (Scrivener / KJV)', date: '1550–1894 (Byzantine tradition)',
    provenance: 'The printed Greek text underlying the King James Version.',
    contents: 'Entire New Testament', family: 'critical',
    importance: 'The "Received Text" of the Reformation era, close to the Byzantine majority; the basis of the KJV and a foil to the modern critical text.',
  },
  '01': {
    sigil: 'ℵ', name: 'Codex Sinaiticus', ga: '01', date: 'c. 330–360 (4th c.)',
    provenance: 'Written in Egypt or Caesarea; found at St Catherine’s Monastery, Sinai. Now mostly in the British Library.',
    contents: 'Complete New Testament (plus Barnabas, Hermas)', family: 'alexandrian',
    importance: 'One of the two oldest complete New Testaments and a foremost Alexandrian witness; a primary basis of the modern critical text.',
  },
  '02': {
    sigil: 'A', name: 'Codex Alexandrinus', ga: '02', date: '5th c.',
    provenance: 'Egypt; given to Charles I in 1627. Now in the British Library.',
    contents: 'Most of the New Testament (Gospels lacunose)', family: 'byzantine',
    importance: 'Byzantine in the Gospels but Alexandrian elsewhere — an early witness to the mixed state of the text and important for Revelation.',
  },
  '03': {
    sigil: 'B', name: 'Codex Vaticanus', ga: '03', date: 'c. 300–325 (4th c.)',
    provenance: 'Egypt; in the Vatican Library since at least 1475.',
    contents: 'Most of the Bible (NT ends at Heb 9:14; lacks Pastorals, Rev)', family: 'alexandrian',
    importance: 'Widely regarded as the single most important New Testament manuscript — an exceptionally careful Alexandrian text and a cornerstone of the critical edition.',
  },
  '04': {
    sigil: 'C', name: 'Codex Ephraemi Rescriptus', ga: '04', date: '5th c.',
    provenance: 'A palimpsest (overwritten in the 12th c. with Ephrem’s sermons). Now in Paris.',
    contents: 'Portions of most NT books', family: 'alexandrian',
    importance: 'A recovered palimpsest preserving a largely Alexandrian text with Byzantine mixture; valuable where the earlier codices are lacunose.',
  },
  '05': {
    sigil: 'D', name: 'Codex Bezae Cantabrigiensis', ga: '05', date: 'c. 400 (5th c.)',
    provenance: 'Greek–Latin bilingual; given to Cambridge by Theodore Beza in 1581.',
    contents: 'Gospels and Acts (with gaps)', family: 'western',
    importance: 'The chief Greek witness to the “Western” text, notable for striking additions and omissions — especially its longer, distinctive text of Acts.',
  },
  '032': {
    sigil: 'W', name: 'Codex Washingtonianus (Freer Gospels)', ga: '032', date: 'late 4th–early 5th c.',
    provenance: 'Egypt; acquired by C. L. Freer in 1906. Smithsonian, Washington D.C.',
    contents: 'The four Gospels', family: 'mixed',
    importance: 'A block-mixed text whose type changes book by book; includes the unique “Freer Logion” after Mark 16:14.',
  },
  P45: {
    sigil: '𝔓45', name: 'Chester Beatty Papyrus I', ga: 'P45', date: '3rd c.',
    provenance: 'Egypt; Chester Beatty Library, Dublin (one leaf in Vienna).',
    contents: 'Gospels and Acts (fragmentary)', family: 'mixed',
    importance: 'The earliest substantial witness to bring the four Gospels and Acts together; its text is independent, often close to the “Caesarean” group.',
  },
  P46: {
    sigil: '𝔓46', name: 'Chester Beatty Papyrus II', ga: 'P46', date: 'c. 175–225 (2nd–3rd c.)',
    provenance: 'Egypt; Chester Beatty Library, Dublin and Univ. of Michigan.',
    contents: 'Pauline Epistles (with Hebrews, before Corinthians)', family: 'alexandrian',
    importance: 'The oldest substantial copy of the Pauline corpus by roughly a century, and a leading early witness to the text of Paul.',
  },
  P47: {
    sigil: '𝔓47', name: 'Chester Beatty Papyrus III', ga: 'P47', date: 'late 3rd c.',
    provenance: 'Egypt; Chester Beatty Library, Dublin.',
    contents: 'Revelation 9–17', family: 'alexandrian',
    importance: 'The earliest substantial manuscript of Revelation and a key witness to its notoriously difficult text.',
  },
  P52: {
    sigil: '𝔓52', name: 'Rylands Library Papyrus P52', ga: 'P52', date: 'c. 125–175 (2nd c.)',
    provenance: 'Egypt; John Rylands Library, Manchester.',
    contents: 'John 18:31–33, 37–38 (a scrap)', family: 'alexandrian',
    importance: 'Often cited as the earliest known fragment of any New Testament text — evidence that John circulated in Egypt within decades of its composition.',
  },
  P66: {
    sigil: '𝔓66', name: 'Papyrus Bodmer II', ga: 'P66', date: 'c. 200 (late 2nd–early 3rd c.)',
    provenance: 'Egypt; Bodmer Library, Cologny (Geneva).',
    contents: 'John (nearly complete)', family: 'alexandrian',
    importance: 'One of the earliest near-complete books of the NT; a heavily corrected Alexandrian text that shows a working scribe at his craft.',
  },
  P72: {
    sigil: '𝔓72', name: 'Papyrus Bodmer VII–VIII', ga: 'P72', date: '3rd–4th c.',
    provenance: 'Egypt; Bodmer Library and the Vatican.',
    contents: '1–2 Peter, Jude (complete)', family: 'alexandrian',
    importance: 'The earliest copies of 1–2 Peter and Jude, complete — a uniquely early witness to the text of these letters.',
  },
  P75: {
    sigil: '𝔓75', name: 'Papyrus Bodmer XIV–XV', ga: 'P75', date: 'c. 175–225 (early 3rd c.)',
    provenance: 'Egypt; now in the Vatican Library.',
    contents: 'Large parts of Luke and John', family: 'alexandrian',
    importance: 'Its text is remarkably close to Vaticanus, proving the Alexandrian text is an early, carefully copied tradition rather than a later scholarly recension.',
  },
  P5: {
    sigil: '𝔓5', name: 'Oxyrhynchus Papyrus 208+1781', ga: 'P5', date: '3rd c.',
    provenance: 'Oxyrhynchus, Egypt; British Library.',
    contents: 'Portions of John', family: 'alexandrian',
    importance: 'An early Alexandrian witness to John, valuable alongside 𝔓66 and 𝔓75.',
  },
}

// Return the info for a witness, falling back to a generic entry built from what the
// collation row already tells us (siglum + family) when it isn't individually curated.
export function witnessInfo(wid: string, sigil: string, family: WitnessFamily): WitnessInfo {
  const hit = WITNESS_INFO[wid]
  if (hit) return hit
  const isPapyrus = /^𝔓|^P\d/.test(sigil) || wid.startsWith('P')
  const kind = isPapyrus ? 'papyrus' : 'majuscule (uncial)'
  const ga = wid.startsWith('P') ? wid : /^\d/.test(wid) ? wid : undefined
  return {
    sigil, name: `Greek ${kind} ${sigil}`, ga,
    date: isPapyrus ? '2nd–4th c. (early)' : '4th–9th c.',
    provenance: 'See the Center for New Testament Restoration for full manuscript data.',
    contents: 'Fragmentary — see the readings shown here.',
    family,
    importance: `An early ${FAMILY_LABEL[family].toLowerCase()} witness included in the CNTR corpus of manuscripts up to c. 400.`,
  }
}
