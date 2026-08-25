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
  // Survives whole only in Ethiopic (Greek in fragments), so the Spanish is off Charles's English
  // at two removes. Three verse numbers were swallowed, and here the proof is visible: the "8.",
  // "18." and "40." sit inline inside 4:7, 8:17 and 11:39, so those verses are FUSED, not missing.
  'ascension-of-isaiah': 'pseudepigrapha/ascension-of-isaiah',
  // Pseudo-Philo, Liber Antiquitatum Biblicarum. No Greek survives: the book comes down in a
  // LATIN version made from a lost Greek that itself rendered a Hebrew original, so this is at
  // two removes from the surviving text and four from the original. The reader shows M. R.
  // James's 1917 English and the Spanish comes off that. 65 chapters, 575 verses, no gaps and
  // nothing to repair -- but the Latin is damaged in places and those defects are FLAGGED IN
  // THE CHAPTER NOTES, NOT MENDED: a lost leaf at 37:1, meaningless roman numerals at 14:3,
  // missing words at 44:8, an unrecoverable word at 56:1, and fused verse numbers printed
  // inline inside 13:2, 58:3 and 62:10 -- those chapters therefore have FEWER verse keys than
  // their last verse number, exactly as the English does. The book breaks off mid-sentence at
  // 65:5; that is the manuscript, not an omission.
  'pseudo-philo': 'pseudepigrapha/pseudo-philo',
  // Jubilees. Nothing survives whole in Hebrew or Greek: the complete text is ETHIOPIC, made
  // from a lost Greek that itself rendered a Hebrew original -- of which Qumran did yield
  // fragments, the proof that the book is Hebrew and old. The reader shows Charles's English
  // off that Ethiopic, so the Spanish is at two removes; every chapter file says so in `_why`.
  // 50 chapters, 1,228 verses. THE NUMBERING GAPS ARE NOT DAMAGE and nothing was mended: they
  // were checked one by one and no text is missing anywhere. Two causes, both explained in the
  // chapter notes. (1) Charles sets his verse numbers at the head of a printed LINE, not a
  // sentence, so verses open mid-clause and the transcription lost some of those numbers --
  // chapters 18 and 39 therefore START AT VERSE 3, with vv. 1-2 folded into that key. (2) In
  // other places Charles himself prints two numbers together inline ("28, 29", "4,5"), so those
  // verses are FUSED and the chapter has fewer keys than its highest verse number. The Spanish
  // mirrors the English key set exactly, gaps and all. A parity check that assumes contiguous
  // numbering fires falsely on 30 of the 50 chapters.
  jubilees: 'pseudepigrapha/jubilees',
  // Odes of Solomon. The oldest surviving collection of Christian hymns outside the NT. No
  // complete original: the text is SYRIAC (Harris's 1909 manuscript plus a second found later),
  // with five odes quoted in COPTIC in the Pistis Sophia (1, 5, 6, 22, 25), one passage in LATIN
  // in Lactantius (ode 19), and ode 11 in GREEK in Bodmer Papyrus XI -- found in 1955, after
  // Harris, so his English (and therefore this Spanish) does not reflect it; the Greek of ode 11
  // is also LONGER than the Syriac, and the extra passage after v.16 is simply not here.
  // The reader shows Harris's English, so the Spanish is at two removes; every file says so.
  // 42 odes, 507 verses. THREE THINGS THAT LOOK LIKE GAPS AND ARE NOT: ode 2 is a single record
  // reading "( No part of this Ode has ever been identified.)" -- the ode is genuinely LOST and
  // that line is Harris's own note; ode 3 starts at verse 2 because its opening is lost; ode 1
  // has only 4 verses because it survives solely in the Pistis Sophia. What WAS real damage --
  // three OCR'd verse numbers -- is fixed upstream by scripts/fix-odes-verse-numbers.py, which
  // is idempotent; the corpus JSON carries `_verseNumbersRepaired`. Do not re-diagnose from the
  // old "157 missing verses" figure: that was an artifact of a bogus record numbered 181 in
  // ode 8 inflating the chapter's range, and 163 of those "gaps" never existed.
  'odes-of-solomon': 'pseudepigrapha/odes-of-solomon',
  // Sibylline Oracles. Milton S. Terry's 1899 English, from Wikisource. 12 books numbered 1-8 and
  // 11-14 · 5,059 lines. Books 9-10 are missing in EVERY edition (their material duplicated the
  // others), so that is not a gap in our data — do not go looking for them.
  //
  // ⚠ THE GREEK IS IN THE APP BUT DOES NOT LINE UP. `sibylline-greek` (Geffcken via Open Greek and
  // Latin) is a separate catalogue work and is `greekOnly` by product decision. Its LINE NUMBERING
  // DOES NOT CORRESPOND to the English: Terry translates into English BLANK VERSE, so his lines
  // follow English metre, not the Greek hexameter. A citation of the Greek does not land on the
  // same line here. Every Spanish file says so in `_why`.
  //
  // The corpus needed repair first — see scripts/fix-sibylline-wikisource-css.py (idempotent, two
  // guards): 18 lines of leaked TemplateStyles CSS and 430 orphaned `[` footnote anchors. Left
  // alone as genuine: the 24 lines whose whole text is "." are Terry's mark of a LACUNA in the
  // Greek, and 2:185 carries an orphaned `]` whose opener was never transcribed.
  //
  // Note on parity: Spanish here runs LONGER than the English (ratios 1.01-1.08), the opposite of
  // the prose works, because English blank verse is terser than Spanish. A ratio above 1 is normal
  // for this work and is not a fault.
  sibylline: 'pseudepigrapha/sibylline',
  // Joseph and Aseneth. The English the reader shows was REPLACED before this was translated: the
  // rendering served here before had no recorded translator and its provenance was never
  // established, and it also concatenated an archaic and a modern version inside single verse
  // records. It is now E. W. Brooks (SPCK 1918), public domain, so the Spanish comes off Brooks at
  // two removes from the Greek. See scripts/build-josaseneth-brooks.py.
  //
  // ⚠ VERSE NUMBERING MOVED IN SIX CHAPTERS. Brooks prints continuous prose with no verse numbers
  // at all, so the divisions are editorial. Twenty-three chapters keep the old boundaries and old
  // citations still resolve; chs 11, 17, 18, 19, 20 and 22 do not, because the old text there was
  // a stub or a truncation with nowhere to put Brooks's full text (ch 11 was ONE verse for the
  // whole chapter; ch 22 omitted Jacob's entire description). The English `_note` lists all six.
  //
  // Brooks marks words supplied from the versions with half-brackets. They could not be recovered
  // from the scan and are reproduced in neither language — said in the attribution and in `_note`.
  josaseneth: 'pseudepigrapha/josaseneth',
  // PHILO. Yonge's 1854-55 English is what the reader shows and what this renders, so the Spanish
  // is at two removes: Philo survives in Greek and the app displays that Greek beside it, but the
  // Greek is a separate digital edition (First1KGreek) and is NOT what was translated. Where
  // Yonge paraphrases or compresses, the Spanish follows him.
  //
  // Section numbers are Cohn-Wendland's — the standard way Philo is cited — and are untouched, so
  // an academic citation still resolves. A Philo "chapter" is a BOOK of the treatise, so
  // single-book works live at .../1.json.
  //
  // 36 treatises, ~4.65M characters of English: this is by far the largest corpus in the project
  // and lands one treatise at a time. Register each ONLY when every section of every book exists.
  'philo-contemplative': 'philo/contemplative',
  'philo-good-person': 'philo/good-person',
  'philo-creation': 'philo/creation',
  'philo-giants': 'philo/giants',
  'philo-hypothetica': 'philo/hypothetica',
  'philo-sobriety': 'philo/sobriety',
  'philo-cherubim': 'philo/cherubim',
  'philo-joseph': 'philo/joseph',
  'philo-planter': 'philo/planter',
  'philo-unchangeable': 'philo/unchangeable',
  'philo-decalogue': 'philo/decalogue',
  'philo-husbandry': 'philo/husbandry',
  'philo-flaccus': 'philo/flaccus',
  'philo-eternity': 'philo/eternity',
  'philo-sacrifices': 'philo/sacrifices',
  'philo-rewards': 'philo/rewards',
  'philo-spec-laws': 'philo/spec-laws',
  'philo-confusion': 'philo/confusion',
  'philo-posterity': 'philo/posterity',
  'philo-flight': 'philo/flight',
  'philo-worse': 'philo/worse',
  'philo-drunkenness': 'philo/drunkenness',
  'philo-congress': 'philo/congress',
  'philo-migration': 'philo/migration',
  'philo-providence': 'philo/providence',
  'philo-world': 'philo/world',
  'philo-fragments': 'philo/fragments',
  'philo-names': 'philo/names',
  'philo-virtues': 'philo/virtues',
  'philo-abraham': 'philo/abraham',
  'philo-heir': 'philo/heir',
  'philo-embassy': 'philo/embassy',
  'philo-dreams': 'philo/dreams',
  'philo-qg': 'philo/qg',
  'philo-alleg-interp': 'philo/alleg-interp',
  'philo-moses': 'philo/moses',
  // GRECO-ROMAN WORKS. Translated from the GREEK the reader shows (Perseus editions) — the
  // public-domain English beside it (Long, Jowett, …) is consulted only for proper names,
  // the same rule as Josephus. Chapter-addressed, so they live in this registry. Register
  // each work ONLY when every chapter exists — a half-registered work falls back to the
  // English silently and reads as finished.
  'greco-epictetus-enchiridion': 'greco/epictetus-enchiridion',
  'greco-epictetus-discourses-1': 'greco/epictetus-discourses-1',
  'greco-epictetus-discourses-2': 'greco/epictetus-discourses-2',
  'greco-epictetus-discourses-3': 'greco/epictetus-discourses-3',
  'greco-epictetus-discourses-4': 'greco/epictetus-discourses-4',
  // Plato catalog ids are the bare slugs (no 'greco-' prefix, unlike Epictetus).
  'plato-apology': 'greco/plato-apology',
  'plato-crito': 'greco/plato-crito',
  'plato-phaedo': 'greco/plato-phaedo',
  'plato-symposium': 'greco/plato-symposium',
  'plato-timaeus': 'greco/plato-timaeus',
  // TARGUM ISAIAH. The targum is in ARAMAIC, but the reader does not show that Aramaic: it shows
  // C. W. H. Pauli's 1871 English ("The Chaldee Paraphrase on the Prophet Isaiah"), and the
  // Spanish comes off that English, exactly as Philo's came off Yonge — at TWO REMOVES from the
  // surviving text. Every chapter file says so in its `_why`. Where Pauli paraphrases or reads
  // the Aramaic in a way now disputed, the Spanish follows him; nothing is corrected against the
  // Aramaic or completed from the Hebrew.
  //
  // ⚠ THE VERSIFICATION IS THE HEBREW ONE, not the one Spanish Bibles use. Chapter 8 runs to 23
  // verses (Isa 9:1 of a Spanish Bible is 8:23 here) and chapter 9 to 20, so the great messianic
  // verse cited as 9:6 is 9:5 here. Likewise ch 63 ends with what Spanish Bibles print as 64:1,
  // so chapter 64 has 11 verses and is offset by one throughout. The chapter notes say so at
  // both places; the numbering is the corpus's and is left untouched, since it is how the targum
  // is cited.
  //
  // 66 chapters, 1,291 verses, no gaps. Pauli's own defects are MIRRORED, not mended, and each is
  // named in its chapter note: an "[ANOTHER PARAPHRASE — …]" bracket at 49:25 that the print never
  // closes; stray quotation marks, apostrophes and question marks at 3:15, 10:20, 17:11, 25:9,
  // 26:14, 27:9, 30:13, 30:30, 31:4, 37:24, 41:2, 42:2, 43:28, 51:1, 62:12, 65:12 and 66:5; and a
  // sentence left grammatically incomplete at 19:11. Two one-letter typos that cannot be
  // represented in Spanish ("Thy" for "They" at 22:5, "bades" for "Hades" at 57:9) are translated
  // by their obvious sense and flagged in the note instead.
  'tg-isaiah': 'targums/tg-isaiah',
  // TARGUM PSEUDO-JONATHAN ON THE PENTATEUCH. Same two-removes situation as Isaiah, with a
  // different translator: the reader shows J. W. Etheridge's 1862 English ("The Targums of
  // Onkelos and Jonathan Ben Uzziel on the Pentateuch"), and the Spanish comes off that English.
  // Every chapter file says so in its `_why`; the phrase to grep for is DOS PASOS.
  //
  // 5,817 verses across five books: Genesis 1,519 · Exodus 1,200 · Numbers 1,284 · Deuteronomy
  // 956 · Leviticus 858.
  //
  // ⚠ THE VERSIFICATION IS THE HEBREW ONE wherever it differs from Spanish Bibles, and it differs
  // in five places: Lev 5 runs to 26 verses (its 20-26 are a Spanish Bible's 6:1-7, so ch 6 is
  // offset by seven); Num 17 has 28 verses (a Spanish Bible's 16:36-50 is 17:1-15 here); Num 30
  // and Deut 13 and 23 are each offset by one; Deut 5 folds commandments six to ten into vv.
  // 17-18; and Deut 28 has 69 verses, the last being what Spanish Bibles print as 29:1. The
  // chapter notes say so at each place. Do not "fix" it — it is how the targum is cited.
  //
  // ⚠ THE HOLES ARE ETHERIDGE'S OWN OMISSIONS, verified against the printed 1862 edition, and are
  // deliberately left open with the numbering intact: Gen 5:5-7, 6:15, 10:23, 24:28, 26:30,
  // 39:18, 41:49, 44:30-31 · Exod 4:8, 7:5, 12:43-44, 25:28, 27:15, 37:23, 39:27-29 · Lev 13:52 ·
  // Num 2:12, 3:2, 36:8-9. At Num 36 Etheridge says so in his own text. Likewise Lev 24:4 is his
  // ". . ." lacuna and the 54 `_` verses in Num 7 are his own abridgement of the twelve identical
  // princely offerings — both reproduced exactly, both explained in the chapter note.
  //
  // Etheridge's other defects are MIRRORED, not mended, and each is named in its chapter note:
  // stray elision marks, unclosed parentheses, and misplaced points. One-letter typos that cannot
  // be represented in Spanish are translated by their obvious sense and flagged instead.
  'tg-psj-genesis': 'targums/tg-psj-genesis',
  'tg-psj-exodus': 'targums/tg-psj-exodus',
  'tg-psj-leviticus': 'targums/tg-psj-leviticus',
  'tg-psj-numbers': 'targums/tg-psj-numbers',
  'tg-psj-deuteronomy': 'targums/tg-psj-deuteronomy',
}

// Both translation ids mean "the Spanish we made ourselves" and both must carry the same credit
// line. They stay distinct because they load by different keys, not because they are different
// translations.
export const OUR_SPANISH_IDS = new Set(['deutero-es', 'es'])

/** Whether a catalog work has our Spanish at all, by whichever of the three routes. */
export function hasOurSpanish(workId: string, osisId?: string): boolean {
  return (!!osisId && DEUTERO_ES_BOOKS.has(osisId)) || !!ES_PROSE_WORKS[workId] || !!ES_ENGLISH_PROSE_WORKS[workId]
}
