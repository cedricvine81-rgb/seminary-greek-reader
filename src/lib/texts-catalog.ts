// Catalog for the /texts library page — the ancient texts students can read in a
// Reader-style view (Greek with parsing + parallel English where available, or English
// prose). All the data these point at was sourced and embedded elsewhere in the repo:
//   lxx      → public/data/lxx/<osisId>_<chapter>.json via /api/reader (word-level Greek)
//   brenton  → public/data/brenton/<osisId>.json (Brenton's English LXX)
//   josephus → public/data/josephus/<work>/<book>.json (Whiston, book→chapter→section)
//   2esdras  → public/data/apocrypha/2esdras.json (KJV, chapter→verse)

export type TextSource = 'lxx' | 'josephus' | '2esdras'

export interface CatalogWork {
  id: string
  name: string
  source: TextSource
  // lxx / 2esdras
  osisId?: string
  chapters?: number
  english?: 'brenton' | 'bsb'   // parallel English available for a Greek (lxx) work
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
    blurb: 'The complete works of Flavius Josephus, in Whiston’s English translation.',
    works: [
      { id: 'antiquities', name: 'Antiquities of the Jews', source: 'josephus', work: 'antiquities', books: [22, 16, 15, 8, 11, 14, 15, 15, 14, 11, 8, 11, 16, 16, 11, 11, 13, 9, 9, 11] },
      { id: 'jewish-war', name: 'The Jewish War', source: 'josephus', work: 'jewish-war', books: [33, 22, 10, 11, 13, 10, 11] },
      { id: 'against-apion', name: 'Against Apion', source: 'josephus', work: 'against-apion', books: [1, 1] },
      { id: 'life', name: 'The Life', source: 'josephus', work: 'life', books: [1] },
    ],
  },
  {
    id: 'septuagint',
    label: 'Septuagint (OT)',
    blurb: 'The Greek Old Testament with parsing, and the Berean Standard Bible alongside.',
    works: [
      { id: 'Gen', name: 'Genesis', source: 'lxx', osisId: 'Gen', chapters: 50, english: 'bsb' },
      { id: 'Exod', name: 'Exodus', source: 'lxx', osisId: 'Exod', chapters: 40, english: 'bsb' },
      { id: 'Lev', name: 'Leviticus', source: 'lxx', osisId: 'Lev', chapters: 27, english: 'bsb' },
      { id: 'Num', name: 'Numbers', source: 'lxx', osisId: 'Num', chapters: 36, english: 'bsb' },
      { id: 'Deut', name: 'Deuteronomy', source: 'lxx', osisId: 'Deut', chapters: 34, english: 'bsb' },
      { id: 'JoshB', name: 'Joshua', source: 'lxx', osisId: 'JoshB', chapters: 24, english: 'bsb' },
      { id: 'JudgB', name: 'Judges', source: 'lxx', osisId: 'JudgB', chapters: 21, english: 'bsb' },
      { id: 'Ruth', name: 'Ruth', source: 'lxx', osisId: 'Ruth', chapters: 4, english: 'bsb' },
      { id: '1Sam', name: '1 Samuel', source: 'lxx', osisId: '1Sam', chapters: 31, english: 'bsb' },
      { id: '2Sam', name: '2 Samuel', source: 'lxx', osisId: '2Sam', chapters: 24, english: 'bsb' },
      { id: '1Kgs', name: '1 Kings', source: 'lxx', osisId: '1Kgs', chapters: 22, english: 'bsb' },
      { id: '2Kgs', name: '2 Kings', source: 'lxx', osisId: '2Kgs', chapters: 25, english: 'bsb' },
      { id: '1Chr', name: '1 Chronicles', source: 'lxx', osisId: '1Chr', chapters: 29, english: 'bsb' },
      { id: '2Chr', name: '2 Chronicles', source: 'lxx', osisId: '2Chr', chapters: 36, english: 'bsb' },
      { id: 'Ezra', name: 'Ezra', source: 'lxx', osisId: 'Ezra', chapters: 10, english: 'bsb' },
      { id: 'Neh', name: 'Nehemiah', source: 'lxx', osisId: 'Neh', chapters: 13, english: 'bsb' },
      { id: 'Job', name: 'Job', source: 'lxx', osisId: 'Job', chapters: 42, english: 'bsb' },
      { id: 'Ps', name: 'Psalms', source: 'lxx', osisId: 'Ps', chapters: 151, english: 'bsb' },
      { id: 'Prov', name: 'Proverbs', source: 'lxx', osisId: 'Prov', chapters: 31, english: 'bsb' },
      { id: 'Eccl', name: 'Ecclesiastes', source: 'lxx', osisId: 'Eccl', chapters: 12, english: 'bsb' },
      { id: 'Song', name: 'Song of Songs', source: 'lxx', osisId: 'Song', chapters: 8, english: 'bsb' },
      { id: 'Isa', name: 'Isaiah', source: 'lxx', osisId: 'Isa', chapters: 66, english: 'bsb' },
      { id: 'Jer', name: 'Jeremiah', source: 'lxx', osisId: 'Jer', chapters: 52, english: 'bsb' },
      { id: 'Lam', name: 'Lamentations', source: 'lxx', osisId: 'Lam', chapters: 6, english: 'bsb' },
      { id: 'Ezek', name: 'Ezekiel', source: 'lxx', osisId: 'Ezek', chapters: 48, english: 'bsb' },
      { id: 'Hos', name: 'Hosea', source: 'lxx', osisId: 'Hos', chapters: 14, english: 'bsb' },
      { id: 'Joel', name: 'Joel', source: 'lxx', osisId: 'Joel', chapters: 4, english: 'bsb' },
      { id: 'Amos', name: 'Amos', source: 'lxx', osisId: 'Amos', chapters: 9, english: 'bsb' },
      { id: 'Obad', name: 'Obadiah', source: 'lxx', osisId: 'Obad', chapters: 1, english: 'bsb' },
      { id: 'Jonah', name: 'Jonah', source: 'lxx', osisId: 'Jonah', chapters: 4, english: 'bsb' },
      { id: 'Mic', name: 'Micah', source: 'lxx', osisId: 'Mic', chapters: 7, english: 'bsb' },
      { id: 'Nah', name: 'Nahum', source: 'lxx', osisId: 'Nah', chapters: 3, english: 'bsb' },
      { id: 'Hab', name: 'Habakkuk', source: 'lxx', osisId: 'Hab', chapters: 3, english: 'bsb' },
      { id: 'Zeph', name: 'Zephaniah', source: 'lxx', osisId: 'Zeph', chapters: 3, english: 'bsb' },
      { id: 'Hag', name: 'Haggai', source: 'lxx', osisId: 'Hag', chapters: 2, english: 'bsb' },
      { id: 'Zech', name: 'Zechariah', source: 'lxx', osisId: 'Zech', chapters: 14, english: 'bsb' },
      { id: 'Mal', name: 'Malachi', source: 'lxx', osisId: 'Mal', chapters: 3, english: 'bsb' },
    ],
  },
  { id: 'pseudepigrapha', label: 'Pseudepigrapha', comingSoon: true, works: [] },
  { id: 'rabbinic', label: 'Rabbinic', comingSoon: true, works: [] },
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
