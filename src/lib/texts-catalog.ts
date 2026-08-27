// Catalog for the /texts library page — the ancient texts students can read in a
// Reader-style view (Greek with parsing + parallel English where available, or English
// prose). All the data these point at was sourced and embedded elsewhere in the repo:
//   lxx      → public/data/lxx/<osisId>_<chapter>.json via /api/reader (word-level Greek)
//   brenton  → public/data/brenton/<osisId>.json (Brenton's English LXX)
//   josephus → public/data/josephus/<work>/<book>.json (Whiston, book→chapter→section)
//   2esdras  → public/data/apocrypha/2esdras.json (KJV, chapter→verse)
//   1enoch / jubilees / 2baruch / 2enoch / tp-* (Testaments of the Twelve Patriarchs)
//            → public/data/pseudepigrapha/… (chapter→verse English prose; the full registry
//              lives in lib/prose-texts.ts, which also drives the Backgrounds cross-ref pane)
import { TWELVE_PATRIARCHS_CATALOG, PHILO_CATALOG, AF_CATALOG, TG_CATALOG, ANF_CATALOG, JUSTIN_CATALOG, EUSEBIUS_CATALOG, EUSEBIUS_PE_CATALOG, CLEMENT_CATALOG, ORIGEN_CATALOG, ORIGEN_PRINC_CATALOG, ORIGEN_GREEK_ONLY_CATALOG, ATHANASIUS_CATALOG, MISHNAH_CATALOG, YERUSHALMI_CATALOG, BAVLI_CATALOG, TOSEFTA_CATALOG, GRECO_CATALOG, PLATO_CATALOG, ARISTOTLE_CATALOG, PLUTARCH_CATALOG, APOLLODORUS_CATALOG, LUCIAN_CATALOG, XENOPHON_CATALOG, QUINTILIAN_CATALOG, THUCYDIDES_CATALOG, POLYBIUS_CATALOG, STRABO_CATALOG, PAUSANIAS_CATALOG, ORATOR_CATALOG, HOMER_CATALOG, HESIOD_CATALOG, HERODOTUS_CATALOG, DIO_CHAPTER_NUMBERS, type EmbeddedProseSource } from '@/lib/prose-texts'

export type TextSource = 'lxx' | 'josephus' | EmbeddedProseSource

export interface CatalogWork {
  id: string
  name: string
  source: TextSource
  // lxx / 2esdras
  osisId?: string
  chapters?: number
  english?: 'brenton' | 'bsb'   // parallel English available for a Greek (lxx) work
  greek?: boolean               // parallel Greek stored per verse (prose works, e.g. Epictetus)
  // Actual chapter numbers, when they are not a contiguous 1..chapters. A few works have
  // gaps: the Sibylline Oracles run 1-8 then 11-14, and Life of Adam and Eve / 3 Baruch
  // skip chapters their manuscript tradition lacks. Without this the reader queues numbers
  // that have no text and stalls on "Loading next chapter…", and the chapter picker offers
  // them. `chapters` stays the count, for callers that only need a total.
  chapterNumbers?: number[]
  // Opens in Greek-only view (the Greek Sibylline, whose second column is empty for all but
  // the Book 8 acrostic). The Greek/second-column selector is still offered.
  greekOnly?: boolean
  // 'hebrew' renders the original column right-to-left in the Hebrew face (the Talmud Bavli's
  // Aramaic). Absent means Greek/Latin, i.e. left-to-right.
  script?: 'hebrew'
  // Name of the second column when it is not English — e.g. the Latin of Augustine's
  // rendering of the Sibylline acrostic. Defaults to 'English'.
  secondaryLabel?: string
  // Whose edition the original-language column prints — "Niese", "Rahlfs", "Perseus". Shown in
  // the layout control, which is the only place on screen that speaks for that column: without
  // it a reader sees the English translator named and reasonably assumes he made the Greek too.
  greekEdition?: string
  // Name of the FIRST ("original") column when it is not Greek — 'Latin' for Quintilian.
  // Defaults to 'Greek'; also turns off the Greek Beta-Code search transliteration.
  primaryLabel?: string
  // A sibling work to offer "read alongside" — the id of a work covering the SAME text whose
  // chapters correspond one-to-one, so opening it at the reader's current chapter lands on the
  // matching passage. Used by the two Sibyllines, which are separate works precisely because
  // their LINE numbering does not correspond (Terry's blank verse runs ~1.17 lines to the Greek's
  // hexameter, unevenly, so no line-level pairing is recoverable) while their BOOK numbering
  // matches exactly, 1-8 and 11-14 on both sides. Point it only at a work whose chapter numbers
  // genuinely align; it makes no attempt to translate a position beyond the chapter.
  alongside?: string
  // josephus
  work?: string                 // directory under public/data/josephus/
  books?: number[]              // chapter count per book (index → book number - 1)
  // Explicit menu grouping, for collections whose sub-heading isn't an author. Greco-Roman
  // derives its middle menu level from the "Author, Title" name prefix; the Rabbinic corpora
  // need the same two-level layout but their names are sigla ("b. Berakhot"), and `name` is
  // also the reader heading and the copied citation, so it can't be rewritten to suit a menu.
  group?: string
}

export interface TextCategory {
  id: string
  label: string
  blurb?: string
  comingSoon?: boolean
  works: CatalogWork[]
}

// A run of works by one author within a category's menu. `author` is null for a
// stand-alone work that shouldn't get its own heading.
export interface AuthorGroup {
  author: string | null
  works: CatalogWork[]
}

/** A work's menu sub-heading: an explicit `group`, else the "Author, Title" name prefix. */
export function authorOf(w: CatalogWork): string | null {
  if (w.group) return w.group
  const i = w.name.indexOf(', ')
  return i > 0 ? w.name.slice(0, i) : null
}

/** The work's title as listed under its heading — the "Author, " prefix stripped, or for an
 *  explicitly grouped work the citation siglum ("b. ", "m. ") that the heading already says. */
export function workTitleWithoutAuthor(w: CatalogWork): string {
  if (w.group) return w.name.replace(/^[a-z]{1,2}\.\s+/, '')
  const i = w.name.indexOf(', ')
  return i > 0 ? w.name.slice(i + 2) : w.name
}

/**
 * Gather a category's works under their author (e.g. Plato, Aristotle), so the Texts
 * menus can show author headings instead of a long flat list. Only authors with two or
 * more works get a heading; a lone work stays ungrouped (author = null) so single-book
 * authors don't sprout a redundant one-item heading. Input order is preserved (same-author
 * works are already consecutive in the catalog).
 */
export function groupWorksByAuthor(works: CatalogWork[]): AuthorGroup[] {
  const counts = new Map<string, number>()
  for (const w of works) {
    const a = authorOf(w)
    if (a) counts.set(a, (counts.get(a) ?? 0) + 1)
  }
  const groups: AuthorGroup[] = []
  let cur: AuthorGroup | null = null
  for (const w of works) {
    const a = authorOf(w)
    if (a && (counts.get(a) ?? 0) >= 2) {
      if (!cur || cur.author !== a) { cur = { author: a, works: [] }; groups.push(cur) }
      cur.works.push(w)
    } else {
      groups.push({ author: null, works: [w] })
      cur = null
    }
  }
  return groups
}

const RAW_CATEGORIES: TextCategory[] = [
  {
    id: 'apocrypha',
    label: 'Apocrypha',
    blurb: 'Deuterocanonical books — Greek (Septuagint) with Brenton’s English alongside.',
    works: [
      { id: 'Tob', name: 'Tobit', source: 'lxx', osisId: 'Tob', chapters: 14, english: 'brenton' },
      { id: 'Jdt', name: 'Judith', source: 'lxx', osisId: 'Jdt', chapters: 16, english: 'brenton' },
      { id: 'EsthGr', name: 'Esther (Greek)', source: 'lxx', osisId: 'EsthGr', chapters: 10, english: 'brenton' },
      { id: '1Esd', name: '1 Esdras', source: 'lxx', osisId: '1Esd', chapters: 9, english: 'brenton' },
      { id: '2esdras', name: '2 Esdras', source: '2esdras', chapters: 16 },
      { id: '1Macc', name: '1 Maccabees', source: 'lxx', osisId: '1Macc', chapters: 16, english: 'brenton' },
      { id: '2Macc', name: '2 Maccabees', source: 'lxx', osisId: '2Macc', chapters: 15, english: 'brenton' },
      { id: '3Macc', name: '3 Maccabees', source: 'lxx', osisId: '3Macc', chapters: 7, english: 'brenton' },
      { id: '4Macc', name: '4 Maccabees', source: 'lxx', osisId: '4Macc', chapters: 18, english: 'brenton' },
      { id: 'Wis', name: 'Wisdom of Solomon', source: 'lxx', osisId: 'Wis', chapters: 19, english: 'brenton' },
      { id: 'Sir', name: 'Sirach', source: 'lxx', osisId: 'Sir', chapters: 51, english: 'brenton' },
      { id: 'Bar', name: 'Baruch', source: 'lxx', osisId: 'Bar', chapters: 5, english: 'brenton' },
      { id: 'EpJer', name: 'Epistle of Jeremiah', source: 'lxx', osisId: 'EpJer', chapters: 1, english: 'brenton' },
      { id: 'Sus', name: 'Susanna', source: 'lxx', osisId: 'Sus', chapters: 1, english: 'brenton' },
      { id: 'Bel', name: 'Bel and the Dragon', source: 'lxx', osisId: 'Bel', chapters: 1, english: 'brenton' },
      { id: 'DanLXX', name: 'Daniel (LXX)', source: 'lxx', osisId: 'DanLXX', chapters: 12 },
      // Theodotion's Daniel, which is the recension every English Bible actually translates. The
      // Old Greek above it is a different book in chapters 3-6, so a student reading it against an
      // English column was comparing two different texts; this gives them one that corresponds.
      { id: 'DanTh', name: 'Daniel (Theodotion)', source: 'lxx', osisId: 'DanTh', chapters: 12 },
      // Greek from the LXX; English is G. Buchanan Gray's 1913 translation, written into the
      // brenton/ side-file because that is the mechanism for LXX English — the directory name
      // is not a claim about the translator.
      { id: 'PsSol', name: 'Psalms of Solomon', source: 'lxx', osisId: 'PsSol', chapters: 18, english: 'brenton' },
      // English here covers ODE 12 ONLY — the Prayer of Manasseh, in the KJV Apocrypha. The other
      // thirteen Odes are canticles lifted from books that already have English elsewhere in the
      // library (Exodus 15, Deuteronomy 32, Jonah 2, Habakkuk 3 …); the prayer is the one Ode that
      // is not a quotation, so it was the only part of this work no English reader could reach.
      { id: 'Odes', name: 'Odes', source: 'lxx', osisId: 'Odes', chapters: 14, english: 'brenton' },
    ],
  },
  {
    id: 'josephus',
    label: 'Josephus',
    blurb: 'The complete works of Flavius Josephus — the Greek (Niese) with Whiston’s English alongside, numbered by the standard Niese sections (Perseus, CC-BY-SA).',
    works: [
      { id: 'antiquities', name: 'Antiquities of the Jews', source: 'josephus', work: 'antiquities', greek: true, greekEdition: 'Niese', books: [22, 16, 15, 8, 11, 14, 15, 15, 14, 11, 8, 11, 16, 16, 11, 11, 13, 9, 9, 12] },
      { id: 'jewish-war', name: 'The Jewish War', source: 'josephus', work: 'jewish-war', greek: true, greekEdition: 'Niese', books: [33, 22, 10, 11, 13, 10, 11] },
      { id: 'against-apion', name: 'Against Apion', source: 'josephus', work: 'against-apion', greek: true, greekEdition: 'Niese', books: [1, 1] },
      { id: 'life', name: 'The Life', source: 'josephus', work: 'life', greek: true, greekEdition: 'Niese', books: [1] },
    ],
  },
  {
    id: 'philo',
    label: 'Philo',
    blurb: 'The complete works of Philo of Alexandria, in C. D. Yonge’s English translation, numbered by the standard Cohn-Wendland sections.',
    works: PHILO_CATALOG,
  },
  {
    id: 'septuagint',
    label: 'Septuagint (OT)',
    blurb: 'The Greek Old Testament with parsing, and Brenton’s 1851 English alongside.',
    works: [
      { id: 'Gen', name: 'Genesis', source: 'lxx', osisId: 'Gen', chapters: 50, english: 'brenton' },
      { id: 'Exod', name: 'Exodus', source: 'lxx', osisId: 'Exod', chapters: 40, english: 'brenton' },
      { id: 'Lev', name: 'Leviticus', source: 'lxx', osisId: 'Lev', chapters: 27, english: 'brenton' },
      { id: 'Num', name: 'Numbers', source: 'lxx', osisId: 'Num', chapters: 36, english: 'brenton' },
      { id: 'Deut', name: 'Deuteronomy', source: 'lxx', osisId: 'Deut', chapters: 34, english: 'brenton' },
      { id: 'JoshB', name: 'Joshua', source: 'lxx', osisId: 'JoshB', chapters: 24, english: 'brenton' },
      { id: 'JudgB', name: 'Judges', source: 'lxx', osisId: 'JudgB', chapters: 21, english: 'brenton' },
      { id: 'Ruth', name: 'Ruth', source: 'lxx', osisId: 'Ruth', chapters: 4, english: 'brenton' },
      { id: '1Sam', name: '1 Samuel', source: 'lxx', osisId: '1Sam', chapters: 31, english: 'brenton' },
      { id: '2Sam', name: '2 Samuel', source: 'lxx', osisId: '2Sam', chapters: 24, english: 'brenton' },
      { id: '1Kgs', name: '1 Kings', source: 'lxx', osisId: '1Kgs', chapters: 22, english: 'brenton' },
      { id: '2Kgs', name: '2 Kings', source: 'lxx', osisId: '2Kgs', chapters: 25, english: 'brenton' },
      { id: '1Chr', name: '1 Chronicles', source: 'lxx', osisId: '1Chr', chapters: 29, english: 'brenton' },
      { id: '2Chr', name: '2 Chronicles', source: 'lxx', osisId: '2Chr', chapters: 36, english: 'brenton' },
      { id: 'Ezra', name: 'Ezra', source: 'lxx', osisId: 'Ezra', chapters: 10, english: 'brenton' },
      { id: 'Neh', name: 'Nehemiah', source: 'lxx', osisId: 'Neh', chapters: 13, english: 'brenton' },
      { id: 'Job', name: 'Job', source: 'lxx', osisId: 'Job', chapters: 42, english: 'brenton' },
      { id: 'Ps', name: 'Psalms', source: 'lxx', osisId: 'Ps', chapters: 151, english: 'brenton' },
      { id: 'Prov', name: 'Proverbs', source: 'lxx', osisId: 'Prov', chapters: 31, english: 'brenton' },
      { id: 'Song', name: 'Song of Songs', source: 'lxx', osisId: 'Song', chapters: 8, english: 'brenton' },
      { id: 'Isa', name: 'Isaiah', source: 'lxx', osisId: 'Isa', chapters: 66, english: 'brenton' },
      { id: 'Jer', name: 'Jeremiah', source: 'lxx', osisId: 'Jer', chapters: 52, english: 'brenton' },
      { id: 'Lam', name: 'Lamentations', source: 'lxx', osisId: 'Lam', chapters: 6, english: 'brenton' },
      { id: 'Ezek', name: 'Ezekiel', source: 'lxx', osisId: 'Ezek', chapters: 48, english: 'brenton' },
      { id: 'Hos', name: 'Hosea', source: 'lxx', osisId: 'Hos', chapters: 14, english: 'brenton' },
      { id: 'Joel', name: 'Joel', source: 'lxx', osisId: 'Joel', chapters: 4, english: 'brenton' },
      { id: 'Amos', name: 'Amos', source: 'lxx', osisId: 'Amos', chapters: 9, english: 'brenton' },
      { id: 'Obad', name: 'Obadiah', source: 'lxx', osisId: 'Obad', chapters: 1, english: 'brenton' },
      { id: 'Jonah', name: 'Jonah', source: 'lxx', osisId: 'Jonah', chapters: 4, english: 'brenton' },
      { id: 'Mic', name: 'Micah', source: 'lxx', osisId: 'Mic', chapters: 7, english: 'brenton' },
      { id: 'Nah', name: 'Nahum', source: 'lxx', osisId: 'Nah', chapters: 3, english: 'brenton' },
      { id: 'Hab', name: 'Habakkuk', source: 'lxx', osisId: 'Hab', chapters: 3, english: 'brenton' },
      { id: 'Zeph', name: 'Zephaniah', source: 'lxx', osisId: 'Zeph', chapters: 3, english: 'brenton' },
      { id: 'Hag', name: 'Haggai', source: 'lxx', osisId: 'Hag', chapters: 2, english: 'brenton' },
      { id: 'Zech', name: 'Zechariah', source: 'lxx', osisId: 'Zech', chapters: 14, english: 'brenton' },
      { id: 'Mal', name: 'Malachi', source: 'lxx', osisId: 'Mal', chapters: 3, english: 'brenton' },
    ],
  },
  {
    id: 'pseudepigrapha',
    label: 'Pseudepigrapha',
    blurb: 'Old Testament Pseudepigrapha — 1 Enoch, Jubilees, the Baruch apocalypses, the Testaments of the Twelve Patriarchs, and more, in their public-domain English translations.',
    works: [
      { id: '1enoch', name: '1 Enoch', source: '1enoch', chapters: 108 },
      { id: 'jubilees', name: 'Jubilees', source: 'jubilees', chapters: 50 },
      // 87, not 85: the Wesley Center text we imported stops at 85:2, so the end of the
      // Epistle came from Charles's 1918 edition (scripts/build-2baruch-tail.py).
      { id: '2baruch', name: '2 Baruch (Syriac Apocalypse)', source: '2baruch', chapters: 87 },
      { id: '2enoch', name: '2 Enoch (Secrets of Enoch)', source: '2enoch', chapters: 68 },
      { id: 'apocmoses', name: 'Apocalypse of Moses', source: 'apocmoses', chapters: 43 },
      // All 51 chapters: 3, 32 and 37 were never missing, only run into the chapter before
      // them by a reader that expected one shape of marker (scripts/build-lae.py).
      { id: 'lae', name: 'Life of Adam and Eve', source: 'lae', chapters: 51 },
      { id: 'assumption-moses', name: 'The Assumption of Moses', source: 'assumption-moses', chapters: 12 },
      // All 17 chapters: 4 and 12 were never missing, only run into their neighbours by a
      // reader of the source page that expected one shape of chapter marker (build-3baruch.py).
      { id: '3baruch', name: '3 Baruch (Greek Apocalypse)', source: '3baruch', chapters: 17 },
      // The 53-chapter division scholarship cites, in the Greek of manuscript P with our
      // own English facing it — all 390 verses are translated, so it reads in parallel.
      { id: 'tjob-greek', name: 'Testament of Job', source: 'tjob-greek', chapters: 53, greek: true },
      { id: 'josaseneth', name: 'Joseph and Aseneth', source: 'josaseneth', chapters: 29 },
      { id: 'aristeas', name: 'Letter of Aristeas', source: 'aristeas', chapters: 1, greek: true },
      { id: 'sibylline', name: 'Sibylline Oracles', source: 'sibylline', chapters: 14, chapterNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14], alongside: 'sibylline-greek' },
      { id: 'sibylline-greek', name: 'Sibylline Oracles (Greek)', source: 'sibylline-greek', chapters: 14, chapterNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14], greek: true, greekOnly: true, secondaryLabel: 'Latin', alongside: 'sibylline' },
      { id: 'pseudo-philo', name: 'Pseudo-Philo (Biblical Antiquities / L.A.B.)', source: 'pseudo-philo', chapters: 65 },
      { id: 'testament-of-solomon', name: 'Testament of Solomon', source: 'testament-of-solomon', chapters: 130 },
      { id: 'testament-of-abraham-a', name: 'Testament of Abraham (Recension A)', source: 'testament-of-abraham-a', chapters: 20 },
      { id: 'testament-of-abraham-b', name: 'Testament of Abraham (Recension B)', source: 'testament-of-abraham-b', chapters: 14 },
      { id: 'odes-of-solomon', name: 'Odes of Solomon', source: 'odes-of-solomon', chapters: 42 },
      { id: 'ascension-of-isaiah', name: 'Ascension of Isaiah (with Martyrdom of Isaiah)', source: 'ascension-of-isaiah', chapters: 11 },
      // The Testaments of the Twelve Patriarchs (Ante-Nicene Fathers / Roberts-Donaldson).
      ...TWELVE_PATRIARCHS_CATALOG,
    ],
  },
  {
    id: 'targums',
    label: 'Targums',
    blurb: 'Aramaic paraphrases of the Hebrew Bible — Targum Isaiah (Pauli) and Targum Pseudo-Jonathan on the Pentateuch (Etheridge), in their public-domain translations.',
    works: TG_CATALOG,
  },
  {
    id: 'apostolic-fathers',
    label: 'Apostolic Fathers',
    blurb: 'The earliest post-New-Testament Christian writings — 1 &amp; 2 Clement, the letters of Ignatius, Polycarp, the Didache, Barnabas, Diognetus, and the Martyrdom of Polycarp — in Lightfoot’s translation.',
    works: AF_CATALOG,
  },
  {
    id: 'church-fathers',
    label: 'Church Fathers',
    blurb: 'The Ante-Nicene Fathers — Justin Martyr’s Dialogue and Apologies, Irenaeus’s Against Heresies, and Eusebius’s Ecclesiastical History — in public-domain translations.',
    works: [...JUSTIN_CATALOG, ...ANF_CATALOG, ...EUSEBIUS_CATALOG, ...EUSEBIUS_PE_CATALOG, ...CLEMENT_CATALOG, ...ORIGEN_CATALOG, ...ORIGEN_PRINC_CATALOG, ...ORIGEN_GREEK_ONLY_CATALOG, ...ATHANASIUS_CATALOG],
  },
  {
    id: 'nt-apocrypha',
    label: 'NT Apocrypha',
    blurb: 'Early Christian apocrypha — the Protevangelium of James, the Gospel of Peter (Akhmim fragment), and the Acts of Paul and Thecla — in M. R. James’s public-domain translation.',
    works: [
      { id: 'protevangelium', name: 'The Protevangelium of James', source: 'protevangelium', chapters: 25 },
      { id: 'gospel-of-peter', name: 'The Gospel of Peter', source: 'gospel-of-peter', chapters: 14 },
      { id: 'paul-and-thecla', name: 'The Acts of Paul and Thecla', source: 'paul-and-thecla', chapters: 1 },
    ],
  },
  {
    id: 'greco-roman',
    label: 'Greco-Roman',
    blurb: 'Greek and Roman authors that illuminate the New Testament world — Homer, Hesiod, Herodotus, Plato, Aristotle, Xenophon, Epictetus, Lucian, Diogenes Laertius, Apollodorus, Seneca and Quintilian, with the Greek (or Latin) and public-domain English side by side (Perseus, CC-BY-SA). Plutarch is here complete: all the Parallel Lives with their comparisons, and the whole of the Moralia. Includes a curated set of the pagan passages the New Testament quotes. Browse by author, then work.',
    // The curated "Pagan Sources" overview stays pinned first; every author below it is sorted
    // alphabetically. Each work's `name` is "Author, Title", so a plain name sort orders them by
    // author and then title — keeping an author's books consecutive for groupWorksByAuthor.
    works: [
      { id: 'nt-pagan-sources', name: 'Pagan Sources Quoted in the New Testament', source: 'nt-pagan-sources', chapters: 4, greek: true },
      ...([
        ...PLATO_CATALOG, ...ARISTOTLE_CATALOG, ...XENOPHON_CATALOG, ...PLUTARCH_CATALOG,
        { id: 'marcus-aurelius-meditations', name: 'Marcus Aurelius, Meditations', source: 'marcus-aurelius-meditations', chapters: 12, greek: true, greekOnly: true },
        { id: 'philostratus-apollonius', name: 'Philostratus, Life of Apollonius of Tyana', source: 'philostratus-apollonius', chapters: 8, greek: true, greekOnly: true },
        { id: 'aratus-phaenomena', name: 'Aratus, Phaenomena', source: 'aratus-phaenomena', chapters: 8, greek: true, greekOnly: true },
        // Not greekOnly: the English is our own working translation, made for this app
        // directly from the public-domain Walz Greek (see scripts/theon-english.json).
        { id: 'theon-progymnasmata', name: 'Theon, Progymnasmata', source: 'theon-progymnasmata', chapters: 5, greek: true },
        { id: 'dio-chrysostom-orations', name: 'Dio Chrysostom, Orations', source: 'dio-chrysostom-orations', chapters: DIO_CHAPTER_NUMBERS[DIO_CHAPTER_NUMBERS.length - 1], chapterNumbers: DIO_CHAPTER_NUMBERS, greek: true },
        ...HOMER_CATALOG, ...HESIOD_CATALOG, ...HERODOTUS_CATALOG, ...THUCYDIDES_CATALOG,
        ...POLYBIUS_CATALOG, ...STRABO_CATALOG, ...PAUSANIAS_CATALOG, ...ORATOR_CATALOG,
        ...GRECO_CATALOG, ...LUCIAN_CATALOG, ...APOLLODORUS_CATALOG, ...QUINTILIAN_CATALOG,
      ] as CatalogWork[]).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    ],
  },
  {
    id: 'rabbinic',
    label: 'Rabbinic',
    blurb: 'The classical rabbinic corpora, browsed by collection and then tractate. The Mishnah — the foundational law code (c. 200 CE), in Dr. Joshua Kulp’s translation (CC-BY). The Tosefta — its companion collection (c. 200–300 CE), 61 tractates in Hebrew from the public-domain text. The Jerusalem Talmud (c. 400 CE), all 39 tractates in Heinrich Guggenheimer’s translation (De Gruyter, CC-BY). The Babylonian Talmud (c. 500 CE), all 37 tractates in Aramaic from the Wikisource Vilna text (CC BY-SA) — no English, its one good translation being licensed non-commercially. All via Sefaria.',
    // Chronological by collection (Mishnah → Tosefta → Yerushalmi → Bavli) rather than
    // alphabetical, which is why 'rabbinic' is in KEEP_ORDER below. groupWorksByAuthor needs a
    // collection's tractates to be consecutive, and each *_CATALOG is already one run.
    works: ([
      [MISHNAH_CATALOG, 'Mishnah'],
      [TOSEFTA_CATALOG, 'Tosefta'],
      [YERUSHALMI_CATALOG, 'Jerusalem Talmud'],
      [BAVLI_CATALOG, 'Babylonian Talmud'],
    ] as [CatalogWork[], string][]).flatMap(([works, group]) =>
      works.map(w => ({ ...w, group }))
        // The registries are in their own order (the Mishnah's starts at Sanhedrin); the
        // category-level sort no longer reaches these, so each collection sorts its own
        // tractates alphabetically here.
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))),
  },
  { id: 'dss', label: 'Dead Sea Scrolls', comingSoon: true, works: [] },
]

// Within each category the works are listed alphabetically by author (a plain name sort keeps an
// author's books consecutive, since every name is "Author, Title"). Two exceptions keep their
// deliberate order: scripture stays in canonical book order, Greco-Roman is arranged by hand
// (its curated "Pagan Sources" overview is pinned first, the rest already alphabetical), and
// Rabbinic runs chronologically by collection (each sorting its own tractates as it is built).
const KEEP_ORDER = new Set(['apocrypha', 'septuagint', 'greco-roman', 'rabbinic'])
export const TEXT_CATEGORIES: TextCategory[] = RAW_CATEGORIES.map(c =>
  c.comingSoon || KEEP_ORDER.has(c.id)
    ? c
    // numeric:true so "Book 2" sorts before "Book 10" (e.g. Eusebius's ten books), not after.
    : { ...c, works: [...c.works].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) },
)

// Look up a Greek OT/Apocrypha book by its osisId — used by "Open in Texts" links
// elsewhere in the app (e.g. Backgrounds' cross-reference pane) to check whether a
// reference is actually embedded here before offering to open it.
export function findLxxWork(osisId: string): CatalogWork | undefined {
  for (const cat of TEXT_CATEGORIES) {
    const w = cat.works.find(w => w.source === 'lxx' && w.osisId === osisId)
    if (w) return w
  }
  return undefined
}

// Look up a Josephus work by its directory name (public/data/josephus/<work>/).
export function findJosephusWork(workDir: string): CatalogWork | undefined {
  const josephus = TEXT_CATEGORIES.find(c => c.id === 'josephus')
  return josephus?.works.find(w => w.work === workDir)
}

// Look up a catalog work by its unique id (used by the /texts page's ?work= deep-link and the
// header Texts menu). The category is returned too, for opening the menu on the right section.
export function findWork(id: string): { work: CatalogWork; category: TextCategory } | undefined {
  for (const category of TEXT_CATEGORIES) {
    const work = category.works.find(w => w.id === id)
    if (work) return { work, category }
  }
  return undefined
}
