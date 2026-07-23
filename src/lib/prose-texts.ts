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

// The `tp-<slug>` members are the twelve Testaments of the Twelve Patriarchs, the
// `philo-<slug>` members are Philo of Alexandria's treatises, the `af-<slug>` members are
// the Apostolic Fathers, and the `tg-<slug>` members are the Targums (see below).
export type EmbeddedProseSource = '2esdras' | '1enoch' | 'jubilees' | '2baruch' | '2enoch' | 'apocmoses' | 'lae' | '3baruch' | 'tjob' | 'apocabr' | 'josaseneth' | 'aristeas' | 'sibylline' | 'pseudo-philo' | 'odes-of-solomon' | 'ascension-of-isaiah' | `tp-${string}` | `philo-${string}` | `af-${string}` | `tg-${string}` | `anf-${string}` | `m-${string}` | `justin-${string}` | `greco-${string}`

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
    // Allow a stray comma between the work name and its section number ("Sobriety, 55–56").
    if (!/^[,\s]+(?:\d|§)/.test(rest)) continue
    const sec = rest.match(/§\s*(\d+)/)
    if (sec) {
      const lead = rest.match(/^[,\s]*(\d+)/)
      return { chapter: multi && lead ? parseInt(lead[1], 10) : 1, verse: parseInt(sec[1], 10) }
    }
    const nums = rest.match(/^[,\s]*(\d+(?:\.\d+)*)/)
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

// Works for which scripts/build-philo-greek.py attached the parallel Greek (First1KGreek,
// CC BY-SA 4.0). On Joseph, On Providence, the Questions on Genesis, the Hypothetica, the
// Fragments and On the World are English-only — their Greek survives only in fragments or an
// Armenian version, or (On Joseph) is versified on a scheme our English does not share.
const PHILO_GREEK = new Set([
  'creation', 'alleg-interp', 'cherubim', 'sacrifices', 'worse', 'posterity', 'giants',
  'unchangeable', 'husbandry', 'planter', 'drunkenness', 'sobriety', 'confusion', 'migration',
  'heir', 'congress', 'flight', 'names', 'dreams', 'abraham', 'moses', 'decalogue', 'spec-laws',
  'virtues', 'rewards', 'good-person', 'contemplative', 'eternity', 'flaccus', 'embassy',
])

// Ids/names the catalog needs to list Philo's works under one Texts category.
export const PHILO_CATALOG = PHILO.map(p => ({
  id: `philo-${p.slug}`, source: `philo-${p.slug}` as EmbeddedProseSource, name: p.name, chapters: p.chapters,
  ...(PHILO_GREEK.has(p.slug) ? { greek: true } : {}),
}))

// ── The Apostolic Fathers ─────────────────────────────────────────────────────────────
// J. B. Lightfoot & J. R. Harmer's public-domain translation, embedded chapter → verse
// (the standard versification the Backgrounds dataset cites, e.g. "1 Clem. 13:1",
// "Pol. Phil. 7.1"). Built by scripts/build-apostolic-fathers.py.
const AF_ATTRIBUTION = 'Text: J. B. Lightfoot & J. R. Harmer’s translation of the Apostolic Fathers (1891), public domain. Source: earlychristianwritings.com.'

// Recognize an Apostolic-Fathers citation, e.g. "1 Clem. 13:1" or "Pol. Phil. 7.1" — the
// chapter/verse separator is written both ways. Matches the first reference in a compound
// string ("Ign. Eph. 10.1; Pol. Phil. 4.3" → Ign. Eph. 10:1).
const afCite = (abbrevs: string[]) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of abbrevs) {
    const m = s.match(new RegExp('^' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)(?:[:.](\\d+))?'))
    if (m) return { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined }
  }
  return null
}

// slug (→ /data/apostolic-fathers/<slug>.json and `af-<slug>`), name, note anchor, chapter
// count, citation abbreviation(s). Kept in sync with scripts/build-apostolic-fathers.py.
const AF: { slug: string; name: string; noteBook: string; chapters: number; abbrevs: string[] }[] = [
  { slug: '1clement', name: '1 Clement', noteBook: 'AF1Clem', chapters: 65, abbrevs: ['1 Clem.'] },
  { slug: '2clement', name: '2 Clement', noteBook: 'AF2Clem', chapters: 20, abbrevs: ['2 Clem.'] },
  { slug: 'ign-ephesians', name: 'Ignatius to the Ephesians', noteBook: 'AFIgnEph', chapters: 21, abbrevs: ['Ign. Eph.'] },
  { slug: 'ign-magnesians', name: 'Ignatius to the Magnesians', noteBook: 'AFIgnMag', chapters: 15, abbrevs: ['Ign. Magn.'] },
  { slug: 'ign-trallians', name: 'Ignatius to the Trallians', noteBook: 'AFIgnTrall', chapters: 13, abbrevs: ['Ign. Trall.'] },
  { slug: 'ign-romans', name: 'Ignatius to the Romans', noteBook: 'AFIgnRom', chapters: 10, abbrevs: ['Ign. Rom.'] },
  { slug: 'ign-philadelphians', name: 'Ignatius to the Philadelphians', noteBook: 'AFIgnPhld', chapters: 11, abbrevs: ['Ign. Phld.'] },
  { slug: 'ign-smyrnaeans', name: 'Ignatius to the Smyrnaeans', noteBook: 'AFIgnSmyrn', chapters: 13, abbrevs: ['Ign. Smyrn.'] },
  { slug: 'ign-polycarp', name: 'Ignatius to Polycarp', noteBook: 'AFIgnPol', chapters: 8, abbrevs: ['Ign. Pol.'] },
  { slug: 'polycarp', name: 'Polycarp to the Philippians', noteBook: 'AFPolPhil', chapters: 14, abbrevs: ['Pol. Phil.'] },
  { slug: 'didache', name: 'The Didache', noteBook: 'AFDid', chapters: 16, abbrevs: ['Did.'] },
  { slug: 'barnabas', name: 'The Epistle of Barnabas', noteBook: 'AFBarn', chapters: 21, abbrevs: ['Barn.'] },
  { slug: 'diognetus', name: 'The Epistle to Diognetus', noteBook: 'AFDiogn', chapters: 12, abbrevs: ['Diogn.'] },
  { slug: 'mart-polycarp', name: 'The Martyrdom of Polycarp', noteBook: 'AFMartPol', chapters: 22, abbrevs: ['Mart. Pol.'] },
]

const AF_WORKS: ProseWork[] = AF.map(w => ({
  source: `af-${w.slug}` as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/apostolic-fathers/${w.slug}.json`,
  chapters: w.chapters,
  attribution: AF_ATTRIBUTION,
  parseCitation: afCite(w.abbrevs),
}))

// Works for which scripts/build-apostolic-fathers-greek.py attached the parallel Greek
// (First1KGreek, CC BY-SA 4.0). Diognetus, the Martyrdom of Polycarp and the Didache are
// English-only — no aligned Greek source — so they are absent here.
const AF_GREEK = new Set([
  '1clement', '2clement', 'barnabas', 'polycarp',
  'ign-ephesians', 'ign-magnesians', 'ign-trallians', 'ign-romans',
  'ign-philadelphians', 'ign-smyrnaeans', 'ign-polycarp',
])

// Ids/names the catalog needs to list the Apostolic Fathers under one Texts category.
export const AF_CATALOG = AF.map(w => ({
  id: `af-${w.slug}`, source: `af-${w.slug}` as EmbeddedProseSource, name: w.name, chapters: w.chapters,
  ...(AF_GREEK.has(w.slug) ? { greek: true } : {}),
}))

// ── The Targums ───────────────────────────────────────────────────────────────────────
// The most-cited public-domain Aramaic Targums: Targum Isaiah (C. W. H. Pauli, 1871) and
// Targum Pseudo-Jonathan on the Pentateuch (J. W. Etheridge, 1862), embedded chapter →
// verse against the Masoretic numbering the dataset cites ("Tg. Isa. 6:9",
// "Tg. Ps.-J. Gen 3:15"). Built by scripts/build-targums.py from the Sefaria API. The
// Pentateuch targum is one work per book (Genesis … Deuteronomy) since the prose model is
// chapter → verse. (Targum Onkelos is deferred — no public-domain English on Sefaria.)
const TG_PAULI = 'Text: C. W. H. Pauli’s translation of the Targum on Isaiah (1871), public domain. Source: Sefaria.'
const TG_ETHERIDGE = 'Text: J. W. Etheridge’s translation of Targum Pseudo-Jonathan (1862), public domain. Source: Sefaria.'

// Recognize a Targum citation, e.g. "Tg. Isa. 6:9" or "Tg. Ps.-J. Gen 3:15" (the chapter/
// verse separator is written both ways). The abbreviation includes the book, so each
// per-book work matches only its own references.
const tgCite = (abbrev: string) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp('^' + abbrev.replace(/\./g, '\\.') + '\\s+(\\d+)[:.](\\d+)'))
  return m ? { chapter: parseInt(m[1], 10), verse: parseInt(m[2], 10) } : null
}

// slug (→ /data/targums/<slug>.json and `tg-<slug>`), name, note anchor, chapter count,
// citation abbreviation, attribution. Kept in sync with scripts/build-targums.py.
const TG: { slug: string; name: string; noteBook: string; chapters: number; abbrev: string; attribution: string }[] = [
  { slug: 'tg-isaiah', name: 'Targum Isaiah', noteBook: 'TgIsa', chapters: 66, abbrev: 'Tg. Isa.', attribution: TG_PAULI },
  { slug: 'tg-psj-genesis', name: 'Targum Pseudo-Jonathan (Genesis)', noteBook: 'TgPsJGen', chapters: 50, abbrev: 'Tg. Ps.-J. Gen', attribution: TG_ETHERIDGE },
  { slug: 'tg-psj-exodus', name: 'Targum Pseudo-Jonathan (Exodus)', noteBook: 'TgPsJExod', chapters: 40, abbrev: 'Tg. Ps.-J. Exod', attribution: TG_ETHERIDGE },
  { slug: 'tg-psj-leviticus', name: 'Targum Pseudo-Jonathan (Leviticus)', noteBook: 'TgPsJLev', chapters: 27, abbrev: 'Tg. Ps.-J. Lev', attribution: TG_ETHERIDGE },
  { slug: 'tg-psj-numbers', name: 'Targum Pseudo-Jonathan (Numbers)', noteBook: 'TgPsJNum', chapters: 36, abbrev: 'Tg. Ps.-J. Num', attribution: TG_ETHERIDGE },
  { slug: 'tg-psj-deuteronomy', name: 'Targum Pseudo-Jonathan (Deuteronomy)', noteBook: 'TgPsJDeut', chapters: 34, abbrev: 'Tg. Ps.-J. Deut', attribution: TG_ETHERIDGE },
]

const TG_WORKS: ProseWork[] = TG.map(w => ({
  source: w.slug as EmbeddedProseSource,        // slugs are already `tg-…`
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/targums/${w.slug}.json`,
  chapters: w.chapters,
  attribution: w.attribution,
  parseCitation: tgCite(w.abbrev),
}))

// Ids/names the catalog needs to list the Targums under one Texts category.
export const TG_CATALOG = TG.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters,
}))

// ── Ante-Nicene Fathers (apologists) ──────────────────────────────────────────────────
// Irenaeus, Against Heresies (Roberts-Donaldson, ANF, public domain), embedded book →
// chapter → numbered section, so "Irenaeus, Haer. 3.11.8" opens book 3, chapter 11,
// section 8. One work per book (the prose model is chapter → verse). Built by
// scripts/build-anf.py. (Justin & the other apologists await a cleaner public-domain
// source — see the text-acquisitions roadmap.)
const ANF_ATTRIBUTION = 'Text: the Roberts-Donaldson translation of Irenaeus (Ante-Nicene Fathers, 1885), public domain. Source: earlychristianwritings.com.'

// Recognize an "Irenaeus, Haer. <book>.<chapter>[.<section>]" citation for a given book.
const irenaeusCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp(`^Irenaeus, Haer\\. ${book}\\.(\\d+)(?:\\.(\\d+))?`))
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

const ANF: { slug: string; name: string; noteBook: string; chapters: number; book: number }[] = [
  { slug: 'anf-irenaeus-1', name: 'Irenaeus, Against Heresies (Book 1)', noteBook: 'IrenHaer1', chapters: 31, book: 1 },
  { slug: 'anf-irenaeus-2', name: 'Irenaeus, Against Heresies (Book 2)', noteBook: 'IrenHaer2', chapters: 35, book: 2 },
  { slug: 'anf-irenaeus-3', name: 'Irenaeus, Against Heresies (Book 3)', noteBook: 'IrenHaer3', chapters: 25, book: 3 },
  { slug: 'anf-irenaeus-4', name: 'Irenaeus, Against Heresies (Book 4)', noteBook: 'IrenHaer4', chapters: 41, book: 4 },
  { slug: 'anf-irenaeus-5', name: 'Irenaeus, Against Heresies (Book 5)', noteBook: 'IrenHaer5', chapters: 36, book: 5 },
]

const ANF_WORKS: ProseWork[] = ANF.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/anf/${w.slug.replace(/^anf-/, '')}.json`,
  chapters: w.chapters,
  attribution: ANF_ATTRIBUTION,
  parseCitation: irenaeusCite(w.book),
}))

// Ids/names the catalog needs to list the Ante-Nicene Fathers under one Texts category.
export const ANF_CATALOG = ANF.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters,
}))

// Justin Martyr (Roberts-Donaldson / ANF, from newadvent.org — cleaner chapter markup than
// the earlychristianwritings copy). Chapter-level ("Dial. 32.1" → chapter 32; the ANF
// English has no section numbers). Built by scripts/build-justin.py.
const JUSTIN_ATTRIBUTION = 'Text: the Roberts-Donaldson translation of Justin Martyr (Ante-Nicene Fathers, 1885), public domain. Source: newadvent.org.'

const justinCite = (core: string) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp('^Justin(?: Martyr)?, ' + core.replace(/\./g, '\\.') + '\\s+(\\d+)'))
  return m ? { chapter: parseInt(m[1], 10) } : null
}

const JUSTIN: { slug: string; name: string; noteBook: string; chapters: number; core: string }[] = [
  { slug: 'justin-dialogue', name: 'Justin Martyr, Dialogue with Trypho', noteBook: 'JustinDial', chapters: 142, core: 'Dial.' },
  { slug: 'justin-1apology', name: 'Justin Martyr, First Apology', noteBook: 'Justin1Apol', chapters: 68, core: '1 Apol.' },
  { slug: 'justin-2apology', name: 'Justin Martyr, Second Apology', noteBook: 'Justin2Apol', chapters: 15, core: '2 Apol.' },
]

const JUSTIN_WORKS: ProseWork[] = JUSTIN.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/justin/${w.slug}.json`,
  chapters: w.chapters,
  attribution: JUSTIN_ATTRIBUTION,
  parseCitation: justinCite(w.core),
}))

export const JUSTIN_CATALOG = JUSTIN.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters,
}))

// ── The Mishnah ───────────────────────────────────────────────────────────────────────
// The cited tractates in Dr. Joshua Kulp's "Mishnah Yomit" translation (CC-BY, via Sefaria),
// embedded chapter → verse where verse = the mishnah number ("m. Sanh. 4:5" → chapter 4,
// mishnah 5). One work per tractate. Built by scripts/build-mishnah.py.
const MISHNAH_ATTRIBUTION = 'Text: the Mishnah translated by Dr. Joshua Kulp (Mishnah Yomit), CC-BY. Source: Sefaria.'

// Recognize an "m. <Tractate> <chapter>:<mishnah>" citation for a tractate's abbreviation(s).
const mishnahCite = (abbrevs: string[]) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of [...abbrevs].sort((a, b) => b.length - a.length)) {
    const m = s.match(new RegExp('^' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)(?::(\\d+))?'))
    if (m) return { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined }
  }
  return null
}

// slug (→ /data/mishnah/<tractate>.json and `m-<tractate>`), name, note anchor, chapter
// count, citation abbreviation(s). slug/chapters/abbrevs are kept in sync with
// scripts/build-mishnah.py; `name` is the reader/catalog display label (SBL-style
// "m. <Tractate> (English gloss)") and intentionally differs from the plain tractate
// name the build script stamps into each data file's `work` field — don't "re-sync" it.
const MISHNAH: { slug: string; name: string; noteBook: string; chapters: number; abbrevs: string[] }[] = [
  { slug: 'm-sanhedrin', name: 'm. Sanhedrin (The Court)', noteBook: 'MishSanhedrin', chapters: 11, abbrevs: ['m. Sanh.'] },
  { slug: 'm-nedarim', name: 'm. Nedarim (Vows)', noteBook: 'MishNedarim', chapters: 11, abbrevs: ['m. Ned.'] },
  { slug: 'm-berakhot', name: 'm. Berakhot (Blessings)', noteBook: 'MishBerakhot', chapters: 9, abbrevs: ['m. Ber.'] },
  { slug: 'm-makkot', name: 'm. Makkot (Lashes)', noteBook: 'MishMakkot', chapters: 3, abbrevs: ['m. Mak.'] },
  { slug: 'm-yoma', name: 'm. Yoma (The Day of Atonement)', noteBook: 'MishYoma', chapters: 8, abbrevs: ['m. Yoma'] },
  { slug: 'm-ketubot', name: 'm. Ketubot (Marriage Contracts)', noteBook: 'MishKetubot', chapters: 13, abbrevs: ['m. Ketub.'] },
  { slug: 'm-keritot', name: 'm. Keritot (Excisions)', noteBook: 'MishKeritot', chapters: 6, abbrevs: ['m. Ker.'] },
  { slug: 'm-kiddushin', name: 'm. Kiddushin (Betrothals)', noteBook: 'MishKiddushin', chapters: 4, abbrevs: ['m. Qidd.'] },
  { slug: 'm-tamid', name: 'm. Tamid (The Daily Offering)', noteBook: 'MishTamid', chapters: 7, abbrevs: ['m. Tamid'] },
  { slug: 'm-nazir', name: 'm. Nazir (The Nazirite)', noteBook: 'MishNazir', chapters: 9, abbrevs: ['m. Naz.'] },
  { slug: 'm-yevamot', name: 'm. Yevamot (Levirate Marriages)', noteBook: 'MishYevamot', chapters: 16, abbrevs: ['m. Yebam.', 'm. Yeb.'] },
  { slug: 'm-temurah', name: 'm. Temurah (Substitution)', noteBook: 'MishTemurah', chapters: 7, abbrevs: ['m. Temurah'] },
  { slug: 'm-negaim', name: 'm. Negaim (Leprosy Signs)', noteBook: 'MishNegaim', chapters: 14, abbrevs: ['m. Neg.'] },
  { slug: 'm-bava-batra', name: 'm. Bava Batra (The Last Gate)', noteBook: 'MishBavaBatra', chapters: 10, abbrevs: ['m. B. Bat.'] },
  { slug: 'm-terumot', name: 'm. Terumot (Heave Offerings)', noteBook: 'MishTerumot', chapters: 11, abbrevs: ['m. Terumot'] },
  { slug: 'm-demai', name: 'm. Demai (Doubtfully Tithed Produce)', noteBook: 'MishDemai', chapters: 7, abbrevs: ['m. Demai'] },
  { slug: 'm-niddah', name: 'm. Niddah (The Menstruant)', noteBook: 'MishNiddah', chapters: 10, abbrevs: ['m. Nid.'] },
  { slug: 'm-yadayim', name: 'm. Yadayim (Hands)', noteBook: 'MishYadayim', chapters: 4, abbrevs: ['m. Yad.'] },
  { slug: 'm-bava-kamma', name: 'm. Bava Kamma (The First Gate)', noteBook: 'MishBavaKamma', chapters: 10, abbrevs: ['m. B. Qam.'] },
  { slug: 'm-bikkurim', name: 'm. Bikkurim (First Fruits)', noteBook: 'MishBikkurim', chapters: 4, abbrevs: ['m. Bik.'] },
  { slug: 'm-sotah', name: 'm. Sotah (The Suspected Adulteress)', noteBook: 'MishSotah', chapters: 9, abbrevs: ['m. Soṭah'] },
  { slug: 'm-chullin', name: 'm. Chullin (Non-Consecrated Animals)', noteBook: 'MishChullin', chapters: 12, abbrevs: ['m. Ḥul.'] },
  { slug: 'm-avot', name: 'm. Avot (Ethics of the Fathers)', noteBook: 'MishAvot', chapters: 6, abbrevs: ['m. ʾAbot', 'm. Abot'] },
  { slug: 'm-gittin', name: 'm. Gittin (Bills of Divorce)', noteBook: 'MishGittin', chapters: 9, abbrevs: ['m. Giṭ.'] },
  { slug: 'm-taanit', name: 'm. Taanit (Fasts)', noteBook: 'MishTaanit', chapters: 4, abbrevs: ['m. Taʿan.'] },
  { slug: 'm-eduyot', name: 'm. Eduyot (Testimonies)', noteBook: 'MishEduyot', chapters: 8, abbrevs: ['m. ʿEd.'] },
  { slug: 'm-pesachim', name: 'm. Pesachim (Passover)', noteBook: 'MishPesachim', chapters: 10, abbrevs: ['m. Pesaḥ.'] },
  { slug: 'm-eruvin', name: 'm. Eruvin (Sabbath Boundaries)', noteBook: 'MishEruvin', chapters: 10, abbrevs: ['m. ʿErub.'] },
  { slug: 'm-shabbat', name: 'm. Shabbat (Sabbath)', noteBook: 'MishShabbat', chapters: 24, abbrevs: ['m. Šabb.'] },
  { slug: 'm-tahorot', name: 'm. Tahorot (Purities)', noteBook: 'MishTahorot', chapters: 10, abbrevs: ['m. Ṭohor.'] },
  { slug: 'm-chagigah', name: 'm. Chagigah (The Festival Offering)', noteBook: 'MishChagigah', chapters: 3, abbrevs: ['m. Ḥag.'] },
  { slug: 'm-peah', name: 'm. Peah (Corner of the Field)', noteBook: 'MishPeah', chapters: 8, abbrevs: ['m. Peʾah'] },
  { slug: 'm-beitzah', name: 'm. Beitzah (The Egg)', noteBook: 'MishBeitzah', chapters: 5, abbrevs: ['m. Beṣah'] },
  { slug: 'm-shevuot', name: 'm. Shevuot (Oaths)', noteBook: 'MishShevuot', chapters: 8, abbrevs: ['m. Šebu.'] },
  { slug: 'm-zevachim', name: 'm. Zevachim (Animal Sacrifices)', noteBook: 'MishZevachim', chapters: 14, abbrevs: ['m. Zebaḥ.'] },
  { slug: 'm-sheviit', name: 'm. Sheviit (The Sabbatical Year)', noteBook: 'MishSheviit', chapters: 10, abbrevs: ['m. Šeb.'] },
  { slug: 'm-shekalim', name: 'm. Shekalim (Shekels)', noteBook: 'MishShekalim', chapters: 8, abbrevs: ['m. Šeqal.'] },
  { slug: 'm-bava-metzia', name: 'm. Bava Metzia (The Middle Gate)', noteBook: 'MishBavaMetzia', chapters: 10, abbrevs: ['m. B. Meṣiʿa'] },
  { slug: 'm-moed-katan', name: 'm. Moed Katan (The Minor Festival)', noteBook: 'MishMoedKatan', chapters: 3, abbrevs: ['m. Moʾed Qaṭ.'] },
  { slug: 'm-avodah-zarah', name: 'm. Avodah Zarah (Idolatry)', noteBook: 'MishAvodahZarah', chapters: 5, abbrevs: ['m. ʿAbod. Zar.'] },
]

const MISHNAH_WORKS: ProseWork[] = MISHNAH.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/mishnah/${w.slug.replace(/^m-/, '')}.json`,
  chapters: w.chapters,
  attribution: MISHNAH_ATTRIBUTION,
  parseCitation: mishnahCite(w.abbrevs),
}))

// Ids/names the catalog needs to list the Mishnah tractates under one Texts category.
export const MISHNAH_CATALOG = MISHNAH.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters,
}))

// ── Greco-Roman (Perseus) ─────────────────────────────────────────────────────────────
// Epictetus — the Discourses (one work per book) and the Enchiridion — from the Perseus
// Digital Library's canonical TEI editions, which carry the standard citation numbering
// ("Epictetus 1.14.12", "Epictetus, Ench. 33.7"). Both the Greek and George Long's English
// are stored (the Greek per verse), so the reader shows them side by side. Perseus divides
// the English to chapter only, so citations resolve at the chapter level. Built by
// scripts/build-perseus.py.
const EPICTETUS_ATTRIBUTION = 'Text: Epictetus, tr. George Long (1877); Greek ed. Schenkl. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'
const DIOGENES_ATTRIBUTION = 'Text: Diogenes Laertius, Lives of Eminent Philosophers, tr. R. D. Hicks (1925). Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

// Discourses, book B: "Epictetus 1.14.12" (also written "Epictetus, Diatr. 1.14.12") →
// chapter 14 (the section is dropped).
const epictetusDiscCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp(`^Epictetus(?:,?\\s*Diatr\\.)?\\s+${book}\\.(\\d+)`))
  return m ? { chapter: parseInt(m[1], 10) } : null
}
// Enchiridion: "Epictetus, Ench. 33.7" / "Epictetus Ench. 26" → chapter.
const epictetusEnchCite = (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(/^Epictetus,?\s*Ench\.\s+(\d+)/)
  return m ? { chapter: parseInt(m[1], 10) } : null
}
// Diogenes Laertius: chapter = book, verse = section (which runs continuously through a book).
// Handles both "7.87" (book.section) and the redundant three-part "7.1.135" (→ 7:135), and
// the "Vit. phil." style. Both the Greek and Hicks' English divide to section, so it opens
// verse-precise.
const diogenesCite = (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(/^Diogenes Laertius(?:, Vit\. phil\.)?\s+(\d+(?:\.\d+)+)/)
  if (!m) return null
  const p = m[1].split('.').map(n => parseInt(n, 10))
  return { chapter: p[0], verse: p[p.length - 1] }
}

const GRECO: { slug: string; name: string; noteBook: string; chapters: number; attribution: string; parseCitation: ProseWork['parseCitation'] }[] = [
  { slug: 'greco-epictetus-discourses-1', name: 'Epictetus, Discourses 1', noteBook: 'EpictDisc1', chapters: 30, attribution: EPICTETUS_ATTRIBUTION, parseCitation: epictetusDiscCite(1) },
  { slug: 'greco-epictetus-discourses-2', name: 'Epictetus, Discourses 2', noteBook: 'EpictDisc2', chapters: 26, attribution: EPICTETUS_ATTRIBUTION, parseCitation: epictetusDiscCite(2) },
  { slug: 'greco-epictetus-discourses-3', name: 'Epictetus, Discourses 3', noteBook: 'EpictDisc3', chapters: 26, attribution: EPICTETUS_ATTRIBUTION, parseCitation: epictetusDiscCite(3) },
  { slug: 'greco-epictetus-discourses-4', name: 'Epictetus, Discourses 4', noteBook: 'EpictDisc4', chapters: 13, attribution: EPICTETUS_ATTRIBUTION, parseCitation: epictetusDiscCite(4) },
  { slug: 'greco-epictetus-enchiridion', name: 'Epictetus, Enchiridion', noteBook: 'EpictEnch', chapters: 53, attribution: EPICTETUS_ATTRIBUTION, parseCitation: epictetusEnchCite },
  { slug: 'greco-diogenes-laertius', name: 'Diogenes Laertius, Lives of the Philosophers', noteBook: 'DiogLaert', chapters: 10, attribution: DIOGENES_ATTRIBUTION, parseCitation: diogenesCite },
]

const GRECO_WORKS: ProseWork[] = GRECO.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/greco/${w.slug.replace(/^greco-/, '')}.json`,
  chapters: w.chapters,
  attribution: w.attribution,
  parseCitation: w.parseCitation,
}))

// Ids/names the catalog needs; `greek: true` tells the reader to show the parallel Greek.
export const GRECO_CATALOG = GRECO.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters, greek: true,
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
  // The Letter of Aristeas is one continuous letter (§§1–322), stored as a single chapter, so a
  // bare section reference maps to that verse of chapter 1. The dataset cites it several ways —
  // "Let. Aris. 207", "Ep. Arist. 305", "Arist. 96" — so accept the "Aris(t)." stem with either
  // a "Let." or "Ep." prefix.
  { source: 'aristeas', name: 'Letter of Aristeas', noteBook: 'Aristeas', dataUrl: '/data/pseudepigrapha/aristeas.json', chapters: 1,
    attribution: 'Text: H. T. Andrews’ translation of the Letter of Aristeas, 1913 (public domain). The work is a single run of numbered sections, shown here as one chapter.',
    parseCitation: (text: string) => {
      const m = text.match(/^(?:Ep\.\s*|Let\.\s*)?Aris(?:t(?:eas)?)?\.?\s+(\d+)/)
      return m ? { chapter: 1, verse: parseInt(m[1], 10) } : null
    } },
  // ── Pseudepigrapha "Group B": public-domain works added from clean HTML editions
  //    (scripts/build-pseudepigrapha-b.py). See texts-catalog.ts. ──
  { source: 'pseudo-philo', name: 'Pseudo-Philo, Biblical Antiquities (L.A.B.)', noteBook: 'PseudoPhilo',
    dataUrl: '/data/pseudepigrapha-b/pseudo-philo.json', chapters: 65,
    attribution: 'Text: M. R. James’ translation of Pseudo-Philo, “The Biblical Antiquities of Philo”, 1917 (public domain). Source: sacred-texts.com.',
    parseCitation: cite(/^L\.A\.B\.\s+(\d+)(?::(\d+))?/) },
  { source: 'odes-of-solomon', name: 'Odes of Solomon', noteBook: 'OdesSol',
    dataUrl: '/data/pseudepigrapha-b/odes-of-solomon.json', chapters: 42,
    attribution: 'Text: J. Rendel Harris’ translation of the Odes of Solomon, from “The Forgotten Books of Eden”, 1926 (public domain). Source: sacred-texts.com.',
    parseCitation: cite(/^Odes? Sol\.\s+(\d+)(?::(\d+))?/) },
  { source: 'ascension-of-isaiah', name: 'Ascension of Isaiah (with the Martyrdom of Isaiah)', noteBook: 'AscenIsa',
    dataUrl: '/data/pseudepigrapha-b/ascension-of-isaiah.json', chapters: 11,
    // Cited as "Mart. Isa. 5:2" (the Martyrdom of Isaiah = chapters 1–5) or "Asc. Isa.".
    attribution: 'Text: R. H. Charles’ translation of the Ascension of Isaiah, 1900 (public domain). Source: earlychristianwritings.com.',
    parseCitation: cite(/^(?:Mart\.|Asc\.)\s*Isa\.\s+(\d+)(?::(\d+))?/) },
  ...TWELVE_PATRIARCHS_WORKS,
  ...PHILO_WORKS,
  ...AF_WORKS,
  ...TG_WORKS,
  ...ANF_WORKS,
  ...JUSTIN_WORKS,
  ...MISHNAH_WORKS,
  ...GRECO_WORKS,
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
// `greek` is present on parallel-text works (e.g. the Perseus Greco-Roman texts), carrying
// the original Greek alongside the English `text` for side-by-side display.
export interface ProseVerse { number: number; text: string; greek?: string }
export interface ProseChapter { number: number; verses: ProseVerse[] }
export interface ProseDoc { work: string; attribution: string; greek?: boolean; chapters: ProseChapter[] }
