// Short, balanced "why this matters" notes for landmark New Testament textual variants,
// surfaced in the Exegesis "Variants" tab on the verse where the variation unit begins.
// Keyed by "Osis.chapter.verse" (the OSIS ids used by the collation data). Notes are written
// to be descriptive and non-partisan — what the variant is, who attests it, why it's discussed
// — not to argue for a reading. Curated from standard references (Metzger's Textual Commentary,
// the UBS/NA apparatus, Comfort's New Testament Text and Translation Commentary).

export interface VariantNote {
  title: string   // short label, may note the verse range
  note: string    // 1–3 sentences
}

export const VARIANT_NOTES: Record<string, VariantNote> = {
  'Matt.5.22': {
    title: '“angry without cause”',
    note: 'Many witnesses add εἰκῇ (“without cause”) after “angry with his brother,” softening the saying; ℵ* B and early witnesses omit it. Most modern editions treat the shorter reading as original.',
  },
  'Matt.6.13': {
    title: 'The Lord’s Prayer doxology',
    note: 'The closing “for thine is the kingdom, and the power, and the glory, forever. Amen” is absent from the earliest witnesses (ℵ B D) and is generally regarded as a liturgical expansion; it stands in the Byzantine text and the KJV.',
  },
  'Mark.1.1': {
    title: '“Son of God”',
    note: 'The words υἱοῦ θεοῦ (“Son of God”) at the head of Mark are present in B D and many witnesses but absent from ℵ* and others — a debated case where an accidental omission of the sacred names and a scribal addition are both plausible.',
  },
  'Mark.16.9': {
    title: 'The longer ending of Mark (16:9–20)',
    note: 'The twelve verses after 16:8 are missing from ℵ and B (the oldest complete witnesses) and marked or replaced in others; most scholars judge them a later addition, though they are traditional and appear in the Byzantine text and KJV.',
  },
  'Luke.22.43': {
    title: 'The agony in the garden (22:43–44)',
    note: 'The angel strengthening Jesus and his sweat “like drops of blood” are absent from 𝔓75 ℵ¹ B and marked with doubt in others; the passage is early and widely attested but its originality is contested.',
  },
  'Luke.23.34': {
    title: '“Father, forgive them”',
    note: 'Jesus’ prayer from the cross is omitted by 𝔓75 ℵ¹ B D* and others yet present in most witnesses — an unusually strong split for a beloved saying, making it a classic disputed reading.',
  },
  'John.1.18': {
    title: 'μονογενὴς θεός vs. υἱός',
    note: '𝔓66 𝔓75 ℵ B C read “the only-begotten God” (θεός); the Byzantine text, A and others read “the only-begotten Son” (υἱός). The choice bears directly on Johannine Christology and is one of the most-discussed variants in the Gospel.',
  },
  'John.5.3': {
    title: 'The angel at the pool (5:3b–4)',
    note: 'The explanation that an angel troubled the water is absent from the earliest witnesses (𝔓66 𝔓75 ℵ B) and is widely regarded as a later gloss clarifying verse 7.',
  },
  'John.7.53': {
    title: 'The woman caught in adultery (7:53–8:11)',
    note: 'This celebrated passage is absent from 𝔓66 𝔓75 ℵ B and the earliest witnesses, appears at different places in the manuscript tradition, and is generally judged a later insertion — though it is widely held to preserve an authentic tradition.',
  },
  'Acts.8.37': {
    title: 'The eunuch’s confession',
    note: 'The eunuch’s explicit confession of faith is absent from the earliest and best witnesses (𝔓45 𝔓74 ℵ A B) and is regarded as a Western expansion reflecting early baptismal practice; the KJV includes it.',
  },
  'Rom.5.1': {
    title: 'ἔχομεν vs. ἔχωμεν',
    note: 'A single-letter difference: “we have peace” (indicative, ἔχομεν) or “let us have peace” (subjunctive, ἔχωμεν). The early witnesses (ℵ* A B* C D) favor the subjunctive, but sense and context lead most editors to print the indicative — a textbook case of external vs. internal evidence.',
  },
  '1Cor.14.34': {
    title: 'Placement of vv. 34–35',
    note: 'The verses on women keeping silence appear after v. 40 in the Western witnesses (D F G), prompting debate over whether they are a displacement or a later marginal note incorporated into the text.',
  },
  'Eph.1.1': {
    title: '“in Ephesus”',
    note: 'The words ἐν Ἐφέσῳ are absent from 𝔓46 ℵ* B*, suggesting the letter may have circulated as an encyclical without a named destination.',
  },
  '1Tim.3.16': {
    title: 'θεός vs. ὅς',
    note: 'The Byzantine text reads “God was manifested in the flesh” (θεός), while the earliest witnesses (ℵ* A* C*) read “who/he who” (ὅς). The variant turns on a tiny difference between the nomen-sacrum abbreviation ΘΣ and ΟΣ and has large Christological weight.',
  },
  '1John.5.7': {
    title: 'The Comma Johanneum (5:7–8)',
    note: 'The explicit Trinitarian words (“the Father, the Word, and the Holy Spirit…”) appear in no Greek manuscript before the late medieval period and are absent from every early witness; they entered the printed text via the Textus Receptus and the KJV.',
  },
  'Rev.22.19': {
    title: '“book of life” vs. “tree of life”',
    note: 'The Textus Receptus reads “book of life,” but the Greek manuscripts read “tree of life” (ξύλου) — a reading Erasmus reconstructed from the Latin here, since he lacked the Greek for the end of Revelation.',
  },
}
