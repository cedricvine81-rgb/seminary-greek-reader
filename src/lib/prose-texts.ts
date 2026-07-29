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
  // Traditional reference for a chapter, shown in the reader's chapter headings — for works
  // whose chapters carry a second, structural numbering (Hermas: "Vision 3.6" for chapter 14).
  chapterLabel?: (chapter: number) => string
}

// The `tp-<slug>` members are the twelve Testaments of the Twelve Patriarchs, the
// `philo-<slug>` members are Philo of Alexandria's treatises, the `af-<slug>` members are
// the Apostolic Fathers, and the `tg-<slug>` members are the Targums (see below).
export type EmbeddedProseSource = '2esdras' | '1enoch' | 'jubilees' | '2baruch' | '2enoch' | 'apocmoses' | 'lae' | '3baruch' | 'tjob-greek' | 'josaseneth' | 'aristeas' | 'sibylline' | 'sibylline-greek' | 'pseudo-philo' | 'odes-of-solomon' | 'ascension-of-isaiah' | 'protevangelium' | 'gospel-of-peter' | 'paul-and-thecla' | 'nt-pagan-sources' | 'marcus-aurelius-meditations' | 'philostratus-apollonius' | 'dio-chrysostom-orations' | 'aratus-phaenomena' | 'theon-progymnasmata' | `tp-${string}` | `philo-${string}` | `af-${string}` | `tg-${string}` | `anf-${string}` | `m-${string}` | `justin-${string}` | `greco-${string}` | `eusebius-${string}` | `plato-${string}` | `aristotle-${string}` | `plutarch-${string}` | `apollodorus-${string}` | `lucian-${string}` | `xenophon-${string}` | `quintilian-${string}` | 'homer-iliad' | 'homer-odyssey' | 'hesiod-theogony' | 'hesiod-works-and-days' | 'hesiod-shield' | `herodotus-histories-${string}`

/** The Testament of Job carries the cited numbering natively — the 53-chapter division of
 *  M. R. James, followed by Brock and Charlesworth — so citations resolve straight through:
 *  no mapping, every chapter 1-53 reachable, and the verse honoured, since manuscript P's
 *  verse numbers are the ones scholarship cites.
 *
 *  (We used to ship Kohler's 1897 English alongside it, in an incompatible 12-chapter
 *  division. Citations had to be mapped onto it by hand, chapter-level only, and 46 of the
 *  53 chapters had no mapping at all. It was retired once this edition was complete.) */
const tjobGreekCitation = (text: string): { chapter: number; verse?: number } | null => {
  const m = text.match(/^T\. Job\.?\s+(\d+)(?::(\d+))?/)
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

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
// All twelve carry chapter-level parallel Greek (scripts/build-testaments-greek.py).
export const TWELVE_PATRIARCHS_CATALOG = TWELVE_PATRIARCHS.map(t => ({
  id: `tp-${t.slug}`, source: `tp-${t.slug}` as EmbeddedProseSource, name: `Testament of ${t.name}`, chapters: t.chapters,
  greek: true,
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
  // Books I-III only — see the attribution: Book IV survives just in Armenian and its
  // sole English (Marcus, Loeb Supplement I, 1953) is in copyright.
  { slug: 'qg', name: 'Questions and Answers on Genesis', noteBook: 'PhiloQG', chapters: 3, multi: true, abbrevs: ['QG'] },
  { slug: 'world', name: 'On the World (Appendix)', noteBook: 'PhiloWorld', chapters: 1, multi: false, abbrevs: ['On the World'] },
  { slug: 'fragments', name: 'Fragments (Appendix)', noteBook: 'PhiloFrag', chapters: 1, multi: false, abbrevs: [] },
]

const PHILO_QG_NOTE = ' Yonge renders only Books I-III of the Questions and Answers on Genesis; Book IV (on Genesis 18-28) is not included here, because the work survives complete only in Armenian and the sole full English — Ralph Marcus, Loeb Classical Library Supplement I (1953) — is in copyright.'
const PHILO_WORKS: ProseWork[] = PHILO.map(p => ({
  source: `philo-${p.slug}` as EmbeddedProseSource,
  name: p.name,
  noteBook: p.noteBook,
  dataUrl: `/data/philo/${p.slug}.json`,
  chapters: p.chapters,
  // The reader shows THIS string (TextsReader reads prose.attribution), so a limit on what
  // we hold has to be stated here, not only in the data file.
  attribution: PHILO_ATTRIBUTION + (p.slug === 'qg' ? PHILO_QG_NOTE : ''),
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

// ── The Shepherd of Hermas ────────────────────────────────────────────────────────────
// One work, chapters 1–114 (the continuous Whittaker/Joly numbering modern editions cite),
// with the traditional Vision/Mandate/Similitude reference carried as each chapter's label.
// Built by scripts/build-hermas.py (Lightfoot English + First1KGreek parallel Greek).
// Chapters per Vision / Mandate / Similitude — Visions are chapters 1–25, Mandates 26–49,
// Similitudes 50–114. Both citation styles resolve: "Herm. Vis. 2.1.3" and "Herm. 78.9".
const HERMAS_VIS = [4, 4, 13, 3, 1]
const HERMAS_MAND = [1, 1, 1, 4, 2, 2, 1, 1, 1, 3, 1, 6]
const HERMAS_SIM = [1, 1, 1, 1, 7, 5, 1, 11, 33, 4]
const HERMAS_GROUPS: [string, RegExp, number, number[]][] = [
  ['Vision', /^Vis/, 0, HERMAS_VIS],
  ['Mandate', /^Mand/, 25, HERMAS_MAND],
  ['Similitude', /^Sim/, 49, HERMAS_SIM],
]

const hermasLabel = (chapter: number): string => {
  let n = chapter
  for (const [name, , , counts] of HERMAS_GROUPS) {
    for (let u = 0; u < counts.length; u++) {
      if (n <= counts[u]) {
        const ref = counts[u] === 1 ? `${name} ${u + 1}` : `${name} ${u + 1}.${n}`
        return `${ref} · Ch. ${chapter}`   // both the traditional ref and the continuous chapter
      }
      n -= counts[u]
    }
  }
  return `Chapter ${chapter}`
}

// "Herm. Vis. 2.1.3" → Vision 2 ch. 1 v. 3 (continuous ch. 5); "Herm. Mand. 9.3" → the
// single-chapter Mandate 9, verse 3; "Herm. Sim. 9.12" → Similitude 9 ch. 12; a bare
// "Herm. 78.9" is already the continuous numbering. Ranges keep their start.
const hermasCite = (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(/^Herm(?:as)?\.?,?\s+(?:(Vis|Mand|Sim)(?:\.|[a-z]*\.?)\s+)?(\d+)(?:[.:](\d+))?(?:[.:](\d+))?/)
  if (!m) return null
  const [, kind, a, b, c] = m
  const unit = parseInt(a, 10)
  const sub = b ? parseInt(b, 10) : undefined
  const verse = c ? parseInt(c, 10) : undefined
  if (!kind) return { chapter: unit, verse: sub }              // continuous "Herm. 78.9"
  const group = HERMAS_GROUPS.find(([, re]) => re.test(kind))
  if (!group) return null
  const [, , base, counts] = group
  if (unit < 1 || unit > counts.length) return null
  const start = base + counts.slice(0, unit - 1).reduce((x, y) => x + y, 0)
  if (counts[unit - 1] === 1) return { chapter: start + 1, verse: sub }   // "Mand. 9.3"
  if (sub == null || sub > counts[unit - 1]) return { chapter: start + 1 }
  return { chapter: start + sub, verse }
}

const HERMAS_WORK: ProseWork = {
  source: 'af-hermas',
  name: 'The Shepherd of Hermas',
  noteBook: 'AFHerm',
  dataUrl: '/data/apostolic-fathers/hermas.json',
  chapters: 114,
  attribution: 'Text: J. B. Lightfoot’s translation of the Shepherd of Hermas (1891), public domain. Greek: First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0. Chapters follow the continuous 1–114 numbering; the traditional Vision/Mandate/Similitude reference heads each chapter.',
  parseCitation: hermasCite,
  chapterLabel: hermasLabel,
}

// The Didache and Diognetus carry parallel Greek at CHAPTER level (their Lightfoot English is
// versified more finely than the Greek's sections, so each chapter is a single parallel row);
// a citation therefore resolves to the chapter, dropping any verse.
const AF_CHAPTER_LEVEL = new Set(['didache', 'diognetus'])

const AF_WORKS: ProseWork[] = [
  ...AF.map(w => ({
    source: `af-${w.slug}` as EmbeddedProseSource,
    name: w.name,
    noteBook: w.noteBook,
    dataUrl: `/data/apostolic-fathers/${w.slug}.json`,
    chapters: w.chapters,
    attribution: AF_ATTRIBUTION,
    parseCitation: AF_CHAPTER_LEVEL.has(w.slug)
      ? (text: string) => { const r = afCite(w.abbrevs)(text); return r ? { chapter: r.chapter } : null }
      : afCite(w.abbrevs),
  })),
  HERMAS_WORK,
]

// Works carrying parallel Greek: the Ignatian letters, 1/2 Clement, Barnabas and Polycarp from
// scripts/build-apostolic-fathers-greek.py, plus the Martyrdom of Polycarp (section-level), the
// Didache and Diognetus (chapter-level) from scripts/build-af-remaining-greek.py.
const AF_GREEK = new Set([
  '1clement', '2clement', 'barnabas', 'polycarp',
  'ign-ephesians', 'ign-magnesians', 'ign-trallians', 'ign-romans',
  'ign-philadelphians', 'ign-smyrnaeans', 'ign-polycarp',
  'mart-polycarp', 'didache', 'diognetus',
])

// Ids/names the catalog needs to list the Apostolic Fathers under one Texts category.
export const AF_CATALOG = [
  ...AF.map(w => ({
    id: `af-${w.slug}`, source: `af-${w.slug}` as EmbeddedProseSource, name: w.name, chapters: w.chapters,
    ...(AF_GREEK.has(w.slug) ? { greek: true } : {}),
  })),
  { id: 'af-hermas', source: 'af-hermas' as EmbeddedProseSource, name: 'The Shepherd of Hermas', chapters: 114, greek: true },
]

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

// All three Justin works carry parallel Greek (First1KGreek / Perseus) via
// scripts/build-justin-greek.py — every chapter is covered: a single-verse chapter is a
// clean whole-chapter parallel, and a chapter our English splits into paragraph-verses
// shows the whole Greek chapter beside its opening paragraph (the Josephus pattern).
const JUSTIN_GREEK = new Set(['justin-1apology', 'justin-2apology', 'justin-dialogue'])

export const JUSTIN_CATALOG = JUSTIN.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters,
  ...(JUSTIN_GREEK.has(w.slug) ? { greek: true } : {}),
}))

// ── Eusebius, Ecclesiastical History ──────────────────────────────────────────────────
// Schwartz's Greek (section-precise) with Lake & Oulton's public-domain English, both from
// First1KGreek (CC BY-SA 4.0). One work per book (10 books), chapters → sections; the Greek
// rides every section, the English (chapter-level) on the first. Built by
// scripts/build-eusebius.py. Cited "Eusebius, Hist. eccl. <book>.<chapter>.<section>"; the
// book's work resolves it at chapter (+section) precision. Books 2, 5, 7, 8 open with a
// preface, stored as chapter 0 — hence the per-book chapterNumbers below.
const EUSEBIUS_ATTRIBUTION = 'Greek: Eusebius, Historia Ecclesiastica, ed. E. Schwartz (GCS), via the First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0. English: A. C. McGiffert, Nicene and Post-Nicene Fathers, second series, vol. 1 (1890), public domain, via CCEL — numbered by the standard book.chapter.section divisions, so "Hist. eccl. 3.39.15" resolves to the section.'

// book → last chapter number and whether it opens with a preface (chapter 0). From the build.
const EUSEBIUS_BOOKS: { book: number; last: number; preface: boolean }[] = [
  { book: 1, last: 13, preface: false },
  { book: 2, last: 26, preface: true },
  { book: 3, last: 39, preface: false },
  { book: 4, last: 30, preface: false },
  { book: 5, last: 28, preface: true },
  { book: 6, last: 46, preface: false },
  { book: 7, last: 32, preface: true },
  { book: 8, last: 17, preface: true },
  { book: 9, last: 11, preface: false },
  { book: 10, last: 9, preface: false },
]

const eusebiusChapterNumbers = (b: { last: number; preface: boolean }): number[] =>
  Array.from({ length: b.last - (b.preface ? 0 : 1) + 1 }, (_, i) => (b.preface ? 0 : 1) + i)

// "Eusebius, Hist. eccl. 3.39.15" → book 3, chapter 39, section 15 — the section is the row,
// so the citation lands on the sentence it names rather than a chapter of several thousand
// characters. Where Schwartz's Greek and McGiffert's English divide a chapter differently the
// build leaves it as one row (see scripts/build-eusebius-npnf.py); the reader then falls back
// to the nearest preceding row, so such a citation still opens the chapter. Only Hist. eccl.
// matches (not Praep. ev. or other Eusebian works).
const eusebiusCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp(`^Eusebius,\\s*Hist\\. eccl\\.\\s+${book}\\.(\\d+)(?:\\.(\\d+))?`))
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

const EUSEBIUS_WORKS: ProseWork[] = EUSEBIUS_BOOKS.map(b => ({
  source: `eusebius-he-${b.book}` as EmbeddedProseSource,
  name: `Eusebius, Ecclesiastical History (Book ${b.book})`,
  noteBook: `EusebHE${b.book}`,
  dataUrl: `/data/eusebius/he-${b.book}.json`,
  chapters: b.last + (b.preface ? 1 : 0),
  attribution: EUSEBIUS_ATTRIBUTION,
  parseCitation: eusebiusCite(b.book),
  chapterLabel: (ch: number) => (ch === 0 ? 'Preface' : `Chapter ${ch}`),
}))

// Ids/names the catalog needs; preface books declare chapterNumbers so the reader queues ch. 0.
export const EUSEBIUS_CATALOG = EUSEBIUS_BOOKS.map(b => ({
  id: `eusebius-he-${b.book}`,
  source: `eusebius-he-${b.book}` as EmbeddedProseSource,
  name: `Eusebius, Ecclesiastical History (Book ${b.book})`,
  chapters: b.last + (b.preface ? 1 : 0),
  greek: true,
  ...(b.preface ? { chapterNumbers: eusebiusChapterNumbers(b) } : {}),
}))

// ── Quintilian, Institutio Oratoria (Latin + English) ─────────────────────────────────
// The great Roman handbook of rhetorical education (c. 95 CE) — background to the rhetoric of
// the NT epistles. LATIN, not Greek: no parsing pane (the app has no Latin morphology), and
// primaryLabel names the first column "Latin". Butler's Latin + the Rev. J. S. Watson's
// public-domain English (1856), paired at CHAPTER level — the two editions subdivide their
// sections differently, so a whole English chapter sits beside the whole Latin chapter (section
// numbers kept inline in the Latin). One work per book. Built by scripts/build-quintilian.py.
const QUINTILIAN_ATTRIBUTION = 'Latin: Quintilian, Institutio Oratoria, ed. H. E. Butler. English: the Rev. John Selby Watson (1856), public domain. Digital edition: Perseus Digital Library, CC BY-SA 3.0.'
// book → first chapter (0 when it opens with a preface) and last chapter. From the build.
const QUINTILIAN_BOOKS: { book: number; first: number; last: number }[] = [
  { book: 1, first: 0, last: 12 }, { book: 2, first: 1, last: 21 }, { book: 3, first: 1, last: 11 },
  { book: 4, first: 0, last: 5 }, { book: 5, first: 0, last: 14 }, { book: 6, first: 0, last: 5 },
  { book: 7, first: 0, last: 10 }, { book: 8, first: 0, last: 6 }, { book: 9, first: 1, last: 4 },
  { book: 10, first: 1, last: 7 }, { book: 11, first: 1, last: 3 }, { book: 12, first: 0, last: 11 },
]

const quintilianChapterNumbers = (b: { first: number; last: number }): number[] =>
  Array.from({ length: b.last - b.first + 1 }, (_, i) => b.first + i)

// "Quintilian, Inst. 10.1.2" → book 10, chapter 1 (section kept inline; chapter-level rows).
const quintilianCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '')
  const m = s.match(new RegExp(`^Quint(?:ilian)?\\.?,?\\s+(?:Inst(?:\\.|itutio)?\\s*(?:Or(?:at)?\\.?\\s*)?)?${book}\\.(\\d+)`))
  return m ? { chapter: parseInt(m[1], 10) } : null
}

const QUINTILIAN_WORKS: ProseWork[] = QUINTILIAN_BOOKS.map(b => ({
  source: `quintilian-${b.book}` as EmbeddedProseSource,
  name: `Quintilian, Institutio Oratoria (Book ${b.book})`,
  noteBook: `QuintInst${b.book}`,
  dataUrl: `/data/quintilian/inst-${b.book}.json`,
  chapters: b.last,
  attribution: QUINTILIAN_ATTRIBUTION,
  parseCitation: quintilianCite(b.book),
  chapterLabel: (ch: number) => (ch === 0 ? 'Preface' : `Chapter ${ch}`),
}))

export const QUINTILIAN_CATALOG = QUINTILIAN_BOOKS.map(b => ({
  id: `quintilian-${b.book}`,
  source: `quintilian-${b.book}` as EmbeddedProseSource,
  name: `Quintilian, Institutio Oratoria (Book ${b.book})`,
  chapters: b.last,
  greek: true,
  primaryLabel: 'Latin',
  ...(b.first === 0 ? { chapterNumbers: quintilianChapterNumbers(b) } : {}),
}))

// ── Homer, Hesiod, Herodotus ──────────────────────────────────────────────────────────
// The foundational Greek epics, didactic poetry, and history. Built by scripts/build-perseus.py
// (build_line_parallel for the poetry, build_bcs for Herodotus). Homer/Hesiod are line-addressed
// (verse = poem line, the Greek line-by-line with the public-domain English chunked beside it);
// Herodotus is book→chapter→section prose, one work per book.
const HOMER_ATTRIB = 'Greek: Homer, ed. D. B. Monro & T. W. Allen (OCT). English: A. T. Murray (Loeb, 1919–1925), public domain — the prose is given per card (a group of lines) beside the Greek. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'
const HESIOD_ATTRIB = 'Greek: Hesiod (Perseus). English: Hugh G. Evelyn-White (Loeb, 1914), public domain, given per ~5-line group beside the Greek; cited by line. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'
const HERODOTUS_ATTRIB = 'Text: Herodotus, The Histories, tr. A. D. Godley (Loeb, 1920–1925), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

// "Il. 1.1" / "Od. 1.1" → book (chapter), line (verse).
const homerCite = (abbr: string) => (text: string): { chapter: number; verse: number } | null => {
  const m = text.replace(/^cf\.\s*/, '').match(new RegExp(`^(?:Homer,?\\s*)?${abbr}\\.?\\s+(\\d+)\\.(\\d+)`))
  return m ? { chapter: parseInt(m[1], 10), verse: parseInt(m[2], 10) } : null
}

const HOMER_WORKS: ProseWork[] = [
  { source: 'homer-iliad', name: 'Homer, Iliad', noteBook: 'HomIl', dataUrl: '/data/greco/homer-iliad.json',
    chapters: 24, attribution: HOMER_ATTRIB, parseCitation: homerCite('Il'), chapterLabel: (ch: number) => `Book ${ch}` },
  { source: 'homer-odyssey', name: 'Homer, Odyssey', noteBook: 'HomOd', dataUrl: '/data/greco/homer-odyssey.json',
    chapters: 24, attribution: HOMER_ATTRIB, parseCitation: homerCite('Od'), chapterLabel: (ch: number) => `Book ${ch}` },
]

// A Hesiod poem addressed by line, chunked into 150-line chapters (the Aratus model, with English).
const HESIOD_CHUNK = 150
function hesiodWork(source: EmbeddedProseSource, name: string, noteBook: string, slug: string, lineCount: number, abbr: string): ProseWork {
  return {
    source, name, noteBook, dataUrl: `/data/greco/${slug}.json`,
    chapters: Math.ceil(lineCount / HESIOD_CHUNK), attribution: HESIOD_ATTRIB,
    parseCitation: (text: string) => {
      const m = text.replace(/^cf\.\s*/, '').match(new RegExp(`^(?:Hesiod,?\\s*)?${abbr}\\.?\\s+(\\d+)`))
      if (!m) return null
      const line = parseInt(m[1], 10)
      return { chapter: Math.ceil(line / HESIOD_CHUNK), verse: line }
    },
    chapterLabel: (ch: number) => `Lines ${(ch - 1) * HESIOD_CHUNK + 1}–${Math.min(ch * HESIOD_CHUNK, lineCount)}`,
  }
}
const HESIOD_WORKS: ProseWork[] = [
  hesiodWork('hesiod-theogony', 'Hesiod, Theogony', 'HesTh', 'hesiod-theogony', 1022, 'Theog'),
  hesiodWork('hesiod-works-and-days', 'Hesiod, Works and Days', 'HesWD', 'hesiod-works-and-days', 827, 'Op'),
  hesiodWork('hesiod-shield', 'Hesiod, Shield of Heracles', 'HesSh', 'hesiod-shield', 479, 'Sc'),
]

// Herodotus — one work per book (chapter = Herodotus chapter, verse = section). book → last chapter;
// book 8 is missing chapter 140 in the source, so it carries an explicit chapterNumbers list.
const HERODOTUS_BOOKS: { book: number; last: number; skip?: number[] }[] = [
  { book: 1, last: 216 }, { book: 2, last: 182 }, { book: 3, last: 160 }, { book: 4, last: 205 },
  // 8.140 is no longer skipped: it is printed only as 140A/140B, which the Perseus reader
  // used to discard along with every other lettered chapter (see scripts/build-perseus.py).
  { book: 5, last: 126 }, { book: 6, last: 140 }, { book: 7, last: 239 }, { book: 8, last: 144 },
  { book: 9, last: 122 },
]
const herodotusCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  // Evans writes "Herodotus, Hist. 1.141"; also accept "Hdt. 1.141" / "Herodotus 6.86". The
  // optional "Hist./Historiae/Histories" between the author and the book.chapter must be allowed.
  const m = text.replace(/^cf\.\s*/, '').match(new RegExp(`^(?:Hdt\\.|Herodotus,?)\\s+(?:Hist(?:oriae|ories|\\.)?\\s+)?${book}\\.(\\d+)(?:\\.(\\d+))?`))
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}
const HERODOTUS_WORKS: ProseWork[] = HERODOTUS_BOOKS.map(b => ({
  source: `herodotus-histories-${b.book}` as EmbeddedProseSource,
  name: `Herodotus, The Histories (Book ${b.book})`,
  noteBook: `HdtHist${b.book}`,
  dataUrl: `/data/greco/herodotus-histories-${b.book}.json`,
  chapters: b.last,
  attribution: HERODOTUS_ATTRIB,
  parseCitation: herodotusCite(b.book),
  chapterLabel: (ch: number) => `Chapter ${ch}`,
}))

// Catalog ids/names, with the book-8 gap declared so the reader doesn't stall on chapter 140.
export const HOMER_CATALOG = HOMER_WORKS.map(w => ({ id: w.source, source: w.source, name: w.name, chapters: 24, greek: true }))
export const HESIOD_CATALOG = HESIOD_WORKS.map(w => ({ id: w.source, source: w.source, name: w.name, chapters: w.chapters, greek: true }))
export const HERODOTUS_CATALOG = HERODOTUS_BOOKS.map(b => ({
  id: `herodotus-histories-${b.book}`,
  source: `herodotus-histories-${b.book}` as EmbeddedProseSource,
  name: `Herodotus, The Histories (Book ${b.book})`,
  chapters: b.last,
  greek: true,
  ...(b.skip ? { chapterNumbers: Array.from({ length: b.last }, (_, i) => i + 1).filter(n => !b.skip!.includes(n)) } : {}),
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

// ── Plato ─────────────────────────────────────────────────────────────────────────────
// The dialogues, from Perseus's canonical TEI (Greek: Burnet; English: the public-domain Loeb),
// built by scripts/build-perseus.py. Cited by STEPHANUS PAGE (the standard reference), so a
// chapter is a page (172–223 for the Symposium); the reader queues the real page numbers via
// chapterNumbers and heads each with "Stephanus 172". "Plato, Symp. 189DE" → page 189.
const PLATO_ATTRIB = 'Text: the Loeb Classical Library translation (Plato in Twelve Volumes), public domain; Greek: J. Burnet’s edition. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

const platoCite = (abbrevs: string[]) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of abbrevs) {
    const m = s.match(new RegExp('^Plato,?\\s+' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)'))
    if (m) return { chapter: parseInt(m[1], 10) }        // the Stephanus page; letters are dropped
  }
  return null
}

// slug (→ /data/greco/<slug>.json and `plato-…` source), display name, first/last Stephanus
// page (contiguous), note anchor, citation abbreviation(s). Kept in sync with build-perseus.py.
const PLATO: { slug: string; name: string; first: number; last: number; noteBook: string; abbrevs: string[] }[] = [
  { slug: 'plato-symposium', name: 'Plato, Symposium', first: 172, last: 223, noteBook: 'PlatoSymp', abbrevs: ['Symp.'] },
  { slug: 'plato-timaeus', name: 'Plato, Timaeus', first: 17, last: 92, noteBook: 'PlatoTim', abbrevs: ['Ti.', 'Tim.'] },
  { slug: 'plato-apology', name: 'Plato, Apology', first: 17, last: 42, noteBook: 'PlatoApol', abbrevs: ['Apol.'] },
  { slug: 'plato-crito', name: 'Plato, Crito', first: 43, last: 54, noteBook: 'PlatoCrito', abbrevs: ['Cri.', 'Crito'] },
  { slug: 'plato-phaedo', name: 'Plato, Phaedo', first: 57, last: 118, noteBook: 'PlatoPhaedo', abbrevs: ['Phd.', 'Phaedo'] },
  { slug: 'plato-phaedrus', name: 'Plato, Phaedrus', first: 227, last: 279, noteBook: 'PlatoPhaedr', abbrevs: ['Phaedr.', 'Phdr.'] },
  { slug: 'plato-gorgias', name: 'Plato, Gorgias', first: 447, last: 527, noteBook: 'PlatoGorg', abbrevs: ['Gorg.'] },
  { slug: 'plato-protagoras', name: 'Plato, Protagoras', first: 309, last: 362, noteBook: 'PlatoProt', abbrevs: ['Prot.', 'Protag.'] },
]

const platoPages = (w: { first: number; last: number }) =>
  Array.from({ length: w.last - w.first + 1 }, (_, i) => w.first + i)

const PLATO_WORKS: ProseWork[] = PLATO.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/greco/${w.slug}.json`,
  chapters: w.last - w.first + 1,
  attribution: PLATO_ATTRIB,
  parseCitation: platoCite(w.abbrevs),
  chapterLabel: (ch: number) => `Stephanus ${ch}`,
}))

// Ids/names the catalog needs; chapterNumbers carries the real (non-1-based) page numbers.
export const PLATO_CATALOG = PLATO.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name,
  chapters: w.last - w.first + 1, greek: true, chapterNumbers: platoPages(w),
}))

// ── Aristotle ─────────────────────────────────────────────────────────────────────────
// Treatises from Perseus (Greek: Bekker/Perseus; English: the public-domain Loeb, H. Rackham
// et al.), built by scripts/build-perseus.py. The Nicomachean Ethics and Rhetoric are cited
// book.chapter (chapter = book, verse = the section/chapter); the Poetics is cited by chapter.
const ARISTOTLE_ATTRIB = 'Text: the Loeb Classical Library translation (public domain); Greek: the Bekker/Perseus edition. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

// `hasVerse` works are cited "Aristotle, <abbr> <book>.<n>"; the rest just "<abbr> <chapter>".
const aristotleCite = (abbrevs: string[], hasVerse: boolean) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of abbrevs) {
    const m = s.match(new RegExp('^Aristotle,?\\s+' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)(?:\\.(\\d+))?'))
    if (m) return hasVerse ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined }
                           : { chapter: parseInt(m[1], 10) }
  }
  return null
}

// `books` = the top-level division is the treatise's book (labelled "Book N" in the reader);
// the Poetics divides straight to chapter.
const ARISTOTLE: { slug: string; name: string; chapters: number; noteBook: string; abbrevs: string[]; hasVerse: boolean; books: boolean }[] = [
  { slug: 'aristotle-nicomachean-ethics', name: 'Aristotle, Nicomachean Ethics', chapters: 10, noteBook: 'AristNE', abbrevs: ['Eth. nic.', 'Eth. Nic.', 'Ethica'], hasVerse: true, books: true },
  { slug: 'aristotle-rhetoric', name: 'Aristotle, Rhetoric', chapters: 3, noteBook: 'AristRhet', abbrevs: ['Rhet.'], hasVerse: true, books: true },
  { slug: 'aristotle-poetics', name: 'Aristotle, Poetics', chapters: 26, noteBook: 'AristPoet', abbrevs: ['Poet.'], hasVerse: false, books: false },
]

const ARISTOTLE_WORKS: ProseWork[] = ARISTOTLE.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/greco/${w.slug}.json`,
  chapters: w.chapters,
  attribution: ARISTOTLE_ATTRIB,
  parseCitation: aristotleCite(w.abbrevs, w.hasVerse),
  ...(w.books ? { chapterLabel: (ch: number) => `Book ${ch}` } : {}),
}))

export const ARISTOTLE_CATALOG = ARISTOTLE.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters, greek: true,
}))

// ── Plutarch ──────────────────────────────────────────────────────────────────────────
// The Lives (Perrin's public-domain Loeb, chapter→section) and a Moralia essay, On Isis and
// Osiris (Goodwin's 1874 translation, flat sections). Built by scripts/build-perseus.py. Lives
// are cited "Plutarch, Life of Antony 44.2" (chapter.section); the essay by section.
const PLUTARCH_LIVES_ATTRIB = 'Text: Plutarch’s Lives, tr. Bernadotte Perrin (Loeb, 1914–1926), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'
const PLUTARCH_MORALIA_ATTRIB = 'Text: Plutarch’s Morals, tr. William W. Goodwin et al. (1874), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

const plutarchCite = (abbrevs: string[], hasVerse: boolean) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of [...abbrevs].sort((a, b) => b.length - a.length)) {
    // Allow a "Mor. <Stephanus>:" prefix before the work name, as the dataset cites the Moralia
    // ("Plutarch, Mor. 361BC: Is. Os. 26"); the Lives have no such prefix.
    const m = s.match(new RegExp('^Plutarch,?\\s+(?:[^:]*:\\s*)?' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)(?:\\.(\\d+))?'))
    if (m) return hasVerse ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined }
                           : { chapter: parseInt(m[1], 10) }
  }
  return null
}

const PLUTARCH: { slug: string; name: string; chapters: number; noteBook: string; attribution: string; abbrevs: string[]; hasVerse: boolean; label?: (ch: number) => string }[] = [
  { slug: 'plutarch-antony', name: 'Plutarch, Life of Antony', chapters: 87, noteBook: 'PlutAnt', attribution: PLUTARCH_LIVES_ATTRIB, abbrevs: ['Life of Antony', 'Ant.'], hasVerse: true },
  { slug: 'plutarch-alexander', name: 'Plutarch, Life of Alexander', chapters: 77, noteBook: 'PlutAlex', attribution: PLUTARCH_LIVES_ATTRIB, abbrevs: ['Life of Alexander', 'Alex.'], hasVerse: true },
  { slug: 'plutarch-isis-osiris', name: 'Plutarch, On Isis and Osiris', chapters: 80, noteBook: 'PlutIsis', attribution: PLUTARCH_MORALIA_ATTRIB, abbrevs: ['On Isis and Osiris', 'De Iside et Osiride', 'Is. Os.'], hasVerse: false, label: (ch: number) => `Section ${ch}` },
]

const PLUTARCH_WORKS: ProseWork[] = PLUTARCH.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/greco/${w.slug}.json`,
  chapters: w.chapters,
  attribution: w.attribution,
  parseCitation: plutarchCite(w.abbrevs, w.hasVerse),
  ...(w.label ? { chapterLabel: w.label } : {}),
}))

export const PLUTARCH_CATALOG = PLUTARCH.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters, greek: true,
}))

// ── Apollodorus, The Library ──────────────────────────────────────────────────────────
// The mythographic handbook (Frazer's public-domain Loeb), one work per book, chapter →
// section. Built by scripts/build-perseus.py. "Apollodorus, Library 1.9.16" (also "Apollod.
// 1.9.16", "Bibl. 1.9.16") → Book 1, chapter 9, section 16.
const APOLLODORUS_ATTRIB = 'Text: Apollodorus, The Library, tr. Sir James George Frazer (Loeb, 1921), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

const apollodorusCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp(`^Apollod(?:orus,\\s*(?:The\\s+)?Library|orus|\\.|,\\s*Bibl)\\.?\\s+${book}\\.(\\d+)(?:\\.(\\d+))?`))
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

const APOLLODORUS = [
  { book: 1, chapters: 9 }, { book: 2, chapters: 8 }, { book: 3, chapters: 16 },
]

const APOLLODORUS_WORKS: ProseWork[] = APOLLODORUS.map(w => ({
  source: `apollodorus-library-${w.book}` as EmbeddedProseSource,
  name: `Apollodorus, The Library (Book ${w.book})`,
  noteBook: `ApollodLib${w.book}`,
  dataUrl: `/data/greco/apollodorus-library-${w.book}.json`,
  chapters: w.chapters,
  attribution: APOLLODORUS_ATTRIB,
  parseCitation: apollodorusCite(w.book),
}))

export const APOLLODORUS_CATALOG = APOLLODORUS.map(w => ({
  id: `apollodorus-library-${w.book}`, source: `apollodorus-library-${w.book}` as EmbeddedProseSource,
  name: `Apollodorus, The Library (Book ${w.book})`, chapters: w.chapters, greek: true,
}))

// ── Lucian ────────────────────────────────────────────────────────────────────────────
// The two works bearing on early Christianity — The Passing of Peregrinus (a Christian convert)
// and Alexander the False Prophet (a religious charlatan, addressed to Celsus). Fowler's
// public-domain English + Perseus Greek, cited by section ("Lucian, Peregr. 11").
const LUCIAN_ATTRIB = 'Text: The Works of Lucian, tr. H. W. Fowler & F. G. Fowler (Oxford, 1905), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

const lucianCite = (abbrevs: string[]) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  for (const ab of [...abbrevs].sort((a, b) => b.length - a.length)) {
    const m = s.match(new RegExp('^Lucian,?\\s+' + ab.replace(/\./g, '\\.') + '\\s+(\\d+)'))
    if (m) return { chapter: parseInt(m[1], 10) }
  }
  return null
}

const LUCIAN: { slug: string; name: string; chapters: number; noteBook: string; abbrevs: string[] }[] = [
  { slug: 'lucian-peregrinus', name: 'Lucian, The Passing of Peregrinus', chapters: 45, noteBook: 'LucianPeregr', abbrevs: ['Peregr.', 'De mort. Peregr.'] },
  { slug: 'lucian-alexander', name: 'Lucian, Alexander the False Prophet', chapters: 61, noteBook: 'LucianAlex', abbrevs: ['Alex.'] },
]

const LUCIAN_WORKS: ProseWork[] = LUCIAN.map(w => ({
  source: w.slug as EmbeddedProseSource,
  name: w.name,
  noteBook: w.noteBook,
  dataUrl: `/data/greco/${w.slug}.json`,
  chapters: w.chapters,
  attribution: LUCIAN_ATTRIB,
  parseCitation: lucianCite(w.abbrevs),
}))

export const LUCIAN_CATALOG = LUCIAN.map(w => ({
  id: w.slug, source: w.slug as EmbeddedProseSource, name: w.name, chapters: w.chapters, greek: true,
}))

// ── Xenophon, Memorabilia ─────────────────────────────────────────────────────────────
// The Socratic reminiscences (Marchant's public-domain Loeb + Perseus Greek), one work per
// book, chapter → section. "Xen. Mem. 1.2.3" → Book 1, chapter 2, section 3.
const XENOPHON_ATTRIB = 'Text: Xenophon, Memorabilia, tr. E. C. Marchant (Loeb, 1923), public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.'

const xenophonMemCite = (book: number) => (text: string): { chapter: number; verse?: number } | null => {
  const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
  const m = s.match(new RegExp(`^Xen(?:ophon)?\\.?,?\\s+Mem(?:orabilia|\\.)\\s+${book}\\.(\\d+)(?:\\.(\\d+))?`))
  return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : undefined } : null
}

const XENOPHON_MEM = [
  { book: 1, chapters: 7 }, { book: 2, chapters: 10 }, { book: 3, chapters: 14 }, { book: 4, chapters: 8 },
]

const XENOPHON_WORKS: ProseWork[] = XENOPHON_MEM.map(w => ({
  source: `xenophon-memorabilia-${w.book}` as EmbeddedProseSource,
  name: `Xenophon, Memorabilia (Book ${w.book})`,
  noteBook: `XenMem${w.book}`,
  dataUrl: `/data/greco/xenophon-memorabilia-${w.book}.json`,
  chapters: w.chapters,
  attribution: XENOPHON_ATTRIB,
  parseCitation: xenophonMemCite(w.book),
}))

export const XENOPHON_CATALOG = XENOPHON_MEM.map(w => ({
  id: `xenophon-memorabilia-${w.book}`, source: `xenophon-memorabilia-${w.book}` as EmbeddedProseSource,
  name: `Xenophon, Memorabilia (Book ${w.book})`, chapters: w.chapters, greek: true,
}))

// ── Marcus Aurelius, Meditations ──────────────────────────────────────────────────────
// Greek only (the Perseus edition has no aligned English, and English translations divide the
// Meditations on a different chapter scheme than the critical Greek, so pairing by number would
// misalign). chapter = book, verse = the chapter; cited "Marcus Aurelius, Med. 4.3".
const MARCUS_AURELIUS_WORK: ProseWork = {
  source: 'marcus-aurelius-meditations',
  name: 'Marcus Aurelius, Meditations',
  noteBook: 'MarcusMed',
  dataUrl: '/data/greco/marcus-aurelius-meditations.json',
  chapters: 12,
  attribution: 'Greek: Marcus Aurelius, Τὰ εἰς ἑαυτόν (Meditations). Digital edition: Perseus Digital Library, CC-BY-SA 4.0. Greek only — a chapter-aligned English is not yet available (translations use a different chapter division than the critical Greek).',
  parseCitation: (text: string) => {
    const s = text.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '')
    const m = s.match(/^(?:Marcus Aurelius|M\.?\s*Aur(?:elius)?|Aurelius|Marc\. Aur\.)(?:,)?\s+(?:Med(?:itations|\.)?\s+)?(\d+)\.(\d+)/)
    return m ? { chapter: parseInt(m[1], 10), verse: parseInt(m[2], 10) } : null
  },
  chapterLabel: (ch: number) => `Book ${ch}`,
}

// ── Philostratus & Dio Chrysostom (Greek only) ────────────────────────────────────────
// Philostratus, Life of Apollonius of Tyana (chapter = book, "VA 1.4") and Dio Chrysostom's
// Orations (chapter = oration, verse = section, "Or. 12.5") — Greek only on Perseus.
const PHILOSTRATUS_WORK: ProseWork = {
  source: 'philostratus-apollonius',
  name: 'Philostratus, Life of Apollonius of Tyana',
  noteBook: 'PhilostrVA',
  dataUrl: '/data/greco/philostratus-apollonius.json',
  chapters: 8,
  attribution: 'Greek: Philostratus, Life of Apollonius of Tyana. Digital edition: Perseus Digital Library, CC-BY-SA 4.0. Greek only — a chapter-aligned English is not yet available.',
  parseCitation: (text: string) => {
    const m = text.replace(/^cf\.\s*/, '').match(/^Philostratus,?\s+(?:VA|Vit\. Apoll\.|Vita Apoll\.)\s+(\d+)\.(\d+)/)
    return m ? { chapter: parseInt(m[1], 10), verse: parseInt(m[2], 10) } : null
  },
  chapterLabel: (ch: number) => `Book ${ch}`,
}

// The Orations we hold run 1–77 and 79–80 — every discourse of the corpus. 77 and 78 are
// one continuous work, tagged n="77_78" in the Perseus Greek and filed here under 77, so
// there is no separate 78. Perseus also shelves 14–18 (On Slavery & Freedom I–II, On Pain,
// On Covetousness, To Nicomachus) under 84–88; scripts/build-perseus.py corrects that at
// build time via DIO_RELABEL. chapterNumbers carries the real set.
const DIO_ORATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  70, 71, 72, 73, 74, 75, 76, 77, 79, 80]

const DIO_WORK: ProseWork = {
  source: 'dio-chrysostom-orations',
  name: 'Dio Chrysostom, Orations',
  noteBook: 'DioChrys',
  dataUrl: '/data/greco/dio-chrysostom-orations.json',
  chapters: DIO_ORATIONS[DIO_ORATIONS.length - 1],
  // NO English is shipped, and none should be added from the Loeb: Cohoon & Crosby's
  // volumes (1932-1951) are still in copyright in the US. This attribution previously
  // claimed that translation, which the data never contained — a stale claim of exactly
  // the kind that would invite someone to import it.
  attribution: 'Greek: Dio Chrysostom, Orations. Digital edition: Perseus Digital Library, CC-BY-SA 4.0. Greek only.',
  parseCitation: (text: string) => {
    // Evans writes "Dio Chrysostom, Disc. 31.86" (Discourse = Oration); also accept "Or." / bare.
    const m = text.replace(/^cf\.\s*/, '').match(/^Dio(?: Chrysostom| Chrys\.| Cocceianus)?,?\s+(?:(?:Or(?:ationes|\.)?|Disc(?:ourses?|\.)?)\s+)?(\d+)\.(\d+)/)
    if (!m) return null
    // 78 is the second half of the one continuous discourse filed under 77, so a citation to
    // it opens there rather than at an oration that does not exist on its own.
    const ch = parseInt(m[1], 10)
    return { chapter: ch === 78 ? 77 : ch, verse: parseInt(m[2], 10) }
  },
  chapterLabel: (ch: number) => `Oration ${ch}`,
}

// ── Aratus, Phaenomena (Greek only) ───────────────────────────────────────────────────
// The full didactic poem, cited by line. Greek only on Perseus; the 1155 lines are chunked into
// 150-line chapters for loading, each verse keeping its poem line number. "Aratus, Phaen. 5"
// (Acts 17:28) → line 5.
const ARATUS_CHUNK = 150
const ARATUS_LINES = 1155

const ARATUS_WORK: ProseWork = {
  source: 'aratus-phaenomena',
  name: 'Aratus, Phaenomena',
  noteBook: 'AratusPhaen',
  dataUrl: '/data/greco/aratus-phaenomena.json',
  chapters: Math.ceil(ARATUS_LINES / ARATUS_CHUNK),
  attribution: 'Greek: Aratus, Phaenomena. Digital edition: Perseus Digital Library, CC-BY-SA 4.0. Greek only; cited by line (line 5 is quoted at Acts 17:28). The proem with a translation is in the “Pagan Sources Quoted in the New Testament” collection.',
  parseCitation: (text: string) => {
    const m = text.replace(/^cf\.\s*/, '').match(/^Aratus,?\s+(?:Phaen(?:omena|\.)?\s+)?(\d+)/)
    if (!m) return null
    const line = parseInt(m[1], 10)
    return { chapter: Math.ceil(line / ARATUS_CHUNK), verse: line }
  },
  chapterLabel: (ch: number) =>
    `Lines ${(ch - 1) * ARATUS_CHUNK + 1}–${Math.min(ch * ARATUS_CHUNK, ARATUS_LINES)}`,
}

// ── Theon, Progymnasmata (Greek only) ─────────────────────────────────────────────────
// Aelius Theon's handbook of preliminary rhetorical exercises (progymnasmata) — background
// to the composition of the NT epistles and gospels. Greek only (no public-domain English;
// Kennedy 2003 is under copyright). 5 extant chapters (the exercises), each a run of
// paragraphs; cited by chapter.paragraph.
const THEON_TITLES: Record<number, string> = {
  1: 'Proem', 2: 'On the Education of the Young', 3: 'On Fable', 4: 'On Narrative', 5: 'On the Chreia',
}

const THEON_WORK: ProseWork = {
  source: 'theon-progymnasmata',
  name: 'Theon, Progymnasmata',
  noteBook: 'TheonProg',
  dataUrl: '/data/greco/theon-progymnasmata.json',
  chapters: 5,
  attribution: 'Greek: Aelius Theon, Progymnasmata, ed. C. Walz. Digital edition: First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0. Greek only — the modern English (Kennedy, 2003) is under copyright.',
  parseCitation: (text: string) => {
    const m = text.replace(/^cf\.\s*/, '').match(/^Theon,?\s+(?:Progymn?(?:asmata|\.)?\s+)?(\d+)(?:\.(\d+))?/)
    return m ? { chapter: parseInt(m[1], 10), verse: m[2] ? parseInt(m[2], 10) : 1 } : null
  },
  chapterLabel: (ch: number) => THEON_TITLES[ch] ?? `Chapter ${ch}`,
}

// ── Pagan sources quoted in the New Testament ─────────────────────────────────────────
// A curated collection (scripts/build-nt-pagan-sources.py): each chapter is one pagan passage
// the NT quotes, its heading naming the source and the NT reference.
const NT_PAGAN_LABELS = [
  'Aratus, Phaenomena 1–5 · Acts 17:28',
  'Cleanthes, Hymn to Zeus 4 · Acts 17:28',
  'Menander, Thaïs (fr. 165) · 1 Corinthians 15:33',
  'Epimenides, Cretica · Titus 1:12',
]

const NT_PAGAN_WORK: ProseWork = {
  source: 'nt-pagan-sources',
  name: 'Pagan Sources Quoted in the New Testament',
  noteBook: 'NTPagan',
  dataUrl: '/data/greco/nt-pagan-sources.json',
  chapters: NT_PAGAN_LABELS.length,
  attribution: 'A curated collection of Greek passages quoted or alluded to in the New Testament (Aratus, Cleanthes, Menander, Epimenides). Aratus follows the Perseus edition; the others follow the standard critical texts, with the New Testament quotations fixing the wording.',
  parseCitation: () => null,
  chapterLabel: (ch: number) => NT_PAGAN_LABELS[ch - 1] ?? `Source ${ch}`,
}

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
  { source: '2baruch', name: '2 Baruch', noteBook: '2Baruch', dataUrl: '/data/pseudepigrapha/2baruch.json', chapters: 87,
    attribution: '2 Baruch (The Syriac Apocalypse of Baruch), translated by R. H. Charles, public domain. Chapters 1-84 follow the Wesley Center Online text of his 1913 translation, which ends at 85:2; chapters 85-87 are supplied from his 1918 edition (SPCK, Translations of Early Documents), so the seam falls at a chapter break rather than inside one.',
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
  // The Greek of manuscript P with our own English translation (scripts/build-tjob-greek.py),
  // in the 53-chapter division scholarship cites — so "T. Job 39:8" opens that chapter and verse.
  { source: 'tjob-greek', name: 'Testament of Job', noteBook: 'TJob', dataUrl: '/data/pseudepigrapha/tjob-greek.json', chapters: 53,
    attribution: 'Greek: manuscript P (11th century), the oldest Greek witness to the Testament of Job, as transcribed by the Online Critical Pseudepigrapha (public domain); chapter and verse numbering follows the division of M. R. James as used by Brock and Charlesworth. English: our own translation, made for Seminary Greek from this Greek — the standard modern English (Spittler, in Charlesworth, 1983) is under copyright and was not used.',
    parseCitation: tjobGreekCitation },
  { source: 'josaseneth', name: 'Joseph and Aseneth', noteBook: 'JosAsen', dataUrl: '/data/pseudepigrapha/josaseneth.json', chapters: 29,
    // PROVENANCE UNCONFIRMED. The translator is not recorded, and this is NOT E. W. Brooks
    // (1918), the known public-domain English — Brooks has "Pentephres" throughout where
    // this has "Poti-pherah", a word absent from Brooks. The diction is archaic, so it is
    // probably an older rendering, but that has not been established. Verify before relying
    // on it, and see the Apocalypse of Abraham (removed 2026-07-28) for why this matters.
    attribution: 'Text: an English translation of Joseph and Aseneth (29 chapters) whose translator is not recorded; it is not E. W. Brooks (1918). Verse divisions vary between editions, so some scholarly citations resolve at the chapter level only.',
    parseCitation: cite(/^Jos\. Asen\.\s+(\d+)(?::(\d+))?/) },
  // The Sibylline Oracles are stored with each BOOK as a chapter. Terry's marginal line
  // numbers aren't preserved in the source, so a "Sib. Or. 3:636" reference resolves to
  // book 3 (chapter level) — the line number is intentionally dropped to avoid pointing at
  // the wrong line.
  // The Greek original, as its own work. Terry's English verse runs ~1.2x the Greek line
  // count and the ratio varies by book, so the two cannot be paired line-by-line; they are
  // sibling works sharing the same book numbers (1-8, 11-14). See
  // scripts/build-sibylline-greek.py.
  { source: 'sibylline-greek', name: 'Sibylline Oracles (Greek)', noteBook: 'SibyllineGrc',
    dataUrl: '/data/pseudepigrapha/sibylline-greek.json', chapters: 14,
    attribution: 'Greek text of the Sibylline Oracles (ed. Geffcken). Digital edition: First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0. Line numbers are the Greek edition’s and do not match the English translation’s.',
    parseCitation: (text: string) => {
      const m = text.match(/^Sib\. Or\.\s+(\d+)/)
      return m ? { chapter: parseInt(m[1], 10) } : null
    },
  },
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
  // New Testament apocrypha (M. R. James, PD) — English-only; no clean licensed Greek exists.
  { source: 'protevangelium', name: 'The Protevangelium of James', noteBook: 'ProtJas',
    dataUrl: '/data/apocrypha-gospels/protevangelium.json', chapters: 25,
    attribution: 'Text: M. R. James, “The Apocryphal New Testament” (Oxford: Clarendon Press, 1924), public domain. Source: earlychristianwritings.com.',
    parseCitation: cite(/^(?:Prot(?:ev)?\.?\s*Jas\.?|Prot\. Jas\.|Infancy (?:Gospel of )?James)\s+(\d+)(?::(\d+))?/) },
  { source: 'gospel-of-peter', name: 'The Gospel of Peter', noteBook: 'GosPet',
    dataUrl: '/data/apocrypha-gospels/gospel-of-peter.json', chapters: 14,
    attribution: 'Text: M. R. James, “The Apocryphal New Testament” (Oxford: Clarendon Press, 1924), public domain. Source: earlychristianwritings.com. The Akhmim fragment; chapters are Robinson’s sections, verses Harnack’s continuous numbering.',
    // Cited by the continuous Harnack verse number ("Gos. Pet. 24"); resolve it to its chapter.
    parseCitation: (text: string) => {
      const m = text.match(/^Gos(?:pel)?\.?\s*Pet(?:er|\.)?\s+(\d+)/)
      if (!m) return null
      const v = parseInt(m[1], 10)
      const ends = [2, 5, 9, 14, 20, 24, 27, 33, 37, 42, 49, 54, 57, 60]  // last verse of each chapter
      const chapter = ends.findIndex(e => v <= e) + 1
      return { chapter: chapter || 14, verse: v }
    } },
  { source: 'paul-and-thecla', name: 'The Acts of Paul and Thecla', noteBook: 'ActsThecla',
    dataUrl: '/data/apocrypha-gospels/paul-and-thecla.json', chapters: 1,
    attribution: 'Text: M. R. James, “The Apocryphal New Testament” (Oxford: Clarendon Press, 1924), public domain. Source: earlychristianwritings.com. The Thecla episode of the Acts of Paul, verses 1–43.',
    parseCitation: (text: string) => {
      const m = text.match(/^(?:Acts (?:of )?Paul(?: and| &| &amp;)? Thecla|Acts Paul|Thecla)\.?\s+(\d+)/)
      return m ? { chapter: 1, verse: parseInt(m[1], 10) } : null
    } },
  ...TWELVE_PATRIARCHS_WORKS,
  ...PHILO_WORKS,
  ...AF_WORKS,
  ...TG_WORKS,
  ...ANF_WORKS,
  ...JUSTIN_WORKS,
  ...EUSEBIUS_WORKS,
  ...QUINTILIAN_WORKS,
  ...HOMER_WORKS,
  ...HESIOD_WORKS,
  ...HERODOTUS_WORKS,
  ...MISHNAH_WORKS,
  ...GRECO_WORKS,
  ...PLATO_WORKS,
  ...ARISTOTLE_WORKS,
  ...PLUTARCH_WORKS,
  ...APOLLODORUS_WORKS,
  ...LUCIAN_WORKS,
  ...XENOPHON_WORKS,
  MARCUS_AURELIUS_WORK,
  PHILOSTRATUS_WORK,
  DIO_WORK,
  ARATUS_WORK,
  THEON_WORK,
  NT_PAGAN_WORK,
]

// Dio Chrysostom's non-contiguous oration numbers, for the catalog's chapterNumbers.
export const DIO_CHAPTER_NUMBERS = DIO_ORATIONS

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
// `ref` is the standard scholarly reference for the verse when it isn't just the number —
// Plato's Stephanus page+letter ("172a"), Aristotle's Bekker number ("1094a"), a Moralia
// Stephanus page ("351c"). The reader shows it as the verse marker and cites by it.
// `heading` is an editorial section label for a paragraph, shown above it in the reader —
// for works whose source runs as unbroken prose (Theon) and would otherwise be a wall of
// text. Ours, not the ancient author's.
export interface ProseVerse { number: number; ref?: string; text: string; greek?: string; heading?: string }
export interface ProseChapter { number: number; verses: ProseVerse[] }
export interface ProseDoc { work: string; attribution: string; greek?: boolean; chapters: ProseChapter[] }
