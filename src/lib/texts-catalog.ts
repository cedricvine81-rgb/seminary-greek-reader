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
import { TWELVE_PATRIARCHS_CATALOG, PHILO_CATALOG, AF_CATALOG, TG_CATALOG, ANF_CATALOG, JUSTIN_CATALOG, MISHNAH_CATALOG, GRECO_CATALOG, type EmbeddedProseSource } from '@/lib/prose-texts'

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
  // Name of the second column when it is not English — e.g. the Latin of Augustine's
  // rendering of the Sibylline acrostic. Defaults to 'English'.
  secondaryLabel?: string
  // josephus
  work?: string                 // directory under public/data/josephus/
  books?: number[]              // chapter count per book (index → book number - 1)
}

export interface TextCategory {
  id: string
  label: string
  blurb?: string
  comingSoon?: boolean
  works: CatalogWork[]
}

export const TEXT_CATEGORIES: TextCategory[] = [
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
      { id: 'PsSol', name: 'Psalms of Solomon', source: 'lxx', osisId: 'PsSol', chapters: 18 },
      { id: 'Odes', name: 'Odes', source: 'lxx', osisId: 'Odes', chapters: 14 },
    ],
  },
  {
    id: 'josephus',
    label: 'Josephus',
    blurb: 'The complete works of Flavius Josephus — the Greek (Niese) with Whiston’s English alongside, numbered by the standard Niese sections (Perseus, CC-BY-SA).',
    works: [
      { id: 'antiquities', name: 'Antiquities of the Jews', source: 'josephus', work: 'antiquities', greek: true, books: [22, 16, 15, 8, 11, 14, 15, 15, 14, 11, 8, 11, 16, 16, 11, 11, 13, 9, 9, 12] },
      { id: 'jewish-war', name: 'The Jewish War', source: 'josephus', work: 'jewish-war', greek: true, books: [33, 22, 10, 11, 13, 10, 11] },
      { id: 'against-apion', name: 'Against Apion', source: 'josephus', work: 'against-apion', greek: true, books: [1, 1] },
      { id: 'life', name: 'The Life', source: 'josephus', work: 'life', greek: true, books: [1] },
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
      { id: 'Eccl', name: 'Ecclesiastes', source: 'lxx', osisId: 'Eccl', chapters: 12, english: 'brenton' },
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
      { id: '2baruch', name: '2 Baruch (Syriac Apocalypse)', source: '2baruch', chapters: 85 },
      { id: '2enoch', name: '2 Enoch (Secrets of Enoch)', source: '2enoch', chapters: 68 },
      { id: 'apocmoses', name: 'Apocalypse of Moses', source: 'apocmoses', chapters: 43 },
      { id: 'lae', name: 'Life of Adam and Eve', source: 'lae', chapters: 51, chapterNumbers: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51] },
      { id: '3baruch', name: '3 Baruch (Greek Apocalypse)', source: '3baruch', chapters: 17, chapterNumbers: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17] },
      { id: 'tjob', name: 'Testament of Job', source: 'tjob', chapters: 12 },
      { id: 'apocabr', name: 'Apocalypse of Abraham', source: 'apocabr', chapters: 32 },
      { id: 'josaseneth', name: 'Joseph and Aseneth', source: 'josaseneth', chapters: 29 },
      { id: 'aristeas', name: 'Letter of Aristeas', source: 'aristeas', chapters: 1 },
      { id: 'sibylline', name: 'Sibylline Oracles', source: 'sibylline', chapters: 14, chapterNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14] },
      { id: 'sibylline-greek', name: 'Sibylline Oracles (Greek)', source: 'sibylline-greek', chapters: 14, chapterNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14], greek: true, greekOnly: true, secondaryLabel: 'Latin' },
      { id: 'pseudo-philo', name: 'Pseudo-Philo (Biblical Antiquities / L.A.B.)', source: 'pseudo-philo', chapters: 65 },
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
    blurb: 'The Ante-Nicene Fathers — Justin Martyr’s Dialogue and Apologies, and Irenaeus’s Against Heresies — in the Roberts-Donaldson public-domain translation.',
    works: [...JUSTIN_CATALOG, ...ANF_CATALOG],
  },
  {
    id: 'greco-roman',
    label: 'Greco-Roman',
    blurb: 'Greco-Roman authors that illuminate the New Testament world — Epictetus’s Discourses and Enchiridion, with the Greek and George Long’s English side by side (Perseus, CC-BY-SA).',
    works: GRECO_CATALOG,
  },
  {
    id: 'mishnah',
    label: 'Mishnah',
    blurb: 'The Mishnah — the foundational rabbinic law code (c. 200 CE). The cited tractates in Dr. Joshua Kulp’s translation (CC-BY, via Sefaria).',
    works: MISHNAH_CATALOG,
  },
  { id: 'dss', label: 'Dead Sea Scrolls', comingSoon: true, works: [] },
]

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
