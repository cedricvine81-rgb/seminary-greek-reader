// The registries of Texts-library works that carry OUR OWN Spanish — the single source of
// truth for both the reader (which builds the translation menu from them, before any chapter
// is fetched) and scripts/build-backgrounds-search.ts (which builds the `es` search facet from
// them). They lived in TextsReader.tsx until the search facet needed them too; keeping one copy
// is what stops a work being readable in Spanish but unsearchable, or vice versa.
//
// Three registries rather than one because the works are ADDRESSED differently: an LXX book by
// osisId + chapter, a Josephus work by book + Niese §, an English-only prose work by chapter +
// verse. Each has its own file layout under public/data/ (see the loaders in TextsReader).

/**
 * Deuterocanonical/LXX books carrying our own Spanish, made from the Greek the reader shows.
 * Listed rather than probed because the menu has to be built before any chapter is fetched;
 * add a book here when its first chapter lands in public/data/deutero-es/.
 *   → public/data/deutero-es/{OsisId}_{chapter}.json   { verses: { "1": "…" } }
 */
export const DEUTERO_ES_BOOKS = new Set(['Tob', 'Jdt', 'Wis', 'Sir', 'Bar', 'EpJer', 'Sus', 'Bel', '1Macc', '2Macc', '1Esd', '3Macc', '4Macc',
  // The Greek-recension books and the two collections no Spanish Bible carries at all.
  'EsthGr', 'DanLXX', 'PsSol', 'Odes'])

/**
 * Works OUTSIDE the LXX that carry our own Spanish, made from the Greek the reader shows.
 * Keyed by catalog work id; the value is the folder under public/data/es/.
 *   → public/data/es/{dir}/{book}.json                 { sections: { "63": "…" } }
 *
 * Registering a work here is what puts "Español (traducción propia)" in its translation menu.
 * Books with no file yet simply leave the column blank, exactly as a Brenton gap does.
 */
export const ES_PROSE_WORKS: Record<string, string> = {
  antiquities: 'josephus/antiquities',
  'jewish-war': 'josephus/jewish-war',
  'against-apion': 'josephus/against-apion',
  life: 'josephus/life',
}

/**
 * English-only prose works that also have our Spanish, addressed by chapter + verse.
 *   → public/data/es/{dir}/{chapter}.json              { verses: { "1": "…" } }
 *
 * 2 Esdras is the only Apocrypha work with no Greek at all — 4 Ezra survives in Latin — so its
 * Spanish is made from the English the reader shows, one remove further from the source than
 * everything else here. The per-chapter file says so, and the interface says so.
 */
export const ES_ENGLISH_PROSE_WORKS: Record<string, string> = {
  '2esdras': 'apocrypha/2esdras',
  // Pseudepigrapha. The ones that survive IN GREEK are translated from that Greek, one remove
  // from the source like everything else here — they land in this registry rather than
  // ES_PROSE_WORKS only because they are addressed by chapter + verse, not book + section.
  // A work whose original is Ethiopic/Slavonic/Syriac has no Greek to work from and its files
  // say so, chapter by chapter, exactly as 2 Esdras does.
  //
  // Registered a work at a time, as its chapters land: an untranslated verse falls back to the
  // English silently, so a half-registered work would read as finished.
  'tp-reuben': 'pseudepigrapha/testaments/reuben',
  'tp-simeon': 'pseudepigrapha/testaments/simeon',
  'tp-levi': 'pseudepigrapha/testaments/levi',
  'tp-judah': 'pseudepigrapha/testaments/judah',
  'tp-issachar': 'pseudepigrapha/testaments/issachar',
  'tp-zebulun': 'pseudepigrapha/testaments/zebulun',
  'tp-dan': 'pseudepigrapha/testaments/dan',
  'tp-naphtali': 'pseudepigrapha/testaments/naphtali',
  'tp-gad': 'pseudepigrapha/testaments/gad',
  'tp-asher': 'pseudepigrapha/testaments/asher',
  'tp-joseph': 'pseudepigrapha/testaments/joseph',
  'tp-benjamin': 'pseudepigrapha/testaments/benjamin',
  'tjob-greek': 'pseudepigrapha/tjob',
  'aristeas': 'pseudepigrapha/aristeas',
  // English-only (Ethiopic original), so at two removes — every chapter file says so in its `_why`.
  '1enoch': 'pseudepigrapha/1enoch',
  // Likewise at two removes: 2 Baruch survives whole only in Syriac (Cod. Ambrosianus), itself a
  // translation of a lost Greek. Charles's English is what the reader shows and what this renders.
  '2baruch': 'pseudepigrapha/2baruch',
  // And 2 Enoch, which survives only in Old Church Slavonic (longer recension) — no Greek either.
  '2enoch': 'pseudepigrapha/2enoch',
  // Latin palimpsest only (itself from a lost Greek), so likewise at two removes. One "verse" per
  // chapter, because Charles prints each chapter as continuous prose and cites it that way.
  'assumption-moses': 'pseudepigrapha/assumption-moses',
  // Greek survives for this one, but the reader shows Craigie's English, so the Spanish comes off
  // the English like the rest here. The two recensions are separate work ids with separate files:
  // A is the long one (20 chapters), B the short one (14), and they differ in order and content.
  'testament-of-abraham-a': 'pseudepigrapha/testament-of-abraham-a',
  'testament-of-abraham-b': 'pseudepigrapha/testament-of-abraham-b',
  // Also Greek-bearing, but the reader shows Conybeare's English, so the Spanish comes off that.
  // Addressed by Conybeare's own section numbers 1-130, NOT by McCown's chapter and verse -- the
  // two numberings do not correspond, so a citation from a modern study needs converting first.
  'testament-of-solomon': 'pseudepigrapha/testament-of-solomon',
  // Greek survives, but the reader shows Hughes's English (Charles 1913), so the Spanish comes off
  // that. Charles sets his verse numbers at the head of a LINE, not a sentence, so verses open
  // mid-clause -- and nine of those numbers were swallowed by the transcription. No text is
  // missing; see the chapter 1 note, which explains why the numbering is left exactly as it stands.
  '3baruch': 'pseudepigrapha/3baruch',
  // The Greek Life of Adam and Eve. Greek survives, but the reader shows Charles's English, so the
  // Spanish comes off that. Same Charles line-head verse numbering as 3 Baruch, with the same
  // swallowed numbers -- see the chapter 13 note. Five verses are empty in the English (18:2, 18:5,
  // 27:1, 29:1, 32:1) and are deliberately left empty in Spanish so the columns correspond.
  'apocmoses': 'pseudepigrapha/apocmoses',
  // The LATIN Life of Adam and Eve -- sister of the Greek one above, telling the same story very
  // differently (the Jordan/Tigris penance and the devil's refusal to worship Adam are only here).
  // No Greek survives for it, so this is at three removes from the lost original. Same Charles
  // line-head numbering, five numbers swallowed -- see the chapter 5 note.
  'lae': 'pseudepigrapha/lae',
}

// Both translation ids mean "the Spanish we made ourselves" and both must carry the same credit
// line. They stay distinct because they load by different keys, not because they are different
// translations.
export const OUR_SPANISH_IDS = new Set(['deutero-es', 'es'])

/** Whether a catalog work has our Spanish at all, by whichever of the three routes. */
export function hasOurSpanish(workId: string, osisId?: string): boolean {
  return (!!osisId && DEUTERO_ES_BOOKS.has(osisId)) || !!ES_PROSE_WORKS[workId] || !!ES_ENGLISH_PROSE_WORKS[workId]
}
