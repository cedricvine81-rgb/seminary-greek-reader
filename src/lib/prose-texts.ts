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

// The `tp-<slug>` members are the twelve Testaments of the Twelve Patriarchs and the
// `philo-<slug>` members are Philo of Alexandria's treatises (see below).
export type EmbeddedProseSource = '2esdras' | '1enoch' | 'jubilees' | '2baruch' | '2enoch' | 'apocmoses' | 'lae' | '3baruch' | 'tjob' | 'apocabr' | 'josaseneth' | 'aristeas' | 'sibylline' | `tp-${string}` | `philo-${string}`

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

// ── Philo of Alexandria ───────────────────────────────────────────────────────────────
// C. D. Yonge's public-domain translation, embedded chapter → verse where chapter = Philo
// BOOK number and verse = Cohn-Wendland SECTION number (the numbering the Backgrounds
// cross-reference dataset cites). Built by scripts/build-philo.py from earlychristianwritings
// .com/yonge. `multi` marks the treatises Philo divided into books (Moses, Special Laws,
// Allegorical Interpretation, Dreams, Providence, Questions on Genesis); the rest are a
// single book (chapter 1).
const PHILO_ATTRIBUTION = 'Text: C. D. Yonge’s translation of Philo (1854–1855), public domain; section numbers follow the Cohn-Wendland edition. Source: earlychristianwritings.com/yonge.'

// Recognize a "Philo, <Treatise> <section>" citation. A Loeb "§N" wins as the section when
// present ("Rewards 16 §95" → verse 95). Otherwise the leading dotted number is parsed: for
// a multi-book treatise its first part is the book (chapter) and its last part the section
// ("Moses 2.70" → {2,70}; "Moses 2.13.68" → {2,68}; bare "Moses 214" → {1,214}); for a
// single-book treatise the number maps straight to a verse in chapter 1 ("Creation 30" →
// {1,30}). Ranges keep the start ("Spec. Laws 2.16–17" → verse 16).
const philoCite = (abbrevs: string[], multi: boolean) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const pm = s.match(/^Philo,?\s+(.+)$/)
  if (!pm) return null
  const tail = pm[1].trim()
  for (const ab of [...abbrevs].sort((a, b) => b.length - a.length)) {
    if (!tail.startsWith(ab)) continue
    const rest = tail.slice(ab.length)
    if (!/^\s+(?:\d|§)/.test(rest)) continue
    const sec = rest.match(/§\s*(\d+)/)
    if (sec) {
      const lead = rest.match(/^\s*(\d+)/)
      return { chapter: multi && lead ? parseInt(lead[1], 10) : 1, verse: parseInt(sec[1], 10) }
    }
    const nums = rest.match(/^\s*(\d+(?:\.\d+)*)/)
    if (!nums) continue
    const parts = nums[1].split('.').map(n => parseInt(n, 10))
    if (multi) return { chapter: parts.length >= 2 ? parts[0] : 1, verse: parts[parts.length - 1] }
    return { chapter: 1, verse: parts[0] }
  }
  return null
}

// slug (→ /data/philo/<slug>.json and the `philo-<slug>` source id), display name, stable
// note anchor, book count, whether it is book-divided, and the citation abbreviation(s)
// used in the dataset. Kept in sync with scripts/build-philo.py.
const PHILO: { slug: string; name: string; noteBook: string; chapters: number; multi: boolean; abbrevs: string[] }[] = [
  { slug: 'creation', name: 'On the Creation', noteBook: 'PhiloOpif', chapters: 1, multi: false, abbrevs: ['Creation'] },
  { slug: 'alleg-interp', name: 'Allegorical Interpretation', noteBook: 'PhiloLeg', chapters: 3, multi: true, abbrevs: ['Alleg. Interp.'] },
  { slug: 'cherubim', name: 'On the Cherubim', noteBook: 'PhiloCher', chapters: 1, multi: false, abbrevs: ['Cherubim'] },
  { slug: 'sacrifices', name: 'On the Sacrifices of Abel and Cain', noteBook: 'PhiloSacr', chapters: 1, multi: false, abbrevs: ['Sacrifices'] },
  { slug: 'worse', name: 'That the Worse Attacks the Better', noteBook: 'PhiloDet', chapters: 1, multi: false, abbrevs: ['Worse'] },
  { slug: 'posterity', name: 'On the Posterity of Cain', noteBook: 'PhiloPost', chapters: 1, multi: false, abbrevs: ['Posterity'] },
  { slug: 'giants', name: 'On the Giants', noteBook: 'PhiloGig', chapters: 1, multi: false, abbrevs: ['Giants'] },
  { slug: 'unchangeable', name: 'On the Unchangeableness of God', noteBook: 'PhiloDeus', chapters: 1, multi: false, abbrevs: ['Unchangeableness', 'Deus'] },
  { slug: 'husbandry', name: 'On Husbandry', noteBook: 'PhiloAgr', chapters: 1, multi: false, abbrevs: ['Husbandry'] },
  { slug: 'planter', name: 'On Noah’s Work as a Planter', noteBook: 'PhiloPlant', chapters: 1, multi: false, abbrevs: ['Planter'] },
  { slug: 'drunkenness', name: 'On Drunkenness', noteBook: 'PhiloEbr', chapters: 1, multi: false, abbrevs: ['Drunkenness'] },
  { slug: 'sobriety', name: 'On Sobriety', noteBook: 'PhiloSobr', chapters: 1, multi: false, abbrevs: ['Sobriety'] },
  { slug: 'confusion', name: 'On the Confusion of Tongues', noteBook: 'PhiloConf', chapters: 1, multi: false, abbrevs: ['Confusion'] },
  { slug: 'migration', name: 'On the Migration of Abraham', noteBook: 'PhiloMigr', chapters: 1, multi: false, abbrevs: ['Migration'] },
  { slug: 'heir', name: 'Who Is the Heir of Divine Things?', noteBook: 'PhiloHer', chapters: 1, multi: false, abbrevs: ['Heir'] },
  { slug: 'congress', name: 'On Mating with the Preliminary Studies', noteBook: 'PhiloCongr', chapters: 1, multi: false, abbrevs: ['Congress', 'Preliminary Studies'] },
  { slug: 'flight', name: 'On Flight and Finding', noteBook: 'PhiloFug', chapters: 1, multi: false, abbrevs: ['Flight'] },
  { slug: 'names', name: 'On the Change of Names', noteBook: 'PhiloMut', chapters: 1, multi: false, abbrevs: ['Change of Names', 'Names'] },
  { slug: 'dreams', name: 'On Dreams', noteBook: 'PhiloSomn', chapters: 2, multi: true, abbrevs: ['Dreams'] },
  { slug: 'abraham', name: 'On the Life of Abraham', noteBook: 'PhiloAbr', chapters: 1, multi: false, abbrevs: ['On the Life of Abraham', 'Abraham'] },
  { slug: 'joseph', name: 'On the Life of Joseph', noteBook: 'PhiloIos', chapters: 1, multi: false, abbrevs: ['Joseph'] },
  { slug: 'moses', name: 'On the Life of Moses', noteBook: 'PhiloMos', chapters: 2, multi: true, abbrevs: ['Moses'] },
  { slug: 'decalogue', name: 'On the Decalogue', noteBook: 'PhiloDecal', chapters: 1, multi: false, abbrevs: ['Decalogue'] },
  { slug: 'spec-laws', name: 'On the Special Laws', noteBook: 'PhiloSpec', chapters: 4, multi: true, abbrevs: ['Spec. Laws', 'Special Laws'] },
  { slug: 'virtues', name: 'On the Virtues', noteBook: 'PhiloVirt', chapters: 1, multi: false, abbrevs: ['Virtues'] },
  { slug: 'rewards', name: 'On Rewards and Punishments', noteBook: 'PhiloPraem', chapters: 1, multi: false, abbrevs: ['Rewards'] },
  { slug: 'good-person', name: 'Every Good Man Is Free', noteBook: 'PhiloProb', chapters: 1, multi: false, abbrevs: ['Good Person'] },
  { slug: 'contemplative', name: 'On the Contemplative Life', noteBook: 'PhiloContempl', chapters: 1, multi: false, abbrevs: ['Contemplative'] },
  { slug: 'eternity', name: 'On the Eternity of the World', noteBook: 'PhiloAet', chapters: 1, multi: false, abbrevs: ['Eternity'] },
  { slug: 'flaccus', name: 'Against Flaccus', noteBook: 'PhiloFlacc', chapters: 1, multi: false, abbrevs: ['Flaccus'] },
  { slug: 'hypothetica', name: 'Hypothetica (Apology for the Jews)', noteBook: 'PhiloHypoth', chapters: 4, multi: false, abbrevs: ['Hypothetica'] },
  { slug: 'providence', name: 'On Providence', noteBook: 'PhiloProv', chapters: 2, multi: true, abbrevs: ['Providence'] },
  { slug: 'embassy', name: 'On the Embassy to Gaius', noteBook: 'PhiloLegat', chapters: 1, multi: false, abbrevs: ['Embassy'] },
  { slug: 'qg', name: 'Questions and Answers on Genesis', noteBook: 'PhiloQG', chapters: 3, multi: true, abbrevs: ['QG'] },
  { slug: 'world', name: 'On the World (Appendix)', noteBook: 'PhiloWorld', chapters: 1, multi: false, abbrevs: ['On the World'] },
  { slug: 'fragments', name: 'Fragments (Appendix)', noteBook: 'PhiloFrag', chapters: 1, multi: false, abbrevs: [] },
]

const PHILO_WORKS: ProseWork[] = PHILO.map(p => ({
  source: `philo-${p.slug}` as EmbeddedProseSource,
  name: p.name,
  noteBook: p.noteBook,
  dataUrl: `/data/philo/${p.slug}.json`,
  chapters: p.chapters,
  attribution: PHILO_ATTRIBUTION,
  parseCitation: philoCite(p.abbrevs, p.multi),
}))

// Ids/names the catalog needs to list Philo's works under one Texts category.
export const PHILO_CATALOG = PHILO.map(p => ({
  id: `philo-${p.slug}`, source: `philo-${p.slug}` as EmbeddedProseSource, name: p.name, chapters: p.chapters,
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
  { source: 'apocmoses', name: 'Apocalypse of Moses', noteBook: 'ApocMos', dataUrl: '/data/pseudepigrapha/apocmoses.json', chapters: 43,
    attribution: 'Text: R. H. Charles’ translation of the Apocalypse of Moses, 1913 (public domain).',
    parseCitation: cite(/^Apoc\. Mos\.\s+(\d+)(?::(\d+))?/) },
  { source: 'lae', name: 'Life of Adam and Eve', noteBook: 'LAE', dataUrl: '/data/pseudepigrapha/lae.json', chapters: 51,
    attribution: 'Text: R. H. Charles’ translation of the Life of Adam and Eve (Latin Vita), 1913 (public domain).',
    parseCitation: cite(/^L\.A\.E\.\s+(\d+)(?::(\d+))?/) },
  { source: '3baruch', name: '3 Baruch', noteBook: '3Baruch', dataUrl: '/data/pseudepigrapha/3baruch.json', chapters: 17,
    attribution: 'Text: H. M. Hughes’ translation of 3 Baruch (the Greek Apocalypse of Baruch), 1913 (public domain).',
    parseCitation: cite(/^3 Bar\.\s+(\d+)(?::(\d+))?/) },
  { source: 'tjob', name: 'Testament of Job', noteBook: 'TJob', dataUrl: '/data/pseudepigrapha/tjob.json', chapters: 12,
    attribution: 'Text: the M. R. James / K. Kohler translation of the Testament of Job (public domain). Uses the 12-chapter division; scholarly citations often use the 53-chapter one.',
    parseCitation: cite(/^T\. Job\.?\s+(\d+)(?::(\d+))?/) },
  { source: 'apocabr', name: 'Apocalypse of Abraham', noteBook: 'ApocAbr', dataUrl: '/data/pseudepigrapha/apocabr.json', chapters: 32,
    attribution: 'Text: the G. H. Box / J. I. Landsman translation of the Apocalypse of Abraham, 1918 (public domain).',
    parseCitation: cite(/^Apoc\. Ab\.\s+(\d+)(?::(\d+))?/) },
  { source: 'josaseneth', name: 'Joseph and Aseneth', noteBook: 'JosAsen', dataUrl: '/data/pseudepigrapha/josaseneth.json', chapters: 29,
    attribution: 'Text: a public-domain English translation of Joseph and Aseneth (29 chapters). Verse divisions vary between editions, so some scholarly citations resolve at the chapter level only.',
    parseCitation: cite(/^Jos\. Asen\.\s+(\d+)(?::(\d+))?/) },
  // The Sibylline Oracles are stored with each BOOK as a chapter. Terry's marginal line
  // numbers aren't preserved in the source, so a "Sib. Or. 3:636" reference resolves to
  // book 3 (chapter level) — the line number is intentionally dropped to avoid pointing at
  // the wrong line.
  { source: 'sibylline', name: 'Sibylline Oracles', noteBook: 'Sibylline', dataUrl: '/data/pseudepigrapha/sibylline.json', chapters: 14,
    attribution: 'Text: Milton S. Terry’s translation of the Sibylline Oracles (2nd ed., 1899), public domain. Each book is a chapter; cross-references resolve at the book level.',
    parseCitation: (text: string) => {
      const m = text.match(/^Sib\. Or\.\s+(\d+)/)
      return m ? { chapter: parseInt(m[1], 10) } : null
    } },
  // The Letter of Aristeas is one continuous letter (§§1–322), stored as a single chapter,
  // so a bare "Arist. 305" section reference maps to verse 305 of chapter 1.
  { source: 'aristeas', name: 'Letter of Aristeas', noteBook: 'Aristeas', dataUrl: '/data/pseudepigrapha/aristeas.json', chapters: 1,
    attribution: 'Text: H. T. Andrews’ translation of the Letter of Aristeas, 1913 (public domain). The work is a single run of numbered sections, shown here as one chapter.',
    parseCitation: (text: string) => {
      const m = text.match(/^(?:Ep\.\s*)?Arist(?:eas)?\.?\s+(\d+)/)
      return m ? { chapter: 1, verse: parseInt(m[1], 10) } : null
    } },
  ...TWELVE_PATRIARCHS_WORKS,
  ...PHILO_WORKS,
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
