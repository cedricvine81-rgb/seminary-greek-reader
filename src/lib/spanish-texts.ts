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
  'plato-phaedrus': 'greco/plato-phaedrus',
  'plato-protagoras': 'greco/plato-protagoras',
  'plato-gorgias': 'greco/plato-gorgias',
  'aristotle-poetics': 'greco/aristotle-poetics',
  'aristotle-rhetoric': 'greco/aristotle-rhetoric',
  'aristotle-nicomachean-ethics': 'greco/aristotle-nicomachean-ethics',
  // MARCO AURELIO. Greek-only in the reader — there is no English column to lean on, so the
  // Spanish is translated straight from the Perseus Greek, as Plato's and Aristotle's were.
  'marcus-aurelius-meditations': 'greco/marcus-aurelius-meditations',
  // LUCIANO. Both works ship the Fowler & Fowler English (1905, PD) as their second column,
  // so unlike Marcus these are not greekOnly and the registry line is the whole change.
  'lucian-peregrinus': 'greco/lucian-peregrinus',
  'lucian-alexander': 'greco/lucian-alexander',
  // APOLODORO, Biblioteca. Three books, 209 sections, translated straight from the Perseus Greek
  // (Frazer's Loeb text). The Greek carries a handful of scribal wounds we did NOT silently mend:
  // the daggers at 3.1.1 and 3.4.4 and the lacuna at 2.5.11 are mirrored, while pure conversion
  // artifacts (a citation transliterated INTO Greek letters at 2.4.2, a stray bracket, a stray
  // Greek question mark at 2.6.4) are not. Where a name is explained by its Greek — Telebóas,
  // Édipo, Alejandro, Aquiles, mirmídones, kíbisis — the Greek word stays in parentheses.
  'apollodorus-library-1': 'greco/apollodorus-library-1',
  'apollodorus-library-2': 'greco/apollodorus-library-2',
  'apollodorus-library-3': 'greco/apollodorus-library-3',
  // TEÓN, Progymnásmata. A rhetoric handbook, so the Greek IS the argument in dozens of places:
  // the ambiguity examples (AYΛHTPIΣ, OYKENTAYPOIΣ, the KAINOY pun), the dual-number declension
  // drill, Ephorus's accidental iambic line, and the etymologies keep their Greek in parentheses
  // with the sense beside it — translating them away would delete the point being made.
  'theon-progymnasmata': 'greco/theon-progymnasmata',
  // PLUTARCO, Moralia. The moral-philosophy essays, translated from the Perseus Greek, chosen for
  // the ground they share with NT ethics — envy, anger, wealth, superstition, the passions of the
  // soul. Short works, so each ships whole rather than leaving a half-translated book in the
  // reader. Two leaked artifacts are NOT mirrored: a line number sitting mid-sentence in
  // On Virtue and Vice 1, and — exactly the Apollodorus 2.4.2 defect again — the work's own LATIN
  // running title transliterated INTO GREEK LETTERS at the end of Stoics and Poets 1
  // («στοιξος ἀβσιιρδιορα ποετις διξερε» = "Stoicos absurdiora poetis dicere").
  'plutarch-virtue-and-vice': 'greco/plutarch-virtue-and-vice',
  'plutarch-can-virtue-be-taught': 'greco/plutarch-can-virtue-be-taught',
  'plutarch-monarchy-democracy-oligarchy': 'greco/plutarch-monarchy-democracy-oligarchy',
  'plutarch-stoics-and-poets': 'greco/plutarch-stoics-and-poets',
  'plutarch-soul-or-body': 'greco/plutarch-soul-or-body',
  'plutarch-vice-and-unhappiness': 'greco/plutarch-vice-and-unhappiness',
  'plutarch-envy-and-hate': 'greco/plutarch-envy-and-hate',
  // Second Moralia tranche. The transliterated-Latin running title recurs and is worse here than
  // in Stoics and Poets: at To an Uneducated Ruler 1 the title «Ad principem ineruditum» has been
  // dropped INTO THE MIDDLE OF A GREEK WORD, splitting περιέκοψεν into περιέ + Latin + κοψεν, and
  // That a Philosopher Ought to Converse 1 carries two fragments of its own title in the same way.
  // Not mirrored, and the split word is rejoined.
  'plutarch-on-chance': 'greco/plutarch-on-chance',
  'plutarch-live-unknown': 'greco/plutarch-live-unknown',
  'plutarch-philosopher-and-men-in-power': 'greco/plutarch-philosopher-and-men-in-power',
  'plutarch-to-an-uneducated-ruler': 'greco/plutarch-to-an-uneducated-ruler',
  'plutarch-having-many-friends': 'greco/plutarch-having-many-friends',
  'plutarch-consolation-to-his-wife': 'greco/plutarch-consolation-to-his-wife',
  'plutarch-love-of-wealth': 'greco/plutarch-love-of-wealth',
  // On Superstition 10 quotes some verses on Artemis that are CORRUPT IN THE MANUSCRIPTS, not in
  // the conversion — so, unlike the Latin running titles, that damage IS mirrored: the Spanish
  // says in brackets that the lines admit no secure sense and reports what they seem to contain.
  'plutarch-on-superstition': 'greco/plutarch-on-superstition',
  'plutarch-on-being-a-busybody': 'greco/plutarch-on-being-a-busybody',
  'plutarch-profit-by-enemies': 'greco/plutarch-profit-by-enemies',
  // On the Control of Anger is a DIALOGUE (Sila y Fundano), and the Perseus text carries the
  // speaker tags inline; they are kept in Spanish as SILA / FUNDANO so the reader can still see
  // who is speaking. Fundanus quotes verse constantly — Homer, Sophocles, Pindar, Sappho — and
  // those quotations are rendered as verse in quotation marks rather than folded into his prose.
  'plutarch-control-of-anger': 'greco/plutarch-control-of-anger',
  // Third Moralia tranche — the start of the long tail (35 works still untranslated when this
  // began). Three Keep-the-Greek clusters here, all of them arguments that die in translation:
  // Platonic Questions 8:2 turns on the CASE of one word (χρόνου genitive vs χρόνῳ dative), 9:1 on
  // ὕπατος/νέατος as both musical strings and "highest/lowest", and the whole of 10 on ὄνομα/ῥῆμα
  // and the syncope of prepositions (ἐμβῆναι < ἐντὸς βῆναι, καθίζειν < κάτω ἵζειν); Education of
  // Children 4 puns ἦθος ("carácter") on ἔθος ("hábito") and ἠθικαί on ἐθικαί; 17 is the whole
  // Pythagorean symbola list, where μελάνουρος and κύαμοι only mean what Plutarch says they mean
  // in Greek. TWO WOUNDS MIRRORED: Platonic Questions 3 ends mid-sentence in the Perseus text
  // (the Spanish stops the same way, with no final period), and Education of Children 9 has a
  // lacuna after «τί ἂν τοὺς παῖδας» — marked in brackets rather than smoothed over. A scrambled
  // word order at Education 4 (the two horse questions folded into one) is a conversion scar, not
  // a wound, so the Spanish restores the two parallel questions.
  'plutarch-platonic-questions': 'greco/plutarch-platonic-questions',
  'plutarch-tranquillity-of-mind': 'greco/plutarch-tranquillity-of-mind',
  'plutarch-education-of-children': 'greco/plutarch-education-of-children',
  // Fourth Moralia tranche. THE LATIN RUNNING TITLE AGAIN, and worse placed than ever: at
  // Old Man in Public Affairs 1 the work's own title «An seni respublica gerenda sit» has been
  // transliterated into Greek letters («ἀν σενι ρεσπιιβλιξα ἐερενδα σιτ») and dropped BETWEEN
  // «τοῦ ζῆν» and «καὶ τοῦ καλῶς ζῆν» — the same defect as Stoics and Poets 1 and To an
  // Uneducated Ruler 1. Not mirrored; the phrase is rejoined. Keep-the-Greek in that same work
  // at 10, where the argument is an etymology (γέρας and γεραίρειν from γέροντες, and the
  // Spartan πρεσβυγενέες / γέροντες beside the Roman γερουσία), and at 24 for the three grades
  // of the Ephesian priestesses (Μελλιέρη / Ἱέρη / Παριέρη); and in Brotherly Love at 1 for the
  // Spartan δόκανα, at 16 for Socrates' Δαρεῖος/δαρεικός pun, and at 19 for συγκρητισμός — the
  // Cretan word this treatise is the source for. A real lacuna at Old Man 2 is bracketed; a
  // dittography at Brotherly Love 5 (πλουτοῦντας printed twice) is a scar and is dropped.
  'plutarch-brotherly-love': 'greco/plutarch-brotherly-love',
  'plutarch-old-man-in-public-affairs': 'greco/plutarch-old-man-in-public-affairs',

  // Fifth Moralia tranche. A NEW scar class: Perseus BETA CODE that was never converted, left
  // sitting in the middle of the Greek — «*kuri/as» for Κυρίας at Oracles at Delphi 11 (Epicurus'
  // Κύριαι Δόξαι) and «*)astrologi/an» for ἀστρολογίαν at 18. Both are digitization damage, not
  // textual damage, so they are translated through, not mirrored; likewise the doubled-epsilon
  // artifacts in chapter 1 (ἕετερον, ἐεμόν) and ἀπθδείκνύθυσι at 20. What IS mirrored: the real
  // lacuna at 23, where the sentence naming Philinus has lost its subject, and the shredded
  // second Simonides fragment at 17 — both marked with an ellipsis rather than silently mended.
  // Oracles is a DIALOGUE, so the speakers (BASÍLOCLES, FILINO, Diogeniano, Teón, Sarapión,
  // Boeto) keep their inline tags in Spanish, as On the Control of Anger already does.
  // Keep-the-Greek at 14 for the nickname Φρύνη ('sapo') beside the real name Mnesárete, at 24
  // for the Pythia's discarded vocabulary (πυρικάους / ὀφιοβόρους / ὀρεᾶνας / ὀρεμπότας — the
  // whole point is that the words themselves were strange), and at 29 for γνῶθι σαυτόν and
  // μηδὲν ἄγαν, which are quoted as inscriptions and so stay as inscriptions.
  'plutarch-keeping-well': 'greco/plutarch-keeping-well',
  'plutarch-oracles-at-delphi': 'greco/plutarch-oracles-at-delphi',

  // Sixth Moralia tranche: two more books of the Table Talk. Both dumps scanned CLEAN — no Latin
  // running title, no beta-code leak, no NO-GREEK gaps — so the only wounds here are the two real
  // ones in Book II: the lacuna at 3.1 that swallowed the words before the «as one tests on a
  // Carian» proverb, and the one at 10.2 before the trireme simile. Both are mirrored with an
  // ellipsis. Keep-the-Greek is heavier in these books than anywhere else so far, because whole
  // sections ARE etymologies: Book III 1.3 (καρύα from καρωτικόν, νάρκισσος from ναρκώδεις,
  // πήγανον from πήγνυσι, ῥόδον from ῥεῦμα, and ὑποθυμίδες — which Plutarch derives from
  // ὑποθυμίασις and NOT from θυμός, the whole point of the passage), III 7.1 (γλυκύς vs ἡδύς, and
  // Πιθοίγια), III 8.1 (ἀκροθώραξ), III 9.1 (the «five or three, but not four» mixing rule),
  // II 4.1 (πάλη from παλεύειν / παλαιστή / παλῦναι / πέλας — four rival derivations in one
  // paragraph), II 8.1 (λυκοσπάδες) and II 10.2 (δαῖτες / δαιτυμόνες / δαιτροί, κρεοδαῖται).
  //
  // PROCESS TRAP found here, and it loses text silently: a batch file must never repeat a chapter
  // key. Two «"2": {...}» blocks in one heredoc parse as ONE object and the first is DISCARDED —
  // check.py then reports the section simply missing, but only if you look. Write one section per
  // file when a chapter spans batches. A second silent-loss trap: an `awk | head -c` read that
  // stops mid-section will produce a Spanish section that quietly omits the middle. check.py
  // cannot see it; the RATIO SCAN can, and did (Book II 3.3 came in at 0.73).
  'plutarch-table-talk-2': 'greco/plutarch-table-talk-2',
  'plutarch-table-talk-3': 'greco/plutarch-table-talk-3',

  // Seventh Moralia tranche. Table Talk I finishes that half of the Table Talk (only VII and VIII
  // are left), and brings a THIRD instance of the unconverted-beta-code scar: at 2.3 the title of
  // Aristotle's Topics is printed «to/pous» in the middle of the Greek. Translated through, like
  // «*kuri/as» and «*)astrologi/an» in Oracles at Delphi. The genuine wounds ARE mirrored: the
  // lacunae at Table Talk I 2.3, 4.2 and 9.3, and at 10.2 where the sentence about Neanthes breaks
  // off mid-clause. Keep-the-Greek in Table Talk I at 1.5 (σκόλιον derived from the zig-zag path of
  // the myrtle branch, plus αἴσακος) and in the preface's μνάμων; and in the Dinner at 21, where
  // the three Delphic maxims are quoted AS inscriptions (γνῶθι σαυτόν, μηδὲν ἄγαν, ἐγγύα πάρα δ᾽
  // ἄτα) and where Cypselus is named for the κυψέλη his mother hid him in.
  //
  // The Dinner is a DIALOGUE reported by Diocles, so its speakers keep their names inline. Its
  // enigmas are translated with the Greek beside them only where the riddle turns on a Greek word.
  'plutarch-table-talk-1': 'greco/plutarch-table-talk-1',
  'plutarch-dinner-of-the-seven-wise-men': 'greco/plutarch-dinner-of-the-seven-wise-men',

  // Eighth Moralia tranche. Fortune of Alexander is a pair of rhetorical show-pieces and scanned
  // clean; Table Talk VII leaves only book VIII outstanding of the nine. Wounds mirrored in
  // Table Talk VII: the sentence at 1.2 that breaks off after λευκανίη, having lost the words that
  // said what that passage carries. New instances of the scrambled-Greek scar (the same class as
  // the unconverted beta code, not textual damage, so translated through): the Homeric tag about
  // the full belly at 2.1, where a run of nonsense letters has been dropped INTO the quotation,
  // and the mangled clause at 2.2. Keep-the-Greek at 1.2 for ἀσφάραγος / ἐρισφάραγος / λευκανίη —
  // the whole chapter is an argument about which Homeric word names which pipe — and at 10.1 for
  // Plato's derivation of οἶνος from οἴεσθαι νοῦν.
  //
  // The truncated-read trap struck for the THIRD tranche running (Table Talk VII 6.3 came in at
  // 0.28, missing about four fifths of its middle). Read a long section in overlapping slices and
  // let the ratio scan be the thing that certifies it; check.py cannot see this class of loss.
  'plutarch-fortune-of-alexander': 'greco/plutarch-fortune-of-alexander',
  'plutarch-table-talk-7': 'greco/plutarch-table-talk-7',

  // Ninth Moralia tranche, and with it THE TABLE TALK IS COMPLETE — all nine books in Spanish.
  // Book VIII scanned clean and, read in overlapping slices from the start, produced no ratio
  // outliers on the first pass. Keep-the-Greek at 6.4 for the chain of meal etymologies that the
  // chapter exists to argue (ἀκράτισμα from ἄκρατος, ὄψον from ὀψέ, ἄριστον, δεῖπνον from
  // διαναπαύει) and at 6.5 for Lamprias's parody of it, which does the same trick in LATIN
  // (cena/κοινωνία, prandium, mensa, panem, corona) and only works with both languages visible;
  // and at 8.1 for ἔλλοπες, the Pythagorean gloss on why fish are the emblem of silence.
  'plutarch-table-talk-8': 'greco/plutarch-table-talk-8',

  // Tenth Moralia tranche. The Consolation to Apollonius scanned clean and, read in overlapping
  // slices, verified on the first pass. It is a chain of quotations more than an argument, so
  // almost all of the Greek is other people's — Homer, Hesiod, Pindar, Euripides, Menander,
  // Simonides, Crantor, Aristotle's lost Eudemus (the Silenus answer to Midas), and a long
  // verbatim stretch of Plato's Gorgias myth — and the Spanish keeps each of those as a quotation.
  // Keep-the-Greek only at 28, where the two Delphic maxims are named AS inscriptions
  // (γνῶθι σαυτόν, μηδὲν ἄγαν) and the chapter turns on how each contains the other.
  'plutarch-consolation-to-apollonius': 'greco/plutarch-consolation-to-apollonius',

  // Eleventh Moralia tranche. On the Generation of the Soul in the Timaeus, Plutarch's hardest
  // technical treatise: half Platonic exegesis, half harmonic arithmetic. The Spanish keeps
  // τὸ ταὐτόν / τὸ θάτερον as «lo mismo» / «lo otro» throughout, because the whole argument is
  // built on that pair, and keeps the musical vocabulary in its Spanish forms (hipate, mese,
  // nete, proslambanómeno, licanos, parhípatas) rather than glossing it away. Keep-the-Greek at
  // 33, where the argument IS about the words: the poets' ἄρθμια for what is dear and ἀνάρσιοι
  // for enemies, and the ἄρμενος of Pindar's epitaph, all turn on «well-fitted», which is the
  // chapter's point about harmony being virtue.
  //
  // Two scar classes, both the source's and neither ours. (i) The Latin running title has been
  // transliterated INTO GREEK LETTERS and dropped mid-sentence — 1:1 carries «δε ἀνιμαε
  // προξρεατιονε ἰν τιμαεο» and 3:1 «Ἰν τιμαεο πλατονις», which are simply "De animae
  // procreatione in Timaeo" and "In Timaeo Platonis". They are digitization noise, so the
  // Spanish translates through them and says nothing. (ii) The Perseus chapter division is out
  // of order, and this is measurable rather than inferred: 30 ends «…ἡ τοῦ ἑνὸς καὶ τῶν δυεῖν,
  // δευτέρα.» and 11 opens «δʼ ἡ τῶν τριῶν καὶ τεττάρων» — one sentence split across two
  // chapters that are nineteen apart, so the text runs 30 → 11. 21 likewise opens mid-clause.
  // The Spanish mirrors those three joins with an ellipsis at the broken edge and leaves the
  // numbering exactly as the Greek has it, so the parallel columns stay aligned. Chapters 3 and
  // 26 end without a full stop; that is only lost punctuation, not lost text, so they are closed.
  'plutarch-generation-of-the-soul': 'greco/plutarch-generation-of-the-soul',

  // Twelfth Moralia tranche. On the Delays of the Divine Vengeance — the dialogue at Delphi that
  // ends in the myth of Thespesius, so the Spanish has to hold an argumentative half and a
  // visionary half in one voice. Keep-the-Greek twice, and only where the argument is the word:
  // at 6, for the pair τρόπος (from turning) and ἦθος (from ἔθος, habit), which is Plutarch's
  // proof that character is what changes; and at 27, for γένεσις read as νεῦσις ἐπὶ γῆν, the
  // etymology on which the whole descent of souls into bodies turns.
  //
  // One conversion scar: at 11 the Perseus Greek carries a Latin critical note transliterated
  // into Greek letters and dropped mid-sentence — «ὥσπερ ρ. μαλιμ ἅπερ γὰρ, σεδ ξφ. π. 463 δ»,
  // which is "r. malim ἅπερ γάρ, sed cf. p. 463 d". It is apparatus, not text, so the Spanish
  // reads straight through it, exactly as with the Latin running titles in the Generation of the
  // Soul. The clause at 9 that names Plato («λέγοντος οὐχ Πλάτων ἀκόλουθον…») is garbled in the
  // same edition; the sense is secure from the contrast Hesiod is being made to draw, and that
  // is what the Spanish renders.
  'plutarch-delays-of-divine-vengeance': 'greco/plutarch-delays-of-divine-vengeance',

  // Thirteenth Moralia tranche. On the Malice of Herodotus — a polemic, so the Spanish has to
  // keep two registers apart: Plutarch's own argument, and the long verbatim quotations from
  // Herodotus that he is refuting, which stay inside guillemets so the reader can always see
  // which words are being prosecuted. The verse quotations (Simonides, Pindar, the Salamis and
  // Isthmus epigrams, the altar of Zeus Eleutherios) are kept as quotations rather than folded
  // into the prose. Keep-the-Greek once, at 23, where the whole joke is a pun and dies in
  // translation: Herodotus packs Isagoras off εἰς Κᾶρας, «to the Carians», which is ἐς κόρακας,
  // «to the crows» — and Plutarch's point is precisely that the sneer is audible.
  //
  // Two small textual wounds, both the edition's. At 31 the clause listing how Herodotus wronged
  // the Thebans breaks off mid-phrase («τὰ μὲν ψευδῶς, τὰ δὲ διὰ , τὰ δὲ ὡς μισῶν»); the Spanish
  // mirrors that gap with an ellipsis rather than inventing the missing member. At 39 the opening
  // sentence is garbled by a stray letter in the same way; there the sense is fixed by the
  // contrast that follows, so it is translated through and only recorded here.
  'plutarch-malice-of-herodotus': 'greco/plutarch-malice-of-herodotus',

  // Fourteenth Moralia tranche. Lives of the Ten Orators — thirteen chapters, of which the last
  // three are not narrative at all but ATHENIAN DECREES quoted verbatim (the honours for
  // Demosthenes, for Demochares, and for Lycurgus). Those keep the flat, clause-piled formula of
  // a decree in Spanish rather than being smoothed into prose, because the shape is the evidence.
  // Keep-the-Greek twice, both times because the argument is the word: at 1, where the sentence
  // on the razed houses of Archeptolemus and Antiphon quotes the boundary-stone itself
  // (ΑΡΧΕΠΤΟΛΕΜΟΥ ΚΑΙ ΑΝΤΙΦΩΝΤΟΣ ΤΟΙΝ ΠΡΟΔΟΝΤΟΙΝ); and at 8, where Demosthenes is mocked for
  // swearing by Ἀσκλήπιον with a proparoxytone accent and defends it from ἤπιος, «gentle» — a
  // joke that exists only in Greek.
  //
  // The Latin running title is transliterated into Greek letters here too, and this time it lands
  // INSIDE a phrase: 1 reads «περὶ ἑνὸς Χ ορατορυμ Ωιταε. ἑκάστου», which is "X ORATORUM VITAE"
  // dropped between ἑνὸς and ἑκάστου. The Spanish rejoins the split phrase and says nothing, as
  // with the same scar in the Generation of the Soul. Chapter 3 also carries un-converted beta
  // code inside the Philiscus epigram (ς1ʼ for ς), and chapters 7 and 8 carry stray digits where
  // an article should stand; all conversion noise, all read through.
  'plutarch-ten-orators': 'greco/plutarch-ten-orators',

  // Fifteenth Moralia tranche. How the Young Man Should Study Poetry — an essay built almost
  // entirely out of other people's verse, so the Spanish keeps every citation as a citation
  // (Homer, Hesiod, Euripides, Sophocles, Menander, Pindar, Simonides, Empedocles, Xenophanes,
  // Archilochus, Bacchylides, Thespis and the rest) rather than paraphrasing it into the argument.
  //
  // Keep-the-Greek is heavier here than anywhere since the Platonic Questions, because chapter 6
  // IS a lesson in Greek vocabulary: the double senses of οἶκος, βίοτος, ἀλύειν, θοάζειν, the
  // αἰνεῖν that means «decline» and the ἐπαινὴ Περσεφόνεια built on it, and the shifts of ἀρετή,
  // κακότης and εὐδαιμονία between the philosophers' sense and the poets'. Those stay in Greek
  // with the sense beside them, along with the dialect glosses that open the chapter (δᾶνον,
  // καμμονία, πόποι). Chapter 11 keeps two more, both jokes about words: Cleanthes reading
  // «Ζεῦ ἄνα Δωδωναῖε» as one word ἀναδωδωναῖος from ἀνάδοσις, and Chrysippus forcing
  // εὐρύοπα Κρονίδην into «far-reaching in argument». And 14 keeps γνῶθι σαυτόν, which is quoted
  // as the Delphic maxim itself.
  //
  // Chapter 2 carries a stray line-number («72») dropped inside a quotation — a conversion scar,
  // read through. No wounds.
  'plutarch-study-of-poetry': 'greco/plutarch-study-of-poetry',

  // Sixteenth Moralia tranche. The Amatorius — a dialogue, so the Spanish keeps the speaker
  // labels (AUTÓBULO, FLAVIANO) and the nested reported speech: Autobulus quoting his father
  // quoting Daphnaeus and Protogenes, which is three deep for most of the work.
  //
  // Keep-the-Greek four times, each because the argument is the word. At 5, χάρις — the term the
  // ancients used for a woman's yielding — and the ἄχαρις χάρις, the «favour without favour»,
  // that Plutarch coins against the other side. At 13, the Chrysippean etymology Ἄρης from
  // ἀναιρεῖν. At 21, στέργειν and στέγειν, «to love» and «to endure», one letter apart, which is
  // the whole point of the sentence. And at 25, the gloss on the Gaulish name Empona as Ἡρωίς.
  // One pun survives translation intact and is therefore NOT kept in Greek: Pisias's αὐτονομία →
  // ἀνομία at 11 is «autonomía» → «anomía» in Spanish, with the same hinge.
  //
  // The great lacuna of the Amatorius falls inside chapter 20: the Gorgo anecdote breaks off
  // mid-sentence and 21 resumes on a different subject. That is a genuine wound and the Spanish
  // mirrors it with an ellipsis. Chapter 1 carries a garbled vocative («ὦ Λύτόβουλε» for
  // Αὐτόβουλε) and 17 a stray syllable where a name should stand; both are conversion noise,
  // translated through.
  'plutarch-dialogue-on-love': 'greco/plutarch-dialogue-on-love',
  // THE SYNKRISEIS. Seventeen of the short comparisons that close the paired Lives, translated
  // straight from the Perseus Greek. They are argument, not narrative: the Spanish keeps the
  // μὲν…δέ balance as «el uno… el otro», and keeps the verse quotations (Homer, Sophocles,
  // Pindar, Solon, Sappho) as verse in quotation marks rather than folding them into the prose.
  // The Perseus text of Demosthenes–Cicero 1.5 is visibly OCR-damaged (Μουρήναν printed as
  // «Ἠίουρήναν», several words unaccented); that is a conversion scar, not a wound in the text,
  // so the Spanish renders the sense and says nothing about it.
  'plutarch-comp-theseus-romulus': 'greco/plutarch-comp-theseus-romulus',
  'plutarch-comp-solon-publicola': 'greco/plutarch-comp-solon-publicola',
  'plutarch-comp-pericles-fabius': 'greco/plutarch-comp-pericles-fabius',
  'plutarch-comp-alcibiades-coriolanus': 'greco/plutarch-comp-alcibiades-coriolanus',
  'plutarch-comp-timoleon-aemilius': 'greco/plutarch-comp-timoleon-aemilius',
  'plutarch-comp-pelopidas-marcellus': 'greco/plutarch-comp-pelopidas-marcellus',
  'plutarch-comp-aristides-cato': 'greco/plutarch-comp-aristides-cato',
  'plutarch-comp-lycurgus-numa': 'greco/plutarch-comp-lycurgus-numa',
  // MORALIA, second batch. Three of these carry damage that belongs to the TEXT and is mirrored:
  // On the Eating of Flesh I ends §3 in mid-sentence and On the Eating of Flesh II opens with a
  // mutilated clause (both treatises survive as fragments), and Whether Fire or Water Is More
  // Useful 2 and 11 have short lacunae — each is marked in brackets in the Spanish. What is NOT
  // mirrored is the conversion scar: On the Eating of Flesh 2.1 and That We Ought Not to Borrow
  // 1.1 both carry the treatise's LATIN running title transliterated into Greek letters and
  // dropped mid-word ('de esu carnium', 'de vitando aere alieno'); those are silently removed and
  // the broken Greek word restored. Aristophanes and Menander 1 turns entirely on Aristophanes'
  // puns (ταμίας/Λαμίας, καικίας/συκοφαντίας, γέλωτος/Γέλαν, γοργόνωτον/τυρόνωτον), and That We
  // Ought Not to Borrow 5 on τόκος meaning both 'offspring' and 'interest': in those places the
  // Greek stays beside the Spanish, because the joke is the argument.
  'plutarch-aristophanes-and-menander': 'greco/plutarch-aristophanes-and-menander',
  'plutarch-eating-of-flesh-1': 'greco/plutarch-eating-of-flesh-1',
  'plutarch-eating-of-flesh-2': 'greco/plutarch-eating-of-flesh-2',
  'plutarch-fire-or-water': 'greco/plutarch-fire-or-water',
  'plutarch-love-stories': 'greco/plutarch-love-stories',
  'plutarch-we-ought-not-to-borrow': 'greco/plutarch-we-ought-not-to-borrow',
  'plutarch-affection-for-offspring': 'greco/plutarch-affection-for-offspring',
  // MORALIA, third batch. Two of these are DIALOGUES and keep their speaker tags in Spanish:
  // Beasts Are Rational is Odiseo / Circe / Grilo, and its Perseus text carries the treatise's
  // Latin title transliterated into Greek and dropped mid-sentence at 1.1 ('ratione uti') — a
  // conversion scar, silently removed, like the leaked 'idem' inside On Fate 9. On Fate numbers
  // its dedication to Piso as chapter 0, and Advice to Bride and Groom its preface likewise.
  'plutarch-glory-of-athens': 'greco/plutarch-glory-of-athens',
  'plutarch-on-fate': 'greco/plutarch-on-fate',
  'plutarch-beasts-are-rational': 'greco/plutarch-beasts-are-rational',
  'plutarch-advice-to-bride-and-groom': 'greco/plutarch-advice-to-bride-and-groom',
  // On Exile 16 argues point by point against verses of Euripides that the Perseus text has LOST:
  // the quotations themselves are missing from the Greek, so Plutarch's replies answer nothing
  // visible. That gap belongs to the text as we have it and is marked in brackets, not patched.
  'plutarch-on-exile': 'greco/plutarch-on-exile',
  'plutarch-praising-oneself': 'greco/plutarch-praising-oneself',
  'plutarch-on-compliancy': 'greco/plutarch-on-compliancy',
  'plutarch-fortune-of-the-romans': 'greco/plutarch-fortune-of-the-romans',
  'plutarch-the-e-at-delphi': 'greco/plutarch-the-e-at-delphi',
  // NATURAL PHENOMENA is the first work in this corpus whose GREEK RUNS OUT: questions 1-31 are
  // Greek, and 32-39 survive only in the Latin translation, which is what Perseus prints. Those
  // eight are translated FROM THE LATIN and each says so in brackets — the same two-removes rule
  // used for the Targums and for Against Apion 2.51-113. Question 31 also breaks off mid-sentence
  // in the Greek, and the answers to 37 and 38 are swapped in the Latin (the wolf question is
  // answered about stones and the dog question about wolves); both are transmitted damage and are
  // mirrored, not mended.
  'plutarch-natural-phenomena': 'greco/plutarch-natural-phenomena',
  'plutarch-principle-of-cold': 'greco/plutarch-principle-of-cold',
  // PARALLEL STORIES pairs a Greek tale with a Roman one and names a source for each; most of
  // those sources are almost certainly forged, and the work itself is generally judged spurious.
  // That is a question about the text, not about the translation: the citations are rendered as
  // they stand, including 27, where the Greek breaks off before naming the second authority.
  'plutarch-parallel-stories': 'greco/plutarch-parallel-stories',
  'plutarch-comp-philopoemen-flamininus': 'greco/plutarch-comp-philopoemen-flamininus',
  'plutarch-comp-lysander-sulla': 'greco/plutarch-comp-lysander-sulla',
  'plutarch-comp-cimon-lucullus': 'greco/plutarch-comp-cimon-lucullus',
  'plutarch-comp-nicias-crassus': 'greco/plutarch-comp-nicias-crassus',
  'plutarch-comp-sertorius-eumenes': 'greco/plutarch-comp-sertorius-eumenes',
  'plutarch-comp-agesilaus-pompey': 'greco/plutarch-comp-agesilaus-pompey',
  'plutarch-comp-demosthenes-cicero': 'greco/plutarch-comp-demosthenes-cicero',
  'plutarch-comp-dion-brutus': 'greco/plutarch-comp-dion-brutus',
  'plutarch-comp-agis-cleomenes-gracchi': 'greco/plutarch-comp-agis-cleomenes-gracchi',
  'plutarch-comp-demetrius-antony': 'greco/plutarch-comp-demetrius-antony',
  // THE LIVES THEMSELVES now begin. CAIUS GRACCHUS and OTHO are narrative, not argument, so the
  // Spanish keeps Plutarch's long participial chains as Spanish subordination rather than
  // chopping them into short sentences; the speeches inside them keep their rhetorical shape.
  // Otho's own inscription at Brixellum is quoted in the Greek as a translation ("if it were
  // rendered"), and is rendered here the same way.
  'plutarch-caius-gracchus': 'greco/plutarch-caius-gracchus',
  'plutarch-otho': 'greco/plutarch-otho',
  // AGIS and TIBERIUS GRACCHUS are the two halves of a pair Plutarch built to argue one thesis:
  // that reform undertaken for the people's sake destroys the reformer. Both keep the long
  // deliberative speeches whole (Agis 15's oracles, Tiberius 15's case against Octavius), since
  // the argument IS the life. Two proper names in Agis stay Greek because they are cult titles,
  // not descriptions: the Chalcioecus (Athena "of the bronze house") and the Decas, the room in
  // the Spartan prison where the condemned were strangled.
  'plutarch-agis': 'greco/plutarch-agis',
  'plutarch-tiberius-gracchus': 'greco/plutarch-tiberius-gracchus',
  // THREE MORALIA ON EDUCATION AND CHARACTER. These are argument, and their chapters are single
  // enormous periods, so the Spanish keeps the period whole rather than chopping it into short
  // sentences — the shape of the reasoning is the content. Two things stay Greek in the text
  // because the argument turns on them: in ON MORAL VIRTUE, ἦθος (character) is derived from
  // ἔθος (habit), a pun that vanishes in Spanish, so both words are printed; and the verse
  // quotations (Homer, Sophocles, Simonides, Sappho, Menander) are set as verse in quotation
  // marks rather than folded into the prose.
  'plutarch-progress-in-virtue': 'greco/plutarch-progress-in-virtue',
  'plutarch-listening-to-lectures': 'greco/plutarch-listening-to-lectures',
  'plutarch-on-moral-virtue': 'greco/plutarch-on-moral-virtue',
  // TABLE TALK VI and IX. Dinner conversation, so the Spanish keeps the speakers' interruptions
  // and jokes rather than smoothing them into treatise prose. Where an argument turns on a Greek
  // etymology the Greek is printed beside the Spanish — τροφή/τηροῦν in VI 2, θαλιάζειν and
  // Σειρῆνας/εἰρούσας in IX 14, the letter names in IX 2 — because the point vanishes otherwise.
  //
  // ⚠ BOOK IX IS DAMAGED IN THE SOURCE. The Perseus text jumps from question 6 to question 12:
  // questions 7-11 are simply not there, chapter 6 breaks off in the middle of a word
  // (Posidon "was venci-"), and 12 opens mid-sentence on the tail of a proverb. That is a hole in
  // the transmitted text, not in the translation, so the Spanish breaks off and resumes exactly
  // where the Greek does, with an ellipsis at the resumption; nothing is invented to bridge it.
  'plutarch-table-talk-6': 'greco/plutarch-table-talk-6',
  'plutarch-table-talk-9': 'greco/plutarch-table-talk-9',
  // EUMENES and ON TALKATIVENESS. The Life is narrative and the essay is argument, but both turn
  // on the same thing — what a man says and does not say — and On Talkativeness retells the
  // Eumenes battle (ch. 9) that the Life narrates in full, so they belong together. Two Laconic
  // one-word answers in the essay are kept as one word in Spanish, because the whole point is
  // their brevity: the Spartans' «Si» to Philip's threat, and their «NO» written large on a sheet.
  'plutarch-eumenes': 'greco/plutarch-eumenes',
  'plutarch-on-talkativeness': 'greco/plutarch-on-talkativeness',
  // TABLE TALK IV and V. Same rules as VI and IX: the Greek is printed beside the Spanish
  // wherever an argument turns on a word — Homer's ζωρότερον debated in V 4, Empedocles'
  // ὑπέρφλοια in V 8, the sow (ὗς) and the ploughshare (ὕνις) in IV 5.
  //
  // ⚠ BOOK IV BREAKS OFF. The Perseus text stops in the middle of a word during question 5's
  // account of Jewish custom, and the manuscript's own note — "the rest of the fourth is
  // missing" — stands where the text stops. The Spanish breaks off at the same syllable and
  // carries that note in brackets, as the editorial remark it is; nothing is supplied.
  //
  // IV 5-6 is the ancient dinner-table speculation that the God of the Jews is Dionysus. It is
  // rendered as what it is — what Plutarch's characters say — and nothing is softened or cut.
  'plutarch-table-talk-4': 'greco/plutarch-table-talk-4',
  'plutarch-table-talk-5': 'greco/plutarch-table-talk-5',
  // PHILOPOEMEN and FLAMININUS, the pair — the last great Greek and the Roman who freed Greece,
  // and each Life is partly about resenting the other. The comparison that closes the pair is
  // registered separately, above.
  //
  // Two documents in Flamininus are quoted as documents and kept as verse: the Isthmian
  // proclamation of Greek freedom (10.4), which the Spanish keeps as the herald's single
  // sentence with its list of peoples intact; and the Chalcidian paean still sung in Plutarch's
  // own day (16.4), whose closing lines he copies because he has cut the rest for length — the
  // Spanish says so where he says so, rather than silently presenting a whole hymn.
  'plutarch-philopoemen': 'greco/plutarch-philopoemen',
  'plutarch-flamininus': 'greco/plutarch-flamininus',
  // GALBA completes the pair with OTHO, already registered above — the two surviving Lives of
  // the Caesars, and the only place Plutarch writes the history of his own lifetime. The Spanish
  // keeps the Roman military and administrative vocabulary as Plutarch transliterates it rather
  // than modernising: the «principia» of the camp, the opción and the teserario, the sarmiento
  // with which a centurion beats his men. Where he glosses a Roman term for his Greek readers
  // (the calends of January, the eighteenth day before the calends of February), the gloss is
  // kept, because it is his, not ours.
  'plutarch-galba': 'greco/plutarch-galba',
  // PUBLICOLA is the Life most crowded with Roman etymologies, and each is the point of its
  // sentence, so the Latin is printed beside the Spanish where the derivation lives: the freedman
  // Vindicio and the «vindicta» that frees a slave; «pecus» and the «peculio» that is still named
  // for the sheep it was counted in; «capras» and «porcos» behind the family names Caprario and
  // Porcio. Publicola's own name Plutarch glosses himself — «el que cuida del pueblo» — and the
  // gloss is kept as his.
  'plutarch-publicola': 'greco/plutarch-publicola',
  // CIMON opens with a chapter that is not about Cimon at all: the murder of the Roman officer at
  // Chaeronea, Plutarch's own town, and Lucullus's testimony that saved it. He tells it because
  // the debt is his, and says so — the Spanish keeps that first person («nuestra patria», «nuestros
  // padres») rather than flattening it into narration, because the whole proem turns on the fact
  // that the biographer is a citizen of the town he is describing.
  //
  // The three Herm epigrams of 7.4-5 are quoted as inscriptions and kept as verse in Spanish;
  // the pun of 4.3 (Coálemo, «el bobo») is glossed inline as Plutarch himself glosses it.
  'plutarch-cimon': 'greco/plutarch-cimon',
  // SERTORIUS. Two things are load-bearing here and are kept, not smoothed: the white doe, which
  // Plutarch presents as a deliberate device on Sertorius's part and not as a wonder — the Spanish
  // keeps his verbs of contrivance («fingía», «urdía») so the reader sees the manipulation the
  // Greek shows; and the Iberian «consagración» (κατάσπεισις), the vow to die with the fallen
  // commander, which is named as the institution it is rather than paraphrased away.
  //
  // Sertorius's own words at 16.4-5 (the two horses and the two men pulling the tail) are the
  // set-piece of the Life and are kept as a speech, closing on the sentence that carries it:
  // that time is a kindly ally to those who take its moment by reckoning.
  'plutarch-sertorius': 'greco/plutarch-sertorius',
  // DEMOSTHENES is the Life whose proem Plutarch writes about himself — the small town, the late
  // and imperfect Latin, the books he cannot get. That confession is the reason the Life exists in
  // the shape it has, so it is translated straight, in the first person, with nothing softened.
  //
  // THREE PUNS ARE THE POINT OF THEIR SENTENCES AND KEEP THE GREEK BESIDE THE SPANISH: the comic
  // ἀπέλαβεν/ἔλαβεν of 9.5, which is Antiphanes mocking Demosthenes's antitheses and probably his
  // advice to «recover» rather than «take» Halonnesus; the bribed orator's σύναγχη/ἀργυράγχη of
  // 25.5 — not a quinsy but a silver-quinsy; and the ladrón «de bronce» of 11.5, where the thief's
  // nickname is the joke about bronze thieves and mud walls.
  'plutarch-demosthenes': 'greco/plutarch-demosthenes',
  // ARTAXERXES is the one Life whose sources Plutarch openly distrusts while using them, and the
  // Spanish keeps that. Ctesias was the king's own physician and present at Cunaxa, and Plutarch
  // both leans on him and says he bends the truth toward the theatrical — the line about killing
  // Cyrus «como con un puñal romo» is a judgement on the historian, not on the man, and is left as
  // the joke it is. Where Dinon and Ctesias disagree (the date of the poisoning, who held the
  // knife), both versions stand attributed, unreconciled.
  //
  // The scaphe execution of 16.2-4 is translated in full, without softening. Plutarch describes it
  // at that length to show what the court was; abbreviating it would be editing the argument.
  'plutarch-artaxerxes': 'greco/plutarch-artaxerxes',
  // THESEUS is the first pair of the whole work, and its proem is Plutarch drawing the line where
  // history stops — «lo de más allá es prodigioso y trágico, y lo ocupan poetas y mitógrafos». The
  // Spanish keeps that map metaphor intact, because the rest of the Life is written under it: every
  // variant is given as somebody's report, never as fact.
  //
  // ⚠ THE PERSEUS TEXT LEAKS ITS OWN APPARATUS INTO THE GREEK: bare citation strings («Hom. Il.
  // 3.144», «Aesch. Seven 435», «Bergk, Poet. Lyr. Gr. ii.4 p. 254», «Verse 370») sit inline in the
  // verses that quote poetry. Those are conversion artifacts of the digital edition, not Plutarch's
  // words and not damage to the transmitted text, so they are dropped from the Spanish — the quoted
  // verse itself is kept. This is the one place in the Lives where the rule cuts that way; textual
  // damage is always mirrored, but a scraper's footnote is not textual damage.
  'plutarch-theseus': 'greco/plutarch-theseus',
  // NUMA is a Life about religion as statecraft, and its vocabulary is technical Roman: pontífices,
  // flámines, salios, feciales, ancilia, the Regia, the mes mercedino. Plutarch transliterates these
  // into Greek and then glosses them for his Greek readers («pontem» is the bridge, «hoc age» means
  // "haz esto", «maiores» and «iuniores» are the elder and younger); every one of those glosses is
  // his, so every one is kept, including the ones modern philology rejects.
  //
  // The living burial of an unchaste Vestal (10.4-7) is rendered whole, at Plutarch's own pace —
  // he slows down there deliberately, and the horror is the point he is making about the office.
  'plutarch-numa': 'greco/plutarch-numa',
  // FABIUS MAXIMUS is a Life about the value of doing nothing, and its two nicknames carry the
  // argument: Cunctador, the delayer, was an insult before it was a title, and Ovícula, "corderito",
  // was what they called the boy. Both are kept where Plutarch puts them. So is Hannibal's joke
  // about the cloud on the heights that would one day burst — it is the enemy conceding the strategy.
  //
  // The Gisco exchange before Cannas (15.2) is a joke on a man's own name and survives translation
  // intact; it is kept as the moment of nerve Plutarch means it to be, right before the disaster.
  'plutarch-fabius-maximus': 'greco/plutarch-fabius-maximus',
  // ⚠ THEMISTOCLES 13.2-3: THE HUMAN SACRIFICE BEFORE SALAMIS. Plutarch reports, on the authority of
  // Phanias of Lesbos — whom he names and calls a philosopher and no stranger to historical writing —
  // that three Persian prisoners were sacrificed to Dionysus Omestes on the seer's orders. It is
  // translated whole and unsoftened, attributed exactly as he attributes it. Cutting or hedging it
  // would edit a source-critical judgement Plutarch made on the page.
  //
  // Timocreon's two attack poems (21.2-5) are kept as verse and as invective; the second was written
  // after Themistocles' own conviction, and its bitterness is the historical evidence.
  'plutarch-themistocles': 'greco/plutarch-themistocles',
  // CATO THE ELDER is largely a Life made of sayings, and the sayings are the argument: the Spanish
  // keeps them short and hard, without smoothing the rudeness. Two carry their point in a name and
  // are glossed as Plutarch glosses them: «catus», the shrewd man, behind Cato; and «Catones al
  // revés», what Romans called those who imitated him badly.
  //
  // Three passages are translated without softening because Plutarch's own judgement is at stake:
  // Cato selling worn-out slaves, which Plutarch openly calls a hard character and argues against at
  // length (5.1-6); Lucius Quinctius killing a condemned man at dinner to please a boy (17.2-4), with
  // Livy's dissenting version kept; and the closing formula on Carthage, «me parece además que
  // Cartago no debe existir», answered by Nasica's, which is the Greek Plutarch wrote, not the Latin
  // tag it later became.
  'plutarch-cato-the-elder': 'greco/plutarch-cato-the-elder',
  // PHOCION is the Life of a man who said no for forty-five years, and Plutarch keeps his speech
  // deliberately bare — the Spanish keeps it bare too, resisting the temptation to smooth the
  // curtness into politeness. His answers to Demosthenes and to the Assembly are short because
  // shortness is the character: Plutarch says his speech had the most meaning in the fewest words,
  // and a fluent Spanish would refute the sentence that describes it.
  //
  // The hemlock at the end (36-37) is translated whole, including the detail that he had to pay for
  // the extra dose because the state's portion ran short — Plutarch puts the Athenians' meanness in
  // that one accounting fact, and softening it would remove his verdict.
  'plutarch-phocion': 'greco/plutarch-phocion',
  // ARISTIDES turns on a nickname, «el Justo», and on the ostracism story where an illiterate
  // countryman asks Aristides himself to scratch «Aristides» on the sherd because he is tired of
  // hearing him called that. The pun is on the epithet, not on a Greek word, so it survives into
  // Spanish intact and is kept exactly where Plutarch sets it.
  //
  // The financial vocabulary of the Delian League — φόρος as the assessed tribute — is rendered
  // «tributo» throughout, and the sums are left in talents, not converted: the assessment of 460
  // talents is the number the ancient argument is about.
  'plutarch-aristides': 'greco/plutarch-aristides',
  // LYSANDER carries two technical descriptions that the Spanish keeps in full rather than
  // summarising, because Plutarch wrote them as digressions on purpose: the scytale cipher (19.5-7),
  // where the ciphertext is only readable when re-wound on a matching rod, and the iron currency of
  // Sparta (17.2-3) with the etymology of «óbolo» from the iron spits and of «dracma» from the
  // handful of six. Both are explanations, and an explanation that is abridged stops explaining.
  //
  // The Perseus Greek here also leaks its own apparatus: a bare «Unknown.» sits at the end of the
  // verses that quote poetry whose author the digital edition could not identify (18.3, 20.4). That
  // is a conversion artifact, not Plutarch's word and not damage to the transmitted text, so it is
  // dropped from the Spanish while the quoted verse itself is kept — the same call made in Theseus.
  'plutarch-lysander': 'greco/plutarch-lysander',
  // ⚠ SOLON 11 CARRIED A PHANTOM VERSE, AND THE FIX IS UPSTREAM. The Perseus English file numbers
  // the chapter's opening section "11" instead of "1", so the reader showed the Greek of 11:1 with
  // no English beside it and a second, Greek-less row 11:11 holding Perrin's English for that same
  // sentence. The two are demonstrably the same passage. That is a typo in the digital edition, not
  // a difference between the Greek and English editions, so the English was renumbered onto the
  // section it translates — in scripts/build-perseus.py (ENG_KEY_CORRECTIONS), so a rebuild keeps
  // the fix, and in the shipped corpus. Solon therefore has 140 verses, not 141.
  //
  // Not the same thing as Camillus 38 and Demetrius 33, which each carry one English section MORE
  // than the Greek because Perrin divides further than Ziegler. Nothing there is misfiled; those
  // rows are left alone, and when those two Lives get their Spanish the greekless row has no Greek
  // to translate from.
  //
  // The poems are kept as verse throughout — Solon quotes himself constantly, and Plutarch's
  // argument is repeatedly that the poems are the evidence. The Croesus interview (27) is
  // translated in full, including Plutarch's own opening refusal to throw the story out on
  // chronological grounds; cutting his defence of it would edit the source-critical judgement he
  // makes on the page.
  'plutarch-solon': 'greco/plutarch-solon',
  // LYCURGUS is the Life where Plutarch's Spartan technical vocabulary has to survive: fiditios,
  // hectemorios, irenes and melirenes, the retra, the cádico ballot, the criptía. Each is kept as
  // the Greek word and explained where Plutarch explains it, because the chapter IS the gloss.
  //
  // Three passages are rendered whole and unsoftened, because each is a judgement Plutarch makes
  // rather than a detail: the exposure of weak newborns at the Apótetas (16.1-2); the sharing of
  // wives for the sake of the children (15.6-9), which he defends at length and which cannot be
  // trimmed without removing his argument; and the criptía (28), the state killing of helots —
  // which he reports, and then explicitly refuses to attribute to Lycurgus. That refusal is the
  // point of the chapter and is kept exactly where he puts it.
  'plutarch-lycurgus': 'greco/plutarch-lycurgus',
  // MARCELLUS holds the ancient world's best-known account of Archimedes, and its two halves are
  // kept whole: the siege engines that made the Romans flee from a rope showing over the wall, and
  // Plutarch's own argument that Archimedes despised the mechanics that made him famous. The
  // sphere-in-cylinder tomb request closes it and is translated exactly.
  //
  // Two Roman terms are glossed as Plutarch glosses them, since he stops to do the etymology
  // himself: «ovación», which he derives from oves, the sheep sacrificed at the lesser triumph and
  // NOT from the cry evohé, and «dictator», from dicere, because he is named rather than elected.
  // Where his etymology is wrong by modern lights it is still his, and it stands.
  'plutarch-marcellus': 'greco/plutarch-marcellus',
  // ROMULUS is a Life built almost entirely out of etymologies, and they are its argument: Plutarch
  // is showing that Rome's institutions can be read backwards out of the words Romans still use.
  // So «Roma» from ῥώμη, strength; ruminal from «ruma», the teat; the pomerium as post-murum;
  // lictors from ligare; manípulos from the bundles of hay on poles; Comicio from comire; Quirino
  // from quiris, the spear. Each is kept as Plutarch gives it, wrong or right by modern philology,
  // with the Latin or Greek word beside the Spanish where the derivation depends on hearing it.
  //
  // The rape of the Sabine women (14-19) is translated in full, and so is Plutarch's own defence of
  // Romulus's motive and the women's speech at 19.3-5, which is the chapter's moral centre: it is
  // they, not the armies, who end the war, and softening either half would remove his argument.
  'plutarch-romulus': 'greco/plutarch-romulus',
  // ⚠ NICIAS OPENS BY REFUSING TO COMPETE WITH THUCYDIDES, and that preface (1) is kept whole
  // because it states the method of the whole book: Plutarch will not re-narrate what Thucydides
  // and Philistus did inimitably, but gather what escapes most readers — inscriptions, decrees,
  // scattered remarks — for the sake of understanding character. It also carries his sharpest
  // literary abuse, of Timaeus, quoted verse and all.
  //
  // The comic fragments (Telecleides, Eupolis, Aristophanes, Phrynichus, Plato comicus) are kept as
  // verse and as jokes; Aristophanes' coinage μελλονικιᾶν — dithering, punning on Nicias' name — is
  // rendered «andemos niciando», since the pun IS the evidence for how Athens saw him.
  //
  // The lunar eclipse (23) keeps Plutarch's full digression on Anaxagoras, on why physical
  // explanations were still dangerous to publish, and on Dion sailing regardless: it is his
  // explanation of why the army died, and it is an argument about superstition, not a detail.
  'plutarch-nicias': 'greco/plutarch-nicias',
  // CLEOMENES continues the Agis, and it opens mid-sentence on «muerto aquel» — Agis. That is the
  // Life's own beginning, not a truncation; the pair is one book in the manuscripts and the Spanish
  // keeps the join as it stands rather than supplying a name the Greek does not have.
  //
  // Its ending is the reason the Life exists, and it is translated without softening: Cleomenes and
  // his thirteen killing themselves in the Alexandrian street, Panteo checking each body and dying
  // on his king's; then Ptolemy flaying and gibbeting the corpse and killing the children, the
  // mother and the women. Plutarch gives the women the last word — Cratesiclea's «Hijos, ¿adónde os
  // habéis ido?» and Panteo's wife laying out every other woman before composing herself — and
  // states outright that Sparta's women matched its men. Cutting any of it would cut his verdict.
  'plutarch-cleomenes': 'greco/plutarch-cleomenes',
  // CORIOLANO is a Life about a man ruined by his own temper, and the Spanish keeps the temper.
  // Plutarch's thesis is stated at 1.3-5 and again at 15 and 21: an unmixed nature, brave and
  // incapable of the give-and-take a city requires, and the word he keeps using of him — αὐθάδεια,
  // «arrogancia terca» — is translated the same way each time so the argument stays visible.
  //
  // Its centre is Volumnia's embassy (33-36), and her speech is translated whole, including the
  // silence that follows it and Coriolano's «Has vencido, madre, una victoria feliz para la patria,
  // pero mortal para mí». So is his death at Ancio and the Volscian mob shouting Tulo down. The
  // grain debate (16-18), where he argues for abolishing the tribunate and starving the people
  // into obedience, is likewise given in full: Plutarch reports it as what condemned him.
  'plutarch-coriolanus': 'greco/plutarch-coriolanus',
  // PELÓPIDAS turns on the liberation of Thebes (7-13), and the whole conspiracy — the dinner, the
  // women, the letter Arquias will not read («los asuntos serios, para mañana») — is kept scene by
  // scene, since Plutarch is writing it as a piece of narrative and its detail IS the point.
  //
  // The Sacred Band (18-19) carries his defence of an army of lovers, Pammenes' reading of Homer
  // and Philip weeping at Queronea over the three hundred; it is translated straight, without
  // euphemism and without commentary, because the argument about ἔρως is Plutarch's own.
  //
  // The dream at Leuctra (20-22) and the sacrifice of the virgin daughters is the Life's hardest
  // passage: the debate among the commanders, Plutarch's own view that no god could want it, and
  // the mare that runs into the camp and is sacrificed instead. All of it is kept, the objections
  // included — the refusal is part of the story, not a gloss on it.
  'plutarch-pelopidas': 'greco/plutarch-pelopidas',
  // PERICLES is the Life of a style as much as of a man, and Plutarch measures it in the comic
  // poets: the squill-head jokes, Cratino's «el que reúne cabezas», Telecleides, Hermipo's anapests
  // calling him «rey de los sátiros». They are kept as verse and as insults; the Spanish does not
  // soften them, since they are his evidence for what Athens felt about the Olympian.
  //
  // The building programme (12-14) and the trial of Fidias (31) are given whole, including the
  // self-portrait on the shield that helped destroy him. So are the eclipse before the last voyage
  // (35.2), Elpinice's rebuke and Pericles' line of Archilochus (28.5), and the deathbed speech at
  // 38.4 — «ningún ateniense de los que viven se ha puesto un manto negro por mi causa» — which is
  // the sentence the whole Life is built to reach.
  //
  // Anaxagoras' νοῦς is «Mente» throughout (4-6, 16, 32), capitalized, because Plutarch is naming a
  // doctrine and not describing a state of mind, and the Megarian decree keeps Poliarces' joke
  // about turning the tablet around (30.3): the pun is the anecdote.
  'plutarch-pericles': 'greco/plutarch-pericles',
  // ALCIBÍADES is a Life about a man who could be anything, and Plutarch says so at 23.4-5 with the
  // chameleon: gymnastic in Sparta, soft in Ionia, a drinker in Thrace, out-Persianing the Persians
  // with Tissaphernes. That list is kept as a list, in the same shape, because it is the thesis.
  //
  // Nothing in it is softened. The Socrates chapters (4-7) are translated as what they are — an
  // ἔρως, with Alcibiades acquiring «una imagen del amor, un contra-amor» (Plato's ἀντέρως) — and so
  // are Timaea's child (23.7), who was called Leotychidas outside the house and Alcibiades inside it,
  // and Alcibiades' own line that he did it so his sons would rule Sparta; the mutilation of the
  // Hermae and the mock mysteries (18-22), including the full text of Thessalus' indictment, which
  // is a legal document and is translated as one; and the death (39), Timandra laying out the body.
  //
  // The comic verse is kept as verse. Aristophanes' joke about the lisp turns on Alcibiades saying
  // «Téolo» for «Téoro» and «cuelvo» for «cuervo», so the Spanish lisps in the same two places
  // rather than explaining the joke in a note.
  'plutarch-alcibiades': 'greco/plutarch-alcibiades',
  // ⚠ CAMILO 38 HAS FOUR SPANISH SECTIONS AND THREE GREEK ONES, ON PURPOSE. This is the second of
  // the two edition differences named in the Solon block above: Perrin cuts the chapter where
  // Ziegler does not, so the corpus carries a row 38:4 with English and no Greek. The Spanish is
  // divided the way the ROWS are, not the way the Greek paragraphs are — 38:3 ends at «ni tenían
  // nada en la conciencia» and 38:4 carries the rest of the one Greek section — so every row has a
  // Spanish beside it and nothing is invented. Demetrius 33 will need the same treatment.
  //
  // The Life is half Roman antiquarianism and it is kept: the Alban lake (3-4), the Praxiergidae and
  // the Plynteria, Numa's fire read as the ἀρχή of all things (20.3-4), the lituus found in the ash
  // (32.5), the Caprotine Nones with BOTH explanations Plutarch gives (33) — the maidservants' ruse
  // and Romulus' disappearance — and the etymology «caprífico» for the wild fig, kept beside the
  // Spanish because the day's name is the argument.
  //
  // Brennus' «¿qué otra cosa sino dolor para los vencidos?» (28.5) is Vae victis in Greek dress, and
  // it stays a plain sentence: Plutarch says it had already become proverbial, so translating it as
  // a proverb would flatten the moment where it is being coined.
  'plutarch-camillus': 'greco/plutarch-camillus',
  // CRASO is the Life of a vice, and the vice has a name Plutarch repeats — φιλοπλουτία, «codicia» —
  // used the same way each time so the through-line from the fire brigades (2.4) to Carrhae stays
  // visible. His inventory of it is translated whole: buying the burning houses, the five hundred
  // builder-slaves, the maxim that no man is rich who cannot feed an army out of his estate (2.7-8).
  //
  // Carrhae (23-31) is given at full length, including what the arrows did to men's bodies (25.5)
  // and the head of Publius on a pike (26.4). Plutarch built the battle as a tragedy and closes it
  // with the Bacchae performed over Crassus' actual head (33.2-4); the Euripides is quoted as verse,
  // and the antiphon «¿Quién lo mató?» / «Mío es el honor» is kept in its dialogue form, because
  // Pomaxathres' jumping up to claim the line is the whole point of the scene.
  //
  // Two Roman terms are kept and glossed in place rather than domesticated: «ovación» for the lesser
  // triumph (11.8, cross-referring to the Marcellus, as Plutarch does) and the decimation of 10.2,
  // named for what it is and counted out — one man in ten of five hundred.
  'plutarch-crassus': 'greco/plutarch-crassus',
  // PIRRO is built around one conversation and one death, and both are kept whole. Cineas' dialogue
  // (14.2-8) is translated as dialogue, in its own back-and-forth, because the argument only works
  // as a chain: Italy, then Sicily, then Libya, then Macedonia — and then «tendremos mucho ocio».
  // Plutarch's point is that Pyrrhus was not persuaded, only saddened, and the last line says so.
  //
  // The Ásculo aftermath (21.9) is the pyrrhic victory itself; it is rendered plainly — «si vencemos
  // a los romanos en otra batalla más, quedaremos del todo perdidos» — with no nod to the modern
  // idiom, since the sentence is where the idiom comes from.
  //
  // The Spartan chapters keep the Doric as Doric jokes rather than smoothing them: Mandroclidas'
  // «si tú eres un dios… y, si eres un hombre, habrá también otro más fuerte que tú» (26.11), and
  // the old men shouting after Acrótato (28.3), which is coarse and is left coarse — the elders are
  // telling him to go bed Chilonis and to make Sparta good sons, and the two halves belong together.
  'plutarch-pyrrhus': 'greco/plutarch-pyrrhus',
  // AGESILAO is Plutarch's test case for whether a man can be schooled by obedience, and the whole
  // Life turns on the recall from Asia (15.4-5), which he calls the finest thing Agesilaus ever did.
  // The comparison with Hannibal and Alexander that frames it is kept, and so is Alexander's sneer
  // about «una batalla de ratones» in Arcadia, which is what the passage is measuring him against.
  //
  // The Spartan institutions are translated as institutions, not paraphrased: the ἀγωγή stays
  // «agogé», the common mess a «fidicio», the message-staff a «escítala», the cowards of Leuctra the
  // τρέσαντες — «temblones» — with Plutarch's description of their half-shaved beards and patched
  // cloaks intact (30.2-3), because the law Agesilaus suspends for one day is a law about them.
  //
  // The ἔρως chapters are given straight, as in the Alcibiades: Lysander's love for the boy (2.1),
  // the kiss Agesilaus fled and then regretted (11.5-7) with his own Doric line about fighting that
  // battle again, and his encouragement of Agesipolis' loves (20.6), where Plutarch says outright
  // that Laconian love has nothing shameful in it.
  'plutarch-agesilaus': 'greco/plutarch-agesilaus',
  // SILA is the Life where Plutarch watches a character change under power, and asks at 30.4-5
  // whether power alters a nature or only uncovers it. He leaves the question open; so does the
  // Spanish, which keeps the sentence as the suspended question it is.
  //
  // The proscriptions (31) are translated in full and without euphemism — the price on each head,
  // the death penalty for sheltering father or son, the disfranchising of the proscribed men's
  // children and grandchildren, and Quinto Aurelio finding his own name and saying «me persigue mi
  // finca del Albano». So are the six thousand butchered within earshot of the senate (30.2-3) and
  // the twelve thousand at Preneste. This is the passage the whole Life exists to reach.
  //
  // Two Roman words are kept and turned in place because Plutarch turns them: «Félix», which he
  // glosses as εὐτυχής, «Afortunado», and which gave the twins Fausto and Fausta their names
  // (34.2-3); and Sila's own Greek self-styling «Epafrodito», which he says stood on the trophies.
  // His disease (36.2-3) is described exactly as Plutarch describes it, φθειρίασις and all.
  'plutarch-sulla': 'greco/plutarch-sulla',
  // CICERON is the Life of a man of words, and that is its whole translation problem: Plutarch keeps
  // the Latin jokes in Greek transliteration and then explains them, so the Spanish keeps them too
  // and lets the explanation do its work — «Cicerón» from `cicer`, the chickpea, and his answer to
  // the friends who told him to change his name (1.3-5); «Verres», the boar, and the pun on the
  // Jewish freedman (7.6-8); the string of retorts collected in 25-27. Where a joke lives entirely
  // in a Latin word, the word stays beside the Spanish rather than being replaced by a Spanish pun
  // Plutarch never made.
  //
  // The Catilinarian executions (19-22) and Cicero's exile and return (30-33) are given straight,
  // including Plutarch's own verdict on the self-praise (24) and the proscription and death (47-49),
  // where the head and hands are nailed to the rostra. Nothing is softened.
  'plutarch-cicero': 'greco/plutarch-cicero',
  // ARATO carries one corpus defect worth recording. At 1:3 the Perseus Greek has a transliterated
  // running title leaked into the sentence — `πλυταρξηʼς λιες`, i.e. *Plutarchi Vitae* — sitting
  // inside οὐ γὰρ ἰδίων ... ἀπορίᾳ καλῶν. That is conversion noise from the printed page, not damage
  // belonging to the text, so by the mirror-the-wound-not-the-scar rule it is silently dropped and
  // the sentence is translated as Plutarch wrote it. Do NOT "restore" it.
  //
  // The Life is addressed to Polycrates and his sons, and the second person of the dedication (1)
  // is kept as second person. Arato's own ὑπομνήματα are quoted against him repeatedly (33, 38);
  // where Plutarch reports what Arato claimed and then disbelieves it, both halves stand.
  'plutarch-aratus': 'greco/plutarch-aratus',
  // MARIO opens on the Roman naming system (1) — praenomen, gentile, cognomen — which Plutarch
  // discusses in Greek without the Latin terms. The Spanish follows him: it explains what he
  // explains and does not import the technical vocabulary he chose not to use.
  //
  // The Life's hardest pages are translated in full: the Cimbrian women killing their own children
  // and themselves at the wagons (27.2-3), the proscriptions and the bardieos (43-44), Cátulo's
  // charcoal, and Mario's death in drink and delirium (45). Two set pieces are kept intact because
  // Plutarch built them as set pieces — the Trebonio case (14.3-5), where the soldier who killed
  // his commanding officer rather than be forced is crowned for it, and the slave sent to kill
  // Mario at Minturnas who cannot (39.2).
  'plutarch-marius': 'greco/plutarch-marius',
  // ⚠ DEMETRIO 33 HAS FIVE SPANISH SECTIONS WHERE THE GREEK STOPS AT FOUR, ON PURPOSE — and it is NOT
  // the Camillus 38 case. There the corpus split one Greek paragraph across two English rows; here the
  // rows are OFFSET BY ONE: the Greek of the last section sits at 33:4 with no English, and its English
  // sits at 33:5 with no Greek (the ratios prove they are the same passage). Since check.py needs every
  // row filled, the Spanish is divided along the ROW boundary — 33:4 carries the Ptolemaic squadron off
  // Aegina, 33:5 the ships from Peloponnese and Cyprus and Lachares' flight — so both rows have Spanish
  // beside them and nothing is invented. Do not "fix" this by moving the Greek.
  //
  // The Life is the first half of the Demetrius–Antony pair, and its preface (1.5-8) says outright that
  // it is included as an example of vice; the Spanish keeps that framing rather than softening it. Two
  // set pieces are given whole: the boy Democles killing himself in the bath-house rather than be forced
  // by Demetrius (24.2-3), and the Athenians' flattery — the Parthenon lodging, the renamed month, the
  // oracle-by-decree — which Plutarch reports as the corruption of a city, not as colour.
  'plutarch-demetrius': 'greco/plutarch-demetrius',
  // LUCULO is the Life of a man who wins everything and loses the credit, and it turns on two things the
  // Spanish keeps sharp: the debt relief in Asia (20), where the one-per-cent cap and the quarter-of-
  // income rule are given as concrete numbers, since that is what makes Plutarch's point; and the long
  // collapse of his army's discipline (33-35), where he is left begging tent by tent and the soldiers
  // throw empty purses at him.
  //
  // The dinner-table chapters (39-41) are translated at full length, including the Apollo dining-room
  // and its fifty thousand drachmas, because Plutarch built the Life as a diptych — «como una comedia
  // antigua», politics first and banquets after — and cutting them would flatten the design he names.
  'plutarch-lucullus': 'greco/plutarch-lucullus',
  // CESAR keeps the Latin where the Greek keeps it. Plutarch transliterates and then explains, so the
  // Spanish does the same: the three-word dispatch from Zela is rendered «Llegué, vi, vencí» with
  // Plutarch's own note that in Latin the three words end alike — the remark is about the Latin, so the
  // Latin has to stay in view. Likewise the die at the Rubicon (32.6) is given as the sentence Plutarch
  // reports, not as a Spanish proverb.
  //
  // The assassination (66) is translated whole and without euphemism, down to the twenty-three wounds
  // and the conspirators wounding one another; and so are the calendar reform (59), Cleopatra in the
  // bedding-sack (49.1), and the epilepsy, which Plutarch treats as a fact of the man's body (17.2,
  // 53.3) and which the Spanish neither hides nor dramatises.
  'plutarch-caesar': 'greco/plutarch-caesar',
  // ⚠ TIMOLEON STARTS AT CHAPTER 0, AND THAT CHAPTER IS NOT TIMOLEON. Its eight sections are
  // Plutarch's preface to the Timoleon-Aemilius PAIR — the passage on writing the Lives as a
  // mirror, and on why these two are set together. It is numbered 0 in the corpus because it
  // belongs to no chapter of the Life proper. It is translated as the preface it is, addressed
  // in the second person to Sossius Senecio, and it must not be renumbered into chapter 1.
  // (The formal comparison of the two men is a separate work, already registered above as
  // plutarch-comp-timoleon-aemilius.)
  //
  // The Life's hinge is the killing of Timoleon's own brother (4.5-8) and the twenty years of
  // withdrawal it cost him (5-7); it is given straight, including the mother shutting her door
  // and the attempt to starve himself. Plutarch's long digression on Dionysius reduced to a
  // private man in Corinth (14-15) is kept whole rather than trimmed, because he says outright
  // it is not out of place in writing Lives — cutting it would delete his defence of it.
  'plutarch-timoleon': 'greco/plutarch-timoleon',
  // Catón el Joven (73 caps / 318 §§). Tres heridas del griego de Perseus, ninguna nuestra:
  // 10:2 «ὥς τι λιστον ᾑρηκὼς» perdió la primera sílaba de κάλλιστον (el español traduce el
  // sentido, como en Peregrinus 1); 36:1 abre con «ι δὲ ἐν Κύπρῳ», mutilado el arranque; y
  // 37:4 repite la última cláusula de 37:3 («χρόνον ἐν ὀργῇ διατελεῖν·») — dittografía del
  // límite de sección, NO espejada. El «?» suelto de 7:3 y el «?Ὡς» de 32:1 son ruido de
  // conversión, descartados en silencio. En 73:2 los epigramas juegan con Ψυχή, el NOMBRE
  // de la mujer de Marfadates — se conserva en griego con «alma» al lado, regla keep-the-Greek.
  'plutarch-cato-the-younger': 'greco/plutarch-cato-the-younger',
  // Emilio Paulo (38 caps / 319 §§). EMPIEZA EN EL CAPÍTULO 2 — el corpus no trae capítulo 1
  // (cf. el capítulo 0 de Timoleón: la numeración del corpus manda, no se «arregla»).
  // En 2:2 la etimología del nombre — Mamerco llamado Emilio «διʼ αἱμυλίαν λόγου» — conserva
  // αἱμυλία en griego con su sentido al lado; en 23:10 el juego κρητίζειν πρὸς Κρῆτας
  // («hacer de cretense con cretenses») conserva el verbo, regla keep-the-Greek.
  'plutarch-aemilius-paulus': 'greco/plutarch-aemilius-paulus',
  // Antonio (87 caps / 359 §§). Keep-the-Greek en tres sitios: 4:4 conserva «decies» (el
  // latín de las 250.000 dracmas); 62:3 el chiste de Cleopatra sobre Torine conserva
  // τορύνη («el cucharón»); 81:2 conserva πολυκαισαρίη, el calco del verso homérico
  // contra el mando de muchos — traducir cualquiera de los tres borra el chiste.
  'plutarch-antony': 'greco/plutarch-antony',
  // Alejandro (77 caps / 377 §§). Keep-the-Greek en tres juegos de palabras: 24:5 los adivinos
  // dividen Σά-τυρος en «σὴ Τύρος» (tuya será Tiro); 27:5 el barbarismo del profeta de Amón
  // convierte «ὦ παιδίον» en «ὦ παιδίος» ≈ παῖ Διός (hijo de Zeus); 37:1 la Pitia profetiza un
  // λύκος (lobo) como guía — el guía era Λύκιος (licio). También 65:3: Cálano se llamaba Esfines,
  // «Cálano» viene de su saludo indio «kalé».
  'plutarch-alexander': 'greco/plutarch-alexander',
  // Dión (58 caps / 388 §§). Keep-the-Greek en 5:9: Dionisio hace de Γέλων (Gelón) el γέλως
  // (hazmerreír) de Sicilia. Ruido de conversión en el griego de origen (19:8 «μ?ὲν», 56:3
  // «ζ?ῆν»): erratas de digitalización, no herida textual — se omiten sin espejo.
  'plutarch-dion': 'greco/plutarch-dion',
  // Pompeyo (80 caps / 392 §§). HERIDA DEL CORPUS espejada en 52:4: el griego de Perseus se corta
  // a mitad de palabra («παρέ[σχε]») al final de la sección — el español termina igual en «ofre—».
  // Dichos conservados en 50:1 («Navegar es necesario; vivir no es necesario»), 77:4 («Un muerto
  // no muerde»), 60:2 («¡Quede echado el dado!»).
  'plutarch-pompey': 'greco/plutarch-pompey',
  // Bruto (53 caps / 400 §§) — la última de las 35 Vidas Paralelas. Ruido de digitalización en el
  // griego (27:5 «δ?»): errata, no herida — se omite sin espejo. El dicho de Teódoto («un muerto
  // no muerde») aparece dos veces (33:5 y en Pompeyo 77:4) — misma fórmula en ambas.
  'plutarch-brutus': 'greco/plutarch-brutus',
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
