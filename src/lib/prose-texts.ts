// Registry of public-domain works embedded as plain English prose stored chapter → verse
// (the 2esdras.json shape: { work, attribution, chapters:[{ number, verses:[{number,text}] }] }).
// These are shown both in the Texts tab and — when their abbreviation appears in the
// Backgrounds cross-reference dataset — in the Backgrounds right-hand reading pane.
//
// Adding another such work is just: drop its JSON under public/data/… , add one entry
// here, and add a catalog entry in texts-catalog.ts. No per-work branching elsewhere.
export interface ProseWork {
  source: EmbeddedProseSource   // stable id; also the CatalogWork.source / OpenInTextsTarget.source
  name: string                  // display name, e.g. "1 Enoch"
  noteBook: string              // note/highlight anchor prefix — must stay stable once shipped
  dataUrl: string               // location of the chapter→verse JSON
  chapters: number              // chapter count, for the Texts locator cascade
  attribution: string           // one-line source note for the Texts tools menu
  // Recognize this work's citation strings in the Backgrounds dataset and return the target
  // chapter (+ optional verse). Per-work because the citation abbreviations differ.
  parseCitation: (text: string) => { chapter: number; verse?: number } | null
}

// The `tp-<slug>` members are the twelve Testaments of the Twelve Patriarchs (see below).
export type EmbeddedProseSource = '2esdras' | '1enoch' | 'jubilees' | '2baruch' | '2enoch' | `tp-${string}`

// Build a citation matcher from a regex whose group 1 is the chapter and (optional) group 2
// the verse.
const cite = (re: RegExp) => (text: string) => {
  const m = text.match(re)
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

// The Testaments of the Twelve Patriarchs — twelve short works cited as "T. Levi 3:5" etc.
// The embedded text is the Ante-Nicene Fathers (Roberts-Donaldson) translation, which
// divides each testament into numbered chapters with no sub-verse numbering, so every
// chapter is stored as one verse and citations resolve at the chapter level. `abbrev` is
// the exact form used in the cross-reference dataset; `chapters` matches the ANF text.
const TWELVE_PATRIARCHS: { slug: string; name: string; abbrev: string; chapters: number }[] = [
  { slug: 'reuben', name: 'Reuben', abbrev: 'Reu', chapters: 7 },
  { slug: 'simeon', name: 'Simeon', abbrev: 'Sim', chapters: 9 },
  { slug: 'levi', name: 'Levi', abbrev: 'Levi', chapters: 19 },
  { slug: 'judah', name: 'Judah', abbrev: 'Jud', chapters: 26 },
  { slug: 'issachar', name: 'Issachar', abbrev: 'Iss', chapters: 7 },
  { slug: 'zebulun', name: 'Zebulun', abbrev: 'Zeb', chapters: 10 },
  { slug: 'dan', name: 'Dan', abbrev: 'Dan', chapters: 7 },
  { slug: 'naphtali', name: 'Naphtali', abbrev: 'Naph', chapters: 9 },
  { slug: 'gad', name: 'Gad', abbrev: 'Gad', chapters: 8 },
  { slug: 'asher', name: 'Asher', abbrev: 'Ash', chapters: 8 },
  { slug: 'joseph', name: 'Joseph', abbrev: 'Jos', chapters: 20 },
  { slug: 'benjamin', name: 'Benjamin', abbrev: 'Benj', chapters: 12 },
]

const TWELVE_PATRIARCHS_WORKS: ProseWork[] = TWELVE_PATRIARCHS.map(t => ({
  source: `tp-${t.slug}` as EmbeddedProseSource,
  name: `Testament of ${t.name}`,
  noteBook: `TP${t.abbrev}`,
  dataUrl: `/data/pseudepigrapha/testaments/${t.slug}.json`,
  chapters: t.chapters,
  attribution: `Text: the Ante-Nicene Fathers (Roberts-Donaldson) translation of the Testament of ${t.name}, 1886 (public domain).`,
  // e.g. "T. Levi 3:5" — a bare chapter (or chapter:verse; the verse is ignored, since the
  // ANF text has no sub-verse divisions).
  parseCitation: cite(new RegExp(`^T\\. ${t.abbrev}\\.?\\s+(\\d+)(?::(\\d+))?`)),
}))

// Ids/names the catalog needs so the Texts tab can list all twelve under one category.
export const TWELVE_PATRIARCHS_CATALOG = TWELVE_PATRIARCHS.map(t => ({
  id: `tp-${t.slug}`, source: `tp-${t.slug}` as EmbeddedProseSource, name: `Testament of ${t.name}`, chapters: t.chapters,
}))

export const PROSE_WORKS: ProseWork[] = [
  { source: '2esdras', name: '2 Esdras', noteBook: '2Esdras', dataUrl: '/data/apocrypha/2esdras.json', chapters: 16,
    attribution: 'Text: the King James Version, 2 Esdras (public domain).',
    parseCitation: cite(/(?:2 Esdr\.?|4 Ezra)\s+(\d+):(\d+)/) },
  { source: '1enoch', name: '1 Enoch', noteBook: '1Enoch', dataUrl: '/data/pseudepigrapha/1enoch.json', chapters: 108,
    attribution: 'Text: R. H. Charles’ translation of 1 Enoch, 1917 (public domain).',
    parseCitation: cite(/^1 En\.\s+(\d+)(?::(\d+))?/) },
  { source: 'jubilees', name: 'Jubilees', noteBook: 'Jubilees', dataUrl: '/data/pseudepigrapha/jubilees.json', chapters: 50,
    attribution: 'Text: R. H. Charles’ translation of Jubilees, 1902/1913 (public domain).',
    parseCitation: cite(/^Jub\.\s+(\d+)(?::(\d+))?/) },
  { source: '2baruch', name: '2 Baruch', noteBook: '2Baruch', dataUrl: '/data/pseudepigrapha/2baruch.json', chapters: 85,
    attribution: 'Text: R. H. Charles’ translation of 2 Baruch (the Syriac Apocalypse), 1896 (public domain).',
    parseCitation: cite(/^2 Bar\.\s+(\d+)(?::(\d+))?/) },
  { source: '2enoch', name: '2 Enoch', noteBook: '2Enoch', dataUrl: '/data/pseudepigrapha/2enoch.json', chapters: 68,
    attribution: 'Text: W. R. Morfill’s translation of 2 Enoch (the Slavonic Secrets of Enoch), 1896 (public domain).',
    parseCitation: cite(/^2 En\.\s+(\d+)(?::(\d+))?/) },
  ...TWELVE_PATRIARCHS_WORKS,
]

export function findProseWork(source: string): ProseWork | undefined {
  return PROSE_WORKS.find(w => w.source === source)
}

// The first registered work whose abbreviation matches this citation string, with its
// resolved chapter/verse — used by Backgrounds to open the citation in the reading pane.
export function matchProseCitation(text: string): { work: ProseWork; ref: { chapter: number; verse?: number } } | null {
  for (const w of PROSE_WORKS) {
    const ref = w.parseCitation(text)
    if (ref) return { work: w, ref }
  }
  return null
}

// The chapter→verse JSON shape these works share.
export interface ProseVerse { number: number; text: string }
export interface ProseChapter { number: number; verses: ProseVerse[] }
export interface ProseDoc { work: string; attribution: string; chapters: ProseChapter[] }
